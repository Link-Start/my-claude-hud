# 自定义翻译文件使用指南

My Claude HUD 支持用户自定义翻译文件，让你可以将插件翻译成任何语言，或修改默认的中文翻译。

## 快速开始

1. 复制示例翻译文件：
```bash
cp config.translations.example.json config.translations.json
```

2. 编辑 `config.translations.json` 文件

3. 在配置文件中添加翻译文件路径：
```json
{
  "i18n": {
    "customTranslationFile": "./config.translations.json"
  }
}
```

## 翻译文件格式

翻译文件使用 JSON 格式，包含以下部分：

```json
{
  "version": "1.0.0",
  "tools": {
    "工具名": "译文"
  },
  "agentTypes": {
    "agent类型": "译文"
  },
  "status": {
    "英文状态文本": "译文"
  },
  "toolGroups": {
    "工具分组名": "译文"
  }
}
```

## 详细说明

### tools - 工具名称翻译

翻译 Claude Code 中使用的工具名称：

```json
{
  "tools": {
    "Read": "读取",
    "Write": "写入",
    "Edit": "编辑",
    "Glob": "搜索文件",
    "Grep": "搜索内容",
    "Bash": "终端",
    "WebFetch": "获取网页",
    "WebSearch": "搜索网页",
    "Task": "代理任务"
  }
}
```

### agentTypes - Agent 类型翻译

翻译不同类型的 Agent：

```json
{
  "agentTypes": {
    "general-purpose": "通用助手",
    "explore": "探索助手",
    "plan": "规划助手",
    "bash": "命令助手",
    "claude-code-guide": "代码指南"
  }
}
```

### status - 状态文本翻译

翻译 HUD 中显示的各种状态文本：

```json
{
  "status": {
    "All todos complete": "所有任务已完成",
    "Context at": "上下文使用",
    "API limit reached": "API 已达限额",
    "API limit approaching": "API 即将达到限额",
    "session": "本次会话",
    "today": "今天",
    "messages remaining": "剩余消息数",
    "remaining": "剩余",
    "tokens": "令牌"
  }
}
```

### toolGroups - 工具分组翻译

翻译工具分组的显示名称：

```json
{
  "toolGroups": {
    "File ops": "文件操作",
    "Search": "搜索功能",
    "Shell": "终端命令",
    "Git": "版本控制",
    "Web": "网络请求",
    "Other": "其他"
  }
}
```

## 翻译文件路径

翻译文件路径支持两种格式：

1. **相对路径**：相对于项目根目录（`cwd`）
```json
{
  "i18n": {
    "customTranslationFile": "./config.translations.json"
  }
}
```

2. **绝对路径**：
```json
{
  "i18n": {
    "customTranslationFile": "/home/user/.claude/plugins/my-hud/custom-ja.json"
  }
}
```

## 项目特定翻译

你可以在项目目录中创建项目特定的翻译文件：

```json
{
  "i18n": {
    "customTranslationFile": ".claude-hud/translations.json"
  }
}
```

## 翻译合并规则

自定义翻译会与默认翻译合并：

1. 自定义翻译中的条目会覆盖默认翻译
2. 未指定的条目使用默认翻译
3. 你只需要包含想要修改的翻译

例如，如果只想修改 "Bash" 工具的显示：

```json
{
  "tools": {
    "Bash": "终端"
  }
}
```

其他所有工具仍会使用默认翻译。

## 多语言示例

### 日语示例 (config.translations.ja.json)

```json
{
  "version": "1.0.0",
  "tools": {
    "Read": "読み取り",
    "Write": "書き込み",
    "Edit": "編集",
    "Bash": "シェル"
  },
  "agentTypes": {
    "general-purpose": "汎用",
    "explore": "探索"
  },
  "status": {
    "All todos complete": "すべてのタスク完了",
    "API limit reached": "API制限に達しました"
  }
}
```

### 韩语示例 (config.translations.ko.json)

```json
{
  "version": "1.0.0",
  "tools": {
    "Read": "읽기",
    "Write": "쓰기",
    "Edit": "편집",
    "Bash": "터미널"
  },
  "status": {
    "All todos complete": "모든 작업 완료"
  }
}
```

### 法语示例 (config.translations.fr.json)

```json
{
  "version": "1.0.0",
  "tools": {
    "Read": "Lire",
    "Write": "Écrire",
    "Edit": "Modifier",
    "Bash": "Terminal"
  },
  "status": {
    "All todos complete": "Toutes les tâches terminées"
  }
}
```

## JSON Schema

项目提供了 JSON Schema 文件 `translation-schema.json`，可以用于验证翻译文件的格式和获得 IDE 自动补全：

```json
{
  "$schema": "./translation-schema.json",
  "version": "1.0.0",
  "tools": {
    // ...
  }
}
```

## 故障排除

### 翻译文件未生效

1. 确认翻译文件路径正确
2. 检查 JSON 格式是否正确（可以使用 `jq . config.translations.json` 验证）
3. 重新编译插件：`npm run build`

### 部分翻译未生效

1. 确认翻译键名拼写正确（区分大小写）
2. 检查是否在正确的分类下（如工具名应在 `tools` 下）

## 贡献翻译

如果你创建了新的语言翻译，欢迎提交 Pull Request 将其添加到项目！
