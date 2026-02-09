# 贡献指南

感谢你对 My Claude HUD 的关注！我们欢迎各种形式的贡献。

---

## 🚀 快速开始

### 环境要求

- **Node.js:** >= 18.0.0
- **npm:** >= 8.0.0
- **Git:** 最新版本

### 开发环境设置

```bash
# 1. Fork 并 clone 仓库
git clone https://github.com/YOUR_USERNAME/my-claude-hud.git
cd my-claude-hud

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 开发模式（自动编译）
npm run dev
```

---

## 📝 代码规范

### TypeScript 规范

- 使用 TypeScript 严格模式（已配置）
- 遵循现有代码风格
- 添加必要的类型注解
- 导入顺序：第三方库 → 内部模块 → 类型

```typescript
// ✅ 好的示例
import fs from 'fs';
import path from 'path';
import { Config } from './types';
import { loadConfig } from './config';

// ❌ 避免
import { Config } from './types';
import fs from 'fs';
```

### 命名规范

- **文件名:** kebab-case (例如: `cost-estimator.ts`)
- **变量/函数:** camelCase (例如: `calculateCost`)
- **类名:** PascalCase (例如: `ConfigManager`)
- **常量:** UPPER_SNAKE_CASE (例如: `MAX_TOKENS`)

### 注释规范

```typescript
/**
 * 计算成本估算
 * @param inputTokens - 输入 token 数量
 * @param outputTokens - 输出 token 数量
 * @param pricing - 价格配置对象
 * @returns 预估成本（美元）
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: PricingConfig
): number {
  // 实现代码
}
```

---

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 生成覆盖率报告
npm run test:coverage
```

### 测试要求

- **新增功能:** 必须包含测试
- **修改功能:** 更新相关测试
- **Bug 修复:** 添加回归测试
- **覆盖率目标:** > 60%

### 测试示例

```typescript
describe('FunctionName', () => {
  it('should do something', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });
});
```

---

## 📦 提交规范

### Commit Message 格式

```
<type>: <subject>

<body>

<footer>
```

### Type 类型

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具链相关

### 示例

```bash
# ✅ 好的提交
git commit -m "feat: 添加自定义颜色主题支持

- 允许用户通过配置文件自定义颜色
- 添加主题验证逻辑
- 更新文档

Closes #123"

# ❌ 不好的提交
git commit -m "update"
git commit -m "fix bugs"
```

---

## 🔀 Pull Request 流程

### 1. 分支命名

```bash
# 功能开发
feature/your-feature-name

# Bug 修复
fix/bug-description

# 文档更新
docs/update-documentation
```

### 2. 提交前检查

```bash
# 运行测试
npm test

# 构建项目
npm run build

# 检查代码风格（如果有配置）
npm run lint
```

### 3. 创建 PR

- 使用 PR 模板填写信息
- 关联相关 Issue（`Closes #123`）
- 等待 CI 检查通过
- 响应 Code Review 反馈

### 4. PR 标题规范

```
feat: 添加 XXX 功能
fix: 修复 XXX 问题
docs: 更新 XXX 文档
```

---

## 📂 项目结构

```
my-claude-hud/
├── src/                    # 源代码
│   ├── __tests__/          # 测试文件
│   ├── render/             # 渲染模块
│   ├── config.ts           # 配置加载
│   ├── transcript.ts       # 会话记录解析
│   └── index.ts            # 入口文件
├── scripts/                # 工具脚本
├── docs/                   # 文档
├── dist/                   # 编译输出（不提交）
└── package.json            # 项目配置
```

---

## 🐛 报告 Bug

使用 [Issue 模板](https://github.com/Link-Start/my-claude-hud/issues/new/choose) 报告问题，包含：

- 环境信息（OS、Node.js 版本）
- 复现步骤
- 预期行为 vs 实际行为
- 错误日志或截图

---

## 💡 功能建议

使用 [Feature Request 模板](https://github.com/Link-Start/my-claude-hud/issues/new/choose) 提建议：

- 清晰描述功能需求
- 说明使用场景
- 提供可能的解决方案

---

## 🌍 国际化

添加新翻译：

1. 编辑 `src/i18n.ts`
2. 添加语言对象
3. 在合适的地方使用 `t()` 函数

```typescript
// i18n.ts
export const translations = {
  '简体中文': {
    'New Term': '新术语'
  },
  'English': {
    'New Term': 'New Term'
  }
};
```

---

## 📄 许可证

提交贡献即表示你同意将代码以 [MIT License](LICENSE) 发布。

---

## 🤔 需要帮助？

- 查看 [FAQ](docs/FAQ.md)
- 在 [Discussions](https://github.com/Link-Start/my-claude-hud/discussions) 提问
- 创建 Issue 寻求帮助

---

## ⭐ 贡献者

感谢所有贡献者！你的名字会出现在 [Contributors](https://github.com/Link-Start/my-claude-hud/graphs/contributors) 列表中。

---

**再次感谢你的贡献！** 🎉
