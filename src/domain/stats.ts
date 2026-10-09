// ============================================================
// 工作区统计 —— 首页活动总览的数据整形（纯函数，vitest 覆盖）
// 数据来源契约见 platform/types.ts WorkspaceStats（宿主按写作活动日志统计，Mock 为演示数据）。
// ============================================================

import type { DailyWords } from '@/platform'

export interface HeatmapDay extends DailyWords {
  /** 是否为今天之后的占位格（用于对齐周列，不计入渲染文案） */
  placeholder?: boolean
}

/**
 * 构建 Claude 式活动热力图：以「周」为列、日为行，窗口为最近 weeks 周（含本周）。
 * 列内从上到下为周日→周六；未来日期用占位格补齐最后一列。
 */
export function buildHeatmap(daily: DailyWords[], weeks = 15, today = new Date()): HeatmapDay[][] {
  const byDate = new Map(daily.map(item => [item.date, item.words]))
  const dayMs = 86_400_000
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // 最后一列的周日：end 所在周的周日
  const lastSunday = new Date(end.getTime() - end.getDay() * dayMs)
  // 起始列的周日
  const firstSunday = new Date(lastSunday.getTime() - (weeks - 1) * 7 * dayMs)

  const columns: HeatmapDay[][] = []
  for (let w = 0; w < weeks; w++) {
    const column: HeatmapDay[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(firstSunday.getTime() + (w * 7 + d) * dayMs)
      const key = toDateKey(date)
      const future = date.getTime() > end.getTime()
      column.push({ date: key, words: future ? 0 : (byDate.get(key) ?? 0), placeholder: future })
    }
    columns.push(column)
  }
  return columns
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** 按当日字数取热力等级 0-4（相对窗口内最大值分档） */
export function heatLevel(words: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (words <= 0) return 0
  if (max <= 0) return 1
  const ratio = words / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/** 对比一部参照小说（《活着》约 12.6 万字）：倍数或还差多少字 */
const REFERENCE_NOVEL_WORDS = 126_000

export function compareToNovel(totalWords: number): { times: number; remaining: number } {
  return {
    times: totalWords / REFERENCE_NOVEL_WORDS,
    remaining: Math.max(0, REFERENCE_NOVEL_WORDS - totalWords),
  }
}

/** 连续写作天数：从今天（或昨天）往回数连续有产出的天数 */
export function computeStreak(daily: DailyWords[], today = new Date()): number {
  const byDate = new Map(daily.map(item => [item.date, item.words]))
  const dayMs = 86_400_000
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // 今天还没写不算断
  if ((byDate.get(toDateKey(cursor)) ?? 0) <= 0) {
    cursor = new Date(cursor.getTime() - dayMs)
  }
  let streak = 0
  while ((byDate.get(toDateKey(cursor)) ?? 0) > 0) {
    streak++
    cursor = new Date(cursor.getTime() - dayMs)
  }
  return streak
}
