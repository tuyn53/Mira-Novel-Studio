import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Mira Novel Studio —— 纯渲染层微应用，禁止引入 Electron / node 运行时依赖（docs/技术选型-定案.md §1）。
// - 独立开发：npm run dev，platform 解析为 Mock 实现（内存数据 + 种子项目）；
// - 宿主装载：vite build 产物由 Mira-Harness 以 extraResources 静态资源方式经 wujie 加载，
//   base 必须保持相对路径 './'，产物内不允许出现绝对 / 引用。
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 所有 .scss 自动获得编译期常量（无 CSS 输出），组件内可直接用 $spacing-md 等
        additionalData: `@use "@/styles/scss-vars.scss" as *;\n`,
      },
    },
  },
  server: {
    port: 5180,
    // 宿主 wujie 以完整 URL 加载本应用时（开发联调），需要显式 origin：
    // 在 package.json 中以 `vite --host` 启动，并在宿主注册应用时使用 http://<host>:5180
  },
})
