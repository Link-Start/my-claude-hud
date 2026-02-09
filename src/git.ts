/**
 * Git 仓库状态获取 - 完整版（含缓存）
 * 使用本地缓存避免频繁执行 git 命令
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import type { GitInfo, FileStats } from './types.js';

// === 类型定义 ===

interface GitCacheData {
  repoPath: string;           // 仓库路径
  branch: string;             // 分支名
  isDirty: boolean;           // 是否有未提交更改
  ahead: number;              // 领先提交数
  behind: number;             // 落后提交数
  fileStats: FileStats;       // 文件统计
  timestamp: number;          // 缓存时间戳
}

interface GitCacheFile {
  version: string;            // 缓存格式版本
  repositories: Record<string, GitCacheData>;  // 仓库路径 -> 缓存数据
}

// === 常量 ===

const CACHE_VERSION = '1.0.0';
const CACHE_TTL_MS = 5000;  // 缓存有效期 5 秒
const MAX_CACHE_SIZE = 50;  // 最多缓存 50 个仓库

// === 路径工具 ===

/**
 * 获取缓存文件路径
 */
function getCacheFilePath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.git-cache.json');
}

/**
 * 获取仓库的唯一标识（使用规范化路径）
 */
function getRepoKey(cwd: string): string {
  // 规范化路径
  const normalized = path.resolve(cwd);
  // 尝试获取 .git 目录位置作为更精确的仓库标识
  try {
    const gitDir = execSync('git rev-parse --git-dir', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return path.resolve(cwd, gitDir);
  } catch {
    return normalized;
  }
}

// === 缓存管理 ===

/**
 * 读取缓存文件
 */
function readCacheFile(): GitCacheFile | null {
  try {
    const cachePath = getCacheFilePath();
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache: GitCacheFile = JSON.parse(content);

    // 验证版本
    if (cache.version !== CACHE_VERSION) {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

/**
 * 写入缓存文件
 */
function writeCacheFile(cache: GitCacheFile): void {
  try {
    const cachePath = getCacheFilePath();
    const cacheDir = path.dirname(cachePath);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // 忽略写入失败
  }
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache(cache: GitCacheFile, now: number): void {
  const keys = Object.keys(cache.repositories);
  let removed = 0;

  for (const key of keys) {
    const data = cache.repositories[key];
    if (now - data.timestamp > CACHE_TTL_MS) {
      delete cache.repositories[key];
      removed++;
    }
  }

  // 如果缓存仍然过大，删除最旧的条目
  const remaining = Object.keys(cache.repositories);
  if (remaining.length > MAX_CACHE_SIZE) {
    // 按时间戳排序
    const sorted = remaining
      .map(key => ({ key, timestamp: cache.repositories[key].timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // 删除最旧的条目
    const toRemove = sorted.slice(0, sorted.length - MAX_CACHE_SIZE);
    for (const { key } of toRemove) {
      delete cache.repositories[key];
      removed++;
    }
  }
}

/**
 * 从缓存获取 Git 状态
 */
function getFromCache(repoKey: string): GitInfo | null {
  const cache = readCacheFile();
  if (!cache || !cache.repositories[repoKey]) {
    return null;
  }

  const data = cache.repositories[repoKey];
  const now = Date.now();

  // 检查是否过期
  if (now - data.timestamp > CACHE_TTL_MS) {
    return null;
  }

  return {
    branch: data.branch,
    isDirty: data.isDirty,
    ahead: data.ahead,
    behind: data.behind,
    fileStats: data.fileStats,
  };
}

/**
 * 保存到缓存
 */
function saveToCache(repoKey: string, gitInfo: GitInfo, repoPath: string): void {
  const now = Date.now();
  let cache = readCacheFile();

  if (!cache) {
    cache = {
      version: CACHE_VERSION,
      repositories: {},
    };
  }

  // 清理过期缓存
  cleanExpiredCache(cache, now);

  // 保存当前数据
  cache.repositories[repoKey] = {
    repoPath,
    branch: gitInfo.branch,
    isDirty: gitInfo.isDirty,
    ahead: gitInfo.ahead,
    behind: gitInfo.behind,
    fileStats: gitInfo.fileStats ?? { modified: 0, added: 0, deleted: 0, untracked: 0 },
    timestamp: now,
  };

  writeCacheFile(cache);
}

// === Git 状态获取 ===

/**
 * 获取当前 Git 仓库的状态信息（带缓存）
 */
export function getGitStatus(cwd: string): GitInfo | null {
  try {
    // 检查是否在 Git 仓库中
    execSync('git rev-parse --git-dir', { cwd, stdio: 'ignore' });
  } catch {
    return null;
  }

  // 获取仓库唯一标识
  const repoKey = getRepoKey(cwd);

  // 尝试从缓存获取
  const cached = getFromCache(repoKey);
  if (cached) {
    return cached;
  }

  // 缓存未命中，执行 git 命令获取最新状态
  try {
    // 获取当前分支
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();

    // 解析文件统计
    const fileStats = parseFileStats(cwd);
    const isDirty = fileStats.modified > 0 || fileStats.added > 0 || fileStats.deleted > 0 || fileStats.untracked > 0;

    // 获取 ahead/behind 信息
    let ahead = 0;
    let behind = 0;

    try {
      const aheadBehind = execSync('git rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo ""', {
        cwd,
        encoding: 'utf-8',
      }).trim();

      if (aheadBehind) {
        const match = aheadBehind.match(/^(\d+)\s+(\d+)$/);
        if (match) {
          ahead = Number.parseInt(match[2], 10);
          behind = Number.parseInt(match[1], 10);
        }
      }
    } catch {
      // 忽略错误，使用默认值 0
    }

    const result: GitInfo = {
      branch,
      isDirty,
      ahead,
      behind,
      fileStats,
    };

    // 保存到缓存
    saveToCache(repoKey, result, cwd);

    return result;
  } catch {
    return null;
  }
}

/**
 * 解析 git status --porcelain 输出为文件统计
 * Starship 兼容格式：!modified +added ✘deleted ?untracked
 */
function parseFileStats(cwd: string): FileStats {
  const result: FileStats = {
    modified: 0,
    added: 0,
    deleted: 0,
    untracked: 0,
  };

  try {
    const statusOutput = execSync('git --no-optional-locks status --porcelain', { cwd, encoding: 'utf-8' });

    for (const line of statusOutput.split('\n')) {
      if (!line) continue;

      // ?? 开头是未跟踪文件
      if (line.startsWith('??')) {
        result.untracked++;
        continue;
      }

      if (line.length < 2) continue;

      const index = line[0];    // 暂存区状态
      const worktree = line[1]; // 工作区状态

      // 已暂存的添加
      if (index === 'A') {
        result.added++;
      }
      // 已暂存的删除
      else if (index === 'D') {
        result.deleted++;
      }
      // 已暂存的修改、重命名、复制
      else if (index === 'M' || index === 'R' || index === 'C') {
        result.modified++;
      }
      // 工作区的删除（暂存区没有删除）
      else if (index !== 'D' && worktree === 'D') {
        result.deleted++;
      }
      // 工作区的修改（暂存区没有修改）
      else if (index !== 'M' && worktree === 'M') {
        result.modified++;
      }
    }
  } catch {
    // 出错时返回零值
  }

  return result;
}

/**
 * 格式化 Git 状态显示
 */
export function formatGitStatus(git: GitInfo, showDirty: boolean, showAheadBehind: boolean, showFileStats: boolean): string {
  const parts: string[] = [];

  parts.push(git.branch);

  const details: string[] = [];

  if (showFileStats && git.fileStats) {
    const fs = git.fileStats;
    const stats: string[] = [];
    if (fs.modified > 0) stats.push(`!${fs.modified}`);
    if (fs.added > 0) stats.push(`+${fs.added}`);
    if (fs.deleted > 0) stats.push(`✘${fs.deleted}`);
    if (fs.untracked > 0) stats.push(`?${fs.untracked}`);
    if (stats.length > 0) {
      details.push(stats.join(' '));
    }
  }

  if (showAheadBehind) {
    if (git.ahead > 0) details.push(`↑${git.ahead}`);
    if (git.behind > 0) details.push(`↓${git.behind}`);
  }

  if (showDirty && git.isDirty && details.length === 0) {
    parts.push('*');
  } else if (details.length > 0) {
    parts.push(`(${details.join(',')})`);
  }

  return parts.join(' ');
}

/**
 * 清除 Git 缓存
 */
export function clearGitCache(): void {
  try {
    const cachePath = getCacheFilePath();
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // 忽略
  }
}

/**
 * 获取缓存统计信息（用于调试）
 */
export function getGitCacheStats(): { count: number; repositories: string[] } | null {
  try {
    const cache = readCacheFile();
    if (!cache) {
      return { count: 0, repositories: [] };
    }

    const repositories = Object.keys(cache.repositories);
    return {
      count: repositories.length,
      repositories,
    };
  } catch {
    return null;
  }
}
