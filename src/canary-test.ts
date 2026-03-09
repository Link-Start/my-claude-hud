/**
 * 金丝雀测试（Canary Testing）模块 - 增强版
 * 用于检测 AI 上下文丢失
 * 支持全局金丝雀文件和智能提示
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  CanaryHistoryEntry,
  CanaryStats,
  CanaryAlertType,
  CanaryAlert,
  CanaryTestMode
} from './types.js';

// 金丝雀测试状态
export type CanaryStatus = 'none' | 'prompt' | 'active' | 'lost';

// 金丝雀测试数据
export interface CanaryData {
  status: CanaryStatus;
  timestamp?: Date;
  canaryId?: string;
  source?: 'project' | 'global'; // 金丝雀来源
}

// 金丝雀测试配置
export interface CanaryConfig {
  enabled: boolean;
  autoCreate: boolean; // 自动创建项目金丝雀文件
  useGlobal: boolean; // 使用全局金丝雀文件
  checkInterval: number; // 每隔多少次渲染检查一次
  promptThreshold: number; // 提示创建金丝雀的阈值（会话轮数）
}

const CANARY_FILE_NAME = '.canary.md';
const GLOBAL_CANARY_FILE = path.join(require('os').homedir(), '.claude', 'canary.md');
const CANARY_CACHE_FILE = path.join(require('os').homedir(), '.claude', 'plugins', 'my-claude-hud', '.canary-cache.json');
const PROMPT_CACHE_FILE = path.join(require('os').homedir(), '.claude', 'plugins', 'my-claude-hud', '.canary-prompt-cache.json');
const CANARY_MARKER_START = '<!-- CANARY_TEST_START -->';
const CANARY_MARKER_END = '<!-- CANARY_TEST_END -->';

// 检查计数
let checkCount = 0;

/**
 * 生成唯一金丝雀 ID
 */
function generateCanaryId(): string {
  return `canary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 创建默认金丝雀文件内容
 */
function createDefaultCanaryContent(canaryId: string, isGlobal: boolean = false): string {
  const timestamp = new Date().toISOString();
  const scope = isGlobal ? '全局' : '项目';
  const scopeDesc = isGlobal
    ? '这是一个全局金丝雀测试标记，适用于所有项目。'
    : '这是一个项目级金丝雀测试标记，仅适用于当前项目。';

  return `# ${scope}金丝雀测试标记

${CANARY_MARKER_START}
金丝雀 ID: ${canaryId}
创建时间: ${timestamp}
作用范围: ${scope}
${CANARY_MARKER_END}

## 说明

${scopeDesc}
用于检测 AI 是否仍然记得之前的上下文。

## 测试方法

1. 当你看到这个文件时，说明这是一个金丝雀测试点
2. AI 应该能够记住这个金丝雀 ID：\`${canaryId}\`
3. 如果 AI 遗忘了这个 ID，说明上下文已经丢失
4. HUD 会显示金丝雀测试的状态

## 状态指示

- 🐤 活跃：AI 仍然记得金丝雀
- ⚠️ 丢失：AI 已经遗忘了金丝雀
- 💡 提示：建议创建金丝雀文件以监控上下文状态
`;
}

/**
 * 解析金丝雀文件，提取金丝雀 ID
 */
function parseCanaryFile(content: string): string | null {
  const startMatch = content.indexOf(CANARY_MARKER_START);
  const endMatch = content.indexOf(CANARY_MARKER_END);

  if (startMatch === -1 || endMatch === -1) {
    return null;
  }

  const markerContent = content.substring(
    startMatch + CANARY_MARKER_START.length,
    endMatch
  );

  const idMatch = markerContent.match(/金丝雀 ID:\s*([^\s\n]+)/);
  return idMatch ? idMatch[1] : null;
}

/**
 * 初始化全局金丝雀文件
 */
export function initGlobalCanary(): boolean {
  try {
    const globalDir = path.dirname(GLOBAL_CANARY_FILE);
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    if (fs.existsSync(GLOBAL_CANARY_FILE)) {
      return false; // 已存在
    }

    const canaryId = generateCanaryId();
    const content = createDefaultCanaryContent(canaryId, true);

    fs.writeFileSync(GLOBAL_CANARY_FILE, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('[Canary] 初始化全局金丝雀文件失败:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * 在项目中创建金丝雀文件
 */
export function createCanaryFile(projectDir: string): boolean {
  try {
    const canaryPath = path.join(projectDir, CANARY_FILE_NAME);

    // 检查是否已存在
    if (fs.existsSync(canaryPath)) {
      return false;
    }

    const canaryId = generateCanaryId();
    const content = createDefaultCanaryContent(canaryId, false);

    fs.writeFileSync(canaryPath, content, 'utf-8');

    // 更新缓存
    updateCanaryCache(projectDir, {
      status: 'active',
      timestamp: new Date(),
      canaryId,
      source: 'project'
    });

    return true;
  } catch (error) {
    console.error('[Canary] 创建项目金丝雀文件失败:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * 获取提示缓存
 */
function getPromptCount(projectDir: string): number {
  try {
    if (!fs.existsSync(PROMPT_CACHE_FILE)) {
      return 0;
    }

    const content = fs.readFileSync(PROMPT_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content);
    return cache[projectDir] || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 增加提示计数
 */
function incrementPromptCount(projectDir: string): void {
  try {
    const cacheDir = path.dirname(PROMPT_CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    let cache: Record<string, number> = {};
    if (fs.existsSync(PROMPT_CACHE_FILE)) {
      const content = fs.readFileSync(PROMPT_CACHE_FILE, 'utf-8');
      cache = JSON.parse(content);
    }

    cache[projectDir] = (cache[projectDir] || 0) + 1;
    fs.writeFileSync(PROMPT_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    // 忽略错误
  }
}

/**
 * 检查项目中的金丝雀状态（增强版）
 */
export function checkCanaryStatus(projectDir: string, transcript?: any): CanaryData {
  try {
    const config = loadCanaryConfig();
    if (!config.enabled) {
      return { status: 'none' };
    }

    const projectCanaryPath = path.join(projectDir, CANARY_FILE_NAME);
    let canaryPath = projectCanaryPath;
    let canaryId: string | null = null;
    let source: 'project' | 'global' = 'project';

    // 1. 首先检查项目级金丝雀文件
    if (fs.existsSync(projectCanaryPath)) {
      const content = fs.readFileSync(projectCanaryPath, 'utf-8');
      canaryId = parseCanaryFile(content);
      source = 'project';
    }

    // 2. 如果没有项目金丝雀，检查全局金丝雀
    if (!canaryId && config.useGlobal) {
      // 确保全局金丝雀文件存在
      initGlobalCanary();

      if (fs.existsSync(GLOBAL_CANARY_FILE)) {
        const content = fs.readFileSync(GLOBAL_CANARY_FILE, 'utf-8');
        canaryId = parseCanaryFile(content);
        canaryPath = GLOBAL_CANARY_FILE;
        source = 'global';
      }
    }

    // 3. 如果都没有金丝雀，根据配置决定是否提示或自动创建
    if (!canaryId) {
      if (config.autoCreate) {
        createCanaryFile(projectDir);
        return {
          status: 'active',
          timestamp: new Date(),
          canaryId: undefined,
          source: 'project'
        };
      }

      // 增加提示计数
      incrementPromptCount(projectDir);
      const promptCount = getPromptCount(projectDir);

      // 如果达到提示阈值，返回提示状态
      if (promptCount >= config.promptThreshold) {
        return {
          status: 'prompt',
          timestamp: new Date(),
          canaryId: undefined,
          source: undefined
        };
      }

      return { status: 'none' };
    }

    // 4. 有金丝雀文件，检查状态
    if (!canaryId) {
      return { status: 'none' };
    }

    // 从缓存读取之前的金丝雀状态
    const cached = loadCanaryCache();

    // 检查会话记录中是否包含金丝雀引用
    const canaryRemembered = checkCanaryInTranscript(transcript, canaryId, canaryPath);

    if (canaryRemembered) {
      // 更新缓存
      updateCanaryCache(projectDir, {
        status: 'active',
        timestamp: new Date(),
        canaryId,
        source
      });
      return {
        status: 'active',
        timestamp: new Date(),
        canaryId,
        source
      };
    } else if (cached && cached.canaryId === canaryId) {
      // 缓存中有金丝雀记录，但会话记录中没有找到
      // 这可能意味着上下文丢失
      return {
        status: 'lost',
        timestamp: new Date(),
        canaryId,
        source
      };
    }

    // 首次检测，更新缓存
    updateCanaryCache(projectDir, {
      status: 'active',
      timestamp: new Date(),
      canaryId,
      source
    });

    return {
      status: 'active',
      timestamp: new Date(),
      canaryId,
      source
    };
  } catch (error) {
    console.error('[Canary] 检查金丝雀状态失败:', error instanceof Error ? error.message : 'Unknown error');
    return { status: 'none' };
  }
}

/**
 * 检查会话记录中是否包含金丝雀引用
 */
function checkCanaryInTranscript(transcript: any, canaryId: string, canaryPath: string): boolean {
  if (!transcript) return false;

  // 简化的检查：查看工具列表中是否有对金丝雀文件的读取
  if (transcript.tools && Array.isArray(transcript.tools)) {
    const recentTools = transcript.tools.slice(-10); // 检查最近 10 个工具

    for (const tool of recentTools) {
      if (tool.name === 'Read' && tool.target === canaryPath) {
        // 找到对金丝雀文件的读取，认为 AI 还记得
        return true;
      }
    }
  }

  // 检查计数增加，避免频繁检查
  checkCount++;

  return false;
}

/**
 * 清除金丝雀文件
 */
export function clearCanaryFile(projectDir: string): boolean {
  try {
    const canaryPath = path.join(projectDir, CANARY_FILE_NAME);

    if (fs.existsSync(canaryPath)) {
      fs.unlinkSync(canaryPath);
    }

    // 清除缓存
    clearCanaryCache();

    return true;
  } catch (error) {
    console.error('[Canary] 清除金丝雀文件失败:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * 加载金丝雀配置
 */
export function loadCanaryConfig(): CanaryConfig {
  try {
    const configDir = path.join(require('os').homedir(), '.claude', 'plugins', 'my-claude-hud');
    const configPath = path.join(configDir, 'config.json');

    if (!fs.existsSync(configPath)) {
      return {
        enabled: true,
        autoCreate: false,
        useGlobal: true,
        checkInterval: 10,
        promptThreshold: 5 // 5次渲染后提示
      };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);

    return {
      enabled: config.canaryTest?.enabled ?? true,
      autoCreate: config.canaryTest?.autoCreate ?? false,
      useGlobal: config.canaryTest?.useGlobal ?? true,
      checkInterval: config.canaryTest?.checkInterval ?? 10,
      promptThreshold: config.canaryTest?.promptThreshold ?? 5
    };
  } catch (error) {
    return {
      enabled: true,
      autoCreate: false,
      useGlobal: true,
      checkInterval: 10,
      promptThreshold: 5
    };
  }
}

/**
 * 更新金丝雀缓存
 */
function updateCanaryCache(projectDir: string, data: CanaryData): void {
  try {
    const cacheDir = path.dirname(CANARY_CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cache: Record<string, any> = {
      projectDir,
      ...data,
      lastCheck: new Date().toISOString()
    };

    fs.writeFileSync(CANARY_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    // 缓存更新失败不影响主流程
  }
}

/**
 * 加载金丝雀缓存
 */
function loadCanaryCache(): CanaryData | null {
  try {
    if (!fs.existsSync(CANARY_CACHE_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CANARY_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content);

    return {
      status: cache.status,
      timestamp: cache.timestamp ? new Date(cache.timestamp) : undefined,
      canaryId: cache.canaryId,
      source: cache.source
    };
  } catch (error) {
    return null;
  }
}

/**
 * 清除金丝雀缓存
 */
function clearCanaryCache(): void {
  try {
    if (fs.existsSync(CANARY_CACHE_FILE)) {
      fs.unlinkSync(CANARY_CACHE_FILE);
    }
  } catch (error) {
    // 缓存清除失败不影响主流程
  }
}

/**
 * 获取金丝雀状态显示文本
 */
export function getCanaryStatusDisplay(data: CanaryData): string {
  switch (data.status) {
    case 'active':
      const sourceLabel = data.source === 'global' ? '全局' : '';
      return `🐤 Canary ${sourceLabel}(${data.canaryId?.substring(7, 13)}...)`;
    case 'lost':
      return `⚠️ Canary Lost (${data.canaryId?.substring(7, 13)}...)`;
    case 'prompt':
      return `💡 建议添加金丝雀测试`;
    case 'none':
    default:
      return '';
  }
}

/**
 * 检查是否应该执行金丝雀检查（基于计数器）
 */
export function shouldCheckCanary(): boolean {
  const config = loadCanaryConfig();
  return checkCount % config.checkInterval === 0;
}

/**
 * 重置提示计数（创建金丝雀后调用）
 */
export function resetPromptCount(projectDir: string): void {
  try {
    if (!fs.existsSync(PROMPT_CACHE_FILE)) {
      return;
    }

    const content = fs.readFileSync(PROMPT_CACHE_FILE, 'utf-8');
    const cache: Record<string, number> = JSON.parse(content);
    delete cache[projectDir];

    fs.writeFileSync(PROMPT_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    // 忽略错误
  }
}

// === 金丝雀增强功能 ===

import * as os from 'os';

// 增强功能的文件路径
const HISTORY_FILE = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.canary-history.json');
const STATS_FILE = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.canary-stats.json');
const ALERTS_FILE = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.canary-alerts.json');
const TEMPLATES_FILE = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud', '.canary-templates.json');

// 历史记录存储
let historyCache: CanaryHistoryEntry[] = [];

/**
 * 记录金丝雀状态变更历史
 */
export function recordHistory(
  projectDir: string,
  status: CanaryStatus,
  canaryId?: string,
  source?: 'project' | 'global'
): void {
  try {
    const entry: CanaryHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(),
      status,
      canaryId,
      source,
      projectDir,
    };

    historyCache.push(entry);

    // 限制历史记录数量（最多保存 1000 条）
    if (historyCache.length > 1000) {
      historyCache = historyCache.slice(-1000);
    }

    // 持久化到文件
    persistHistory();
  } catch (error) {
    // 忽略历史记录失败
  }
}

/**
 * 持久化历史记录到文件
 */
function persistHistory(): void {
  try {
    const cacheDir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyCache, null, 2), 'utf-8');
  } catch (error) {
    // 忽略写入失败
  }
}

/**
 * 加载历史记录
 */
export function loadHistory(): CanaryHistoryEntry[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const history = JSON.parse(content);

    return history.map((h: any) => ({
      ...h,
      timestamp: new Date(h.timestamp),
    }));
  } catch (error) {
    return [];
  }
}

/**
 * 获取金丝雀统计信息
 */
export function getCanaryStats(): CanaryStats {
  try {
    const history = loadHistory();
    const stats: CanaryStats = {
      totalChecks: history.length,
      activeCount: 0,
      lostCount: 0,
      lossRate: 0,
      avgDuration: 0,
      totalLostTime: 0,
      longestLostDuration: 0,
      successRate: 0,
    };

    if (history.length === 0) {
      return stats;
    }

    let totalDuration = 0;
    let lostCount = 0;
    let activeCount = 0;
    let lostDurations: number[] = [];

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];

      if (entry.status === 'active') {
        activeCount++;
        stats.lastActiveTime = entry.timestamp;
      } else if (entry.status === 'lost') {
        lostCount++;
        stats.lastLostTime = entry.timestamp;

        if (entry.duration) {
          lostDurations.push(entry.duration);
          stats.totalLostTime += entry.duration;
        }
      }

      if (entry.duration) {
        totalDuration += entry.duration;
      }
    }

    stats.activeCount = activeCount;
    stats.lostCount = lostCount;
    stats.lossRate = stats.totalChecks > 0 ? (lostCount / stats.totalChecks) * 100 : 0;
    stats.successRate = stats.totalChecks > 0 ? (activeCount / stats.totalChecks) * 100 : 0;
    stats.avgDuration = stats.totalChecks > 0 ? totalDuration / stats.totalChecks : 0;
    stats.longestLostDuration = lostDurations.length > 0 ? Math.max(...lostDurations) : 0;

    return stats;
  } catch (error) {
    return {
      totalChecks: 0,
      activeCount: 0,
      lostCount: 0,
      lossRate: 0,
      avgDuration: 0,
      totalLostTime: 0,
      longestLostDuration: 0,
      successRate: 0,
    };
  }
}

/**
 * 发送金丝雀告警
 */
export function sendCanaryAlert(
  type: CanaryAlertType,
  canaryId?: string,
  message?: string
): void {
  try {
    const alert: CanaryAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date(),
      type,
      canaryId,
      message: message || getDefaultAlertMessage(type),
    };

    // 在终端显示告警
    console.error(`[Canary Alert] ${alert.message}`);

    // 持久化告警记录
    persistAlert(alert);
  } catch (error) {
    // 忽略告警失败
  }
}

/**
 * 获取默认告警消息
 */
function getDefaultAlertMessage(type: CanaryAlertType): string {
  switch (type) {
    case 'lost':
      return '⚠️ 金丝雀丢失！AI 可能已经遗忘了上下文';
    case 'frequent_lost':
      return '⚠️ 金丝雀频繁丢失！上下文可能不稳定';
    case 'long_lost':
      return '⚠️ 金丝雀长时间丢失！建议重新创建';
    case 'recovery':
      return '✅ 金丝雀已恢复！AI 重新记住了上下文';
    default:
      return '⚠️ 金丝雀告警';
  }
}

/**
 * 持久化告警记录
 */
function persistAlert(alert: CanaryAlert): void {
  try {
    const cacheDir = path.dirname(ALERTS_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    let alerts: CanaryAlert[] = [];
    if (fs.existsSync(ALERTS_FILE)) {
      const content = fs.readFileSync(ALERTS_FILE, 'utf-8');
      alerts = JSON.parse(content);
    }

    alerts.push(alert);

    // 限制告警数量（最多保存 100 条）
    if (alerts.length > 100) {
      alerts = alerts.slice(-100);
    }

    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf-8');
  } catch (error) {
    // 忽略写入失败
  }
}

/**
 * 获取告警记录
 */
export function getAlerts(limit?: number): CanaryAlert[] {
  try {
    if (!fs.existsSync(ALERTS_FILE)) {
      return [];
    }

    const content = fs.readFileSync(ALERTS_FILE, 'utf-8');
    const alerts = JSON.parse(content);

    return alerts.map((a: any) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    })).slice(-(limit ?? alerts.length));
  } catch (error) {
    return [];
  }
}

/**
 * 创建不同测试模式的金丝雀内容
 */
export function createCanaryContentByMode(
  canaryId: string,
  testMode: CanaryTestMode,
  isGlobal: boolean = false
): string {
  const timestamp = new Date().toISOString();
  const scope = isGlobal ? '全局' : '项目';

  let content = '';
  let description = '';
  let markers = '';

  switch (testMode) {
    case 'light':
      description = '轻量级金丝雀测试 - 最小化上下文占用';
      markers = '金丝雀 ID';
      break;

    case 'medium':
      description = '中等强度金丝雀测试 - 平衡准确性和上下文占用';
      markers = '金丝雀 ID\n创建时间\n作用范围';
      break;

    case 'heavy':
      description = '重度金丝雀测试 - 最大准确性，更多上下文标记';
      markers = '金丝雀 ID\n创建时间\n作用范围\n测试模式\n重要性级别';
      break;
  }

  content = `# ${scope}金丝雀测试标记 [${testMode}]

${CANARY_MARKER_START}
${markers}
${CANARY_MARKER_END}

## 说明

${description}

## 测试方法

1. 当你看到这个文件时，说明这是一个金丝雀测试点
2. AI 应该能够记住这个金丝雀 ID：\`${canaryId}\`
3. 如果 AI 遗忘了这个 ID，说明上下文已经丢失
4. HUD 会显示金丝雀测试的状态

## 状态指示

- 🐤 活跃：AI 仍然记得金丝雀
- ⚠️ 丢失：AI 已经遗忘了金丝雀
- 💡 提示：建议创建金丝雀文件以监控上下文状态
`;

  return content;
}

/**
 * 自动恢复金丝雀
 */
export function autoRecoverCanary(projectDir: string): boolean {
  try {
    // 清除旧的金丝雀文件
    clearCanaryFile(projectDir);

    // 创建新的金丝雀文件
    return createCanaryFile(projectDir);
  } catch (error) {
    return false;
  }
}

/**
 * 生成金丝雀历史报告
 */
export function generateHistoryReport(format: 'json' | 'markdown' = 'markdown'): string {
  const history = loadHistory();
  const stats = getCanaryStats();

  if (format === 'json') {
    return JSON.stringify({
      generated: new Date().toISOString(),
      history: history,
      stats: stats,
    }, null, 2);
  }

  // Markdown 格式
  let report = '# 金丝雀测试历史报告\n\n';
  report += `生成时间: ${new Date().toISOString()}\n\n`;

  report += '## 统计信息\n\n';
  report += `- 总检查次数: ${stats.totalChecks}\n`;
  report += `- 活跃次数: ${stats.activeCount}\n`;
  report += `- 丢失次数: ${stats.lostCount}\n`;
  report += `- 丢失率: ${stats.lossRate.toFixed(2)}%\n`;
  report += `- 成功率: ${stats.successRate.toFixed(2)}%\n`;
  report += `- 平均持续时间: ${stats.avgDuration.toFixed(0)}ms\n`;
  report += `- 总丢失时间: ${stats.totalLostTime.toFixed(0)}ms\n`;
  report += `- 最长丢失持续时间: ${stats.longestLostDuration.toFixed(0)}ms\n\n`;

  if (stats.lastActiveTime) {
    report += `- 最后活跃时间: ${stats.lastActiveTime.toISOString()}\n`;
  }
  if (stats.lastLostTime) {
    report += `- 最后丢失时间: ${stats.lastLostTime.toISOString()}\n`;
  }

  report += '\n## 最近历史记录\n\n';
  const recentHistory = history.slice(-20);
  for (const entry of recentHistory) {
    const statusIcon = entry.status === 'active' ? '🐤' : entry.status === 'lost' ? '⚠️' : '💡';
    report += `${statusIcon} ${entry.timestamp.toISOString()} - ${entry.status}`;
    if (entry.canaryId) {
      report += ` (${entry.canaryId.substring(7, 13)}...)`;
    }
    report += '\n';
  }

  return report;
}

/**
 * 清除所有金丝雀数据
 */
export function clearAllCanaryData(): void {
  try {
    const files = [
      HISTORY_FILE,
      STATS_FILE,
      ALERTS_FILE,
      TEMPLATES_FILE,
      CANARY_CACHE_FILE,
      PROMPT_CACHE_FILE,
    ];

    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  } catch (error) {
    // 忽略清除失败
  }
}
