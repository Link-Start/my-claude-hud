/**
 * HUD 配置管理 - 完整版（含验证和迁移）
 * 参考 claude-hud 实现
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { DisplayLanguage } from './types.js';

export type LineLayoutType = 'compact' | 'expanded';
export type AutocompactBufferMode = 'enabled' | 'disabled';
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
    showCost: boolean;
    autocompactBuffer: AutocompactBufferMode;
    usageThreshold: number;
    sevenDayThreshold: number;
    environmentThreshold: number;
    displayLanguage: DisplayLanguage;
  };
  alerts: {
    enabled: boolean;
    contextWarning: number;
    contextCritical: number;
    apiLimitWarning: number;
  };
  theme: {
    colorTheme: string;
    customColors?: Record<string, string>;
  };
  i18n?: {
    customTranslationFile?: string;
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
    showCost: false,
    autocompactBuffer: 'enabled',
    usageThreshold: 0,
    sevenDayThreshold: 80,
    environmentThreshold: 0,
    displayLanguage: 'zh',
  },
  alerts: {
    enabled: true,
    contextWarning: 80,
    contextCritical: 95,
    apiLimitWarning: 90,
  },
  theme: {
    colorTheme: 'default',
  },
  i18n: {
    customTranslationFile: undefined,
  },
};

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', 'config.json');
}

/**
 * 获取项目配置文件路径
 * 优先级：.claude-hud.json > .claude-hud/config.json
 */
export function getProjectConfigPath(cwd: string): string | null {
  if (!cwd) return null;

  // 优先检查 .claude-hud.json
  const jsonPath = path.join(cwd, '.claude-hud.json');
  if (fs.existsSync(jsonPath)) {
    return jsonPath;
  }

  // 检查 .claude-hud/config.json
  const dirPath = path.join(cwd, '.claude-hud', 'config.json');
  if (fs.existsSync(dirPath)) {
    return dirPath;
  }

  return null;
}

// === 验证函数 ===

function validatePathLevels(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function validateLineLayout(value: unknown): value is LineLayoutType {
  return value === 'compact' || value === 'expanded';
}

function validateAutocompactBuffer(value: unknown): value is AutocompactBufferMode {
  return value === 'enabled' || value === 'disabled';
}

function validateContextValue(value: unknown): value is ContextValueMode {
  return value === 'percent' || value === 'tokens';
}

function validateThreshold(value: unknown, max = 100): number {
  if (typeof value !== 'number') return 0;
  return Math.max(0, Math.min(max, value));
}

// === 配置迁移 ===

interface LegacyConfig {
  layout?: 'default' | 'separators';
}

function migrateConfig(userConfig: Partial<HudConfig> & LegacyConfig): Partial<HudConfig> {
  const migrated = { ...userConfig } as Partial<HudConfig> & LegacyConfig;

  if ('layout' in userConfig && !('lineLayout' in userConfig)) {
    if (userConfig.layout === 'separators') {
      migrated.lineLayout = 'compact';
      migrated.showSeparators = true;
    } else {
      migrated.lineLayout = 'compact';
      migrated.showSeparators = false;
    }
    delete migrated.layout;
  }

  return migrated;
}

// === 配置合并 ===

function mergeConfig(userConfig: Partial<HudConfig>): HudConfig {
  const migrated = migrateConfig(userConfig);

  const lineLayout = validateLineLayout(migrated.lineLayout)
    ? migrated.lineLayout
    : DEFAULT_CONFIG.lineLayout;

  const showSeparators = typeof migrated.showSeparators === 'boolean'
    ? migrated.showSeparators
    : DEFAULT_CONFIG.showSeparators;

  const pathLevels = validatePathLevels(migrated.pathLevels)
    ? migrated.pathLevels
    : DEFAULT_CONFIG.pathLevels;

  const gitStatus = {
    enabled: typeof migrated.gitStatus?.enabled === 'boolean'
      ? migrated.gitStatus.enabled
      : DEFAULT_CONFIG.gitStatus.enabled,
    showDirty: typeof migrated.gitStatus?.showDirty === 'boolean'
      ? migrated.gitStatus.showDirty
      : DEFAULT_CONFIG.gitStatus.showDirty,
    showAheadBehind: typeof migrated.gitStatus?.showAheadBehind === 'boolean'
      ? migrated.gitStatus.showAheadBehind
      : DEFAULT_CONFIG.gitStatus.showAheadBehind,
    showFileStats: typeof migrated.gitStatus?.showFileStats === 'boolean'
      ? migrated.gitStatus.showFileStats
      : DEFAULT_CONFIG.gitStatus.showFileStats,
  };

  const display = {
    showModel: typeof migrated.display?.showModel === 'boolean'
      ? migrated.display.showModel
      : DEFAULT_CONFIG.display.showModel,
    showContextBar: typeof migrated.display?.showContextBar === 'boolean'
      ? migrated.display.showContextBar
      : DEFAULT_CONFIG.display.showContextBar,
    contextValue: validateContextValue(migrated.display?.contextValue)
      ? migrated.display.contextValue
      : DEFAULT_CONFIG.display.contextValue,
    showConfigCounts: typeof migrated.display?.showConfigCounts === 'boolean'
      ? migrated.display.showConfigCounts
      : DEFAULT_CONFIG.display.showConfigCounts,
    showDuration: typeof migrated.display?.showDuration === 'boolean'
      ? migrated.display.showDuration
      : DEFAULT_CONFIG.display.showDuration,
    showSpeed: typeof migrated.display?.showSpeed === 'boolean'
      ? migrated.display.showSpeed
      : DEFAULT_CONFIG.display.showSpeed,
    showTokenBreakdown: typeof migrated.display?.showTokenBreakdown === 'boolean'
      ? migrated.display.showTokenBreakdown
      : DEFAULT_CONFIG.display.showTokenBreakdown,
    showUsage: typeof migrated.display?.showUsage === 'boolean'
      ? migrated.display.showUsage
      : DEFAULT_CONFIG.display.showUsage,
    usageBarEnabled: typeof migrated.display?.usageBarEnabled === 'boolean'
      ? migrated.display.usageBarEnabled
      : DEFAULT_CONFIG.display.usageBarEnabled,
    showTools: typeof migrated.display?.showTools === 'boolean'
      ? migrated.display.showTools
      : DEFAULT_CONFIG.display.showTools,
    showAgents: typeof migrated.display?.showAgents === 'boolean'
      ? migrated.display.showAgents
      : DEFAULT_CONFIG.display.showAgents,
    showTodos: typeof migrated.display?.showTodos === 'boolean'
      ? migrated.display.showTodos
      : DEFAULT_CONFIG.display.showTodos,
    showCost: typeof migrated.display?.showCost === 'boolean'
      ? migrated.display.showCost
      : DEFAULT_CONFIG.display.showCost,
    autocompactBuffer: validateAutocompactBuffer(migrated.display?.autocompactBuffer)
      ? migrated.display.autocompactBuffer
      : DEFAULT_CONFIG.display.autocompactBuffer,
    usageThreshold: validateThreshold(migrated.display?.usageThreshold, 100),
    sevenDayThreshold: validateThreshold(migrated.display?.sevenDayThreshold, 100),
    environmentThreshold: validateThreshold(migrated.display?.environmentThreshold, 100),
    displayLanguage: (migrated.display?.displayLanguage === 'zh' || migrated.display?.displayLanguage === 'en')
      ? migrated.display.displayLanguage
      : DEFAULT_CONFIG.display.displayLanguage,
  };

  const alerts = {
    enabled: typeof migrated.alerts?.enabled === 'boolean'
      ? migrated.alerts.enabled
      : DEFAULT_CONFIG.alerts.enabled,
    contextWarning: validateThreshold(migrated.alerts?.contextWarning, 100),
    contextCritical: validateThreshold(migrated.alerts?.contextCritical, 100),
    apiLimitWarning: validateThreshold(migrated.alerts?.apiLimitWarning, 100),
  };

  const theme = {
    colorTheme: typeof migrated.theme?.colorTheme === 'string'
      ? migrated.theme.colorTheme
      : DEFAULT_CONFIG.theme.colorTheme,
    customColors: migrated.theme?.customColors,
  };

  const i18n = {
    customTranslationFile: typeof migrated.i18n?.customTranslationFile === 'string'
      ? migrated.i18n.customTranslationFile
      : DEFAULT_CONFIG.i18n?.customTranslationFile,
  };

  return { lineLayout, showSeparators, pathLevels, gitStatus, display, alerts, theme, i18n };
}

/**
 * 加载用户配置（支持项目配置覆盖）
 * @param cwd 当前工作目录，用于查找项目配置
 */
export async function loadConfig(cwd?: string): Promise<HudConfig> {
  // 1. 加载全局配置
  const globalConfig = loadConfigFile(getConfigPath());

  // 2. 加载项目配置（如果存在）
  const projectConfigPath = cwd ? getProjectConfigPath(cwd) : null;
  const projectConfig = projectConfigPath ? loadConfigFile(projectConfigPath) : {};

  // 3. 合并配置：全局配置 + 项目配置（项目配置覆盖全局配置）
  const merged = { ...globalConfig, ...projectConfig };

  // 4. 深度合并嵌套对象
  if (projectConfig.gitStatus) {
    merged.gitStatus = { ...globalConfig.gitStatus, ...projectConfig.gitStatus };
  }
  if (projectConfig.display) {
    merged.display = { ...globalConfig.display, ...projectConfig.display };
  }
  if (projectConfig.alerts) {
    merged.alerts = { ...globalConfig.alerts, ...projectConfig.alerts };
  }

  return mergeConfig(merged);
}

/**
 * 加载配置文件
 */
function loadConfigFile(configPath: string): Partial<HudConfig> {
  try {
    if (!fs.existsSync(configPath)) {
      return {};
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Partial<HudConfig>;
  } catch {
    return {};
  }
}
