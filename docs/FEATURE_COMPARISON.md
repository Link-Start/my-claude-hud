# Claude Code 状态显示工具功能对比分析

> 最后更新：2026-03-10

## 概述

本文档对比了 GitHub 上主要的 Claude Code 状态显示（StatusLine/HUD）工具，分析了各工具的独特功能，为 my-claude-hud 的后续功能规划提供参考。

## 同类工具一览

| 工具名称 | 编程语言 | GitHub 仓库 | 特点 |
|---------|---------|-------------|------|
| Claude HUD | TypeScript | jarrodwatts/claude-hud | 功能最全，实时工具追踪 |
| oh-my-claude | Shell + oh-my-posh | ssenart/oh-my-claude | Powerline 主题 + Pro 限制追踪 |
| ccstatusline | Rust | sirmalloc/ccstatusline | 高性能 Rust 实现 |
| CCometixLine | Rust | jqueryscript/awesome-claude-code | 1.3k+ stars，实时使用量追踪 |
| cc-hud-go | Go | huyhandes/cc-hud-go | Go 实现 |
| claude_monitor_statusline | - | gabriel-dehan/claude_monitor_statusline | 可定制化显示 |
| oh-my-claudecode | TypeScript | Yeachan-Heo/oh-my-claudecode | 多代理编排系统 |
| ccusage | TypeScript | sirmalloc/ccusage | 使用量追踪 |

## 功能详细对比

### 1. 基础功能对比

| 功能 | Claude HUD | oh-my-claude | my-claude-hud | ccstatusline |
|------|-----------|--------------|---------------|---------------|
| 项目/目录显示 | ✅ | ✅ | ✅ | ✅ |
| 模型显示 | ✅ | ✅ | ✅ | ✅ |
| 上下文使用量 | ✅ 颜色编码 | ✅ | ✅ 进度条 | ✅ |
| Token 统计 | ✅ | ✅ 缓存优化 | ✅ | ✅ |
| 会话时长 | ✅ | ✅ | ✅ | ✅ |
| 成本估算 | - | - | ✅ 2026定价 | - |

### 2. 高级功能对比

#### 2.1 实时工具活动追踪

**Claude HUD 独有功能**：
- 显示 Claude 正在使用的工具（如 `⟳ Read src/index.ts`）
- 已完成工具按类型聚合统计（如 `✓ TaskOutput ×2`）
- 实时更新频率：~300ms

**my-claude-hud 当前状态**：❌ 未实现

**建议优先级**：⭐⭐⭐⭐⭐（高）

---

#### 2.2 配置项数量统计

**Claude HUD 独有功能**：
- CLAUDE.md 文件数量
- rules 数量
- MCPs（Model Context Protocol）数量
- hooks 数量

**显示示例**：
```
2 CLAUDE.md | 8 rules | 6 MCPs
```

**my-claude-hud 当前状态**：❌ 未实现

**建议优先级**：⭐⭐⭐⭐（高）

---

#### 2.3 代理状态追踪

**Claude HUD 独有功能**：
- 显示当前运行的代理类型
- 代理正在执行的任务
- 任务耗时

**显示示例**：
```
✓ Explore: Research patterns (5s)
```

**my-claude-hud 当前状态**：⚠️ 部分实现（显示代理名称和任务，但无耗时统计）

**建议优先级**：⭐⭐⭐⭐（高）

---

#### 2.4 Todo 进度追踪

**Claude HUD 独有功能**：
- 当前任务显示
- 完成计数器

**显示示例**：
```
✓ All complete (5/5)
✓ Implementing (3/10)
```

**my-claude-hud 当前状态**：⚠️ 部分实现（显示 Todo 数量）

**建议优先级**：⭐⭐⭐⭐（高）

---

#### 2.5 Claude Pro 限制追踪

**oh-my-claude 独有功能**：
- 5小时/7天使用量百分比
- 限制重置倒计时

**显示示例**：
```
Pro: 5h:90% 7d:27%
Reset: 5h:2h1min 7d:Thu09:59
```

**技术实现**：
- 无需凭证，自动获取使用量
- 通过 API 或网页抓取获取数据

**my-claude-hud 当前状态**：❌ 未实现

**建议优先级**：⭐⭐⭐（中）

---

#### 2.6 高级 Git 状态

**oh-my-claude 独有功能**：
- 分支名称
- Staged 文件数量
- Modified 文件数量
- Upstream 状态（ahead/behind/diverged）
- 动态颜色变化

**显示示例**：
```
main ↑2 ↓1 (staged: 2, modified: 5)
```

**my-claude-hud 当前状态**：⚠️ 部分实现（仅显示分支名称）

**建议优先级**：⭐⭐⭐（中）

---

#### 2.7 Oh-my-posh 主题支持

**oh-my-claude 独有功能**：
- Powerline 风格分隔符
- 可自定义颜色和图标
- 可配置段顺序

**技术实现**：
- 依赖 oh-my-posh 工具
- JSON 配置文件

**my-claude-hud 当前状态**：❌ 未实现

**建议优先级**：⭐⭐（低）- 属于 UI 样式增强

---

#### 2.8 非阻塞后台更新 + JSON 缓存

**oh-my-claude 独有功能**：
- 后台异步更新使用量数据
- JSON 缓存避免重复请求
- 缓存超时配置（默认60秒）

**my-claude-hud 当前状态**：⚠️ 部分实现（缺少缓存机制）

**建议优先级**：⭐⭐⭐⭐（高）- 性能优化

---

#### 2.9 Transcript 深度解析

**Claude HUD 技术实现**：
- 读取 transcript JSONL 文件
- 解析工具执行记录
- 获取精确的代理和工具信息

**my-claude-hud 当前状态**：❌ 未实现

**优势**：
- 获取更精确的工具使用统计
- 支持历史数据分析

**建议优先级**：⭐⭐⭐⭐（高）

---

## my-claude-hud 独有功能

以下功能是 my-claude-hud 特有或领先的功能：

| 功能 | 说明 |
|------|------|
| 推理努力推测 | 智能估算当前推理级别（low/medium/high） |
| 思考时间追踪 | 追踪 AI 思考耗时 |
| 2026 年定价 | 最新的 Claude API 定价 |
| 自动定价更新 | GitHub Actions 每月自动更新定价 |
| Ralph Wiggum 支持 | 显示 Ralph 循环状态（如果安装） |
| 项目内存分析 | 分析项目的 CLAUDE.md 和 memory 规则 |
| 成本预估投影 | 预测上下文即将耗尽的时间 |

## 功能实现优先级

### 高优先级（P0）

1. **实时工具活动追踪**
   - 显示当前运行的工具
   - 显示目标文件
   - 工具类型统计

2. **配置项数量统计**
   - CLAUDE.md 数量
   - rules 数量
   - MCPs 数量
   - hooks 数量

3. **Transcript 深度解析**
   - 读取 transcript JSONL
   - 精确的工具统计
   - 代理活动记录

4. **后台更新优化**
   - JSON 缓存机制
   - 非阻塞更新
   - 性能优化

### 中优先级（P1）

5. **Claude Pro 限制追踪**
   - 使用量百分比
   - 重置倒计时
   - 无需凭证获取

6. **高级 Git 状态**
   - Staged/Modified 统计
   - Upstream 状态
   - 动态颜色

7. **代理耗时追踪**
   - 任务耗时统计
   - 完成时间预估

### 低优先级（P2）

8. **Oh-my-posh 主题支持**
   - Powerline 风格
   - 可自定义主题

## 总结

通过对比分析，my-claude-hud 在以下方面具有优势：
- 推理努力和思考时间追踪
- 2026 年最新定价
- Ralph Wiggum 支持

建议优先实现的功能：
1. 实时工具活动追踪（用户最关注）
2. 配置项数量统计（实用）
3. Transcript 深度解析（技术基础）
4. 后台更新优化（性能提升）

## 参考链接

- [Claude HUD](https://chsami.com/posts/claude-hud.html)
- [oh-my-claude](https://github.com/ssenart/oh-my-claude)
- [ccstatusline](https://github.com/sirmalloc/ccstatusline)
- [ccusage](https://github.com/sirmalloc/ccusage)
- [CCometixLine](https://github.com/jqueryscript/awesome-claude-code)
- [Claude Code StatusLine 官方文档](https://code.claude.com/docs/en/statusline)
