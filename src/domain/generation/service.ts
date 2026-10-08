// ============================================================
// 生成服务 —— 伴写动作的 prompt 组装 + 多候选生成（纯逻辑，不碰 DOM）
// prompt 组装复用上下文组装器（分层优先级 + 预算），任务指令按动作追加；
// 多候选按「第 N 个候选方案」提示词并行生成，走向差异由提示词保证。
// 见 docs/设计方案-现状对标与蓝图.md §4.4（多候选与迭代）。
// ============================================================

import { buildLayersForScene } from '../context/assemble'
import type { NovelProjectDocumentV2, Scene } from '../model'

/** 最小流式接口（platform.streamGeneration 的收窄视图，避免领域层依赖平台层） */
export type StreamFn = (
  request: { role: 'authoring' | 'automation'; system?: string; prompt: string },
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
) => Promise<string>

export type CoWriteTarget = 'scene' | 'selection'

export interface CoWriteAction {
  key: string
  label: string
  instruction: string
  target: CoWriteTarget
}

/** AI 伴写栏的四个场景级动作（原型与界面同源） */
export const SCENE_ACTIONS: CoWriteAction[] = [
  { key: 'continue', label: '继续写作', instruction: '从正文结尾继续创作，推进明确事件，只返回新增内容。', target: 'scene' },
  { key: 'expand', label: '扩写场景', instruction: '扩写当前场景的感官细节与动作，不引入新情节。', target: 'scene' },
  { key: 'dialogue', label: '强化对白', instruction: '为当前场景补充自然、推动冲突的对白。', target: 'scene' },
  { key: 'foreshadow', label: '伏笔建议', instruction: '基于本章细纲与伏笔登记簿，给出 1-2 处自然且可回收的伏笔建议。', target: 'scene' },
]

/** 选区工具条的三个动作（选中文本后就地出现） */
export const SELECTION_ACTIONS: CoWriteAction[] = [
  { key: 'expand-sel', label: '扩写', instruction: '扩写选中段落，保留原意与叙事视角。', target: 'selection' },
  { key: 'describe', label: '补描写', instruction: '为选中段落补充五感描写，不推进情节。', target: 'selection' },
  { key: 'polish', label: '润色', instruction: '润色选中段落，保留剧情事实与叙事视角，提升画面感与节奏。', target: 'selection' },
]

export interface Candidate {
  id: string
  label: string
  target: CoWriteTarget
  text: string
  done: boolean
  error?: string
}

export interface ComposeOptions {
  /** 选区目标：注入选中段落并要求只返回改写结果 */
  selection?: string
  /** 用户自定义指令（覆盖动作自带指令） */
  custom?: string
  /** 多候选编号（从 1 开始）与总数 */
  variant?: number
  variantCount?: number
}

/**
 * 组装生成请求：分层上下文（含固定层 system）+ 当前正文 +（选区）+ 任务指令 +（多候选差异提示）。
 * 纯函数，单测覆盖。
 */
export function composeRequest(
  project: NovelProjectDocumentV2,
  scene: Scene,
  action: CoWriteAction,
  options: ComposeOptions = {},
): { role: 'authoring'; system: string; prompt: string } {
  const assembled = buildLayersForScene(project, scene)
  const system = assembled.layers.find(layer => layer.fixed && layer.content)?.content ?? ''
  const contextBlocks = assembled.layers
    .filter(layer => !layer.fixed && layer.content)
    .map(layer => `【${layer.label}】\n${layer.content}`)

  const parts: string[] = [...contextBlocks]
  if (action.target === 'selection' && options.selection) {
    parts.push(`【选中段落】\n${options.selection}`)
  } else if (scene.content.trim()) {
    parts.push(`【当前正文】\n${scene.content}`)
  }
  parts.push(`【任务】${options.custom?.trim() || action.instruction}`)
  if (action.target === 'selection') parts.push('只返回改写后的文本，不要任何解释。')
  if (options.variantCount && options.variantCount > 1) {
    parts.push(`这是第 ${options.variant} / ${options.variantCount} 个候选方案，请给出与其他方案明显不同的处理方式。`)
  }
  return { role: 'authoring', system, prompt: parts.join('\n\n') }
}

export const VARIANT_LABELS = ['候选 A', '候选 B', '候选 C']

export interface RunCandidatesDeps {
  stream: StreamFn
  project: NovelProjectDocumentV2
  scene: Scene
  action: CoWriteAction
  selection?: string
  custom?: string
  /** 候选数量，默认 2（并排对比） */
  count?: number
  signal?: AbortSignal
  onUpdate: (candidates: Candidate[]) => void
}

/** 并行生成多个候选，流式推送到 onUpdate（每次传不可变快照，供响应式框架消费） */
export async function runCandidates(deps: RunCandidatesDeps): Promise<Candidate[]> {
  const count = deps.count ?? 2
  const candidates: Candidate[] = Array.from({ length: count }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    label: VARIANT_LABELS[index] ?? `候选 ${index + 1}`,
    target: deps.action.target,
    text: '',
    done: false,
  }))
  const snapshot = () => candidates.map(candidate => ({ ...candidate }))
  deps.onUpdate(snapshot())

  await Promise.all(
    candidates.map(async (candidate, index) => {
      try {
        await deps.stream(
          composeRequest(deps.project, deps.scene, deps.action, {
            selection: deps.selection,
            custom: deps.custom,
            variant: index + 1,
            variantCount: count,
          }),
          chunk => {
            candidate.text += chunk
            deps.onUpdate(snapshot())
          },
          deps.signal,
        )
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          candidate.error = error instanceof Error ? error.message : String(error)
        }
      } finally {
        candidate.done = true
        deps.onUpdate(snapshot())
      }
    }),
  )
  return snapshot()
}
