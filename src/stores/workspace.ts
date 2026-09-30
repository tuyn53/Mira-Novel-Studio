import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getPlatformApi } from '@/platform'
import type { StudioPreferences, ThemePreference } from '@/platform'
import type { NovelProjectDocumentV2, NovelProjectSummary, Scene } from '@/domain/model'
import { zhCN } from '@/locale/zh-CN'

/**
 * 工作区状态：书架列表 + 当前作品 + 主题偏好。
 * 业务数据只经平台 API 进出（Mock 或宿主桥），Pinia 不做持久化插件——
 * 持久化归宿主 SQLite / preference，渲染层状态是纯缓存。
 */
export const useWorkspaceStore = defineStore('workspace', () => {
  const api = getPlatformApi()

  // ---- 主题 ----
  // 色板是 Studio 自有的"书卷暖色"（不随宿主主题色），但明暗状态与宿主偏好/系统外观同步：
  // 'system' 跟随 OS，手动切换持久化到平台偏好。
  const theme = ref<ThemePreference>('system')
  function applyTheme(pref: ThemePreference) {
    const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    // data-theme：--cp 令牌（宿主约定）；html.dark：Element Plus 变量
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', dark)
  }
  async function initTheme() {
    const prefs: StudioPreferences = await api.getPreferences()
    theme.value = prefs.theme
    applyTheme(prefs.theme)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') applyTheme('system')
    })
  }
  async function setTheme(pref: ThemePreference) {
    theme.value = pref
    applyTheme(pref)
    await api.savePreferences({ theme: pref })
  }

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

  async function openProject(projectId: string) {
    projectLoading.value = true
    try {
      current.value = await api.getProject(projectId)
      currentSceneId.value = current.value.volumes[0]?.chapters[0]?.scenes[0]?.id ?? ''
    } finally {
      projectLoading.value = false
    }
  }

  async function createProject(input: { title: string; templateId?: string; coreIdea?: string; pov?: string; targetLength?: string }) {
    const project = await api.createProject(input)
    await loadProjects()
    return project
  }

  /** 选中场景按 id 从当前作品派生，避免两处真相 */
  const currentScene = computed<Scene | undefined>(() => findScene(current.value, currentSceneId.value))
  function selectScene(sceneId: string) {
    currentSceneId.value = sceneId
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
    theme,
    initTheme,
    setTheme,
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
      const scene = chapter.scenes.find(s => s.id === sceneId)
      if (scene) return scene
    }
  }
  return undefined
}
