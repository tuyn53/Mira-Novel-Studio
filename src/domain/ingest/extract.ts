// ============================================================
// 定稿摄取提案（M3 实现）—— 章节「定稿」后由 automation 模型提取
// 角色状态/关系变化/伏笔/时间线，以提案形式呈现，确认后写回实体库。
// 降级策略（选型 §5）：优先 JSON，小模型输出不规范时回退分隔符文本协议解析 + 本地校验。
// 本文件先锁定契约，实现在 M3 交付。
// ============================================================

import type { Entity } from '../model'

export interface IngestionProposal {
  entity: Pick<Entity, 'id' | 'kind' | 'name'>
  /** 本章确立的新事实（字段级） */
  fieldUpdates: Array<{ field: string; value: string; sourceSceneId: string }>
  /** 关系变化，如「阿萤 ←共生→ 沈砚（灯与灵）」 */
  relationUpdates: Array<{ targetEntityId: string; kind: string; direction: string }>
  /** 伏笔状态推进 */
  foreshadowUpdates: Array<{ foreshadowId: string; to: 'planted' | 'due' | 'resolved'; sceneId: string }>
}

export interface IngestionRequest {
  projectId: string
  chapterId: string
  sceneContents: string[]
  currentEntities: Entity[]
}

export type IngestionRunner = (request: IngestionRequest) => Promise<IngestionProposal[]>

export const ingestionRunner: IngestionRunner = async () => {
  throw new Error('定稿摄取将在 M3 实现（见 docs/技术选型-定案.md §6）')
}
