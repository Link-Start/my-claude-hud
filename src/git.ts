/**
 * Git 仓库状态获取 - 完整版
 */

import { execSync } from 'node:child_process';
import type { GitInfo } from './types.js';

/**
 * 获取当前 Git 仓库的状态信息
 */
export function getGitStatus(cwd: string): GitInfo | null {
  try {
    // 检查是否在 Git 仓库中
    execSync('git rev-parse --git-dir', { cwd, stdio: 'ignore' });
  } catch {
    return null;
  }

  try {
    // 获取当前分支
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();

    // 获取修改统计
    const statusOutput = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });

    let staged = 0;
    let unstaged = 0;
    let untracked = 0;

    for (const line of statusOutput.split('\n')) {
      if (!line) continue;

      const firstChar = line[0];
      const secondChar = line[1];

      // 已暂存的修改
      if (firstChar !== ' ' && firstChar !== '?') {
        staged++;
      }

      // 未暂存的修改
      if (secondChar !== ' ') {
        unstaged++;
      }

      // 未跟踪的文件
      if (firstChar === '?') {
        untracked++;
      }
    }

    // 获取 ahead/behind 信息
    let ahead: number | undefined;
    let behind: number | undefined;

    try {
      const aheadBehind = execSync('git rev-list --left-right --count origin/main...HEAD 2>/dev/null || git rev-list --left-right --count origin/master...HEAD 2>/dev/null || echo ""', {
        cwd,
        encoding: 'utf-8',
      }).trim();

      if (aheadBehind) {
        const match = aheadBehind.match(/^(\d+)\s+(\d+)$/);
        if (match) {
          behind = Number.parseInt(match[1], 10);
          ahead = Number.parseInt(match[2], 10);
        }
      }
    } catch {
      // 忽略错误
    }

    return {
      branch,
      hasChanges: staged > 0 || unstaged > 0 || untracked > 0,
      staged,
      unstaged,
      untracked,
      ahead,
      behind,
    };
  } catch {
    return null;
  }
}

/**
 * 格式化 Git 状态显示
 */
export function formatGitStatus(git: GitInfo, showFileStats: boolean, showAheadBehind: boolean): string {
  const parts: string[] = [];

  parts.push(git.branch);

  const details: string[] = [];

  if (showFileStats) {
    if (git.staged > 0) details.push(`S:${git.staged}`);
    if (git.unstaged > 0) details.push(`U:${git.unstaged}`);
    if (git.untracked > 0) details.push(`?:${git.untracked}`);
  }

  if (showAheadBehind && (git.ahead || git.behind)) {
    if (git.ahead) details.push(`↑${git.ahead}`);
    if (git.behind) details.push(`↓${git.behind}`);
  }

  if (details.length > 0 || git.hasChanges) {
    if (details.length === 0) {
      parts.push('*');
    } else {
      parts.push(`(${details.join(',')})`);
    }
  }

  return parts.join(' ');
}
