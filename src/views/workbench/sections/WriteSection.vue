<template>
  <div class="write">
    <!-- 左：结构树 -->
    <aside class="tree">
      <template v-for="volume in project?.volumes ?? []" :key="volume.id">
        <div class="vol">{{ volume.title }}</div>
        <div v-for="chapter in volume.chapters" :key="chapter.id" class="ch-group">
          <div class="ch">{{ chapter.title }}</div>
          <button
            v-for="scene in chapter.scenes"
            :key="scene.id"
            class="sc"
            :class="{ on: scene.id === workspace.currentSceneId }"
            type="button"
            @click="workspace.selectScene(scene.id)"
          >
            <i class="dot" :data-status="scene.status" />
            {{ scene.title }}
          </button>
        </div>
      </template>
    </aside>

    <!-- 中：稿纸 -->
    <main class="manuscript">
      <div class="ctx-bar" v-if="assembled">
        <Icon icon="lucide:layers" width="14" />
        <span v-for="item in assembled.layers" :key="item.key" class="ctx-chip" :class="{ trimmed: item.trimmed }" :title="item.trimmed ? '超出预算，本轮未注入' : item.content.slice(0, 120)">
          {{ item.label }} · {{ item.tokens }}t
        </span>
        <span class="budget">{{ assembled.usedTokens }}t / {{ Math.round(assembled.budgetTokens / 1000) }}k 窗口</span>
      </div>

      <template v-if="scene">
        <h2>{{ scene.title }}</h2>
        <el-input v-model="draft" type="textarea" :rows="16" resize="none" placeholder="在这里写作。Milkdown 富文本与打字机模式在 M1 后半接入。" class="editor" />
        <footer class="editor-foot">
          <span>{{ scene.content.length }} 字 · 状态 {{ statusLabel(scene.status) }}</span>
          <el-button type="primary" size="small" :disabled="!dirty" @click="save">保存场景</el-button>
        </footer>
      </template>
      <el-empty v-else description="从左侧选择一个场景" />
    </main>

    <!-- 右：AI 伴写占位 -->
    <aside class="ai">
      <div class="ai-head">AI 伴写</div>
      <el-empty :description="t.workbench.aiPlaceholder" :image-size="72" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { buildLayersForScene } from '@/domain/context/assemble'
import { zhCN } from '@/locale/zh-CN'
import { useWorkspaceStore } from '@/stores/workspace'

const t = zhCN
const workspace = useWorkspaceStore()
const project = computed(() => workspace.current)
const scene = computed(() => workspace.currentScene)

// 编辑草稿：切换场景时重新同步，保存后与稿件对齐
const draft = ref('')
watch(() => scene.value?.id, () => { draft.value = scene.value?.content ?? '' }, { immediate: true })
watch(() => scene.value?.content, () => { draft.value = scene.value?.content ?? '' })
const dirty = computed(() => scene.value !== undefined && draft.value !== scene.value.content)

async function save() {
  if (!scene.value) return
  await workspace.saveScene({ ...scene.value, content: draft.value })
  ElMessage.success(t.workbench.saved)
}

function statusLabel(status: string) {
  return t.status[status] ?? status
}

// 上下文注入预览：领域模块直连 UI（M2 接入真实生成时即为此组装结果）
const assembled = computed(() => {
  if (!project.value || !scene.value) return undefined
  return buildLayersForScene(project.value, scene.value)
})
</script>

<style scoped lang="scss">
.write {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 220px minmax(0, 1fr) 260px;
}

.tree {
  overflow-y: auto;
  padding: 14px 10px;
  background: var(--cp-bg-elevated);
  border-right: 1px solid var(--cp-border-light);

  .vol {
    padding: 4px 8px;
    color: var(--cp-text);
    font-size: 12.5px;
    font-weight: 600;
  }

  .ch {
    margin: 6px 0 2px 12px;
    color: var(--cp-text-secondary);
    font-size: 12px;
  }

  .sc {
    display: flex;
    gap: 7px;
    align-items: center;
    width: 100%;
    margin-left: 12px;
    padding: 5px 8px;
    color: var(--cp-text-secondary);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: $radius-sm;
    font-size: 12.5px;

    &:hover { background: var(--cp-bg-hover); }
    &.on { background: var(--cp-primary-lighter); color: var(--cp-text); font-weight: 500; }

    .dot {
      flex: 0 0 auto;
      width: 6px;
      height: 6px;
      border-radius: 50%;

      &[data-status='done'] { background: var(--novel-status-done); }
      &[data-status='draft'] { background: var(--novel-status-draft); }
      &[data-status='outline'] { background: var(--novel-status-outline); }
      &[data-status='idea'] { background: var(--novel-status-idea); }
    }
  }
}

.manuscript {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 28px;

  .ctx-bar {
    display: flex;
    flex: 0 0 auto;
    gap: 6px;
    align-items: center;
    padding: 8px 10px;
    margin-bottom: 14px;
    overflow: hidden;
    color: var(--cp-text-tertiary);
    background: var(--cp-bg-elevated);
    border: 1px solid var(--cp-border-light);
    border-radius: $radius-md;

    .ctx-chip {
      padding: 2px 9px;
      white-space: nowrap;
      background: var(--cp-bg);
      border: 1px solid var(--cp-border-light);
      border-radius: $radius-full;
      font-size: 11px;

      &.trimmed {
        opacity: 0.45;
        text-decoration: line-through;
      }
    }

    .budget {
      flex: 0 0 auto;
      margin-left: auto;
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
  }

  h2 {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 600;
  }

  .editor {
    flex: 1;
    margin-top: 12px;

    :deep(.el-textarea__inner) {
      height: 100%;
      min-height: 320px;
      font-family: var(--font-serif);
      font-size: 15px;
      line-height: 2;
    }
  }

  .editor-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }
}

.ai {
  padding: 14px 12px;
  background: var(--cp-bg-elevated);
  border-left: 1px solid var(--cp-border-light);

  .ai-head {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
  }
}
</style>
