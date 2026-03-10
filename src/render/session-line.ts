/**
 * 会话行渲染 - 紧凑模式的完整会话行
 * 包含：模型、上下文、项目、Git、配置统计、使用量、时长
 */

import type { RenderContext } from '../types.js';
import { isLimitReached } from '../types.js';
import { getContextUsagePercent, getBufferedPercent, getModelName, getProviderLabel, getTotalTokens } from '../stdin.js';
import { getOutputSpeed } from '../speed-tracker.js';
import { calculateCostFromStdin, formatCost, updateSessionCost, getSessionCost } from '../cost-estimator.js';
import { projectContextUsage, formatProjection } from '../context-projection.js';
import { checkAlerts, formatAlerts } from '../alerts.js';
import { coloredBar, cyan, dim, magenta, red, yellow, getContextColor, quotaBar, RESET } from './colors.js';
import { formatTokens, formatTimeUntil } from '../utils/format.js';
import { estimateReasoningEffort, formatReasoningEffort, getReasoningEffortIcon, getReasoningEffortLabel } from '../reasoning-effort.js';
import { trackThinkTime, formatThinkTime } from '../think-time.js';
import { getRalphStatus, renderRalphStatusLine } from '../ralph-status.js';

const DEBUG = process.env.DEBUG?.includes('my-claude-hud') || process.env.DEBUG === '*';

/**
 * 渲染完整会话行（模型 + 上下文 + 项目 + Git + 统计 + 使用量 + 时长）
 */
export function renderSessionLine(ctx: RenderContext): string {
  const model = getModelName(ctx.stdin);

  const rawPercent = getContextUsagePercent(ctx.stdin);
  const bufferedPercent = getBufferedPercent(ctx.stdin);
  const autocompactMode = ctx.config?.display?.autocompactBuffer ?? 'enabled';
  const percent = autocompactMode === 'disabled' ? rawPercent : bufferedPercent;

  if (DEBUG && autocompactMode === 'disabled') {
    console.error(`[my-claude-hud:context] autocompactBuffer=disabled, showing raw ${rawPercent}% (buffered would be ${bufferedPercent}%)`);
  }

  const bar = coloredBar(percent);

  const parts: string[] = [];
  const display = ctx.config?.display;
  const contextValueMode = display?.contextValue ?? 'percent';
  const contextValue = formatContextValue(ctx, percent, contextValueMode);
  const contextValueDisplay = `${getContextColor(percent)}${contextValue}${RESET}`;

  // 模型和上下文条形图（第一部分）
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

  // 项目路径（第二部分）
  if (ctx.stdin.cwd) {
    // 跨平台路径分割（支持 / 和 \）
    const segments = ctx.stdin.cwd.split(/[/\\]/).filter(Boolean);
    const pathLevels = ctx.config?.pathLevels ?? 1;
    // 始终用 / 连接以保持一致的显示
    // 处理根路径（/）导致空段的情况
    const projectPath = segments.length > 0 ? segments.slice(-pathLevels).join('/') : '/';

    // 构建 Git 状态字符串
    let gitPart = '';
    const gitConfig = ctx.config?.gitStatus;
    const showGit = gitConfig?.enabled ?? true;

    if (showGit && ctx.gitStatus) {
      const gitParts: string[] = [ctx.gitStatus.branch];

      // 显示 dirty 指示符
      if ((gitConfig?.showDirty ?? true) && ctx.gitStatus.isDirty) {
        gitParts.push('*');
      }

      // 显示 ahead/behind（带空格分隔以提高可读性）
      if (gitConfig?.showAheadBehind) {
        // Diverged 状态：同时 ahead 和 behind
        if (ctx.gitStatus.diverged) {
          gitParts.push(` ⇕${ctx.gitStatus.ahead}↓${ctx.gitStatus.behind}`);
        } else {
          if (ctx.gitStatus.ahead > 0) {
            gitParts.push(` ↑${ctx.gitStatus.ahead}`);
          }
          if (ctx.gitStatus.behind > 0) {
            gitParts.push(` ↓${ctx.gitStatus.behind}`);
          }
        }
      }

      // 显示文件统计（Starship 兼容格式：!modified +added ✘deleted ?untracked）
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

      gitPart = ` ${magenta('git:(')}${cyan(gitParts.join(''))}${magenta(')')}`;
    }

    parts.push(`${yellow(projectPath)}${gitPart}`);
  }

  // Session Name 显示
  if (display?.showSessionName && ctx.transcript.sessionName) {
    parts.push(dim(ctx.transcript.sessionName));
  }

  // 配置统计（ respects environmentThreshold）
  if (display?.showConfigCounts !== false) {
    const totalCounts = ctx.claudeMdCount + ctx.rulesCount + ctx.mcpCount + ctx.hooksCount;
    const envThreshold = display?.environmentThreshold ?? 0;

    if (totalCounts > 0 && totalCounts >= envThreshold) {
      if (ctx.claudeMdCount > 0) {
        parts.push(dim(`${ctx.claudeMdCount} CLAUDE.md`));
      }

      if (ctx.rulesCount > 0) {
        parts.push(dim(`${ctx.rulesCount} rules`));
      }

      if (ctx.mcpCount > 0) {
        parts.push(dim(`${ctx.mcpCount} MCPs`));
      }

      if (ctx.hooksCount > 0) {
        parts.push(dim(`${ctx.hooksCount} hooks`));
      }
    }
  }

  // 使用量限制显示（在配置中启用时显示， respects usageThreshold）
  if (display?.showUsage !== false && ctx.usageData?.planName && !providerLabel) {
    if (ctx.usageData.apiUnavailable) {
      const errorHint = formatUsageError(ctx.usageData.apiError);
      parts.push(yellow(`usage: ⚠${errorHint}`));
    } else if (isLimitReached(ctx.usageData)) {
      const resetTime = ctx.usageData.fiveHour === 100
        ? formatResetTime(ctx.usageData.fiveHourResetAt)
        : formatResetTime(ctx.usageData.sevenDayResetAt);
      parts.push(red(`⚠ Limit reached${resetTime ? ` (resets ${resetTime})` : ''}`));
    } else {
      const usageThreshold = display?.usageThreshold ?? 0;
      const fiveHour = ctx.usageData.fiveHour;
      const sevenDay = ctx.usageData.sevenDay;
      const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);

      if (effectiveUsage >= usageThreshold) {
        const fiveHourDisplay = formatUsagePercent(fiveHour);
        const fiveHourReset = formatResetTime(ctx.usageData.fiveHourResetAt);

        const usageBarEnabled = display?.usageBarEnabled ?? true;
        const fiveHourPart = usageBarEnabled
          ? (fiveHourReset
              ? `${quotaBar(fiveHour ?? 0)} ${fiveHourDisplay} (${fiveHourReset} / 5h)`
              : `${quotaBar(fiveHour ?? 0)} ${fiveHourDisplay}`)
          : (fiveHourReset
              ? `5h: ${fiveHourDisplay} (${fiveHourReset})`
              : `5h: ${fiveHourDisplay}`);

        const sevenDayThreshold = display?.sevenDayThreshold ?? 80;
        if (sevenDay !== null && sevenDay >= sevenDayThreshold) {
          const sevenDayDisplay = formatUsagePercent(sevenDay);
          const sevenDayReset = formatResetTime(ctx.usageData.sevenDayResetAt);
          const sevenDayPart = usageBarEnabled
            ? (sevenDayReset
                ? `${quotaBar(sevenDay)} ${sevenDayDisplay} (${sevenDayReset} / 7d)`
                : `${quotaBar(sevenDay)} ${sevenDayDisplay}`)
            : `7d: ${sevenDayDisplay}`;
          parts.push(`${fiveHourPart} | ${sevenDayPart}`);
        } else {
          parts.push(fiveHourPart);
        }
      }
    }
  }

  // 会话时长
  if (display?.showSpeed) {
    const speed = getOutputSpeed(ctx.stdin);
    if (speed !== null) {
      parts.push(dim(`out: ${speed.toFixed(1)} tok/s`));
    }
  }

  if (display?.showDuration !== false && ctx.sessionDuration) {
    parts.push(dim(`⏱️  ${ctx.sessionDuration}`));
  }

  // 推理努力显示（基于会话活动推测）
  if (display?.showReasoningEffort !== false) {
    const reasoningEffort = estimateReasoningEffort(ctx);
    const effortDisplay = formatReasoningEffort(ctx);
    if (effortDisplay) {
      parts.push(dim(effortDisplay));
    }
  }

  // 思考时间显示（UI刷新间隔）
  if (display?.showThinkTime !== false) {
    const thinkTime = trackThinkTime();
    if (thinkTime > 0) {
      const formattedThinkTime = formatThinkTime(thinkTime);
      parts.push(dim(`⏳ ${formattedThinkTime}`));
    }
  }

  // Ralph Wiggum 循环状态显示
  if (display?.showRalphLoop !== false) {
    const ralphStatus = getRalphStatus();
    if (ralphStatus) {
      const ralphLine = renderRalphStatusLine(ralphStatus);
      parts.push(dim(ralphLine));
    }
  }

  // 成本显示（可选功能）
  if (display?.showCost !== false) {
    const sessionCost = calculateCostFromStdin(ctx.stdin);
    updateSessionCost(sessionCost);
    const costStats = getSessionCost();

    if (costStats) {
      const sessionCostStr = formatCost(sessionCost);
      const todayCostStr = formatCost(costStats.todayCost);
      parts.push(dim(`💰 ${sessionCostStr}/session | ${todayCostStr}/today`));
    } else {
      const sessionCostStr = formatCost(sessionCost);
      parts.push(dim(`💰 ${sessionCostStr}`));
    }
  }

  if (ctx.extraLabel) {
    parts.push(dim(ctx.extraLabel));
  }

  // 告警显示（在配置中启用时）
  const alerts = ctx.config?.alerts;
  if (alerts?.enabled !== false) {
    const alertList = checkAlerts(ctx, {
      contextWarning: alerts?.contextWarning ?? 80,
      contextCritical: alerts?.contextCritical ?? 95,
      apiLimitWarning: alerts?.apiLimitWarning ?? 90,
      longToolThreshold: 30000,  // 默认 30 秒
    });
    const alertStr = formatAlerts(alertList);
    if (alertStr) {
      parts.push(alertStr);
    }
  }

  let line = parts.join(' | ');

  // 高上下文时的 token 分解和预算预测
  if (display?.showTokenBreakdown !== false && percent >= 80) {
    const usage = ctx.stdin.context_window?.current_usage;
    if (usage) {
      const input = formatTokens(usage.input_tokens ?? 0);
      const cache = formatTokens((usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0));
      line += dim(` (in: ${input}, cache: ${cache})`);

      // 当上下文 >= 85% 时，显示预算预测
      if (percent >= 85) {
        const projection = projectContextUsage(ctx);
        const projectionStr = formatProjection(projection);
        line += dim(` | ${projectionStr}`);
      }
    }
  }

  return line;
}

function formatContextValue(ctx: RenderContext, percent: number, mode: 'percent' | 'tokens' | 'remaining'): string {
  if (mode === 'tokens') {
    const totalTokens = getTotalTokens(ctx.stdin);
    const size = ctx.stdin.context_window?.context_window_size ?? 0;
    if (size > 0) {
      return `${formatTokens(totalTokens)}/${formatTokens(size)}`;
    }
    return formatTokens(totalTokens);
  }

  if (mode === 'remaining') {
    return `${Math.max(0, 100 - percent)}%`;
  }

  return `${percent}%`;
}

function formatUsagePercent(percent: number | null): string {
  if (percent === null) {
    return dim('--');
  }
  const color = getContextColor(percent);
  return `${color}${percent}%${RESET}`;
}

function formatUsageError(error?: string): string {
  if (!error) return '';
  if (error.startsWith('http-')) {
    return ` (${error.slice(5)})`;
  }
  return ` (${error})`;
}

/**
 * 格式化重置时间（使用统一工具）
 */
function formatResetTime(resetAt: Date | null): string {
  return formatTimeUntil(resetAt);
}
