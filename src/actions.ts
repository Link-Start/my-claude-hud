/**
 * 快捷操作 - 命令行工具功能
 * 支持 --action= 参数执行各种操作
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { HudConfig } from './types.js';
import { loadConfig, getConfigPath } from './config.js';
import { getStatsSummary, clearSessionStats } from './session-stats.js';
import { clearGitCache, getGitCacheStats } from './git.js';
import {
  createCanaryFile,
  clearCanaryFile,
  checkCanaryStatus,
  initGlobalCanary
} from './canary-test.js';
import { clearProjectMemory, getMemoryCacheStats } from './project-memory.js';

// 缓存文件路径
const CACHE_DIR = path.join(os.homedir(), '.claude', 'plugins', 'my-claude-hud');
const SPEED_CACHE_FILE = path.join(CACHE_DIR, '.speed-cache.json');
const USAGE_CACHE_FILE = path.join(CACHE_DIR, '.usage-cache.json');
const COST_CACHE_FILE = path.join(CACHE_DIR, '.cost-cache.json');
const GIT_CACHE_FILE = path.join(CACHE_DIR, '.git-cache.json');
const MEMORY_CACHE_FILE = path.join(CACHE_DIR, '.project-memory.json');

/**
 * 快捷操作定义
 */
interface Action {
  name: string;
  description: string;
  handler: () => Promise<void> | void;
}

/**
 * 切换布局模式（compact ↔ expanded）
 */
async function toggleLayout(): Promise<void> {
  const config = await loadConfig();
  const newLayout = config.lineLayout === 'compact' ? 'expanded' : 'compact';

  try {
    // 读取现有配置
    let userConfig: Partial<HudConfig> = {};
    const configPath = getConfigPath();

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      userConfig = JSON.parse(content);
    }

    // 更新布局设置
    userConfig.lineLayout = newLayout;

    // 保存配置
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(userConfig, null, 2), 'utf-8');

    console.log(`✓ 布局模式已更改为: ${newLayout}`);
  } catch (error) {
    console.error(`✗ 更改布局失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 显示统计信息
 */
function showStats(): void {
  try {
    console.log('\n📊 My Claude HUD 统计信息\n');

    // 显示历史会话统计
    console.log(getStatsSummary());

    // 显示配置信息
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      console.log('⚙️ 配置信息:');
      console.log(`📁 配置文件: ${configPath}`);
      const config = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(config);
      console.log(`📋 当前布局: ${parsed.lineLayout ?? 'default'}`);
      console.log(`📋 分隔符: ${parsed.showSeparators ? '启用' : '禁用'}`);
    } else {
      console.log('📁 配置文件: 未创建（使用默认配置）');
    }

    // 显示缓存文件大小
    console.log('\n💾 缓存文件:');

    const caches = [
      { name: '速度缓存', path: SPEED_CACHE_FILE },
      { name: '使用量缓存', path: USAGE_CACHE_FILE },
      { name: '成本缓存', path: COST_CACHE_FILE },
      { name: 'Git 缓存', path: GIT_CACHE_FILE },
      { name: '项目记忆缓存', path: MEMORY_CACHE_FILE },
    ];

    for (const cache of caches) {
      if (fs.existsSync(cache.path)) {
        const stats = fs.statSync(cache.path);
        const size = (stats.size / 1024).toFixed(2);
        const mtime = stats.mtime.toLocaleString('zh-CN');
        console.log(`  ${cache.name}: ${size} KB (${mtime})`);
      } else {
        console.log(`  ${cache.name}: 不存在`);
      }
    }

    // 显示 Git 缓存统计
    const gitCacheStats = getGitCacheStats();
    if (gitCacheStats && gitCacheStats.count > 0) {
      console.log(`\n🌿 Git 缓存: ${gitCacheStats.count} 个仓库`);
      if (gitCacheStats.repositories.length > 0) {
        const maxDisplay = 5;
        const displayRepos = gitCacheStats.repositories.slice(0, maxDisplay);
        for (const repo of displayRepos) {
          console.log(`  - ${repo}`);
        }
        if (gitCacheStats.repositories.length > maxDisplay) {
          console.log(`  ... 还有 ${gitCacheStats.repositories.length - maxDisplay} 个仓库`);
        }
      }
    }

    // 显示项目记忆统计
    const memoryStats = getMemoryCacheStats();
    if (memoryStats && memoryStats.count > 0) {
      console.log(`\n🧠 项目记忆: ${memoryStats.count} 个项目`);
      if (memoryStats.projects.length > 0) {
        const maxDisplay = 5;
        const displayProjects = memoryStats.projects.slice(0, maxDisplay);
        for (const project of displayProjects) {
          console.log(`  - ${project.path} (${project.sessions} 次会话)`);
        }
        if (memoryStats.projects.length > maxDisplay) {
          console.log(`  ... 还有 ${memoryStats.projects.length - maxDisplay} 个项目`);
        }
      }
    }

    console.log('');
  } catch (error) {
    console.error(`✗ 获取统计信息失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 清除所有缓存
 */
function clearCache(): void {
  try {
    let cleared = 0;
    const files = [SPEED_CACHE_FILE, USAGE_CACHE_FILE, COST_CACHE_FILE];

    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        cleared++;
      }
    }

    // 清除 Git 缓存
    clearGitCache();
    cleared++;

    // 清除项目记忆缓存
    clearProjectMemory();
    cleared++;

    // 清除历史统计
    clearSessionStats();
    cleared++;

    if (cleared > 0) {
      console.log(`✓ 已清除 ${cleared} 个缓存文件（包括 Git 缓存、项目记忆和历史统计）`);
    } else {
      console.log('ℹ 没有找到需要清除的缓存文件');
    }
  } catch (error) {
    console.error(`✗ 清除缓存失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
🚀 My Claude HUD - 快捷操作

用法: node dist/index.js --action=<操作>

可用操作:
  toggle-layout      切换布局模式（compact ↔ expanded）
  stats              显示统计信息
  clear-cache        清除所有缓存
  clear-memory       清除项目记忆缓存
  canary-create      在当前项目创建金丝雀文件
  canary-clear       清除当前项目的金丝雀文件
  canary-check       检查当前项目的金丝雀状态
  canary-init-global 初始化全局金丝雀文件
  help               显示此帮助信息

示例:
  node dist/index.js --action=toggle-layout
  node dist/index.js --action=stats
  node dist/index.js --action=clear-cache
  node dist/index.js --action=clear-memory
  node dist/index.js --action=canary-create
  node dist/index.js --action=canary-init-global
`);
}

/**
 * 可用操作映射表
 */
const ACTIONS: Record<string, Action> = {
  'toggle-layout': {
    name: '切换布局',
    description: '切换布局模式（compact ↔ expanded）',
    handler: toggleLayout,
  },
  stats: {
    name: '显示统计',
    description: '显示统计信息',
    handler: showStats,
  },
  'clear-cache': {
    name: '清除缓存',
    description: '清除所有缓存',
    handler: clearCache,
  },
  'clear-memory': {
    name: '清除记忆',
    description: '清除项目记忆缓存',
    handler: () => {
      try {
        if (fs.existsSync(MEMORY_CACHE_FILE)) {
          clearProjectMemory();
          console.log('✓ 已清除项目记忆缓存');
        } else {
          console.log('ℹ 没有找到项目记忆缓存文件');
        }
      } catch (error) {
        console.error(`✗ 清除项目记忆失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
  help: {
    name: '帮助',
    description: '显示帮助信息',
    handler: showHelp,
  },
  'canary-create': {
    name: '创建金丝雀',
    description: '在当前项目创建金丝雀文件',
    handler: async () => {
      const cwd = process.cwd();
      const success = createCanaryFile(cwd);
      if (success) {
        console.log('✓ 金丝雀文件已创建: .canary.md');
        console.log('  金丝雀文件用于检测 AI 上下文丢失');
      } else {
        console.log('ℹ 金丝雀文件已存在或创建失败');
      }
    },
  },
  'canary-clear': {
    name: '清除金丝雀',
    description: '清除当前项目的金丝雀文件',
    handler: async () => {
      const cwd = process.cwd();
      const success = clearCanaryFile(cwd);
      if (success) {
        console.log('✓ 金丝雀文件已清除');
      } else {
        console.log('ℹ 没有找到金丝雀文件');
      }
    },
  },
  'canary-check': {
    name: '检查金丝雀',
    description: '检查当前项目的金丝雀状态',
    handler: async () => {
      const cwd = process.cwd();
      const canaryData = checkCanaryStatus(cwd);
      console.log(`\n🐤 金丝雀测试状态\n`);
      switch (canaryData.status) {
        case 'active':
          const sourceLabel = canaryData.source === 'global' ? ' (全局)' : ' (项目)';
          console.log(`✓ 状态: 活跃${sourceLabel}`);
          console.log(`  金丝雀 ID: ${canaryData.canaryId}`);
          console.log(`  AI 仍然记得上下文`);
          break;
        case 'lost':
          console.log(`⚠️ 状态: 丢失`);
          console.log(`  金丝雀 ID: ${canaryData.canaryId}`);
          console.log(`  AI 可能已经遗忘了上下文`);
          break;
        case 'prompt':
          console.log(`💡 状态: 提示`);
          console.log(`  建议创建金丝雀文件以监控上下文状态`);
          console.log(`  运行 --action=canary-create 创建`);
          break;
        case 'none':
          console.log(`ℹ 状态: 未创建`);
          console.log(`  使用 --action=canary-create 创建项目金丝雀`);
          console.log(`  使用 --action=canary-init-global 初始化全局金丝雀`);
          break;
      }
      console.log('');
    },
  },
  'canary-init-global': {
    name: '初始化全局金丝雀',
    description: '初始化全局金丝雀文件',
    handler: async () => {
      const success = initGlobalCanary();
      if (success) {
        console.log('✓ 全局金丝雀文件已创建: ~/.claude/canary.md');
        console.log('  所有项目都可以使用这个全局金丝雀文件');
      } else {
        console.log('ℹ 全局金丝雀文件已存在');
      }
    },
  },
};

/**
 * 解析 --action 参数
 */
export function parseActionArg(argv: string[]): string | null {
  const actionArg = argv.find(arg => arg.startsWith('--action='));
  if (!actionArg) return null;

  return actionArg.split('=')[1] ?? null;
}

/**
 * 执行快捷操作
 */
export async function runAction(actionName: string): Promise<boolean> {
  const action = ACTIONS[actionName];

  if (!action) {
    console.error(`✗ 未知的操作: ${actionName}`);
    console.log('使用 --action=help 查看可用操作');
    return false;
  }

  await action.handler();
  return true;
}

/**
 * 检查是否需要执行操作
 */
export async function checkAndRunAction(): Promise<boolean> {
  const actionName = parseActionArg(process.argv);

  if (!actionName) {
    return false;  // 没有操作参数，继续正常流程
  }

  // 执行操作并退出
  const success = await runAction(actionName);
  process.exit(success ? 0 : 1);
}
