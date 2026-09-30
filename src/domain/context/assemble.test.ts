import { describe, expect, it } from 'vitest'
import { assembleContext, buildLayersForScene, estimateTokens, type ContextLayer } from './assemble'
import type { NovelProjectDocumentV2 } from '../model'

function layer(key: string, priority: number, content: string, fixed = false): ContextLayer {
  return { key, label: key, priority, content, fixed }
}

describe('estimateTokens', () => {
  it('CJK 字符逐字计数', () => {
    expect(estimateTokens('雨是从子夜开始下的')).toBe(9)
  })

  it('英文按词计数并保留余量', () => {
    expect(estimateTokens('the quick brown fox')).toBe(5) // 4 词 × 1.3 ≈ 5.2 → 5
  })

  it('中英混排分别计数', () => {
    // 4 个汉字 + 1 个英文词 ≈ 4 + 1.3 → 5
    expect(estimateTokens('铜灯的 seventh 火')).toBe(5)
  })
})

describe('assembleContext', () => {
  it('预算充足时全量装填', () => {
    const ctx = assembleContext([layer('a', 2, '短内容'), layer('b', 1, '高优先')], 1000)
    expect(ctx.layers.map(l => l.trimmed)).toEqual([false, false])
    expect(ctx.usedTokens).toBeGreaterThan(0)
  })

  it('预算不足时从低优先级开始裁剪', () => {
    const ctx = assembleContext(
      [
        layer('spec', 1, '规范', true),
        layer('outline', 4, '细纲'.repeat(50)),
        layer('tail', 5, '结尾'.repeat(400)),
      ],
      600,
    )
    const byKey = Object.fromEntries(ctx.layers.map(l => [l.key, l]))
    expect(byKey.spec.trimmed).toBe(false) // 固定层永不裁剪
    expect(byKey.outline.trimmed).toBe(false)
    expect(byKey.tail.trimmed).toBe(true)
    expect(byKey.tail.content).toBe('')
  })

  it('装不下的层被跳过后，更小的后续层仍可入账', () => {
    const big = layer('big', 2, '啊'.repeat(500))
    const small = layer('small', 3, '小')
    const ctx = assembleContext([big, small], 400)
    const byKey = Object.fromEntries(ctx.layers.map(l => [l.key, l]))
    expect(byKey.big.trimmed).toBe(true)
    expect(byKey.small.trimmed).toBe(false)
  })

  it('按优先级升序排列输出', () => {
    const ctx = assembleContext([layer('c', 3, 'x'), layer('a', 1, 'y'), layer('b', 2, 'z')], 1000)
    expect(ctx.layers.map(l => l.key)).toEqual(['a', 'b', 'c'])
  })
})

describe('buildLayersForScene', () => {
  const project: NovelProjectDocumentV2 = {
    version: 2,
    id: 'p1',
    title: '提灯照河山',
    createdAt: 0,
    updatedAt: 0,
    meta: { genre: '东方玄幻', coreIdea: '提灯人查前六任死因', pov: '第三人称限知', targetLength: '60 万字' },
    volumes: [
      {
        id: 'v1',
        title: '卷一',
        sort: 0,
        chapters: [
          {
            id: 'c1',
            title: '第一章 破庙惊雷',
            sort: 0,
            status: 'draft',
            summary: '沈砚得灯，阿萤登场，第六道刻痕亮起。',
            scenes: [
              { id: 's1', title: '雷夜借宿', sort: 0, content: '雨是从子夜开始下的。', status: 'done', characterIds: ['e1'], plotLineIds: [] },
              { id: 's2', title: '铜灯初醒', sort: 1, content: '灯身第六道刻痕亮了。', status: 'done', characterIds: ['e1', 'e2'], plotLineIds: [] },
            ],
          },
        ],
      },
    ],
    entities: [
      {
        id: 'e1',
        kind: 'character',
        name: '沈砚',
        aliases: ['提灯人'],
        fields: { 性格: '外冷内轴' },
        notes: '',
        tags: [],
        injection: { mode: 'always', priority: 2, budgetTokens: 800 },
      },
      {
        id: 'e2',
        kind: 'character',
        name: '阿萤',
        aliases: ['灯灵'],
        fields: {},
        notes: '',
        tags: [],
        injection: { mode: 'never', priority: 3, budgetTokens: 800 },
      },
    ],
    foreshadows: [],
    plotLines: [],
    snapshots: [],
  }

  it('产出标准五层，且 never 实体被排除', () => {
    const ctx = buildLayersForScene(project, project.volumes[0].chapters[0].scenes[1])
    expect(ctx.layers.map(l => l.key)).toEqual(['system', 'entities', 'summary-chain', 'chapter-outline', 'prev-tail'])
    const entities = ctx.layers.find(l => l.key === 'entities')!
    expect(entities.label).toBe('实体卡 ×1') // 阿萤 mode=never 被排除
    expect(entities.content).toContain('沈砚')
    expect(entities.content).not.toContain('阿萤')
  })

  it('上章结尾取前一场景尾部原文', () => {
    const ctx = buildLayersForScene(project, project.volumes[0].chapters[0].scenes[1])
    const tail = ctx.layers.find(l => l.key === 'prev-tail')!
    expect(tail.content).toBe('雨是从子夜开始下的。')
  })

  it('首场景无上章结尾', () => {
    const ctx = buildLayersForScene(project, project.volumes[0].chapters[0].scenes[0])
    expect(ctx.layers.find(l => l.key === 'prev-tail')!.content).toBe('')
  })
})
