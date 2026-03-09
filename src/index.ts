/**
 * My Claude HUD - 主入口（完整版）
 * 参考 claude-hud 实现，显示上下文使用、工具状态、Agent 和 Todo 进度
 * 包含：配置统计、Git 状态、API 使用量、速度追踪等完整功能
 * 支持 --extra-cmd 参数添加自定义标签
 * 支持 compact/expanded 两种布局模式
 */

import { readStdin } from './stdin.js';
import { parseTranscript } from './transcript.js';
import { getGitStatus, setGitCacheConfig } from './git.js';
import { loadConfig } from './config.js';
import { countConfigs } from './config-reader.js';
import { getApiUsage, setUsageCacheConfig } from './usage-api.js';
import { render } from './render/index.js';
import { parseExtraCmdArg, runExtraCmd } from './extra-cmd.js';
import { createDebug, createTimer } from './debug.js';
import { checkForUpdateAuto } from './version-check.js';
import { checkAndRunAction } from './actions.js';
import { setColorTheme } from './render/colors.js';
import { loadCustomTranslations } from './i18n.js';
import { updateProjectMemory } from './project-memory.js';
import {
  checkCanaryStatus,
  recordHistory,
  getCanaryStats,
  sendCanaryAlert,
  autoRecoverCanary,
  loadCanaryConfig,
  shouldCheckCanary,
  createCanaryFile,
  clearCanaryFile,
  initGlobalCanary
} from './canary-test.js';
import type { StdinInput, RenderContext } from './types.js';

const debug = createDebug('index');

/**
 * 格式化会话时长
 */
export function formatSessionDuration(sessionStart?: Date, now: () => number = () => Date.now()): string {
  if (!sessionStart) {
    return '';
  }

  const ms = now() - sessionStart.getTime();
  const mins = Math.floor(ms / 60000);

  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * 主函数
 */
export async function main(): Promise<void> {
  try {
    // 检查是否需要执行快捷操作
    const actionExecuted = await checkAndRunAction();
    if (actionExecuted) {
      return;  // 操作已执行，直接退出
    }

    // 解析 --extra-cmd 参数
    const extraCmd = parseExtraCmdArg(process.argv);
    let extraLabel: string | null = null;

    if (extraCmd) {
      debug(`Running extra command: ${extraCmd}`);
      extraLabel = runExtraCmd(extraCmd);
      if (extraLabel) {
        debug(`Extra label: ${extraLabel}`);
      }
    }

    // 读取 stdin 数据
    const timer = createTimer('main');
    timer.start('readStdin');
    const stdin = await readStdin();
    timer.end('readStdin');

    if (!stdin) {
      console.log('[My Claude HUD] 初始化中...');
      return;
    }

    // 解析会话记录
    timer.start('parseTranscript');
    const transcriptPath = stdin.transcript_path ?? '';
    const transcript = await parseTranscript(transcriptPath);
    timer.end('parseTranscript');

    // 加载配置（传入 cwd 支持项目配置覆盖）
    timer.start('loadConfig');
    const cwd = stdin.cwd ?? undefined;
    const config = await loadConfig(cwd);
    timer.end('loadConfig');

    // 加载自定义翻译文件（如果配置了）
    if (config.i18n?.customTranslationFile) {
      loadCustomTranslations(config.i18n.customTranslationFile, cwd);
    }

    // 设置颜色主题
    setColorTheme(config.theme.colorTheme, config.theme.customColors);

    // 设置 Git 缓存配置
    setGitCacheConfig(config);

    // 设置 API 使用量缓存配置
    setUsageCacheConfig(config);

    // 获取 Git 状态
    timer.start('getGitStatus');
    const gitStatus = config.gitStatus.enabled && stdin.cwd
      ? await getGitStatus(stdin.cwd)
      : null;
    timer.end('getGitStatus');

    // 获取 API 使用量（仅在配置中启用时）
    timer.start('getApiUsage');
    const usageData = config.display.showUsage !== false
      ? await getApiUsage()
      : null;
    timer.end('getApiUsage');

    // 格式化会话时长
    const sessionDuration = formatSessionDuration(transcript.sessionStart);

    // 统计配置文件
    timer.start('countConfigs');
    const { claudeMdCount, rulesCount, mcpCount, hooksCount } = await countConfigs(stdin.cwd ?? '');
    timer.end('countConfigs');

    // 金丝雀测试检查
    let canaryData = undefined;
    const canaryConfig = loadCanaryConfig();
    if (canaryConfig.enabled && stdin.cwd) {
      // 检查是否应该执行金丝雀检查（基于计数器避免频繁检查）
      if (shouldCheckCanary()) {
        canaryData = checkCanaryStatus(stdin.cwd, transcript);
        debug(`Canary status: ${canaryData.status}`);

        // 记录历史
        if (config.canaryTest?.enableHistory) {
          recordHistory(stdin.cwd, canaryData.status, canaryData.canaryId, canaryData.source);
        }

        // 发送告警
        if (config.canaryTest?.enableAlerts) {
          if (canaryData.status === 'lost' && config.canaryTest?.alertOnLost) {
            sendCanaryAlert('lost', canaryData.canaryId);
          }

          // 检查频繁丢失
          const stats = getCanaryStats();
          if (stats.lostCount >= (config.canaryTest?.frequentLostThreshold || 3)) {
            sendCanaryAlert('frequent_lost', canaryData.canaryId);
          }

          // 检查长时间丢失
          if (stats.longestLostDuration >= (config.canaryTest?.longLostThreshold || 60000)) {
            sendCanaryAlert('long_lost', canaryData.canaryId);
          }
        }

        // 自动恢复
        if (config.canaryTest?.enableAutoRecovery && canaryData.status === 'lost') {
          const stats = getCanaryStats();
          if (stats.lostCount >= (config.canaryTest?.autoRecoveryThreshold || 5)) {
            debug(`Auto-recovering canary after ${stats.lostCount} losses`);
            autoRecoverCanary(stdin.cwd);
            sendCanaryAlert('recovery', undefined);
          }
        }
      }
    }

    // 构建渲染上下文
    const ctx: RenderContext = {
      stdin,
      transcript,
      claudeMdCount,
      rulesCount,
      mcpCount,
      hooksCount,
      sessionDuration,
      gitStatus,
      usageData,
      config,
      extraLabel,
      canaryData,
    };

    // 更新项目记忆（在渲染前更新，确保数据及时）
    if (config.memory?.enabled !== false && config.memory?.trackingEnabled !== false) {
      timer.start('updateProjectMemory');
      updateProjectMemory(ctx);
      timer.end('updateProjectMemory');
    }

    // 渲染并输出
    timer.start('render');
    render(ctx);
    timer.end('render');

    // 检查更新（在配置中启用时）
    if (config.update?.enabled !== false) {
      const updateCheck = await checkForUpdateAuto();

      if (updateCheck?.hasUpdate) {
        console.log(
          `\n📦 有新版本可用: ${updateCheck.currentVersion} → ${updateCheck.latestVersion}`
        );
        console.log(`🔗 更新地址: ${updateCheck.updateUrl}`);
      }
    }
  } catch (error) {
    console.error('[My Claude HUD] 错误:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// 直接运行时执行主函数
if (require.main === module) {
  void main();
}
