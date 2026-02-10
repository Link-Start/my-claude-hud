/**
 * 调试日志工具
 * 参考 claude-hud 实现
 * 通过 DEBUG=claude-hud 或 DEBUG=* 环境变量启用
 */

// === 状态 ===

const DEBUG_ENABLED = process.env.DEBUG?.includes('my-claude-hud') || process.env.DEBUG === '*';

// === 类型定义 ===

type DebugLogger = (message: string, ...args: unknown[]) => void;

/**
 * 性能计时器接口
 */
export interface PerformanceTimer {
  start: (operation: string) => void;
  end: (operation: string) => number;
}

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
 * 创建性能计时器
 * 用于跟踪各操作的执行时间
 *
 * @param namespace - 命名空间后缀
 * @returns 性能计时器对象
 *
 * @example
 * const timer = createTimer('transcript');
 * timer.start('parse');
 * // ... 执行操作
 * const duration = timer.end('parse'); // 返回毫秒数
 */
export function createTimer(namespace: string): PerformanceTimer {
  const debug = createDebug(namespace);
  const timers = new Map<string, number>();

  return {
    start: (operation: string) => {
      if (DEBUG_ENABLED) {
        timers.set(operation, performance.now());
      }
    },
    end: (operation: string): number => {
      if (!DEBUG_ENABLED) {
        return 0;
      }
      const start = timers.get(operation);
      if (start === undefined) {
        debug(`Warning: timer.end('${operation}') called without timer.start()`);
        return 0;
      }
      const duration = performance.now() - start;
      timers.delete(operation);
      debug(`${operation}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
}

/**
 * 检查调试是否启用
 */
export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}
