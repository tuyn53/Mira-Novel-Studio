// ============================================================
// 平台 API 契约 —— 渲染层与宿主（Mira-Harness preload/IPC）之间的唯一边界
// 宿主注入 window.__MIRA_PLATFORM__ 实现；本仓库不含任何宿主实现代码。
// 数据/密钥/文件能力一律归宿主（选型定案 §1），渲染层不得绕过此接口。
// ============================================================

import type { Channel, Entity, NovelProjectDocumentV2, NovelProjectSummary, ProjectCover, Scene } from '@/domain/model'

export interface CreateProjectInput {
  title: string
  /** 频道与主分类（开书选题，见 domain/taxonomy.ts） */
  channel?: Channel
  genre?: string
  /** 标签组选中项 */
  tags?: string[]
  coreIdea?: string
  pov?: string
  targetLength?: string
  /** 开书封面：默认书名封面；上传/AI 在 M4 计划（见设计方案 §4.5） */
  cover?: ProjectCover
}

/** AI 创作模块（模型按模块分配，见首次引导与设置） */
export type ModelModule = 'authoring' | 'outline' | 'automation' | 'review'

export interface ModelModuleDef {
  key: ModelModule
  label: string
  desc: string
}

export const MODEL_MODULES: ModelModuleDef[] = [
  { key: 'authoring', label: '正文创作', desc: '续写 / 扩写 / 对白 / 伴写对话' },
  { key: 'outline', label: '大纲与细纲', desc: '总纲 / 卷纲 / 章纲' },
  { key: 'automation', label: '摘要与提取', desc: '前情摘要 / 定稿摄取 / 批量优化' },
  { key: 'review', label: '审校检查', desc: '一致性检查（M2）' },
]

/** 可选模型（宿主来自 Harness 统一模型配置；id 形如 providerId:modelId，Mock 为演示 id） */
export interface ModelOption {
  id: string
  label: string
  note?: string
}

/** 每日写作量（首页活动热力图的最小单元） */
export interface DailyWords {
  /** YYYY-MM-DD（本地时区） */
  date: string
  words: number
}

/** 工作区统计（宿主按写作活动日志统计；Mock 为演示数据） */
export interface WorkspaceStats {
  totalWords: number
  wordsToday: number
  wordsThisWeek: number
  activeDays: number
  streakDays: number
  chaptersDone: number
  /** 高产时段（0-23 点），无数据时为空 */
  peakHour?: number
  favoriteModel?: string
  /** 近 15 周的每日写作量 */
  daily: DailyWords[]
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface StudioPreferences {
  theme: ThemePreference
  /** 是否已完成首次引导（笔名 / 模型分配 / 欢迎） */
  onboarded?: boolean
  /** 作者笔名（用于问候与 AI 称呼） */
  penName?: string
  /** AI 如何称呼作者（留空则用笔名） */
  addressing?: string
  /** 模型按模块分配：module → modelId */
  modelRouting?: Partial<Record<ModelModule, string>>
  /** 位置记忆：上次打开的作品与场景（首页「继续写作」与工作台恢复现场） */
  lastProjectId?: string
  lastSceneId?: string
  /** 书架视图偏好 */
  shelfView?: 'grid' | 'list'
}

export type ModelRole = 'authoring' | 'automation'

export interface GenerationRequest {
  role: ModelRole
  /** 创作规范/文风等 system 层内容 */
  system?: string
  prompt: string
  /** 按模块路由选出的模型（未指定时由宿主按角色默认） */
  modelId?: string
}

export type GenerationSink = (chunk: string) => void

/** AI 应用前的自动快照（审阅流与回收站语义的地基，见设计方案 §4.4） */
export interface SnapshotInput {
  projectId: string
  targetType: 'scene' | 'chapter' | 'project'
  targetId: string
  reason: 'manual' | 'ai-apply' | 'auto'
  content: string
}

export interface PlatformApi {
  listProjects(): Promise<NovelProjectSummary[]>
  getProject(projectId: string): Promise<NovelProjectDocumentV2>
  createProject(input: CreateProjectInput): Promise<NovelProjectDocumentV2>
  saveScene(projectId: string, scene: Scene): Promise<void>
  saveEntity(projectId: string, entity: Entity): Promise<void>
  createSnapshot(input: SnapshotInput): Promise<{ id: string }>
  /** 可选模型列表（来自宿主 Harness 统一模型配置） */
  listModels(): Promise<ModelOption[]>
  /** 工作区统计（首页活动总览） */
  getWorkspaceStats(): Promise<WorkspaceStats>
  getPreferences(): Promise<StudioPreferences>
  savePreferences(preferences: StudioPreferences): Promise<StudioPreferences>
  /** 模型流式生成：经宿主本地 SSE 代理转发到用户配置的 OpenAI 兼容供应商 */
  streamGeneration(request: GenerationRequest, onChunk: GenerationSink, signal?: AbortSignal): Promise<string>
}

declare global {
  interface Window {
    /** 宿主 preload 注入的平台桥；独立开发（vite dev / 浏览器预览）时缺失，回退 Mock */
    __MIRA_PLATFORM__?: PlatformApi
    /** wujie 子应用标记 */
    __POWERED_BY_WUJIE__?: boolean
  }
}
