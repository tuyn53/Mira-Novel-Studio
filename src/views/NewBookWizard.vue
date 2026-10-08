<template>
  <div class="wizard-page">
    <el-button class="back" text @click="router.push('/')">
      <Icon icon="lucide:arrow-left" width="15" /> {{ t.wizard.back }}
    </el-button>

    <h1>{{ t.wizard.title }}</h1>
    <p class="sub">选择起点。题材模板会预填实体字段、结构模板与提示词组，进入工作台后随时可改。</p>

    <div class="mode-row">
      <button v-for="mode in modes" :key="mode.key" class="mode-card" :class="{ on: activeMode === mode.key }" type="button" @click="activeMode = mode.key">
        <b>{{ mode.label }}</b>
        <span>{{ mode.desc }}</span>
      </button>
    </div>

    <template v-if="activeMode === 'tpl'">
      <h2 class="sec-t">频道 <span class="sec-hint">决定分类库与默认情感基调</span></h2>
      <div class="channel-row">
        <button
          v-for="channel in CHANNELS"
          :key="channel.key"
          class="channel-chip"
          :class="{ on: form.channel === channel.key }"
          type="button"
          @click="selectChannel(channel.key)"
        >
          {{ channel.label }}
        </button>
      </div>

      <h2 class="sec-t">主分类 <span class="sec-hint">必选且只能选一个</span></h2>
      <div class="cat-grid">
        <button
          v-for="category in categories"
          :key="category"
          class="cat-chip"
          :class="{ on: form.category === category }"
          type="button"
          @click="form.category = category"
        >
          {{ category }}
        </button>
      </div>

      <h2 class="sec-t">标签 <span class="sec-hint">{{ tagGroupsHint() }} · 全量 {{ totalTagCount }} 个</span></h2>
      <div class="tag-search">
        <Icon icon="lucide:search" width="13" />
        <input v-model="tagQuery" type="text" placeholder="搜索标签，如：系统 / 追妻 / 年代 / 扮猪吃虎" aria-label="搜索标签">
        <button v-if="tagQuery" type="button" class="tag-search__clear" @click="tagQuery = ''">清除</button>
      </div>
      <div class="tag-groups">
        <div v-for="group in TAG_GROUPS" :key="group.key" class="tag-group" :class="{ 'is-empty': !groupVisibleTags(group).length }">
          <div class="tag-group-head">
            <span>{{ group.label }}</span>
            <span class="cnt">{{ countInGroup(form.tags, group) }}/{{ group.limit }}</span>
          </div>
          <div class="tag-chips">
            <button
              v-for="tag in groupVisibleTags(group)"
              :key="tag"
              class="tag-chip"
              :class="{ on: form.tags.includes(tag), disabled: isTagDisabled(group, tag) }"
              type="button"
              :disabled="isTagDisabled(group, tag)"
              @click="toggle(group, tag)"
            >
              {{ tag }}
            </button>
          </div>
          <button
            v-if="!tagQuery && group.tags.length > groupVisibleTags(group).length"
            class="tag-more"
            type="button"
            @click="toggleGroupExpand(group.key)"
          >
            {{ expandedGroups.includes(group.key) ? '收起' : `展开全部（共 ${group.tags.length} 个）` }}
          </button>
        </div>
      </div>

      <div class="tag-summary">
        已选：<b>{{ selectionText }}</b><br>
        创建时预填
        <b>{{ presetWords }}</b> 等约 <b>{{ summary.entityPresets }}</b> 条实体预设与 <b>{{ summary.promptPacks }}</b> 组提示词<span v-if="summary.highlights.length">，并在审校时启用对应的一致性规则</span>
      </div>
      <p class="tag-ai-hint">
        <Icon icon="lucide:lightbulb" width="13" />
        分类与标签会在创建时预填实体卡与提示词组；填完一句话内核后可让 AI 按内核推荐（规划中）
      </p>
    </template>

    <div v-if="activeMode === 'import'" class="drop">
      <b>{{ t.wizard.dropTitle }}</b>
      <span>{{ t.wizard.dropNote }}</span>
    </div>

    <template v-if="activeMode !== 'import'">
      <h2 class="sec-t">{{ t.wizard.infoTitle }}</h2>
      <div class="f-grid">
        <div class="f">
          <label>{{ t.wizard.fieldTitle }}</label>
          <el-input v-model="form.title" placeholder="例：提灯照河山" />
        </div>
        <div class="f">
          <label>{{ t.wizard.fieldLength }}</label>
          <el-select v-model="form.targetLength">
            <el-option v-for="option in lengths" :key="option" :label="option" :value="option" />
          </el-select>
        </div>
        <div class="f full">
          <label>{{ t.wizard.fieldCore }}</label>
          <el-input v-model="form.coreIdea" type="textarea" :rows="2" placeholder="背着「不存在的第七任」名分上路的提灯人，想查清前六任怎么死的……" />
        </div>
        <div class="f">
          <label>{{ t.wizard.fieldPov }}</label>
          <el-select v-model="form.pov">
            <el-option v-for="option in pows" :key="option" :label="option" :value="option" />
          </el-select>
        </div>
        <div class="f">
          <label>{{ t.wizard.fieldModel }}</label>
          <el-select model-value="host" disabled>
            <el-option label="跟随宿主模型配置（Harness 统一管理）" value="host" />
          </el-select>
        </div>
      </div>

      <h2 class="sec-t">封面 <span class="sec-hint">模板封面 · 书名自动注入设计（对标番茄，样式见 9 套）</span></h2>
      <div class="cover-gallery">
        <button class="cover-cell" :class="{ on: !form.coverTemplate }" type="button" @click="form.coverTemplate = ''">
          <CoverArt :title="coverTitle" :cover="{ kind: 'title', palette: previewPaletteIndex }" />
          <span class="cover-cell__label">纯色板</span>
          <Icon v-if="!form.coverTemplate" class="cover-cell__check" icon="lucide:check" width="12" />
        </button>
        <button
          v-for="tpl in COVER_TEMPLATES"
          :key="tpl.id"
          class="cover-cell"
          :class="{ on: form.coverTemplate === tpl.id }"
          type="button"
          :title="tpl.hint"
          @click="form.coverTemplate = tpl.id"
        >
          <CoverArt :title="coverTitle" :cover="{ kind: 'title', template: tpl.id, palette: previewPaletteIndex }" />
          <span class="cover-cell__label">{{ tpl.label }}</span>
          <Icon v-if="form.coverTemplate === tpl.id" class="cover-cell__check" icon="lucide:check" width="12" />
        </button>
      </div>
      <div class="cover-alt">
        <span class="cover-alt__item"><Icon icon="lucide:upload" width="13" />上传图片并裁剪 <i class="soon">M4</i></span>
        <span class="cover-alt__item"><Icon icon="lucide:sparkles" width="13" />AI 生成封面 <i class="soon">规划中</i></span>
        <span class="cover-alt__hint">封面会出现在书架卡片、工作台标题区与导出 EPUB 的封面首图</span>
      </div>
    </template>

    <div class="init-actions">
      <el-button type="primary" :loading="creating" :disabled="activeMode === 'import'" @click="create">
        {{ t.wizard.create }}
      </el-button>
      <span class="note">{{ t.wizard.createNote }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CoverArt from '@/components/CoverArt.vue'
import { COVER_TEMPLATES, coverPaletteFor } from '@/domain/cover'
import type { Channel } from '@/domain/model'
import { CATEGORIES, CHANNELS, TAG_GROUPS, countInGroup, presetSummary, tagGroupsHint, toggleTag, visibleTags, type TagGroupDef } from '@/domain/taxonomy'
import { useWorkspaceStore } from '@/stores/workspace'

const t = useWorkspaceStore().t
const router = useRouter()
const store = useWorkspaceStore()

const modes = [
  { key: 'tpl', label: t.wizard.modeTpl, desc: '频道 / 分类 / 标签 · 生成预设开箱即用' },
  { key: 'blank', label: t.wizard.modeBlank, desc: '一张白纸 · 从一句话内核写起' },
  { key: 'import', label: t.wizard.modeImport, desc: 'TXT 按章回自动分章 / 项目 JSON' },
] as const
const activeMode = ref<(typeof modes)[number]['key']>('tpl')

const lengths = ['30 万字（快节奏）', '60 万字（标准长篇）', '100 万字+（超长连载）']
const pows = ['第三人称限知（单视角）', '第三人称多视角', '第一人称']

const form = reactive({
  title: '',
  channel: 'male' as Channel,
  category: CATEGORIES.male[0],
  tags: [] as string[],
  coreIdea: '',
  pov: pows[0],
  targetLength: lengths[1],
  coverTemplate: '' as string,
})
const creating = ref(false)

// ---- 频道 / 分类 / 标签（选题见 domain/taxonomy.ts；全量标签库 + 搜索 + 折叠）----
const categories = computed(() => CATEGORIES[form.channel])
const summary = computed(() => presetSummary(form.tags))
const selectionText = computed(() => [CHANNELS.find(c => c.key === form.channel)?.label, form.category, ...form.tags].filter(Boolean).join(' · '))
const presetWords = computed(() => (summary.value.highlights.length ? summary.value.highlights.slice(0, 2).join('、') : '分类基础预设包'))
const totalTagCount = TAG_GROUPS.reduce((sum, group) => sum + group.tags.length, 0)

const tagQuery = ref('')
const expandedGroups = ref<string[]>([])

function groupVisibleTags(group: TagGroupDef): string[] {
  return visibleTags(group, form.tags, { expanded: expandedGroups.value.includes(group.key), query: tagQuery.value })
}

function toggleGroupExpand(key: string) {
  expandedGroups.value = expandedGroups.value.includes(key)
    ? expandedGroups.value.filter(item => item !== key)
    : [...expandedGroups.value, key]
}

function selectChannel(channel: Channel) {
  form.channel = channel
  form.category = CATEGORIES[channel][0]
}

function toggle(group: TagGroupDef, tag: string) {
  form.tags = toggleTag(form.tags, group, tag)
}

function isTagDisabled(group: TagGroupDef, tag: string) {
  return !form.tags.includes(tag) && countInGroup(form.tags, group) >= group.limit
}

// 封面：模板封面库（书名注入设计，对标番茄 15 套模板收敛为 9 套 + 纯色板）；
// 上传裁剪（M4）与 AI 生成（M4+）本期仅留入口（见设计方案 §4.5）
const coverTitle = computed(() => form.title.trim() || '未命名作品')
const previewPaletteIndex = computed(() => coverPaletteFor(coverTitle.value))

async function create() {
  if (!form.title.trim()) {
    ElMessage.warning('先给作品起个名字')
    return
  }
  creating.value = true
  try {
    const project = await store.createProject({
      title: form.title,
      channel: form.channel,
      genre: form.category,
      tags: [...form.tags],
      coreIdea: form.coreIdea,
      pov: form.pov,
      targetLength: form.targetLength,
      cover: {
        kind: 'title',
        palette: coverPaletteFor(form.title.trim()),
        ...(form.coverTemplate ? { template: form.coverTemplate } : {}),
      },
    })
    ElMessage.success(`《${project.title}》已创建`)
    await router.push(`/book/${project.id}/codex`)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped lang="scss">
.wizard-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 46px 24px 90px;

  h1 {
    font-size: 24px;
    font-weight: 600;
  }

  .sub {
    margin: 8px 0 26px;
    color: var(--cp-text-tertiary);
    font-size: 13px;
  }
}

.back {
  margin-bottom: 22px;
  margin-left: -8px;
}

.mode-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
  margin-bottom: 26px;
}

.mode-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px 15px;
  text-align: left;
  color: inherit;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border);
  border-radius: $radius-md;
  transition: border-color $transition-fast, background $transition-fast, box-shadow $transition-fast;

  b {
    font-size: 13.5px;
  }

  span {
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
    line-height: 1.55;
  }

  &:hover {
    border-color: var(--cp-text-tertiary);
  }

  &.on {
    background: var(--cp-primary-lighter);
    border-color: var(--cp-primary);
    box-shadow: 0 0 0 1px var(--cp-primary);
  }
}

.sec-t {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;

  .sec-hint {
    margin-left: 6px;
    color: var(--cp-text-tertiary);
    font-size: 11px;
    font-weight: 400;
  }
}

// ---- 开书选题：频道 / 分类 / 标签 ----
.channel-row {
  display: flex;
  gap: 8px;
  margin-bottom: 26px;
}

.channel-chip {
  padding: 7px 22px;
  color: var(--cp-text-secondary);
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border);
  border-radius: $radius-md;
  font-size: 13px;
  font-weight: 500;
  transition: all $transition-fast;

  &:hover {
    border-color: var(--cp-text-tertiary);
  }

  &.on {
    color: #fff;
    background: var(--cp-primary);
    border-color: var(--cp-primary);
  }
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 26px;
}

.cat-chip {
  padding: 9px 12px;
  color: var(--cp-text-secondary);
  text-align: center;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;
  font-size: 12.5px;
  transition: all $transition-fast;

  &:hover {
    color: var(--cp-text);
    border-color: var(--cp-text-tertiary);
  }

  &.on {
    color: var(--cp-primary-hover);
    background: var(--cp-primary-lighter);
    border-color: var(--cp-primary);
    box-shadow: 0 0 0 1px var(--cp-primary);
    font-weight: 600;
  }
}

// ---- 标签搜索与折叠 ----
.tag-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  margin-bottom: 14px;
  color: var(--cp-text-tertiary);
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border);
  border-radius: $radius-md;

  input {
    flex: 1;
    min-width: 0;
    color: var(--cp-text);
    background: transparent;
    border: 0;
    outline: 0;
    font: inherit;
    font-size: 12.5px;

    &::placeholder {
      color: var(--cp-text-placeholder);
    }
  }

  .tag-search__clear {
    padding: 0;
    color: var(--cp-primary-hover);
    background: none;
    border: 0;
    font-size: 11.5px;
  }
}

.tag-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}

.tag-group {
  &.is-empty {
    display: none;
  }
}

.tag-more {
  display: block;
  margin-top: 8px;
  padding: 0;
  color: var(--cp-primary-hover);
  background: none;
  border: 0;
  font-size: 11.5px;

  &:hover {
    text-decoration: underline;
  }
}

.tag-group-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;

  .cnt {
    margin-left: auto;
    color: var(--cp-text-tertiary);
    font-size: 11px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-chip {
  padding: 5px 13px;
  color: var(--cp-text-secondary);
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-full;
  font-size: 12px;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    color: var(--cp-text);
    border-color: var(--cp-text-tertiary);
  }

  &.on {
    color: var(--cp-primary-hover);
    background: var(--cp-primary-lighter);
    border-color: var(--cp-primary);
    font-weight: 500;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.tag-summary {
  padding: 11px 14px;
  color: var(--cp-text);
  background: var(--cp-gold-soft);
  border-radius: $radius-md;
  font-size: 12.5px;
  line-height: 1.7;

  b {
    font-weight: 600;
  }
}

.tag-ai-hint {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  margin-top: 10px;
  color: var(--cp-text-tertiary);
  font-size: 11.5px;
  line-height: 1.6;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--cp-gold);
  }
}

.drop {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 150px;
  padding: 30px 26px;
  margin-bottom: 26px;
  text-align: center;
  color: var(--cp-text-tertiary);
  background: var(--cp-bg-elevated);
  border: 1.5px dashed var(--cp-border);
  border-radius: $radius-lg;

  b {
    color: var(--cp-text-secondary);
    font-size: 13px;
  }

  span {
    font-size: 11.5px;
  }
}

.f-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 26px;

  .full {
    grid-column: 1 / -1;
  }

  label {
    display: block;
    margin-bottom: 6px;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }
}

.init-actions {
  display: flex;
  gap: 14px;
  align-items: center;

  .note {
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }
}

// ---- 封面模板画廊（对标番茄「模板封面」网格：书名注入设计 + 点选打勾）----
.cover-gallery {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.cover-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  color: inherit;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    border-color: var(--cp-text-tertiary);
    transform: translateY(-1px);
  }

  &.on {
    border-color: var(--cp-primary);
    box-shadow: 0 0 0 1px var(--cp-primary);
  }

  .cover-art {
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  .cover-cell__label {
    color: var(--cp-text-secondary);
    font-size: 11px;
    text-align: center;
  }

  .cover-cell__check {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    color: #fff;
    background: var(--cp-primary);
    border-radius: 50%;
    box-shadow: 0 1px 4px rgb(0 0 0 / 25%);
  }
}

.cover-alt {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 26px;

  .cover-alt__item {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    color: var(--cp-text-secondary);
    background: var(--cp-bg-elevated);
    border: 1px dashed var(--cp-border);
    border-radius: $radius-md;
    font-size: 12px;
    cursor: not-allowed;
  }

  .cover-alt__hint {
    color: var(--cp-text-tertiary);
    font-size: 11px;
  }

  .soon {
    padding: 1px 6px;
    color: var(--cp-gold);
    background: var(--cp-gold-soft);
    border-radius: 4px;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
  }
}
</style>
