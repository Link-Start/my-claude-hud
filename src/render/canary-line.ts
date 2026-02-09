/**
 * 金丝雀测试渲染行模块 - 增强版
 * 显示金丝雀测试状态
 * 支持全局金丝雀和智能提示
 */

import type { RenderContext } from '../types.js';
import { yellow, red, green, cyan, dim, RESET } from './colors.js';

/**
 * 渲染金丝雀测试行
 */
export function renderCanaryLine(ctx: RenderContext): string | null {
  const canaryData = ctx.canaryData;
  if (!canaryData || canaryData.status === 'none') {
    return null;
  }

  // 检查配置是否显示金丝雀测试
  const lineLayout = ctx.config?.lineLayout ?? 'expanded';
  const showInCompact = ctx.config?.canaryTest?.showInCompact ?? false;
  const showInExpanded = ctx.config?.canaryTest?.showInExpanded ?? true;

  if (lineLayout === 'compact' && !showInCompact) {
    return null;
  }
  if (lineLayout === 'expanded' && !showInExpanded) {
    return null;
  }

  // 根据状态显示不同的图标和颜色
  let icon: string;
  let colorFn: (s: string) => string;
  let statusText: string;
  let additionalInfo: string = '';

  switch (canaryData.status) {
    case 'active':
      icon = '🐤';
      colorFn = green;
      statusText = '活跃';
      // 显示来源（全局/项目）
      if (canaryData.source === 'global') {
        additionalInfo = cyan('全局');
      }
      break;
    case 'lost':
      icon = '⚠️';
      colorFn = red;
      statusText = '丢失';
      break;
    case 'prompt':
      icon = '💡';
      colorFn = yellow;
      statusText = '建议添加金丝雀测试';
      additionalInfo = dim('运行 --action=canary-create 创建');
      break;
    default:
      return null;
  }

  // 构建显示文本
  const parts: string[] = [];

  // 状态指示器
  parts.push(`${colorFn(icon)} ${colorFn(statusText)}`);

  // 来源信息（如果有）
  if (additionalInfo) {
    parts.push(additionalInfo);
  }

  // 金丝雀 ID（如果有）
  if (canaryData.canaryId) {
    const id = canaryData.canaryId.substring(7, 13); // 显示部分 ID
    parts.push(dim(`(${id}...)`));

    // 时间戳
    if (canaryData.timestamp) {
      const elapsed = Date.now() - canaryData.timestamp.getTime();
      const mins = Math.floor(elapsed / 60000);
      if (mins < 1) {
        parts.push(dim('<1m'));
      } else if (mins < 60) {
        parts.push(dim(`${mins}m`));
      } else {
        const hours = Math.floor(mins / 60);
        parts.push(dim(`${hours}h`));
      }
    }
  }

  // 如果是丢失状态，显示提示
  if (canaryData.status === 'lost') {
    parts.push(yellow('上下文已丢失'));
  }

  return `Canary: ${parts.join(' ')}${RESET}`;
}
