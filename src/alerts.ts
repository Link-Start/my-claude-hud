/**
 * 告警系统 - 在关键时刻提醒用户
 * 支持上下文、API 限制、长时间工具等告警
 */

import type { RenderContext, UsageData, Anomaly } from './types.js';
import { getContextUsagePercent } from './stdin.js';
import { isLimitReached } from './types.js';
import { checkAnomalies as detectAnomalies } from './session-state.js';

/**
 * 告警配置
 */
export interface AlertConfig {
  contextWarning: number;      // 上下文警告阈值（默认 80）
  contextCritical: number;     // 上下文严重阈值（默认 95）
  apiLimitWarning: number;     // API 使用警告阈值（默认 90）
  longToolThreshold: number;   // 长时间工具阈值（默认 30s）
}

/**
 * 默认告警配置
 */
export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  contextWarning: 80,
  contextCritical: 95,
  apiLimitWarning: 90,
  longToolThreshold: 30000,  // 30 秒（毫秒）
};

/**
 * 告警类型
 */
export type AlertType = 'warning' | 'critical' | 'info';

/**
 * 告警
 */
export interface Alert {
  type: AlertType;
  message: string;
  icon: string;
}

/**
 * 检查告警
 */
export function checkAlerts(
  ctx: RenderContext,
  config: AlertConfig = DEFAULT_ALERT_CONFIG
): Alert[] {
  const alerts: Alert[] = [];
  const percent = getContextUsagePercent(ctx.stdin);

  // 上下文告警
  if (percent >= config.contextCritical) {
    alerts.push({
      type: 'critical',
      message: `Context at ${percent}%`,
      icon: '🚨',
    });
  } else if (percent >= config.contextWarning) {
    alerts.push({
      type: 'warning',
      message: `Context at ${percent}%`,
      icon: '⚠️',
    });
  }

  // API 限制告警
  if (ctx.usageData && !ctx.usageData.apiUnavailable) {
    const fiveHour = ctx.usageData.fiveHour ?? 0;
    const sevenDay = ctx.usageData.sevenDay ?? 0;

    if (isLimitReached(ctx.usageData)) {
      alerts.push({
        type: 'critical',
        message: 'API limit reached',
        icon: '🚫',
      });
    } else if (fiveHour >= config.apiLimitWarning || sevenDay >= config.apiLimitWarning) {
      alerts.push({
        type: 'warning',
        message: 'API limit approaching',
        icon: '💰',
      });
    }
  }

  // 长时间运行工具告警
  for (const tool of ctx.transcript.tools) {
    if (tool.status === 'running') {
      const runningTime = Date.now() - tool.startTime.getTime();
      if (runningTime >= config.longToolThreshold) {
        const minutes = Math.floor(runningTime / 60000);
        alerts.push({
          type: 'info',
          message: `${tool.name} running for ${minutes}m`,
          icon: '⏱️',
        });
      }
    }
  }

  return alerts;
}

/**
 * 格式化告警为显示字符串
 */
export function formatAlerts(alerts: Alert[]): string | null {
  if (alerts.length === 0) {
    return null;
  }

  // 按优先级排序：critical > warning > info
  const priorityOrder: Record<AlertType, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  const sortedAlerts = [...alerts].sort((a, b) =>
    priorityOrder[a.type] - priorityOrder[b.type]
  );

  // 只显示最高优先级的告警
  const topAlert = sortedAlerts[0];
  return `${topAlert.icon} ${topAlert.message}`;
}

/**
 * 获取告警颜色（ANSI 转义序列）
 */
export function getAlertColor(type: AlertType): string {
  switch (type) {
    case 'critical':
      return '\x1b[31m';  // 红色
    case 'warning':
      return '\x1b[33m';  // 黄色
    case 'info':
      return '\x1b[36m';  // 青色
    default:
      return '\x1b[0m';   // 重置
  }
}

/**
 * 格式化单个告警（带颜色）
 */
export function formatAlert(alert: Alert): string {
  const color = getAlertColor(alert.type);
  const reset = '\x1b[0m';
  return `${color}${alert.icon} ${alert.message}${reset}`;
}

/**
 * 检测异常情况（使用 session-state 模块）
 */
export function checkAnomalies(ctx: RenderContext): Anomaly[] {
  return detectAnomalies(ctx);
}

/**
 * 格式化异常为显示字符串
 */
export function formatAnomalies(anomalies: Anomaly[]): string | null {
  if (anomalies.length === 0) {
    return null;
  }

  const parts: string[] = [];

  for (const anomaly of anomalies) {
    switch (anomaly.type) {
      case 'consecutive_failures':
        parts.push(`⚠️ ${anomaly.count} 个工具失败`);
        break;
      case 'timeout':
        const mins = Math.round((anomaly.duration ?? 0) / 60000);
        parts.push(`⏱️ ${anomaly.tool} 运行 ${mins} 分钟`);
        break;
      case 'context_spike':
        parts.push(`📈 Context 异常增长`);
        break;
      case 'slow_output':
        parts.push(`🐌 输出速度缓慢`);
        break;
    }
  }

  return parts.join(' | ');
}
