import type { App as VueApp } from 'vue'

/**
 * wujie 子应用接入：wujie 的 iframe 保活子应用，常规情况下直接渲染即可（零改造）；
 * 这里仅处理容器强销毁事件做清理，使「独立运行」与「被宿主装载」共用一份入口。
 */
export function mountApp(app: VueApp): void {
  app.mount('#app')
  if (window.__POWERED_BY_WUJIE__) {
    window.addEventListener('unmount', () => app.unmount(), { once: true })
  }
}
