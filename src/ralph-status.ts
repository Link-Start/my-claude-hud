/**
 * Ralph Wiggum 状态读取模块
 * 读取 Ralph Wiggum 插件的循环状态文件
 */

import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

/**
 * Ralph Wiggum 状态数据
 */
export interface RalphStatus {
  /** 当前迭代次数 */
  iteration: number;
  /** 最大迭代次数 */
  maxIterations: number;
  /** 开始时间 */
  startTime: number;
  /** 当前任务描述 */
  currentTask: string;
  /** 状态: running, paused, completed */
  status: 'running' | 'paused' | 'completed';
}

/**
 * Ralph Wiggum 状态读取结果
 */
export interface RalphStatusResult {
  iteration: number;
  maxIterations: number;
  elapsedSeconds: number;
  currentTask: string;
  status: 'running' | 'paused' | 'completed';
  progressPercent: number;
}

/**
 * Ralph 状态文件路径
 */
function getRalphStatePath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.ralph', 'ralph-loop.state.json');
}

/**
 * 检查 Ralph Wiggum 是否已安装
 * @returns true 如果状态文件存在
 */
export function isRalphInstalled(): boolean {
  try {
    const statePath = getRalphStatePath();
    return fs.existsSync(statePath);
  } catch {
    return false;
  }
}

/**
 * 读取 Ralph Wiggum 当前状态
 * @returns 状态结果，如果 Ralph 未安装或读取失败返回 null
 */
export function getRalphStatus(): RalphStatusResult | null {
  try {
    const statePath = getRalphStatePath();

    if (!fs.existsSync(statePath)) {
      return null;
    }

    const content = fs.readFileSync(statePath, 'utf-8');
    const data: RalphStatus = JSON.parse(content);

    // 计算已运行时间
    const elapsedSeconds = data.startTime
      ? Math.floor((Date.now() - data.startTime) / 1000)
      : 0;

    // 计算进度百分比
    const progressPercent = data.maxIterations > 0
      ? Math.round((data.iteration / data.maxIterations) * 100)
      : 0;

    return {
      iteration: data.iteration || 0,
      maxIterations: data.maxIterations || 0,
      elapsedSeconds,
      currentTask: data.currentTask || '',
      status: data.status || 'running',
      progressPercent,
    };
  } catch {
    return null;
  }
}

/**
 * 格式化运行时间
 * @param seconds 秒数
 * @returns 格式化的时间字符串，如 "5m 23s"
 */
function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * 渲染 Ralph Wiggum 状态行
 * @param status Ralph 状态
 * @returns 格式化的状态字符串
 */
export function renderRalphStatusLine(status: RalphStatusResult): string {
  const timeStr = formatElapsedTime(status.elapsedSeconds);
  const task = status.currentTask.length > 30
    ? status.currentTask.substring(0, 30) + '...'
    : status.currentTask;

  const icon = status.status === 'completed' ? '✅' : '🔄';

  return `${icon} Ralph: ${status.iteration}/${status.maxIterations} | ${timeStr}${task ? ` | ${task}` : ''}`;
}
