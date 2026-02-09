/**
 * 读取并解析 Claude Code 通过 stdin 传入的数据
 */

import type { StdinInput } from './types.js';

/**
 * 从 stdin 读取 JSON 数据
 * 如果没有数据或在 TTY 模式下，返回 null
 */
export async function readStdin(): Promise<StdinInput | null> {
  // 如果在终端中运行（非管道），返回 null
  if (process.stdin.isTTY) {
    return null;
  }

  try {
    // 读取 stdin 的所有数据块
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }

    const raw = Buffer.concat(chunks).toString('utf-8');
    if (!raw.trim()) {
      return null;
    }

    return JSON.parse(raw) as StdinInput;
  } catch {
    return null;
  }
}

/**
 * 计算输入 token 总数
 */
export function getTotalInputTokens(data: StdinInput): number {
  const usage = data.context_window?.current_usage;
  if (!usage) return 0;

  return (
    (usage.input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0)
  );
}

/**
 * 计算总 token 数（输入 + 输出）
 */
export function getTotalTokens(data: StdinInput): number {
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
 * 获取原生百分比（Claude Code 2.1.6+）
 * 返回 null 如果不可用
 */
function getNativePercent(data: StdinInput): number | null {
  const native = data.context_window?.used_percentage;
  if (typeof native === 'number' && !Number.isNaN(native)) {
    return Math.min(100, Math.max(0, Math.round(native)));
  }
  return null;
}

/**
 * 获取上下文使用百分比
 * 优先使用原生百分比（Claude Code 2.1.6+）
 */
export function getContextUsagePercent(data: StdinInput): number {
  const native = getNativePercent(data);
  if (native !== null) {
    return native;
  }

  // 回退到手动计算（无缓冲）
  const windowSize = data.context_window?.context_window_size;
  if (!windowSize || windowSize <= 0) {
    return 0;
  }

  const totalTokens = getTotalInputTokens(data);
  return Math.min(100, Math.round((totalTokens / windowSize) * 100));
}

/**
 * 获取带缓冲的上下文使用百分比
 * 用于模拟自动压缩缓冲区的行为
 * 缓冲值 22.5% 是基于社区观察得出的经验值
 */
export function getBufferedPercent(data: StdinInput): number {
  // 优先使用原生百分比（已包含正确的上下文计算）
  const native = getNativePercent(data);
  if (native !== null) {
    return native;
  }

  // 回退到手动计算（带缓冲）
  const windowSize = data.context_window?.context_window_size;
  if (!windowSize || windowSize <= 0) {
    return 0;
  }

  const totalTokens = getTotalInputTokens(data);
  const buffer = windowSize * 0.225; // 22.5% 缓冲
  return Math.min(100, Math.round(((totalTokens + buffer) / windowSize) * 100));
}

/**
 * 获取模型显示名称
 */
export function getModelName(data: StdinInput): string {
  return data.model?.display_name ?? data.model?.id ?? 'unknown';
}

/**
 * 检查是否为 AWS Bedrock 模型
 */
export function isBedrockProvider(data: StdinInput): boolean {
  const modelId = data.model?.id?.toLowerCase() ?? '';
  return modelId.includes('anthropic.claude-');
}

/**
 * 获取提供商标签（例如 AWS 显示 "Bedrock"）
 */
export function getProviderLabel(data: StdinInput): string | null {
  if (isBedrockProvider(data)) {
    return 'Bedrock';
  }
  return null;
}
