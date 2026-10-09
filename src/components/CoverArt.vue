<template>
  <span class="cover-art" :class="classes" :style="{ '--cv-scale': String(titleScale) }">
    <i class="cv-title">{{ displayTitle }}</i>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { coverRenderClasses } from '@/domain/cover'
import type { ProjectCover } from '@/domain/model'

const props = defineProps<{
  title: string
  cover?: ProjectCover
}>()

// 模板 class 优先于色板 class（样式表顺序保证模板背景覆盖色板背景）
const classes = computed(() => coverRenderClasses(props.cover, props.title))

/** 封面显示名的截断上限：书名可能很长（网文常见 15-25 字），封面只承载可读的前段 */
const TITLE_MAX_CHARS = 16

const displayTitle = computed(() => {
  const raw = props.title.trim() || '未命名作品'
  const chars = [...raw]
  return chars.length > TITLE_MAX_CHARS ? `${chars.slice(0, TITLE_MAX_CHARS).join('')}…` : raw
})

/**
 * 字号自适应：按字符数分档缩放（--cv-scale 由样式表各模板的 font-size 乘用），
 * 保证长书名在 3:4 封面内不溢出——超出部分再经 max-width/max-height + overflow 兜底裁切。
 */
const titleScale = computed(() => {
  const length = [...displayTitle.value].length
  if (length <= 5) return 1
  if (length <= 8) return 0.84
  if (length <= 11) return 0.7
  if (length <= 14) return 0.58
  return 0.5
})
</script>
