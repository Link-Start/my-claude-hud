/**
 * 统一格式化工具模块
 * 合并项目中重复的格式化函数
 */

// ==================== 类型定义 ====================

/**
 * Token 格式化选项
 */
export interface FormatTokensOptions {
  /** 是否添加单位后缀，默认 false */
  withUnit?: boolean;
  /** k 精度（小数位数），默认 1 */
  precision?: number;
  /** 自定义单位名称，默认 "tokens" */
  unitName?: string;
}

/**
 * 时长格式化模式
 */
export type DurationFormat =
  | 'short'      // 简洁: "1h 30m" / "45m" / "<1m"
  | 'precise'    // 精确: "1h 30m 15s" / "45m 30s" / "30s"
  | 'compact'    // 紧凑: "1h30m" / "45m" / "<1m"
  | 'estimate'   // 估算: "~1h 30m" / "~45m" / "~<1m"
  | 'seconds';   // 秒级: "90s" / "45s" / "<1s"

/**
 * 时长格式化选项
 */
export interface FormatDurationOptions {
  /** 格式化模式，默认 'short' */
  format?: DurationFormat;
  /** 最小时间单位（秒级显示阈值），默认 60 */
  minSeconds?: number;
  /** 是否允许空字符串（当时间为 0 或无效时），默认 false */
  allowEmpty?: boolean;
}

// ==================== Token 格式化 ====================

/**
 * 格式化 token 数量
 *
 * @example
 * formatTokens(500)                                      // "500"
 * formatTokens(1500)                                     // "1.5k"
 * formatTokens(1500000)                                  // "1.5M"
 * formatTokens(1500, { withUnit: true })                 // "1.5k tokens"
 * formatTokens(1500, { precision: 0 })                   // "2k"
 * formatTokens(1500, { withUnit: true, unitName: 'tok' }) // "1.5k tok"
 */
export function formatTokens(
  n: number,
  options: FormatTokensOptions = {}
): string {
  const { withUnit = false, precision = 1, unitName = 'tokens' } = options;

  const safeN = Math.max(0, n);
  let result: string;

  if (safeN >= 1_000_000) {
    result = `${(safeN / 1_000_000).toFixed(precision)}M`;
  } else if (safeN >= 1_000) {
    result = `${(safeN / 1_000).toFixed(precision)}k`;
  } else {
    result = Math.round(safeN).toString();
  }

  return withUnit ? `${result} ${unitName}` : result;
}

// ==================== Duration 格式化 ====================

/**
 * 格式化时长（毫秒）
 *
 * @example
 * formatDuration(500)                                  // "<1m"
 * formatDuration(45000)                                // "45m"
 * formatDuration(5400000)                              // "1h 30m"
 * formatDuration(45000, { format: 'precise' })         // "45m 0s"
 * formatDuration(3500, { format: 'seconds' })          // "3.5s"
 * formatDuration(3500, { format: 'estimate' })         // "~<1m"
 */
export function formatDuration(
  ms: number,
  options: FormatDurationOptions = {}
): string {
  const { format = 'short', minSeconds = 60, allowEmpty = false } = options;

  // 处理无效输入
  if (!Number.isFinite(ms) || ms < 0) {
    return allowEmpty ? '' : '<1m';
  }

  const safeMs = Math.round(ms);

  // 估算模式前缀
  const estimatePrefix = format === 'estimate' ? '~' : '';

  // 秒级精确显示（tools-line.ts 需求）
  if (format === 'seconds' || (format === 'precise' && safeMs < 60000)) {
    if (safeMs < 1000) return `${estimatePrefix}<1s`;
    const secs = safeMs / 1000;
    return `${estimatePrefix}${secs.toFixed(1)}s`;
  }

  // 小于 1 分钟
  if (safeMs < 60000) {
    return `${estimatePrefix}<1m`;
  }

  const mins = Math.floor(safeMs / 60000);

  // 小于 1 小时
  if (mins < 60) {
    return format === 'compact'
      ? `${estimatePrefix}${mins}m`
      : `${estimatePrefix}${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (format === 'compact') {
    return `${estimatePrefix}${hours}h${remainingMins > 0 ? remainingMins : ''}m`;
  }

  // precise 模式添加秒
  if (format === 'precise') {
    const remainingSecs = Math.round((safeMs % 60000) / 1000);
    if (remainingSecs > 0) {
      return `${estimatePrefix}${hours}h ${remainingMins}m ${remainingSecs}s`;
    }
  }

  return remainingMins > 0
    ? `${estimatePrefix}${hours}h ${remainingMins}m`
    : `${estimatePrefix}${hours}h`;
}

/**
 * 格式化会话时长（特殊版本，支持空返回）
 *
 * @example
 * formatSessionDuration(undefined)  // ""
 * formatSessionDuration(date)       // "1h 30m"
 */
export function formatSessionDuration(
  sessionStart?: Date,
  now: () => number = () => Date.now()
): string {
  if (!sessionStart) {
    return '';
  }

  const ms = now() - sessionStart.getTime();
  return formatDuration(ms, { allowEmpty: true });
}

// ==================== 时间差格式化 ====================

/**
 * 格式化距离某时间的剩余时长
 * 用于 API 配额重置时间显示
 *
 * @example
 * formatTimeUntil(futureDate)  // "1h 30m" / "45m" / ""
 */
export function formatTimeUntil(
  target: Date | null,
  now: () => number = () => Date.now()
): string {
  if (!target) return '';

  const diffMs = target.getTime() - now();
  if (diffMs <= 0) return '';

  return formatDuration(diffMs);
}

// ==================== 数字格式化工具 ====================

/**
 * 格式化百分比
 *
 * @example
 * formatPercent(85.5)     // "86%"
 * formatPercent(85.5, 1)  // "85.5%"
 */
export function formatPercent(value: number, precision: number = 0): string {
  return `${value.toFixed(precision)}%`;
}

/**
 * 格式化数字（带千分位分隔符）
 *
 * @example
 * formatNumber(1000000)  // "1,000,000"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}
