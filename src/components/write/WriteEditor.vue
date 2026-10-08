<template>
  <div class="write-editor">
    <div v-if="mode === 'markdown'" ref="host" class="editor-host" @mouseup="$emit('selection-change', $event)" />
    <textarea
      v-else
      ref="plain"
      class="editor-plain"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onPlainInput"
      @mouseup="$emit('selection-change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { replaceAll } from '@milkdown/kit/utils'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import '@milkdown/crepe/theme/common/style.css'

const props = defineProps<{
  modelValue: string
  mode: 'markdown' | 'plain'
  placeholder: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'selection-change': [event: MouseEvent]
}>()

const host = ref<HTMLElement>()
const plain = ref<HTMLTextAreaElement>()
let crepe: Crepe | undefined
let syncing = false

// Crepe 特性裁剪：关闭自带选区内联工具条（选区动作由我们自己的 AI 工具条承担）、
// 代码块增强与 LaTeX（小说写作不需要，且 LaTeX 依赖 CodeMirror，须成对关闭）、图片块
async function createEditor() {
  if (!host.value || crepe) return
  const instance = new Crepe({
    root: host.value,
    defaultValue: props.modelValue,
    features: {
      [Crepe.Feature.TopBar]: false,
      [Crepe.Feature.Toolbar]: false,
      [Crepe.Feature.CodeMirror]: false,
      [Crepe.Feature.Latex]: false,
      [Crepe.Feature.ImageBlock]: false,
    },
    featureConfigs: {
      [Crepe.Feature.Placeholder]: { text: props.placeholder, mode: 'doc' },
    },
  })
  instance.on(listener => listener.markdownUpdated((_ctx, value) => {
    if (!syncing) emit('update:modelValue', value)
  }))
  await instance.create()
  crepe = instance
}

function updateEditor(value: string) {
  if (!crepe || crepe.getMarkdown() === value) return
  syncing = true
  crepe.editor.action(replaceAll(value))
  syncing = false
}

watch(() => props.modelValue, updateEditor)
watch(() => props.mode, async () => {
  await nextTick()
  if (props.mode === 'markdown') void createEditor()
})
onMounted(() => {
  if (props.mode === 'markdown') void nextTick(createEditor)
})
onBeforeUnmount(() => {
  void crepe?.destroy()
  crepe = undefined
})

function onPlainInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

/** 当前选中文本（两种模式统一接口），空串表示无选区 */
function getSelection(): string {
  if (props.mode === 'plain') {
    const el = plain.value
    if (!el) return ''
    return el.value.slice(el.selectionStart, el.selectionEnd)
  }
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !host.value?.contains(sel.anchorNode)) return ''
  return sel.toString()
}

/** 用文本替换当前选区（采纳选区动作结果时调用） */
function replaceSelection(text: string) {
  if (props.mode === 'plain') {
    const el = plain.value
    if (!el) return
    const next = el.value.slice(0, el.selectionStart) + text + el.value.slice(el.selectionEnd)
    emit('update:modelValue', next)
    return
  }
  const view = crepe?.editor.ctx.get(editorViewCtx)
  if (!view || view.state.selection.empty) return
  view.focus()
  view.dispatch(view.state.tr.insertText(text))
}

/** 在正文末尾追加（采纳场景级动作结果时调用） */
function insertAtEnd(text: string) {
  if (props.mode === 'plain') {
    const next = props.modelValue.trim() ? `${props.modelValue}\n\n${text}` : text
    emit('update:modelValue', next)
    return
  }
  const view = crepe?.editor.ctx.get(editorViewCtx)
  if (!view) return
  view.focus()
  view.dispatch(view.state.tr.insertText(text, view.state.doc.content.size))
}

function focus() {
  if (props.mode === 'plain') plain.value?.focus()
  else crepe?.editor.ctx.get(editorViewCtx)?.focus()
}

defineExpose({ getSelection, replaceSelection, insertAtEnd, focus })
</script>

<style scoped lang="scss">
.write-editor {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.editor-host {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;
}

.editor-plain {
  flex: 1;
  min-height: 320px;
  padding: 20px 24px;
  color: var(--cp-text);
  resize: none;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;
  outline: 0;
  font-family: var(--font-serif);
  font-size: 15.5px;
  line-height: 2.05;

  &::placeholder {
    color: var(--cp-text-placeholder);
  }

  &:focus {
    border-color: var(--cp-primary);
  }
}

// Milkdown Crepe 主题变量映射到 --cp 令牌（与 Mira-Harness 的适配同源，见其 NovelMarkdownEditor）
.editor-host :deep(.milkdown) {
  --crepe-color-background: var(--cp-bg-elevated);
  --crepe-color-on-background: var(--cp-text);
  --crepe-color-surface: var(--cp-bg-elevated);
  --crepe-color-surface-low: var(--cp-bg);
  --crepe-color-on-surface: var(--cp-text);
  --crepe-color-on-surface-variant: var(--cp-text-secondary);
  --crepe-color-outline: var(--cp-text-secondary);
  --crepe-color-primary: var(--cp-primary);
  --crepe-color-secondary: var(--cp-primary-light);
  --crepe-color-on-secondary: var(--cp-text);
  --crepe-color-hover: var(--cp-bg-hover);
  --crepe-color-selected: var(--cp-primary-lighter);
  --crepe-color-inline-area: var(--cp-bg);
  --crepe-font-title: var(--font-serif);
  --crepe-font-default: var(--font-serif);
  --crepe-shadow-1: none;
  --crepe-shadow-2: none;

  height: 100%;
  color: var(--cp-text);
  background: transparent;
}

.editor-host :deep(.milkdown .ProseMirror) {
  min-height: 100%;
  padding: 22px 26px 60px;
  font-family: var(--font-serif);
  font-size: 15.5px;
  line-height: 2.05;
  outline: 0;
}

.editor-host :deep(.milkdown .crepe-placeholder::before) {
  color: var(--cp-text-placeholder);
}
</style>
