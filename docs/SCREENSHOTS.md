# 截图和演示

本文档说明如何添加功能截图和演示 GIF。

---

## 📸 功能截图

### 需要的截图

1. **紧凑模式显示**
   - 文件名: `compact-mode.png`
   - 内容: 单行状态栏，显示所有核心信息
   - 场景: 在终端中使用 Claude Code

2. **扩展模式显示**
   - 文件名: `expanded-mode.png`
   - 内容: 多行状态栏，详细显示各模块
   - 场景: 演示完整功能

3. **主题展示**
   - 文件名: `themes-showcase.png`
   - 内容: 并排显示多个主题
   - 或者: 每个主题单独截图

4. **配置示例**
   - 文件名: `config-example.png`
   - 内容: .claude-hud.json 配置文件

---

## 🎬 演示 GIF

### 录制工具推荐

**macOS:**
```bash
# 使用内置录制
brew install gifski

# 或使用第三方
brew install --cask kap
```

**Linux:**
```bash
# Simple Screen Recorder
sudo apt install simplescreenrecorder

# 或 Peek (GIF 专用)
sudo apt install peek
```

**跨平台:**
- [Loom](https://www.loom.com/) - 免费，简单易用
- [CleanShot X](https://cleanshot.com/) (macOS) - 强大但付费
- [Kap](https://getkap.co/) (macOS/Linux) - 开源免费

### 需要的 GIF

1. **快速演示 (15-30 秒)**
   - 文件名: `demo.gif`
   - 内容:
     - 显示 HUD 正常工作
     - 使用 `--action=toggle-layout` 切换布局
     - 显示工具使用
     - 显示 Agent 运行

2. **配置演示 (10-15 秒)**
   - 文件名: `config-demo.gif`
   - 内容:
     - 编辑 .claude-hud.json
     - 切换主题
     - 实时看到变化

3. **功能演示 (可选)**
   - 文件名: `features.gif`
   - 内容:
     - 查看统计信息
     - 清除缓存
     - 显示帮助

---

## 📝 添加到 README

### 截图部分

```markdown
## 📸 功能截图

### 紧凑模式
![紧凑模式](docs/images/compact-mode.png)

### 扩展模式
![扩展模式](docs/images/expanded-mode.png)

### 主题展示
![主题](docs/images/themes-showcase.png)
```

### 演示部分

```markdown
## 🎬 快速演示

![演示](docs/images/demo.gif)
```

---

## 🎨 截图最佳实践

### 通用建议

1. **使用深色终端背景**
   - 更好的对比度
   - 突出彩色信息

2. **显示真实场景**
   - 有活跃的工具使用
   - 有 Git 状态变化
   - 有 Agent 在运行

3. **保持简洁**
   - 不要包含敏感信息
   - 裁剪多余区域
   - 适当缩放（建议宽度 1200px）

### 录制 GIF 建议

1. **帧率**: 15-30 FPS
2. **尺寸**: 1200x600 或类似比例
3. **时长**: 15-30 秒（太大会影响加载）
4. **优化**: 使用 [gifski](https://github.com/ImageOptim/gifski) 压缩

---

## 📂 文件存放

```
my-claude-hud/
├── docs/
│   ├── images/
│   │   ├── compact-mode.png
│   │   ├── expanded-mode.png
│   │   ├── themes-showcase.png
│   │   ├── demo.gif
│   │   └── config-demo.gif
│   └── SCREENSHOTS.md  # 本文档
```

---

## 🔧 自动生成截图（高级）

可以使用 Playwright 或 Puppeteer 自动截图：

```typescript
// scripts/generate-screenshots.ts
import playwright from 'playwright';

async function generateScreenshots() {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  // 设置终端模拟页面
  await page.goto('file://path/to/demo.html');

  // 截图
  await page.screenshot({ path: 'docs/images/compact-mode.png' });

  await browser.close();
}

generateScreenshots();
```

---

## ✅ 检查清单

添加截图前确认：

- [ ] 截图清晰，无模糊
- [ ] 没有敏感信息（API Key、邮箱等）
- [ ] 文件大小合理（PNG < 500KB, GIF < 2MB）
- [ ] 文件命名清晰
- [ ] 已添加到 .gitignore（如果太大）

---

**准备完成后，将图片添加到仓库并更新 README！**

---

**创建日期:** 2025-02-09
**状态:** 📋 待添加截图
