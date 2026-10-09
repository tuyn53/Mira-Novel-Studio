import type { PlatformApi } from './types'
import { mockPlatform } from './mock'

export type {
  CreateProjectInput,
  DailyWords,
  GenerationRequest,
  GenerationSink,
  ModelModule,
  ModelModuleDef,
  ModelOption,
  ModelRole,
  PlatformApi,
  SnapshotInput,
  StudioPreferences,
  ThemePreference,
  WorkspaceStats,
} from './types'
export { MODEL_MODULES } from './types'

/**
 * 平台解析：宿主 preload 注入 window.__MIRA_PLATFORM__ 时直接使用；
 * 独立开发（vite dev / 浏览器直开 / wujie 联调未接桥）回退 Mock，保证本仓库可自洽运行。
 */
export function getPlatformApi(): PlatformApi {
  return window.__MIRA_PLATFORM__ ?? mockPlatform
}

export { mockPlatform } from './mock'
