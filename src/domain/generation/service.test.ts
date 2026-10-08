import { describe, expect, it } from 'vitest'
import { composeRequest, runCandidates, SCENE_ACTIONS, SELECTION_ACTIONS, type Candidate, type StreamFn } from './service'
import { countProjectWords, type NovelProjectDocumentV2 } from '../model'
import { coverPaletteFor, defaultCover, coverPaletteClass } from '../cover'

function fixture(): NovelProjectDocumentV2 {
  return {
    version: 2,
    id: 'p1',
    title: '提灯照河山',
    createdAt: 0,
    updatedAt: 0,
    meta: { genre: '东方玄幻', coreIdea: '提灯人查前六任死因', pov: '第三人称限知', targetLength: '60 万字' },
    cover: defaultCover('提灯照河山'),
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
            summary: '沈砚得灯，阿萤登场。',
            scenes: [
              {
                id: 's1',
                title: '雷夜借宿',
                sort: 0,
                content: '雨是从子夜开始下的。',
                status: 'draft',
                characterIds: ['e1'],
                plotLineIds: [],
              },
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
    ],
    foreshadows: [],
    plotLines: [],
    snapshots: [],
  }
}

const action = SCENE_ACTIONS[0] // continue

describe('composeRequest', () => {
  it('system 层承载创作规范，prompt 含实体卡与任务指令', () => {
    const project = fixture()
    const scene = project.volumes[0].chapters[0].scenes[0]
    const request = composeRequest(project, scene, action)
    expect(request.role).toBe('authoring')
    expect(request.system).toContain('东方玄幻')
    expect(request.prompt).toContain('沈砚')
    expect(request.prompt).toContain('【当前正文】')
    expect(request.prompt).toContain(action.instruction)
  })

  it('选区动作注入选中段落并要求只返回改写结果', () => {
    const project = fixture()
    const scene = project.volumes[0].chapters[0].scenes[0]
    const request = composeRequest(project, scene, SELECTION_ACTIONS[2], { selection: '灯没有响。' })
    expect(request.prompt).toContain('【选中段落】\n灯没有响。')
    expect(request.prompt).toContain('只返回改写后的文本')
    // 选区动作不再注入整段正文，避免模型把全文重写一遍
    expect(request.prompt).not.toContain('【当前正文】')
  })

  it('自定义指令覆盖动作自带指令', () => {
    const project = fixture()
    const scene = project.volumes[0].chapters[0].scenes[0]
    const request = composeRequest(project, scene, action, { custom: '更压抑一点' })
    expect(request.prompt).toContain('【任务】更压抑一点')
    expect(request.prompt).not.toContain(action.instruction)
  })

  it('多候选差异提示按编号注入', () => {
    const project = fixture()
    const scene = project.volumes[0].chapters[0].scenes[0]
    const a = composeRequest(project, scene, action, { variant: 1, variantCount: 2 })
    const b = composeRequest(project, scene, action, { variant: 2, variantCount: 2 })
    expect(a.prompt).toContain('第 1 / 2 个候选方案')
    expect(b.prompt).toContain('第 2 / 2 个候选方案')
  })
})

describe('runCandidates', () => {
  it('并行生成两个候选，流式更新且互不干扰', async () => {
    const project = fixture()
    const scene = project.volumes[0].chapters[0].scenes[0]
    const stream: StreamFn = async (request, onChunk) => {
      const text = request.prompt.includes('第 1 / 2') ? '方案甲的内容' : '方案乙的内容'
      onChunk(text)
      return text
    }
    let last: Candidate[] = []
    const result = await runCandidates({
      stream,
      project,
      scene,
      action,
      onUpdate: candidates => { last = candidates },
    })
    expect(result).toHaveLength(2)
    expect(result.every(c => c.done)).toBe(true)
    expect(result[0].text).toBe('方案甲的内容')
    expect(result[1].text).toBe('方案乙的内容')
    expect(last).toHaveLength(2)
    // onUpdate 推送的是不可变快照（不与内部可变对象共享引用）
    expect(last[0]).not.toBe(result[0])
  })

  it('中断时不产生错误标记（AbortError 被吞掉），失败候选带 error', async () => {
    const project = fixture()
    const scene = project.volumes[0].chapters[0].scenes[0]
    const aborted: StreamFn = async () => { throw new DOMException('aborted', 'AbortError') }
    const failed: StreamFn = async () => { throw new Error('模型连接失败') }
    const result1 = await runCandidates({ stream: aborted, project, scene, action, onUpdate: () => {} })
    expect(result1.every(c => c.done && !c.error)).toBe(true)
    const result2 = await runCandidates({ stream: failed, project, scene, action, onUpdate: () => {} })
    expect(result2.every(c => c.error === '模型连接失败')).toBe(true)
  })
})

describe('封面（默认书名封面）', () => {
  it('色板索引对同一书名稳定、落在有效范围内', () => {
    const first = coverPaletteFor('提灯照河山')
    const again = coverPaletteFor('提灯照河山')
    expect(first).toBe(again)
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(5)
  })

  it('书名不同时色板可能不同（抽样验证哈希生效）', () => {
    const palettes = new Set(['提灯照河山', '雾起长安', '春窗灯影录', '听雨江湖行', '北境无雪'].map(coverPaletteFor))
    expect(palettes.size).toBeGreaterThan(1)
  })

  it('封面缺失时回退到书名哈希，永不空白', () => {
    expect(coverPaletteClass(undefined, '雾起长安')).toBe(`cover-palette-${coverPaletteFor('雾起长安')}`)
  })
})

describe('countProjectWords', () => {
  it('全库字数按场景正文统计', () => {
    const project = fixture()
    expect(countProjectWords(project)).toBe('雨是从子夜开始下的。'.length)
  })
})
