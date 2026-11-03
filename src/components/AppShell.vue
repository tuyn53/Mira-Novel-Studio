<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import AppIcon from './AppIcon.vue'
const route = useRoute()
const studio = useStudioStore()
const sections = [
  { key: 'blueprint', label: '创作蓝图', icon: 'compass' },
  { key: 'plan', label: '章节规划', icon: 'list-tree' },
  { key: 'write', label: '正文写作', icon: 'feather' },
  { key: 'knowledge', label: '设定与记忆', icon: 'notebook-tabs' },
  { key: 'review', label: '审阅', icon: 'git-pull-request' },
]
const inBook = computed(() => Boolean(route.params.id))
const pageTitle = computed(() => sections.find(item => item.key === route.meta.section)?.label ?? String(route.meta.title ?? '我的作品'))
const bookPath = (key: string) => `/book/${route.params.id}/${key}`
</script>
<template>
  <div class="studio-shell" :class="{ 'focus-mode': route.query.focus === '1' }">
    <aside class="app-sidebar" aria-label="工作区导航">
      <RouterLink to="/" class="brand"><span class="brand-mark"><AppIcon name="book-open" :size="21" /></span><span>Novel Studio<small>Mira 创作工作台</small></span></RouterLink>
      <nav class="primary-nav"><RouterLink to="/" :class="{ active: !inBook && route.name === 'library' }"><AppIcon name="library" />我的作品</RouterLink><RouterLink to="/new" :class="{ active: route.name === 'new' }"><AppIcon name="plus" />新建作品</RouterLink></nav>
      <template v-if="inBook && studio.project">
        <div class="sidebar-book"><strong>{{ studio.project.title }}</strong><span>{{ studio.project.chapters.length }} 章 · {{ studio.preview ? '浏览示例' : 'Mira 作品' }}</span></div>
        <nav class="workflow-nav" aria-label="创作阶段"><RouterLink v-for="section in sections" :key="section.key" :to="bookPath(section.key)" :class="{ active: route.meta.section === section.key }"><AppIcon :name="section.icon" />{{ section.label }}<span v-if="section.key === 'review' && studio.pending.length" class="count-badge">{{ studio.pending.length }}</span></RouterLink></nav>
        <div class="sidebar-next"><AppIcon name="route" :size="16" /><p>想法可以回改，<br>故事可以慢慢长大。</p></div>
      </template>
      <div v-else class="sidebar-note"><AppIcon name="feather" :size="24" /><p>从一句想法，<br>写到最后一章。</p></div>
      <div class="sidebar-bottom"><RouterLink to="/settings"><AppIcon name="sliders-horizontal" />Mira 连接<AppIcon name="chevron-right" :size="14" /></RouterLink><div class="connection-state"><span class="status-dot" :class="{ online: studio.connection === 'ready' }" />{{ studio.preview ? '浏览模式' : studio.connection === 'ready' ? '已连接 Mira' : studio.connection === 'error' ? 'Mira 接入未就绪' : '等待 Mira 连接' }}<span class="version">0.2</span></div></div>
    </aside>
    <div class="app-main">
      <header class="workspace-header"><div class="breadcrumbs"><RouterLink to="/">作品</RouterLink><AppIcon name="chevron-right" :size="13" /><template v-if="inBook && studio.project"><span>{{ studio.project.title }}</span><AppIcon name="chevron-right" :size="13" /></template><strong>{{ pageTitle }}</strong></div><div class="header-actions"><span v-if="studio.running" class="quiet-status"><AppIcon name="loader-circle" :size="14" class="spin" />{{ studio.runLabel }}</span><button v-if="studio.saveState === 'error'" class="text-button danger" @click="studio.flush().catch(() => undefined)">保存失败，重试</button><span v-else-if="!studio.preview && inBook" class="quiet-status">{{ studio.saveState === 'saving' ? '保存中…' : studio.dirty ? '有未保存修改' : studio.saveState === 'saved' ? '已保存到 Mira' : '' }}</span><span v-if="studio.preview" class="preview-indicator"><AppIcon name="eye" :size="14" />浏览示例<span>创作接入待完成</span></span><RouterLink to="/settings" class="icon-button" aria-label="连接设置" title="连接设置"><AppIcon name="settings-2" :size="17" /></RouterLink></div></header>
      <div v-if="studio.error" class="error-banner" role="alert"><AppIcon name="circle-alert" :size="17" /><span>{{ studio.error }}</span><button class="icon-button" aria-label="关闭提示" @click="studio.error = ''"><AppIcon name="x" :size="15" /></button></div>
      <main id="main-content" class="workspace-content"><slot /></main>
    </div>
  </div>
</template>
