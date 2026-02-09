/**
 * 项目记忆行渲染 - 显示项目行为模式洞察
 * 参考 tools-line.ts 的渲染模式
 */

import type { RenderContext } from '../types.js';
import { getProjectMemory, getMostEditedFiles, getActiveDirectories, getSessionStats } from '../project-memory.js';
import { dim, yellow, cyan, green } from './colors.js';

/**
 * 格式化文件路径（简化显示）
 */
function formatFilePath(filePath: string, cwd?: string): string {
  if (!cwd) {
    // 移除常见前缀
    const segments = filePath.replace(/\\/g, '/').split('/');
    return segments.length > 3 ? segments.slice(-3).join('/') : filePath;
  }

  try {
    // 尝试转换为相对路径
    const relative = filePath.replace(cwd, '').replace(/^[\/\\]/, '');
    return relative.length > 0 ? relative : filePath;
  } catch {
    return filePath;
  }
}

/**
 * 渲染热门文件
 */
function renderHotFiles(ctx: RenderContext): string | null {
  const cwd = ctx.stdin.cwd;
  const projectMemory = getProjectMemory(cwd ?? '');

  if (!projectMemory) {
    return null;
  }

  const hotFiles = getMostEditedFiles(projectMemory, 3);
  if (hotFiles.length === 0) {
    return null;
  }

  const lang = ctx.config.display.displayLanguage;
  const parts: string[] = [];

  for (const file of hotFiles) {
    const shortPath = formatFilePath(file.path, cwd);
    const icon = file.editCount > 0 ? yellow('🔥') : cyan('📖');
    const count = file.editCount + file.reads;

    if (lang === 'zh') {
      parts.push(`${icon} ${shortPath}${dim(`×${count}`)}`);
    } else {
      parts.push(`${icon} ${shortPath}${dim(`×${count}`)}`);
    }
  }

  return parts.join(' | ');
}

/**
 * 渲染活跃目录
 */
function renderActiveDirs(ctx: RenderContext): string | null {
  const cwd = ctx.stdin.cwd;
  const projectMemory = getProjectMemory(cwd ?? '');

  if (!projectMemory) {
    return null;
  }

  const activeDirs = getActiveDirectories(projectMemory, 2);
  if (activeDirs.length === 0) {
    return null;
  }

  const lang = ctx.config.display.displayLanguage;
  const parts: string[] = [];

  for (const dir of activeDirs) {
    const shortDir = dir.replace(/\\/g, '/').split('/').slice(-2).join('/');
    if (lang === 'zh') {
      parts.push(`📁 ${shortDir}`);
    } else {
      parts.push(`📁 ${shortDir}`);
    }
  }

  return parts.join(', ');
}

/**
 * 渲染会话统计
 */
function renderSessionStats(ctx: RenderContext): string | null {
  const cwd = ctx.stdin.cwd;
  const projectMemory = getProjectMemory(cwd ?? '');

  if (!projectMemory || projectMemory.totalSessions === 0) {
    return null;
  }

  const stats = getSessionStats(projectMemory);
  const lang = ctx.config.display.displayLanguage;

  if (lang === 'zh') {
    return green(`📊 第 ${stats.totalSessions} 次会话 | 平均 ${stats.avgDuration}`);
  } else {
    return green(`📊 Session #${stats.totalSessions} | Avg ${stats.avgDuration}`);
  }
}

/**
 * 渲染项目记忆行
 */
export function renderMemoryLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;

  // 检查是否启用项目记忆显示
  if (display?.showMemoryInsights === false) {
    return null;
  }

  const cwd = ctx.stdin.cwd;
  if (!cwd) {
    return null;
  }

  const projectMemory = getProjectMemory(cwd);
  if (!projectMemory) {
    return null;
  }

  const parts: string[] = [];

  // 会话统计
  const sessionStats = renderSessionStats(ctx);
  if (sessionStats) {
    parts.push(sessionStats);
  }

  // 热门文件
  const hotFiles = renderHotFiles(ctx);
  if (hotFiles) {
    parts.push(hotFiles);
  }

  // 活跃目录
  const activeDirs = renderActiveDirs(ctx);
  if (activeDirs && parts.length < 2) {  // 只在空间足够时显示
    parts.push(activeDirs);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' | ');
}

/**
 * 渲染紧凑模式的项目记忆（单行）
 */
export function renderMemoryCompact(ctx: RenderContext): string | null {
  const cwd = ctx.stdin.cwd;
  const projectMemory = getProjectMemory(cwd ?? '');

  if (!projectMemory || projectMemory.totalSessions === 0) {
    return null;
  }

  const stats = getSessionStats(projectMemory);
  const lang = ctx.config.display.displayLanguage;

  if (lang === 'zh') {
    return dim(`📊 #${stats.totalSessions} (${stats.avgDuration})`);
  } else {
    return dim(`📊 #${stats.totalSessions} (${stats.avgDuration})`);
  }
}
