<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { alignParagraphs } from '@/domain/review/diff'
import AppIcon from '@/components/AppIcon.vue'
const studio = useStudioStore()
const route = useRoute()
const selected = ref(String(route.query.proposal ?? ''))
const filter = ref('pending')
const busy = ref(false)
const choices = ref<Record<number, boolean>>({})
const changeCursor = ref(0)
const changes = computed(() => ops.value.flatMap((op, index) => op.kind === 'replace' ? [index] : []))
async function jumpChange(direction = 0) {
  if (!changes.value.length) return
  changeCursor.value = (changeCursor.value + direction + changes.value.length) % changes.value.length
  await nextTick()
  const row = document.getElementById('diff-' + changes.value[changeCursor.value])
  const scroll = row?.closest('.diff-scroll')
  if (row && scroll) scroll.scrollTop = Math.max(0, row.offsetTop - 24)
}
const items = computed(() => studio.workflow.proposals.filter(p => filter.value === 'all' || p.status === 'pending'))
const proposal = computed(() => items.value.find(p => p.id === selected.value) ?? items.value[0])
const ops = computed(() => proposal.value ? alignParagraphs(proposal.value.baseText, proposal.value.text) : [])
const statusText = { pending: '待审阅', accepted: '已采纳', rejected: '已保留原文' }
watch(() => proposal.value?.id, async () => {
  choices.value = {}; changeCursor.value = 0
  if (proposal.value) studio.chapterId = proposal.value.chapterId
  await jumpChange()
}, { immediate: true })
const result = computed(() => ops.value.map((op, index) => op.kind === 'equal' || choices.value[index] === false ? op.old : op.new).filter(Boolean).join('\n\n'))
async function decide(accept: boolean) {
  if (!proposal.value) return
  busy.value = true
  try { if (accept) await studio.acceptProposal(proposal.value.id, result.value); else await studio.rejectProposal(proposal.value.id) }
  catch (err) { studio.error = err instanceof Error ? err.message : String(err) }
  finally { busy.value = false }
}
async function clear() { try { await studio.clearHistory() } catch (err) { studio.error = String(err) } }
</script>
<template>
  <div v-if="studio.project" class="review-page"><div class="page-heading"><div><h1>审阅<span class="heading-count">{{ studio.pending.length }}</span></h1><p>AI 提出一种可能，你决定故事最终的样子。</p></div><div class="review-top-actions"><button class="text-button" :disabled="!studio.writable || !studio.workflow.proposals.some(p => p.status !== 'pending')" @click="clear">清理已处理记录</button><span v-if="studio.preview" class="subtle-tag">示例提案</span></div></div><div class="review-layout"><aside class="review-index"><div class="filter-tabs" role="group" aria-label="审阅筛选"><button :class="{ active: filter === 'pending' }" @click="filter = 'pending'">待审阅 {{ studio.pending.length }}</button><button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button></div><button v-for="item in items" :key="item.id" class="proposal-item" :class="{ active: proposal?.id === item.id }" @click="selected = item.id"><span class="proposal-type"><AppIcon :name="item.target === 'memory' ? 'brain' : item.target === 'outline' ? 'list-tree' : 'file-pen-line'" :size="16" />{{ item.target === 'memory' ? '记忆提案' : item.target === 'outline' ? '章纲建议' : '正文建议' }}</span><strong>{{ item.title }}</strong><p>{{ item.instruction }}</p><small>{{ statusText[item.status] }}</small></button><div v-if="!items.length" class="empty-state compact"><AppIcon name="circle-check" :size="25" />所有建议都已处理。</div></aside><section v-if="proposal" class="review-detail"><div class="review-detail-heading"><div><h2>{{ proposal.title }}</h2><p>{{ proposal.target === 'memory' ? '确认后存为章节摘要，并记录当前正文的定稿版本。' : '可以逐段选择，正文在你确认前保持原样。' }}</p></div><span class="status-label">{{ statusText[proposal.status] }}</span></div><div class="diff-navigation"><span>{{ changes.length }} 处修改 · 当前第 {{ changes.length ? changeCursor + 1 : 0 }} 处</span><div><button class="text-button" :disabled="!changes.length" @click="jumpChange(-1)"><AppIcon name="arrow-up" :size="13" />上一处</button><button class="text-button" :disabled="!changes.length" @click="jumpChange(1)">下一处<AppIcon name="arrow-down" :size="13" /></button></div></div><div class="diff-headings"><span>{{ proposal.target === 'memory' ? '记忆提案' : '当前原文' }}</span><span>建议内容</span></div><div class="diff-scroll"><div v-for="(op, index) in ops" :key="index" :id="'diff-' + index" class="diff-row" :class="{ changed: op.kind === 'replace', kept: choices[index] === false }"><div class="diff-old"><span v-if="op.kind === 'replace'" class="diff-mark">{{ op.old ? '原' : '' }}</span><p>{{ op.old || (proposal.target === 'memory' ? '尚未写入作品记忆' : '此处新增内容') }}</p></div><div class="diff-new"><div v-if="op.kind === 'replace'" class="diff-choice"><span>{{ op.new ? '修改建议' : '建议删除' }}</span><label v-if="proposal.status === 'pending' && proposal.target !== 'memory'"><input type="checkbox" :checked="choices[index] !== false" :disabled="!studio.writable" @change="choices[index] = ($event.target as HTMLInputElement).checked" />采纳此段</label></div><p>{{ op.new || '删除此段' }}</p></div></div></div><footer class="review-footer"><span>{{ studio.preview ? '浏览模式 · 采纳与保存需在 Mira 中完成' : '确认后会保存到 Mira' }}</span><div><button class="button" :disabled="!studio.writable || busy || proposal.status !== 'pending'" @click="decide(false)">{{ proposal.target === 'memory' ? '暂不记录' : '保留原文' }}</button><button class="button primary" :disabled="!studio.writable || busy || proposal.status !== 'pending' || !result.trim()" @click="decide(true)"><AppIcon name="check" :size="16" />{{ busy ? '正在保存…' : proposal.target === 'memory' ? '确认记忆并定稿' : '应用所选修改' }}</button></div></footer></section><div v-else class="review-detail empty-state"><AppIcon name="git-pull-request" :size="35" /><h2>每一次修改，都由你决定</h2><p>正文、章纲和记忆提案会在这里等待确认。</p><RouterLink :to="`/book/${studio.project.id}/write`" class="button">回到写作<AppIcon name="arrow-right" :size="15" /></RouterLink></div></div></div>
</template>
