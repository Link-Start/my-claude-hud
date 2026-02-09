/**
 * 环境行渲染 - 配置文件统计
 */

import type { HudConfig } from '../types.js';
import { dim } from './colors.js';

/**
 * 环境配置统计
 */
export interface ConfigCounts {
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
}

/**
 * 渲染环境行（配置统计）
 */
export function renderEnvironmentLine(
  counts: ConfigCounts,
  config: HudConfig
): string {
  if (!config.display.showConfigCounts) {
    return '';
  }

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

  return dim(parts.join(' '));
}
