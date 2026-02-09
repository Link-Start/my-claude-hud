# 更新日志

所有值得注意的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-02-09

### 🎉 首个正式发布

#### ✨ 新增功能

**核心功能**
- 📊 实时显示上下文使用量和进度条
- 🔧 显示活跃工具使用情况（Read、Write、Edit、Bash 等）
- 🤖 显示运行中的 Agent 和持续时间
- ✅ Todo 列表进度追踪
- 🌿 Git 状态集成（分支、未提交更改、ahead/behind）
- 📈 API 使用量统计（Max/Pro/Team 计划）
- ⚡ 输出令牌速度计算
- 💰 成本估算功能

**显示与布局**
- 🎨 5 种内置颜色主题（default、nord、dracula、monokai、solarized）
- 📱 紧凑/扩展两种布局模式
- 🔤 智能终端宽度检测与截断
- 🌍 中英文双语支持

**配置系统**
- ⚙️ 全局 + 项目级配置覆盖
- 📦 项目级 `.claude-hud.json` 配置支持
- 🔄 自动配置脚本（npm postinstall）

**快捷操作**
- 🔄 `--action=toggle-layout` - 切换布局模式
- 📊 `--action=stats` - 显示使用统计
- 🗑️ `--action=clear-cache` - 清除缓存
- ❓ `--action=help` - 显示帮助信息

**缓存系统**
- ⏱️ API 使用量缓存（60s 成功 / 15s 失败 TTL）
- 🌿 Git 状态缓存（5s TTL，仓库级别）
- 🔑 Keychain 失败退避机制
- 📊 会话统计跨会话追踪

**开发工具**
- 🧪 Jest 单元测试框架
- 📝 TypeScript 类型系统
- 📚 完整的 CLAUDE.md 项目文档

#### 🛠️ 工具脚本

**配置修复**
- 🔧 `fix-hud-config.command` - 双击自动修复配置（macOS）
- 📝 `scripts/ensure-hud-config.sh` - 全局配置自动添加
- 🔄 `scripts/ensure-cc-switch-hud.sh` - cc-switch 多配置支持
- 🐍 `scripts/fix-cc-switch-db.py` - Python 版本配置修复

**安装**
- 📦 `scripts/install.sh` - 自动安装脚本

#### 📚 文档

- ✅ 完整的中文 README
- 🌍 英文 README
- 📖 CLAUDE.md 项目指南
- 🔧 配置示例文件
- 🎨 功能特性对比

#### 🏗️ 架构

**模块化设计**
- `src/config.ts` - 配置加载与合并
- `src/transcript.ts` - 会话记录解析
- `src/git.ts` - Git 状态获取
- `src/usage-api.ts` - API 使用量获取
- `src/render/` - 分层渲染系统
- `src/i18n.ts` - 国际化支持
- `src/alerts.ts` - 警告系统
- `src/cost-estimator.ts` - 成本估算
- `src/context-projection.ts` - 上下文预测

#### 🎯 GitHub 优化

- 🏷️ 7 个 Topics 标签
- 📝 Issue 模板（Bug 反馈、功能建议）
- 🔀 Pull Request 模板
- 📦 Release 发布流程

#### 🔍 测试覆盖

- ⚙️ 配置系统测试（合并、默认值）
- 💰 成本估算测试
- 🌍 i18n 翻译测试

---

## 📋 计划中的功能

### 未来版本

- [ ] 更多颜色主题
- [ ] 自定义标签支持（--extra-cmd 增强）
- [ ] 性能优化建议
- [ ] 更多测试覆盖

---

## 🙏 致谢

本项目灵感来源于 [Jarrod Watts](https://github.com/jarrodwatts) 的 [claude-hud](https://github.com/jarrodwatts/claude-hud) 项目。

感谢原始项目提供的灵感和基础！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

[1.0.0]: https://github.com/Link-Start/my-claude-hud/releases/tag/v1.0.0
