// ============================================================
// 开书选题：频道 → 主分类 → 标签组（全量转载番茄作家开书体系，见设计方案 §4.5）
// 数据见 ./taxonomy-data.ts（470 个标签，来源快照 docs/reference/fanqie-taxonomy.json）；
// 本模块承载选择逻辑（纯函数，vitest 覆盖）。
//
// 与番茄的差异核心：番茄的标签是喂推荐系统的元数据；我们的标签携带**生成预设**——
// 实体字段模板、提示词组、节奏协议、一致性检查规则（预设内容在 M4 模板库落库）。
//
// 限选预算对齐番茄两套体系之和（阅读标签 2+2+2 / 内容标签 4+2+2+1）后收敛：
//   题材主题 ≤3 · 主角人设 ≤4 · 情节走向 ≤4 · 情感基调 ≤2
// ============================================================

import type { Channel } from './model'
import { CAST_TAGS, PLOT_TAGS, THEME_TAGS, TONE_TAGS } from './taxonomy-data'

export interface ChannelDef {
  key: Channel
  label: string
}

export const CHANNELS: ChannelDef[] = [
  { key: 'male', label: '男频' },
  { key: 'female', label: '女频' },
  { key: 'general', label: '通用' },
]

/** 主分类（单选）：男频/女频为番茄阅读标签全量；通用为本工作室补充 */
export const CATEGORIES: Record<Channel, string[]> = {
  male: [
    '西方奇幻', '东方仙侠', '科幻末世', '男频衍生', '都市高武',
    '悬疑灵异', '悬疑脑洞', '抗战谍战', '历史古代', '历史脑洞',
    '都市种田', '都市脑洞', '都市日常', '玄幻脑洞', '战神赘婿',
    '动漫衍生', '游戏体育', '传统玄幻', '都市修真',
  ],
  female: [
    '女频悬疑', '古风世情', '科幻末世', '女频衍生', '民国言情',
    '悬疑脑洞', '青春甜宠', '双男主', '古言脑洞', '现言脑洞',
    '玄幻言情', '宫斗宅斗', '豪门总裁', '动漫衍生', '星光璀璨',
    '游戏体育', '职场婚恋', '双女主', '年代', '种田', '快穿',
  ],
  general: ['悬疑推理', '规则怪谈', '无限流', '科幻未来', '现实向', '冒险'],
}

export interface TagGroupDef {
  key: string
  label: string
  /** 组内最多可选数量（对齐番茄两套体系之和后收敛） */
  limit: number
  tags: string[]
}

export const TAG_GROUPS: TagGroupDef[] = [
  { key: 'theme', label: '题材主题', limit: 3, tags: THEME_TAGS },
  { key: 'cast', label: '主角人设', limit: 4, tags: CAST_TAGS },
  { key: 'plot', label: '情节走向', limit: 4, tags: PLOT_TAGS },
  { key: 'tone', label: '情感基调', limit: 2, tags: TONE_TAGS },
]

/** 折叠态每组展示的标签数（其余经「展开全部」与搜索触达） */
export const COLLAPSED_TAG_COUNT = 14

export function categoryList(channel: Channel): string[] {
  return CATEGORIES[channel]
}

export function tagGroupsHint(): string {
  return TAG_GROUPS.map(group => `${group.label} ≤${group.limit}`).join(' · ')
}

/** 组内已选数量 */
export function countInGroup(selected: string[], group: TagGroupDef): number {
  return group.tags.filter(tag => selected.includes(tag)).length
}

/** 切换标签：遵守组内限选；返回新数组（不改原值），超限时忽略新增 */
export function toggleTag(selected: string[], group: TagGroupDef, tag: string): string[] {
  if (selected.includes(tag)) return selected.filter(item => item !== tag)
  if (!group.tags.includes(tag)) return selected
  if (countInGroup(selected, group) >= group.limit) return selected
  return [...selected, tag]
}

/**
 * 折叠态可见标签：已选置顶 + 组内前 N 个（保持原文顺序，即番茄的重要性排序）
 * 搜索词非空时按包含匹配过滤（不折叠）。
 */
export function visibleTags(group: TagGroupDef, selected: string[], options: { expanded: boolean; query: string }): string[] {
  const query = options.query.trim()
  if (query) return group.tags.filter(tag => tag.includes(query))
  if (options.expanded) return group.tags
  const picked = group.tags.filter(tag => selected.includes(tag))
  const rest = group.tags.filter(tag => !selected.includes(tag)).slice(0, Math.max(COLLAPSED_TAG_COUNT - picked.length, 4))
  return [...picked, ...rest]
}

// ---- 预设包摘要（创建时预填内容的提示文案；M4 由模板库提供实际内容）----

/** 标签 → 生成预设的高亮词条（演示映射，M4 扩充到全量标签） */
const PRESET_HIGHLIGHTS: Record<string, string> = {
  系统: '系统面板概念卡',
  追妻火葬场: '节奏协议（误会→决裂→追悔→挽回）',
  无CP: '情感线禁忌',
  规则怪谈: '规则条目卡组',
  扮猪吃虎: '身份暴露节奏',
  克苏鲁: '不可名状氛围约束',
  马甲: '身份揭穿节奏',
  囤物资: '末世物资清单卡',
  四合院: '年代群像关系网',
}

export const BASE_ENTITY_PRESETS = 8
export const BASE_PROMPT_PACKS = 4

export interface PresetSummary {
  entityPresets: number
  promptPacks: number
  highlights: string[]
}

export function presetSummary(tags: string[]): PresetSummary {
  return {
    entityPresets: BASE_ENTITY_PRESETS + tags.length * 2,
    promptPacks: BASE_PROMPT_PACKS + tags.length,
    highlights: tags.map(tag => PRESET_HIGHLIGHTS[tag]).filter((item): item is string => !!item),
  }
}
