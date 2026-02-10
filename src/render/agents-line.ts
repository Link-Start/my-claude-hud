/**
 * Agent 行渲染 - 显示运行中和已完成的 Agent
 * 支持多语言翻译
 */

import type { RenderContext, AgentEntry } from '../types.js';
import { yellow, green, magenta, dim } from './colors.js';
import { translateAgentType } from '../i18n.js';
import { formatDuration } from '../utils/format.js';

export function renderAgentsLine(ctx: RenderContext): string | null {
  const { agents } = ctx.transcript;
  const lang = ctx.config.display.displayLanguage;

  const runningAgents = agents.filter((a) => a.status === 'running');
  const recentCompleted = agents
    .filter((a) => a.status === 'completed')
    .slice(-2);

  const toShow = [...runningAgents, ...recentCompleted].slice(-3);

  if (toShow.length === 0) {
    return null;
  }

  const lines: string[] = [];

  for (const agent of toShow) {
    lines.push(formatAgent(agent, lang));
  }

  return lines.join('\n');
}

function formatAgent(agent: AgentEntry, lang: 'zh' | 'en' = 'en'): string {
  const statusIcon = agent.status === 'running' ? yellow('◐') : green('✓');
  const translatedType = translateAgentType(agent.type, lang);
  const type = magenta(translatedType);
  const model = agent.model ? dim(`[${agent.model}]`) : '';
  const desc = agent.description ? dim(`: ${truncateDesc(agent.description)}`) : '';
  const now = Date.now();
  const start = agent.startTime.getTime();
  const end = agent.endTime?.getTime() ?? now;
  const ms = end - start;
  const elapsed = formatDuration(ms, { format: 'precise' });

  return `${statusIcon} ${type}${model ? ` ${model}` : ''}${desc} ${dim(`(${elapsed})`)}`;
}

function truncateDesc(desc: string, maxLen: number = 40): string {
  if (desc.length <= maxLen) return desc;
  return desc.slice(0, maxLen - 3) + '...';
}
