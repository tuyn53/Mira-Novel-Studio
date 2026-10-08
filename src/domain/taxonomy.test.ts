import { describe, expect, it } from 'vitest'
import { CATEGORIES, CHANNELS, TAG_GROUPS, categoryList, countInGroup, presetSummary, toggleTag } from './taxonomy'

const themeGroup = TAG_GROUPS.find(group => group.key === 'theme')!
const plotGroup = TAG_GROUPS.find(group => group.key === 'plot')!

describe('选题体系结构', () => {
  it('每个频道都有分类，且分类不重复', () => {
    for (const channel of CHANNELS) {
      const list = categoryList(channel.key)
      expect(list.length).toBeGreaterThanOrEqual(6)
      expect(new Set(list).size).toBe(list.length)
    }
  })

  it('标签组限选符合设计（主题 ≤3 / 人设 ≤2 / 情节 ≤2 / 情感 ≤2），标签全局不重复', () => {
    const limits = Object.fromEntries(TAG_GROUPS.map(group => [group.key, group.limit]))
    expect(limits).toEqual({ theme: 3, cast: 2, plot: 2, tone: 2 })
    const all = TAG_GROUPS.flatMap(group => group.tags)
    expect(new Set(all).size).toBe(all.length)
  })

  it('通用频道分类覆盖规则怪谈与无限流（对标番茄世界观标签）', () => {
    expect(CATEGORIES.general).toContain('规则怪谈')
    expect(CATEGORIES.general).toContain('无限流')
  })
})

describe('toggleTag（限选逻辑）', () => {
  it('选中与取消', () => {
    expect(toggleTag([], themeGroup, '古代')).toEqual(['古代'])
    expect(toggleTag(['古代'], themeGroup, '古代')).toEqual([])
  })

  it('组内达到上限后忽略新增，其他组不受影响', () => {
    const selected = ['系统', '重生'] // 情节组 2/2
    expect(countInGroup(selected, plotGroup)).toBe(2)
    expect(toggleTag(selected, plotGroup, '马甲')).toEqual(selected)
    // 主题组仍可加
    expect(toggleTag(selected, themeGroup, '古代')).toEqual(['系统', '重生', '古代'])
  })

  it('达到上限后仍可取消已选项腾出位置', () => {
    const selected = ['系统', '重生']
    const freed = toggleTag(selected, plotGroup, '系统')
    expect(freed).toEqual(['重生'])
    expect(toggleTag(freed, plotGroup, '马甲')).toEqual(['重生', '马甲'])
  })

  it('不属于该组的标签被忽略', () => {
    expect(toggleTag([], plotGroup, '古代')).toEqual([])
  })

  it('不改动传入数组（纯函数）', () => {
    const original = ['古代']
    toggleTag(original, themeGroup, '都市')
    expect(original).toEqual(['古代'])
  })
})

describe('presetSummary（标签驱动生成预设）', () => {
  it('随标签数量增长，命中标签给出高亮预设', () => {
    const summary = presetSummary(['系统', '追妻火葬场', '古代'])
    expect(summary.entityPresets).toBe(8 + 3 * 2)
    expect(summary.promptPacks).toBe(4 + 3)
    expect(summary.highlights).toContain('系统面板概念卡')
    expect(summary.highlights).toContain('节奏协议（误会→决裂→追悔→挽回）')
  })

  it('无标签时只有分类基础预设', () => {
    const summary = presetSummary([])
    expect(summary.entityPresets).toBe(8)
    expect(summary.highlights).toEqual([])
  })
})
