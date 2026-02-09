/**
 * Todo 行渲染 - 显示 Todo 进度
 * 支持多语言翻译
 */

import type { RenderContext } from '../types.js';
import { yellow, green, dim } from './colors.js';
import { translateStatusText } from '../i18n.js';

export function renderTodosLine(ctx: RenderContext): string | null {
  const { todos } = ctx.transcript;
  const lang = ctx.config.display.displayLanguage;

  if (!todos || todos.length === 0) {
    return null;
  }

  const inProgress = todos.find((t) => t.status === 'in_progress');
  const completed = todos.filter((t) => t.status === 'completed').length;
  const total = todos.length;

  if (!inProgress) {
    if (completed === total && total > 0) {
      const text = translateStatusText('All todos complete', lang);
      return `${green('✓')} ${text} ${dim(`(${completed}/${total})`)}`;
    }
    return null;
  }

  const content = truncateContent(inProgress.content);
  const progress = dim(`(${completed}/${total})`);

  return `${yellow('▸')} ${content} ${progress}`;
}

function truncateContent(content: string, maxLen: number = 50): string {
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen - 3) + '...';
}
