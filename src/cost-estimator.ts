/**
 * 成本估算器 - 根据 token 使用量计算 API 费用
 * 参考 Claude 定价：https://www.anthropic.com/pricing
 */

import type { StdinInput } from './types.js';

// === 模型定价配置 ===

interface ModelPricing {
  inputPricePer1k: number;  // 每 1k input tokens 价格（美元）
  outputPricePer1k: number; // 每 1k output tokens 价格（美元）
}

// 定价数据（2024年价格）
const PRICING: Record<string, ModelPricing> = {
  // Claude 3.5 Sonnet (claude-sonnet-4-20250514)
  'claude-sonnet-4-20250514': {
    inputPricePer1k: 0.003,
    outputPricePer1k: 0.015,
  },
  'claude-sonnet-4': {
    inputPricePer1k: 0.003,
    outputPricePer1k: 0.015,
  },

  // Claude 3.5 Sonnet (claude-sonnet-4-20250514)
  'claude-sonnet-4-20250514:thinking': {
    inputPricePer1k: 0.003,
    outputPricePer1k: 0.015,
  },

  // Claude 3 Opus (claude-opus-4-20250514)
  'claude-opus-4-20250514': {
    inputPricePer1k: 0.015,
    outputPricePer1k: 0.075,
  },
  'claude-opus-4': {
    inputPricePer1k: 0.015,
    outputPricePer1k: 0.075,
  },

  // Claude 3 Haiku (claude-haiku-4-20250514)
  'claude-haiku-4-20250514': {
    inputPricePer1k: 0.0008,
    outputPricePer1k: 0.004,
  },
  'claude-haiku-4': {
    inputPricePer1k: 0.0008,
    outputPricePer1k: 0.004,
  },

  // Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
  'claude-3-5-sonnet-20241022': {
    inputPricePer1k: 0.003,
    outputPricePer1k: 0.015,
  },
  'claude-3-5-sonnet-20250620': {
    inputPricePer1k: 0.003,
    outputPricePer1k: 0.015,
  },

  // Claude 3.5 Haiku (claude-3-5-haiku-20250514)
  'claude-3-5-haiku-20250514': {
    inputPricePer1k: 0.0008,
    outputPricePer1k: 0.004,
  },
  'claude-3-5-haiku': {
    inputPricePer1k: 0.0008,
    outputPricePer1k: 0.004,
  },
};

// === 会话成本统计 ===

interface SessionCost {
  sessionCost: number;      // 当前会话费用
  todayCost: number;        // 今天累计费用
  totalCost: number;        // 总累计费用
  lastResetDate: string;    // 上次重置日期
}

const COST_CACHE_FILE = '.cost-cache.json';
const COST_CACHE_KEY = 'session_cost';

/**
 * 获取模型定价
 */
function getModelPricing(modelId: string): ModelPricing | null {
  // 精确匹配
  if (modelId in PRICING) {
    return PRICING[modelId];
  }

  // 模糊匹配（处理版本号后缀）
  for (const [key, pricing] of Object.entries(PRICING)) {
    if (modelId.startsWith(key.split('-')[0])) {
      return pricing;
    }
  }

  // 默认使用 Sonnet 定价
  return PRICING['claude-sonnet-4'];
}

/**
 * 计算单次交互成本
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const pricing = getModelPricing(modelId);
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1000) * pricing.inputPricePer1k;
  const outputCost = (outputTokens / 1000) * pricing.outputPricePer1k;

  return inputCost + outputCost;
}

/**
 * 从 stdin 数据计算成本
 */
export function calculateCostFromStdin(stdin: StdinInput): number {
  const usage = stdin.context_window?.current_usage;
  if (!usage) return 0;

  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const modelId = stdin.model?.id ?? 'claude-sonnet-4';

  return calculateCost(inputTokens, outputTokens, modelId);
}

/**
 * 格式化成本显示
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01';
  if (cost < 1) return `$${(cost * 100).toFixed(2)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * 获取会话成本统计
 */
export function getSessionCost(): SessionCost | null {
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const os = require('node:os');

    const cachePath = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', COST_CACHE_FILE);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const content = fs.readFileSync(cachePath, 'utf-8');
    const cache = JSON.parse(content);

    return cache[COST_CACHE_KEY] || null;
  } catch {
    return null;
  }
}

/**
 * 更新会话成本统计
 */
export function updateSessionCost(sessionCost: number): void {
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const os = require('node:os');

    const cachePath = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', COST_CACHE_FILE);
    const cacheDir = path.dirname(cachePath);

    // 确保目录存在
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // 读取现有缓存
    let cache: Record<string, SessionCost> = {};
    if (fs.existsSync(cachePath)) {
      try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      } catch {
        // 忽略，使用空对象
      }
    }

    // 获取今天的日期
    const today = new Date().toISOString().split('T')[0];
    const lastReset = cache[COST_CACHE_KEY]?.lastResetDate || today;

    // 如果是新的一天，重置 todayCost
    let todayCost = cache[COST_CACHE_KEY]?.todayCost ?? 0;
    let totalCost = cache[COST_CACHE_KEY]?.totalCost ?? 0;

    if (lastReset !== today) {
      todayCost = 0;
    }

    // 更新成本
    todayCost += sessionCost;
    totalCost += sessionCost;

    // 保存
    cache[COST_CACHE_KEY] = {
      sessionCost,
      todayCost,
      totalCost,
      lastResetDate: today,
    };

    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // 忽略错误
  }
}

/**
 * 清除成本统计
 */
export function clearCostCache(): void {
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const os = require('node:os');

    const cachePath = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', COST_CACHE_FILE);

    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // 忽略错误
  }
}
