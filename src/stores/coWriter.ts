import { defineStore } from 'pinia'
import { ref } from 'vue'
import { runCandidates, type Candidate, type CoWriteAction, type StreamFn } from '@/domain/generation/service'
import type { NovelProjectDocumentV2, Scene } from '@/domain/model'

export interface CoWriteRunInput {
  stream: StreamFn
  project: NovelProjectDocumentV2
  scene: Scene
  action: CoWriteAction
  selection?: string
  custom?: string
  /** 按模块路由选出的模型 */
  modelId?: string
  count?: number
}

/**
 * 伴写会话状态：候选生成、流式更新、中断。
 * 数据不落库；采纳（写回稿件 + 快照）由视图层负责，见 WriteSection。
 */
export const useCoWriterStore = defineStore('coWriter', () => {
  const candidates = ref<Candidate[]>([])
  const running = ref(false)
  const actionLabel = ref('')
  const error = ref('')
  /** 选区上下文：存在时，自由指令作用于选中段落而非整场景 */
  const selectionContext = ref('')
  const acceptedId = ref('')
  let controller: AbortController | undefined

  async function run(input: CoWriteRunInput) {
    cancel()
    controller = new AbortController()
    error.value = ''
    acceptedId.value = ''
    actionLabel.value = input.action.label
    running.value = true
    try {
      await runCandidates({
        stream: input.stream,
        project: input.project,
        scene: input.scene,
        action: input.action,
        selection: input.selection,
        custom: input.custom,
        modelId: input.modelId,
        count: input.count ?? 2,
        signal: controller.signal,
        onUpdate: next => { candidates.value = next },
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      running.value = false
    }
  }

  function cancel() {
    controller?.abort()
    controller = undefined
    running.value = false
  }

  function discard(id: string) {
    candidates.value = candidates.value.filter(candidate => candidate.id !== id)
  }

  function markAccepted(id: string) {
    acceptedId.value = id
  }

  function clear() {
    cancel()
    candidates.value = []
    actionLabel.value = ''
    error.value = ''
    selectionContext.value = ''
    acceptedId.value = ''
  }

  return {
    candidates,
    running,
    actionLabel,
    error,
    selectionContext,
    acceptedId,
    run,
    cancel,
    discard,
    markAccepted,
    clear,
  }
})
