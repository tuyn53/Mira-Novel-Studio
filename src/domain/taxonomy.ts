// ============================================================
// 开书选题：频道 → 主分类 → 标签组（对标番茄作家开书流程，见设计方案 §4.5）
// 差异核心：番茄的标签是喂推荐系统的元数据；我们的标签携带**生成预设**——
// 实体字段模板、提示词组、节奏协议、一致性检查规则（预设内容在 M4 模板库落库）。
// 本模块只承载选题数据与选择逻辑（纯函数，vitest 覆盖）。
// ============================================================

import type { Channel } from './model'

export interface ChannelDef {
  key: Channel
  label: string
}

export const CHANNELS: ChannelDef[] = [
  { key: 'male', label: '男频' },
  { key: 'female', label: '女频' },
  { key: 'general', label: '通用' },
]

/** 主分类（单选）：每频道收敛为高频分类，控数量保质量 */
export const CATEGORIES: Record<Channel, string[]> = {
  male: ['东方仙侠', '都市高武', '悬疑灵异', '历史古代', '科幻末世', '游戏体育', '战神赘婿', '都市脑洞'],
  female: ['宫斗宅斗', '豪门总裁', '青春甜宠', '古风世情', '玄幻言情', '年代种田', '悬疑恋爱', '现言脑洞'],
  general: ['悬疑推理', '规则怪谈', '无限流', '科幻未来', '现实向', '冒险'],
}

export interface TagGroupDef {
  key: string
  label: string
  /** 组内最多可选数量（借用番茄的克制设计：限选逼出聚焦） */
  limit: number
  tags: string[]
}

export const TAG_GROUPS: TagGroupDef[] = [
  {
    key: 'theme',
    label: '题材主题',
    limit: 3,
    tags: ['古代', '都市', '校园', '职场', '娱乐圈', '末世', '星际', '灵气复苏', '赛博朋克', '克苏鲁', '洪荒神话', '民间传说'],
  },
  {
    key: 'cast',
    label: '主角人设',
    limit: 2,
    tags: ['战神', '神医', '赘婿', '神豪', '学霸', '大小姐', '团宠', '病娇', '女强', '扮猪吃虎', '反派'],
  },
  {
    key: 'plot',
    label: '情节走向',
    limit: 2,
    tags: ['系统', '重生', '穿越', '马甲', '失忆', '替身', '打脸', '先婚后爱', '追妻火葬场', '救赎', '养成'],
  },
  {
    key: 'tone',
    label: '情感基调',
    limit: 2,
    tags: ['1v1', '无CP', '甜宠', '虐恋', '暗恋', '青梅竹马', '久别重逢'],
  },
]

export function categoryList(channel: Channel): string[] {
  return CATEGORIES[channel]
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

// ---- 预设包摘要（创建时预填内容的提示文案；M4 由模板库提供实际内容）----

/** 标签 → 生成预设的高亮词条（演示映射，M4 扩充） */
const PRESET_HIGHLIGHTS: Record<string, string> = {
  系统: '系统面板概念卡',
  追妻火葬场: '节奏协议（误会→决裂→追悔→挽回）',
  无CP: '情感线禁忌',
  规则怪谈: '规则条目卡组',
  扮猪吃虎: '身份暴露节奏',
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
    highlights: tags.map(tag => PRESET_HIGHLIGHTS[tag]).filter((item): item is string => Boolean(item)),
  }
}
