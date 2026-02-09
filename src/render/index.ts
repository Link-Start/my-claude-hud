/**
 * HUD 渲染模块 - 完整版
 * 参考 claude-hud 实现，支持 compact/expanded 布局
 */

import type { RenderContext } from '../types.js';
import { renderSessionLine } from './session-line.js';
import { renderToolsLine } from './tools-line.js';
import { renderAgentsLine } from './agents-line.js';
import { renderTodosLine } from './todos-line.js';
import { dim, RESET } from './colors.js';

/**
 * 移除 ANSI 转义码
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * 计算可视化字符串长度（忽略 ANSI 码）
 */
function visualLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * 获取终端宽度
 */
function getTerminalWidth(): number | null {
  const columns = process.stdout.columns;
  if (typeof columns === 'number' && Number.isFinite(columns) && columns > 0) {
    return columns;
  }

  const envColumns = Number.parseInt(process.env.COLUMNS ?? '', 10);
  if (Number.isFinite(envColumns) && envColumns > 0) {
    return envColumns;
  }

  return null;
}

/**
 * 智能截断行（保留 ANSI 码）
 */
function truncateLine(line: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (maxWidth <= 3) return '.'.repeat(maxWidth);
  if (visualLength(line) <= maxWidth) return line;

  const limit = Math.max(0, maxWidth - 3);
  let visible = 0;
  let result = '';
  const ansiPattern = /\x1b\[[0-9;]*m/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ansiPattern.exec(line)) !== null) {
    const chunk = line.slice(lastIndex, match.index);
    for (const char of chunk) {
      if (visible >= limit) {
        return result + '...';
      }
      result += char;
      visible += 1;
    }
    result += match[0];
    lastIndex = ansiPattern.lastIndex;
  }

  const remaining = line.slice(lastIndex);
  for (const char of remaining) {
    if (visible >= limit) {
      return result + '...';
    }
    result += char;
    visible += 1;
  }

  return result + '...';
}

/**
 * 收集活动行（工具、Agent、Todo）
 */
function collectActivityLines(ctx: RenderContext): string[] {
  const activityLines: string[] = [];
  const display = ctx.config?.display;

  if (display?.showTools !== false) {
    const toolsLine = renderToolsLine(ctx);
    if (toolsLine) {
      activityLines.push(toolsLine);
    }
  }

  if (display?.showAgents !== false) {
    const agentsLine = renderAgentsLine(ctx);
    if (agentsLine) {
      activityLines.push(agentsLine);
    }
  }

  if (display?.showTodos !== false) {
    const todosLine = renderTodosLine(ctx);
    if (todosLine) {
      activityLines.push(todosLine);
    }
  }

  return activityLines;
}

/**
 * 渲染紧凑布局（单行模式）
 */
function renderCompact(ctx: RenderContext): string[] {
  const lines: string[] = [];

  const sessionLine = renderSessionLine(ctx);
  if (sessionLine) {
    lines.push(sessionLine);
  }

  return lines;
}

/**
 * 渲染展开布局（多行模式）
 */
function renderExpanded(ctx: RenderContext): string[] {
  const lines: string[] = [];

  // Identity line: model + context bar + speed + duration
  const parts: string[] = [];

  const display = ctx.config?.display;
  const { getModelName, getContextUsagePercent, getBufferedPercent, getProviderLabel, getTotalTokens } = require('../stdin.js');
  const { getOutputSpeed } = require('../speed-tracker.js');
  const { coloredBar, cyan, yellow, getContextColor, quotaBar, red } = require('./colors.js');
  const { isLimitReached } = require('../types.js');

  const model = getModelName(ctx.stdin);
  const rawPercent = getContextUsagePercent(ctx.stdin);
  const bufferedPercent = getBufferedPercent(ctx.stdin);
  const autocompactMode = ctx.config?.display?.autocompactBuffer ?? 'enabled';
  const percent = autocompactMode === 'disabled' ? rawPercent : bufferedPercent;
  const bar = coloredBar(percent);

  const contextValueMode = display?.contextValue ?? 'percent';
  let contextValue: string;
  if (contextValueMode === 'tokens') {
    const totalTokens = getTotalTokens(ctx.stdin);
    const size = ctx.stdin.context_window?.context_window_size ?? 0;
    contextValue = size > 0 ? `${formatTokens(totalTokens)}/${formatTokens(size)}` : formatTokens(totalTokens);
  } else {
    contextValue = `${percent}%`;
  }
  const contextValueDisplay = `${getContextColor(percent)}${contextValue}${RESET}`;

  const providerLabel = getProviderLabel(ctx.stdin);
  const planName = display?.showUsage !== false ? ctx.usageData?.planName : undefined;
  const planDisplay = providerLabel ?? planName;
  const modelDisplay = planDisplay ? `${model} | ${planDisplay}` : model;

  if (display?.showModel !== false && display?.showContextBar !== false) {
    parts.push(`${cyan(`[${modelDisplay}]`)} ${bar} ${contextValueDisplay}`);
  } else if (display?.showModel !== false) {
    parts.push(`${cyan(`[${modelDisplay}]`)} ${contextValueDisplay}`);
  } else if (display?.showContextBar !== false) {
    parts.push(`${bar} ${contextValueDisplay}`);
  } else {
    parts.push(contextValueDisplay);
  }

  // Inline usage bar
  const usageBarEnabled = display?.usageBarEnabled ?? true;
  if (usageBarEnabled && display?.showUsage !== false && ctx.usageData?.planName && !providerLabel) {
    if (ctx.usageData.apiUnavailable) {
      const errorHint = ctx.usageData.apiError ? ` (${ctx.usageData.apiError})` : '';
      parts.push(yellow(`⚠${errorHint}`));
    } else if (isLimitReached(ctx.usageData)) {
      const resetTime = ctx.usageData.fiveHour === 100
        ? formatResetTime(ctx.usageData.fiveHourResetAt)
        : formatResetTime(ctx.usageData.sevenDayResetAt);
      parts.push(red(`⚠ Limit${resetTime ? ` (${resetTime})` : ''}`));
    } else {
      const threshold = display?.usageThreshold ?? 0;
      const fiveHour = ctx.usageData.fiveHour;
      const sevenDay = ctx.usageData.sevenDay;
      const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);

      if (effectiveUsage >= threshold) {
        const fiveHourDisplay = fiveHour !== null ? `${getContextColor(fiveHour)}${fiveHour}%${RESET}` : dim('--');
        const fiveHourReset = formatResetTime(ctx.usageData.fiveHourResetAt);
        const fiveHourPart = fiveHourReset
          ? `${quotaBar(fiveHour ?? 0)} ${fiveHourDisplay} (${fiveHourReset} / 5h)`
          : `${quotaBar(fiveHour ?? 0)} ${fiveHourDisplay}`;
        parts.push(fiveHourPart);
      }
    }
  }

  // Speed
  if (display?.showSpeed) {
    const speed = getOutputSpeed(ctx.stdin);
    if (speed !== null) {
      parts.push(dim(`out: ${speed.toFixed(1)} tok/s`));
    }
  }

  // Duration
  if (display?.showDuration !== false && ctx.sessionDuration) {
    parts.push(dim(`⏱️  ${ctx.sessionDuration}`));
  }

  let line = parts.join(' | ');

  // Token breakdown
  if (display?.showTokenBreakdown !== false && percent >= 85) {
    const usage = ctx.stdin.context_window?.current_usage;
    if (usage) {
      const input = formatTokens(usage.input_tokens ?? 0);
      const cache = formatTokens((usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0));
      line += dim(` (in: ${input}, cache: ${cache})`);
    }
  }

  lines.push(line);

  // Project line
  if (ctx.stdin.cwd) {
    const segments = ctx.stdin.cwd.split(/[/\\]/).filter(Boolean);
    const pathLevels = ctx.config?.pathLevels ?? 1;
    const projectPath = segments.length > 0 ? segments.slice(-pathLevels).join('/') : '/';

    const projectParts: string[] = [yellow(projectPath)];

    const gitConfig = ctx.config?.gitStatus;
    const showGit = gitConfig?.enabled ?? true;

    if (showGit && ctx.gitStatus) {
      const gitParts: string[] = [ctx.gitStatus.branch];

      if ((gitConfig?.showDirty ?? true) && ctx.gitStatus.isDirty) {
        gitParts.push('*');
      }

      if (gitConfig?.showAheadBehind) {
        if (ctx.gitStatus.ahead > 0) {
          gitParts.push(` ↑${ctx.gitStatus.ahead}`);
        }
        if (ctx.gitStatus.behind > 0) {
          gitParts.push(` ↓${ctx.gitStatus.behind}`);
        }
      }

      if (gitConfig?.showFileStats && ctx.gitStatus.fileStats) {
        const { modified, added, deleted, untracked } = ctx.gitStatus.fileStats;
        const statParts: string[] = [];
        if (modified > 0) statParts.push(`!${modified}`);
        if (added > 0) statParts.push(`+${added}`);
        if (deleted > 0) statParts.push(`✘${deleted}`);
        if (untracked > 0) statParts.push(`?${untracked}`);
        if (statParts.length > 0) {
          gitParts.push(` ${statParts.join(' ')}`);
        }
      }

      const { magenta, cyan: cyan2 } = require('./colors.js');
      projectParts.push(` ${magenta('git:(')}${cyan2(gitParts.join(''))}${magenta(')')}`);
    }

    lines.push(projectParts.join(''));
  }

  // Environment line
  if (display?.showConfigCounts !== false) {
    const totalCounts = ctx.claudeMdCount + ctx.rulesCount + ctx.mcpCount + ctx.hooksCount;
    const envThreshold = display?.environmentThreshold ?? 0;

    if (totalCounts > 0 && totalCounts >= envThreshold) {
      const envParts: string[] = [];
      if (ctx.claudeMdCount > 0) {
        envParts.push(`${ctx.claudeMdCount} CLAUDE.md`);
      }
      if (ctx.rulesCount > 0) {
        envParts.push(`${ctx.rulesCount} rules`);
      }
      if (ctx.mcpCount > 0) {
        envParts.push(`${ctx.mcpCount} MCPs`);
      }
      if (ctx.hooksCount > 0) {
        envParts.push(`${ctx.hooksCount} hooks`);
      }
      if (envParts.length > 0) {
        lines.push(dim(envParts.join(' | ')));
      }
    }
  }

  // Usage line (only when not inline)
  if (!usageBarEnabled && display?.showUsage !== false && ctx.usageData?.planName && !providerLabel) {
    if (ctx.usageData.apiUnavailable) {
      const errorHint = ctx.usageData.apiError ? ` (${ctx.usageData.apiError})` : '';
      lines.push(yellow(`usage: ⚠${errorHint}`));
    } else if (isLimitReached(ctx.usageData)) {
      const resetTime = ctx.usageData.fiveHour === 100
        ? formatResetTime(ctx.usageData.fiveHourResetAt)
        : formatResetTime(ctx.usageData.sevenDayResetAt);
      lines.push(red(`⚠ Limit reached${resetTime ? ` (resets ${resetTime})` : ''}`));
    } else {
      const threshold = display?.usageThreshold ?? 0;
      const fiveHour = ctx.usageData.fiveHour;
      const sevenDay = ctx.usageData.sevenDay;
      const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);

      if (effectiveUsage >= threshold) {
        const fiveHourDisplay = fiveHour !== null ? `${getContextColor(fiveHour)}${fiveHour}%${RESET}` : dim('--');
        const fiveHourReset = formatResetTime(ctx.usageData.fiveHourResetAt);
        const fiveHourPart = fiveHourReset
          ? `5h: ${fiveHourDisplay} (${fiveHourReset})`
          : `5h: ${fiveHourDisplay}`;

        const sevenDayThreshold = display?.sevenDayThreshold ?? 80;
        if (sevenDay !== null && sevenDay >= sevenDayThreshold) {
          const sevenDayDisplay = `${getContextColor(sevenDay)}${sevenDay}%${RESET}`;
          const sevenDayReset = formatResetTime(ctx.usageData.sevenDayResetAt);
          const sevenDayPart = `7d: ${sevenDayDisplay}`;
          lines.push(`${fiveHourPart} | ${sevenDayPart}`);
        } else {
          lines.push(fiveHourPart);
        }
      }
    }
  }

  return lines;
}

/**
 * 格式化 token 数量
 */
function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}k`;
  }
  return n.toString();
}

/**
 * 格式化重置时间
 */
function formatResetTime(resetAt: Date | null): string {
  if (!resetAt) return '';
  const now = Date.now();
  const diffMs = resetAt.getTime() - now;
  if (diffMs <= 0) return '';

  const diffMins = Math.ceil(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * 主渲染函数
 */
export function render(ctx: RenderContext): void {
  const lineLayout = ctx.config?.lineLayout ?? 'expanded';
  const showSeparators = ctx.config?.showSeparators ?? false;
  const headerLines = lineLayout === 'expanded' ? renderExpanded(ctx) : renderCompact(ctx);
  const activityLines = collectActivityLines(ctx);

  const headerSegments: string[] = [];
  for (const line of headerLines) {
    if (!line) continue;
    const split = line.split('\n').filter((part) => part.length > 0);
    headerSegments.push(...split);
  }

  const activitySegments: string[] = [];
  for (const line of activityLines) {
    if (!line) continue;
    const split = line.split('\n').filter((part) => part.length > 0);
    activitySegments.push(...split);
  }

  const segments: string[] = [...headerSegments];
  if (showSeparators && headerSegments.length > 0 && activitySegments.length > 0) {
    segments.push(dim('---'));
  }
  segments.push(...activitySegments);

  if (segments.length === 0) {
    return;
  }

  // 将 HUD 保持在单行以避免 UI 中的可聚焦行
  let line = segments.join(' | ');
  const maxWidth = getTerminalWidth();
  if (maxWidth) {
    line = truncateLine(line, maxWidth);
  }

  const outputLine = `${RESET}${line}${RESET}`.replace(/ /g, '\u00A0');
  console.log(outputLine);
}
