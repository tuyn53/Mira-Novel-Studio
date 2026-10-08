import { describe, expect, it } from 'vitest'
import { CATEGORIES, CHANNELS, COLLAPSED_TAG_COUNT, TAG_GROUPS, categoryList, countInGroup, presetSummary, toggleTag, visibleTags } from './taxonomy'

const themeGroup = TAG_GROUPS.find(group => group.key === 'theme')!
const toneGroup = TAG_GROUPS.find(group => group.key === 'tone')!

describe('选题体系结构（全量转载番茄）', () => {
  it('每个频道都有分类，且分类不重复；男频/女频为番茄全量', () => {
    for (const channel of CHANNELS) {
      const list = categoryList(channel.key)
      expect(list.length).toBeGreaterThanOrEqual(6)
      expect(new Set(list).size).toBe(list.length)
    }
    expect(CATEGORIES.male.length).toBe(19)
    expect(CATEGORIES.female.length).toBe(21)
  })

  it('标签组限选按合并预算收敛（主题 ≤3 / 人设 ≤4 / 情节 ≤4 / 情感 ≤2）', () => {
    const limits = Object.fromEntries(TAG_GROUPS.map(group => [group.key, group.limit]))
    expect(limits).toEqual({ theme: 3, cast: 4, plot: 4, tone: 2 })
  })

  it('全量标签库量级与跨组唯一性', () => {
    const all = TAG_GROUPS.flatMap(group => group.tags)
    expect(all.length).toBeGreaterThan(400)
    // 跨组去重：每个标签只属于一个组
    expect(new Set(all).size).toBe(all.length)
    // 抽样确认全量标签就位
    expect(themeGroup.tags).toContain('克苏鲁')
    expect(themeGroup.tags).toContain('四合院')
    expect(toneGroup.tags).toContain('先婚后爱')
  })
})

describe('toggleTag（限选逻辑）', () => {
  it('选中与取消', () => {
    expect(toggleTag([], themeGroup, '古代')).toEqual(['古代'])
    expect(toggleTag(['古代'], themeGroup, '古代')).toEqual([])
  })

  it('组内达到上限后忽略新增，其他组不受影响', () => {
    const selected = ['暗恋', '救赎'] // 情感组 2/2
    expect(countInGroup(selected, toneGroup)).toBe(2)
    expect(toggleTag(selected, toneGroup, '青梅竹马')).toEqual(selected)
    expect(toggleTag(selected, themeGroup, '古代')).toEqual(['暗恋', '救赎', '古代'])
  })

  it('达到上限后仍可取消已选项腾出位置', () => {
    const selected = ['暗恋', '救赎']
    const freed = toggleTag(selected, toneGroup, '暗恋')
    expect(freed).toEqual(['救赎'])
    expect(toggleTag(freed, toneGroup, '青梅竹马')).toEqual(['救赎', '青梅竹马'])
  })

  it('不属于该组的标签被忽略', () => {
    expect(toggleTag([], toneGroup, '古代')).toEqual([])
  })

  it('不改动传入数组（纯函数）', () => {
    const original = ['古代']
    toggleTag(original, themeGroup, '都市')
    expect(original).toEqual(['古代'])
  })
})

describe('visibleTags（折叠 / 展开 / 搜索）', () => {
  it('折叠态：已选置顶 + 前 N 个未选项', () => {
    const selected = ['克苏鲁'] // 在 theme 组较靠后
    const list = visibleTags(themeGroup, selected, { expanded: false, query: '' })
    expect(list[0]).toBe('克苏鲁')
    expect(list.length).toBeLessThanOrEqual(COLLAPSED_TAG_COUNT)
    expect(list).not.toContain('末世冰封') // 全量最后一个，不折叠时不可见
  })

  it('展开态返回全量', () => {
    const list = visibleTags(themeGroup, [], { expanded: true, query: '' })
    expect(list.length).toBe(themeGroup.tags.length)
  })

  it('搜索按包含匹配过滤，忽略折叠', () => {
    const list = visibleTags(themeGroup, [], { expanded: false, query: '穿' })
    expect(list).toContain('穿书')
    expect(list).toContain('穿剧')
    expect(list.every(tag => tag.includes('穿'))).toBe(true)
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
