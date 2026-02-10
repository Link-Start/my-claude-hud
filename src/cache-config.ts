/**
 * 缓存配置管理 - 统一各模块的缓存 TTL 配置
 * 支持通过 config.json 自定义缓存超时时间
 */

import type { HudConfig } from './types.js';

// === 类型定义 ===

/**
 * 缓存配置结构
 */
export interface CacheConfig {
  git: {
    ttlMs: number;           // Git 状态缓存 TTL（毫秒）
    maxRepositories: number;  // 最大缓存仓库数
  };
  api: {
    ttlMs: number;           // API 成功缓存 TTL（毫秒）
    failureTtlMs: number;    // API 失败缓存 TTL（毫秒）
    keychainBackoffMs: number; // Keychain 失败退避时间（毫秒）
  };
  speed: {
    ttlMs: number;           // 速度缓存 TTL（毫秒）
    updateIntervalMs: number; // 速度更新间隔（毫秒）
  };
}

// === 默认值 ===

/**
 * 默认缓存配置
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  git: {
    ttlMs: 5000,             // 5 秒
    maxRepositories: 50,     // 最多 50 个仓库
  },
  api: {
    ttlMs: 60000,            // 60 秒
    failureTtlMs: 15000,     // 15 秒
    keychainBackoffMs: 60000, // 60 秒
  },
  speed: {
    ttlMs: 5000,             // 5 秒
    updateIntervalMs: 2000,  // 2 秒
  },
};

// === 公共函数 ===

/**
 * 获取缓存配置
 * 合并用户配置和默认值
 *
 * @param userConfig - 用户配置（可选）
 * @returns 缓存配置
 *
 * @example
 * // 使用默认配置
 * const config = getCacheConfig();
 *
 * // 使用自定义配置
 * const userConfig: Partial<HudConfig> = {
 *   cache: { git: { ttlMs: 10000 } }
 * };
 * const config = getCacheConfig(userConfig);
 */
export function getCacheConfig(userConfig?: HudConfig): CacheConfig {
  if (!userConfig?.cache) {
    return { ...DEFAULT_CACHE_CONFIG };
  }

  const { cache } = userConfig;

  return {
    git: {
      ttlMs: cache.git?.ttlMs ?? DEFAULT_CACHE_CONFIG.git.ttlMs,
      maxRepositories: cache.git?.maxRepositories ?? DEFAULT_CACHE_CONFIG.git.maxRepositories,
    },
    api: {
      ttlMs: cache.api?.ttlMs ?? DEFAULT_CACHE_CONFIG.api.ttlMs,
      failureTtlMs: cache.api?.failureTtlMs ?? DEFAULT_CACHE_CONFIG.api.failureTtlMs,
      keychainBackoffMs: cache.api?.keychainBackoffMs ?? DEFAULT_CACHE_CONFIG.api.keychainBackoffMs,
    },
    speed: {
      ttlMs: cache.speed?.ttlMs ?? DEFAULT_CACHE_CONFIG.speed.ttlMs,
      updateIntervalMs: cache.speed?.updateIntervalMs ?? DEFAULT_CACHE_CONFIG.speed.updateIntervalMs,
    },
  };
}

/**
 * 获取默认缓存配置（用于文档和测试）
 */
export function getDefaultCacheConfig(): CacheConfig {
  return { ...DEFAULT_CACHE_CONFIG };
}
