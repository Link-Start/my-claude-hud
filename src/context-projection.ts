/**
 * 上下文预算预测 - 预测上下文窗口何时填满
 * 基于历史数据估算剩余消息数量和时间
 */

import type { StdinInput, RenderContext } from './types.js';

/**
 * 预测结果
 */
export interface ProjectionResult {
  remainingTokens: number;          // 剩余 token 数量
  estimatedMessagesRemaining: number; // 预计剩余消息数
  estimatedTimeRemaining: string;    // 预计剩余时间（格式化）
}

/**
 * 会话历史记录（用于计算平均值）
 */
interface SessionHistory {
  totalInputTokens: number;
  totalOutputTokens: number;
  messageCount: number;
  totalDuration: number;  // 毫秒
}

// 简化的历史统计（基于当前会话）
const currentHistory: SessionHistory = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  messageCount: 0,
  totalDuration: 0,
};

/**
 * 更新历史统计
 */
export function updateHistory(inputTokens: number, outputTokens: number, duration: number): void {
  currentHistory.totalInputTokens += inputTokens;
  currentHistory.totalOutputTokens += outputTokens;
  currentHistory.messageCount++;
  currentHistory.totalDuration += duration;
}

/**
 * 计算平均每轮对话的 token 使用量
 */
function calculateAverageTokens(): { input: number; output: number; total: number } {
  if (currentHistory.messageCount === 0) {
    // 默认估算值（基于 Claude 典型使用）
    return { input: 2000, output: 1000, total: 3000 };
  }

  const input = currentHistory.totalInputTokens / currentHistory.messageCount;
  const output = currentHistory.totalOutputTokens / currentHistory.messageCount;

  return { input, output, total: input + output };
}

/**
 * 计算平均每轮对话的耗时
 */
function calculateAverageDuration(): number {
  if (currentHistory.messageCount === 0) {
    return 30000;  // 默认 30 秒
  }

  return currentHistory.totalDuration / currentHistory.messageCount;
}

/**
 * 预测上下文使用情况
 */
export function projectContextUsage(ctx: RenderContext): ProjectionResult {
  const currentUsage = getTotalTokens(ctx.stdin);
  const windowSize = ctx.stdin.context_window?.context_window_size ?? 200000;
  const remaining = Math.max(0, windowSize - currentUsage);

  // 计算平均值
  const avgTokens = calculateAverageTokens();
  const avgDuration = calculateAverageDuration();

  // 估算剩余消息数
  const messagesRemaining = Math.floor(remaining / avgTokens.total);

  // 估算剩余时间
  const timeRemainingMs = messagesRemaining * avgDuration;
  const timeRemainingStr = formatDuration(timeRemainingMs);

  return {
    remainingTokens: remaining,
    estimatedMessagesRemaining: messagesRemaining,
    estimatedTimeRemaining: timeRemainingStr,
  };
}

/**
 * 获取总 token 使用量
 */
function getTotalTokens(data: StdinInput): number {
  const usage = data.context_window?.current_usage;
  if (!usage) return 0;

  return (
    (usage.input_tokens ?? 0) +
    (usage.output_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0)
  );
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  if (ms < 60000) {
    return `<1m`;
  }

  const mins = Math.floor(ms / 60000);
  if (mins < 60) {
    return `~${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `~${hours}h ${remainingMins}m` : `~${hours}h`;
}

/**
 * 格式化预测结果用于显示
 */
export function formatProjection(projection: ProjectionResult): string {
  const { remainingTokens, estimatedMessagesRemaining, estimatedTimeRemaining } = projection;

  // 如果剩余空间很大，显示 token 数量
  if (remainingTokens > 50000) {
    return `~${formatTokens(remainingTokens)} remaining`;
  }

  // 如果剩余空间较小，显示消息数量和时间
  if (estimatedMessagesRemaining > 0) {
    const msgPart = estimatedMessagesRemaining === 1
      ? '~1 message remaining'
      : `~${estimatedMessagesRemaining} messages remaining`;
    return `${msgPart} (${estimatedTimeRemaining})`;
  }

  return 'context nearly full';
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
