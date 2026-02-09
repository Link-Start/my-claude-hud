# My Claude HUD - 增强功能建议

> 基于 100% 完成功能后的扩展建议

## 🚀 可添加的增强功能

### ⭐⭐⭐ 高价值功能

| # | 功能 | 说明 | 优先级 | 复杂度 |
|---|------|------|--------|--------|
| 1 | **成本估算显示** | 根据 token 使用量显示 API 费用 | 高 | 低 |
| 2 | **上下文预算预测** | 预测上下文窗口何时填满 | 高 | 中 |
| 3 | **历史会话统计** | 跨会话追踪总 token、时间、常用工具 | 高 | 中 |
| 4 | **工具执行时间** | 显示每个工具的耗时，识别慢操作 | 中 | 低 |
| 5 | **告警系统** | 上下文接近上限、API 限制等通知 | 高 | 中 |

---

### ⭐⭐ 中等价值功能

| # | 功能 | 说明 | 优先级 | 复杂度 |
|---|------|------|--------|--------|
| 6 | **自定义颜色主题** | 支持终端主题配色（nord、dracula 等） | 中 | 低 |
| 7 | **智能工具分组** | 将相似工具分组显示减少混乱 | 中 | 中 |
| 8 | **项目专属配置** | 每个项目不同 HUD 设置 | 中 | 低 |

---

### ⭐ 低优先级功能

| # | 功能 | 说明 | 优先级 | 复杂度 |
|---|------|------|--------|--------|
| 9 | **悬停工具提示** | 显示详细信息（完整路径、命令等） | 低 | 高 |
| 10 | **快捷操作** | 键盘快捷键或命令行操作 | 中 | 低 |

---

## 📋 详细实现说明

### 1. 成本估算显示 (Cost Estimation)

**价值**: 帮助用户追踪 API 费用，控制成本

**实现方式**:
```typescript
// cost-estimator.ts
interface ModelPricing {
  inputPricePer1k: number;  // 每 1k input tokens 价格
  outputPricePer1k: number; // 每 1k output tokens 价格
}

const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4': { inputPricePer1k: 0.015, outputPricePer1k: 0.075 },
  'claude-sonnet-4': { inputPricePer1k: 0.003, outputPricePer1k: 0.015 },
  // ...
};

function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = PRICING[model];
  if (!pricing) return 0;
  return (inputTokens / 1000) * pricing.inputPricePer1k +
         (outputTokens / 1000) * pricing.outputPricePer1k;
}
```

**显示效果**:
```
[Opus 4.5] ████░░░░░░ 19% | $0.12/session | $2.34 today
```

---

### 2. 上下文预算预测 (Context Budget Projection)

**价值**: 预测何时会填满上下文窗口，避免意外截断

**实现方式**:
```typescript
// context-projection.ts
interface ProjectionResult {
  remainingTokens: number;
  estimatedMessagesRemaining: number;
  estimatedTimeRemaining: string;
}

function projectContextUsage(ctx: RenderContext): ProjectionResult {
  const currentUsage = getTotalTokens(ctx.stdin);
  const windowSize = ctx.stdin.context_window?.context_window_size ?? 200000;
  const remaining = windowSize - currentUsage;

  // 基于历史数据估算
  const avgTokensPerMessage = calculateAverageTokens();
  const messagesRemaining = Math.floor(remaining / avgTokensPerMessage);

  return {
    remainingTokens: remaining,
    estimatedMessagesRemaining: messagesRemaining,
    estimatedTimeRemaining: formatTime(messagesRemaining * avgTimePerMessage),
  };
}
```

**显示效果**:
```
[Opus 4.5] ████░░░░░░ 19% | ~15 messages remaining (~5min)
```

---

### 3. 历史会话统计 (Historical Session Statistics)

**价值**: 跨会话追踪使用情况，了解使用模式

**实现方式**:
```typescript
// session-stats.ts
interface SessionStats {
  totalSessions: number;
  totalTokensUsed: number;
  totalDuration: number;
  mostUsedTool: string;
  mostUsedToolCount: number;
  averageTokensPerSession: number;
}

function updateSessionStats(ctx: RenderContext): void {
  const statsPath = '.session-stats.json';
  let stats = loadStats(statsPath);

  stats.totalSessions++;
  stats.totalTokensUsed += getTotalTokens(ctx.stdin);
  stats.totalDuration += getSessionDuration(ctx);

  // 更新最常用工具
  const toolCounts = countToolsByType(ctx.transcript.tools);
  stats.mostUsedTool = getTopTool(toolCounts);

  saveStats(statsPath, stats);
}
```

**显示效果**:
```
Session #42 | Total: 1.2M tokens | Avg: 45k/session | Top tool: Read (47%)
```

---

### 4. 工具执行时间 (Tool Execution Time)

**价值**: 识别慢操作，优化性能

**实现方式**:
```typescript
// types.ts 扩展
interface ToolEntry {
  id: string;
  name: string;
  target?: string;
  status: 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;  // 新增：执行时长（毫秒）
}

// tools-line.ts 修改
function renderToolsLine(ctx: RenderContext): string | null {
  // ...
  for (const tool of completedTools) {
    const duration = tool.duration ?? 0;
    const durationStr = duration > 1000 ? ` (${formatDuration(duration)})` : '';
    parts.push(`${green('✓')} ${name}${durationStr} ${dim(`×${count}`)}`);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
  return `${(ms/60000).toFixed(1)}m`;
}
```

**显示效果**:
```
✓ Read ×5 | ✗ Bash (3.2s) | ✓ Glob ×1 | Grep (running...)
```

---

### 5. 告警系统 (Alert System)

**价值**: 在关键时刻提醒用户

**实现方式**:
```typescript
// alerts.ts
interface AlertConfig {
  contextWarning: number;      // 上下文警告阈值（默认 85）
  contextCritical: number;     // 上下文严重阈值（默认 95）
  apiLimitWarning: number;     // API 使用警告阈值（默认 90）
  longToolThreshold: number;   // 长时间工具阈值（默认 30s）
}

interface Alert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  icon: string;
}

function checkAlerts(ctx: RenderContext, config: AlertConfig): Alert[] {
  const alerts: Alert[] = [];
  const percent = getContextUsagePercent(ctx.stdin);

  // 上下文告警
  if (percent >= config.contextCritical) {
    alerts.push({
      type: 'critical',
      message: `Context at ${percent}%`,
      icon: '🚨',
    });
  } else if (percent >= config.contextWarning) {
    alerts.push({
      type: 'warning',
      message: `Context at ${percent}%`,
      icon: '⚠️',
    });
  }

  // API 限制告警
  if (ctx.usageData?.fiveHour ?? 0 >= config.apiLimitWarning) {
    alerts.push({
      type: 'warning',
      message: '5-hour API limit approaching',
      icon: '💰',
    });
  }

  return alerts;
}
```

**显示效果**:
```
[Opus 4.5] █████████░ 85% | ⚠️ Context at 85% | ~5 messages remaining
```

---

### 6. 自定义颜色主题 (Custom Color Themes)

**价值**: 匹配用户终端主题

**实现方式**:
```typescript
// themes.ts
interface ColorTheme {
  name: string;
  colors: {
    contextBar: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    magenta: string;
    cyan: string;
    yellow: string;
  };
}

const THEMES: Record<string, ColorTheme> = {
  default: {
    name: 'default',
    colors: {
      contextBar: '\x1b[32m',   // green
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      info: '\x1b[36m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      yellow: '\x1b[33m',
    },
  },
  nord: {
    name: 'nord',
    colors: {
      contextBar: '\x1b[38;2;143;188;187m',  // nord8
      success: '\x1b[38;2;163;190;140m',     // nord14
      warning: '\x1b[38;2;235;203;139m',     // nord13
      error: '\x1b[38;2;191;97;106m',        // nord11
      info: '\x1b[38;2;136;192;208m',        // nord9
      magenta: '\x1b[38;2;208;135;112m',      // nord15
      cyan: '\x1b[38;2;129;161;193m',         // nord7
      yellow: '\x1b[38;2;235;203;139m',       // nord13
    },
  },
  dracula: {
    name: 'dracula',
    colors: {
      contextBar: '\x1b[38;2;50;168;82m',      // green
      success: '\x1b[38;2;50;168;82m',
      warning: '\x1b[38;2;241;250;140m',
      error: '\x1b[38;2;255;85;85m',
      info: '\x1b[38;2;98;114;164m',
      magenta: '\x1b[38;2;255;121;198m',
      cyan: '\x1b[38;2;139;233;253m',
      yellow: '\x1b[38;2;241;250;140m',
    },
  },
};
```

**配置方式**:
```json
{
  "colorTheme": "nord",
  "customColors": {
    "contextBar": "#88c0d0",
    "success": "#a3be8c"
  }
}
```

---

### 7. 智能工具分组 (Smart Tool Grouping)

**价值**: 减少视觉混乱，提高可读性

**实现方式**:
```typescript
// tools-line.ts 修改
function renderToolsLine(ctx: RenderContext): string | null {
  const runningTools = tools.filter(t => t.status === 'running');
  const completedTools = tools.filter(t => t.status === 'completed' || t.status === 'error');

  // 按类型分组
  const toolGroups = new Map<string, ToolEntry[]>();
  for (const tool of completedTools) {
    const group = getToolGroup(tool.name);
    if (!toolGroups.has(group)) {
      toolGroups.set(group, []);
    }
    toolGroups.get(group)!.push(tool);
  }

  // 显示分组
  const parts: string[] = [];
  for (const tool of runningTools.slice(-2)) {
    parts.push(`${yellow('◐')} ${cyan(tool.name)}`);
  }

  for (const [group, tools] of toolGroups.entries()) {
    const count = tools.length;
    if (count > 3) {
      parts.push(`${green('✓')} ${group} ×${count}`);
    } else {
      for (const tool of tools) {
        parts.push(`${green('✓')} ${tool.name}`);
      }
    }
  }

  return parts.join(' | ');
}

function getToolGroup(toolName: string): string {
  if (['Read', 'ReadFile', 'Glob', 'GlobFiles'].includes(toolName)) return 'File ops';
  if (['Grep', 'Search', 'Find'].includes(toolName)) return 'Search';
  if (['Bash', 'Shell', 'Execute'].includes(toolName)) return 'Shell';
  return 'Other';
}
```

**显示效果**:
```
✓ File ops ×12 | ✓ Search ×5 | ◐ Bash | ✓ Edit ×2
```

---

### 8. 项目专属配置 (Project-Specific Configurations)

**价值**: 不同项目使用不同 HUD 设置

**实现方式**:
```typescript
// config.ts 修改
async function loadConfig(): Promise<HudConfig> {
  // 1. 加载全局配置
  const globalConfig = loadConfigFile(getGlobalConfigPath());

  // 2. 加载项目配置（如果存在）
  const projectConfig = cwd ? loadConfigFile(getProjectConfigPath(cwd)) : {};

  // 3. 项目配置覆盖全局配置
  return mergeConfigs(globalConfig, projectConfig);
}

function getProjectConfigPath(cwd: string): string {
  // 优先级：.claude-hud.json > .claude-hud/config.json
  const jsonPath = path.join(cwd, '.claude-hud.json');
  if (fs.existsSync(jsonPath)) return jsonPath;

  const dirPath = path.join(cwd, '.claude-hud', 'config.json');
  if (fs.existsSync(dirPath)) return dirPath;

  return jsonPath; // 默认路径
}
```

**项目配置示例**:
```json
// .claude-hud.json
{
  "lineLayout": "expanded",
  "showSeparators": true,
  "display": {
    "showSpeed": true,
    "showTokenBreakdown": true
  },
  "alerts": {
    "contextWarning": 80,
    "longToolThreshold": 10
  }
}
```

---

### 9. 悬停工具提示 (Hover Tooltips)

**价值**: 显示详细信息而不占用常规空间

**实现方式**:
```typescript
// 需要终端支持特定转义序列
function renderWithTooltip(text: string, tooltip: string): string {
  // 使用 OSC 833 转义序列（部分终端支持）
  return `\x1b]833;${tooltip}\x07${text}\x1b]838\x07`;
}

// 使用示例
const toolWithTooltip = renderWithTooltip(
  cyan('Read'),
  'src/index.ts:145\n读取文件内容'
);
```

---

### 10. 快捷操作 (Quick Actions)

**价值**: 快速执行常用操作

**实现方式**:
```typescript
// actions.ts
interface Action {
  name: string;
  handler: () => void | Promise<void>;
}

const ACTIONS: Record<string, Action> = {
  'toggle-layout': {
    name: 'Toggle layout',
    handler: async () => {
      const config = await loadConfig();
      config.lineLayout = config.lineLayout === 'compact' ? 'expanded' : 'compact';
      await saveConfig(config);
      console.log(`Layout changed to: ${config.lineLayout}`);
    },
  },
  'stats': {
    name: 'Show statistics',
    handler: () => {
      const stats = loadSessionStats();
      console.log(JSON.stringify(stats, null, 2));
    },
  },
  'clear-cache': {
    name: 'Clear all caches',
    handler: () => {
      clearSpeedCache();
      clearUsageCache();
      console.log('All caches cleared');
    },
  },
  'self-test': {
    name: 'Run self-test',
    handler: async () => {
      await runSelfTest();
    },
  },
};

// index.ts 添加
const actionArg = process.argv.find(arg => arg.startsWith('--action='));
if (actionArg) {
  const actionName = actionArg.split('=')[1];
  const action = ACTIONS[actionName];
  if (action) {
    await action.handler();
    process.exit(0);
  }
}
```

**使用方式**:
```bash
# 切换布局
node dist/index.js --action=toggle-layout

# 显示统计
node dist/index.js --action=stats

# 清除缓存
node dist/index.js --action=clear-cache

# 自测
node dist/index.js --action=self-test
```

---

## 📊 功能对比表

| 增强 | 类别 | 优先级 | 复杂度 | 预计工作量 |
|------|------|--------|--------|-----------|
| 成本估算 | UX | 高 | 低 | 1-2h |
| 上下文预测 | UX | 高 | 中 | 2-3h |
| 历史统计 | UX | 高 | 中 | 3-4h |
| 工具时间 | 性能 | 中 | 低 | 1h |
| 告警系统 | UX | 高 | 中 | 2-3h |
| 颜色主题 | UX | 中 | 低 | 2-3h |
| 工具分组 | UX | 中 | 中 | 2h |
| 项目配置 | DX | 中 | 低 | 1-2h |
| 悬停提示 | UX | 低 | 高 | 4-5h |
| 快捷操作 | DX | 中 | 低 | 2h |

---

## 🎯 推荐实现顺序

### 第一阶段（最快收益）
1. 成本估算显示 (1-2h)
2. 工具执行时间 (1h)
3. 快捷操作 (2h)

### 第二阶段（增强体验）
4. 上下文预算预测 (2-3h)
5. 告警系统 (2-3h)
6. 项目专属配置 (1-2h)

### 第三阶段（高级功能）
7. 历史会话统计 (3-4h)
8. 自定义颜色主题 (2-3h)
9. 智能工具分组 (2h)

### 第四阶段（可选功能）
10. 悬停工具提示 (4-5h)

---

## 📝 开发注意事项

1. **保持向后兼容**：所有新功能都应该是可选的，不影响现有使用
2. **配置优先**：所有功能都应该可以通过配置启用/禁用
3. **性能考虑**：避免添加过多的文件 I/O 或计算开销
4. **测试覆盖**：新功能应该有相应的测试用例
5. **文档更新**：及时更新 README.md 和配置示例
