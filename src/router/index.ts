import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NewBookWizard from '@/views/NewBookWizard.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import WorkbenchView from '@/views/workbench/WorkbenchView.vue'
import { useWorkspaceStore } from '@/stores/workspace'

// hash 路由：wujie iframe 内最稳妥；独立运行同样可用
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/welcome', name: 'welcome', component: OnboardingView },
    { path: '/new', name: 'wizard', component: NewBookWizard },
    { path: '/book/:id/:section?', name: 'workbench', component: WorkbenchView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// 首次引导守卫：未完成引导则进全屏引导；已完成时 /welcome 仅作为「偏好设置」入口（?edit=1）
router.beforeEach(async to => {
  const workspace = useWorkspaceStore()
  await workspace.ensurePrefs()
  const onboarded = workspace.preferences.onboarded === true
  if (!onboarded && to.name !== 'welcome') return { name: 'welcome' }
  if (onboarded && to.name === 'welcome' && to.query.edit !== '1') return { name: 'home' }
  return true
})

export default router
