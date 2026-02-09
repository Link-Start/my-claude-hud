/**
 * 使用量行渲染 - API 使用量显示
 */

import type { UsageData, HudConfig } from '../types.js';
import { quotaBar, formatTokens, dim, red, yellow, green, RESET } from './colors.js';

/**
 * 渲染使用量行
 * 支持文本模式和条形图模式
 */
export function renderUsageLine(
  usageData: UsageData | null,
  config: HudConfig
): string {
  if (!usageData || !config.display.showUsage) {
    return '';
  }

  // 检查是否到达限制
  if (isLimitReached(usageData)) {
    return renderLimitReached(usageData);
  }

  // 根据配置选择显示模式
  if (config.display.usageBarEnabled) {
    return renderUsageBar(usageData, config);
  }

  return renderUsageText(usageData, config);
}

/**
 * 条形图模式
 */
function renderUsageBar(usageData: UsageData, config: HudConfig): string {
  const parts: string[] = [];

  const fiveHour = usageData.fiveHour ?? 0;
  const sevenDay = usageData.sevenDay ?? 0;

  if (fiveHour > 0 || config.display.showUsage) {
    parts.push(quotaBar(fiveHour, 8));
  }

  if (sevenDay > 0 || config.display.showUsage) {
    parts.push(quotaBar(sevenDay, 8));
  }

  return parts.join('');
}

/**
 * 文本模式
 */
function renderUsageText(usageData: UsageData, config: HudConfig): string {
  const parts: string[] = [];

  if (usageData.fiveHour !== null) {
    const color = getUsageColor(usageData.fiveHour, config.display.sevenDayThreshold);
    parts.push(`${color}5h:${usageData.fiveHour}%${RESET}`);
  }

  if (usageData.sevenDay !== null) {
    const color = getUsageColor(usageData.sevenDay, config.display.sevenDayThreshold);
    parts.push(`${color}7d:${usageData.sevenDay}%${RESET}`);
  }

  return parts.join(' ');
}

/**
 * 限制到达提示
 */
function renderLimitReached(usageData: UsageData): string {
  const resetTime = formatResetTime(usageData.fiveHourResetAt ?? usageData.sevenDayResetAt);
  return `${red('⚠')} Limit reached${resetTime ? ` (resets ${resetTime})` : ''}${RESET}`;
}

/**
 * 格式化重置时间
 */
function formatResetTime(resetAt: Date | null): string {
  if (!resetAt) return '';

  const now = Date.now();
  const diff = resetAt.getTime() - now;

  if (diff <= 0) return 'soon';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * 获取使用量颜色
 */
function getUsageColor(percent: number, threshold: number): string {
  if (percent >= 90) return red('');
  if (percent >= threshold) return yellow('');
  return green('');
}

/**
 * 检查是否达到使用限制
 */
export function isLimitReached(data: UsageData): boolean {
  return data.fiveHour === 100 || data.sevenDay === 100;
}
