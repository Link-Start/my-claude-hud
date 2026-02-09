/**
 * My Claude HUD - 主入口（完整版）
 * 参考 claude-hud 实现，显示上下文使用、工具状态、Agent 和 Todo 进度
 * 包含：配置统计、Git 状态、API 使用量、速度追踪等完整功能
 * 支持 --extra-cmd 参数添加自定义标签
 * 支持 compact/expanded 两种布局模式
 */

import { readStdin } from './stdin.js';
import { parseTranscript } from './transcript.js';
import { getGitStatus } from './git.js';
import { loadConfig } from './config.js';
import { countConfigs } from './config-reader.js';
import { getApiUsage } from './usage-api.js';
import { render } from './render/index.js';
import { parseExtraCmdArg, runExtraCmd } from './extra-cmd.js';
import { createDebug } from './debug.js';
import { checkAndRunAction } from './actions.js';
import { setColorTheme } from './render/colors.js';
import { loadCustomTranslations } from './i18n.js';
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
    const stdin = await readStdin();

    if (!stdin) {
      console.log('[My Claude HUD] 初始化中...');
      return;
    }

    // 解析会话记录
    const transcriptPath = stdin.transcript_path ?? '';
    const transcript = await parseTranscript(transcriptPath);

    // 加载配置（传入 cwd 支持项目配置覆盖）
    const cwd = stdin.cwd ?? undefined;
    const config = await loadConfig(cwd);

    // 加载自定义翻译文件（如果配置了）
    if (config.i18n?.customTranslationFile) {
      loadCustomTranslations(config.i18n.customTranslationFile, cwd);
    }

    // 设置颜色主题
    setColorTheme(config.theme.colorTheme, config.theme.customColors);

    // 获取 Git 状态
    const gitStatus = config.gitStatus.enabled && stdin.cwd
      ? await getGitStatus(stdin.cwd)
      : null;

    // 获取 API 使用量（仅在配置中启用时）
    const usageData = config.display.showUsage !== false
      ? await getApiUsage()
      : null;

    // 格式化会话时长
    const sessionDuration = formatSessionDuration(transcript.sessionStart);

    // 统计配置文件
    const { claudeMdCount, rulesCount, mcpCount, hooksCount } = await countConfigs(stdin.cwd ?? '');

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
    };

    // 渲染并输出
    render(ctx);
  } catch (error) {
    console.error('[My Claude HUD] 错误:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// 直接运行时执行主函数
if (require.main === module) {
  void main();
}
