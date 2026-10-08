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
      <h2 class="sec-t">{{ t.wizard.tplTitle }}</h2>
      <div class="tpl-grid">
        <button v-for="tpl in templates" :key="tpl.id" class="tpl-chip" :class="{ on: form.templateId === tpl.id }" type="button" @click="form.templateId = tpl.id">
          <b>{{ tpl.name }}</b>
          <span>{{ tpl.desc }}</span>
        </button>
      </div>
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

      <h2 class="sec-t">封面</h2>
      <div class="cover-row">
        <div class="cover-preview" :class="previewPalette">
          <span class="cover-title">{{ form.title.trim() || '未命名作品' }}</span>
        </div>
        <div class="cover-modes">
          <button class="cover-mode on" type="button" @click="coverMode = 'title'">
            <b>默认书名封面</b>
            <span>色板随书名稳定生成 · 不需要素材，书架自然整齐</span>
          </button>
          <button class="cover-mode" type="button" :disabled="true" :class="{ on: coverMode === 'upload' }">
            <b>上传图片并裁剪 <i class="soon">M4</i></b>
            <span>3:4 比例 · 拖拽调整构图，可随时重新裁剪或移除（规划中）</span>
          </button>
          <button class="cover-mode" type="button" :disabled="true">
            <b>AI 生成封面 <i class="soon">规划中</i></b>
            <span>按题材与一句话内核生成封面图（M4+ 计划，本期仅留入口）</span>
          </button>
          <p class="cover-hint">封面会出现在书架卡片、工作台标题区与导出 EPUB 的封面首图</p>
        </div>
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
import { coverPaletteFor } from '@/domain/cover'
import { useWorkspaceStore } from '@/stores/workspace'

const t = useWorkspaceStore().t
const router = useRouter()
const store = useWorkspaceStore()

const modes = [
  { key: 'tpl', label: t.wizard.modeTpl, desc: '题材预设 · 实体与提示词开箱即用' },
  { key: 'blank', label: t.wizard.modeBlank, desc: '一张白纸 · 从一句话内核写起' },
  { key: 'import', label: t.wizard.modeImport, desc: 'TXT 按章回自动分章 / 项目 JSON' },
] as const
const activeMode = ref<(typeof modes)[number]['key']>('tpl')

const templates = [
  { id: 'xuanhuan', name: '东方玄幻', desc: '12 条实体预设 · 8 组提示词 · 卷纲/章纲/Beats 三层结构' },
  { id: 'urban', name: '都市异闻', desc: '10 条实体预设 · 规则怪谈约束 · 悬念钩子库' },
  { id: 'mystery', name: '悬疑刑侦', desc: '时间线面板优先 · 证据链实体 · 误导清单' },
  { id: 'scifi', name: '科幻 · 末日', desc: '世界观规则引擎 · 技术树 · 群像卡' },
  { id: 'gufei', name: '古言 · 宅斗', desc: '人物关系图优先 · 家族势力卡 · 称谓表' },
  { id: 'infinite', name: '无限流', desc: '副本结构模板 · 规则卡组 · 队伍状态追踪' },
]

const lengths = ['30 万字（快节奏）', '60 万字（标准长篇）', '100 万字+（超长连载）']
const pows = ['第三人称限知（单视角）', '第三人称多视角', '第一人称']

const form = reactive({
  title: '',
  templateId: 'xuanhuan',
  coreIdea: '',
  pov: pows[0],
  targetLength: lengths[1],
})
const creating = ref(false)

// 封面：默认书名封面（色板随书名稳定生成）；上传裁剪与 AI 生成在 M4 计划（见设计方案 §4.5）
const coverMode = ref<'title' | 'upload' | 'ai'>('title')
const previewPalette = computed(() => `cover-palette-${coverPaletteFor(form.title.trim() || '未命名作品')}`)

async function create() {
  if (!form.title.trim()) {
    ElMessage.warning('先给作品起个名字')
    return
  }
  creating.value = true
  try {
    const project = await store.createProject({
      ...form,
      cover: { kind: 'title', palette: coverPaletteFor(form.title.trim()) },
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

.mode-card,
.tpl-chip {
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
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 26px;
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

// ---- 封面区 ----
.cover-row {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 26px;
}

.cover-preview {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 118px;
  height: 157px;
  padding: 13px;
  overflow: hidden;
  border-radius: 10px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    inset -18px 0 30px rgba(0, 0, 0, 0.18),
    $shadow-md;
  transition: background 0.25s ease;

  .cover-title {
    width: 2em;
    color: #fff;
    font-family: var(--font-serif);
    font-size: 14.5px;
    font-weight: 600;
    line-height: 1.5;
    text-align: center;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    word-break: break-all;
  }
}

.cover-modes {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 9px;
}

.cover-mode {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 14px;
  color: inherit;
  text-align: left;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border);
  border-radius: $radius-md;
  transition: all $transition-fast;

  b {
    display: flex;
    gap: 7px;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
  }

  span {
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }

  &:not(:disabled):hover {
    border-color: var(--cp-text-tertiary);
  }

  &.on {
    background: var(--cp-primary-lighter);
    border-color: var(--cp-primary);
    box-shadow: 0 0 0 1px var(--cp-primary);
  }

  &:disabled {
    opacity: 0.62;
    cursor: not-allowed;
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

.cover-hint {
  margin-top: 2px;
  color: var(--cp-text-tertiary);
  font-size: 11px;
}
</style>
