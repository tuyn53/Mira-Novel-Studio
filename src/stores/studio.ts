import { computed, ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { assertProject, createProject, emptyWorkflow, uid, type NovelProject, type ProjectSummary, type WorkflowState, type ModelSelection, type Proposal } from '@/domain/model'
import { applyProposal, fingerprint } from '@/domain/workflow'
import { buildContext, composePrompt } from '@/domain/context'
import { connectToMira, isPreview, onHostContext } from '@/platform'
import { type MiraClient, type HostContext } from '@/platform/client'
import { previewWorkspace } from '@/platform/preview'

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const failure = (error: unknown) => error instanceof Error ? error.message : String(error)
const stateKey = (id: string) => `project.${id}.workflow`

export const useStudioStore = defineStore('studio', () => {
  const demo = previewWorkspace()
  const preview = ref(isPreview)
  const connection = ref<'preview' | 'connecting' | 'ready' | 'error'>(isPreview ? 'preview' : 'connecting')
  const context = ref<HostContext>()
  const projects = ref<ProjectSummary[]>(isPreview ? demo.projects.map(p => ({ id: p.id, title: p.title, createdAt: p.createdAt, updatedAt: p.updatedAt, chapterCount: p.chapters.length })) : [])
  const project = ref<NovelProject>()
  const workflow = ref<WorkflowState>(emptyWorkflow())
  const chapterId = ref('')
  const error = ref('')
  const loading = ref(false)
  const dirty = ref(false)
  const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const running = ref(false)
  const runLabel = ref('')
  const model = ref<ModelSelection>({ providerId: '', modelId: '' })
  let client: MiraClient | undefined
  let initialization: Promise<void> | undefined
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let saveChain: Promise<void> = Promise.resolve()
  let revision = 0
  let loadGeneration = 0
  const chapter = computed(() => project.value?.chapters.find(item => item.id === chapterId.value))
  const writable = computed(() => connection.value === 'ready' && Boolean(context.value?.capabilities.includes('storage:novel-projects')))
  const canGenerate = computed(() => writable.value && Boolean(context.value?.capabilities.includes('models:text.generate')) && Boolean(model.value.providerId.trim() && model.value.modelId.trim()))
  const pending = computed(() => workflow.value.proposals.filter(item => item.status === 'pending'))

  function applyContext(value: Partial<HostContext>) {
    context.value = { ...context.value, ...value } as HostContext
    document.documentElement.dataset.theme = context.value.theme === 'dark' ? 'dark' : 'light'
  }
  async function initialize() {
    if (isPreview) return
    initialization ??= (async () => {
      try {
        client = await connectToMira()
        onHostContext(applyContext)
        const value = await client.request<HostContext>('context.get')
        if (value.appId !== 'mira-novel-studio' || value.apiVersion.major !== 1) throw new Error('Mira 授权的应用身份或接口版本不兼容。')
        applyContext(value)
        if (!value.capabilities.includes('storage:novel-projects')) throw new Error('当前 Mira 尚未开放小说作品存储。请等待宿主完成 Novel Studio 接入；本地可浏览原型。')
        client.onClose = () => { connection.value = 'error'; error.value = 'Mira 连接已断开。页面保留未确认内容，请恢复连接后重新读取状态。' }
        const selection = await client.request<ModelSelection | null>('preferences.get', { key: 'modelSelection' })
        if (selection?.providerId && selection.modelId) model.value = selection
        projects.value = await client.request<ProjectSummary[]>('novel.list')
        connection.value = 'ready'
        client.prepareLeave = async () => {
          if (running.value) throw new Error('创作建议仍在生成，请等待结果保存后再离开。')
          await flush()
        }
      } catch (err) { connection.value = 'error'; error.value = failure(err) }
    })()
    await initialization
  }
  function requireWrite() {
    if (!writable.value || !client) throw new Error(preview.value ? '浏览模式仅展示示例，请在 Mira App 内创作。' : 'Mira 连接未就绪，请重新打开应用。')
    return client
  }
  async function openProject(id: string) {
    if (project.value?.id === id) return
    await flush()
    const generation = ++loadGeneration
    loading.value = true
    error.value = ''
    try {
      await initialize()
      let next: NovelProject
      let state: WorkflowState
      if (preview.value) {
        const example = demo.projects.find(item => item.id === id)
        if (!example) throw new Error('没有找到这部示例作品，请返回我的作品重新选择。')
        next = copy(example)
        state = next.id === 'fog-harbor' ? copy(demo.workflow) : emptyWorkflow()
      } else {
        if (!client || connection.value !== 'ready') throw new Error(error.value || 'Mira 连接未就绪。')
        const result = await client.request<unknown>('novel.get', { id })
        assertProject(result)
        next = result
        const stored = await client.request<WorkflowState | null>('preferences.get', { key: stateKey(id) })
        if (stored && (stored.version !== 1 || !Array.isArray(stored.proposals) || !stored.receipts)) throw new Error('创作流程记录格式不兼容，请保留原数据并升级应用。')
        state = stored ?? emptyWorkflow()
      }
      if (generation !== loadGeneration) return
      project.value = next
      workflow.value = state
      chapterId.value = next.chapters.find(item => item.content && state.receipts[item.id] !== fingerprint(item.content))?.id ?? next.chapters[0]?.id ?? ''
      dirty.value = false
      saveState.value = 'idle'
    } catch (err) { if (generation === loadGeneration) { project.value = undefined; error.value = failure(err) } }
    finally { if (generation === loadGeneration) loading.value = false }
  }
  async function refreshProjects() {
    if (!preview.value && client) projects.value = await client.request<ProjectSummary[]>('novel.list')
  }
  function changed() {
    requireWrite()
    revision++
    dirty.value = true
    saveState.value = 'idle'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { void flush().catch(() => undefined) }, 850)
  }
  async function flush() {
    clearTimeout(saveTimer)
    if (!dirty.value || !project.value) return saveChain
    const api = requireWrite()
    const snapshot = copy(project.value)
    const state = copy(workflow.value)
    const savedRevision = revision
    if (JSON.stringify(state).length > 250000) {
      saveState.value = 'error'
      error.value = '审阅记录已接近当前宿主容量限制，请先清理已处理记录。'
      throw new Error(error.value)
    }
    const operation = saveChain.catch(() => undefined).then(async () => {
      saveState.value = 'saving'
      try {
        // The host has no transaction across these two methods. Keep pending proposals on a partial failure.
        const saved = await api.request<NovelProject>('novel.save', { project: snapshot })
        await api.request('preferences.set', { key: stateKey(snapshot.id), value: state })
        if (project.value?.id === snapshot.id && savedRevision === revision) {
          project.value.updatedAt = saved.updatedAt
          dirty.value = false
          saveState.value = 'saved'
        }
        error.value = ''
      } catch (err) { saveState.value = 'error'; error.value = failure(err); throw err }
    })
    saveChain = operation
    return operation
  }
  async function newProject(title: string, premise: string, firstDirection = '') {
    const api = requireWrite()
    await flush()
    const next = createProject(title, premise)
    next.chapters[0]!.outline = firstDirection
    const saved = await api.request<NovelProject>('novel.save', { project: next })
    assertProject(saved)
    project.value = saved
    workflow.value = emptyWorkflow()
    chapterId.value = saved.chapters[0]!.id
    dirty.value = false
    saveState.value = 'saved'
    await refreshProjects()
    return saved.id
  }
  function addChapter() {
    requireWrite()
    if (!project.value) return
    const next = { id: uid(), title: `第${project.value.chapters.length + 1}章`, outline: '', content: '' }
    project.value.chapters.push(next)
    chapterId.value = next.id
    changed()
  }
  async function saveModel(selection: ModelSelection) {
    const api = requireWrite()
    if (!selection.providerId.trim() || !selection.modelId.trim()) throw new Error('请填写 Mira 中已配置的供应商和模型标识。')
    await api.request('preferences.set', { key: 'modelSelection', value: selection })
    model.value = { ...selection }
  }
  async function generate(instruction: string, target: Proposal['target'] = 'content', append = false) {
    const api = requireWrite()
    if (!canGenerate.value) throw new Error('请先在连接设置中选择 Mira 已配置的创作模型。')
    if (running.value || !project.value || !chapter.value) return
    if (target === 'memory' && buildContext(project.value, chapter.value).some(block => block.label === '当前正文' && block.omitted)) throw new Error('本章正文超出当前记忆整理预算，无法完整读取。请先缩短本章；本次不会标记定稿。')
    running.value = true
    const book = copy(project.value)
    const current = copy(chapter.value)
    const baseText = target === 'memory' ? '' : current[target]
    const sourceHash = fingerprint(current.content)
    const request = target === 'memory'
      ? '根据当前正文整理本章已经发生的事件、角色变化和未解线索。分小段写明，不推测未来，不把章纲当成事实。'
      : instruction
    runLabel.value = target === 'memory' ? '正在整理定稿记忆' : '正在生成创作建议'
    try {
      await flush()
      const result = await api.request<string>('models.generateText', {
        role: target === 'memory' ? 'automation' : 'authoring', prompt: composePrompt(book, current, request), selection: copy(model.value),
      }, 180000)
      if (!result.trim()) throw new Error('模型返回了空内容，请调整要求后重试。')
      if (project.value?.id !== book.id) throw new Error('作品已切换，本次结果未写入。')
      const text = target === 'content' && append ? [baseText, result].filter(Boolean).join('\n\n') : result
      const proposal: Proposal = { id: uid(), chapterId: current.id, target, title: target === 'memory' ? `${current.title} · 定稿记忆` : target === 'outline' ? `${current.title} · 章纲建议` : `${current.title} · 正文建议`,
        instruction: request, baseText, text, sourceHash, createdAt: Date.now(), status: 'pending' }
      workflow.value.proposals.push(proposal)
      changed()
      await flush()
      return proposal.id
    } catch (err) { error.value = failure(err); throw err }
    finally { running.value = false; runLabel.value = '' }
  }
  async function acceptProposal(id: string, text?: string) {
    requireWrite()
    if (!project.value) return
    const state = copy(workflow.value)
    const proposal = state.proposals.find(item => item.id === id)
    if (proposal && text !== undefined) proposal.text = text
    const next = applyProposal(copy(toRaw(project.value)), state, id)
    project.value = next.project
    workflow.value = next.workflow
    changed()
    await flush()
  }
  async function rejectProposal(id: string) {
    requireWrite()
    const proposal = workflow.value.proposals.find(item => item.id === id)
    if (!proposal || proposal.status !== 'pending') return
    proposal.status = 'rejected'
    changed()
    await flush()
  }
  function addKnowledge(category: string) {
    requireWrite()
    if (!project.value) return
    const entry = { id: uid(), category, title: '未命名条目', content: '', tags: [] }
    project.value.knowledge.push(entry)
    changed()
    return entry.id
  }
  async function clearHistory() {
    requireWrite()
    workflow.value.proposals = workflow.value.proposals.filter(item => item.status === 'pending')
    changed()
    await flush()
  }
  window.addEventListener('beforeunload', event => {
    if (dirty.value || running.value) { event.preventDefault(); event.returnValue = '' }
  })
  return { preview, connection, context, projects, project, workflow, chapterId, chapter, error, loading, dirty, saveState, running, runLabel,
    model, writable, canGenerate, pending, initialize, openProject, refreshProjects, changed, flush, newProject, addChapter, saveModel, generate, acceptProposal, rejectProposal, addKnowledge, clearHistory }
})
