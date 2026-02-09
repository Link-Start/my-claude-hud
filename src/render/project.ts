/**
 * 项目行渲染 - 项目名称和 Git 状态
 */

import type { StdinInput, GitInfo, HudConfig } from '../types.js';
import { cyan, dim } from './colors.js';
import { formatGitStatus } from '../git.js';

/**
 * 渲染项目行
 */
export function renderProjectLine(
  stdin: StdinInput,
  gitInfo: GitInfo | null,
  config: HudConfig,
  sessionDuration: string
): string {
  const parts: string[] = [];

  // 项目名称
  const projectName = getProjectName(stdin, config.pathLevels);
  if (projectName) {
    parts.push(cyan(projectName));
  }

  // Git 状态
  if (config.gitStatus.enabled && gitInfo) {
    const gitStr = formatGitStatus(
      gitInfo,
      config.gitStatus.showDirty,
      config.gitStatus.showAheadBehind,
      config.gitStatus.showFileStats
    );
    parts.push(dim(gitStr));
  }

  // 会话时长
  if (config.display.showDuration && sessionDuration) {
    parts.push(dim(sessionDuration));
  }

  return parts.join(' ');
}

/**
 * 获取项目名称
 */
function getProjectName(stdin: StdinInput, pathLevels: 1 | 2 | 3): string {
  const cwd = stdin.cwd;
  if (!cwd) return '';

  const pathParts = cwd.split('/');
  const projectName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

  // 根据配置决定显示多少级路径
  if (pathLevels > 1) {
    const parts: string[] = [];
    for (let i = pathLevels; i > 0; i--) {
      const idx = pathParts.length - i;
      if (idx >= 0 && pathParts[idx]) {
        parts.push(pathParts[idx]);
      }
    }
    if (parts.length > 0) {
      return parts.join('/');
    }
  }

  return projectName;
}
