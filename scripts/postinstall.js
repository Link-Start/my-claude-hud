#!/usr/bin/env node

/**
 * My Claude HUD - Post-install Script
 * 自动配置到 Claude Code settings.json
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// 获取插件路径
function getPluginPath() {
  // 如果是 npm 全局安装，路径会在 node_modules
  const globalNodeModules = path.join(os.homedir(), '.npm', 'global', 'node_modules', 'my-claude-hud');
  const localNodeModules = path.join(process.cwd(), 'node_modules', 'my-claude-hud');

  if (fs.existsSync(globalNodeModules)) {
    return globalNodeModules;
  } else if (fs.existsSync(localNodeModules)) {
    return localNodeModules;
  }

  // 开发环境，返回当前目录
  return __dirname;
}

// 配置文件路径
const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
const pluginPath = path.join(getPluginPath(), 'dist', 'index.js');
const statusLineCmd = `node ${pluginPath}`;

log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
log(colors.blue, '║          My Claude HUD - 自动配置                        ║');
log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

// 检查 settings.json 是否存在
if (!fs.existsSync(settingsPath)) {
  log(colors.red, '❌ Claude Code 配置文件不存在');
  log(colors.yellow, `   请确保已安装 Claude Code CLI: ${settingsPath}`);
  process.exit(0);
}

// 读取配置
try {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

  // 检查是否已有 statusLine
  if (settings.statusLine) {
    if (settings.statusLine.command && settings.statusLine.command.includes('my-claude-hud')) {
      log(colors.green, '✅ statusLine 已配置，无需重复设置');
    } else {
      log(colors.yellow, '⚠️  statusLine 已被其他插件占用');
      log(colors.yellow, `   当前: ${settings.statusLine.command}`);
    }
    process.exit(0);
  }

  // 备份原配置
  const backupPath = settingsPath + '.backup';
  fs.copyFileSync(settingsPath, backupPath);
  log(colors.green, `✅ 已备份原配置到: ${backupPath}`);

  // 添加 statusLine 配置
  settings.statusLine = {
    type: 'command',
    command: statusLineCmd
  };

  // 写回配置（保持格式）
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

  log(colors.green, '✅ statusLine 配置已添加到 Claude Code');
  log(colors.blue, '\n📋 配置内容：');
  log(colors.reset, `   statusLine.command = "${statusLineCmd}"`);

  log(colors.yellow, '\n🔄 下一步：');
  log(colors.reset, '   1. 重启 Claude Code');
  log(colors.reset, '   2. HUD 将自动显示在状态栏\n');

} catch (error) {
  log(colors.red, `❌ 配置失败: ${error.message}`);
  process.exit(1);
}
