/**
 * 版本检查模块
 * 检查是否有新版本可用
 */

import * as https from 'node:https';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createDebug } from './debug.js';

const debug = createDebug('version-check');

/**
 * 从 package.json 读取当前版本号
 */
function getCurrentVersion(): string {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

// 缓存配置
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时
const CACHE_PATH = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.version-cache.json');

interface VersionCache {
  version: string;
  checkedAt: number;
}

interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  updateUrl: string;
}

/**
 * 从 GitHub API 获取最新版本
 */
async function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/Link-Start/my-claude-hud/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'my-claude-hud',
        'Accept': 'application/vnd.github.v3+json',
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
          debug(`Failed to fetch latest version: HTTP ${res.statusCode}`);
          resolve(null);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const version = parsed.tag_name?.replace(/^v/, '');
          resolve(version || null);
        } catch {
          debug('Failed to parse version response');
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      debug('Failed to fetch latest version: network error');
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      debug('Failed to fetch latest version: timeout');
      resolve(null);
    });

    req.end();
  });
}

/**
 * 从缓存读取最新版本
 */
function readCache(): string | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;

    const content = fs.readFileSync(CACHE_PATH, 'utf-8');
    const cache: VersionCache = JSON.parse(content);

    const now = Date.now();
    if (now - cache.checkedAt >= CACHE_TTL_MS) {
      return null; // 缓存过期
    }

    return cache.version;
  } catch {
    return null;
  }
}

/**
 * 写入缓存
 */
function writeCache(version: string): void {
  try {
    const cacheDir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cache: VersionCache = {
      version,
      checkedAt: Date.now(),
    };

    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf-8');
  } catch {
    // 忽略写入失败
  }
}

/**
 * 检查是否有新版本
 */
export async function checkForUpdate(currentVersion: string): Promise<VersionCheckResult | null> {
  // 首先尝试从缓存读取
  let latestVersion = readCache();

  if (!latestVersion) {
    // 缓存过期或不存在，从 GitHub 获取
    latestVersion = await fetchLatestVersion();

    if (latestVersion) {
      // 写入缓存
      writeCache(latestVersion);
    } else {
      // 获取失败，返回 null
      return null;
    }
  }

  // 比较版本号
  const hasUpdate = compareVersions(currentVersion, latestVersion) < 0;

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    updateUrl: 'https://github.com/Link-Start/my-claude-hud/releases/latest',
  };
}

/**
 * 比较版本号
 * 返回 -1 如果 v1 < v2，0 如果相等，1 如果 v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * 清除版本缓存
 */
export function clearVersionCache(): void {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      fs.unlinkSync(CACHE_PATH);
    }
  } catch {
    // 忽略删除失败
  }
}

/**
 * 自动检查更新（从 package.json 读取当前版本）
 */
export async function checkForUpdateAuto(): Promise<VersionCheckResult | null> {
  const currentVersion = getCurrentVersion();
  return checkForUpdate(currentVersion);
}