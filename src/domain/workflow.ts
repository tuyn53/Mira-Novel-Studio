import { type NovelProject, type Proposal, type WorkflowState } from './model'

/** Content identity, used to invalidate receipts and prevent stale AI results overwriting edits. */
export function fingerprint(text: string): string {
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(16)
}
export function chapterStatus(project: NovelProject, workflow: WorkflowState, chapterId: string) {
  const chapter = project.chapters.find(item => item.id === chapterId)
  if (!chapter) return '待规划'
  if (chapter.content.trim() && workflow.receipts[chapter.id] === fingerprint(chapter.content)) return '已定稿'
  return chapter.content.trim() ? '草稿' : chapter.outline.trim() ? '待写作' : '待规划'
}

export function applyProposal(project: NovelProject, workflow: WorkflowState, proposalId: string): { project: NovelProject; workflow: WorkflowState } {
  const next = structuredClone(project)
  const state = structuredClone(workflow)
  const proposal = state.proposals.find(item => item.id === proposalId)
  if (!proposal || proposal.status !== 'pending') throw new Error('这条建议已处理，请刷新审阅列表。')
  const chapter = next.chapters.find(item => item.id === proposal.chapterId)
  if (!chapter) throw new Error('对应章节已不存在，无法应用建议。')
  if (proposal.target === 'memory') {
    if (fingerprint(chapter.content) !== proposal.sourceHash) throw new Error('正文已修改，请根据最新正文重新整理记忆。')
    if (!next.knowledge.some(item => item.id === proposal.id)) {
      next.knowledge.push({ id: proposal.id, category: '章节摘要', title: chapter.title, content: proposal.text,
        tags: [`source:${chapter.id}`, `fingerprint:${proposal.sourceHash}`] })
    }
    state.receipts[chapter.id] = proposal.sourceHash
  } else {
    const current = chapter[proposal.target]
    // The document may already have saved while the workflow receipt failed. Retrying is idempotent.
    if (current !== proposal.text && current !== proposal.baseText) throw new Error('原文已改变，请重新生成建议，避免覆盖新的修改。')
    chapter[proposal.target] = proposal.text
  }
  proposal.status = 'accepted'
  return { project: next, workflow: state }
}
export function targetText(project: NovelProject, proposal: Proposal) {
  const chapter = project.chapters.find(item => item.id === proposal.chapterId)
  return proposal.target === 'outline' ? chapter?.outline ?? '' : proposal.target === 'content' ? chapter?.content ?? '' : ''
}
