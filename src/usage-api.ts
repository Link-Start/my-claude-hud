/**
 * API 使用量查询 - 完整实现
 * 包含：Keychain 读取、文件缓存、失败退避、API 请求
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as https from 'node:https';
import { execFileSync } from 'node:child_process';
import type { UsageData } from './types.js';
import { getCacheConfig } from './cache-config.js';

// === 类型定义 ===

interface CredentialsFile {
  claudeAiOauth?: {
    accessToken?: string;
    refreshToken?: string;
    subscriptionType?: string;
    rateLimitTier?: string;
    expiresAt?: number;
    scopes?: string[];
  };
}

interface UsageApiResponse {
  five_hour?: {
    utilization?: number;
    resets_at?: string;
  };
  seven_day?: {
    utilization?: number;
    resets_at?: string;
  };
}

interface UsageApiResult {
  data: UsageApiResponse | null;
  error?: string;
}

interface CacheFile {
  data: UsageData;
  timestamp: number;
}

// === 常量 ===

const KEYCHAIN_TIMEOUT_MS = 5000;

// 缓存配置（可通过 setUsageCacheConfig 更新）
let cacheConfig = getCacheConfig();

/**
 * 设置缓存配置
 * @param config - 用户配置（可选）
 */
export function setUsageCacheConfig(config?: import('./types.js').HudConfig): void {
  cacheConfig = getCacheConfig(config);
}

// === 路径工具 ===

function getCachePath(homeDir: string): string {
  return path.join(homeDir, '.claude', 'plugins', 'my-claude-hud', '.usage-cache.json');
}

function getKeychainBackoffPath(homeDir: string): string {
  return path.join(homeDir, '.claude', 'plugins', 'my-claude-hud', '.keychain-backoff');
}

function getCredentialsPath(homeDir: string): string {
  return path.join(homeDir, '.claude', '.credentials.json');
}

// === 缓存管理 ===

function readCache(homeDir: string, now: number): UsageData | null {
  try {
    const cachePath = getCachePath(homeDir);
    if (!fs.existsSync(cachePath)) return null;

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache: CacheFile = JSON.parse(content);

    // 检查 TTL - 失败结果使用更短的 TTL
    const ttl = cache.data.apiUnavailable ? cacheConfig.api.failureTtlMs : cacheConfig.api.ttlMs;
    if (now - cache.timestamp >= ttl) return null;

    // JSON.stringify 将 Date 转为 ISO 字符串，读取时需要转换回来
    const data = cache.data;
    if (data.fiveHourResetAt) {
      data.fiveHourResetAt = new Date(data.fiveHourResetAt as unknown as string);
    }
    if (data.sevenDayResetAt) {
      data.sevenDayResetAt = new Date(data.sevenDayResetAt as unknown as string);
    }

    return data;
  } catch {
    return null;
  }
}

function writeCache(homeDir: string, data: UsageData, timestamp: number): void {
  try {
    const cachePath = getCachePath(homeDir);
    const cacheDir = path.dirname(cachePath);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cache: CacheFile = { data, timestamp };
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf-8');
  } catch {
    // 忽略缓存写入失败
  }
}

// === Keychain 管理 ===

/**
 * 检查是否处于 Keychain 退避期
 * 防止每次渲染都重新提示用户
 */
function isKeychainBackoff(homeDir: string, now: number): boolean {
  try {
    const backoffPath = getKeychainBackoffPath(homeDir);
    if (!fs.existsSync(backoffPath)) return false;
    const timestamp = parseInt(fs.readFileSync(backoffPath, 'utf-8'), 10);
    return now - timestamp < cacheConfig.api.keychainBackoffMs;
  } catch {
    return false;
  }
}

/**
 * 记录 Keychain 失败以进行退避
 */
function recordKeychainFailure(homeDir: string, now: number): void {
  try {
    const backoffPath = getKeychainBackoffPath(homeDir);
    const dir = path.dirname(backoffPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(backoffPath, String(now), 'utf-8');
  } catch {
    // 忽略写入失败
  }
}

/**
 * 从 macOS Keychain 读取凭证
 * Claude Code 2.x 将 OAuth 凭证存储在 macOS Keychain 的 "Claude Code-credentials" 下
 *
 * 安全性：使用 execFileSync 和绝对路径避免 shell 注入和 PATH 劫持
 */
function readKeychainCredentials(now: number, homeDir: string): { accessToken: string; subscriptionType: string } | null {
  // 仅在 macOS 上可用
  if (process.platform !== 'darwin') {
    return null;
  }

  // 检查退避期，避免失败后每次渲染都重新提示
  if (isKeychainBackoff(homeDir, now)) {
    return null;
  }

  try {
    // 使用 security 命令从 macOS Keychain 读取
    const keychainData = execFileSync(
      '/usr/bin/security',
      ['find-generic-password', '-s', 'Claude Code-credentials', '-w'],
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: KEYCHAIN_TIMEOUT_MS }
    ).trim();

    if (!keychainData) {
      return null;
    }

    const data: CredentialsFile = JSON.parse(keychainData);
    return parseCredentialsData(data, now);
  } catch (error) {
    // 记录失败以进行退避
    recordKeychainFailure(homeDir, now);
    return null;
  }
}

/**
 * 从文件读取凭证（旧版本方法）
 * 旧版本的 Claude Code 将凭证存储在 ~/.claude/.credentials.json
 */
function readFileCredentials(homeDir: string, now: number): { accessToken: string; subscriptionType: string } | null {
  const credentialsPath = getCredentialsPath(homeDir);

  if (!fs.existsSync(credentialsPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(credentialsPath, 'utf-8');
    const data: CredentialsFile = JSON.parse(content);
    return parseCredentialsData(data, now);
  } catch {
    return null;
  }
}

/**
 * 解析和验证凭证数据
 */
function parseCredentialsData(data: CredentialsFile, now: number): { accessToken: string; subscriptionType: string } | null {
  const accessToken = data.claudeAiOauth?.accessToken;
  const subscriptionType = data.claudeAiOauth?.subscriptionType ?? '';

  if (!accessToken) {
    return null;
  }

  // 检查 token 是否过期（expiresAt 是 Unix 毫秒时间戳）
  const expiresAt = data.claudeAiOauth?.expiresAt;
  if (expiresAt != null && expiresAt <= now) {
    return null;
  }

  return { accessToken, subscriptionType };
}

/**
 * 读取 OAuth 凭证
 * 优先尝试 macOS Keychain（Claude Code 2.x），
 * 然后回退到基于文件的凭证（旧版本）
 */
function readCredentials(
  homeDir: string,
  now: number,
  readKeychain: (now: number, homeDir: string) => { accessToken: string; subscriptionType: string } | null
): { accessToken: string; subscriptionType: string } | null {
  // 首先尝试 macOS Keychain（Claude Code 2.x）
  const keychainCreds = readKeychain(now, homeDir);
  if (keychainCreds) {
    if (keychainCreds.subscriptionType) {
      return keychainCreds;
    }
    // Keychain 有 token 但没有 subscriptionType - 尝试从文件补充
    const fileCreds = readFileCredentials(homeDir, now);
    if (fileCreds?.subscriptionType) {
      return {
        accessToken: keychainCreds.accessToken,
        subscriptionType: fileCreds.subscriptionType,
      };
    }
    // 没有可用的 subscriptionType - 仍然使用 keychain token
    return keychainCreds;
  }

  // 回退到基于文件的凭证（旧版本或非 macOS）
  return readFileCredentials(homeDir, now);
}

// === 工具函数 ===

/**
 * 获取计划名称
 */
function getPlanName(subscriptionType: string): string | null {
  const lower = subscriptionType.toLowerCase();
  if (lower.includes('max')) return 'Max';
  if (lower.includes('pro')) return 'Pro';
  if (lower.includes('team')) return 'Team';
  // API 用户没有 subscriptionType 或为 'api'
  if (!subscriptionType || lower.includes('api')) return null;
  // 未知的订阅类型 - 首字母大写显示
  return subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
}

/**
 * 解析使用率值，限制在 0-100 并处理 NaN/Infinity
 */
function parseUtilization(value: number | undefined): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(100, value)));
}

/**
 * 安全解析 ISO 日期字符串
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

// === API 请求 ===

/**
 * 从 Anthropic API 获取 OAuth 使用量数据
 */
function fetchUsageApi(accessToken: string): Promise<UsageApiResult> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/api/oauth/usage',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'User-Agent': 'my-claude-hud/1.0',
      },
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve({ data: null, error: res.statusCode ? `http-${res.statusCode}` : 'http-error' });
          return;
        }

        try {
          const parsed: UsageApiResponse = JSON.parse(data);
          resolve({ data: parsed });
        } catch {
          resolve({ data: null, error: 'parse' });
        }
      });
    });

    req.on('error', () => {
      resolve({ data: null, error: 'network' });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ data: null, error: 'timeout' });
    });

    req.end();
  });
}

// === 主函数 ===

/**
 * 获取 API 使用量数据
 * 如果用户是 API 用户（没有 OAuth 凭证）或凭证已过期，返回 null
 * 如果 API 调用失败，返回 { apiUnavailable: true, ... }（在 HUD 中显示警告）
 *
 * 使用基于文件的缓存，因为 HUD 每次渲染都作为新进程运行（约 300ms）
 * 缓存 TTL：成功 60 秒，失败 15 秒
 */
export async function getApiUsage(): Promise<UsageData | null> {
  const now = Date.now();
  const homeDir = os.homedir();

  // 首先检查文件缓存
  const cached = readCache(homeDir, now);
  if (cached) {
    return cached;
  }

  try {
    const credentials = readCredentials(homeDir, now, readKeychainCredentials);
    if (!credentials) {
      return null;
    }

    const { accessToken, subscriptionType } = credentials;

    // 从 subscriptionType 确定计划名称
    const planName = getPlanName(subscriptionType);
    if (!planName) {
      // API 用户，没有使用量限制需要显示
      return null;
    }

    // 从 API 获取使用量
    const apiResult = await fetchUsageApi(accessToken);
    if (!apiResult.data) {
      // API 调用失败，缓存失败结果以防止重试风暴
      const failureResult: UsageData = {
        planName,
        fiveHour: null,
        sevenDay: null,
        fiveHourResetAt: null,
        sevenDayResetAt: null,
        apiUnavailable: true,
        apiError: apiResult.error,
      };
      writeCache(homeDir, failureResult, now);
      return failureResult;
    }

    // 解析响应 - API 直接返回 0-100 百分比
    const fiveHour = parseUtilization(apiResult.data.five_hour?.utilization);
    const sevenDay = parseUtilization(apiResult.data.seven_day?.utilization);

    const fiveHourResetAt = parseDate(apiResult.data.five_hour?.resets_at);
    const sevenDayResetAt = parseDate(apiResult.data.seven_day?.resets_at);

    const result: UsageData = {
      planName,
      fiveHour,
      sevenDay,
      fiveHourResetAt,
      sevenDayResetAt,
    };

    // 写入文件缓存
    writeCache(homeDir, result, now);

    return result;
  } catch {
    return null;
  }
}

/**
 * 清除缓存（用于测试）
 */
export function clearCache(): void {
  try {
    const cachePath = getCachePath(os.homedir());
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // 忽略
  }
}
