/**
 * My Claude HUD - 主入口（完整版）
 * 参考 claude-hud 实现，显示上下文使用、工具状态、Agent 和 Todo 进度
 * 包含：配置统计、Git 状态、API 使用量、速度追踪等完整功能
 */

import { readStdin, getContextUsagePercent } from './stdin.js';
import { parseTranscript } from './transcript.js';
import { getGitStatus, formatGitStatus } from './git.js';
import { loadConfig, DEFAULT_CONFIG } from './config.js';
import { countConfigs } from './config-reader.js';
import { getApiUsage } from './usage-api.js';
import { updateSpeed, getSpeed } from './speed-tracker.js';
import { renderHud } from './render.js';
import type { StdinInput, RenderContext } from './types.js';

/**
 * 格式化会话时长
 */
function formatSessionDuration(start: Date | undefined): string {
  if (!start) return '';

  const now = Date.now();
  const diff = now - start.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins}m`;
}

/**
 * 主函数
 */
export async function main(): Promise<void> {
  try {
    // 读取 stdin 数据
    const stdin = await readStdin();

    if (!stdin) {
      console.log('[My Claude HUD] 初始化中...');
      return;
    }

    // 解析会话记录
    const transcriptPath = stdin.transcript_path ?? '';
    const session = await parseTranscript(transcriptPath);

    // 获取 Git 状态
    const git = stdin.cwd ? getGitStatus(stdin.cwd) : null;

    // 加载配置
    const config = await loadConfig();

    // 获取 API 使用量
    const usage = config.display.showUsage ? await getApiUsage() : null;

    // 格式化会话时长
    const sessionDuration = formatSessionDuration(session.sessionStart);

    // 统计配置文件
    const configCounts = await countConfigs(stdin.cwd);

    // 更新并获取速度
    const currentTokens = stdin.context_window?.current_usage?.input_tokens ?? 0;
    updateSpeed(currentTokens);
    const speed = config.display.showSpeed ? getSpeed() : null;

    // 构建渲染上下文
    const ctx: RenderContext = {
      stdin,
      session,
      git,
      usage,
      config,
      sessionDuration,
      configCounts,
      speed,
    };

    // 渲染并输出
    renderHud(ctx);
  } catch (error) {
    console.error('[My Claude HUD] 错误:', error instanceof Error ? error.message : String(error));
  }
}

// 直接运行时执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
