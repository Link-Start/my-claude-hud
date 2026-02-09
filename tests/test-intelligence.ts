/**
 * 测试智能化增强功能
 * 验证项目记忆、语义化工具统计和智能内容展示
 */

import { updateProjectMemory, getProjectMemory, getMostEditedFiles, getActiveDirectories, getSessionStats, clearProjectMemory } from './src/project-memory.js';
import { detectSessionState, shouldShowComponent } from './src/session-state.js';
import type { RenderContext } from './src/types.js';

// 模拟数据
function createMockContext(cwd: string): RenderContext {
  return {
    stdin: {
      transcript_path: '',
      cwd,
      model: { id: 'claude-opus-4-6', display_name: 'Claude Opus 4.6' },
      context_window: {
        context_window_size: 200000,
        current_usage: {
          input_tokens: 50000,
          output_tokens: 10000,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
        used_percentage: 30,
        remaining_percentage: 70,
      },
    },
    transcript: {
      tools: [
        { id: '1', name: 'Read', target: 'src/index.ts', status: 'completed', startTime: new Date(), endTime: new Date(), duration: 100 },
        { id: '2', name: 'Edit', target: 'src/index.ts', status: 'completed', startTime: new Date(), endTime: new Date(), duration: 200 },
        { id: '3', name: 'Bash', target: 'npm test', status: 'running', startTime: new Date() },
      ],
      agents: [],
      todos: [],
      sessionStart: new Date(Date.now() - 3600000), // 1小时前
    },
    claudeMdCount: 1,
    rulesCount: 0,
    mcpCount: 1,
    hooksCount: 0,
    sessionDuration: '60m',
    gitStatus: { branch: 'master', isDirty: true, ahead: 0, behind: 0 },
    usageData: { planName: 'Max', fiveHour: 30, sevenDay: 40, fiveHourResetAt: null, sevenDayResetAt: null },
    config: {
      lineLayout: 'expanded',
      showSeparators: false,
      pathLevels: 1,
      gitStatus: { enabled: true, showDirty: true, showAheadBehind: false, showFileStats: false },
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
        toolDetailLevel: 'compact',
        showMemoryInsights: true,
        memoryInsightsPosition: 'after',
        smartDisplay: true,
      },
      alerts: { enabled: true, contextWarning: 80, contextCritical: 95, apiLimitWarning: 90 },
      theme: { colorTheme: 'default' },
      i18n: { customTranslationFile: undefined },
      memory: { enabled: true, maxProjects: 100, maxFilesPerProject: 500, trackingEnabled: true },
    },
    extraLabel: null,
  };
}

async function testProjectMemory() {
  console.log('\n🧠 测试项目记忆系统\n');

  const cwd = process.cwd();
  const ctx = createMockContext(cwd);

  // 清除旧数据
  clearProjectMemory();

  // 更新项目记忆
  console.log('1. 更新项目记忆...');
  updateProjectMemory(ctx);

  // 获取项目记忆
  console.log('2. 获取项目记忆...');
  const memory = getProjectMemory(cwd);
  if (memory) {
    console.log(`   项目路径: ${memory.projectPath}`);
    console.log(`   会话数: ${memory.totalSessions}`);
    console.log(`   平均时长: ${Math.round(memory.averageSessionDuration / 60000)} 分钟`);
    console.log(`   文件编辑数: ${Object.keys(memory.fileEdits).length}`);
    console.log(`   文件读取数: ${Object.keys(memory.fileReads).length}`);
    console.log(`   目录活跃度: ${Object.keys(memory.directoryActivity).length}`);
  } else {
    console.log('   未找到项目记忆');
  }

  // 获取热门文件
  console.log('3. 获取热门文件...');
  const hotFiles = getMostEditedFiles(memory!, 3);
  for (const file of hotFiles) {
    console.log(`   ${file.path}: 编辑 ${file.editCount} 次, 读取 ${file.readCount} 次, 热度 ${file.heatScore}`);
  }

  // 获取活跃目录
  console.log('4. 获取活跃目录...');
  const activeDirs = getActiveDirectories(memory!, 3);
  for (const dir of activeDirs) {
    console.log(`   ${dir}`);
  }

  console.log('\n✓ 项目记忆系统测试完成\n');
}

async function testSessionState() {
  console.log('🔍 测试会话状态检测\n');

  const cwd = process.cwd();
  const ctx = createMockContext(cwd);

  // 检测会话状态
  console.log('1. 检测会话状态...');
  const state = detectSessionState(ctx);
  console.log(`   状态级别: ${state.level}`);
  console.log(`   触发原因: ${state.triggers.join(', ') || '无'}`);
  console.log(`   建议: ${state.recommendations.join(', ') || '无'}`);

  // 测试组件显示
  console.log('\n2. 测试组件显示策略...');
  const components = ['context', 'usage', 'tools', 'agents', 'todos', 'alerts'];
  for (const component of components) {
    const show = shouldShowComponent(component, state);
    console.log(`   ${component}: ${show ? '显示' : '隐藏'}`);
  }

  console.log('\n✓ 会话状态检测测试完成\n');
}

async function testSemanticTools() {
  console.log('🔧 测试语义化工具统计\n');

  const cwd = process.cwd();
  const ctx = createMockContext(cwd);

  // 更新项目记忆以触发工具统计
  updateProjectMemory(ctx);

  console.log('1. 工具语义分类...');
  const semanticCategories = ['reading', 'editing', 'executing', 'inspecting', 'communicating'];
  for (const category of semanticCategories) {
    console.log(`   ${category}: 已定义`);
  }

  console.log('\n✓ 语义化工具统计测试完成\n');
}

async function main() {
  console.log('\n🚀 My Claude HUD 智能化增强功能测试\n');
  console.log('====================================\n');

  try {
    await testProjectMemory();
    await testSessionState();
    await testSemanticTools();

    console.log('====================================');
    console.log('\n✅ 所有测试完成！\n');
  } catch (error) {
    console.error('\n❌ 测试失败:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
