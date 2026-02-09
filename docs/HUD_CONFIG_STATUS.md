# My Claude HUD - 配置快照

**记录时间**: 2026-02-09

## 配置状态

### 1. Claude Code 配置文件
**路径**: `~/.claude/settings.json`

```json
{
  "enabledPlugins": {
    "code-review@claude-plugins-official": true
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "PROXY_MANAGED",
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:15721"
  },
  "language": "简体中文",
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
  }
}
```

### 2. 插件路径
**插件目录**: `~/.claude/plugins/my-claude-hud/`
**入口文件**: `~/.claude/plugins/my-claude-hud/dist/index.js`

### 3. 验证命令
```bash
# 检查配置文件是否存在
cat ~/.claude/settings.json

# 检查插件文件是否存在
ls -la ~/.claude/plugins/my-claude-hud/dist/index.js

# 手动测试 HUD
node ~/.claude/plugins/my-claude-hud/dist/index.js --action=help
```

## 如果重启后 HUD 不显示，请检查：

1. **配置文件是否还在**
   ```bash
   cat ~/.claude/settings.json | grep statusLine
   ```

2. **插件文件是否还在**
   ```bash
   ls -la ~/.claude/plugins/my-claude-hud/dist/index.js
   ```

3. **手动运行是否正常**
   ```bash
   node ~/.claude/plugins/my-claude-hud/dist/index.js --action=help
   ```

4. **查看 Claude Code 日志**（如果有错误）

## 快速修复命令

如果配置丢失，重新添加：
```bash
# 备份当前配置
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# 添加 statusLine 配置
node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(require('os').homedir(), '.claude', 'settings.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
config.statusLine = {
  type: 'command',
  command: 'node ~/.claude/plugins/my-claude-hud/dist/index.js'
};
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✓ statusLine 配置已添加');
"
```

---

**重启验证后，请告诉我结果：**
- ✅ HUD 自动显示了
- ❌ HUD 没有显示（请附上上述检查命令的输出）
