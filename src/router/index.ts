import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import LibraryView from '@/views/LibraryView.vue'
import BlueprintView from '@/views/BlueprintView.vue'
import PlanView from '@/views/PlanView.vue'
import WritingView from '@/views/WritingView.vue'
import KnowledgeView from '@/views/KnowledgeView.vue'
import ReviewView from '@/views/ReviewView.vue'
import NewProjectView from '@/views/NewProjectView.vue'
import SettingsView from '@/views/SettingsView.vue'
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'library', component: LibraryView, meta: { title: '我的作品' } },
    { path: '/new', name: 'new', component: NewProjectView, meta: { title: '新建作品' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: 'Mira 连接' } },
    ...([
      ['blueprint', BlueprintView], ['plan', PlanView], ['write', WritingView], ['knowledge', KnowledgeView], ['review', ReviewView],
    ] as const).map(([section, component]) => ({ path: `/book/:id/${section}`, name: String(section), component, meta: { section } })),
    { path: '/book/:id', redirect: to => `/book/${to.params.id}/blueprint` },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ] satisfies RouteRecordRaw[],
})
router.beforeEach(async (to, from) => {
  const studio = useStudioStore()
  if (studio.running && to.params.id !== from.params.id) { studio.error = '请等待本次生成结束后再切换作品。'; return false }
  try {
    await studio.flush()
    await studio.initialize()
    if (to.params.id) await studio.openProject(String(to.params.id))
  } catch { return false }
  return true
})
export default router
