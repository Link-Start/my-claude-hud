/**
 * 多语言翻译支持
 * 将英文工具名、Agent 类型等翻译为中文
 * 支持用户自定义翻译文件
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DisplayLanguage, TranslationFile } from './types.js';

// === 默认翻译（中文） ===

/**
 * 工具名称翻译
 */
const DEFAULT_TOOL_TRANSLATIONS: Record<string, string> = {
  // 文件操作
  'Read': '读取',
  'Write': '写入',
  'Edit': '编辑',
  'Glob': '搜索文件',
  'GlobFiles': '搜索文件',

  // 搜索
  'Grep': '搜索内容',
  'Search': '搜索',

  // 命令执行
  'Bash': '命令',
  'Shell': 'Shell',
  'Execute': '执行',
  'RunCommand': '运行命令',

  // Git 操作
  'Git': 'Git',
  'GitCheckout': 'Git切换',
  'GitCommit': 'Git提交',

  // 网络请求
  'WebFetch': '获取网页',
  'WebSearch': '搜索网页',
  'HttpRequest': 'HTTP请求',

  // Claude 特有
  'Task': '任务',
  'TaskCreate': '创建任务',
  'TaskUpdate': '更新任务',
  'TodoWrite': '写入待办',
  'AskUserQuestion': '询问用户',

  // 其他
  'ExitPlanMode': '退出计划',
};

/**
 * Agent 类型翻译
 */
const DEFAULT_AGENT_TYPE_TRANSLATIONS: Record<string, string> = {
  'general-purpose': '通用',
  'explore': '探索',
  'plan': '规划',
  'statusline-setup': '状态栏设置',
  'bash': '命令执行',
  'claude-code-guide': '代码指南',
};

/**
 * 状态文本翻译
 */
const DEFAULT_STATUS_TRANSLATIONS: Record<string, string> = {
  'All todos complete': '所有待办已完成',
  'Context at': '上下文',
  'API limit reached': 'API 限制已达到',
  'API limit approaching': 'API 限制接近',
  'session': '会话',
  'today': '今天',
  'messages remaining': '剩余消息',
  'remaining': '剩余',
  'tokens': '令牌',
};

/**
 * 工具分组翻译
 */
const DEFAULT_TOOL_GROUP_TRANSLATIONS: Record<string, string> = {
  'File ops': '文件操作',
  'Search': '搜索',
  'Shell': '命令',
  'Git': 'Git',
  'Web': '网络',
  'Other': '其他',
};

// === 自定义翻译加载 ===

/**
 * 用户自定义翻译（运行时加载）
 */
let customTranslations: TranslationFile | null = null;

/**
 * 加载用户自定义翻译文件
 * @param translationFilePath 翻译文件路径（绝对路径或相对于 cwd 的路径）
 * @param cwd 当前工作目录（用于解析相对路径）
 * @returns 解析后的翻译对象，失败返回 null
 */
export function loadCustomTranslations(
  translationFilePath: string,
  cwd?: string
): TranslationFile | null {
  try {
    // 解析文件路径
    let filePath = translationFilePath;
    if (cwd && !path.isAbsolute(filePath)) {
      filePath = path.resolve(cwd, filePath);
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.warn(`[i18n] 翻译文件不存在: ${filePath}`);
      return null;
    }

    // 读取并解析 JSON
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations: TranslationFile = JSON.parse(content);

    // 验证版本（如果指定）
    if (translations.version && typeof translations.version !== 'string') {
      console.warn(`[i18n] 翻译文件版本格式错误`);
      return null;
    }

    // 存储到全局变量
    customTranslations = translations;

    return translations;
  } catch (error) {
    console.warn(`[i18n] 加载翻译文件失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * 清除自定义翻译（用于测试或重新加载）
 */
export function clearCustomTranslations(): void {
  customTranslations = null;
}

/**
 * 获取合并后的翻译映射
 * @param defaults 默认翻译
 * @param customKey 自定义翻译键名
 */
function getMergedTranslations(
  defaults: Record<string, string>,
  customKey: keyof TranslationFile
): Record<string, string> {
  if (!customTranslations || !customTranslations[customKey]) {
    return defaults;
  }

  const custom = customTranslations[customKey] as Record<string, string>;
  return { ...defaults, ...custom };
}

// === 翻译函数 ===

/**
 * 翻译工具名称
 */
export function translateToolName(name: string, lang: DisplayLanguage): string {
  if (lang === 'en') return name;

  const translations = getMergedTranslations(DEFAULT_TOOL_TRANSLATIONS, 'tools');
  return translations[name] ?? name;
}

/**
 * 翻译 Agent 类型
 */
export function translateAgentType(type: string, lang: DisplayLanguage): string {
  if (lang === 'en') return type;

  const translations = getMergedTranslations(DEFAULT_AGENT_TYPE_TRANSLATIONS, 'agentTypes');
  return translations[type] ?? type;
}

/**
 * 翻译工具分组
 */
export function translateToolGroup(group: string, lang: DisplayLanguage): string {
  if (lang === 'en') return group;

  const translations = getMergedTranslations(DEFAULT_TOOL_GROUP_TRANSLATIONS, 'toolGroups');
  return translations[group] ?? group;
}

/**
 * 翻译状态文本
 */
export function translateStatusText(text: string, lang: DisplayLanguage): string {
  if (lang === 'en') return text;

  const translations = getMergedTranslations(DEFAULT_STATUS_TRANSLATIONS, 'status');

  // 尝试完全匹配
  if (translations[text]) {
    return translations[text];
  }

  // 尝试部分匹配（用于带数字的文本）
  for (const [key, value] of Object.entries(translations)) {
    if (text.includes(key)) {
      return text.replace(key, value);
    }
  }

  return text;
}

/**
 * 格式化数字（根据语言使用不同的千位分隔符）
 */
export function formatNumber(num: number, lang: DisplayLanguage): string {
  if (lang === 'zh') {
    return num.toLocaleString('zh-CN');
  }
  return num.toLocaleString('en-US');
}

/**
 * 获取当前加载的自定义翻译（用于调试）
 */
export function getCustomTranslations(): TranslationFile | null {
  return customTranslations;
}

/**
 * 导出默认翻译（用于生成示例文件）
 */
export function getDefaultTranslations(): TranslationFile {
  return {
    version: '1.0.0',
    tools: { ...DEFAULT_TOOL_TRANSLATIONS },
    agentTypes: { ...DEFAULT_AGENT_TYPE_TRANSLATIONS },
    status: { ...DEFAULT_STATUS_TRANSLATIONS },
    toolGroups: { ...DEFAULT_TOOL_GROUP_TRANSLATIONS },
  };
}
