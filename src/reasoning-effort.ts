/**
 * 推理努力推测模块
 * 通过综合分析会话数据来估算当前的推理努力级别
 */

import type { RenderContext } from './types.js';
import { getContextUsagePercent, getTotalTokens } from './stdin.js';
import { detectSessionState } from './session-state.js';

/**
 * 推理努力级别
 */
export type ReasoningEffort = 'low' | 'medium' | 'high';

/**
 * 推理努力评分结果
 */
export interface ReasoningEffortResult {
  level: ReasoningEffort;
  score: number;
  factors: ReasoningEffortFactor[];
}

/**
 * 推理努力评分因素
 */
export interface ReasoningEffortFactor {
  name: string;
  contribution: number;
  description: string;
}

/**
 * 估算推理努力级别
 * 
 * 综合考虑以下因素：
 * - 子 Agent 数量
 * - 运行中的工具数量
 * - 会话状态
 * - 输出 token 数量
 * - 上下文使用量
 * 
 * @param ctx 渲染上下文
 * @returns 推理努力级别和评分详情
 */
export function estimateReasoningEffort(ctx: RenderContext): ReasoningEffortResult {
  const factors: ReasoningEffortFactor[] = [];
  let score = 0;

  // 1. 子 Agent 因素 (权重: 25)
  const runningAgents = ctx.transcript.agents.filter(a => a.status === 'running').length;
  const completedAgents = ctx.transcript.agents.filter(a => a.status === 'completed').length;
  const totalAgents = runningAgents + completedAgents;
  
  if (totalAgents > 0) {
    const agentScore = Math.min(25, totalAgents * 8);
    score += agentScore;
    factors.push({
      name: 'Agent活动',
      contribution: agentScore,
      description: `${totalAgents}个Agent (运行中: ${runningAgents}, 已完成: ${completedAgents})`
    });
  }

  // 2. 工具调用因素 (权重: 20)
  const runningTools = ctx.transcript.tools.filter(t => t.status === 'running').length;
  const completedTools = ctx.transcript.tools.filter(t => t.status === 'completed').length;
  const errorTools = ctx.transcript.tools.filter(t => t.status === 'error').length;
  const totalTools = runningTools + completedTools + errorTools;
  
  if (totalTools > 0) {
    // 运行中的工具权重更高
    const toolScore = Math.min(20, runningTools * 6 + completedTools * 2);
    score += toolScore;
    factors.push({
      name: '工具调用',
      contribution: toolScore,
      description: `${totalTools}次工具调用 (运行中: ${runningTools}, 完成: ${completedTools}, 错误: ${errorTools})`
    });
  }

  // 3. 会话状态因素 (权重: 20)
  const sessionState = detectSessionState(ctx);
  let stateScore = 0;
  switch (sessionState.level) {
    case 'critical':
      stateScore = 20;
      factors.push({
        name: '会话状态',
        contribution: stateScore,
        description: 'critical - 上下文接近极限或API限制已达'
      });
      break;
    case 'warning':
      stateScore = 15;
      factors.push({
        name: '会话状态',
        contribution: stateScore,
        description: 'warning - 上下文使用率高或API使用量过半'
      });
      break;
    case 'busy':
      stateScore = 10;
      factors.push({
        name: '会话状态',
        contribution: stateScore,
        description: 'busy - 多个工具或任务同时进行'
      });
      break;
    default:
      stateScore = 0;
      break;
  }
  score += stateScore;

  // 4. 输出 Token 因素 (权重: 15)
  const outputTokens = ctx.stdin.context_window?.current_usage?.output_tokens ?? 0;
  if (outputTokens > 0) {
    let tokenScore = 0;
    if (outputTokens > 10000) {
      tokenScore = 15;
    } else if (outputTokens > 5000) {
      tokenScore = 12;
    } else if (outputTokens > 2000) {
      tokenScore = 8;
    } else if (outputTokens > 500) {
      tokenScore = 4;
    } else {
      tokenScore = 0;
    }
    score += tokenScore;
    factors.push({
      name: '输出Token',
      contribution: tokenScore,
      description: `已输出 ${outputTokens.toLocaleString()} tokens`
    });
  }

  // 5. 上下文使用量因素 (权重: 10)
  const contextPercent = getContextUsagePercent(ctx.stdin);
  let contextScore = 0;
  if (contextPercent >= 90) {
    contextScore = 10;
  } else if (contextPercent >= 80) {
    contextScore = 8;
  } else if (contextPercent >= 60) {
    contextScore = 5;
  } else if (contextPercent >= 40) {
    contextScore = 2;
  }
  score += contextScore;
  
  if (contextScore > 0) {
    factors.push({
      name: '上下文使用',
      contribution: contextScore,
      description: `上下文使用量: ${contextPercent}%`
    });
  }

  // 6. Todo 进度因素 (权重: 5)
  const pendingTodos = ctx.transcript.todos.filter(t => t.status === 'pending').length;
  const inProgressTodos = ctx.transcript.todos.filter(t => t.status === 'in_progress').length;
  const totalTodos = pendingTodos + inProgressTodos;
  
  if (totalTodos > 0) {
    const todoScore = Math.min(5, totalTodos * 2);
    score += todoScore;
    factors.push({
      name: '待办任务',
      contribution: todoScore,
      description: `${totalTodos}个待办任务`
    });
  }

  // 7. 模型因素 (权重: 5)
  // 不同的模型有不同的默认推理能力
  const modelName = ctx.stdin.model?.id?.toLowerCase() ?? '';
  let modelScore = 0;
  
  // Opus 系列通常是最高性能
  if (modelName.includes('opus')) {
    modelScore = 5;
    factors.push({
      name: '模型',
      contribution: modelScore,
      description: 'Opus系列模型'
    });
  } else if (modelName.includes('sonnet')) {
    modelScore = 3;
    factors.push({
      name: '模型',
      contribution: modelScore,
      description: 'Sonnet系列模型'
    });
  } else if (modelName.includes('haiku')) {
    modelScore = 1;
    factors.push({
      name: '模型',
      contribution: modelScore,
      description: 'Haiku系列模型'
    });
  }

  // 确定推理努力级别
  let level: ReasoningEffort;
  if (score >= 60) {
    level = 'high';
  } else if (score >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    level,
    score: Math.min(100, score),
    factors
  };
}

/**
 * 获取推理努力级别的显示图标
 */
export function getReasoningEffortIcon(level: ReasoningEffort): string {
  switch (level) {
    case 'high':
      return '🧠';
    case 'medium':
      return '💭';
    case 'low':
      return '💤';
  }
}

/**
 * 获取推理努力级别的显示文字
 */
export function getReasoningEffortLabel(level: ReasoningEffort, language: 'zh' | 'en' = 'zh'): string {
  const labels = {
    zh: {
      high: '高',
      medium: '中',
      low: '低'
    },
    en: {
      high: 'high',
      medium: 'medium',
      low: 'low'
    }
  };
  
  return labels[language][level];
}

/**
 * 格式化推理努力显示字符串
 */
export function formatReasoningEffort(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  
  // 检查是否启用
  if (display?.showReasoningEffort === false) {
    return null;
  }
  
  const result = estimateReasoningEffort(ctx);
  const icon = getReasoningEffortIcon(result.level);
  const label = getReasoningEffortLabel(result.level, display?.displayLanguage ?? 'zh');
  
  return `${icon} ${label}`;
}
