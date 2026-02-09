# My Claude HUD 增强功能实现计划

## 背景

用户要求实现 ENHANCEMENTS.md 中列出的增强功能，以进一步提升 my-claude-hud 插件的实用性和用户体验。

当前状态：100% 核心功能完成，与原插件功能一致。

目标：添加高价值增强功能，使插件更加实用。

## 实施计划

### ✅ 第一阶段（最快收益）- 已完成

1. ✅ **成本估算显示** (已完成)
   - 文件：`src/cost-estimator.ts`
   - 功能：根据 token 使用量计算 API 费用
   - 显示：`$0.12/session | $2.34 today`
   - 集成：在 render/session-line.ts 中显示

2. ✅ **工具执行时间** (已完成)
   - 修改：`src/types.ts` 添加 duration 字段
   - 修改：`src/transcript.ts` 记录工具执行时间
   - 修改：`src/render/tools-line.ts` 显示耗时
   - 显示：`✓ Read ×5 | ✗ Bash (3.2s)`

3. ✅ **快捷操作** (已完成)
   - 文件：`src/actions.ts`
   - 功能：`--action=toggle-layout`, `--action=stats`, `--action=clear-cache`
   - 集成：修改 `src/index.ts` 处理 action 参数

### ✅ 第二阶段（增强体验）- 已完成

4. ✅ **上下文预算预测** (已完成)
   - 文件：`src/context-projection.ts`
   - 功能：预测剩余消息数量/时间
   - 显示：`~15 messages remaining (~5min)`

5. ✅ **告警系统** (已完成)
   - 文件：`src/alerts.ts`
   - 配置：contextWarning, contextCritical, apiLimitWarning
   - 显示：`⚠️ Context at 85%`

6. ✅ **项目专属配置** (已完成)
   - 修改：`src/config.ts` 支持项目配置覆盖
   - 文件：`.claude-hud.json` 或 `.claude-hud/config.json`
   - 优先级：项目配置 > 全局配置

### ✅ 第三阶段（高级功能）- 已完成

7. ✅ **历史会话统计** (已完成)
   - 功能：跨会话追踪总 token、时间、常用工具
   - 显示：`Session #42 | Total: 1.2M tokens | Top tool: Read (47%)`
   - 文件：`src/session-stats.ts`

8. ✅ **自定义颜色主题** (已完成)
   - 功能：支持终端主题配色（nord、dracula、monokai、solarized）
   - 配置：`colorTheme` 和 `customColors`
   - 文件：`src/themes.ts`

9. ✅ **智能工具分组** (已完成)
   - 功能：将相似工具分组显示减少混乱
   - 显示：`✓ File ops ×12 | ✓ Search ×5`
   - 修改：`src/render/tools-line.ts`

### ✅ 额外功能

10. ✅ **多语言支持** (已完成)
    - 功能：支持中文/英文显示切换
    - 配置：`display.displayLanguage` (zh/en)
    - 文件：`src/i18n.ts`
    - 默认：中文显示

## 关键文件

### 已完成
- ✅ `src/cost-estimator.ts` - 新建
- ✅ `src/actions.ts` - 新建
- ✅ `src/context-projection.ts` - 新建
- ✅ `src/alerts.ts` - 新建
- ✅ `src/session-stats.ts` - 新建
- ✅ `src/themes.ts` - 新建
- ✅ `src/i18n.ts` - 新建（多语言支持）
- ✅ `src/types.ts` - 修改（添加 duration、alerts、theme、DisplayLanguage）
- ✅ `src/transcript.ts` - 修改（记录工具时间）
- ✅ `src/render/tools-line.ts` - 修改（显示时间、工具分组、翻译）
- ✅ `src/render/agents-line.ts` - 修改（Agent 类型翻译）
- ✅ `src/render/todos-line.ts` - 修改（状态文本翻译）
- ✅ `src/render/session-line.ts` - 修改（集成成本、预测、告警）
- ✅ `src/render/colors.ts` - 修改（支持主题系统）
- ✅ `src/config.ts` - 修改（项目配置、alerts、theme）
- ✅ `src/index.ts` - 修改（actions 支持、cwd 参数、主题初始化）

## 验证方式

1. 编译测试：`bun run build`
2. 功能测试：测试每个新功能
3. 集成测试：确保不影响现有功能

## 使用示例

### 快捷操作
```bash
# 切换布局
node dist/index.js --action=toggle-layout

# 显示统计
node dist/index.js --action=stats

# 清除缓存
node dist/index.js --action=clear-cache
```

### 项目配置
在项目根目录创建 `.claude-hud.json`：
```json
{
  "lineLayout": "expanded",
  "showSeparators": true,
  "theme": {
    "colorTheme": "nord"
  },
  "alerts": {
    "contextWarning": 80,
    "contextCritical": 95
  }
}
```

### 可用主题
- `default` - 标准终端颜色
- `nord` - 北极风格蓝灰色调
- `dracula` - 深色高对比度
- `monokai` - 经典深色主题
- `solarized` - Solarized Dark

### 多语言支持
- `zh` - 中文（默认）
- `en` - 英文

## 进度总结

- ✅ 第一阶段：3/3 完成（100%）
- ✅ 第二阶段：3/3 完成（100%）
- ✅ 第三阶段：3/3 完成（100%）
- ✅ 额外功能：1/1 完成（100%）

**🎉 总体进度：10/10 完成（100%）**

## 功能总结

| # | 功能 | 说明 | 优先级 |
|---|------|------|--------|
| 1 | 成本估算显示 | 根据 token 使用量计算 API 费用 | 高 |
| 2 | 工具执行时间 | 显示每个工具的执行耗时 | 中 |
| 3 | 快捷操作 | 命令行工具支持各种操作 | 中 |
| 4 | 上下文预算预测 | 预测剩余消息数量/时间 | 高 |
| 5 | 告警系统 | 上下文/API 限制告警 | 高 |
| 6 | 项目专属配置 | 项目级配置覆盖全局配置 | 中 |
| 7 | 历史会话统计 | 跨会话追踪使用情况 | 中 |
| 8 | 自定义颜色主题 | 支持终端主题配色 | 中 |
| 9 | 智能工具分组 | 相似工具分组显示 | 中 |
| 10 | 多语言支持 | 中文/英文显示切换 | 中 |
| 7 | 历史会话统计 | 跨会话追踪使用情况 | 中 |
| 8 | 自定义颜色主题 | 支持终端主题配色 | 中 |
| 9 | 智能工具分组 | 相似工具分组显示 | 中 |
