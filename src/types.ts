/**
 * My Claude HUD 类型定义 - 完整版
 * 参考并实现类似 claude-hud 的功能
 */

// 类型定义
export type LineLayoutType = 'compact' | 'expanded' | 'multiline';
export type AutocompactBufferMode = 'enabled' | 'disabled';
export type ContextValueMode = 'percent' | 'tokens' | 'remaining';
export type DisplayLanguage = 'zh' | 'en';
export type ToolDetailLevel = 'compact' | 'semantic' | 'directory';
export type MemoryInsightsPosition = 'before' | 'after' | 'inline';
export type SessionLevel = 'normal' | 'busy' | 'warning' | 'critical';

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
  sessionName?: string;
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
  diverged: boolean;  // 同时 ahead 和 behind (分叉状态)
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
    // 工具统计详细程度
    toolDetailLevel?: ToolDetailLevel;
    // 项目记忆显示
    showMemoryInsights?: boolean;
    memoryInsightsPosition?: MemoryInsightsPosition;
    // 智能显示模式
    smartDisplay?: boolean;
    // Session Name 显示
    showSessionName?: boolean;
    // 性能监控显示
    showPerformance?: boolean;
    // 推理努力显示
    showReasoningEffort?: boolean;
    // 思考时间显示
    showThinkTime?: boolean;
    // Ralph Wiggum 循环状态显示
    showRalphLoop?: boolean;
    // 分隔符样式 (default: 无分隔符, powerline: _powerline 风格, arrow: 箭头风格)
    separatorStyle?: 'default' | 'powerline' | 'arrow';
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
  canaryTest?: {
    // 金丝雀测试配置
    enabled?: boolean;
    autoCreate?: boolean;
    checkInterval?: number;
    showInCompact?: boolean;
    showInExpanded?: boolean;
    // 增强功能配置
    testMode?: CanaryTestMode;
    enableHistory?: boolean;
    enableAlerts?: boolean;
    alertOnLost?: boolean;
    alertOnFrequentLost?: boolean;
    frequentLostThreshold?: number;
    alertOnLongLost?: boolean;
    longLostThreshold?: number;
    enableAutoRecovery?: boolean;
    autoRecoveryThreshold?: number;
    enableStats?: boolean;
    enableReport?: boolean;
  };
  memory?: {
    // 项目记忆配置
    enabled?: boolean;
    maxProjects?: number;
    maxFilesPerProject?: number;
    trackingEnabled?: boolean;
  };
  cache?: {
    // 缓存配置
    git?: {
      ttlMs?: number;
      maxRepositories?: number;
    };
    api?: {
      ttlMs?: number;
      failureTtlMs?: number;
      keychainBackoffMs?: number;
    };
    speed?: {
      ttlMs?: number;
      updateIntervalMs?: number;
    };
  };
  update?: {
    // 更新检查配置
    enabled?: boolean;
    checkInterval?: number;
  };
}

// 配置文件统计
export interface ConfigCounts {
  claudeMdCount: number;
  rulesCount: number;
  mcpCount: number;
  hooksCount: number;
}

/**
 * 金丝雀测试状态
 */
export type CanaryStatus = 'none' | 'prompt' | 'active' | 'lost';

/**
 * 金丝雀测试数据
 */
export interface CanaryData {
  status: CanaryStatus;
  timestamp?: Date;
  canaryId?: string;
  source?: 'project' | 'global'; // 金丝雀来源
}

/**
 * 会话状态
 */
export interface SessionState {
  level: SessionLevel;
  triggers: string[];
  recommendations: string[];
}

/**
 * 异常检测
 */
export interface Anomaly {
  type: 'consecutive_failures' | 'context_spike' | 'slow_output' | 'timeout';
  count?: number;
  tool?: string;
  duration?: number;
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
  canaryData?: CanaryData; // 金丝雀测试数据
}

// === 金丝雀测试增强功能类型 ===

/**
 * 金丝雀测试模式
 */
export type CanaryTestMode = 'light' | 'medium' | 'heavy';

/**
 * 金丝雀历史记录条目
 */
export interface CanaryHistoryEntry {
  id: string;
  timestamp: Date;
  status: CanaryStatus;
  canaryId?: string;
  source?: 'project' | 'global';
  duration?: number; // 持续时间（毫秒）
  projectDir?: string;
}

/**
 * 金丝雀统计信息
 */
export interface CanaryStats {
  totalChecks: number;
  activeCount: number;
  lostCount: number;
  lossRate: number; // 丢失率（百分比）
  avgDuration: number; // 平均持续时间（毫秒）
  totalLostTime: number; // 总丢失时间（毫秒）
  longestLostDuration: number; // 最长丢失持续时间（毫秒）
  lastActiveTime?: Date;
  lastLostTime?: Date;
  successRate: number; // 成功率（百分比）
}

/**
 * 金丝雀告警类型
 */
export type CanaryAlertType = 'lost' | 'frequent_lost' | 'long_lost' | 'recovery';

/**
 * 金丝雀告警配置
 */
export interface CanaryAlertConfig {
  enabled: boolean;
  alertOnLost: boolean;
  alertOnFrequentLost: boolean;
  frequentLostThreshold: number; // 频繁丢失阈值（次数）
  alertOnLongLost: boolean;
  longLostThreshold: number; // 长时间丢失阈值（毫秒）
  alertOnRecovery: boolean;
  alertMethods: ('terminal' | 'log')[];
}

/**
 * 金丝雀告警
 */
export interface CanaryAlert {
  id: string;
  timestamp: Date;
  type: CanaryAlertType;
  canaryId?: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 金丝雀模板类型
 */
export type CanaryTemplateType = 'default' | 'minimal' | 'detailed' | 'custom';

/**
 * 金丝雀模板
 */
export interface CanaryTemplate {
  id: string;
  name: string;
  description: string;
  type: CanaryTemplateType;
  testMode: CanaryTestMode;
  content: string;
  created: Date;
  modified: Date;
}

/**
 * 金丝雀自动恢复配置
 */
export interface CanaryAutoRecoveryConfig {
  enabled: boolean;
  autoRecreate: boolean;
  autoRestoreThreshold: number; // 自动恢复阈值（丢失次数）
  maxRecoveryAttempts: number; // 最大恢复尝试次数
  recoveryStrategy: 'immediate' | 'delayed' | 'manual';
  recoveryDelay: number; // 恢复延迟（毫秒）
}

/**
 * 金丝雀报告配置
 */
export interface CanaryReportConfig {
  enabled: boolean;
  format: 'json' | 'markdown' | 'both';
  includeHistory: boolean;
  includeStats: boolean;
  includeAlerts: boolean;
  maxHistoryEntries: number;
  reportInterval: number; // 报告生成间隔（毫秒）
}

/**
 * 金丝雀报告
 */
export interface CanaryReport {
  generated: Date;
  projectDir: string;
  canaryId?: string;
  status: CanaryStatus;
  history: CanaryHistoryEntry[];
  stats: CanaryStats;
  alerts: CanaryAlert[];
  config: {
    history: boolean;
    stats: boolean;
    alerts: boolean;
  };
}
