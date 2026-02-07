# My Claude HUD

Real-time statusline HUD for Claude Code - showing context usage, active tools, running agents, and todo progress.

> **Disclaimer**: This project was inspired by and reimplements functionality similar to [claude-hud](https://github.com/jarrodwatts/claude-hud) by Jarrod Watts. All code is written from scratch to achieve equivalent functionality.

## Features

- 📊 **Context Usage** - Real-time token usage display
- 🔧 **Active Tools** - Shows currently running tools
- 🤖 **Agent Tracking** - Monitor running agents and their status
- ✅ **Todo Progress** - Display todo completion status
- 🌿 **Git Status** - Branch and dirty state indicator
- ⏱️ **Session Duration** - Track how long you've been working
- 📈 **API Usage** - 5-hour and 7-day usage windows

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

## Development

```bash
npm install
npm run build
npm run dev  # Watch mode
```

## License

MIT
