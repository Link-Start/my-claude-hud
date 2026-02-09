/**
 * 工具行渲染 - 显示运行中和已完成的工具
 * 包含执行时间显示和智能工具分组
 * 支持多语言翻译
 * 支持语义化分组和目录聚合
 */

import * as path from 'node:path';
import type { RenderContext, ToolDetailLevel, ToolEntry } from '../types.js';
import { yellow, green, cyan, dim, red } from './colors.js';
import { translateToolName, translateToolGroup } from '../i18n.js';

// 工具分组配置（工具名 -> 分组名）
const TOOL_GROUPS: Record<string, string> = {
  // 文件操作工具
  'Read': 'File ops',
  'Write': 'File ops',
  'Edit': 'File ops',
  'Glob': 'File ops',
  'GlobFiles': 'File ops',

  // 搜索工具
  'Grep': 'Search',
  'Search': 'Search',
  'Find': 'Search',

  // Shell 工具
  'Bash': 'Shell',
  'Shell': 'Shell',
  'Execute': 'Shell',
  'RunCommand': 'Shell',

  // Git 工具
  'Git': 'Git',
  'GitCheckout': 'Git',
  'GitCommit': 'Git',

  // 网络工具
  'WebFetch': 'Web',
  'WebSearch': 'Web',
  'HttpRequest': 'Web',
};

// 工具语义分类
const TOOL_SEMANTICS: Record<string, {
  category: 'reading' | 'editing' | 'executing' | 'inspecting' | 'communicating';
  impact: 'low' | 'medium' | 'high';
  description: string;
}> = {
  'Read': { category: 'reading', impact: 'low', description: '读取文件' },
  'Grep': { category: 'inspecting', impact: 'low', description: '搜索内容' },
  'Glob': { category: 'inspecting', impact: 'low', description: '查找文件' },
  'Edit': { category: 'editing', impact: 'medium', description: '编辑文件' },
  'Write': { category: 'editing', impact: 'high', description: '写入文件' },
  'Bash': { category: 'executing', impact: 'medium', description: '执行命令' },
  'Task': { category: 'communicating', impact: 'high', description: '启动代理' },
  'WebFetch': { category: 'reading', impact: 'low', description: '获取网页' },
  'WebSearch': { category: 'inspecting', impact: 'low', description: '搜索网页' },
  'GlobFiles': { category: 'inspecting', impact: 'low', description: '搜索文件' },
  'Shell': { category: 'executing', impact: 'medium', description: 'Shell' },
  'Execute': { category: 'executing', impact: 'medium', description: '执行' },
  'RunCommand': { category: 'executing', impact: 'medium', description: '运行命令' },
  'Git': { category: 'editing', impact: 'medium', description: 'Git' },
  'GitCheckout': { category: 'editing', impact: 'low', description: 'Git切换' },
  'GitCommit': { category: 'editing', impact: 'medium', description: 'Git提交' },
  'HttpRequest': { category: 'reading', impact: 'low', description: 'HTTP请求' },
};

// 语义类别翻译
const SEMANTIC_CATEGORY_NAMES: Record<string, Record<'zh' | 'en', string>> = {
  'reading': { zh: '读取', en: 'Reading' },
  'editing': { zh: '编辑', en: 'Editing' },
  'executing': { zh: '执行', en: 'Executing' },
  'inspecting': { zh: '检查', en: 'Inspecting' },
  'communicating': { zh: '通信', en: 'Communicating' },
};

/**
 * 目录工具统计
 */
interface DirectoryToolStats {
  directory: string;
  byCategory: Record<string, number>;
  totalDuration: number;
  fileCount: number;
}

/**
 * 获取工具所属分组
 */
function getToolGroup(toolName: string): string {
  return TOOL_GROUPS[toolName] ?? 'Other';
}

/**
 * 检查是否应使用工具分组（当同类工具数量 >= 3 时）
 */
function shouldUseGrouping(categoryGroups: Map<string, { count: number; totalDuration: number; hasError: boolean; tools: Set<string> }>): boolean {
  for (const [, data] of categoryGroups) {
    if (data.count >= 3) {
      return true;
    }
  }
  return false;
}

/**
 * 获取工具语义信息
 */
function getToolSemantics(toolName: string) {
  return TOOL_SEMANTICS[toolName] ?? { category: 'other' as const, impact: 'low' as const, description: toolName };
}

/**
 * 计算目录统计
 */
function calculateDirectoryStats(tools: ToolEntry[]): DirectoryToolStats[] {
  const dirMap = new Map<string, DirectoryToolStats>();

  for (const tool of tools) {
    if (!tool.target) continue;

    const dir = path.dirname(tool.target);

    if (!dirMap.has(dir)) {
      dirMap.set(dir, {
        directory: dir,
        byCategory: {},
        totalDuration: 0,
        fileCount: 0,
      });
    }

    const stats = dirMap.get(dir)!;
    const semantics = getToolSemantics(tool.name);

    // 按语义分类统计
    stats.byCategory[semantics.category] = (stats.byCategory[semantics.category] ?? 0) + 1;

    // 累计执行时间
    if (tool.duration) {
      stats.totalDuration += tool.duration;
    }

    // 统计文件数量
    if (tool.target) {
      stats.fileCount++;
    }
  }

  // 转换为数组并排序
  return Array.from(dirMap.values())
    .sort((a, b) => {
      const aTotal = Object.values(a.byCategory).reduce((sum, count) => sum + count, 0);
      const bTotal = Object.values(b.byCategory).reduce((sum, count) => sum + count, 0);
      return bTotal - aTotal;
    })
    .slice(0, 3);
}

/**
 * 渲染目录统计
 */
function renderDirectoryStats(
  stats: DirectoryToolStats[],
  lang: 'zh' | 'en'
): string | null {
  if (stats.length === 0) {
    return null;
  }

  const parts: string[] = [];

  for (const stat of stats) {
    // 简化目录名显示
    const shortDir = stat.directory
      .replace(/\\/g, '/')
      .split('/')
      .slice(-2)
      .join('/');

    const categoryParts: string[] = [];
    for (const [category, count] of Object.entries(stat.byCategory)) {
      const categoryName = SEMANTIC_CATEGORY_NAMES[category]?.[lang] ?? category;
      categoryParts.push(`${categoryName}×${count}`);
    }

    parts.push(`📂 ${shortDir}: ${categoryParts.join(', ')}`);
  }

  return parts.join(' | ');
}

/**
 * 渲染语义模式
 */
function renderSemanticMode(
  completedTools: ToolEntry[],
  lang: 'zh' | 'en'
): string[] {
  const parts: string[] = [];

  // 按语义类别统计
  const semanticGroups = new Map<string, {
    count: number;
    totalDuration: number;
    hasError: boolean;
    tools: Set<string>;
  }>();

  for (const tool of completedTools) {
    const semantics = getToolSemantics(tool.name);
    const existing = semanticGroups.get(semantics.category) ?? {
      count: 0,
      totalDuration: 0,
      hasError: false,
      tools: new Set<string>(),
    };

    existing.count++;
    existing.totalDuration += tool.duration ?? 0;
    if (tool.status === 'error') {
      existing.hasError = true;
    }
    existing.tools.add(tool.name);
    semanticGroups.set(semantics.category, existing);
  }

  // 按数量排序
  const sorted = Array.from(semanticGroups.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  for (const [category, data] of sorted) {
    const icon = data.hasError ? red('✗') : green('✓');
    const categoryName = SEMANTIC_CATEGORY_NAMES[category]?.[lang] ?? category;
    const avgDuration = data.totalDuration / data.count;

    if (avgDuration >= 1000) {
      parts.push(`${icon} ${categoryName} ${dim(`(${formatDuration(avgDuration)})`)} ${dim(`×${data.count}`)}`);
    } else {
      parts.push(`${icon} ${categoryName} ${dim(`×${data.count}`)}`);
    }
  }

  return parts;
}

export function renderToolsLine(ctx: RenderContext): string | null {
  const { tools } = ctx.transcript;
  const lang = ctx.config.display.displayLanguage;

  if (tools.length === 0) {
    return null;
  }

  const parts: string[] = [];

  const runningTools = tools.filter((t) => t.status === 'running');
  const completedTools = tools.filter((t) => t.status === 'completed' || t.status === 'error');

  // 显示运行中的工具（使用翻译）
  for (const tool of runningTools.slice(-2)) {
    const target = tool.target ? truncatePath(tool.target) : '';
    const translatedName = translateToolName(tool.name, lang);
    parts.push(`${yellow('◐')} ${cyan(translatedName)}${target ? dim(`: ${target}`) : ''}`);
  }

  // 根据配置选择渲染模式
  const toolDetailLevel = ctx.config.display.toolDetailLevel ?? 'compact';

  if (toolDetailLevel === 'directory' && completedTools.length > 0) {
    // 目录聚合模式
    const dirStats = calculateDirectoryStats(completedTools);
    const dirLine = renderDirectoryStats(dirStats, lang);
    if (dirLine) {
      parts.push(dirLine);
    }
  } else if (toolDetailLevel === 'semantic' && completedTools.length > 0) {
    // 语义模式
    const semanticParts = renderSemanticMode(completedTools, lang);
    parts.push(...semanticParts);
  } else {
    // 紧凑模式（默认）
    // 统计已完成工具（按名称分组）
    const toolGroups = new Map<string, { count: number; totalDuration: number; hasError: boolean }>();
    const categoryGroups = new Map<string, { count: number; totalDuration: number; hasError: boolean; tools: Set<string> }>();

    for (const tool of completedTools) {
      // 按工具名统计
      const existing = toolGroups.get(tool.name) ?? { count: 0, totalDuration: 0, hasError: false };
      existing.count++;
      existing.totalDuration += tool.duration ?? 0;
      if (tool.status === 'error') {
        existing.hasError = true;
      }
      toolGroups.set(tool.name, existing);

      // 按类别统计
      const category = getToolGroup(tool.name);
      const catExisting = categoryGroups.get(category) ?? { count: 0, totalDuration: 0, hasError: false, tools: new Set() };
      catExisting.count++;
      catExisting.totalDuration += tool.duration ?? 0;
      if (tool.status === 'error') {
        catExisting.hasError = true;
      }
      catExisting.tools.add(tool.name);
      categoryGroups.set(category, catExisting);
    }

    // 判断是否使用分组显示
    const useGrouping = shouldUseGrouping(categoryGroups);

    if (useGrouping) {
      // 使用分组显示（翻译分组名）
      const sortedGroups = Array.from(categoryGroups.entries())
        .filter(([_, data]) => data.count >= 2)  // 只显示数量 >= 2 的分组
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4);

      for (const [category, data] of sortedGroups) {
        const icon = data.hasError ? red('✗') : green('✓');
        const avgDuration = data.totalDuration / data.count;
        const translatedCategory = translateToolGroup(category, lang);

        if (avgDuration >= 1000) {
          parts.push(`${icon} ${translatedCategory} ${dim(`(${formatDuration(avgDuration)})`)} ${dim(`×${data.count}`)}`);
        } else {
          parts.push(`${icon} ${translatedCategory} ${dim(`×${data.count}`)}`);
        }
      }
    } else {
      // 使用单独工具显示（翻译工具名）
      const sortedTools = Array.from(toolGroups.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4);

      for (const [name, data] of sortedTools) {
        const icon = data.hasError ? red('✗') : green('✓');
        const avgDuration = data.totalDuration / data.count;
        const translatedName = translateToolName(name, lang);

        if (avgDuration >= 1000) {
          parts.push(`${icon} ${translatedName} ${dim(`(${formatDuration(avgDuration)})`)} ${dim(`×${data.count}`)}`);
        } else {
          parts.push(`${icon} ${translatedName} ${dim(`×${data.count}`)}`);
        }
      }
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' | ');
}

/**
 * 格式化时长显示
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function truncatePath(filePath: string, maxLen: number = 20): string {
  // 规范化 Windows 反斜杠为正斜杠
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.length <= maxLen) return normalizedPath;

  // 按正斜杠分割
  const parts = normalizedPath.split('/');
  const filename = parts.pop() || normalizedPath;

  if (filename.length >= maxLen) {
    return filename.slice(0, maxLen - 3) + '...';
  }

  return '.../' + filename;
}
