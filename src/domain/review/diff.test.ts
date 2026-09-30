import { describe, expect, it } from 'vitest'
import { alignParagraphs, splitParagraphs } from './diff'

describe('splitParagraphs', () => {
  it('按空行切段并丢弃空段', () => {
    expect(splitParagraphs('第一段。\n\n第二段。\n\n\n')).toEqual(['第一段。', '第二段。'])
  })

  it('段内单换行合并为一段', () => {
    expect(splitParagraphs('雨是从子夜开始下的，\n先是瓦上碎玉般的响。')).toEqual(['雨是从子夜开始下的，\n先是瓦上碎玉般的响。'])
  })
})

describe('alignParagraphs', () => {
  it('无改动时全部 equal', () => {
    const ops = alignParagraphs('甲段。\n\n乙段。', '甲段。\n\n乙段。')
    expect(ops).toEqual([
      { kind: 'equal', old: '甲段。', new: '甲段。' },
      { kind: 'equal', old: '乙段。', new: '乙段。' },
    ])
  })

  it('单段替换为一个 replace 块', () => {
    const ops = alignParagraphs('甲段。\n\n旧结尾。', '甲段。\n\n新结尾。')
    expect(ops).toEqual([
      { kind: 'equal', old: '甲段。', new: '甲段。' },
      { kind: 'replace', old: '旧结尾。', new: '新结尾。' },
    ])
  })

  it('新增段落产出仅含 new 的 replace 块', () => {
    const ops = alignParagraphs('甲段。', '甲段。\n\n新增段。')
    expect(ops).toEqual([
      { kind: 'equal', old: '甲段。', new: '甲段。' },
      { kind: 'replace', old: undefined, new: '新增段。' },
    ])
  })

  it('多处改动各成一块，不吞并中间相等段', () => {
    const ops = alignParagraphs('A1。\n\nX。\n\n中段。\n\nY。', 'A2。\n\nX。\n\n中段。\n\nY2。')
    expect(ops.filter(o => o.kind === 'replace')).toHaveLength(2)
    expect(ops.some(o => o.kind === 'equal' && o.old === '中段。')).toBe(true)
  })
})
