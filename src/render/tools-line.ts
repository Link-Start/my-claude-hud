/**
 * 工具行渲染 - 显示运行中和已完成的工具
 * 包含执行时间显示和智能工具分组
 * 支持多语言翻译
 */

import type { RenderContext } from '../types.js';
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

function truncatePath(path: string, maxLen: number = 20): string {
  // 规范化 Windows 反斜杠为正斜杠
  const normalizedPath = path.replace(/\\/g, '/');

  if (normalizedPath.length <= maxLen) return normalizedPath;

  // 按正斜杠分割
  const parts = normalizedPath.split('/');
  const filename = parts.pop() || normalizedPath;

  if (filename.length >= maxLen) {
    return filename.slice(0, maxLen - 3) + '...';
  }

  return '.../' + filename;
}
