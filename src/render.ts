/**
 * HUD 渲染模块 - 完整版
 * 支持所有 claude-hud 的显示功能
 */

import type { RenderContext, ToolStatus, AgentStatus, TodoItem } from './types.js';
import { getContextUsagePercent, getTotalInputTokens } from './stdin.js';
import { formatGitStatus } from './git.js';

// ANSI 颜色代码
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * 主渲染函数 - 输出 HUD 状态行
 */
export function renderHud(ctx: RenderContext): void {
  const lines: string[] = [];

  // 根据布局模式渲染
  if (ctx.config.lineLayout === 'expanded') {
    lines.push(...renderExpanded(ctx));
  } else {
    lines.push(...renderCompact(ctx));
  }

  // 添加分隔符
  if (ctx.config.showSeparators && lines.length > 0) {
    lines.push(COLORS.dim + '---' + COLORS.reset);
  }

  // 渲染活动行（工具、Agent、Todo）
  lines.push(...renderActivityLines(ctx));

  if (lines.length === 0) {
    return;
  }

  // 合并为单行输出
  let output = lines.join(' | ');

  // 截断以适应终端宽度
  const maxWidth = getTerminalWidth();
  if (maxWidth && stripAnsiLength(output) > maxWidth) {
    output = truncateToWidth(output, maxWidth);
  }

  // 替换空格为不换行空格
  output = output.replace(/ /g, '\u00A0');

  console.log(COLORS.reset + output + COLORS.reset);
}

/**
 * 渲染展开模式（多信息行）
 */
function renderExpanded(ctx: RenderContext): string[] {
  const parts: string[] = [];

  // 身份行（模型 + 提供商）
  parts.push(renderIdentityLine(ctx));

  // 项目行
  parts.push(renderProjectLine(ctx));

  // 环境行（配置统计）
  parts.push(renderEnvironmentLine(ctx));

  // 使用量行（如果条形图未启用）
  if (!ctx.config.display.usageBarEnabled && ctx.config.display.showUsage) {
    const usageLine = renderUsageLine(ctx);
    if (usageLine) {
      parts.push(usageLine);
    }
  }

  return parts.filter(Boolean);
}

/**
 * 渲染紧凑模式（单行）
 */
function renderCompact(ctx: RenderContext): string[] {
  const parts: string[] = [];

  // 上下文条形图
  if (ctx.config.display.showContextBar) {
    const bar = renderContextBar(ctx);
    if (bar) {
      parts.push(bar);
    }
  }

  // 模型和项目
  if (ctx.config.display.showModel) {
    const model = getModelDisplayName(ctx);
    parts.push(COLORS.dim + model + COLORS.reset);
  }

  const project = getProjectName(ctx);
  if (project) {
    parts.push(COLORS.cyan + project + COLORS.reset);
  }

  // Git 状态
  if (ctx.config.gitStatus.enabled && ctx.git) {
    const gitStr = formatGitStatus(
      ctx.git,
      ctx.config.gitStatus.showFileStats,
      ctx.config.gitStatus.showAheadBehind
    );
    parts.push(COLORS.dim + gitStr + COLORS.reset);
  }

  // 会话时长
  if (ctx.config.display.showDuration && ctx.sessionDuration) {
    parts.push(COLORS.dim + ctx.sessionDuration + COLORS.reset);
  }

  return parts;
}

/**
 * 渲染活动行（工具、Agent、Todo）
 */
function renderActivityLines(ctx: RenderContext): string[] {
  const parts: string[] = [];

  // 工具状态
  if (ctx.config.display.showTools) {
    const toolsStr = renderTools(ctx.session.tools);
    if (toolsStr) {
      parts.push(COLORS.yellow + '🔧' + COLORS.reset + ' ' + toolsStr);
    }
  }

  // Agent 状态
  if (ctx.config.display.showAgents) {
    const agentsStr = renderAgents(ctx.session.agents);
    if (agentsStr) {
      parts.push(COLORS.blue + '🤖' + COLORS.reset + ' ' + agentsStr);
    }
  }

  // Todo 状态
  if (ctx.config.display.showTodos) {
    const todosStr = renderTodos(ctx.session.todos);
    if (todosStr) {
      parts.push(COLORS.green + '✓' + COLORS.reset + ' ' + todosStr);
    }
  }

  return parts;
}

/**
 * 渲染身份行（模型 + 使用量条形图）
 */
function renderIdentityLine(ctx: RenderContext): string {
  const parts: string[] = [];

  // 模型名称
  if (ctx.config.display.showModel) {
    const model = getModelDisplayName(ctx);
    parts.push(model);
  }

  // 使用量条形图
  if (ctx.config.display.usageBarEnabled && ctx.config.display.showUsage) {
    const usageBar = renderUsageBar(ctx);
    if (usageBar) {
      parts.push(usageBar);
    }
  }

  return parts.join(' ');
}

/**
 * 渲染项目行
 */
function renderProjectLine(ctx: RenderContext): string {
  const parts: string[] = [];

  // 项目名称
  const project = getProjectName(ctx);
  if (project) {
    parts.push(COLORS.cyan + project + COLORS.reset);
  }

  // Git 状态
  if (ctx.config.gitStatus.enabled && ctx.git) {
    const gitStr = formatGitStatus(
      ctx.git,
      ctx.config.gitStatus.showFileStats,
      ctx.config.gitStatus.showAheadBehind
    );
    parts.push(gitStr);
  }

  // 会话时长
  if (ctx.config.display.showDuration && ctx.sessionDuration) {
    parts.push(ctx.sessionDuration);
  }

  // 速度
  if (ctx.config.display.showSpeed && ctx.speed) {
    parts.push(formatSpeed(ctx.speed));
  }

  return parts.join(' ');
}

/**
 * 渲染环境行（配置统计）
 */
function renderEnvironmentLine(ctx: RenderContext): string {
  if (!ctx.config.display.showConfigCounts) {
    return '';
  }

  const counts = ctx.configCounts;
  const parts: string[] = [];

  if (counts.claudeMdCount > 0) {
    parts.push(`M:${counts.claudeMdCount}`);
  }
  if (counts.rulesCount > 0) {
    parts.push(`R:${counts.rulesCount}`);
  }
  if (counts.mcpCount > 0) {
    parts.push(`MCP:${counts.mcpCount}`);
  }
  if (counts.hooksCount > 0) {
    parts.push(`H:${counts.hooksCount}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return COLORS.dim + parts.join(' ') + COLORS.reset;
}

/**
 * 渲染使用量行
 */
function renderUsageLine(ctx: RenderContext): string {
  if (!ctx.usage || !ctx.config.display.showUsage) {
    return '';
  }

  const parts: string[] = [];

  if (ctx.usage.fiveHourPercent !== null) {
    const color = ctx.usage.fiveHourPercent >= 90 ? COLORS.red :
                  ctx.usage.fiveHourPercent >= ctx.config.display.sevenDayThreshold ? COLORS.yellow :
                  COLORS.green;
    parts.push(`${color}5h:${ctx.usage.fiveHourPercent}%${COLORS.reset}`);
  }

  if (ctx.usage.sevenDayPercent !== null) {
    const color = ctx.usage.sevenDayPercent >= 90 ? COLORS.red :
                  ctx.usage.sevenDayPercent >= ctx.config.display.sevenDayThreshold ? COLORS.yellow :
                  COLORS.green;
    parts.push(`${color}7d:${ctx.usage.sevenDayPercent}%${COLORS.reset}`);
  }

  return parts.join(' ');
}

/**
 * 渲染上下文条形图
 */
function renderContextBar(ctx: RenderContext): string {
  const percent = getContextUsagePercent(ctx.stdin);
  const color = percent >= 80 ? COLORS.red : percent >= 50 ? COLORS.yellow : COLORS.green;

  // 简单的文本条形图
  const bars = Math.floor(percent / 10);
  const bar = '█'.repeat(bars) + '░'.repeat(10 - bars);

  return `${color}${bar}${COLORS.reset} ${percent}%`;
}

/**
 * 渲染使用量条形图
 */
function renderUsageBar(ctx: RenderContext): string {
  if (!ctx.usage) {
    return '';
  }

  const fiveHour = ctx.usage.fiveHourPercent ?? 0;
  const sevenDay = ctx.usage.sevenDayPercent ?? 0;

  const fiveHourColor = fiveHour >= 90 ? COLORS.red : fiveHour >= ctx.config.display.sevenDayThreshold ? COLORS.yellow : COLORS.green;
  const sevenDayColor = sevenDay >= 90 ? COLORS.red : sevenDay >= ctx.config.display.sevenDayThreshold ? COLORS.yellow : COLORS.green;

  const fiveHourBars = Math.floor(fiveHour / 10);
  const sevenDayBars = Math.floor(sevenDay / 10);

  const fiveHourBar = '█'.repeat(fiveHourBars) + '░'.repeat(10 - fiveHourBars);
  const sevenDayBar = '█'.repeat(sevenDayBars) + '░'.repeat(10 - sevenDayBars);

  return `${fiveHourColor}[${fiveHourBar}]${COLORS.reset}${sevenDayColor}[${sevenDayBar}]${COLORS.reset}`;
}

/**
 * 渲染工具状态
 */
function renderTools(tools: ToolStatus[]): string {
  const running = tools.filter(t => t.state === 'running');
  if (running.length === 0) return '';

  const names = running.slice(0, 3).map(t => {
    if (t.target) {
      return `${t.name}:${t.target}`;
    }
    return t.name;
  });

  let result = names.join(', ');
  if (running.length > 3) {
    result += ` +${running.length - 3}`;
  }

  return result;
}

/**
 * 渲染 Agent 状态
 */
function renderAgents(agents: AgentStatus[]): string {
  const running = agents.filter(a => a.state === 'running');
  if (running.length === 0) return '';

  return running.map(a => a.type).join(', ');
}

/**
 * 渲染 Todo 状态
 */
function renderTodos(todos: TodoItem[]): string {
  if (todos.length === 0) return '';

  const completed = todos.filter(t => t.status === 'done').length;
  const inProgress = todos.filter(t => t.status === 'in_progress').length;

  if (inProgress > 0) {
    return `${completed}/${todos.length} (${inProgress} 进行中)`;
  }
  return `${completed}/${todos.length}`;
}

/**
 * 获取模型显示名称
 */
function getModelDisplayName(ctx: RenderContext): string {
  let name = ctx.stdin.model?.display_name ?? ctx.stdin.model?.id ?? 'unknown';

  // 检查是否为 Bedrock
  const modelId = ctx.stdin.model?.id?.toLowerCase() ?? '';
  if (modelId.includes('anthropic.claude-')) {
    name += ' (Bedrock)';
  }

  return name;
}

/**
 * 获取项目名称
 */
function getProjectName(ctx: RenderContext): string {
  const cwd = ctx.stdin.cwd;
  if (!cwd) return '';

  const pathParts = cwd.split('/');
  let projectName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

  // 根据配置决定显示多少级路径
  if (ctx.config.pathLevels > 1) {
    const parts: string[] = [];
    for (let i = ctx.config.pathLevels; i > 0; i--) {
      const idx = pathParts.length - i;
      if (idx >= 0 && pathParts[idx]) {
        parts.push(pathParts[idx]);
      }
    }
    if (parts.length > 0) {
      projectName = parts.join('/');
    }
  }

  return projectName;
}

/**
 * 格式化速度
 */
function formatSpeed(tokensPerSecond: number): string {
  if (tokensPerSecond < 1000) {
    return `${tokensPerSecond} t/s`;
  }
  return `${(tokensPerSecond / 1000).toFixed(1)}k t/s`;
}

/**
 * 去除 ANSI 颜色码后的字符串长度
 */
function stripAnsiLength(str: string): number {
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/**
 * 截断字符串到指定宽度
 */
function truncateToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (maxWidth <= 3) return '.'.repeat(maxWidth);

  const limit = Math.max(0, maxWidth - 3);
  let visible = 0;
  let result = '';
  const ansiPattern = /\x1b\[[0-9;]*m/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ansiPattern.exec(str)) !== null) {
    const chunk = str.slice(lastIndex, match.index);
    for (const char of chunk) {
      if (visible >= limit) {
        return result + '...';
      }
      result += char;
      visible++;
    }
    result += match[0];
    lastIndex = ansiPattern.lastIndex;
  }

  const remaining = str.slice(lastIndex);
  for (const char of remaining) {
    if (visible >= limit) {
      return result + '...';
    }
    result += char;
    visible++;
  }

  return result + '...';
}

/**
 * 获取终端宽度
 */
function getTerminalWidth(): number | null {
  const columns = process.stdout.columns;
  if (typeof columns === 'number' && Number.isFinite(columns) && columns > 0) {
    return columns;
  }
  return null;
}
