/**
 * 速度追踪 - 计算输出 token 速度（带持久化缓存）
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { StdinInput } from './types.js';

interface SpeedData {
  tokensPerSecond: number | null;
  lastUpdate: number;
}

// === 缓存配置 ===

const SPEED_CACHE_FILE = '.speed-cache.json';
const SPEED_CACHE_TTL_MS = 5000; // 5 秒 TTL

interface SpeedCacheData {
  tokens: number;
  timestamp: number;
}

let speedData: SpeedData = {
  tokensPerSecond: null,
  lastUpdate: 0,
};

const SPEED_UPDATE_INTERVAL = 2000; // 2 秒更新一次
let lastTokenCount = 0;
let lastTimestamp = 0;

/**
 * 获取速度缓存路径
 */
function getCacheFilePath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', SPEED_CACHE_FILE);
}

/**
 * 从文件读取缓存的速度
 */
function readCachedSpeed(now: number): number | null {
  try {
    const cachePath = getCacheFilePath();
    if (!fs.existsSync(cachePath)) return null;

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache: SpeedCacheData = JSON.parse(content);

    // 检查 TTL
    if (now - cache.timestamp >= SPEED_CACHE_TTL_MS) {
      return null;
    }

    // 计算速度：tokens / (time in seconds)
    const timeDiff = (now - cache.timestamp) / 1000;
    if (timeDiff > 0) {
      return cache.tokens / timeDiff;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 将速度写入缓存
 */
function writeCachedSpeed(tokens: number, timestamp: number): void {
  try {
    const cachePath = getCacheFilePath();
    const cacheDir = path.dirname(cachePath);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cache: SpeedCacheData = { tokens, timestamp };
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf-8');
  } catch {
    // 忽略写入失败
  }
}

/**
 * 更新速度数据（使用输出 tokens）
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

  // 写入缓存
  writeCachedSpeed(tokenDiff, now);

  lastTimestamp = now;
  lastTokenCount = currentTokenCount;
}

/**
 * 获取当前速度
 * 优先从文件缓存读取，然后使用内存缓存
 */
export function getSpeed(): number | null {
  const now = Date.now();

  // 首先尝试从文件缓存读取
  const cached = readCachedSpeed(now);
  if (cached !== null) {
    return cached;
  }

  // 如果超过 5 秒没有更新，重置
  if (now - speedData.lastUpdate > 5000) {
    speedData.tokensPerSecond = null;
  }
  return speedData.tokensPerSecond;
}

/**
 * 获取输出速度（从 stdin 数据中读取 output_tokens）
 * 这是主渲染函数使用的函数
 */
export function getOutputSpeed(stdin: StdinInput): number | null {
  const outputTokens = stdin.context_window?.current_usage?.output_tokens ?? 0;
  updateSpeed(outputTokens);
  return getSpeed();
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

/**
 * 清除速度缓存（用于测试）
 */
export function clearSpeedCache(): void {
  try {
    const cachePath = getCacheFilePath();
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // 忽略
  }
}
