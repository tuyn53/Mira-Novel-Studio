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

// ---- 封面模板库（对标番茄「模板封面」：固定套数的设计模板，书名注入设计；样式在 styles/covers.scss）----

export interface CoverTemplateDef {
  id: string
  label: string
  /** 视觉家族说明（样式风格指引） */
  hint: string
}

/** 9 套模板，覆盖番茄模板封面的视觉家族（水墨/描金/留白/青绿/花卉/绛红/橄榄/墨绿）+ 夜蓝（悬疑科幻补充） */
export const COVER_TEMPLATES: CoverTemplateDef[] = [
  { id: 'ink', label: '水墨', hint: '灰白纸底 · 墨色山影 · 竖排题字' },
  { id: 'gilded', label: '描金', hint: '暖金纹样 · 双线金框 · 古典书卷' },
  { id: 'minimal', label: '留白', hint: '极简白底 · 细线红点 · 现代文青' },
  { id: 'sprout', label: '青绿', hint: '米白底色 · 青绿几何 · 清新自然' },
  { id: 'peach', label: '桃夭', hint: '粉白渐变 · 花瓣点缀 · 甜宠言情' },
  { id: 'crimson', label: '绛红', hint: '暗红花影 · 深色底 · 宫斗虐恋' },
  { id: 'olive', label: '橄榄', hint: '橄榄绿底 · 金饰线条 · 年代军旅' },
  { id: 'pine', label: '墨绿', hint: '深墨绿底 · 金饰点缀 · 玄幻仙侠' },
  { id: 'night', label: '夜蓝', hint: '深蓝星点 · 银白题字 · 悬疑科幻' },
]

/** 模板 id → 渲染 class（空串 = 纯色板封面） */
export function coverTemplateClass(cover: ProjectCover | undefined): string {
  return cover?.kind === 'title' && cover.template ? `cover-tpl-${cover.template}` : ''
}

/** 无模板时用书名哈希兜底选择一套模板色板（shelf 等场景的兼容渲染） */
export function coverRenderClasses(cover: ProjectCover | undefined, title: string): string[] {
  const template = coverTemplateClass(cover)
  const palette = coverPaletteClass(cover, title)
  return template ? [palette, template] : [palette]
}
