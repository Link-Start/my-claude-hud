/**
 * 身份行渲染 - 模型名称、计划名称、提供商标签
 */

import type { StdinInput, UsageData } from '../types.js';
import { getProviderLabel, getModelName } from '../stdin.js';
import { dim } from './colors.js';

/**
 * 渲染身份行（模型 + 计划名称 + 提供商）
 */
export function renderIdentityLine(
  stdin: StdinInput,
  usageData: UsageData | null,
  showModel: boolean
): string {
  if (!showModel) {
    return '';
  }

  const parts: string[] = [];

  // 模型名称
  const modelName = getModelName(stdin);
  parts.push(modelName);

  // 提供商标签（AWS Bedrock）
  const provider = getProviderLabel(stdin);
  if (provider) {
    parts.push(dim(`(${provider})`));
  }

  // 计划名称（与提供商标签互斥）
  if (!provider && usageData?.planName) {
    parts.push(dim(`[${usageData.planName}]`));
  }

  return parts.join(' ');
}
