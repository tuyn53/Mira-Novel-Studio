<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { chapterStatus } from '@/domain/workflow'
import { projectWords, wordCount } from '@/domain/model'
import AppIcon from '@/components/AppIcon.vue'
import AssistantPanel from '@/components/AssistantPanel.vue'
const studio = useStudioStore()
const router = useRouter()
const route = useRoute()
const showOutline = ref(false)
const size = ref(17)
const focus = computed(() => route.query.focus === '1')
const status = computed(() => studio.project && studio.chapter ? chapterStatus(studio.project, studio.workflow, studio.chapter.id) : '')
function toggleFocus() { void router.replace({ query: focus.value ? {} : { focus: '1' } }) }
async function finalize() {
  try { const id = await studio.generate('整理本章已发生的事实。', 'memory'); if (id) await router.push(`/book/${studio.project!.id}/review?proposal=${id}`) }
  catch { /* Shared error banner. */ }
}
</script>
<template>
  <div v-if="studio.project" class="writing-workspace" :class="{ focused: focus }">
    <aside class="chapter-sidebar" aria-label="章节目录"><div class="chapter-sidebar-heading"><strong>章节目录</strong><button class="icon-button" :disabled="!studio.writable" title="添加章节" aria-label="添加章节" @click="studio.addChapter()"><AppIcon name="plus" :size="16" /></button></div><div class="chapter-list"><button v-for="(item, index) in studio.project.chapters" :key="item.id" :class="{ active: studio.chapterId === item.id }" :aria-current="studio.chapterId === item.id ? 'page' : undefined" @click="studio.chapterId = item.id"><span class="chapter-index">{{ String(index + 1).padStart(2, '0') }}</span><span class="chapter-list-text"><strong>{{ item.title.replace(/^第.+?章\s*/, '') }}</strong><small>{{ chapterStatus(studio.project, studio.workflow, item.id) }}<span v-if="item.content"> · {{ wordCount(item.content) }} 字</span></small></span><AppIcon v-if="chapterStatus(studio.project, studio.workflow, item.id) === '已定稿'" name="circle-check" :size="13" class="complete-icon" /></button></div><RouterLink :to="`/book/${studio.project.id}/plan`" class="chapter-plan-link"><AppIcon name="list-tree" :size="15" />查看章节规划<AppIcon name="arrow-right" :size="14" /></RouterLink><div class="chapter-sidebar-footer"><span>全书 {{ projectWords(studio.project).toLocaleString() }} 字</span><span>{{ studio.project.chapters.length }} 章</span></div></aside>
    <section v-if="studio.chapter" class="manuscript-area" aria-label="正文编辑器"><div class="editor-toolbar"><button class="text-button" :aria-expanded="showOutline" @click="showOutline = !showOutline"><AppIcon name="panel-top" :size="15" />本章章纲<AppIcon :name="showOutline ? 'chevron-up' : 'chevron-down'" :size="13" /></button><div class="editor-tools"><label class="font-size-control"><span>字号</span><input v-model="size" type="range" min="14" max="22" aria-label="正文字号" /><span>{{ size }}</span></label><button class="icon-button" :title="focus ? '退出专注' : '专注写作'" :aria-label="focus ? '退出专注' : '专注写作'" @click="toggleFocus"><AppIcon :name="focus ? 'minimize-2' : 'maximize-2'" :size="16" /></button></div></div><div v-if="showOutline" class="inline-outline"><strong>本章要发生什么</strong><p>{{ studio.chapter.outline || '还没有章纲。可以先在章节规划中写下方向，也可以从正文直接开始。' }}</p></div><div class="manuscript-scroll"><article class="manuscript" :style="{ '--manuscript-size': `${size}px` }"><div class="manuscript-heading"><h1 v-if="!studio.writable">{{ studio.chapter.title }}</h1><input v-else v-model="studio.chapter.title" class="chapter-title-input" aria-label="章节标题" @input="studio.changed()" /><div class="manuscript-meta"><span class="status-label" :class="{ complete: status === '已定稿' }">{{ status }}</span><span><AppIcon name="user-round" :size="13" />{{ studio.project.story.writingStyle.includes('第三人称') ? '第三人称视角' : '按写作约定' }}</span><span>{{ wordCount(studio.chapter.content).toLocaleString() }} 字</span><span v-if="studio.preview">示例正文</span></div></div><div v-if="!studio.writable" class="manuscript-text" :class="{ 'blank-manuscript': !studio.chapter.content }">{{ studio.chapter.content || '故事还未落笔。\n\n待 Mira 创作接入完成后，写下本章的第一句话。' }}</div><textarea v-else :key="studio.chapter.id" v-model="studio.chapter.content" class="manuscript-editor" aria-label="章节正文" placeholder="写下本章的第一句话…" spellcheck="false" @input="studio.changed()" /><div class="manuscript-end"><span /> <AppIcon name="feather" :size="16" /> <span /></div></article></div><footer class="editor-footer"><span>{{ studio.preview ? '仅供浏览 · 内容为示例' : studio.dirty ? '正在等待保存' : studio.saveState === 'saved' ? '已保存至 Mira' : 'Mira 工作区' }}</span><button class="text-button" :disabled="!studio.canGenerate || studio.running || !studio.chapter.content.trim()" @click="finalize">定稿并整理记忆<AppIcon name="arrow-right" :size="14" /></button></footer></section><div v-else class="empty-state"><h2>还没有章节</h2><p>在章节规划里添加你的第一章。</p><RouterLink :to="`/book/${studio.project.id}/plan`" class="button">前往章节规划</RouterLink></div>
    <AssistantPanel />
  </div>
</template>
