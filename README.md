# My Claude HUD

Real-time statusline HUD for Claude Code - showing context usage, active tools, running agents, todo progress, and more.

> **Disclaimer**: This project was inspired by and reimplements functionality similar to [claude-hud](https://github.com/jarrodwatts/claude-hud) by Jarrod Watts. All code is written from scratch to achieve equivalent functionality.

## Features

### 核心功能
- 📊 **Context Usage** - Real-time token usage display with color-coded progress bar
- 🔧 **Active Tools** - Shows currently running and completed tools
- 🤖 **Agent Tracking** - Monitor running agents and their status
- ✅ **Todo Progress** - Display todo completion status
- 🌿 **Git Status** - Branch, dirty state, ahead/behind, and file stats
- ⏱️ **Session Duration** - Track how long you've been working
- 📈 **API Usage** - 5-hour and 7-day usage windows with reset times
- 🎯 **Config Counts** - Display CLAUDE.md, rules, MCPs, and hooks counts
- ⚡ **Speed Tracking** - Output token speed (tokens/second)

### 增强功能
- 💰 **Cost Estimation** - Calculate API costs based on token usage
- ⏱️ **Tool Execution Time** - Display duration for each tool
- 🔔 **Alert System** - Warnings for context and API limits
- 📊 **Context Projection** - Predict remaining messages/time
- 🎨 **Color Themes** - 5 built-in themes (default, nord, dracula, monokai, solarized)
- 📁 **Project-Specific Config** - Override global settings per project
- 📈 **Session Statistics** - Track usage across sessions
- 🔧 **Quick Actions** - Command-line tools for common operations
- 🗂️ **Smart Tool Grouping** - Group similar tools for cleaner display
- 🌐 **Multi-Language Support** - Chinese/English display language (default: Chinese)
- 🌍 **Custom Translations** - Create your own translation file for any language

## Installation

```bash
cd ~/.claude/plugins
git clone https://github.com/yourusername/my-claude-hud.git my-hud
cd my-hud
npm install
npm run build
```

## Configuration

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/my-hud/dist/index.js"
  }
}
```

### Configuration Options

Create `~/.claude/plugins/my-hud/config.json`:

```json
{
  "lineLayout": "expanded",
  "showSeparators": false,
  "pathLevels": 1,
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false
  },
  "display": {
    "showModel": true,
    "showContextBar": true,
    "contextValue": "percent",
    "showConfigCounts": true,
    "showDuration": true,
    "showSpeed": false,
    "showTokenBreakdown": true,
    "showUsage": true,
    "usageBarEnabled": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showCost": false,
    "autocompactBuffer": "enabled",
    "usageThreshold": 0,
    "sevenDayThreshold": 80,
    "environmentThreshold": 0,
    "displayLanguage": "zh"
  },
  "alerts": {
    "enabled": true,
    "contextWarning": 80,
    "contextCritical": 95,
    "apiLimitWarning": 90
  },
  "theme": {
    "colorTheme": "default"
  }
}
```

### Project-Specific Configuration

Create `.claude-hud.json` in your project root to override global settings:

```json
{
  "lineLayout": "compact",
  "theme": {
    "colorTheme": "nord"
  },
  "alerts": {
    "contextWarning": 75
  }
}
```

### Custom Translations

You can create your own translation file to customize or translate the HUD to any language.

1. Copy the example translation file:
```bash
cp ~/.claude/plugins/my-hud/config.translations.example.json ~/.claude/plugins/my-hud/config.translations.json
```

2. Edit the translation file with your custom translations:

```json
{
  "version": "1.0.0",
  "tools": {
    "Read": "读取",
    "Write": "写入",
    "Edit": "编辑"
  },
  "agentTypes": {
    "general-purpose": "通用助手"
  },
  "status": {
    "All todos complete": "所有任务已完成"
  },
  "toolGroups": {
    "File ops": "文件操作"
  }
}
```

3. Add the translation file path to your config:

```json
{
  "i18n": {
    "customTranslationFile": "./config.translations.json"
  }
}
```

The translation file supports:
- `tools`: Tool name translations (e.g., "Read" → "读取")
- `agentTypes`: Agent type translations (e.g., "general-purpose" → "通用助手")
- `status`: Status text translations (e.g., "All todos complete" → "所有任务已完成")
- `toolGroups`: Tool group translations (e.g., "File ops" → "文件操作")

**Note**: You only need to include the translations you want to override. All other strings will use the default translations.

## Color Themes

Available themes:
- `default` - Standard terminal colors
- `nord` - Arctic blue-gray theme
- `dracula` - High contrast dark theme
- `monokai` - Classic dark theme
- `solarized` - Solarized Dark

## Quick Actions

```bash
# Toggle layout mode
node dist/index.js --action=toggle-layout

# Show statistics
node dist/index.js --action=stats

# Clear all caches
node dist/index.js --action=clear-cache

# Show help
node dist/index.js --action=help
```

## Layout Modes

### Expanded (default)
Multi-line display with separate sections for session info, tools, agents, and todos.

### Compact
Single-line display with all information in one line.

## Development

```bash
npm install
npm run build
npm run dev  # Watch mode
```

## Documentation

- [Core Features](./FEATURES.md) - List of implemented features
- [Enhancements](./Docs/ENHANCEMENTS.md) - Detailed enhancement documentation
- [Implementation Plan](./Docs/implementation-plan.md) - Development progress
- [Custom Translations](./Docs/TRANSLATIONS.md) - How to create custom translation files

## License

MIT
