/** Studio v1 draft document. The current Mira host does not expose novel storage yet. */
export interface Chapter { id: string; title: string; outline: string; content: string }
export interface Knowledge { id: string; category: string; title: string; content: string; tags: string[] }
export interface Story { background: string; characters: string; relationships: string; plot: string; writingStyle: string }
export interface NovelProject {
  version: 1
  id: string
  title: string
  createdAt: number
  updatedAt: number
  story: Story
  outline: string
  chapters: Chapter[]
  knowledge: Knowledge[]
  mindMap: { id: string; title: string; children: NovelProject['mindMap'][] }
  prompts: { id: string; name: string; scope: 'outline' | 'chapter' | 'content' | 'selection'; content: string }[]
  assistantMessages: { id: string; role: 'user' | 'assistant'; content: string; createdAt: number }[]
  generatedIdeas: { id: string; title: string; summary: string; createdAt: number }[]
  optimizer: { mode: 'sentence' | 'paragraph'; iterations: number }
  splitterSource: string
}
export interface ProjectSummary { id: string; title: string; createdAt: number; updatedAt: number; chapterCount: number }
export interface Proposal {
  id: string
  chapterId: string
  target: 'content' | 'outline' | 'memory'
  title: string
  instruction: string
  baseText: string
  text: string
  sourceHash: string
  createdAt: number
  status: 'pending' | 'accepted' | 'rejected'
}
export interface WorkflowState { version: 1; receipts: Record<string, string>; proposals: Proposal[] }
export interface ModelSelection { providerId: string; modelId: string }
export const emptyWorkflow = (): WorkflowState => ({ version: 1, receipts: {}, proposals: [] })
export const uid = () => crypto.randomUUID()
export const wordCount = (text: string) => text.replace(/\s/g, '').length
export const projectWords = (project: NovelProject) => project.chapters.reduce((sum, chapter) => sum + wordCount(chapter.content), 0)
export function createProject(title: string, premise: string): NovelProject {
  const now = Date.now()
  return {
    version: 1, id: uid(), title: title.trim(), createdAt: now, updatedAt: now,
    story: { background: premise, characters: '', relationships: '', plot: '', writingStyle: '第三人称限知视角。以动作推进叙事，保持人物语言的差异。' },
    outline: '', chapters: [{ id: uid(), title: '第一章', outline: '', content: '' }], knowledge: [],
    mindMap: { id: uid(), title: title.trim(), children: [] }, prompts: [], assistantMessages: [], generatedIdeas: [],
    optimizer: { mode: 'paragraph', iterations: 1 }, splitterSource: '',
  }
}
export function assertProject(value: unknown): asserts value is NovelProject {
  const p = value as NovelProject | null
  if (!p || p.version !== 1 || typeof p.id !== 'string' || typeof p.title !== 'string' || !p.story ||
      !Array.isArray(p.chapters) || !Array.isArray(p.knowledge) || typeof p.outline !== 'string' ||
      p.chapters.some(c => typeof c.id !== 'string' || typeof c.content !== 'string' || typeof c.outline !== 'string')) {
    throw new Error('作品格式与当前版本不兼容，原数据未修改。')
  }
}
