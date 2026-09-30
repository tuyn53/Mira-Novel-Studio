<template>
  <div class="review">
    <el-empty :description="t.workbench.reviewPlaceholder" :image-size="96">
      <template #description>
        <p>{{ t.workbench.reviewPlaceholder }}</p>
        <p class="hint">领域模块已就绪：src/domain/review/diff.ts（段落对齐）已有单测，等审阅队列 UI 接入</p>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { zhCN } from '@/locale/zh-CN'

const t = zhCN
</script>

<style scoped lang="scss">
.review {
  display: grid;
  flex: 1;
  place-items: center;

  .hint {
    margin-top: 6px;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }
}
</style>
