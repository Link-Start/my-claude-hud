/**
 * 项目记忆系统 - 跨会话记录项目行为模式
 * 参考 git.ts 的缓存实现模式，实现持久化项目记忆
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { RenderContext, ToolEntry } from './types.js';
import { formatDuration } from './utils/format.js';

// === 类型定义 ===

/**
 * 目录活跃度统计
 */
export interface DirectoryActivity {
  edits: number;
  reads: number;
  lastActive: number;
}

/**
 * 工具调用模式
 */
export interface ToolPattern {
  sequence: string[];
  count: number;
  lastSeen: number;
}

/**
 * 活跃时段统计
 */
export interface ActiveTimeRange {
  hour: number;
  dayOfWeek: number;
  count: number;
}

/**
 * 项目记忆数据
 */
export interface ProjectMemory {
  projectPath: string;
  lastSeen: number;

  // 文件热力图
  fileEdits: Record<string, number>;
  fileReads: Record<string, number>;

  // 目录活跃度
  directoryActivity: Record<string, DirectoryActivity>;

  // 工具调用模式
  toolPatterns: ToolPattern[];

  // 会话统计
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;

  // 时间模式
  activeTimeRanges: ActiveTimeRange[];
}

/**
 * 文件洞察（用于渲染）
 */
export interface FileInsight {
  path: string;
  editCount: number;
  readCount: number;
  lastEditTime: number;
  heatScore: number;
  reads: number;  // 别名，与 readCount 相同
}

/**
 * 缓存文件结构
 */
interface ProjectMemoryCache {
  version: string;
  projects: Record<string, ProjectMemory>;
}

// === 常量 ===

const CACHE_VERSION = '1.0.0';
const MAX_PROJECTS = 100;
const MAX_FILES_PER_PROJECT = 500;
const MAX_TOOL_PATTERNS = 50;
const MAX_TIME_RANGES = 168;  // 7 天 × 24 小时

// === 路径工具 ===

/**
 * 获取缓存文件路径
 */
function getCacheFilePath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.project-memory.json');
}

/**
 * 获取项目唯一标识（使用规范化的项目路径）
 */
function getProjectKey(cwd: string): string {
  return path.resolve(cwd);
}

// === 缓存管理 ===

/**
 * 读取缓存文件
 */
function readCacheFile(): ProjectMemoryCache | null {
  try {
    const cachePath = getCacheFilePath();
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache: ProjectMemoryCache = JSON.parse(content);

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
function writeCacheFile(cache: ProjectMemoryCache): void {
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
 * 清理过期项目（按数量限制）
 */
function cleanOldEntries(cache: ProjectMemoryCache): void {
  const projectKeys = Object.keys(cache.projects);

  if (projectKeys.length <= MAX_PROJECTS) {
    return;
  }

  // 按最后活跃时间排序
  const sorted = projectKeys
    .map(key => ({ key, lastSeen: cache.projects[key].lastSeen }))
    .sort((a, b) => a.lastSeen - b.lastSeen);

  // 删除最旧的项目
  const toRemove = sorted.slice(0, sorted.length - MAX_PROJECTS);
  for (const { key } of toRemove) {
    delete cache.projects[key];
  }
}

/**
 * 限制文件记录数量（保留最活跃的文件）
 */
function limitFileRecords(projectMemory: ProjectMemory): void {
  const fileKeys = Object.keys({ ...projectMemory.fileEdits, ...projectMemory.fileReads });

  if (fileKeys.length <= MAX_FILES_PER_PROJECT) {
    return;
  }

  // 计算文件热度（编辑次数 × 2 + 读取次数）
  const fileHeat = fileKeys.map(key => {
    const edits = projectMemory.fileEdits[key] ?? 0;
    const reads = projectMemory.fileReads[key] ?? 0;
    return { key, heat: edits * 2 + reads };
  });

  // 按热度排序，保留最活跃的文件
  fileHeat.sort((a, b) => b.heat - a.heat);

  // 删除低热度文件
  const toRemove = fileHeat.slice(MAX_FILES_PER_PROJECT);
  for (const { key } of toRemove) {
    delete projectMemory.fileEdits[key];
    delete projectMemory.fileReads[key];
  }
}

// === 项目记忆操作 ===

/**
 * 创建新的项目记忆
 */
function createProjectMemory(projectPath: string): ProjectMemory {
  return {
    projectPath,
    lastSeen: Date.now(),
    fileEdits: {},
    fileReads: {},
    directoryActivity: {},
    toolPatterns: [],
    totalSessions: 0,
    totalDuration: 0,
    averageSessionDuration: 0,
    activeTimeRanges: [],
  };
}

/**
 * 获取项目记忆
 */
export function getProjectMemory(cwd: string): ProjectMemory | null {
  try {
    const cache = readCacheFile();
    if (!cache) {
      return null;
    }

    const projectKey = getProjectKey(cwd);
    return cache.projects[projectKey] ?? null;
  } catch {
    return null;
  }
}

/**
 * 更新项目记忆
 */
export function updateProjectMemory(ctx: RenderContext): void {
  try {
    const cwd = ctx.stdin.cwd;
    if (!cwd) {
      return;
    }

    const projectKey = getProjectKey(cwd);
    let cache = readCacheFile();

    if (!cache) {
      cache = {
        version: CACHE_VERSION,
        projects: {},
      };
    }

    // 清理过期项目
    cleanOldEntries(cache);

    // 获取或创建项目记忆
    let projectMemory = cache.projects[projectKey];
    if (!projectMemory) {
      projectMemory = createProjectMemory(cwd);
    }

    // 更新最后活跃时间
    projectMemory.lastSeen = Date.now();

    // 追踪工具使用
    for (const tool of ctx.transcript.tools) {
      trackToolUsage(tool, projectMemory);
    }

    // 追踪会话
    const sessionDuration = parseSessionDuration(ctx.sessionDuration);
    if (sessionDuration > 0) {
      trackSession(projectMemory, sessionDuration);
    }

    // 追踪活跃时段
    trackActiveTime(projectMemory);

    // 限制文件记录数量
    limitFileRecords(projectMemory);

    // 保存到缓存
    cache.projects[projectKey] = projectMemory;
    writeCacheFile(cache);
  } catch {
    // 忽略更新失败
  }
}

/**
 * 追踪工具使用
 */
function trackToolUsage(tool: ToolEntry, projectMemory: ProjectMemory): void {
  // 获取工具目标（文件路径）
  const target = tool.target;
  if (!target) {
    return;
  }

  // 根据工具类型更新统计
  if (tool.name === 'Read' || tool.name === 'Grep' || tool.name === 'Glob') {
    // 读取类工具
    projectMemory.fileReads[target] = (projectMemory.fileReads[target] ?? 0) + 1;
  } else if (tool.name === 'Edit' || tool.name === 'Write') {
    // 编辑类工具
    projectMemory.fileEdits[target] = (projectMemory.fileEdits[target] ?? 0) + 1;
  }

  // 更新目录活跃度
  const directory = path.dirname(target);
  const dirActivity = projectMemory.directoryActivity[directory] ?? {
    edits: 0,
    reads: 0,
    lastActive: 0,
  };

  if (tool.name === 'Read' || tool.name === 'Grep' || tool.name === 'Glob') {
    dirActivity.reads++;
  } else if (tool.name === 'Edit' || tool.name === 'Write') {
    dirActivity.edits++;
  }

  dirActivity.lastActive = Date.now();
  projectMemory.directoryActivity[directory] = dirActivity;
}

/**
 * 追踪会话
 */
function trackSession(projectMemory: ProjectMemory, duration: number): void {
  projectMemory.totalSessions++;
  projectMemory.totalDuration += duration;
  projectMemory.averageSessionDuration = Math.round(
    projectMemory.totalDuration / projectMemory.totalSessions
  );
}

/**
 * 追踪活跃时段
 */
function trackActiveTime(projectMemory: ProjectMemory): void {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // 查找或创建时段记录
  let timeRange = projectMemory.activeTimeRanges.find(
    r => r.hour === hour && r.dayOfWeek === dayOfWeek
  );

  if (!timeRange) {
    timeRange = { hour, dayOfWeek, count: 0 };
    projectMemory.activeTimeRanges.push(timeRange);

    // 限制时段记录数量
    if (projectMemory.activeTimeRanges.length > MAX_TIME_RANGES) {
      projectMemory.activeTimeRanges.splice(0, 1);
    }
  }

  timeRange.count++;
}

/**
 * 解析会话时长（字符串转毫秒）
 */
function parseSessionDuration(duration: string): number {
  if (!duration) {
    return 0;
  }

  try {
    // 解析格式: "1h 30m", "45m", "<1m" 等
    let total = 0;

    const hourMatch = duration.match(/(\d+)h/);
    if (hourMatch) {
      total += Number.parseInt(hourMatch[1], 10) * 60 * 1000;
    }

    const minMatch = duration.match(/(\d+)m/);
    if (minMatch) {
      total += Number.parseInt(minMatch[1], 10) * 60 * 1000;
    }

    return total;
  } catch {
    return 0;
  }
}

// === 洞察生成 ===

/**
 * 获取最常编辑的文件
 */
export function getMostEditedFiles(
  projectMemory: ProjectMemory,
  limit: number = 5
): FileInsight[] {
  const files: FileInsight[] = [];

  for (const [filePath, editCount] of Object.entries(projectMemory.fileEdits)) {
    const readCount = projectMemory.fileReads[filePath] ?? 0;

    // 计算热度评分（编辑次数 × 2 + 读取次数）
    const heatScore = editCount * 2 + readCount;

    files.push({
      path: filePath,
      editCount,
      readCount,
      reads: readCount,  // 别名
      lastEditTime: projectMemory.lastSeen,  // 简化处理
      heatScore,
    });
  }

  // 按热度排序
  files.sort((a, b) => b.heatScore - a.heatScore);

  return files.slice(0, limit);
}

/**
 * 获取活跃目录
 */
export function getActiveDirectories(
  projectMemory: ProjectMemory,
  limit: number = 3
): string[] {
  const dirs = Object.entries(projectMemory.directoryActivity)
    .map(([dir, activity]) => ({
      dir,
      activity: activity.edits + activity.reads,
    }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, limit)
    .map(({ dir }) => dir);

  return dirs;
}

/**
 * 获取会话统计
 */
export function getSessionStats(projectMemory: ProjectMemory): {
  totalSessions: number;
  avgDuration: string;
} {
  return {
    totalSessions: projectMemory.totalSessions,
    avgDuration: formatDuration(projectMemory.averageSessionDuration),
  };
}

// === 清理操作 ===

/**
 * 清除项目记忆缓存
 */
export function clearProjectMemory(): void {
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
export function getMemoryCacheStats(): {
  count: number;
  projects: Array<{ path: string; sessions: number }>;
} | null {
  try {
    const cache = readCacheFile();
    if (!cache) {
      return { count: 0, projects: [] };
    }

    const projects = Object.values(cache.projects).map(p => ({
      path: p.projectPath,
      sessions: p.totalSessions,
    }));

    return {
      count: projects.length,
      projects,
    };
  } catch {
    return null;
  }
}
