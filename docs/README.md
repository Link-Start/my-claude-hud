# My Claude HUD 开发文档

## 文档说明

本目录存放 My Claude HUD 插件的开发计划和增强功能文档。

## 文档列表

| 文档 | 说明 |
|------|------|
| [implementation-plan.md](./implementation-plan.md) | 增强功能实现计划（含进度跟踪） |
| [ENHANCEMENTS.md](./ENHANCEMENTS.md) | 增强功能详细设计文档 |

## 快捷链接

- **项目根目录**: `/Users/link/Desktop/my-claude-hud`
- **源码目录**: `src/`
- **配置目录**: `~/.claude/plugins/my-claude-hud/`

## 当前进度

### ✅ 已完成（第一阶段）

1. ✅ 成本估算显示 - 根据 token 使用量计算 API 费用
2. ✅ 工具执行时间追踪 - 显示每个工具的执行耗时
3. ✅ 快捷操作命令行 - 支持 `--action=` 参数执行各种操作

### 🔄 待实现（第二阶段）

4. ⏳ 上下文预算预测
5. ⏳ 告警系统
6. ⏳ 项目专属配置

### ⏳ 待定（第三阶段）

7. ⏳ 历史会话统计
8. ⏳ 自定义颜色主题
9. ⏳ 智能工具分组

## 使用示例

```bash
# 编译项目
bun run build

# 测试快捷操作
node dist/index.js --action=help
node dist/index.js --action=stats
node dist/index.js --action=toggle-layout
node dist/index.js --action=clear-cache
```
