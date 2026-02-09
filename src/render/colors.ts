/**
 * 颜色工具函数 - 用于渲染彩色条形图和文本
 * 支持自定义颜色主题
 */

import type { ThemeColors } from '../themes.js';
import { getTheme, parseCustomColors } from '../themes.js';

// 默认颜色（如果没有配置主题）
export const RESET = '\x1b[0m';

// ANSI 颜色代码（默认值）
const DEFAULT_COLORS = {
  DIM: '\x1b[2m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  RESET: '\x1b[0m',
};

// 当前激活的主题颜色
let currentTheme: ThemeColors | null = null;

/**
 * 设置颜色主题
 */
export function setColorTheme(themeName: string, customColors?: Record<string, string>): void {
  const parsedCustom = customColors ? parseCustomColors(customColors) : undefined;
  currentTheme = getTheme(themeName, parsedCustom);
}

/**
 * 获取当前主题颜色
 */
function getColors(): ThemeColors {
  if (!currentTheme) {
    // 返回默认主题
    return {
      contextLow: DEFAULT_COLORS.GREEN,
      contextMedium: DEFAULT_COLORS.YELLOW,
      contextHigh: '\x1b[38;5;208m', // orange
      contextCritical: DEFAULT_COLORS.RED,
      success: DEFAULT_COLORS.GREEN,
      warning: DEFAULT_COLORS.YELLOW,
      error: DEFAULT_COLORS.RED,
      info: DEFAULT_COLORS.CYAN,
      magenta: DEFAULT_COLORS.MAGENTA,
      cyan: DEFAULT_COLORS.CYAN,
      yellow: DEFAULT_COLORS.YELLOW,
      green: DEFAULT_COLORS.GREEN,
      red: DEFAULT_COLORS.RED,
      dim: DEFAULT_COLORS.DIM,
      reset: DEFAULT_COLORS.RESET,
    };
  }
  return currentTheme;
}

/**
 * 绿色文本
 */
export function green(text: string): string {
  const colors = getColors();
  return `${colors.green}${text}${colors.reset}`;
}

/**
 * 黄色文本
 */
export function yellow(text: string): string {
  const colors = getColors();
  return `${colors.yellow}${text}${colors.reset}`;
}

/**
 * 红色文本
 */
export function red(text: string): string {
  const colors = getColors();
  return `${colors.red}${text}${colors.reset}`;
}

/**
 * 青色文本
 */
export function cyan(text: string): string {
  const colors = getColors();
  return `${colors.cyan}${text}${colors.reset}`;
}

/**
 * 紫红色文本
 */
export function magenta(text: string): string {
  const colors = getColors();
  return `${colors.magenta}${text}${colors.reset}`;
}

/**
 * 暗色文本
 */
export function dim(text: string): string {
  const colors = getColors();
  return `${colors.dim}${text}${colors.reset}`;
}

/**
 * 获取上下文颜色
 * >=95% 严重, >=80% 高, >=50% 中, 其他低
 */
export function getContextColor(percent: number): string {
  const colors = getColors();
  if (percent >= 95) return colors.contextCritical;
  if (percent >= 80) return colors.contextHigh;
  if (percent >= 50) return colors.contextMedium;
  return colors.contextLow;
}

/**
 * 获取配额颜色
 * >=90% 红色, >=75% 紫红色, 其他蓝色
 */
export function getQuotaColor(percent: number): string {
  const colors = getColors();
  if (percent >= 90) return colors.error;
  if (percent >= 75) return colors.magenta;
  return colors.info;
}

/**
 * 渲染上下文条形图
 * 使用主题颜色
 */
export function coloredBar(percent: number, width: number = 10): string {
  const safeWidth = Math.max(0, Math.round(width));
  const safePercent = Math.min(100, Math.max(0, percent));
  const filled = Math.round((safePercent / 100) * safeWidth);
  const empty = safeWidth - filled;
  const colors = getColors();
  const color = getContextColor(safePercent);
  return `${color}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
}

/**
 * 渲染配额条形图
 * 使用主题颜色
 */
export function quotaBar(percent: number, width: number = 10): string {
  const safeWidth = Math.max(0, Math.round(width));
  const safePercent = Math.min(100, Math.max(0, percent));
  const filled = Math.round((safePercent / 100) * safeWidth);
  const empty = safeWidth - filled;
  const colors = getColors();
  const color = getQuotaColor(safePercent);
  return `${color}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
}

/**
 * 格式化 token 数量
 * 大数字使用 k/M 后缀
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`;
  }
  return Math.round(tokens).toString();
}
