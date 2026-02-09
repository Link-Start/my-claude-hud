/**
 * 自定义颜色主题 - 支持终端主题配色
 * 内置主题：default, nord, dracula, monokai, solarized
 */

import type { HudConfig } from './types.js';

/**
 * 颜色主题定义
 */
export interface ColorTheme {
  name: string;
  colors: ThemeColors;
}

/**
 * 主题颜色
 */
export interface ThemeColors {
  // 上下文条颜色（根据使用百分比）
  contextLow: string;      // < 50%
  contextMedium: string;   // 50-80%
  contextHigh: string;     // 80-95%
  contextCritical: string; // > 95%

  // 状态颜色
  success: string;         // 成功/完成
  warning: string;         // 警告
  error: string;           // 错误
  info: string;            // 信息

  // UI 元素颜色
  magenta: string;         // Git 分支、特殊标记
  cyan: string;            // 模型名、工具名
  yellow: string;          // 进行中状态
  green: string;           // 成功状态
  red: string;             // 错误状态
  dim: string;             // 暗淡文本
  reset: string;           // 重置颜色
}

/**
 * 内置颜色主题
 */
export const THEMES: Record<string, ColorTheme> = {
  // 默认主题（终端标准颜色）
  default: {
    name: 'default',
    colors: {
      contextLow: '\x1b[32m',        // green
      contextMedium: '\x1b[33m',     // yellow
      contextHigh: '\x1b[38;5;208m', // orange
      contextCritical: '\x1b[31m',   // red
      success: '\x1b[32m',           // green
      warning: '\x1b[33m',           // yellow
      error: '\x1b[31m',             // red
      info: '\x1b[36m',              // cyan
      magenta: '\x1b[35m',           // magenta
      cyan: '\x1b[36m',              // cyan
      yellow: '\x1b[33m',            // yellow
      green: '\x1b[32m',             // green
      red: '\x1b[31m',               // red
      dim: '\x1b[2m',                // dim
      reset: '\x1b[0m',              // reset
    },
  },

  // Nord 主题（北极风格蓝灰色调）
  nord: {
    name: 'nord',
    colors: {
      contextLow: '\x1b[38;2;143;188;187m',    // nord8 (cyan)
      contextMedium: '\x1b[38;2;235;203;139m',  // nord13 (yellow)
      contextHigh: '\x1b[38;2;208;135;112m',    // nord15 (orange)
      contextCritical: '\x1b[38;2;191;97;106m',  // nord11 (red)
      success: '\x1b[38;2;163;190;140m',        // nord14 (green)
      warning: '\x1b[38;2;235;203;139m',        // nord13 (yellow)
      error: '\x1b[38;2;191;97;106m',           // nord11 (red)
      info: '\x1b[38;2;136;192;208m',           // nord9 (blue)
      magenta: '\x1b[38;2;208;135;112m',        // nord15 (orange)
      cyan: '\x1b[38;2;129;161;193m',           // nord7 (blue)
      yellow: '\x1b[38;2;235;203;139m',         // nord13 (yellow)
      green: '\x1b[38;2;163;190;140m',          // nord14 (green)
      red: '\x1b[38;2;191;97;106m',             // nord11 (red)
      dim: '\x1b[38;2;76;80;91m',               // nord3 (dark gray)
      reset: '\x1b[0m',                         // reset
    },
  },

  // Dracula 主题（深色高对比度）
  dracula: {
    name: 'dracula',
    colors: {
      contextLow: '\x1b[38;2;50;168;82m',       // green
      contextMedium: '\x1b[38;2;241;250;140m',   // yellow
      contextHigh: '\x1b[38;2;255;184;108m',     // orange
      contextCritical: '\x1b[38;2;255;85;85m',   // red
      success: '\x1b[38;2;50;168;82m',           // green
      warning: '\x1b[38;2;241;250;140m',         // yellow
      error: '\x1b[38;2;255;85;85m',             // red
      info: '\x1b[38;2;98;114;164m',             // comment blue
      magenta: '\x1b[38;2;255;121;198m',         // pink
      cyan: '\x1b[38;2;139;233;253m',            // cyan
      yellow: '\x1b[38;2;241;250;140m',          // yellow
      green: '\x1b[38;2;50;168;82m',             // green
      red: '\x1b[38;2;255;85;85m',               // red
      dim: '\x1b[38;2;98;114;164m',              // comment
      reset: '\x1b[0m',                          // reset
    },
  },

  // Monokai 主题（经典深色主题）
  monokai: {
    name: 'monokai',
    colors: {
      contextLow: '\x1b[38;2;166;226;46m',       // green
      contextMedium: '\x1b[38;2;230;219;116m',   // yellow
      contextHigh: '\x1b[38;2;253;151;31m',      // orange
      contextCritical: '\x1b[38;2;249;38;114m',  // red/magenta
      success: '\x1b[38;2;166;226;46m',          // green
      warning: '\x1b[38;2;230;219;116m',          // yellow
      error: '\x1b[38;2;249;38;114m',            // red
      info: '\x1b[38;2;102;217;239m',            // blue
      magenta: '\x1b[38;2;249;38;114m',          // magenta
      cyan: '\x1b[38;2;102;217;239m',            // cyan
      yellow: '\x1b[38;2;230;219;116m',          // yellow
      green: '\x1b[38;2;166;226;46m',            // green
      red: '\x1b[38;2;249;38;114m',              // red
      dim: '\x1b[38;2;80;80;80m',                // gray
      reset: '\x1b[0m',                          // reset
    },
  },

  // Solarized Dark 主题
  solarized: {
    name: 'solarized',
    colors: {
      contextLow: '\x1b[38;2;133;153;0m',        // green
      contextMedium: '\x1b[38;2;181;137;0m',     // yellow
      contextHigh: '\x1b[38;2;203;75;22m',       // orange
      contextCritical: '\x1b[38;2;220;50;47m',   // red
      success: '\x1b[38;2;133;153;0m',           // green
      warning: '\x1b[38;2;181;137;0m',           // yellow
      error: '\x1b[38;2;220;50;47m',             // red
      info: '\x1b[38;2;38;139;210m',             // blue
      magenta: '\x1b[38;2;211;54;130m',          // magenta
      cyan: '\x1b[38;2;42;161;152m',             // cyan
      yellow: '\x1b[38;2;181;137;0m',            // yellow
      green: '\x1b[38;2;133;153;0m',             // green
      red: '\x1b[38;2;220;50;47m',               // red
      dim: '\x1b[38;2;88;110;117m',              // base01
      reset: '\x1b[0m',                          // reset
    },
  },
};

/**
 * 获取颜色主题
 */
export function getTheme(themeName: string, customColors?: Partial<ThemeColors>): ThemeColors {
  // 获取基础主题
  const baseTheme = THEMES[themeName] ?? THEMES.default;

  // 合并自定义颜色
  if (customColors) {
    return { ...baseTheme.colors, ...customColors };
  }

  return baseTheme.colors;
}

/**
 * 获取上下文颜色（根据使用百分比）
 */
export function getContextColor(percent: number, theme: ThemeColors): string {
  if (percent >= 95) return theme.contextCritical;
  if (percent >= 80) return theme.contextHigh;
  if (percent >= 50) return theme.contextMedium;
  return theme.contextLow;
}

/**
 * 验证主题名称
 */
export function isValidTheme(themeName: string): boolean {
  return themeName in THEMES;
}

/**
 * 获取可用主题列表
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEMES);
}

/**
 * 解析十六进制颜色为 ANSI 转义序列
 */
export function hexToAnsi(hex: string): string {
  // 移除 # 前缀
  const cleanHex = hex.replace('#', '');

  // 解析 RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `\x1b[38;2;${r};${g};${b}m`;
}

/**
 * 解析自定义颜色配置
 */
export function parseCustomColors(
  customColors: Record<string, string>
): Partial<ThemeColors> {
  const parsed: Partial<ThemeColors> = {};

  for (const [key, value] of Object.entries(customColors)) {
    // 支持十六进制颜色或直接 ANSI 转义序列
    if (value.startsWith('#')) {
      parsed[key as keyof ThemeColors] = hexToAnsi(value);
    } else if (value.startsWith('\x1b[')) {
      parsed[key as keyof ThemeColors] = value;
    }
  }

  return parsed;
}
