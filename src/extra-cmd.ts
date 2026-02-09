/**
 * 额外命令支持 - 通过 --extra-cmd 参数添加自定义标签
 * 参考 claude-hud 实现
 */

import { execSync } from 'node:child_process';

// === 配置常量 ===

const MAX_LABEL_LENGTH = 50;
const TIMEOUT_MS = 3000;
const MAX_BUFFER = 10 * 1024; // 10KB

// === 类型定义 ===

interface ExtraCmdOutput {
  label: string;
}

// === 公共函数 ===

/**
 * 从 process.argv 解析 --extra-cmd 参数
 * 支持格式：
 * --extra-cmd "command"
 * --extra-cmd="command"
 */
export function parseExtraCmdArg(argv: string[]): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // --extra-cmd "command" 格式
    if (arg === '--extra-cmd') {
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        return nextArg;
      }
    }

    // --extra-cmd="command" 格式
    if (arg.startsWith('--extra-cmd=')) {
      return arg.slice('--extra-cmd='.length);
    }
  }

  return null;
}

/**
 * 执行命令并返回标签
 * 命令应输出 JSON: { "label": "string" }
 */
export function runExtraCmd(command: string): string | null {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // 解析 JSON 输出
    const result: ExtraCmdOutput = JSON.parse(output.trim());

    if (typeof result.label !== 'string') {
      return null;
    }

    // 清理标签
    const sanitized = sanitize(result.label);

    // 截断到最大长度
    if (sanitized.length > MAX_LABEL_LENGTH) {
      return sanitized.slice(0, MAX_LABEL_LENGTH - 3) + '...';
    }

    return sanitized;
  } catch {
    return null;
  }
}

/**
 * 清理字符串以防止终端注入
 * 移除 ANSI 转义序列、OSC 序列、控制字符和双向控制字符
 */
export function sanitize(input: string): string {
  // 移除 ANSI CSI 转义序列 (ESC [ ... 可打印字符)
  let sanitized = input.replace(/\x1b\[[0-9;]*[mGKHf]/g, '');

  // 移除 ANSI OSC 序列 (ESC ] ... BEL/ESC \)
  sanitized = sanitized.replace(/\x1b\][^\x07\x1b]*[\x07\x1b\\]/g, '');

  // 移除其他控制字符（保留换行符、制表符）
  sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

  // 移除双向控制字符（可能用于文本方向欺骗）
  sanitized = sanitized.replace(/[\u202a-\u202e\u2066-\u2069]/g, '');

  return sanitized;
}
