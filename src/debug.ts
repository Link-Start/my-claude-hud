/**
 * 调试日志工具
 * 参考 claude-hud 实现
 * 通过 DEBUG=claude-hud 或 DEBUG=* 环境变量启用
 */

// === 状态 ===

const DEBUG_ENABLED = process.env.DEBUG?.includes('my-claude-hud') || process.env.DEBUG === '*';

// === 类型定义 ===

type DebugLogger = (message: string, ...args: unknown[]) => void;

// === 公共函数 ===

/**
 * 创建命名空间的调试日志器
 * @param namespace - 命名空间后缀
 * @returns 调试日志函数，未启用时为空函数
 */
export function createDebug(namespace: string): DebugLogger {
  if (!DEBUG_ENABLED) {
    return () => {
      // 空函数
    };
  }

  const prefix = `[my-claude-hud:${namespace}]`;

  return (message: string, ...args: unknown[]) => {
    console.error(`${prefix} ${message}`, ...args);
  };
}

/**
 * 检查调试是否启用
 */
export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}
