import { createRouter, createWebHashHistory } from 'vue-router'
import ShelfView from '@/views/ShelfView.vue'
import NewBookWizard from '@/views/NewBookWizard.vue'
import WorkbenchView from '@/views/workbench/WorkbenchView.vue'

// hash 路由：wujie iframe 内最稳妥；独立运行同样可用
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'shelf', component: ShelfView },
    { path: '/new', name: 'wizard', component: NewBookWizard },
    { path: '/book/:id/:section?', name: 'workbench', component: WorkbenchView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
