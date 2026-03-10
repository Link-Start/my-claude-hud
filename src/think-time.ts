/**
 * 思考时间追踪模块
 * 记录 Claude Code 刷新 HUD 的时间间隔，作为"思考时间"的近似值
 * 
 * 注意：这是 UI 刷新间隔，不是真正的 API 思考时间
 * 真正的 API 思考时间只有 Claude Code 官方能提供
 */

let lastRenderTime: number = 0;
let thinkTimeHistory: number[] = [];
const MAX_HISTORY = 10; // 保留最近10次的记录

/**
 * 记录当前渲染时间并返回思考时间
 * 
 * @returns 上一次渲染到现在的毫秒数（首次调用返回0）
 */
export function recordThinkTime(): number {
  const now = Date.now();
  
  if (lastRenderTime === 0) {
    // 首次调用，记录时间但不计算差值
    lastRenderTime = now;
    return 0;
  }
  
  const thinkTime = now - lastRenderTime;
  lastRenderTime = now;
  
  // 记录到历史（排除异常值）
  // 思考时间应该在 100ms 到 5分钟 之间才记录
  if (thinkTime >= 100 && thinkTime <= 5 * 60 * 1000) {
    thinkTimeHistory.push(thinkTime);
    if (thinkTimeHistory.length > MAX_HISTORY) {
      thinkTimeHistory.shift();
    }
  }
  
  return thinkTime;
}

/**
 * 获取当前累计的思考时间（从会话开始）
 * 这个需要在会话开始时重置
 */
let sessionThinkTime: number = 0;

let isSessionStart: boolean = true;

/**
 * 开始新的思考时间追踪会话
 * 在会话开始时调用
 */
export function startThinkTimeSession(): void {
  lastRenderTime = 0;
  thinkTimeHistory = [];
  sessionThinkTime = 0;
  isSessionStart = true;
}

/**
 * 记录并累加思考时间
 * 
 * @returns 本次思考时间（毫秒）
 */
export function trackThinkTime(): number {
  const thinkTime = recordThinkTime();
  
  if (!isSessionStart && thinkTime > 0) {
    sessionThinkTime += thinkTime;
  }
  isSessionStart = false;
  
  return thinkTime;
}

/**
 * 获取平均思考时间
 * 
 * @returns 平均思考时间（毫秒），如果没有历史记录返回0
 */
export function getAverageThinkTime(): number {
  if (thinkTimeHistory.length === 0) {
    return 0;
  }
  
  const sum = thinkTimeHistory.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / thinkTimeHistory.length);
}

/**
 * 获取本次会话的总思考时间
 * 
 * @returns 总思考时间（毫秒）
 */
export function getSessionThinkTime(): number {
  return sessionThinkTime;
}

/**
 * 获取思考时间历史记录
 * 
 * @returns 思考时间数组（毫秒）
 */
export function getThinkTimeHistory(): number[] {
  return [...thinkTimeHistory];
}

/**
 * 格式化思考时间显示
 * 
 * @param milliseconds 毫秒数
 * @returns 格式化的字符串，如 "2.3s"、"45s"、"1m 20s"
 */
export function formatThinkTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.round(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * 获取思考时间的友好描述
 * 
 * @param milliseconds 毫秒数
 * @returns 描述文字
 */
export function getThinkTimeDescription(milliseconds: number): string {
  if (milliseconds === 0) {
    return '首次渲染';
  }
  
  if (milliseconds < 500) {
    return '非常快';
  }
  
  if (milliseconds < 2000) {
    return '较快';
  }
  
  if (milliseconds < 5000) {
    return '正常';
  }
  
  if (milliseconds < 10000) {
    return '较慢';
  }
  
  return '很慢';
}

/**
 * 获取思考时间的颜色级别
 * 用于在 HUD 中显示颜色
 * 
 * @param milliseconds 毫秒数
 * @returns 'fast' | 'normal' | 'slow'
 */
export function getThinkTimeLevel(milliseconds: number): 'fast' | 'normal' | 'slow' {
  if (milliseconds < 2000) {
    return 'fast';
  }
  
  if (milliseconds < 5000) {
    return 'normal';
  }
  
  return 'slow';
}
