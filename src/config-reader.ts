/**
 * 配置文件统计 - CLAUDE.md、rules、MCP、hooks 数量
 * 支持 disabled MCP servers 过滤
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface ConfigCounts {
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
}

type DisabledMcpKey = 'disabledMcpServers' | 'disabledMcpjsonServers';

/**
 * 从配置文件中获取禁用的 MCP 服务器名称
 */
function getDisabledMcpServers(filePath: string, key: DisabledMcpKey): Set<string> {
  const disabled = new Set<string>();

  if (!fs.existsSync(filePath)) return disabled;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);

    if (config[key] && Array.isArray(config[key])) {
      for (const item of config[key]) {
        if (typeof item === 'string') {
          disabled.add(item);
        }
      }
    }
  } catch {
    // 忽略错误
  }

  return disabled;
}

/**
 * 从配置文件中获取 MCP 服务器名称列表
 */
function getMcpServerNames(filePath: string): Set<string> {
  if (!fs.existsSync(filePath)) return new Set();
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      return new Set(Object.keys(config.mcpServers));
    }
  } catch {
    // 忽略错误
  }
  return new Set();
}

/**
 * 从配置文件中获取 hooks 数量
 */
function getHooksCount(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    if (config.hooks && typeof config.hooks === 'object') {
      return Object.keys(config.hooks).length;
    }
  } catch {
    // 忽略错误
  }
  return 0;
}

/**
 * 递归统计 rules 目录中的 .md 文件数量
 */
function countRulesInDir(rulesDir: string): number {
  if (!fs.existsSync(rulesDir)) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(rulesDir, entry.name);
      if (entry.isDirectory()) {
        count += countRulesInDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        count++;
      }
    }
  } catch {
    // 忽略错误
  }
  return count;
}

/**
 * 统计所有配置文件的数量
 */
export async function countConfigs(cwd?: string): Promise<ConfigCounts> {
  let claudeMdCount = 0;
  let rulesCount = 0;
  let hooksCount = 0;

  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');

  // 收集所有 MCP 服务器
  const userMcpServers = new Set<string>();
  const projectMcpServers = new Set<string>();

  // === 用户级别配置 ===

  // ~/.claude/CLAUDE.md
  if (fs.existsSync(path.join(claudeDir, 'CLAUDE.md'))) {
    claudeMdCount++;
  }

  // ~/.claude/rules/*.md
  rulesCount += countRulesInDir(path.join(claudeDir, 'rules'));

  // ~/.claude/settings.json (MCP 和 hooks)
  const userSettings = path.join(claudeDir, 'settings.json');
  for (const name of getMcpServerNames(userSettings)) {
    userMcpServers.add(name);
  }
  hooksCount += getHooksCount(userSettings);

  // ~/.claude.json (额外的用户级 MCP)
  const userClaudeJson = path.join(homeDir, '.claude.json');
  for (const name of getMcpServerNames(userClaudeJson)) {
    userMcpServers.add(name);
  }

  // 过滤用户级禁用的 MCP 服务器
  const disabledUserMcps = getDisabledMcpServers(userClaudeJson, 'disabledMcpServers');
  for (const name of disabledUserMcps) {
    userMcpServers.delete(name);
  }

  // === 项目级别配置 ===

  if (cwd) {
    // {cwd}/CLAUDE.md
    if (fs.existsSync(path.join(cwd, 'CLAUDE.md'))) {
      claudeMdCount++;
    }

    // {cwd}/CLAUDE.local.md
    if (fs.existsSync(path.join(cwd, 'CLAUDE.local.md'))) {
      claudeMdCount++;
    }

    // {cwd}/.claude/CLAUDE.md
    if (fs.existsSync(path.join(cwd, '.claude', 'CLAUDE.md'))) {
      claudeMdCount++;
    }

    // {cwd}/.claude/CLAUDE.local.md
    if (fs.existsSync(path.join(cwd, '.claude', 'CLAUDE.local.md'))) {
      claudeMdCount++;
    }

    // {cwd}/.claude/rules/*.md
    rulesCount += countRulesInDir(path.join(cwd, '.claude', 'rules'));

    // {cwd}/.mcp.json (需要先处理禁用列表)
    const mcpJsonServers = new Set<string>();
    for (const name of getMcpServerNames(path.join(cwd, '.mcp.json'))) {
      mcpJsonServers.add(name);
    }

    // {cwd}/.claude/settings.local.json (包含禁用的 .mcp.json 服务器)
    const localSettings = path.join(cwd, '.claude', 'settings.local.json');
    const disabledMcpJsonServers = getDisabledMcpServers(localSettings, 'disabledMcpjsonServers');
    for (const name of disabledMcpJsonServers) {
      mcpJsonServers.delete(name);
    }

    // 将剩余的 .mcp.json 服务器添加到项目集
    for (const name of mcpJsonServers) {
      projectMcpServers.add(name);
    }

    // {cwd}/.claude/settings.json
    const projectSettings = path.join(cwd, '.claude', 'settings.json');
    for (const name of getMcpServerNames(projectSettings)) {
      projectMcpServers.add(name);
    }
    hooksCount += getHooksCount(projectSettings);

    // {cwd}/.claude/settings.local.json (hooks)
    hooksCount += getHooksCount(localSettings);
  }

  // MCP 总数 = 用户级 + 项目级
  const mcpCount = userMcpServers.size + projectMcpServers.size;

  return { claudeMdCount, rulesCount, mcpCount, hooksCount };
}
