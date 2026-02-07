/**
 * API 使用量查询 - 获取 5 小时和 7 天使用窗口
 */

import { execSync } from 'node:child_process';

export interface ApiUsageData {
  planName: string | null;
  fiveHourPercent: number | null;
  sevenDayPercent: number | null;
  fiveHourResetAt: Date | null;
  sevenDayResetAt: Date | null;
  apiUnavailable?: boolean;
  apiError?: string;
}

/**
 * 获取 API 使用量数据
 * 通过解析 claude 命令的输出
 */
export async function getApiUsage(): Promise<ApiUsageData | null> {
  try {
    // 调用 claude 命令获取使用量信息
    const output = execSync('claude auth status 2>/dev/null', {
      encoding: 'utf-8',
      timeout: 5000,
    });

    return parseAuthStatus(output);
  } catch {
    // 如果命令失败，返回 null 表示不可用
    return {
      planName: null,
      fiveHourPercent: null,
      sevenDayPercent: null,
      fiveHourResetAt: null,
      sevenDayResetAt: null,
      apiUnavailable: true,
      apiError: 'Failed to fetch usage data',
    };
  }
}

/**
 * 解析 claude auth status 的输出
 */
function parseAuthStatus(output: string): ApiUsageData | null {
  const lines = output.split('\n');

  let planName: string | null = null;
  let fiveHourPercent: number | null = null;
  let sevenDayPercent: number | null = null;

  for (const line of lines) {
    // 解析计划名称
    if (line.includes('Plan:')) {
      const match = line.match(/Plan:\s*(\w+)/);
      if (match) {
        planName = match[1];
      }
    }

    // 解析 5 小时使用量
    if (line.includes('5-hour window:')) {
      const match = line.match(/(\d+)%/);
      if (match) {
        fiveHourPercent = Number.parseInt(match[1], 10);
      }
    }

    // 解析 7 天使用量
    if (line.includes('7-day window:')) {
      const match = line.match(/(\d+)%/);
      if (match) {
        sevenDayPercent = Number.parseInt(match[1], 10);
      }
    }
  }

  return {
    planName,
    fiveHourPercent,
    sevenDayPercent,
    fiveHourResetAt: null, // 需要从 API 获取
    sevenDayResetAt: null,
  };
}

/**
 * 检查是否达到使用限制
 */
export function isUsageLimitReached(data: ApiUsageData): boolean {
  return data.fiveHourPercent === 100 || data.sevenDayPercent === 100;
}
