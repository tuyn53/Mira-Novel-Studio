// ============================================================
// Mock 平台实现 —— 独立开发/浏览器预览用（内存 + localStorage 偏好）
// 种子数据与交互原型（prototype/）一致：《提灯照河山》。
// 与宿主实现的行为差异：无真实持久化、无模型调用（返回固定演示范文）。
// ============================================================

import type { NovelProjectDocumentV2, NovelProjectSummary, Scene } from '@/domain/model'
import { countProjectWords } from '@/domain/model'
import type { CreateProjectInput, PlatformApi, StudioPreferences } from './types'

const PREFS_KEY = 'mns.mock.preferences'

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function seedProject(): NovelProjectDocumentV2 {
  const now = Date.now()
  return {
    version: 2,
    id: 'proj-deng',
    title: '提灯照河山',
    createdAt: now - 86_400_000 * 30,
    updatedAt: now,
    meta: {
      genre: '东方玄幻',
      coreIdea: '背着「不存在的第七任」名分上路的提灯人，想查清前六任怎么死的，却先查出了自己左臂里缝着的东西。',
      pov: '第三人称限知（单视角）',
      targetLength: '60 万字（标准长篇）',
    },
    volumes: [
      {
        id: 'vol-1',
        title: '卷一 · 归墟夜话',
        sort: 0,
        chapters: [
          {
            id: 'ch-1',
            title: '第一章 破庙惊雷',
            sort: 0,
            status: 'done',
            summary: '沈砚雷夜投宿破庙，初遇阿萤；铜灯第六道刻痕亮起，阿萤认灯不认人，追兵哨音收尾。',
            scenes: [
              {
                id: 'sc-11',
                title: '雷夜借宿',
                sort: 0,
                status: 'done',
                characterIds: ['ent-shenyan', 'ent-aying'],
                locationId: 'ent-miao',
                plotLineIds: ['pl-main'],
                content: '雨是从子夜开始下的，先是瓦上碎玉般的响，后来便连成了片，像有人在头顶倾倒整条大河。\n\n沈砚推开幕岭山道上最后一道山坳时，蓑衣已经透得彻底。他借着一线闪电望见前方的破庙——塌了半边檐角，匾额上「听雨」二字只剩个雨旁，倒应景。\n\n庙里竟有火光。',
                wordTarget: 3200,
              },
              {
                id: 'sc-12',
                title: '铜灯初醒',
                sort: 1,
                status: 'done',
                characterIds: ['ent-shenyan', 'ent-aying'],
                plotLineIds: ['pl-main'],
                content: '他按住腰间的铜灯，指腹习惯性地摩挲过灯身上那七道刻痕的第六道——师父说过，第七道亮起之日，便是归墟开门之时。\n\n「进来吧。」庙里的人先开了口，声音隔着雨幕依然清亮，「站在檐下数雨滴，数到天亮也数不完的。」',
                wordTarget: 2800,
              },
            ],
          },
          {
            id: 'ch-2',
            title: '第二章 灯下故人',
            sort: 1,
            status: 'draft',
            summary: '师父故友来访，酒后失言「归墟」二字；沈砚左臂旧疤遇灯发烫，首次自述「我不是第一个提灯人」。',
            scenes: [
              {
                id: 'sc-21',
                title: '故人对饮',
                sort: 0,
                status: 'done',
                characterIds: ['ent-shenyan'],
                plotLineIds: ['pl-main'],
                content: '师父故友周伯冒雨而来，酒过三巡，说漏了「归墟」二字便再不肯多言。梁上的阴影里，阿萤抱着膝，把这两个字悄悄记下了。',
                wordTarget: 2900,
              },
              {
                id: 'sc-22',
                title: '旧疤的秘密',
                sort: 1,
                status: 'draft',
                characterIds: ['ent-shenyan'],
                plotLineIds: ['pl-main', 'pl-heji'],
                content: '灯芯未灭，烫意便顺着左臂的旧疤一寸寸爬。沈砚把袖口往下拽了拽——铜绿的凉，压不住皮肉底的烫。\n\n「我不是第一个提灯人。」他说，「我是第七个。前面六个，都没能活着把灯传下去。」',
                wordTarget: 3000,
              },
            ],
          },
          {
            id: 'ch-3',
            title: '第三章 落雁城',
            sort: 2,
            status: 'outline',
            summary: undefined,
            scenes: [
              {
                id: 'sc-31',
                title: '城门告示',
                sort: 0,
                status: 'draft',
                characterIds: ['ent-shenyan', 'ent-peizhao'],
                locationId: 'ent-luoyan',
                plotLineIds: ['pl-zhao'],
                content: '钦天监缉「妖灯」的榜文贴满城门，画影图形上的青年眉眼，与沈砚只差一道疤。',
                wordTarget: 2800,
              },
              {
                id: 'sc-32',
                title: '夜探钦天监',
                sort: 1,
                status: 'outline',
                characterIds: ['ent-peizhao'],
                plotLineIds: ['pl-zhao'],
                content: '',
                wordTarget: 3000,
              },
            ],
          },
        ],
      },
    ],
    entities: [
      {
        id: 'ent-shenyan',
        kind: 'character',
        name: '沈砚',
        aliases: ['提灯人', '小砚'],
        fields: {
          外貌: '二十四岁，旧蓑衣，左臂缠布；指腹有常年摩挲铜灯留下的铜绿茧。',
          性格: '外冷内轴；嘴上认命，脚下认人。越怕欠情，越还不起。',
          口癖: '不接话头，用动作答话；急了才冒一句师父的口头禅「灯亮之前，先看脚下」。',
          限制: '提灯人可镇水祟，但每点一次灯，旧疤就烫一分——灯与人是同一条命。',
          现状: '已知：自己非首任；未知：阿萤的真实来历；持有：铜灯（六道亮）。',
        },
        notes: '',
        tags: ['主角', '视角人物'],
        injection: { mode: 'always', priority: 2, budgetTokens: 800 },
      },
      {
        id: 'ent-aying',
        kind: 'character',
        name: '阿萤',
        aliases: ['灯灵', '萤火'],
        fields: { 身份: '栖于铜灯的灯灵，来历不明', 性格: '俏皮，好奇心重，知道得比说出来的多' },
        notes: '瞳孔能映出刻痕（暗钩，1-2 已埋）',
        tags: [],
        injection: { mode: 'mentioned', priority: 3, budgetTokens: 600 },
      },
      {
        id: 'ent-peizhao',
        kind: 'character',
        name: '裴照',
        aliases: ['裴监正', '夜鸦'],
        fields: { 身份: '钦天监监正', 性格: '温和的偏执，越客气越危险' },
        notes: '',
        tags: ['反派'],
        injection: { mode: 'mentioned', priority: 3, budgetTokens: 600 },
      },
      {
        id: 'ent-luoyan',
        kind: 'location',
        name: '落雁城',
        aliases: [],
        fields: { 概述: '北方河畔重镇，河灯祭传统千年', 威胁: '钦天监分部驻此' },
        notes: '',
        tags: [],
        injection: { mode: 'mentioned', priority: 4, budgetTokens: 400 },
      },
      {
        id: 'ent-miao',
        kind: 'location',
        name: '听雨破庙',
        aliases: [],
        fields: { 概述: '幕岭山道上的半塌山神庙，匾额只剩「雨」字' },
        notes: '',
        tags: [],
        injection: { mode: 'mentioned', priority: 5, budgetTokens: 300 },
      },
      {
        id: 'ent-deng',
        kind: 'item',
        name: '铜灯',
        aliases: ['归墟之灯'],
        fields: {
          形制: '六道刻痕亮，第七道暗',
          规则: '第七道亮起之日，归墟开门之时（师父遗言）',
        },
        notes: '核心道具，全书钩子',
        tags: [],
        injection: { mode: 'always', priority: 2, budgetTokens: 500 },
      },
      {
        id: 'ent-guixu',
        kind: 'concept',
        name: '归墟',
        aliases: [],
        fields: { 设定: '上古水渊，前六任提灯人的死因皆指向它' },
        notes: '',
        tags: [],
        injection: { mode: 'mentioned', priority: 4, budgetTokens: 400 },
      },
    ],
    foreshadows: [
      { id: 'fs-1', title: '铜灯第七道刻痕', plantedIn: 'ch-1/sc-12', targetReveal: 'ch-4/sc-41', status: 'planted', note: '已过 2 章，临近回收窗口' },
      { id: 'fs-2', title: '沈砚左臂旧疤', plantedIn: 'ch-2/sc-22', targetReveal: 'ch-8/sc-83', status: 'planted', note: '进展正常' },
      { id: 'fs-3', title: '「我不是第一个提灯人」', plantedIn: 'ch-2/sc-22', targetReveal: 'ch-3/sc-32', status: 'due', note: '目标回收已过，建议本章处理' },
    ],
    plotLines: [
      { id: 'pl-main', name: '主线 · 寻灯', kind: 'main', color: '#3d6fe0' },
      { id: 'pl-zhao', name: '暗线 · 裴照', kind: 'sub', color: '#c13a68' },
      { id: 'pl-heji', name: '暗线 · 河祭', kind: 'sub', color: '#8a5306' },
    ],
    snapshots: [],
  }
}

function seedOutlineProject(): NovelProjectDocumentV2 {
  const base = seedProject()
  return {
    ...base,
    id: 'proj-wu',
    title: '雾起长安',
    createdAt: Date.now() - 86_400_000 * 9,
    updatedAt: Date.now() - 86_400_000 * 3,
    meta: {
      ...base.meta,
      genre: '悬疑刑侦',
      coreIdea: '天宝年间的大理寺评事，接手一桩卷宗里被反复撕掉的案子。',
    },
    volumes: [],
    entities: [],
    foreshadows: [],
    plotLines: [],
  }
}

function summarize(project: NovelProjectDocumentV2): NovelProjectSummary {
  const wordCount = countProjectWords(project)
  return {
    id: project.id,
    title: project.title,
    updatedAt: project.updatedAt,
    wordCount,
    sceneCount: project.volumes.flatMap(v => v.chapters).flatMap(c => c.scenes).length,
    status: wordCount > 0 ? 'serial' : 'outline',
  }
}

function readPrefs(): StudioPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as StudioPreferences
  } catch { /* 内存态降级 */ }
  return { theme: 'system' }
}

export const mockPlatform: PlatformApi = {
  async listProjects() {
    return [seedProject(), seedOutlineProject()].map(summarize)
  },

  async getProject(projectId) {
    if (projectId === 'proj-wu') return seedOutlineProject()
    if (projectId !== 'proj-deng') throw new Error(`Mock 项目不存在：${projectId}`)
    return seedProject()
  },

  async createProject(input: CreateProjectInput) {
    const now = Date.now()
    return {
      version: 2,
      id: newId('proj'),
      title: input.title.trim() || '未命名作品',
      createdAt: now,
      updatedAt: now,
      meta: {
        genre: input.templateId ?? '未设定',
        coreIdea: input.coreIdea ?? '',
        pov: input.pov ?? '第三人称限知（单视角）',
        targetLength: input.targetLength ?? '60 万字（标准长篇）',
      },
      volumes: [
        {
          id: newId('vol'),
          title: '卷一',
          sort: 0,
          chapters: [
            {
              id: newId('ch'),
              title: '第一章',
              sort: 0,
              status: 'idea',
              scenes: [{ id: newId('sc'), title: '场景 1', sort: 0, content: '', status: 'idea', characterIds: [], plotLineIds: [] }],
            },
          ],
        },
      ],
      entities: [],
      foreshadows: [],
      plotLines: [],
      snapshots: [],
    }
  },

  async saveScene(projectId, scene: Scene) {
    // Mock 不做持久化，仅校验流程；真实持久化在宿主 novelStore
    void projectId
    if (!scene.id) throw new Error('场景缺少 id')
  },

  async saveEntity(projectId, entity) {
    void projectId
    if (!entity.id) throw new Error('实体缺少 id')
  },

  async getPreferences() {
    return readPrefs()
  },

  async savePreferences(preferences) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences))
    } catch { /* 忽略 */ }
    return preferences
  },

  async streamGeneration(request, onChunk, signal) {
    // 演示范文：逐字吐出，验证流式管线与中断
    const reply = `【${request.role} · Mock】收到 ${request.prompt.length} 字提示词。这里是独立开发模式的固定回复：\n\n雷声在远处滚过，铜灯的第六道刻痕亮了一瞬，又暗下去。`
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
    let acc = ''
    for (const chunk of reply.match(/.{1,6}/gs) ?? []) {
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
      await new Promise(resolve => setTimeout(resolve, 24))
      acc += chunk
      onChunk(chunk)
    }
    return acc
  },
}
