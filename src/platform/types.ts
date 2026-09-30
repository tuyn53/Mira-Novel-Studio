// ============================================================
// 平台 API 契约 —— 渲染层与宿主（Mira-Harness preload/IPC）之间的唯一边界
// 宿主注入 window.__MIRA_PLATFORM__ 实现；本仓库不含任何宿主实现代码。
// 数据/密钥/文件能力一律归宿主（选型定案 §1），渲染层不得绕过此接口。
// ============================================================

import type { Entity, NovelProjectDocumentV2, NovelProjectSummary, Scene } from '@/domain/model'

export interface CreateProjectInput {
  title: string
  /** 题材模板 id（向导中选择；空 = 空白作品） */
  templateId?: string
  coreIdea?: string
  pov?: string
  targetLength?: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface StudioPreferences {
  theme: ThemePreference
}

export type ModelRole = 'authoring' | 'automation'

export interface GenerationRequest {
  role: ModelRole
  /** 创作规范/文风等 system 层内容 */
  system?: string
  prompt: string
}

export type GenerationSink = (chunk: string) => void

export interface PlatformApi {
  listProjects(): Promise<NovelProjectSummary[]>
  getProject(projectId: string): Promise<NovelProjectDocumentV2>
  createProject(input: CreateProjectInput): Promise<NovelProjectDocumentV2>
  saveScene(projectId: string, scene: Scene): Promise<void>
  saveEntity(projectId: string, entity: Entity): Promise<void>
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
