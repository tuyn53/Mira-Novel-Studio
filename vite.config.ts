import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), '@vue/devtools-api': fileURLToPath(new URL('./src/platform/devtools.ts', import.meta.url)) } },
  build: { rollupOptions: { input: { studio: 'index.html', prototype: 'prototype/index.html' } } },
  server: { cors: { origin: ['null', /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/] }, host: '127.0.0.1', port: 5180, strictPort: true },
})
