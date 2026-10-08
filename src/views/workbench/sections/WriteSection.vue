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
            @click="pickScene(scene.id)"
          >
            <i class="dot" :data-status="scene.status" />
            {{ scene.title }}
          </button>
        </div>
      </template>
    </aside>

    <!-- 中：稿纸 -->
    <main ref="centerRef" class="manuscript">
      <!-- 上下文注入条 + Prompt 组装预览浮层 -->
      <div v-if="assembled" class="ctx-bar">
        <Icon class="ctx-ic" icon="lucide:layers" width="14" />
        <span
          v-for="layer in assembled.layers"
          :key="layer.key"
          class="ctx-chip"
          :class="{ trimmed: layer.trimmed }"
          :title="layer.trimmed ? '超出预算，本轮未注入' : layer.content.slice(0, 140)"
        >
          {{ layer.label }} · {{ layer.tokens }}t
        </span>
        <span class="budget">{{ assembled.usedTokens }}t / {{ Math.round(assembled.budgetTokens / 1000) }}k 窗口</span>
        <el-popover placement="bottom-end" :width="450" trigger="click" popper-class="ctx-popover">
          <template #reference>
            <button class="ghost-btn" type="button"><Icon icon="lucide:eye" width="13" />{{ t.workbench.contextPreview }}</button>
          </template>
          <div class="ctx-pop">
            <h3>Prompt 组装预览 <span>{{ t.workbench.contextHint }}</span></h3>
            <div v-for="(layer, index) in assembled.layers" :key="layer.key" class="layer" :class="{ trimmed: layer.trimmed }">
              <span class="pri" :style="{ background: PRIORITY_COLORS[index % PRIORITY_COLORS.length] }">{{ index + 1 }}</span>
              <div class="layer-main">
                <div class="layer-head">
                  <b>{{ layer.label }}</b>
                  <span class="tk">{{ layer.tokens }}t</span>
                  <span v-if="layer.trimmed" class="cut">超预算 · 已裁剪</span>
                  <span v-else-if="layer.fixed" class="fixed">固定层</span>
                </div>
                <p v-if="layer.content">{{ layer.content.slice(0, 200) }}{{ layer.content.length > 200 ? '…' : '' }}</p>
              </div>
            </div>
          </div>
        </el-popover>
      </div>

      <!-- 稿纸 -->
      <template v-if="scene">
        <div class="ms-head">
          <h2>{{ scene.title }}</h2>
          <div class="ms-meta">
            <span>{{ draft.length }} 字<template v-if="scene.wordTarget"> / {{ t.workbench.sceneTarget.replace('{n}', String(scene.wordTarget)) }}</template></span>
            <span class="status-pill" :data-status="scene.status">{{ statusLabel(scene.status) }}</span>
          </div>
        </div>
        <WriteEditor
          ref="editorRef"
          v-model="draft"
          :mode="editorMode"
          placeholder="在这里写作，或使用右侧 AI 伴写继续创作。选中文本可调用就地操作。"
          @selection-change="onEditorSelectionChange"
        />
        <footer class="editor-foot">
          <span class="save-state" :data-state="saveState">
            <i />
            {{ saveState === 'saving' ? t.workbench.saving : saveState === 'dirty' ? t.workbench.dirty : `${t.workbench.autosavedAt} · ${savedAtLabel}` }}
          </span>
          <div class="mode-toggle" role="group" aria-label="编辑器模式">
            <button type="button" :class="{ on: editorMode === 'markdown' }" @click="editorMode = 'markdown'">{{ t.workbench.richMode }}</button>
            <button type="button" :class="{ on: editorMode === 'plain' }" @click="editorMode = 'plain'">{{ t.workbench.plainMode }}</button>
          </div>
        </footer>
      </template>
      <el-empty v-else :description="t.workbench.emptyScene" />

      <!-- 选区工具条：编辑器内选中文本后就地出现（相对稿纸定位） -->
      <div
        v-if="selToolbar.visible"
        ref="selToolbarEl"
        class="sel-toolbar"
        :style="{ left: `${selToolbar.x}px`, top: `${selToolbar.y}px` }"
        role="toolbar"
        aria-label="选中文本 AI 操作"
      >
        <button v-for="action in SELECTION_ACTIONS" :key="action.key" type="button" @click="runSelectionAction(action)">
          {{ action.label }}
        </button>
        <span class="sep" />
        <button type="button" @click="useSelectionForCustom">指令改写…</button>
      </div>
    </main>

    <!-- 右：AI 伴写 -->
    <AiPanel
      :candidates="coWriter.candidates"
      :running="coWriter.running"
      :action-label="coWriter.actionLabel"
      :error="coWriter.error"
      :accepted-id="coWriter.acceptedId"
      :selection-active="Boolean(coWriter.selectionContext)"
      :instruction="instruction"
      @run="runSceneAction"
      @accept="acceptCandidate"
      @discard="coWriter.discard"
      @cancel="coWriter.cancel"
      @send="sendInstruction"
      @instruction-change="instruction = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AiPanel from '@/components/write/AiPanel.vue'
import WriteEditor from '@/components/write/WriteEditor.vue'
import { buildLayersForScene } from '@/domain/context/assemble'
import { SCENE_ACTIONS, SELECTION_ACTIONS, type CoWriteAction } from '@/domain/generation/service'
import { zhCN } from '@/locale/zh-CN'
import { getPlatformApi } from '@/platform'
import { useCoWriterStore } from '@/stores/coWriter'
import { useWorkspaceStore } from '@/stores/workspace'

const t = zhCN
const api = getPlatformApi()
const workspace = useWorkspaceStore()
const coWriter = useCoWriterStore()

const project = computed(() => workspace.current)
const scene = computed(() => workspace.currentScene)

// ---- 稿纸与自动保存 ----
const draft = ref('')
const editorMode = ref<'markdown' | 'plain'>('markdown')
const saveState = ref<'saved' | 'dirty' | 'saving'>('saved')
const savedAt = ref(new Date())
const savedAtLabel = computed(() => `${String(savedAt.value.getHours()).padStart(2, '0')}:${String(savedAt.value.getMinutes()).padStart(2, '0')}`)
const dirty = computed(() => Boolean(scene.value) && draft.value !== scene.value?.content)
let saveTimer: number | undefined

// ---- 选区工具条状态（需先于 immediate watch 声明）----
const centerRef = ref<HTMLElement>()
const editorRef = ref<InstanceType<typeof WriteEditor>>()
const selToolbarEl = ref<HTMLElement>()
const selToolbar = reactive({ visible: false, x: 0, y: 0, text: '' })

// 场景切换/首次加载时同步草稿（组件挂载时场景可能已就绪，故需 immediate）
watch(
  () => scene.value?.id,
  () => {
    draft.value = scene.value?.content ?? ''
    saveState.value = 'saved'
    savedAt.value = new Date()
    coWriter.clear()
    selToolbar.visible = false
  },
  { immediate: true },
)

watch(draft, () => {
  if (!scene.value) return
  saveState.value = 'dirty'
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => void save(), 800)
})

async function save() {
  if (!scene.value || !dirty.value) return
  saveState.value = 'saving'
  try {
    await workspace.saveScene({ ...scene.value, content: draft.value })
    saveState.value = 'saved'
    savedAt.value = new Date()
  } catch {
    saveState.value = 'dirty'
  }
}

async function flush() {
  window.clearTimeout(saveTimer)
  if (dirty.value) await save()
}

async function pickScene(id: string) {
  if (id === workspace.currentSceneId) return
  await flush()
  workspace.selectScene(id)
}

// ---- 上下文组装（与生成请求同源）----
const assembled = computed(() => {
  if (!project.value || !scene.value) return undefined
  return buildLayersForScene(project.value, scene.value)
})
const PRIORITY_COLORS = ['var(--cp-primary)', '#8f7ac4', 'var(--cp-gold)', '#5b8def', '#c9705f', '#4d9e7f']

function onEditorSelectionChange(event: MouseEvent) {
  const text = editorRef.value?.getSelection() ?? ''
  if (!text.trim()) {
    selToolbar.visible = false
    return
  }
  const rect = centerRef.value?.getBoundingClientRect()
  if (!rect) return
  selToolbar.text = text
  selToolbar.x = Math.min(Math.max(event.clientX - rect.left - 110, 8), Math.max(rect.width - 300, 8))
  selToolbar.y = Math.max(event.clientY - rect.top - 46, 8)
  selToolbar.visible = true
}

function onDocMouseDown(event: MouseEvent) {
  if (!selToolbar.visible) return
  if (selToolbarEl.value?.contains(event.target as Node)) return
  selToolbar.visible = false
}

onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown)
  window.clearTimeout(saveTimer)
})

// ---- 伴写：运行 / 采纳 / 指令 ----
const instruction = ref('')

async function startRun(action: CoWriteAction, selection?: string, custom?: string) {
  const currentProject = project.value
  const currentScene = scene.value
  if (!currentProject || !currentScene) return
  await coWriter.run({
    stream: (request, onChunk, signal) => api.streamGeneration(request, onChunk, signal),
    project: currentProject,
    scene: currentScene,
    action,
    selection,
    custom,
  })
}

async function runSceneAction(key: string) {
  const action = SCENE_ACTIONS.find(item => item.key === key)
  if (!action) return
  coWriter.selectionContext = ''
  await startRun(action)
}

async function runSelectionAction(action: CoWriteAction) {
  selToolbar.visible = false
  coWriter.selectionContext = selToolbar.text
  await startRun(action, selToolbar.text)
}

function useSelectionForCustom() {
  selToolbar.visible = false
  coWriter.selectionContext = selToolbar.text
}

async function sendInstruction() {
  const text = instruction.value.trim()
  if (!text) return
  const selection = coWriter.selectionContext || undefined
  instruction.value = ''
  await startRun(
    { key: 'custom', label: '指令改写', instruction: text, target: selection ? 'selection' : 'scene' },
    selection,
    text,
  )
}

async function acceptCandidate(id: string) {
  const candidate = coWriter.candidates.find(item => item.id === id)
  const currentProject = project.value
  const currentScene = scene.value
  const editor = editorRef.value
  if (!candidate || candidate.error || !currentProject || !currentScene || !editor) return
  const text = candidate.text.trim()
  if (!text) return

  await api.createSnapshot({
    projectId: currentProject.id,
    targetType: 'scene',
    targetId: currentScene.id,
    reason: 'ai-apply',
    content: draft.value,
  })

  if (candidate.target === 'selection') {
    editor.replaceSelection(text)
  } else {
    draft.value = draft.value.trim() ? `${draft.value.trimEnd()}\n\n${text}` : text
  }
  coWriter.markAccepted(id)
  await flush()
  ElMessage.success(t.ai.accepted)
}

function statusLabel(status: string) {
  return t.status[status] ?? status
}
</script>

<style scoped lang="scss">
.write {
  position: relative;
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 220px minmax(0, 1fr) 320px;
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
    width: calc(100% - 12px);
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
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 14px 26px 12px;
}

.ctx-bar {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 12px;
  overflow: hidden;
  color: var(--cp-text-tertiary);
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;

  .ctx-ic { flex: 0 0 auto; }

  .ctx-chip {
    padding: 2px 9px;
    white-space: nowrap;
    background: var(--cp-bg);
    border: 1px solid var(--cp-border-light);
    border-radius: $radius-full;
    font-size: 11px;

    &.trimmed {
      opacity: 0.5;
      text-decoration: line-through;
    }
  }

  .budget {
    flex: 0 0 auto;
    margin-left: auto;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .ghost-btn {
    display: flex;
    flex: 0 0 auto;
    gap: 4px;
    align-items: center;
    height: 24px;
    padding: 0 9px;
    color: var(--cp-text-secondary);
    background: var(--cp-bg-elevated);
    border: 1px solid var(--cp-border);
    border-radius: $radius-sm;
    font-size: 11px;

    &:hover {
      color: var(--cp-text);
      border-color: var(--cp-text-tertiary);
    }
  }
}

.ms-head {
  display: flex;
  flex: 0 0 auto;
  align-items: baseline;
  justify-content: space-between;
  gap: $spacing-sm;
  margin-bottom: 10px;

  h2 {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 600;
  }

  .ms-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
  }
}

.status-pill {
  padding: 2px 9px;
  background: var(--cp-bg-hover);
  border-radius: $radius-full;
  color: var(--cp-text-secondary);
  font-size: 10.5px;
  font-weight: 500;

  &[data-status='done'] { background: rgba(20, 106, 62, 0.12); color: var(--cp-success); }
  &[data-status='draft'] { background: var(--cp-primary-light); color: var(--cp-primary-hover); }
}

.editor-foot {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: 8px 2px 0;
}

.save-state {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  color: var(--cp-text-tertiary);
  font-size: 11.5px;

  i {
    width: 6px;
    height: 6px;
    background: var(--cp-success);
    border-radius: 50%;
  }

  &[data-state='dirty'] i { background: var(--cp-warning); }
  &[data-state='saving'] i { background: var(--cp-info); }
}

.mode-toggle {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--cp-border);
  border-radius: $radius-sm;

  button {
    padding: 3px 11px;
    color: var(--cp-text-tertiary);
    background: transparent;
    border: 0;
    font-size: 11px;

    &.on {
      color: var(--cp-text);
      background: var(--cp-bg-hover);
      font-weight: 500;
    }
  }
}

// 选区工具条：悬浮在稿纸选中位置上方（绝对定位相对 .manuscript）
.sel-toolbar {
  position: absolute;
  z-index: 30;
  display: flex;
  gap: 2px;
  align-items: center;
  padding: 4px;
  background: var(--cp-bg-overlay);
  border: 1px solid var(--cp-border);
  border-radius: 9px;
  box-shadow: $shadow-md;
  animation: toolbar-in 0.16s ease-out;

  button {
    padding: 4px 10px;
    color: var(--cp-text-secondary);
    background: transparent;
    border: 0;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;

    &:hover {
      color: var(--cp-text);
      background: var(--cp-bg-hover);
    }
  }

  .sep {
    width: 1px;
    height: 16px;
    margin: 0 3px;
    background: var(--cp-border);
  }
}

@keyframes toolbar-in {
  from { opacity: 0; transform: translateY(-4px); }
}
</style>
