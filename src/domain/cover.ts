// ============================================================
// 封面领域模块 —— 默认书名封面的色板（与 styles/covers.scss 的 .cover-palette-N 一一对应）
// 色板索引由书名哈希稳定生成：同一本书在任何设备上颜色一致。
// 上传裁剪与 AI 生成封面的契约见 model.ts ProjectCover（资源归宿主，见选型定案 §4）。
// ============================================================

import type { ProjectCover } from './model'

/** 色板数量，与 covers.scss 中定义的调色板数量保持一致 */
export const COVER_PALETTE_SIZE = 5

export function coverPaletteFor(title: string): number {
  let hash = 0
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return hash % COVER_PALETTE_SIZE
}

export function defaultCover(title: string): ProjectCover {
  return { kind: 'title', palette: coverPaletteFor(title) }
}

/** 取用于渲染的色板 class；封面缺失或为图片时回退到书名哈希（保证永不空白） */
export function coverPaletteClass(cover: ProjectCover | undefined, title: string): string {
  const index = cover?.kind === 'title' && cover.palette !== undefined ? cover.palette : coverPaletteFor(title)
  return `cover-palette-${index}`
}
