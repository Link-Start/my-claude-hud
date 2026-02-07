/**
 * 速度追踪 - 计算处理速度
 */

interface SpeedData {
  tokensPerSecond: number | null;
  lastUpdate: number;
}

let speedData: SpeedData = {
  tokensPerSecond: null,
  lastUpdate: 0,
};

const SPEED_UPDATE_INTERVAL = 2000; // 2 秒更新一次
let lastTokenCount = 0;
let lastTimestamp = 0;

/**
 * 更新速度数据
 */
export function updateSpeed(currentTokenCount: number): void {
  const now = Date.now();

  if (lastTimestamp === 0) {
    lastTimestamp = now;
    lastTokenCount = currentTokenCount;
    return;
  }

  const timeDiff = now - lastTimestamp;
  if (timeDiff < SPEED_UPDATE_INTERVAL) {
    return;
  }

  const tokenDiff = currentTokenCount - lastTokenCount;
  const tokensPerSecond = Math.round((tokenDiff / timeDiff) * 1000);

  speedData.tokensPerSecond = tokensPerSecond;
  speedData.lastUpdate = now;

  lastTimestamp = now;
  lastTokenCount = currentTokenCount;
}

/**
 * 获取当前速度
 */
export function getSpeed(): number | null {
  // 如果超过 5 秒没有更新，重置
  if (Date.now() - speedData.lastUpdate > 5000) {
    speedData.tokensPerSecond = null;
  }
  return speedData.tokensPerSecond;
}

/**
 * 格式化速度显示
 */
export function formatSpeed(tokensPerSecond: number): string {
  if (tokensPerSecond < 1000) {
    return `${tokensPerSecond} t/s`;
  }
  return `${(tokensPerSecond / 1000).toFixed(1)}k t/s`;
}
