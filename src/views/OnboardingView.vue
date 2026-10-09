<template>
  <div class="ob">
    <div class="ob-bg" aria-hidden="true" />
    <div class="ob-card">
      <header class="ob-head">
        <span class="ob-brand"><i class="ob-mark">N</i>Mira Novel Studio</span>
        <button v-if="!isEdit" class="ob-skip" type="button" @click="finish(true)">{{ t.onboarding.skip }}</button>
      </header>

      <div class="ob-dots" aria-hidden="true">
        <i v-for="n in 3" :key="n" :class="{ on: step === n }" />
      </div>

      <Transition name="ob-fade" mode="out-in">
        <!-- 第 1 步：笔名与称呼 -->
        <section v-if="step === 1" key="1" class="ob-body">
          <h1>{{ t.onboarding.step1Title }}</h1>
          <p class="ob-desc">{{ t.onboarding.step1Desc }}</p>
          <div class="ob-field">
            <label for="ob-pen">{{ t.onboarding.penName }}</label>
            <el-input id="ob-pen" v-model="penName" maxlength="20" :placeholder="t.onboarding.penNamePlaceholder" />
          </div>
          <div class="ob-field">
            <label for="ob-addr">{{ t.onboarding.addressing }}</label>
            <el-input id="ob-addr" v-model="addressing" maxlength="20" :placeholder="t.onboarding.addressingPlaceholder" />
            <span class="ob-hint">{{ t.onboarding.addressingHint }}</span>
          </div>
        </section>

        <!-- 第 2 步：按模块分配模型 -->
        <section v-else-if="step === 2" key="2" class="ob-body">
          <h1>{{ t.onboarding.step2Title }}</h1>
          <p class="ob-desc">{{ t.onboarding.step2Desc }}</p>
          <div class="ob-models" v-loading="modelsLoading">
            <div v-for="module in MODEL_MODULES" :key="module.key" class="ob-modrow">
              <div class="ob-modinfo">
                <strong>{{ module.label }}</strong>
                <span>{{ module.desc }}</span>
              </div>
              <el-select v-model="routing[module.key]" :placeholder="t.onboarding.modelPlaceholder" style="width: 210px">
                <el-option v-for="model in models" :key="model.id" :label="model.label" :value="model.id">
                  <span>{{ model.label }}</span>
                  <span v-if="model.note" class="ob-modnote">{{ model.note }}</span>
                </el-option>
              </el-select>
            </div>
          </div>
        </section>

        <!-- 第 3 步：欢迎 -->
        <section v-else key="3" class="ob-body">
          <h1>{{ isEdit ? t.onboarding.editTitle : step3Title }}</h1>
          <p class="ob-desc">{{ isEdit ? '' : t.onboarding.step3Desc }}</p>
          <div class="ob-summary">
            <div class="ob-row">
              <span>{{ t.onboarding.summaryName }}</span>
              <b>{{ displayName || t.onboarding.unset }}</b>
            </div>
            <div class="ob-row">
              <span>{{ t.onboarding.summaryModels }}</span>
              <b>{{ assignedCount }} / {{ MODEL_MODULES.length }}</b>
            </div>
          </div>
        </section>
      </Transition>

      <footer class="ob-foot">
        <el-button v-if="step > 1" @click="step--">{{ t.onboarding.prev }}</el-button>
        <span class="spacer" />
        <el-button v-if="step < 3" type="primary" @click="step++">{{ t.onboarding.next }}</el-button>
        <el-button v-else type="primary" :loading="saving" @click="finish()">
          {{ isEdit ? t.onboarding.save : t.onboarding.start }}
        </el-button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MODEL_MODULES, getPlatformApi, type ModelOption } from '@/platform'
import { zhCN } from '@/locale/zh-CN'
import { useWorkspaceStore } from '@/stores/workspace'

const t = zhCN
const api = getPlatformApi()
const route = useRoute()
const router = useRouter()
const workspace = useWorkspaceStore()

const isEdit = computed(() => route.query.edit === '1')
const step = ref(1)
const saving = ref(false)

const penName = ref('')
const addressing = ref('')
const models = ref<ModelOption[]>([])
const modelsLoading = ref(false)
const routing = reactive<Record<string, string | undefined>>({})

const displayName = computed(() => addressing.value.trim() || penName.value.trim())
const step3Title = computed(() => (displayName.value ? `${t.onboarding.step3Title}，${displayName.value}。` : t.onboarding.step3Title))
const assignedCount = computed(() => MODEL_MODULES.filter(module => routing[module.key]).length)

onMounted(async () => {
  await workspace.ensurePrefs()
  // 编辑模式回填当前设置
  penName.value = workspace.preferences.penName ?? ''
  addressing.value = workspace.preferences.addressing ?? ''
  Object.assign(routing, workspace.preferences.modelRouting ?? {})

  modelsLoading.value = true
  try {
    models.value = await api.listModels()
    // 未分配过的模块默认用第一个模型
    for (const module of MODEL_MODULES) {
      routing[module.key] ??= models.value[0]?.id
    }
  } finally {
    modelsLoading.value = false
  }
})

async function finish(skip = false) {
  saving.value = true
  try {
    await workspace.completeOnboarding({
      penName: penName.value,
      addressing: addressing.value,
      modelRouting: Object.fromEntries(
        MODEL_MODULES.map(module => [module.key, routing[module.key]]).filter(([, value]) => Boolean(value)),
      ),
    })
    ElMessage.success(skip ? t.onboarding.skipped : t.onboarding.done)
    await router.push('/')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.ob {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 40px 20px;
  overflow: hidden;
  background: var(--cp-bg);
  isolation: isolate;
}

.ob-bg {
  position: absolute;
  z-index: -1;
  inset: 0;
  background:
    radial-gradient(circle at 26% 16%, rgb(255 179 51 / 12%), transparent 30%),
    radial-gradient(circle at 78% 74%, rgb(102 128 255 / 10%), transparent 32%),
    var(--cp-bg);
}

.ob-card {
  display: flex;
  width: min(600px, 94vw);
  min-height: 440px;
  flex-direction: column;
  padding: 22px 34px 26px;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
}

.ob-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .ob-brand {
    display: inline-flex;
    gap: 9px;
    align-items: center;
    color: var(--cp-text-secondary);
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .ob-mark {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    color: #1f1f23;
    background: linear-gradient(135deg, #e3b341, #d98c00);
    border-radius: 7px;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
  }

  .ob-skip {
    padding: 4px 8px;
    color: var(--cp-text-tertiary);
    background: none;
    border: 0;
    border-radius: $radius-sm;
    font-size: 12px;

    &:hover {
      color: var(--cp-text);
      background: var(--cp-bg-hover);
    }
  }
}

.ob-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin: 18px 0 4px;

  i {
    width: 6px;
    height: 6px;
    background: var(--cp-border);
    border-radius: 50%;
    transition: all $transition-fast;

    &.on {
      width: 18px;
      background: var(--cp-primary);
      border-radius: 3px;
    }
  }
}

.ob-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-top: 14px;

  h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .ob-desc {
    min-height: 20px;
    margin: 8px 0 22px;
    color: var(--cp-text-tertiary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.ob-field {
  margin-bottom: 18px;

  label {
    display: block;
    margin-bottom: 7px;
    color: var(--cp-text);
    font-size: 12.5px;
    font-weight: 500;
  }

  .ob-hint {
    display: block;
    margin-top: 6px;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }
}

.ob-models {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ob-modrow {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 14px;
  background: var(--cp-bg);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;

  .ob-modinfo {
    min-width: 0;
    flex: 1;

    strong {
      display: block;
      font-size: 13px;
    }

    span {
      display: block;
      margin-top: 2px;
      color: var(--cp-text-tertiary);
      font-size: 11.5px;
    }
  }

  .ob-modnote {
    margin-left: 8px;
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }
}

.ob-summary {
  padding: 4px 2px;

  .ob-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--cp-border-light);

    span {
      color: var(--cp-text-tertiary);
      font-size: 12.5px;
    }

    b {
      font-size: 13.5px;
      font-weight: 600;
    }
  }
}

.ob-foot {
  display: flex;
  align-items: center;
  padding-top: 20px;

  .spacer {
    flex: 1;
  }
}

.ob-fade-enter-active,
.ob-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.ob-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.ob-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
