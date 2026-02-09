/**
 * 自动压缩缓冲区百分比
 *
 * 注意：这个值（22.5% = 45k/200k）是基于社区观察得出的
 * Claude Code 自动压缩行为的经验值。这不是 Anthropic 官方
 * 记录的值，可能会在未来的 Claude Code 版本中发生变化。
 * 如果用户报告不匹配，可能需要调整这个值。
 */
export const AUTOCOMPACT_BUFFER_PERCENT = 0.225;
