import { defineConfig } from 'vitest/config'

// 领域模块测试跑 node 环境（不碰 DOM）；组件测试引入时再调整
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
