// ============================================================
// 上下文组装器 —— 分层优先级 + token 预算裁剪（纯函数，无 DOM，vitest 重点覆盖）
// 分层模型参考 QMAI 的优先级上下文包与 NovelAI 的固定层结构：
//   1 创作规范（固定） → 2 实体卡 → 3 前情摘要链 → 4 本章细纲 → 5 上章结尾原文（最先裁）
// 见 docs/设计方案-现状对标与蓝图.md §4.4。
// ============================================================

import type { Entity, NovelProjectDocumentV2, Scene } from '../model'

export interface ContextLayer {
  key: string
  /** 展示名，如「实体卡 ×3」「上章结尾」 */
  label: string
  /** 注入优先级，1 最高；预算不足时从大到小裁剪 */
  priority: number
  content: string
  /** 固定层：超预算也不裁剪（如创作规范/文风） */
  fixed?: boolean
}

export interface AssembledLayer {
  key: string
  label: string
  priority: number
  tokens: number
  content: string
  trimmed: boolean
  /** 固定层：超预算也不裁剪（透传自 ContextLayer） */
  fixed?: boolean
}

export interface AssembledContext {
  layers: AssembledLayer[]
  usedTokens: number
  budgetTokens: number
}

/**
 * token 估算（仅用于预算显示与裁剪决策，不追求精确）：
 * CJK 字符 ≈ 1 token，其余按空白切词 ≈ 1.3 token/词。
 */
export function estimateTokens(text: string): number {
  let cjk = 0
  let rest = ''
  for (const ch of text) {
    if (/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff]/.test(ch)) cjk++
    else rest += ch
  }
  const words = rest.split(/\s+/).filter(Boolean).length
  return Math.round(cjk + words * 1.3)
}

/**
 * 按优先级升序装填预算：装不下的层标记 trimmed（内容置空），
 * 但继续尝试后续更小的层（填满剩余预算）；fixed 层无条件保留。
 */
export function assembleContext(layers: ContextLayer[], budgetTokens: number): AssembledContext {
  const sorted = [...layers].sort((a, b) => a.priority - b.priority)
  let used = 0
  const out = sorted.map(layer => {
    const tokens = estimateTokens(layer.content)
    if (layer.fixed || used + tokens <= budgetTokens) {
      used += tokens
      return { ...layer, tokens, trimmed: false }
    }
    return { ...layer, tokens, content: '', trimmed: true }
  })
  return { layers: out, usedTokens: used, budgetTokens }
}

const TAIL_CHARS = 400

/** 上章结尾原文：取上一场景（或上一章末场景）结尾原文，保证叙事衔接 */
function previousTail(project: NovelProjectDocumentV2, scene: Scene): string {
  const scenes = project.volumes.flatMap(v => v.chapters.flatMap(c => c.scenes))
  const index = scenes.findIndex(s => s.id === scene.id)
  if (index <= 0) return ''
  const prev = scenes[index - 1]
  return prev.content.slice(-TAIL_CHARS)
}

/** 实体卡内容：结构化字段拼为「字段名：值」清单 */
function renderEntity(entity: Entity): string {
  const fields = Object.entries(entity.fields).map(([k, v]) => `${k}：${v}`)
  const aliases = entity.aliases.length ? `（别名：${entity.aliases.join('、')}）` : ''
  return [`${entity.name}${aliases}`, ...fields, entity.notes].filter(Boolean).join('\n')
}

/**
 * 为指定场景组装标准五层上下文。
 * mode='never' 的实体不注入；'always'/'mentioned' 在骨架阶段统一注入
 * （提及检测依赖正文扫描，属 M2 功能，接口保持不变）。
 */
export function buildLayersForScene(
  project: NovelProjectDocumentV2,
  scene: Scene,
  options: { budgetTokens: number } = { budgetTokens: 128_000 },
): AssembledContext {
  const chapter = project.volumes.flatMap(v => v.chapters).find(c => c.scenes.some(s => s.id === scene.id))
  const cast = [...scene.characterIds, scene.locationId].filter((id): id is string => Boolean(id))
  const entities = project.entities.filter(e => cast.includes(e.id) && e.injection.mode !== 'never')
  const entityText = entities.map(renderEntity).join('\n\n')
  const summaries = project.volumes
    .flatMap(v => v.chapters)
    .filter(c => c.summary && c.id !== chapter?.id)
    .map(c => `【${c.title}】${c.summary}`)
    .join('\n')

  return assembleContext(
    [
      {
        key: 'system',
        label: '创作规范',
        priority: 1,
        fixed: true,
        content: `保持作品的叙事视角、人物关系与文风，避免复述已有内容。\n题材：${project.meta.genre}\n内核：${project.meta.coreIdea}`,
      },
      {
        key: 'entities',
        label: `实体卡 ×${entities.length}`,
        priority: 2,
        content: entityText,
      },
      {
        key: 'summary-chain',
        label: `前情摘要 ×${summaries ? summaries.split('【').length - 1 : 0}`,
        priority: 3,
        content: summaries,
      },
      {
        key: 'chapter-outline',
        label: '本章细纲',
        priority: 4,
        content: chapter?.summary || chapter?.title || '',
      },
      {
        key: 'prev-tail',
        label: '上章结尾',
        priority: 5,
        content: previousTail(project, scene),
      },
    ],
    options.budgetTokens,
  )
}
