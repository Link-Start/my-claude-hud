# Claude Code 记忆功能分析

> 分析日期：2026年3月9日
> 来源：官方文档、GitHub Issues、Reddit 讨论

## 概述

Claude Code 在 2026 年 2 月正式推出了 **Auto Memory** 功能，与原有的 CLAUDE.md 形成两套互补的记忆系统。

---

## 官方记忆系统

### 两种记忆类型对比

| 特性 | CLAUDE.md | Auto Memory |
|------|-----------|-------------|
| **编写者** | 用户手动编写 | Claude 自动生成 |
| **内容** | 指令、规则、架构说明 | 学习到的模式、调试洞察、偏好 |
| **作用域** | 项目/用户/组织级别 | 每个 Git 仓库 |
| **加载方式** | 完整加载 | 仅加载前 200 行 |
| **存储位置** | 项目目录或 `~/.claude/` | `~/.claude/projects/<project>/memory/` |
| **用途** | 编码标准、工作流、项目架构 | 构建命令、调试洞察、发现的偏好 |

### CLAUDE.md 文件作用域

| 作用域 | 位置 | 用途 |
|--------|------|------|
| 组织级 | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | 公司编码标准、安全策略 |
| 项目级 | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 项目架构、编码标准、工作流 |
| 用户级 | `~/.claude/CLAUDE.md` | 个人偏好、工具快捷方式 |
| 本地级 | `./CLAUDE.local.md` | 个人项目特定偏好（不提交 git） |

### Auto Memory 工作原理

1. **自动判断**：Claude 在会话中自动判断哪些信息值得记住
2. **自动保存**：写入 `~/.claude/projects/<project>/memory/MEMORY.md`
3. **自动加载**：下次会话自动加载前 200 行作为上下文
4. **按需读取**：主题文件（如 `debugging.md`）按需读取

### 配置选项

```json
// settings.json 中启用/禁用
{
  "autoMemoryEnabled": false
}

// 或通过环境变量
{
  "env": {
    "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"
  }
}
```

### 管理命令

- `/memory` - 查看和管理所有记忆文件
- `/memory` + 选择文件 - 编辑特定记忆文件

---

## 社区反馈

### 正面评价

- ✅ 解决了"每次会话从零开始"的问题
- ✅ 无需手动维护，全自动积累知识
- ✅ 免费用户也能使用
- ✅ 与 CLAUDE.md 互补，分工明确

### 负面评价

- ❌ 仅加载前 200 行，大项目不够用
- ❌ 无相关性过滤，可能产生上下文膨胀
- ❌ 存储在本地，不同机器无法同步
- ❌ 部分用户认为是"半成品"，本质就是 markdown 文件
- ❌ 自动保存的内容可能不相关，影响上下文质量

### Reddit 用户典型评论

> "The fundamental issue is that unstructured auto-saved notes don't scale. Works fine for small projects. But on anything complex, you end up with irrelevant context bloat."

> "I disable all memory features. 90% of my requests include a spec/implementation document and claude.md for wide scope. Until they are updating model weights count me out."

---

## 第三方增强方案

### claude-mem 插件

GitHub: https://github.com/thedotmack/claude-mem

#### 核心特性

| 特性 | 官方 Auto Memory | claude-mem |
|------|------------------|------------|
| **存储方式** | 纯 markdown | SQLite + Chroma 向量数据库 |
| **搜索能力** | 无 | 语义搜索 + FTS5 全文搜索 |
| **加载策略** | 固定前 200 行 | 渐进式按需加载 |
| **Token 消耗** | 可能较高 | 优化后节省约 10 倍 |
| **UI** | 无 | Web 查看器 (localhost:37777) |
| **隐私控制** | 无 | `<private>` 标签排除敏感内容 |

#### 架构组件

- **5 个生命周期钩子**：SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd
- **Worker 服务**：HTTP API (端口 37777) + Web UI
- **SQLite 数据库**：存储会话、观察、摘要
- **Chroma 向量数据库**：混合语义 + 关键词搜索
- **mem-search 技能**：自然语言查询

#### 3 层渐进式加载

1. `search` - 搜索获取结果索引
2. `timeline` - 查看特定观察周围的活动
3. `get_observations` - 获取完整详情

#### 安装方式

```bash
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

---

## 最佳实践建议

### 适合使用官方 Auto Memory 的场景

- 小型到中型项目
- 单机开发环境
- 希望零配置自动记忆

### 适合使用 claude-mem 的场景

- 大型复杂项目
- 需要语义搜索历史记录
- 关注 token 消耗
- 需要隐私控制

### CLAUDE.md 编写建议

1. **保持简洁**：目标控制在 200 行以内
2. **结构清晰**：使用 markdown 标题和列表分组
3. **具体明确**：
   - ❌ "格式化代码"
   - ✅ "使用 2 空格缩进"
4. **避免冲突**：定期检查并删除过时或矛盾的指令

---

## 相关链接

- [官方文档：How Claude remembers your project](https://docs.anthropic.com/en/docs/claude-code/memory)
- [claude-mem GitHub](https://github.com/thedotmack/claude-mem)
- [Reddit 讨论](https://www.reddit.com/r/ClaudeAI/comments/1rfkmj1/new_automemory_feature_in_claude_code_details/)
- [GitHub Issues - Memory 相关问题](https://github.com/anthropics/claude-code/issues?q=memory)

---

## iFlow CLI 记忆功能

> 来源：心流开放平台官方文档

### 概述

iFlow CLI 是阿里旗下心流团队推出的终端 AI 智能体，同样具备完善的记忆系统。核心记忆文件为 **IFLOW.md**，使用自然语言编写，为 AI 提供项目上下文。

### 分级管理系统

| 级别 | 位置 | 优先级 | 用途 |
|------|------|--------|------|
| **全局级** | `~/.iflow/IFLOW.md` | 低 | 个人偏好、通用编码规范、全局记忆 |
| **项目级** | `/project/IFLOW.md` | 中 | 项目架构、技术栈、团队规范 |
| **子目录级** | `/project/src/IFLOW.md` | 高 | 模块特定的指令和约定 |

### 加载机制

iFlow CLI 从当前工作目录开始，向上搜索到项目根目录和用户主目录，加载所有找到的 IFLOW.md 文件。内容按优先级顺序合并，高优先级内容覆盖低优先级内容。

### 记忆命令

```bash
/memory show          # 查看当前加载的记忆内容
/memory add "内容"    # 手动添加记忆
/memory refresh       # 重新加载所有 IFLOW.md 文件
```

### 模块化导入

支持通过 `@` 语法导入其他文件，实现配置的模块化管理：

```markdown
# 主 IFLOW.md 文件
@./.iflow/architecture.md
@./.iflow/coding-style.md
@./.iflow/deployment.md
```

支持相对路径和绝对路径，最大导入嵌套深度为 5 层。

### 快速初始化：/init

```bash
# 自动分析项目并生成定制化的 IFLOW.md
$ iflow
> /init
```

`/init` 命令会分析：
- 技术栈识别（基于 package.json、requirements.txt 等）
- 项目结构（目录布局、关键文件位置）
- 构建工具（webpack、vite、rollup 等）
- 测试框架（jest、mocha、pytest 等）
- 代码规范（ESLint、Prettier 等）

### save_memory 功能

持久化重要信息到 `~/.iflow/IFLOW.md`，实现跨会话记忆保存。

### 自定义文件名

```json
{
  "contextFileName": "AGENTS.md"
}

// 或支持多个文件名
{
  "contextFileName": ["IFLOW.md", "AGENTS.md", "CONTEXT.md"]
}
```

---

## Claude Code vs iFlow CLI 记忆功能对比

| 特性 | Claude Code | iFlow CLI |
|------|-------------|-----------|
| **记忆文件** | CLAUDE.md + MEMORY.md | IFLOW.md |
| **自动记忆** | Auto Memory（自动保存） | save_memory（手动触发） |
| **分级管理** | 4 级（组织/项目/用户/本地） | 3 级（全局/项目/子目录） |
| **导入功能** | `@` 语法 | `@` 语法 |
| **快速初始化** | 无 | `/init` 自动生成 |
| **记忆命令** | `/memory` | `/memory show/add/refresh` |
| **加载限制** | Auto Memory 前 200 行 | 无限制 |
| **模块化支持** | `.claude/rules/` 目录 | `@` 导入语法 |

### 设计理念对比

| 方面 | Claude Code | iFlow CLI |
|------|-------------|-----------|
| **自动程度** | 更自动化（Auto Memory） | 更可控（手动 save） |
| **初始化** | 手动编写 | 自动分析生成 |
| **上下文控制** | 有行数限制 | 无硬性限制 |
| **适用场景** | 国际化项目 | 国内团队协作 |

---

## 结论

### Claude Code

官方 Auto Memory 是一个基础的自动记忆功能，适合简单项目快速上手。它解决了 Claude Code "每次会话从零开始"的核心痛点，但在大规模项目中存在上下文膨胀和相关性过滤的问题。

对于复杂项目，社区方案 claude-mem 提供了更强大的语义搜索和渐进式加载能力，能更好地管理大量记忆内容，但需要额外安装和配置。

### iFlow CLI

iFlow CLI 的记忆系统设计更加简洁可控，通过三级管理和模块化导入实现灵活配置。`/init` 命令能快速生成项目上下文，适合国内团队使用。手动触发的 save_memory 比自动记忆更可控，避免了上下文膨胀问题。

### 选择建议

| 场景 | 推荐方案 |
|------|----------|
| 国际化项目、Claude 生态 | Claude Code + claude-mem |
| 国内团队、阿里云生态 | iFlow CLI |
| 大型复杂项目 | claude-mem（语义搜索） |
| 快速初始化需求 | iFlow CLI（/init 命令） |
| 精细控制记忆内容 | iFlow CLI（手动 save） |

选择哪种方案取决于项目规模、团队需求、使用的 AI 模型生态以及对记忆控制的精细度要求。
