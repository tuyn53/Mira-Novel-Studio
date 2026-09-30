<template>
  <div class="plan">
    <div class="col">
      <h2>章节结构（只读 · 拖拽编排与卡片板在 M1 后半实现）</h2>
      <div v-for="volume in project?.volumes ?? []" :key="volume.id" class="vol">
        <h3>{{ volume.title }}</h3>
        <div v-for="chapter in volume.chapters" :key="chapter.id" class="ch-row">
          <strong>{{ chapter.title }}</strong>
          <span class="pill" :data-status="chapter.status">{{ statusLabel(chapter.status) }}</span>
          <span class="meta">{{ chapter.scenes.length }} 个场景 · {{ chapter.scenes.reduce((s, x) => s + x.content.length, 0) }} 字</span>
        </div>
      </div>
      <el-empty v-if="!project?.volumes.length" description="还没有卷章结构" />
    </div>

    <div class="col">
      <h2>伏笔登记簿</h2>
      <div v-for="item in project?.foreshadows ?? []" :key="item.id" class="fs-row">
        <strong>{{ item.title }}</strong>
        <span class="pill" :data-status="item.status">{{ foreshadowLabel(item.status) }}</span>
        <span class="meta">埋设 {{ item.plantedIn }}<template v-if="item.targetReveal"> · 计划回收 {{ item.targetReveal }}</template></span>
        <p v-if="item.note" class="note">{{ item.note }}</p>
      </div>
      <el-empty v-if="!project?.foreshadows.length" description="暂无伏笔登记" />

      <h2 class="gap">剧情线</h2>
      <div v-for="line in project?.plotLines ?? []" :key="line.id" class="fs-row">
        <i class="dot" :style="{ background: line.color }" />
        <strong>{{ line.name }}</strong>
        <span class="meta">{{ line.kind === 'main' ? '主线' : '暗线' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { zhCN } from '@/locale/zh-CN'
import { useWorkspaceStore } from '@/stores/workspace'

const t = zhCN
const workspace = useWorkspaceStore()
const project = computed(() => workspace.current)

function statusLabel(status: string) {
  return t.status[status] ?? status
}

function foreshadowLabel(status: string) {
  return { planted: '在册', due: '临近回收', resolved: '已回收' }[status] ?? status
}
</script>

<style scoped lang="scss">
.plan {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 20px 28px;
  overflow-y: auto;

  h2 {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;

    &.gap {
      margin-top: 26px;
    }
  }

  .vol h3 {
    margin: 12px 0 8px;
    font-size: 13px;
  }
}

.ch-row,
.fs-row {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 8px 10px;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;
  margin-bottom: 8px;

  .meta {
    margin-left: auto;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
  }

  .note {
    width: 100%;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }

  .dot {
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    border-radius: 3px;
  }
}

.pill {
  padding: 1px 8px;
  border-radius: $radius-full;
  background: var(--cp-bg-hover);
  color: var(--cp-text-secondary);
  font-size: 10.5px;

  &[data-status='due'] {
    background: rgba(245, 158, 11, 0.14);
    color: var(--cp-warning);
  }

  &[data-status='done'],
  &[data-status='resolved'] {
    background: rgba(16, 185, 129, 0.12);
    color: var(--cp-success);
  }
}
</style>
