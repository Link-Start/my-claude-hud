/**
 * 解析会话记录 JSON，提取工具、Agent 和 Todo 活动
 */

import * as fs from 'node:fs';
import * as readline from 'node:readline';
import type { TranscriptData, ToolEntry, AgentEntry, TodoItem } from './types.js';
import { createDebug } from './debug.js';

const debug = createDebug('transcript');

interface TranscriptEntry {
  timestamp?: string;
  message?: {
    content?: ContentBlock[];
  };
}

interface ContentBlock {
  type: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
}

/**
 * 解析会话记录文件并提取会话活动
 */
export async function parseTranscript(filePath: string): Promise<TranscriptData> {
  const result: TranscriptData = {
    tools: [],
    agents: [],
    todos: [],
  };

  if (!filePath || !fs.existsSync(filePath)) {
    return result;
  }

  const toolMap = new Map<string, ToolEntry>();
  const agentMap = new Map<string, AgentEntry>();
  const todoList: TodoItem[] = [];
  const todoIdMap = new Map<string, number>();

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as TranscriptEntry;
        processEntry(entry, toolMap, agentMap, todoList, todoIdMap, result);
      } catch (error) {
        debug('Failed to parse JSON line', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  } catch (error) {
    debug('Failed to read transcript file', error instanceof Error ? error.message : 'Unknown error');
  }

  // 只保留最近的项目
  result.tools = Array.from(toolMap.values()).slice(-20);
  result.agents = Array.from(agentMap.values()).slice(-10);
  result.todos = todoList;

  return result;
}

function processEntry(
  entry: TranscriptEntry,
  toolMap: Map<string, ToolEntry>,
  agentMap: Map<string, AgentEntry>,
  todoList: TodoItem[],
  todoIdMap: Map<string, number>,
  result: TranscriptData
): void {
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

  // 记录会话开始时间
  if (!result.sessionStart && entry.timestamp) {
    result.sessionStart = timestamp;
  }

  const content = entry.message?.content;
  if (!content || !Array.isArray(content)) return;

  for (const block of content) {
    // 处理工具使用块
    if (block.type === 'tool_use' && block.id && block.name) {
      handleToolUse(block, timestamp, toolMap, agentMap, todoList, todoIdMap);
    }

    // 处理工具结果块
    if (block.type === 'tool_result' && block.tool_use_id) {
      handleToolResult(block, timestamp, toolMap, agentMap);
    }
  }
}

function handleToolUse(
  block: ContentBlock,
  timestamp: Date,
  toolMap: Map<string, ToolEntry>,
  agentMap: Map<string, AgentEntry>,
  todoList: TodoItem[],
  todoIdMap: Map<string, number>
): void {
  const toolId = block.id!;
  const toolName = block.name!;

  // 处理 Task 工具（Agent）
  if (toolName === 'Task') {
    const input = block.input as Record<string, unknown>;
    const agent: AgentEntry = {
      id: toolId,
      type: (input?.subagent_type as string) ?? 'unknown',
      model: (input?.model as string) ?? undefined,
      description: (input?.description as string) ?? undefined,
      status: 'running',
      startTime: timestamp,
    };
    agentMap.set(toolId, agent);
    return;
  }

  // 处理 TodoWrite（替换所有 todos）
  if (toolName === 'TodoWrite') {
    const input = block.input as { todos?: TodoItem[] };
    if (input?.todos && Array.isArray(input.todos)) {
      todoList.length = 0;
      todoIdMap.clear();
      todoList.push(...input.todos);
    }
    return;
  }

  // 处理 TaskCreate（添加新 todo）
  if (toolName === 'TaskCreate') {
    const input = block.input as Record<string, unknown>;
    const subject = typeof input?.subject === 'string' ? input.subject : '';
    const description = typeof input?.description === 'string' ? input.description : '';
    const content = subject || description || '未命名任务';
    const status = parseTodoStatus(input?.status);

    todoList.push({ content, status: status ?? 'pending' });

    const taskId = String(input?.taskId ?? toolId);
    todoIdMap.set(taskId, todoList.length - 1);
    return;
  }

  // 处理 TaskUpdate（更新现有 todo）
  if (toolName === 'TaskUpdate') {
    const input = block.input as Record<string, unknown>;
    const index = resolveTodoIndex(input?.taskId, todoIdMap, todoList);

    if (index !== null && index >= 0 && index < todoList.length) {
      const status = parseTodoStatus(input?.status);
      if (status) {
        todoList[index].status = status;
      }

      const subject = typeof input?.subject === 'string' ? input.subject : '';
      const description = typeof input?.description === 'string' ? input.description : '';
      const content = subject || description;
      if (content) {
        todoList[index].content = content;
      }
    }
    return;
  }

  // 普通工具 - 创建状态条目
  const tool: ToolEntry = {
    id: toolId,
    name: toolName,
    target: extractTarget(toolName, block.input),
    status: 'running',
    startTime: timestamp,
  };
  toolMap.set(toolId, tool);
}

function handleToolResult(
  block: ContentBlock,
  timestamp: Date,
  toolMap: Map<string, ToolEntry>,
  agentMap: Map<string, AgentEntry>
): void {
  const toolId = block.tool_use_id!;
  const isError = block.is_error ?? false;

  // 更新工具状态
  const tool = toolMap.get(toolId);
  if (tool) {
    tool.status = isError ? 'error' : 'completed';
    tool.endTime = timestamp;
    // 计算执行时长（毫秒）
    tool.duration = timestamp.getTime() - tool.startTime.getTime();
  }

  // 更新 Agent 状态
  const agent = agentMap.get(toolId);
  if (agent) {
    agent.status = 'completed';
    agent.endTime = timestamp;
  }
}

function extractTarget(toolName: string, input?: Record<string, unknown>): string | undefined {
  if (!input) return undefined;

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return (input.file_path as string) ?? (input.path as string);
    case 'Glob':
      return input.pattern as string;
    case 'Grep':
      return input.pattern as string;
    case 'Bash':
      const cmd = input.command as string;
      if (!cmd) return undefined;
      return cmd.length > 30 ? cmd.slice(0, 30) + '...' : cmd;
    default:
      return undefined;
  }
}

function resolveTodoIndex(
  taskId: unknown,
  idMap: Map<string, number>,
  list: TodoItem[]
): number | null {
  if (typeof taskId !== 'string' && typeof taskId !== 'number') return null;

  const key = String(taskId);

  // 尝试直接查找
  const mapped = idMap.get(key);
  if (typeof mapped === 'number') {
    return mapped;
  }

  // 尝试数字索引（从 1 基数转换为 0 基数）
  if (/^\d+$/.test(key)) {
    const index = Number.parseInt(key, 10) - 1;
    if (index >= 0 && index < list.length) {
      return index;
    }
  }

  return null;
}

function parseTodoStatus(status: unknown): TodoItem['status'] | null {
  if (typeof status !== 'string') return null;

  switch (status) {
    case 'pending':
    case 'not_started':
      return 'pending';
    case 'in_progress':
    case 'running':
      return 'in_progress';
    case 'completed':
    case 'done':
    case 'complete':
      return 'completed';
    default:
      return null;
  }
}
