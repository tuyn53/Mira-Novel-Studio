import { describe, expect, it } from 'vitest'
import { buildHeatmap, compareToNovel, computeStreak, heatLevel, toDateKey } from './stats'
import type { DailyWords } from '@/platform'

function days(...entries: Array<[string, number]>): DailyWords[] {
  return entries.map(([date, words]) => ({ date, words }))
}

describe('buildHeatmap', () => {
  const today = new Date(2026, 9, 9) // 2026-10-09 周五

  it('产出 weeks 列 × 7 行的网格，最后一列含今天', () => {
    const grid = buildHeatmap([], 15, today)
    expect(grid).toHaveLength(15)
    expect(grid.every(column => column.length === 7)).toBe(true)
    const lastColumn = grid[14]
    expect(lastColumn.some(day => day.date === '2026-10-09')).toBe(true)
  })

  it('今天之后的格子标记为占位，历史格子按日期填充字数', () => {
    const grid = buildHeatmap(days(['2026-10-08', 1200], ['2026-10-09', 800]), 15, today)
    const flat = grid.flat()
    expect(flat.find(day => day.date === '2026-10-08')?.words).toBe(1200)
    expect(flat.find(day => day.date === '2026-10-09')?.words).toBe(800)
    expect(flat.filter(day => day.placeholder).every(day => day.words === 0)).toBe(true)
  })

  it('窗口起点为 14 周前的周日（列对齐）', () => {
    const grid = buildHeatmap([], 3, today)
    // 2026-10-09 是周五 → 本周周日 2026-10-04，往前两周日 = 2026-09-20
    expect(grid[0][0].date).toBe('2026-09-20')
    expect(grid[2][0].date).toBe('2026-10-04')
  })
})

describe('heatLevel', () => {
  it('零为 0 级，按最大值四档分层', () => {
    expect(heatLevel(0, 4000)).toBe(0)
    expect(heatLevel(1000, 4000)).toBe(1)
    expect(heatLevel(2000, 4000)).toBe(2)
    expect(heatLevel(3000, 4000)).toBe(3)
    expect(heatLevel(4000, 4000)).toBe(4)
  })

  it('有字数但最大值为 0 时至少 1 级', () => {
    expect(heatLevel(500, 0)).toBe(1)
  })
})

describe('computeStreak', () => {
  const today = new Date(2026, 9, 9)

  it('今天写了则从今天连续回数', () => {
    const streak = computeStreak(days(['2026-10-09', 100], ['2026-10-08', 100], ['2026-10-07', 100], ['2026-10-06', 0]), today)
    expect(streak).toBe(3)
  })

  it('今天没写但昨天写了，连续天数从昨天算（今天不算断）', () => {
    const streak = computeStreak(days(['2026-10-08', 100], ['2026-10-07', 100]), today)
    expect(streak).toBe(2)
  })

  it('昨天与今天都空则连续为 0', () => {
    expect(computeStreak(days(['2026-10-06', 100]), today)).toBe(0)
  })
})

describe('compareToNovel', () => {
  it('按《活着》12.6 万字换算倍数与差额', () => {
    const half = compareToNovel(63_000)
    expect(half.times).toBeCloseTo(0.5, 5)
    expect(half.remaining).toBe(63_000)
    const double = compareToNovel(252_000)
    expect(double.times).toBeCloseTo(2, 5)
    expect(double.remaining).toBe(0)
  })
})

describe('toDateKey', () => {
  it('本地日期格式化为 YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
