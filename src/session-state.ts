/**
 * 会话状态检测 - 实现智能内容展示
 * 扩展 alerts.ts 的告警系统，实现更智能的状态检测
 */

import type { RenderContext, SessionLevel, SessionState, Anomaly } from './types.js';
import { getContextUsagePercent } from './stdin.js';
import { isLimitReached } from './types.js';

/**
 * 检测会话状态
 */
export function detectSessionState(ctx: RenderContext): SessionState {
  const triggers: string[] = [];
  const recommendations: string[] = [];
  let level: SessionLevel = 'normal';

  const percent = getContextUsagePercent(ctx.stdin);
  const usageData = ctx.usageData;
  const runningTools = ctx.transcript.tools.filter(t => t.status === 'running').length;
  const pendingTodos = ctx.transcript.todos.filter(t => t.status === 'pending').length;

  // critical: context >95%, API 限制达到, 连续工具失败
  if (percent >= 95 || (usageData && isLimitReached(usageData))) {
    level = 'critical';
    if (percent >= 95) triggers.push('Context 接近极限');
    if (usageData && isLimitReached(usageData)) triggers.push('API 限制已达到');

    recommendations.push('建议清理不必要的上下文');
    recommendations.push('考虑开始新会话');
  }
  // warning: context >80%, API >50%, 工具执行慢
  else if (percent >= 80 || (usageData && (usageData.fiveHour ?? 0) >= 50)) {
    level = 'warning';
    if (percent >= 80) triggers.push('Context 使用率高');
    if (usageData && (usageData.fiveHour ?? 0) >= 50) triggers.push('API 使用量过半');

    recommendations.push('注意上下文使用情况');
    recommendations.push('检查 API 使用量');
  }
  // busy: 运行中工具 >3, Agent 活跃, Todo >5
  else if (runningTools > 3 || pendingTodos > 5) {
    level = 'busy';
    if (runningTools > 3) triggers.push(`${runningTools} 个工具运行中`);
    if (pendingTodos > 5) triggers.push(`${pendingTodos} 个待办任务`);

    recommendations.push('检查工具执行状态');
    if (pendingTodos > 5) recommendations.push('关注待办任务进度');
  }

  return { level, triggers, recommendations };
}

/**
 * 检测异常情况
 */
export function checkAnomalies(ctx: RenderContext): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // 工具执行异常：连续失败 3 次以上
  const errorTools = ctx.transcript.tools.filter(t => t.status === 'error');
  if (errorTools.length >= 3) {
    anomalies.push({ type: 'consecutive_failures', count: errorTools.length });
  }

  // Context 突增：与历史平均值比较
  // （需要与项目记忆系统集成，暂时跳过）

  // 速度异常：使用 speed-tracker.ts 的数据
  // （需要历史速度数据比较，暂时跳过）

  // 长时间无响应：工具运行 >5 分钟
  for (const tool of ctx.transcript.tools) {
    if (tool.status === 'running') {
      const runningTime = Date.now() - tool.startTime.getTime();
      if (runningTime > 5 * 60 * 1000) {
        anomalies.push({
          type: 'timeout',
          tool: tool.name,
          duration: runningTime,
        });
      }
    }
  }

  return anomalies;
}

/**
 * 根据状态决定组件是否显示
 */
export function shouldShowComponent(
  component: string,
  state: SessionState
): boolean {
  switch (state.level) {
    case 'critical':
      return ['context', 'usage', 'alerts'].includes(component);
    case 'warning':
      return ['context', 'usage', 'tools', 'agents', 'alerts'].includes(component);
    case 'busy':
      return ['tools', 'agents', 'todos'].includes(component);
    default:
      return true;
  }
}

/**
 * 获取状态级别对应的图标
 */
export function getStateIcon(level: SessionLevel): string {
  switch (level) {
    case 'critical':
      return '🚨';
    case 'warning':
      return '⚠️';
    case 'busy':
      return '🔄';
    default:
      return '✓';
  }
}

/**
 * 获取状态级别对应的颜色代码
 */
export function getStateColor(level: SessionLevel): string {
  switch (level) {
    case 'critical':
      return '\x1b[31m';  // 红色
    case 'warning':
      return '\x1b[33m';  // 黄色
    case 'busy':
      return '\x1b[36m';  // 青色
    default:
      return '\x1b[32m';  // 绿色
  }
}
