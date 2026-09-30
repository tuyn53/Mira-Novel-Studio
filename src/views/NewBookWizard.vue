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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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

async function create() {
  if (!form.title.trim()) {
    ElMessage.warning('先给作品起个名字')
    return
  }
  creating.value = true
  try {
    const project = await store.createProject({ ...form })
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
</style>
