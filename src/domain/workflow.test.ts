import { describe, expect, it } from 'vitest'
import { createProject, emptyWorkflow, type Proposal } from './model'
import { applyProposal, chapterStatus, fingerprint } from './workflow'
import { buildContext } from './context'

function fixture() {
  const project = createProject('试稿', '海上的信')
  project.chapters[0]!.content = '已经发生的事。'
  const chapter = project.chapters[0]!
  const proposal: Proposal = { id: 'p1', chapterId: chapter.id, target: 'content', title: '修改', instruction: '润色', baseText: chapter.content,
    text: '经过修改的事。', sourceHash: fingerprint(chapter.content), status: 'pending', createdAt: 1 }
  return { project, chapter, workflow: { ...emptyWorkflow(), proposals: [proposal] }, proposal }
}
describe('author controlled workflow', () => {
  it('keeps a suggestion separate until accepted', () => {
    const f = fixture()
    const result = applyProposal(f.project, f.workflow, f.proposal.id)
    expect(f.chapter.content).toBe('已经发生的事。')
    expect(result.project.chapters[0]!.content).toBe('经过修改的事。')
    expect(result.workflow.proposals[0]!.status).toBe('accepted')
  })
  it('rejects stale proposals instead of overwriting author edits', () => {
    const f = fixture()
    f.chapter.content = '作者刚修改的内容。'
    expect(() => applyProposal(f.project, f.workflow, 'p1')).toThrow('原文已改变')
  })
  it('recovers a document write whose receipt failed without duplicating content', () => {
    const f = fixture()
    f.chapter.content = f.proposal.text
    expect(applyProposal(f.project, f.workflow, 'p1').project.chapters[0]!.content).toBe(f.proposal.text)
  })
  it('confirms memory only for the exact reviewed manuscript, and deduplicates retries', () => {
    const f = fixture()
    f.proposal.target = 'memory'
    f.proposal.text = '已确认的摘要。'
    const next = applyProposal(f.project, f.workflow, 'p1')
    expect(next.project.knowledge).toHaveLength(1)
    expect(chapterStatus(next.project, next.workflow, f.chapter.id)).toBe('已定稿')
    next.workflow.proposals[0]!.status = 'pending'
    expect(applyProposal(next.project, next.workflow, 'p1').project.knowledge).toHaveLength(1)
    next.project.chapters[0]!.content += '新事实。'
    expect(chapterStatus(next.project, next.workflow, f.chapter.id)).toBe('草稿')
    expect(() => applyProposal(next.project, next.workflow, 'p1')).toThrow('正文已修改')
  })
  it('does not inject future or stale chapter memories', () => {
    const f = fixture()
    f.project.chapters.push({ id: 'future', title: '未来章', outline: '', content: '未来事实。' })
    f.project.knowledge = [
      { id: 'm1', title: '旧摘要', content: '过期记忆', category: '章节摘要', tags: [`source:${f.chapter.id}`, 'fingerprint:old'] },
      { id: 'm2', title: '未来摘要', content: '未来记忆', category: '章节摘要', tags: ['source:future', `fingerprint:${fingerprint('未来事实。')}`] },
    ]
    const text = buildContext(f.project, f.project.chapters[1]!).map(b => b.text).join('')
    expect(text).not.toContain('过期记忆')
    expect(text).not.toContain('未来记忆')
  })
})

describe('context budget', () => {
  it('preserves the current manuscript before a large story blueprint', () => {
    const f = fixture()
    f.project.story.background = '远期计划'.repeat(20000)
    const blocks = buildContext(f.project, f.chapter, 120)
    expect(blocks.find(b => b.label === '当前正文')?.text).toBe(f.chapter.content)
    expect(blocks.reduce((n, b) => n + b.text.length, 0)).toBeLessThanOrEqual(120)
    expect(blocks.some(b => b.omitted)).toBe(true)
  })
  it('includes a valid confirmed memory only in later chapters', () => {
    const f = fixture()
    f.project.chapters.push({ id: 'later', title: '第二章', outline: '', content: '' })
    f.project.knowledge.push({ id: 'memory', title: '第一章摘要', content: '确认事实', category: '章节摘要', tags: ['source:' + f.chapter.id, 'fingerprint:' + fingerprint(f.chapter.content)] })
    expect(buildContext(f.project, f.chapter).map(b => b.text).join('')).not.toContain('确认事实')
    expect(buildContext(f.project, f.project.chapters[1]!).map(b => b.text).join('')).toContain('确认事实')
    f.chapter.content += '作者新改动'
    expect(buildContext(f.project, f.project.chapters[1]!).map(b => b.text).join('')).not.toContain('确认事实')
  })
})
