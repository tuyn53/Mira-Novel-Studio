// ============================================================
// Mira Novel Studio 数据契约 v2 —— 卷 → 章 → 场景 + 实体库 + 安全网
// 本文件是宿主（Mira-Harness novelStore v2）与渲染层的共同契约：
// 渲染层只通过 src/platform 访问数据，表结构/持久化细节归宿主。
// 字段设计依据 docs/设计方案-现状对标与蓝图.md §4.3。
// ============================================================

/** 作品结构：卷 → 章 → 场景，场景是最小写作单元 */
export type ChapterStatus = 'idea' | 'outline' | 'draft' | 'done'

export interface Scene {
  id: string
  title: string
  sort: number
  content: string
  status: ChapterStatus
  /** 视角人物（实体 id） */
  povCharacterId?: string
  /** 出场角色（实体 id） */
  characterIds: string[]
  locationId?: string
  plotLineIds: string[]
  wordTarget?: number
}

export interface Chapter {
  id: string
  title: string
  sort: number
  status: ChapterStatus
  /** 章级摘要：定稿时由 automation 模型生成，作为后续章节的前情注入 */
  summary?: string
  scenes: Scene[]
}

export interface Volume {
  id: string
  title: string
  sort: number
  chapters: Chapter[]
}

/** 设定库实体（Codex / Lorebook 模式） */
export type EntityKind = 'character' | 'location' | 'faction' | 'item' | 'concept'
export type InjectionMode = 'always' | 'mentioned' | 'never'

export interface EntityInjection {
  /** 三档上下文开关：总是 / 仅被提及时 / 从不（NovelCrafter 模式） */
  mode: InjectionMode
  /** 预算裁剪顺序，数值越小越后裁 */
  priority: number
  /** 该实体注入的 token 上限 */
  budgetTokens: number
}

export interface Entity {
  id: string
  kind: EntityKind
  name: string
  /** 别名/昵称，用于正文提及识别 */
  aliases: string[]
  /** 按类型的结构化字段（外貌/性格/口癖/弧线…） */
  fields: Record<string, string>
  notes: string
  tags: string[]
  injection: EntityInjection
}

/** 伏笔全生命周期：埋设 → 提醒 → 回收 */
export type ForeshadowStatus = 'planted' | 'due' | 'resolved'

export interface Foreshadow {
  id: string
  title: string
  /** 埋设位置："chapterId/sceneId" */
  plantedIn: string
  /** 计划回收位置，超期未回收由一致性检查标黄 */
  targetReveal?: string
  status: ForeshadowStatus
  note?: string
}

export interface PlotLine {
  id: string
  name: string
  kind: 'main' | 'sub'
  color: string
}

/** 快照：AI 应用前 / 手动 / 自动，回收站语义基于快照实现 */
export interface Snapshot {
  id: string
  targetType: 'scene' | 'chapter' | 'project'
  targetId: string
  createdAt: number
  reason: 'manual' | 'ai-apply' | 'auto'
  content: string
}

export interface ProjectMeta {
  genre: string
  coreIdea: string
  pov: string
  targetLength: string
}

// ---- 封面（开书阶段三档选择，见设计方案 §4.5）----

export type CoverKind = 'title' | 'image'

export interface ProjectCover {
  /** title=默认书名封面（零素材）；image=上传或 AI 生成的图片 */
  kind: CoverKind
  /** kind='image'：宿主资源 id；图片二进制存宿主应用数据目录，项目文档只存引用 */
  assetId?: string
  /** 图片来源（AI 生成在 M4+ 计划，本期仅预留） */
  origin?: 'upload' | 'ai'
  /** kind='title'：书名封面色板索引，由书名哈希稳定生成（换设备颜色不变） */
  palette?: number
}

export interface NovelProjectDocumentV2 {
  version: 2
  id: string
  title: string
  createdAt: number
  updatedAt: number
  meta: ProjectMeta
  cover: ProjectCover
  volumes: Volume[]
  entities: Entity[]
  foreshadows: Foreshadow[]
  plotLines: PlotLine[]
  snapshots: Snapshot[]
}

export type ProjectStatus = 'idea' | 'outline' | 'serial' | 'done'

export interface NovelProjectSummary {
  id: string
  title: string
  updatedAt: number
  wordCount: number
  sceneCount: number
  status: ProjectStatus
  cover: ProjectCover
}

export function countProjectWords(project: NovelProjectDocumentV2): number {
  return project.volumes.flatMap(v => v.chapters.flatMap(c => c.scenes)).reduce((sum, s) => sum + s.content.length, 0)
}

export function countProjectScenes(project: NovelProjectDocumentV2): number {
  return project.volumes.flatMap(v => v.chapters.flatMap(c => c.scenes)).length
}
