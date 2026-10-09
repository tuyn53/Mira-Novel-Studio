<template>
  <span
    ref="rootEl"
    class="cover-art"
    :class="classes"
    :style="{ '--cv-scale': String(scale), '--cv-width': `${baseWidthEm}em` }"
  >
    <i ref="titleEl" class="cv-title">{{ displayTitle }}</i>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { coverRenderClasses } from '@/domain/cover'
import type { ProjectCover } from '@/domain/model'

const props = defineProps<{
  title: string
  cover?: ProjectCover
}>()

// 模板 class 优先于色板 class（样式表顺序保证模板背景覆盖色板背景）
const classes = computed(() => coverRenderClasses(props.cover, props.title))

/** 完整书名，绝不截断——长名靠排版与字号自适应放下 */
const displayTitle = computed(() => props.title.trim() || '未命名作品')

/** 基础（纯色板）横排封面的每行字数：书越长行越宽，避免竖堆成细柱 */
const baseWidthEm = computed(() => {
  const length = [...displayTitle.value].length
  if (length <= 10) return 2
  if (length <= 14) return 3
  if (length <= 20) return 4
  return 5
})

/** 字号估计（首帧近似值；随后按实际渲染尺寸逐档微调直到完整放下） */
const estimatedScale = computed(() => {
  const length = [...displayTitle.value].length
  if (length <= 6) return 1
  if (length <= 10) return 1
  if (length <= 14) return 0.92
  if (length <= 18) return 0.86
  if (length <= 24) return 0.78
  if (length <= 32) return 0.68
  if (length <= 44) return 0.58
  if (length <= 60) return 0.5
  return 0.44
})

const MIN_SCALE = 0.34
const scale = ref(estimatedScale.value)
const rootEl = ref<HTMLElement>()
const titleEl = ref<HTMLElement>()
let fitTimer: number | undefined

/** 内容是否在排版盒内（scroll 尺寸反映真实内容，overflow 裁切不影响判断） */
function fits(): boolean {
  const title = titleEl.value
  if (!title) return true
  return title.scrollHeight <= title.clientHeight + 1 && title.scrollWidth <= title.clientWidth + 1
}

/** 从估计字号出发几何下降，直到标题完整落入封面（含 1px 舍入容差） */
async function refine() {
  await nextTick()
  let candidate = estimatedScale.value
  for (let i = 0; i < 18; i++) {
    scale.value = candidate
    await nextTick()
    if (fits()) return
    if (candidate <= MIN_SCALE) return
    candidate = Math.max(MIN_SCALE, candidate * 0.9)
  }
}

/** 标题或模板变化：先用估计值即时渲染，再防抖做精确微调（输入中不抖动） */
function scheduleFit() {
  scale.value = estimatedScale.value
  window.clearTimeout(fitTimer)
  fitTimer = window.setTimeout(() => void refine(), 120)
}

watch([displayTitle, baseWidthEm], scheduleFit)
watch(() => props.cover?.template, scheduleFit)
onMounted(() => void refine())
onBeforeUnmount(() => window.clearTimeout(fitTimer))
</script>
