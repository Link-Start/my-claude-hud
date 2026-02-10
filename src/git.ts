/**
 * Git 仓库状态获取 - 完整版（含缓存）
 * 使用本地缓存避免频繁执行 git 命令
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import type { GitInfo, FileStats } from './types.js';
import { getCacheConfig } from './cache-config.js';
import { createDebug } from './debug.js';

const debug = createDebug('git');

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

// 缓存配置（可通过 setCacheConfig 更新）
let cacheConfig = getCacheConfig();

/**
 * 设置缓存配置
 * @param config - 用户配置（可选）
 */
export function setGitCacheConfig(config?: import('./types.js').HudConfig): void {
  cacheConfig = getCacheConfig(config);
}

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
  // 简化：直接使用规范化路径
  // git status 会在非 git 仓库中抛出错误
  return path.resolve(cwd);
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
    // 缓存读取失败，返回 null
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
    if (now - data.timestamp > cacheConfig.git.ttlMs) {
      delete cache.repositories[key];
      removed++;
    }
  }

  // 如果缓存仍然过大，删除最旧的条目
  const remaining = Object.keys(cache.repositories);
  if (remaining.length > cacheConfig.git.maxRepositories) {
    // 按时间戳排序
    const sorted = remaining
      .map(key => ({ key, timestamp: cache.repositories[key].timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // 删除最旧的条目
    const toRemove = sorted.slice(0, sorted.length - cacheConfig.git.maxRepositories);
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
  if (now - data.timestamp > cacheConfig.git.ttlMs) {
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
 * 优化版本：使用 git status -b --porcelain 合并多个命令
 */
export function getGitStatus(cwd: string): GitInfo | null {
  // 获取仓库唯一标识
  const repoKey = getRepoKey(cwd);

  // 尝试从缓存获取
  const cached = getFromCache(repoKey);
  if (cached) {
    return cached;
  }

  // 缓存未命中，执行 git 命令获取最新状态
  try {
    // 使用单一命令获取所有 Git 状态信息
    // git status -b --porcelain 输出格式：
    // ## branchName...origin/upstream [ahead N, behind M]
    // XY filename
    const output = execSync('git status -b --porcelain', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // 抑制错误输出
    });

    const result = parseGitStatusOutput(output);

    // 保存到缓存
    if (result) {
      saveToCache(repoKey, result, cwd);
    }

    return result;
  } catch (error) {
    debug('Failed to get git status', error instanceof Error ? error.message : 'Unknown error', cwd);
    return null;
  }
}

/**
 * 解析 git status -b --porcelain 输出
 */
function parseGitStatusOutput(output: string): GitInfo | null {
  const lines = output.split('\n').filter(line => line.length > 0);
  if (lines.length === 0) {
    return null;
  }

  // 第一行是分支信息和 ahead/behind
  // 格式: ## branchName...origin/upstream [ahead N, behind M]
  // 或: ## branchName (无 upstream)
  const headerLine = lines[0];
  const headerMatch = headerLine.match(/^##\s+(\S+)(?:\.\.\.(\S+)(?:\s+\[([^\]]+)\])?)?/);

  if (!headerMatch) {
    return null;
  }

  const branch = headerMatch[1];
  let ahead = 0;
  let behind = 0;

  // 解析 ahead/behind 信息
  if (headerMatch[3]) {
    const aheadBehind = headerMatch[3];
    const aheadMatch = aheadBehind.match(/ahead\s+(\d+)/);
    const behindMatch = aheadBehind.match(/behind\s+(\d+)/);
    if (aheadMatch) ahead = Number.parseInt(aheadMatch[1], 10);
    if (behindMatch) behind = Number.parseInt(behindMatch[1], 10);
  }

  // 解析文件状态
  const fileStats = parseFileStatusLines(lines.slice(1));
  const isDirty = fileStats.modified > 0 || fileStats.added > 0 || fileStats.deleted > 0 || fileStats.untracked > 0;

  return {
    branch,
    isDirty,
    ahead,
    behind,
    fileStats,
  };
}

/**
 * 解析文件状态行
 */
function parseFileStatusLines(lines: string[]): FileStats {
  const result: FileStats = {
    modified: 0,
    added: 0,
    deleted: 0,
    untracked: 0,
  };

  for (const line of lines) {
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
    // 已暂存的修改
    else if (index === 'M') {
      result.modified++;
    }

    // 工作区的修改（不在暂存区）
    if (worktree === 'M' && index !== 'M') {
      result.modified++;
    }
    // 工作区的删除（不在暂存区）
    else if (worktree === 'D' && index !== 'D') {
      result.deleted++;
    }
    // 工作区的添加（未暂存的新文件）
    else if (worktree === 'A' && index !== 'A') {
      result.added++;
    }
    // 重命名
    else if (index === 'R' || worktree === 'R') {
      result.modified++;
    }
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
    // 缓存读取失败，返回 null
    return null;
  }
}
