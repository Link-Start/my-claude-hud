/**
 * My Claude HUD 类型定义 - 完整版
 * 参考并实现类似 claude-hud 的功能
 */

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
export interface ToolStatus {
  id: string;
  name: string;
  target?: string;
  state: 'running' | 'completed' | 'failed';
  startedAt: Date;
  finishedAt?: Date;
}

// Agent 执行状态
export interface AgentStatus {
  id: string;
  type: string;
  model?: string;
  description?: string;
  state: 'running' | 'completed';
  startedAt: Date;
  finishedAt?: Date;
}

// Todo 项状态
export interface TodoItem {
  text: string;
  status: 'pending' | 'in_progress' | 'done';
}

// 解析后的会话数据
export interface SessionData {
  tools: ToolStatus[];
  agents: AgentStatus[];
  todos: TodoItem[];
  sessionStart?: Date;
}

// Git 仓库状态
export interface GitInfo {
  branch: string;
  hasChanges: boolean;
  staged: number;
  unstaged: number;
  untracked: number;
  ahead?: number;
  behind?: number;
}

// API 使用情况
export interface ApiUsageData {
  planName: string | null;
  fiveHourPercent: number | null;
  sevenDayPercent: number | null;
  fiveHourResetAt: Date | null;
  sevenDayResetAt: Date | null;
  apiUnavailable?: boolean;
  apiError?: string;
}

// HUD 显示配置
export interface HudConfig {
  lineLayout: 'compact' | 'expanded';
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
    contextValue: 'percent' | 'tokens';
    showConfigCounts: boolean;
    showDuration: boolean;
    showSpeed: boolean;
    showTokenBreakdown: boolean;
    showUsage: boolean;
    usageBarEnabled: boolean;
    showTools: boolean;
    showAgents: boolean;
    showTodos: boolean;
    usageThreshold: number;
    sevenDayThreshold: number;
    environmentThreshold: number;
  };
}

// 配置文件统计
export interface ConfigCounts {
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
}

// 渲染上下文
export interface RenderContext {
  stdin: StdinInput;
  session: SessionData;
  git: GitInfo | null;
  usage: ApiUsageData | null;
  config: HudConfig;
  sessionDuration: string;
  configCounts: ConfigCounts;
  speed: number | null;
}
