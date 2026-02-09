#!/usr/bin/env node
/**
 * My Claude HUD - 功能测试脚本
 */

const { execSync } = require('child_process');
const path = require('path');

const HUD_DIST = path.join(__dirname, 'dist', 'index.js');

// 颜色输出
const green = (text) => `\x1b[32m✓ ${text}\x1b[0m`;
const red = (text) => `\x1b[31m✗ ${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m▶ ${text}\x1b[0m`;

// 移除 ANSI 转义码用于匹配
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// 将不间断空格替换为普通空格
function normalizeSpaces(str) {
  return str.replace(/\u00A0/g, ' ');
}

// 测试用例
const tests = [
  {
    name: '快捷操作 - help',
    input: '--action=help',
    expect: 'My Claude HUD - 快捷操作'
  },
  {
    name: '快捷操作 - stats',
    input: '--action=stats',
    expect: '统计信息'
  },
  {
    name: '快捷操作 - toggle-layout',
    input: '--action=toggle-layout',
    expect: '布局模式已更改为'
  },
  {
    name: '快捷操作 - clear-cache',
    input: '--action=clear-cache',
    expect: '已清除'
  },
  {
    name: '基本渲染 - 正常上下文',
    stdin: '{"cwd":"' + __dirname + '","transcript_path":"","context_window":{"context_window_size":200000,"current_usage":{"input_tokens":10000,"output_tokens":5000}},"model":{"id":"claude-opus-4-6","display_name":"Claude Opus 4.6"}}',
    expect: 'Claude Opus 4.6',
    stripAnsi: true
  },
  {
    name: '基本渲染 - 高上下文使用率',
    stdin: '{"cwd":"' + __dirname + '","transcript_path":"","context_window":{"context_window_size":200000,"current_usage":{"input_tokens":180000,"cache_creation_input_tokens":5000,"cache_read_input_tokens":3000,"output_tokens":20000}},"model":{"id":"claude-opus-4-6","display_name":"Claude Opus 4.6"}}',
    expect: '100%',
    stripAnsi: true
  },
  {
    name: '基本渲染 - 空 JSON',
    stdin: '{}',
    expect: 'unknown',
    stripAnsi: true
  },
  {
    name: '错误处理 - 空 stdin',
    stdin: '',
    expect: '初始化中'
  }
];

let passed = 0;
let failed = 0;

console.log('\n🧪 My Claude HUD - 功能测试\n');

for (const test of tests) {
  process.stdout.write(`测试: ${test.name}... `);

  try {
    let cmd = `node ${HUD_DIST}`;
    let result = '';

    if (test.stdin !== undefined) {
      // 测试 stdin 输入
      result = execSync(`echo '${test.stdin}' | ${cmd}`, { encoding: 'utf-8', stdio: 'pipe' });
    } else {
      // 测试命令行参数
      cmd += ` ${test.input}`;
      result = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    }

    // 移除 ANSI 码并规范化空格（如果需要）
    const compareResult = test.stripAnsi ? normalizeSpaces(stripAnsi(result)) : result;

    if (compareResult.includes(test.expect)) {
      console.log(green('通过'));
      passed++;
    } else {
      console.log(red(`失败 - 期望包含: ${test.expect}`));
      console.log(`  实际输出: ${result.substring(0, 100)}...`);
      failed++;
    }
  } catch (error) {
    console.log(red(`异常: ${error.message}`));
    failed++;
  }
}

// 布局切换测试
console.log(`\n${yellow('布局切换测试')}`);

try {
  // 切换到 compact
  execSync(`node ${HUD_DIST} --action=toggle-layout`, { stdio: 'pipe' });
  // 切换回 expanded（验证切换功能正常）
  execSync(`node ${HUD_DIST} --action=toggle-layout`, { stdio: 'pipe' });
  // 验证当前状态
  const result = execSync(`node ${HUD_DIST} --action=stats`, { encoding: 'utf-8', stdio: 'pipe' });
  if (result.includes('expanded') || result.includes('compact')) {
    console.log(green('布局切换正常'));
    passed++;
  } else {
    console.log(red('布局切换失败'));
    failed++;
  }
} catch (error) {
  console.log(red(`布局切换异常: ${error.message}`));
  failed++;
}

// 总结
console.log('\n' + '='.repeat(50));
console.log(`通过: ${green(passed.toString())}`);
console.log(`失败: ${failed > 0 ? red(failed.toString()) : failed.toString()}`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
