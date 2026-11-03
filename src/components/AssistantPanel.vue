<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { buildContext } from '@/domain/context'
import AppIcon from './AppIcon.vue'
const studio = useStudioStore()
const router = useRouter()
const tab = ref('assistant')
function switchTab(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  tab.value = event.key === 'Home' ? 'assistant' : event.key === 'End' ? 'context' : tab.value === 'assistant' ? 'context' : 'assistant'
  document.getElementById(tab.value + '-tab')?.focus()
}
const instruction = ref('')
const blocks = computed(() => studio.project && studio.chapter ? buildContext(studio.project, studio.chapter) : [])
const contextLength = computed(() => blocks.value.reduce((sum, block) => sum + block.text.length, 0))
const actions = [
  { label: '续写本章', append: true, icon: 'feather', instruction: '续写当前正文，从结尾接着写，推动本章目标。只返回新增正文。' },
  { label: '润色全文', append: false, icon: 'wand-sparkles', instruction: '润色当前正文，保持剧情和人物事实，返回完整的修改后正文。' },
]
async function run(value: string, target: 'content' | 'memory' = 'content', append = false) {
  if (!value.trim()) return
  try { const id = await studio.generate(value, target, append); if (id) await router.push(`/book/${studio.project!.id}/review?proposal=${id}`) }
  catch { /* The shared error banner reports the failure. */ }
}
</script>
<template>
  <aside class="assistant-panel" aria-label="AI 伴写与上下文">
    <div class="assistant-tabs" role="tablist" aria-label="伴写面板" @keydown="switchTab"><button id="assistant-tab" role="tab" :tabindex="tab === 'assistant' ? 0 : -1" :aria-selected="tab === 'assistant'" aria-controls="assistant-body" :class="{ active: tab === 'assistant' }" @click="tab = 'assistant'"><AppIcon name="sparkles" :size="16" />AI 伴写</button><button id="context-tab" role="tab" :tabindex="tab === 'context' ? 0 : -1" :aria-selected="tab === 'context'" aria-controls="context-body" :class="{ active: tab === 'context' }" @click="tab = 'context'">上下文<span>{{ blocks.length }}</span></button></div>
    <div v-if="tab === 'assistant'" id="assistant-body" role="tabpanel" aria-labelledby="assistant-tab" class="assistant-body">
      <div class="assistant-intro"><span class="assistant-symbol"><AppIcon name="feather" :size="22" /></span><h2>和你的故事一起想</h2><p>给出方向，AI 提出建议。<br>每次落稿，由你决定。</p></div>
      <div class="assistant-actions"><button v-for="action in actions" :key="action.label" :disabled="!studio.canGenerate || studio.running" @click="run(action.instruction, 'content', action.append)"><AppIcon :name="action.icon" :size="17" />{{ action.label }}<AppIcon name="arrow-up-right" :size="14" /></button></div>
      <section class="assistant-context-note"><h3><AppIcon name="paperclip" :size="14" />这次会参考</h3><div class="context-chips"><span>写作约定</span><span>本章章纲</span><span>已确认设定</span></div><button class="text-button" @click="tab = 'context'">查看完整上下文<AppIcon name="arrow-right" :size="13" /></button></section>
      <section v-if="studio.pending.length" class="pending-reminder"><div><AppIcon name="git-pull-request" :size="17" /><strong>{{ studio.pending.length }} 条建议等待你审阅</strong></div><p>{{ studio.preview ? '示例展示了正文与章纲两种提案。' : '建议已单独保存，还没有修改正文。' }}</p><RouterLink :to="`/book/${studio.project?.id}/review`" class="text-button">前往审阅<AppIcon name="arrow-right" :size="14" /></RouterLink></section>
      <div class="assistant-empty-note"><AppIcon name="quote" :size="18" /><p>写不下去时，试着想一想：<br>这个人物，此刻最害怕失去什么？</p></div>
      <form class="assistant-composer" @submit.prevent="run(instruction)"><label for="assistant-prompt" class="sr-only">给 AI 的创作要求</label><textarea id="assistant-prompt" v-model="instruction" :readonly="!studio.canGenerate" rows="3" :placeholder="studio.preview ? '创作接入完成后，可在这里提出要求…' : '告诉 AI 你想怎么写…'" /><div><span>{{ studio.running ? '正在等待 Mira 返回结果…' : studio.preview ? '浏览模式 · AI 不会运行' : '建议先进入审阅' }}</span><button type="submit" class="send-button" :disabled="!studio.canGenerate || studio.running || !instruction.trim()" aria-label="生成创作建议"><AppIcon :name="studio.running ? 'loader-circle' : 'arrow-up'" :size="17" :class="{ spin: studio.running }" /></button></div></form>
      <RouterLink v-if="!studio.preview && !studio.canGenerate" to="/settings" class="model-note">请先选择 Mira 中的创作模型</RouterLink><div v-else class="model-note"><AppIcon name="layers-2" :size="13" />模型能力由 Mira 提供</div>
    </div>
    <div v-else id="context-body" role="tabpanel" aria-labelledby="context-tab" class="context-body"><div class="context-summary"><h2>发送前，看得清</h2><p>当前参考内容约 {{ contextLength.toLocaleString() }} 字符。仅使用本章之前、与正文版本匹配的章节记忆。</p></div><details v-for="block in blocks" :key="block.label" class="context-block"><summary>{{ block.label }}<span>{{ block.text.length }} 字符</span></summary><p>{{ block.text }}</p><small v-if="block.omitted">内容已按当前字符预算截取。</small></details><p class="model-note">字符数为估算，不代表模型 token 用量。</p></div>
  </aside>
</template>
