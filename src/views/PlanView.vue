<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { chapterStatus } from '@/domain/workflow'
import { wordCount } from '@/domain/model'
import AppIcon from '@/components/AppIcon.vue'
const studio = useStudioStore()
const router = useRouter()
const expanded = ref('')
function write(id: string) { studio.chapterId = id; void router.push(`/book/${studio.project!.id}/write`) }
async function expand(id: string) {
  studio.chapterId = id
  try { const proposal = await studio.generate('细化当前章节的目标、障碍、转折与结尾悬念，保留作者已经确立的方向。', 'outline'); if (proposal) await router.push(`/book/${studio.project!.id}/review?proposal=${proposal}`) }
  catch { /* Shared error banner preserves the author's input. */ }
}
</script>
<template>
  <div v-if="studio.project" class="page plan-page"><div class="page-heading"><div><h1>章节规划</h1><p>看清全书的方向，把下一段路写得更具体。</p></div><button class="button primary" :disabled="!studio.writable" @click="studio.addChapter()"><AppIcon name="plus" :size="16" />添加章节</button></div><section class="full-outline"><div class="section-heading"><h2>全书脉络</h2><span class="muted">只保留重要锚点，随时回来调整</span></div><textarea v-model="studio.project.outline" :readonly="!studio.writable" rows="7" placeholder="开端、重要转折、故事终点。无需把每一章提前写死。" aria-label="全书脉络" @input="studio.changed()" /></section><section class="chapter-planning"><div class="section-heading"><h2>章节路线</h2><span class="muted">{{ studio.project.chapters.length }} 章 · 点击章节展开细纲</span></div><article v-for="(chapter, index) in studio.project.chapters" :key="chapter.id" class="planned-chapter" :class="{ expanded: expanded === chapter.id }"><button class="planned-chapter-heading" :aria-expanded="expanded === chapter.id" @click="expanded = expanded === chapter.id ? '' : chapter.id"><span class="chapter-number">{{ String(index + 1).padStart(2, '0') }}</span><span class="planned-title"><strong>{{ chapter.title }}</strong><span>{{ chapter.outline || '还没有章纲，给这个章节留一点未知。' }}</span></span><span class="status-label" :class="{ complete: chapterStatus(studio.project, studio.workflow, chapter.id) === '已定稿' }">{{ chapterStatus(studio.project, studio.workflow, chapter.id) }}</span><span class="chapter-words">{{ wordCount(chapter.content).toLocaleString() }} 字</span><AppIcon :name="expanded === chapter.id ? 'chevron-up' : 'chevron-down'" :size="16" /></button><div v-if="expanded === chapter.id" class="chapter-detail"><label :for="`title-${chapter.id}`">章节标题</label><input :id="`title-${chapter.id}`" v-model="chapter.title" :readonly="!studio.writable" @input="studio.changed()" /><label :for="`outline-${chapter.id}`">本章要发生什么</label><textarea :id="`outline-${chapter.id}`" v-model="chapter.outline" :readonly="!studio.writable" rows="5" @input="studio.changed()" /><div class="split-actions"><button class="button" :disabled="!studio.canGenerate || studio.running" @click="expand(chapter.id)"><AppIcon name="sparkles" :size="15" />AI 帮我细化</button><button class="button primary" @click="write(chapter.id)">进入本章写作<AppIcon name="arrow-right" :size="15" /></button></div></div></article></section><p class="section-note"><AppIcon name="route" :size="15" />建议先细化接下来的 2–3 章。更远的情节，留给故事自己生长。</p></div>
</template>
