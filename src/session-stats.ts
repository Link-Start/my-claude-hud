/**
 * 历史会话统计 - 跨会话追踪使用情况
 * 记录：总 token 数、总会话数、常用工具等
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ToolEntry } from './types.js';

const STATS_CACHE_FILE = '.session-stats.json';
const STATS_CACHE_KEY = 'history_stats';

/**
 * 会话统计数据
 */
export interface SessionStats {
  totalSessions: number;          // 总会话数
  totalTokensUsed: number;        // 总 token 使用量
  totalDuration: number;          // 总时长（毫秒）
  totalCost: number;              // 总费用（美元）
  mostUsedTool: string;           // 最常用工具
  mostUsedToolCount: number;      // 最常用工具次数
  toolUsage: Record<string, number>; // 工具使用统计
  averageTokensPerSession: number; // 平均每会话 token 数
  lastUpdateDate: string;         // 最后更新日期
}

/**
 * 默认统计数据
 */
const DEFAULT_STATS: SessionStats = {
  totalSessions: 0,
  totalTokensUsed: 0,
  totalDuration: 0,
  totalCost: 0,
  mostUsedTool: 'N/A',
  mostUsedToolCount: 0,
  toolUsage: {},
  averageTokensPerSession: 0,
  lastUpdateDate: new Date().toISOString().split('T')[0],
};

/**
 * 获取缓存文件路径
 */
function getCachePath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', STATS_CACHE_FILE);
}

/**
 * 加载历史统计数据
 */
export function loadSessionStats(): SessionStats {
  try {
    const cachePath = getCachePath();

    if (!fs.existsSync(cachePath)) {
      return DEFAULT_STATS;
    }

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache = JSON.parse(content);
    return cache[STATS_CACHE_KEY] ?? DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

/**
 * 保存历史统计数据
 */
function saveSessionStats(stats: SessionStats): void {
  try {
    const cachePath = getCachePath();
    const cacheDir = path.dirname(cachePath);

    // 确保目录存在
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // 读取现有缓存
    let cache: Record<string, SessionStats> = {};
    if (fs.existsSync(cachePath)) {
      try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      } catch {
        // 忽略，使用空对象
      }
    }

    // 更新统计数据
    cache[STATS_CACHE_KEY] = stats;
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // 忽略错误
  }
}

/**
 * 更新会话统计数据
 */
export function updateSessionStats(
  tokensUsed: number,
  duration: number,
  cost: number,
  tools: ToolEntry[]
): void {
  try {
    const stats = loadSessionStats();

    // 更新基础统计
    stats.totalSessions++;
    stats.totalTokensUsed += tokensUsed;
    stats.totalDuration += duration;
    stats.totalCost += cost;
    stats.averageTokensPerSession = stats.totalTokensUsed / stats.totalSessions;
    stats.lastUpdateDate = new Date().toISOString().split('T')[0];

    // 更新工具使用统计
    for (const tool of tools) {
      const count = stats.toolUsage[tool.name] ?? 0;
      stats.toolUsage[tool.name] = count + 1;
    }

    // 更新最常用工具
    let maxCount = 0;
    let topTool = 'N/A';
    for (const [name, count] of Object.entries(stats.toolUsage)) {
      if (count > maxCount) {
        maxCount = count;
        topTool = name;
      }
    }
    stats.mostUsedTool = topTool;
    stats.mostUsedToolCount = maxCount;

    // 保存
    saveSessionStats(stats);
  } catch {
    // 忽略错误
  }
}

/**
 * 格式化统计数据用于显示
 */
export function formatSessionStats(stats: SessionStats): string {
  const parts: string[] = [];

  // 会话数量
  parts.push(`Session #${stats.totalSessions}`);

  // 总 token 使用量
  const totalTokens = formatTokens(stats.totalTokensUsed);
  parts.push(`Total: ${totalTokens}`);

  // 平均每会话
  const avgTokens = formatTokens(stats.averageTokensPerSession);
  parts.push(`Avg: ${avgTokens}/session`);

  // 最常用工具（如果有）
  if (stats.mostUsedTool !== 'N/A' && stats.mostUsedToolCount > 0) {
    const totalTools = Object.values(stats.toolUsage).reduce((a, b) => a + b, 0);
    const percentage = ((stats.mostUsedToolCount / totalTools) * 100).toFixed(0);
    parts.push(`Top tool: ${stats.mostUsedTool} (${percentage}%)`);
  }

  return parts.join(' | ');
}

/**
 * 格式化 token 数量
 */
function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M tokens`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}k tokens`;
  }
  return `${n} tokens`;
}

/**
 * 清除历史统计数据
 */
export function clearSessionStats(): void {
  try {
    const cachePath = getCachePath();

    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 获取统计摘要（用于快捷操作显示）
 */
export function getStatsSummary(): string {
  const stats = loadSessionStats();

  const lines: string[] = [];
  lines.push('');
  lines.push('📊 My Claude HUD 历史统计\n');

  lines.push(`总会话数: ${stats.totalSessions}`);
  lines.push(`总 Token: ${formatTokens(stats.totalTokensUsed)}`);
  lines.push(`平均每会话: ${formatTokens(stats.averageTokensPerSession)}`);
  lines.push(`总会话时长: ${formatDuration(stats.totalDuration)}`);
  lines.push(`总费用: $${stats.totalCost.toFixed(2)}`);

  if (stats.mostUsedTool !== 'N/A') {
    const totalTools = Object.values(stats.toolUsage).reduce((a, b) => a + b, 0);
    const percentage = ((stats.mostUsedToolCount / totalTools) * 100).toFixed(1);
    lines.push(`\n最常用工具: ${stats.mostUsedTool} (${stats.mostUsedToolCount} 次, ${percentage}%)`);
  }

  lines.push(`最后更新: ${stats.lastUpdateDate}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
