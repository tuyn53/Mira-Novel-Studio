<template>
  <span class="cover-art" :class="classes">
    <i class="cv-title">{{ title }}</i>
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
</script>
