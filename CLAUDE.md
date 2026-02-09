# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Claude HUD is a Claude Code plugin that displays a real-time statusline showing context usage, active tools, running agents, todo progress, Git status, API usage, and more. It's written in TypeScript and runs as a statusLine command in Claude Code.

## Common Commands

### Build & Development
```bash
npm install              # Install dependencies
npm run build           # Compile TypeScript to dist/
npm run dev             # Watch mode for development
```

### Quick Actions (after build)
```bash
node dist/index.js --action=toggle-layout   # Switch compact/expanded layout
node dist/index.js --action=stats           # Show usage statistics
node dist/index.js --action=clear-cache     # Clear all caches
node dist/index.js --action=help            # Show available actions
```

### Plugin Testing
The plugin runs automatically when configured in `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/my-claude-hud/dist/index.js"
  }
}
```

## Architecture

### Core Data Flow

1. **stdin Input** (`src/stdin.ts`): Claude Code passes JSON via stdin containing:
   - `transcript_path`: Path to session transcript JSONL file
   - `cwd`: Current working directory
   - `model`: Model info (id, display_name)
   - `context_window`: Token usage data

2. **Transcript Parsing** (`src/transcript.ts`): Reads the transcript JSONL line-by-line to extract:
   - Tool usage (Read, Write, Edit, Bash, etc.)
   - Agent spawning (Task tool)
   - Todo list changes (TodoWrite, TaskCreate, TaskUpdate)

3. **Data Collection**: Multiple modules gather additional context:
   - `src/git.ts`: Git status via git commands
   - `src/config-reader.ts`: Counts CLAUDE.md, rules, MCPs, hooks
   - `src/usage-api.ts`: API usage from Anthropic OAuth API
   - `src/speed-tracker.ts`: Output token speed calculation

4. **Rendering** (`src/render/index.ts`): Assembles and displays the HUD based on:
   - Layout mode: `compact` (single line) or `expanded` (multi-line)
   - Terminal width detection with smart truncation
   - Color theme application

### Key Module Responsibilities

| Module | Purpose |
|--------|---------|
| `src/config.ts` | Config loading with project-specific override support (`~/.claude/plugins/my-claude-hud/config.json` + `.claude-hud.json`) |
| `src/types.ts` | All TypeScript type definitions |
| `src/render/colors.ts` | Color theme management (5 built-in themes) |
| `src/i18n.ts` | Chinese/English translations |
| `src/actions.ts` | CLI action handlers (--action flag) |
| `src/extra-cmd.ts` | Custom label injection via --extra-cmd |
| `src/alerts.ts` | Warning system for context/API limits |
| `src/cost-estimator.ts` | Token cost calculations |
| `src/context-projection.ts` | Predicts remaining messages/time |

### Configuration System

- **Global config**: `~/.claude/plugins/my-claude-hud/config.json`
- **Project config**: `.claude-hud.json` or `.claude-hud/config.json` in project root
- Project config **overrides** global settings (deep merge for nested objects like `gitStatus`, `display`, `alerts`)
- Supports legacy config migration (`layout` → `lineLayout`)

### API Usage Caching

The HUD runs as a new process each render (~300ms), so aggressive caching is used:
- Usage cache: 60s TTL (success), 15s TTL (failure)
- Git cache: 5s TTL per repository (stores branch, dirty status, ahead/behind, file stats)
- Keychain backoff: 60s after macOS Keychain failures
- Speed cache: Persistent across renders
- Cache files stored in `~/.claude/plugins/my-claude-hud/.*-cache.json`

### Credential Reading Priority

1. macOS Keychain (`Claude Code-credentials`) - Claude Code 2.x
2. File-based (`~/.claude/.credentials.json`) - older versions
- Reads OAuth access token for `/api/oauth/usage` endpoint
- Determines plan name (Max/Pro/Team) from subscription type
- API users (no OAuth) return null (no usage display)

### Transcript Parsing Strategy

The transcript is a JSONL file (one JSON object per line). Parsing is:
- **Streaming**: Uses `readline` interface for memory efficiency
- **Incremental**: Processes entries sequentially, updating state
- **Stateful**: Maintains Maps for tools/agents to track status changes
- **Limited**: Keeps only last 20 tools, 10 agents

### Rendering Architecture

The render module is split by responsibility:
- `render/session-line.ts`: Model, context bar, duration
- `render/tools-line.ts`: Active/completed tools with grouping
- `render/agents-line.ts`: Running agents with duration
- `render/todos-line.ts`: Todo list with status indicators

Each activity line module returns a string (or null if empty), and the main render function:
1. Collects all non-null lines
2. Joins them with separators
3. Truncates to terminal width (preserving ANSI codes)
4. Outputs as a single line (spaces replaced with non-breaking spaces)

### Color Theming

Five built-in themes: `default`, `nord`, `dracula`, `monokai`, `solarized`

Colors are applied via ANSI escape sequences:
- Context bar: Gradient based on usage percentage
- Status colors: Success (green), warning (yellow), error (red)
- Terminal width detection triggers smart truncation that preserves ANSI codes

### Git Status Integration

Uses `git` commands (no external deps):
- Branch: `git rev-parse --abbrev-ref HEAD`
- Dirty: `git --no-optional-locks status --porcelain`
- Ahead/behind: `git rev-list --left-right --count @{u}...HEAD`
- File stats match Starship prompt format: `!modified +added ✘deleted ?untracked`

**Git Caching**: Git status is cached locally (`.git-cache.json`) with 5s TTL to avoid frequent git commands. Each repository is tracked separately by its `.git` directory path. Cache is automatically cleaned when expired or when exceeding 50 repositories.

## Development Notes

- TypeScript ES2022 target, CommonJS modules
- No external runtime dependencies (only `@types/node`)
- All I/O is synchronous except HTTPS requests
- Error handling: Fails gracefully (shows warnings, doesn't crash HUD)
- Debug mode: Set `DEBUG=my-claude-hud:*` environment variable
- When adding new features, update both `src/types.ts` and render modules

## Testing Changes

After modifying code:
```bash
npm run build           # Recompile
# HUD will automatically pick up changes on next Claude Code render
# Or test directly: echo '{}' | node dist/index.js
```

## Configuration Migration

The config system handles legacy formats:
- `layout: 'default'` → `lineLayout: 'compact'`
- `layout: 'separators'` → `lineLayout: 'compact', showSeparators: true`

Always validate new config options in `src/config.ts` merge functions.
