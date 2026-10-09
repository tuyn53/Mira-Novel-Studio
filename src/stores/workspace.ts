import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getPlatformApi } from '@/platform'
import type { CreateProjectInput, ModelModule, StudioPreferences, ThemePreference } from '@/platform'
import type { NovelProjectDocumentV2, NovelProjectSummary, Scene } from '@/domain/model'
import { zhCN } from '@/locale/zh-CN'

/**
 * 工作区状态：偏好（主题/笔名/模型分配/位置记忆/书架视图）+ 书架列表 + 当前作品。
 * 业务数据只经平台 API 进出（Mock 或宿主桥），Pinia 不做持久化插件——
 * 持久化归宿主 SQLite / preference，渲染层状态是纯缓存。
 */
export const useWorkspaceStore = defineStore('workspace', () => {
  const api = getPlatformApi()

  // ---- 偏好（单例加载：路由守卫与界面共享同一次读取）----
  const preferences = ref<StudioPreferences>({ theme: 'system' })
  let prefsPromise: Promise<void> | undefined

  function ensurePrefs(): Promise<void> {
    prefsPromise ??= (async () => {
      const stored = await api.getPreferences()
      preferences.value = { ...stored, theme: stored.theme ?? 'system' }
      applyTheme(preferences.value.theme)
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (preferences.value.theme === 'system') applyTheme('system')
      })
    })()
    return prefsPromise
  }

  function applyTheme(pref: ThemePreference) {
    const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    // data-theme：--cp 令牌（宿主约定）；html.dark：Element Plus 变量
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', dark)
  }

  async function persistPrefs() {
    const saved = await api.savePreferences({ ...preferences.value })
    preferences.value = { ...preferences.value, ...saved }
  }

  const theme = computed(() => preferences.value.theme)
  async function setTheme(pref: ThemePreference) {
    preferences.value.theme = pref
    applyTheme(pref)
    await persistPrefs()
  }

  /** 首次引导完成（笔名 / 模型分配写入 + 标记） */
  async function completeOnboarding(input: { penName?: string; addressing?: string; modelRouting?: StudioPreferences['modelRouting'] }) {
    preferences.value.penName = input.penName?.trim() || undefined
    preferences.value.addressing = input.addressing?.trim() || undefined
    preferences.value.modelRouting = input.modelRouting
    preferences.value.onboarded = true
    await persistPrefs()
  }

  /** AI 称呼作者的名称：优先「称呼」，否则笔名，都没有则为空 */
  const authorName = computed(() => preferences.value.addressing?.trim() || preferences.value.penName?.trim() || '')

  function modelIdFor(module: ModelModule): string | undefined {
    return preferences.value.modelRouting?.[module]
  }

  // ---- 书架视图偏好（默认网格，与首页视觉一致）----
  const shelfView = computed<'grid' | 'list'>(() => preferences.value.shelfView ?? 'grid')
  async function setShelfView(view: 'grid' | 'list') {
    if (preferences.value.shelfView === view) return
    preferences.value.shelfView = view
    await persistPrefs()
  }

  // ---- 位置记忆（首页「继续写作」+ 工作台恢复现场；防抖持久化）----
  let locationTimer: number | undefined
  function rememberLocation(projectId: string, sceneId: string) {
    preferences.value.lastProjectId = projectId
    preferences.value.lastSceneId = sceneId
    window.clearTimeout(locationTimer)
    locationTimer = window.setTimeout(() => void persistPrefs(), 600)
  }
  const lastProject = computed(() => projects.value.find(item => item.id === preferences.value.lastProjectId))

  // ---- 书架 ----
  const projects = ref<NovelProjectSummary[]>([])
  const shelfLoading = ref(false)

  async function loadProjects() {
    shelfLoading.value = true
    try {
      projects.value = await api.listProjects()
    } finally {
      shelfLoading.value = false
    }
  }

  // ---- 当前作品 ----
  const current = ref<NovelProjectDocumentV2>()
  const currentSceneId = ref('')
  const projectLoading = ref(false)

  /** 打开作品：优先恢复上次编辑的场景（位置记忆），否则第一章第一个场景 */
  async function openProject(projectId: string) {
    projectLoading.value = true
    try {
      current.value = await api.getProject(projectId)
      const remembered = preferences.value.lastProjectId === projectId ? preferences.value.lastSceneId : undefined
      const sceneId = remembered && findScene(current.value, remembered)
        ? remembered
        : current.value.volumes[0]?.chapters[0]?.scenes[0]?.id ?? ''
      currentSceneId.value = sceneId
      rememberLocation(projectId, sceneId)
    } finally {
      projectLoading.value = false
    }
  }

  async function createProject(input: CreateProjectInput) {
    const project = await api.createProject(input)
    await loadProjects()
    return project
  }

  /** 选中场景按 id 从当前作品派生，避免两处真相 */
  const currentScene = computed<Scene | undefined>(() => findScene(current.value, currentSceneId.value))
  function selectScene(sceneId: string) {
    currentSceneId.value = sceneId
    if (current.value) rememberLocation(current.value.id, sceneId)
  }

  async function saveScene(scene: Scene) {
    const project = current.value
    if (!project) return
    await api.saveScene(project.id, scene)
    const found = findScene(project, scene.id)
    if (found) Object.assign(found, scene) // 回写本地缓存，UI 立即一致
    project.updatedAt = Date.now()
  }

  return {
    preferences,
    ensurePrefs,
    theme,
    setTheme,
    completeOnboarding,
    authorName,
    modelIdFor,
    shelfView,
    setShelfView,
    rememberLocation,
    lastProject,
    projects,
    shelfLoading,
    loadProjects,
    current,
    currentSceneId,
    currentScene,
    projectLoading,
    openProject,
    createProject,
    selectScene,
    saveScene,
    t: zhCN,
  }
})

function findScene(project: NovelProjectDocumentV2 | undefined, sceneId: string): Scene | undefined {
  for (const volume of project?.volumes ?? []) {
    for (const chapter of volume.chapters) {
      const scene = chapter.scenes.find(item => item.id === sceneId)
      if (scene) return scene
    }
  }
  return undefined
}
