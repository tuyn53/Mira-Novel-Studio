<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import AppIcon from '@/components/AppIcon.vue'
const studio = useStudioStore()
const fields = [
  { key: 'background' as const, title: '故事从哪里开始', hint: '世界、情境与最初的那个意外。', rows: 4 },
  { key: 'characters' as const, title: '谁想要什么', hint: '主角的目标、弱点，以及他不能失去的东西。', rows: 5 },
  { key: 'relationships' as const, title: '人物之间的牵引', hint: '谁阻碍他，谁改变他，谁与他共享秘密。', rows: 4 },
  { key: 'plot' as const, title: '故事将走向哪里', hint: '主线冲突与重要转折，可以保留未知。', rows: 4 },
  { key: 'writingStyle' as const, title: '写作约定', hint: '叙事视角、语言气质与需要遵守的边界。', rows: 4 },
]
const prepared = computed(() => fields.filter(f => studio.project?.story[f.key]?.trim()).length)
</script>
<template>
  <div v-if="studio.project" class="page blueprint-page"><div class="page-heading"><div><h1>创作蓝图</h1><p>不用提前知道所有答案。先留住故事里最重要的东西。</p></div><RouterLink :to="`/book/${studio.project.id}/plan`" class="button primary">去规划章节<AppIcon name="arrow-right" :size="16" /></RouterLink></div><div class="blueprint-layout"><div class="blueprint-fields"><section v-for="field in fields" :key="field.key" class="blueprint-field"><div><label :for="field.key">{{ field.title }}</label><p>{{ field.hint }}</p></div><textarea :id="field.key" v-model="studio.project.story[field.key]" :readonly="!studio.writable" :rows="field.rows" :placeholder="field.hint" @input="studio.changed()" /></section></div><aside class="writing-guide"><AppIcon name="compass" :size="25" /><h2>先找到你的故事重心</h2><p>这里是写作的锚点，不是必须完成的问卷。你也可以直接开始第一章，再回来补全。</p><div class="guide-progress"><strong>{{ prepared }} / 5</strong><span>项蓝图已有内容</span></div><ul><li>一个有欲望的主角</li><li>一个让他无法回头的变化</li><li>一条值得追问的线索</li></ul><RouterLink :to="`/book/${studio.project.id}/write`" class="text-button">直接进入正文<AppIcon name="arrow-right" :size="15" /></RouterLink><div class="guide-note">全书保留方向，近期细化章节。计划可以随着人物的选择改变。</div></aside></div></div>
  <div v-else class="empty-state">尚未读取到作品。请从书架重新打开。</div>
</template>
