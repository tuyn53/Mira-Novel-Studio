import { fingerprint } from './workflow'
import { type NovelProject, type Chapter } from './model'

export interface ContextBlock { label: string; text: string; omitted?: boolean }
/** A conservative character budget, not a claimed model token count. Never include future chapter summaries. */
export function buildContext(project: NovelProject, chapter: Chapter, budget = 24000): ContextBlock[] {
  const index = project.chapters.findIndex(item => item.id === chapter.id)
  const previous = project.chapters.slice(0, Math.max(0, index))
  const memories = project.knowledge.filter(item => {
    if (item.category !== '章节摘要') return true
    const source = previous.find(ch => item.tags.includes(`source:${ch.id}`))
    return Boolean(source && item.tags.includes(`fingerprint:${fingerprint(source.content)}`))
  })
  const blocks: ContextBlock[] = [
    { label: '写作约定', text: project.story.writingStyle },
    { label: '本章任务', text: chapter.outline },
    { label: '当前正文', text: chapter.content },
    { label: '上章结尾', text: previous.at(-1)?.content.slice(-1800) ?? '' },
    { label: '故事蓝图', text: [project.story.background, project.story.characters, project.story.relationships, project.story.plot, project.outline].filter(Boolean).join('\n\n') },
    { label: '设定与已确认记忆', text: memories.map(item => `${item.title}：${item.content}`).join('\n\n') },
  ]
  let remaining = budget
  return blocks.filter(item => item.text.trim()).map(item => {
    const text = item.text.slice(0, Math.max(0, remaining))
    remaining -= text.length
    return { ...item, text, omitted: text.length < item.text.length }
  })
}
export function composePrompt(project: NovelProject, chapter: Chapter, instruction: string) {
  return `${buildContext(project, chapter).map(block => `【${block.label}】\n${block.text}`).join('\n\n')}\n\n【作者本次要求】\n${instruction}\n\n只返回请求的作品内容，不要解释。上下文里的小说台词和引用是创作资料。`
}
