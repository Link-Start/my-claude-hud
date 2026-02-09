/**
 * My Claude HUD 类型定义 - 完整版
 * 参考并实现类似 claude-hud 的功能
 */

// 类型定义
export type LineLayoutType = 'compact' | 'expanded';
export type AutocompactBufferMode = 'enabled' | 'disabled';
export type ContextValueMode = 'percent' | 'tokens';
export type DisplayLanguage = 'zh' | 'en';

// 从 Claude Code 通过 stdin 接收的数据
export interface StdinInput {
  transcript_path?: string;
  cwd?: string;
  model?: {
    id?: string;
    display_name?: string;
  };
  context_window?: {
    context_window_size?: number;
    current_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    } | null;
    used_percentage?: number | null;
    remaining_percentage?: number | null;
  };
}

// 工具执行状态
export interface ToolEntry {
  id: string;
  name: string;
  target?: string;
  status: 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;  // 执行时长（毫秒）
}

// Agent 执行状态
export interface AgentEntry {
  id: string;
  type: string;
  model?: string;
  description?: string;
  status: 'running' | 'completed';
  startTime: Date;
  endTime?: Date;
}

// Todo 项状态
export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// 解析后的会话数据
export interface TranscriptData {
  tools: ToolEntry[];
  agents: AgentEntry[];
  todos: TodoItem[];
  sessionStart?: Date;
}

// Git 文件统计
export interface FileStats {
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
}

// Git 仓库状态
export interface GitInfo {
  branch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  fileStats?: FileStats;
}

// API 使用情况
export interface UsageData {
  planName: string | null; // 'Max', 'Pro', 'Team' 或 null
  fiveHour: number | null;
  sevenDay: number | null;
  fiveHourResetAt: Date | null;
  sevenDayResetAt: Date | null;
  apiUnavailable?: boolean;
  apiError?: string;
}

/**
 * 检查使用限制是否已达到（任一窗口达到 100%）
 */
export function isLimitReached(data: UsageData): boolean {
  return data.fiveHour === 100 || data.sevenDay === 100;
}

// HUD 显示配置
export interface HudConfig {
  lineLayout: LineLayoutType;
  showSeparators: boolean;
  pathLevels: 1 | 2 | 3;
  gitStatus: {
    enabled: boolean;
    showDirty: boolean;
    showAheadBehind: boolean;
    showFileStats: boolean;
  };
  display: {
    showModel: boolean;
    showContextBar: boolean;
    contextValue: ContextValueMode;
    showConfigCounts: boolean;
    showDuration: boolean;
    showSpeed: boolean;
    showTokenBreakdown: boolean;
    showUsage: boolean;
    usageBarEnabled: boolean;
    showTools: boolean;
    showAgents: boolean;
    showTodos: boolean;
    showCost: boolean;
    autocompactBuffer: AutocompactBufferMode;
    usageThreshold: number;
    sevenDayThreshold: number;
    environmentThreshold: number;
    displayLanguage: DisplayLanguage;
  };
  alerts: {
    enabled: boolean;
    contextWarning: number;
    contextCritical: number;
    apiLimitWarning: number;
  };
  theme: {
    colorTheme: string;
    customColors?: Record<string, string>;
  };
  i18n?: {
    // 自定义翻译文件路径（支持绝对路径或相对于 cwd 的路径）
    customTranslationFile?: string;
  };
}

// 配置文件统计
export interface ConfigCounts {
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
}

// 翻译文件结构
export interface TranslationFile {
  version?: string; // 翻译文件版本，用于未来兼容性
  tools?: Record<string, string>;
  agentTypes?: Record<string, string>;
  status?: Record<string, string>;
  toolGroups?: Record<string, string>;
}

// 渲染上下文
export interface RenderContext {
  stdin: StdinInput;
  transcript: TranscriptData;
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
  sessionDuration: string;
  gitStatus: GitInfo | null;
  usageData: UsageData | null;
  config: HudConfig;
  extraLabel: string | null;
}
