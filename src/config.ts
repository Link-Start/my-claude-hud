/**
 * HUD 配置管理 - 完整版
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export type LineLayoutType = 'compact' | 'expanded';
export type ContextValueMode = 'percent' | 'tokens';

export interface HudConfig {
  lineLayout: LineLayoutType;
  showSeparators: boolean;
  pathLevels: 1 | 2 | 3;
  gitStatus: {
    enabled: boolean;
    showDirty: boolean;
    showAheadBehind: boolean;
    showFileStats: boolean;
  };
  display: {
    showModel: boolean;
    showContextBar: boolean;
    contextValue: ContextValueMode;
    showConfigCounts: boolean;
    showDuration: boolean;
    showSpeed: boolean;
    showTokenBreakdown: boolean;
    showUsage: boolean;
    usageBarEnabled: boolean;
    showTools: boolean;
    showAgents: boolean;
    showTodos: boolean;
    usageThreshold: number;
    sevenDayThreshold: number;
    environmentThreshold: number;
  };
}

// 默认配置
export const DEFAULT_CONFIG: HudConfig = {
  lineLayout: 'expanded',
  showSeparators: false,
  pathLevels: 1,
  gitStatus: {
    enabled: true,
    showDirty: true,
    showAheadBehind: false,
    showFileStats: false,
  },
  display: {
    showModel: true,
    showContextBar: true,
    contextValue: 'percent',
    showConfigCounts: true,
    showDuration: true,
    showSpeed: false,
    showTokenBreakdown: true,
    showUsage: true,
    usageBarEnabled: true,
    showTools: true,
    showAgents: true,
    showTodos: true,
    usageThreshold: 0,
    sevenDayThreshold: 80,
    environmentThreshold: 0,
  },
};

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return path.join(os.homedir(), '.my-claude-hud.json');
}

/**
 * 加载用户配置
 */
export function loadConfig(): HudConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(raw);

    return mergeConfig(DEFAULT_CONFIG, userConfig);
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * 合并用户配置和默认配置
 */
function mergeConfig(defaultConfig: HudConfig, userConfig: Partial<HudConfig>): HudConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    gitStatus: {
      ...defaultConfig.gitStatus,
      ...userConfig.gitStatus,
    },
    display: {
      ...defaultConfig.display,
      ...userConfig.display,
    },
  };
}
