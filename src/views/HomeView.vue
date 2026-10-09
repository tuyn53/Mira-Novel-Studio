<template>
  <div class="home">
    <div class="home-bg" aria-hidden="true" />
    <div class="home-wrap">
      <header class="greet">
        <h1>{{ greeting }}</h1>
        <div class="greet-actions">
          <el-button v-if="workspace.lastProject" class="continue" @click="continueWriting">
            {{ t.home.continue }}《{{ workspace.lastProject.title }}》
            <Icon icon="lucide:arrow-right" width="14" />
          </el-button>
          <el-button text circle :title="t.onboarding.editTitle" aria-label="偏好设置" @click="router.push('/welcome?edit=1')">
            <Icon icon="lucide:settings-2" width="15" />
          </el-button>
          <ThemeToggle />
        </div>
      </header>

      <!-- 创作总览（Claude 式活动面板；无作品时隐藏） -->
      <section v-if="projects.length" v-loading="statsLoading" class="overview">
        <div class="tiles">
          <div v-for="tile in tiles" :key="tile.label" class="tile">
            <span class="tile-label">{{ tile.label }}</span>
            <span class="tile-value">{{ tile.value }}</span>
          </div>
        </div>

        <div class="heat" role="img" :aria-label="t.home.heatmapAria">
          <div v-for="(week, wi) in heatmap" :key="wi" class="heat-col">
            <i
              v-for="day in week"
              :key="day.date"
              class="heat-cell"
              :class="[`lv-${heatLevel(day.words, heatMax)}`, { ph: day.placeholder }]"
              :title="day.placeholder ? '' : `${day.date} · ${day.words} 字`"
            />
          </div>
        </div>
        <p v-if="funLine" class="overview-note">{{ funLine }}</p>
      </section>

      <!-- 书架 -->
      <section class="shelf">
        <div class="shelf-head">
          <h2>{{ t.shelf.title }}</h2>
          <span v-if="projects.length" class="shelf-sub">{{ shelfSummary }}</span>
          <span class="spacer" />
          <template v-if="projects.length">
            <div class="view-toggle" role="group" :aria-label="t.home.viewToggle">
              <button type="button" :class="{ on: workspace.shelfView === 'grid' }" :aria-label="t.home.gridView" :title="t.home.gridView" @click="workspace.setShelfView('grid')">
                <Icon icon="lucide:layout-grid" width="14" />
              </button>
              <button type="button" :class="{ on: workspace.shelfView === 'list' }" :aria-label="t.home.listView" :title="t.home.listView" @click="workspace.setShelfView('list')">
                <Icon icon="lucide:rows-3" width="14" />
              </button>
            </div>
          </template>
          <el-button :title="t.wizard.dropNote" @click="router.push('/new')">{{ t.shelf.import }}</el-button>
          <el-button type="primary" @click="router.push('/new')">{{ t.shelf.newBook }}</el-button>
        </div>

        <div v-if="statsLoading && !projects.length" v-loading="true" class="shelf-loading" />

        <!-- 网格视图 -->
        <div v-else-if="projects.length && workspace.shelfView === 'grid'" class="grid">
          <button v-for="p in projects" :key="p.id" class="gcard" type="button" @click="open(p.id)">
            <CoverArt class="gcard-cover" :title="p.title" :cover="p.cover" />
            <span class="gcard-body">
              <strong>{{ p.title }}</strong>
              <span class="gmeta">{{ formatWords(p.wordCount) }} · {{ t.status[p.status] }}</span>
            </span>
          </button>
          <button class="gcard gcard--new" type="button" @click="router.push('/new')">
            <Icon icon="lucide:plus" width="18" />
            <span>{{ t.shelf.newBook }}</span>
          </button>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="projects.length" class="list">
          <button v-for="p in projects" :key="p.id" class="book-card" type="button" @click="open(p.id)">
            <CoverArt class="cover" :title="p.title" :cover="p.cover" />
            <span class="body">
              <span class="row">
                <strong>{{ p.title }}</strong>
                <span class="pill" :data-status="p.status">{{ t.status[p.status] }}</span>
              </span>
              <span class="meta">{{ p.sceneCount }} 个场景 · {{ formatWords(p.wordCount) }} · {{ formatDate(p.updatedAt) }}</span>
            </span>
            <Icon class="arrow" icon="lucide:chevron-right" width="18" />
          </button>
        </div>

        <!-- 空书架 -->
        <div v-else-if="!statsLoading" class="shelf-empty">
          <Icon icon="lucide:book-plus" width="26" />
          <p>{{ t.home.empty2 }}</p>
          <el-button type="primary" @click="router.push('/new')">{{ t.shelf.newBook }}</el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CoverArt from '@/components/CoverArt.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { buildHeatmap, compareToNovel, heatLevel } from '@/domain/stats'
import { getPlatformApi, type ModelOption, type WorkspaceStats } from '@/platform'
import { zhCN } from '@/locale/zh-CN'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatDate, formatWords } from '@/utils/format'

const t = zhCN
const api = getPlatformApi()
const router = useRouter()
const workspace = useWorkspaceStore()
const projects = computed(() => workspace.projects)
const statsLoading = ref(false)

// ---- 创作总览 ----
const stats = ref<WorkspaceStats>()
const models = ref<ModelOption[]>([])

const heatmap = computed(() => buildHeatmap(stats.value?.daily ?? []))
const heatMax = computed(() => Math.max(0, ...(stats.value?.daily ?? []).map(day => day.words)))

const tiles = computed(() => [
  { label: t.home.totalWords, value: stats.value ? formatWords(stats.value.totalWords) : '—' },
  { label: t.home.todayWords, value: stats.value ? `${stats.value.wordsToday} 字` : '—' },
  { label: t.home.activeDays, value: stats.value ? `${stats.value.activeDays} 天` : '—' },
  { label: t.home.streak, value: stats.value ? `${stats.value.streakDays} 天` : '—' },
  { label: t.home.peakHour, value: stats.value?.peakHour !== undefined ? `${String(stats.value.peakHour).padStart(2, '0')}:00` : '—' },
  { label: t.home.favoriteModel, value: favoriteModelLabel.value },
])

const favoriteModelLabel = computed(() => {
  const id = stats.value?.favoriteModel
  if (!id) return '—'
  return models.value.find(model => model.id === id)?.label ?? id
})

const funLine = computed(() => {
  const total = stats.value?.totalWords ?? 0
  if (total <= 0) return ''
  const { times, remaining } = compareToNovel(total)
  return times >= 1
    ? t.home.compareMore.replace('{words}', formatWords(total)).replace('{times}', times.toFixed(1))
    : t.home.compareLess.replace('{words}', formatWords(total)).replace('{remaining}', formatWords(remaining))
})

const greeting = computed(() => {
  const name = workspace.authorName
  return name ? `${t.home.greeting}，${name}？` : `${t.home.greeting}？`
})

const shelfSummary = computed(() => {
  const writing = projects.value.filter(item => item.status === 'serial').length
  const totalWords = projects.value.reduce((sum, item) => sum + item.wordCount, 0)
  const base = t.home.shelfSub.replace('{writing}', String(writing)).replace('{words}', formatWords(totalWords))
  const week = stats.value?.wordsThisWeek
  return week ? `${base} · ${t.home.shelfWeek.replace('{words}', String(week))}` : base
})

function open(projectId: string) {
  void router.push(`/book/${projectId}/write`)
}

function continueWriting() {
  if (workspace.lastProject) open(workspace.lastProject.id)
}

onMounted(async () => {
  const jobs: Array<Promise<unknown>> = [workspace.loadProjects()]
  statsLoading.value = true
  jobs.push(
    api.getWorkspaceStats().then(result => { stats.value = result }).finally(() => { statsLoading.value = false }),
    api.listModels().then(result => { models.value = result }),
  )
  await Promise.all(jobs)
})
</script>

<style scoped lang="scss">
.home {
  position: relative;
  min-height: 100vh;
  overflow-y: auto;
  background: var(--cp-bg);
  isolation: isolate;
}

.home-bg {
  position: absolute;
  z-index: -1;
  inset: 0 0 auto;
  height: 320px;
  background: radial-gradient(circle at 24% 0%, rgb(255 179 51 / 9%), transparent 44%), radial-gradient(circle at 82% 6%, rgb(102 128 255 / 8%), transparent 40%);
  pointer-events: none;
}

.home-wrap {
  max-width: 980px;
  margin: 0 auto;
  padding: 42px 28px 90px;
}

.greet {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;

  h1 {
    font-family: var(--font-serif);
    font-size: 26px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .greet-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-left: auto;
  }

  .continue :deep(svg) {
    margin-left: 2px;
  }
}

// ---- 创作总览 ----
.overview {
  padding: 18px 20px 14px;
  margin-bottom: 34px;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--cp-bg);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;

  .tile-label {
    color: var(--cp-text-tertiary);
    font-size: 11.5px;
  }

  .tile-value {
    color: var(--cp-text);
    font-size: 16px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.heat {
  display: flex;
  gap: 3px;
  padding: 2px 0 4px;
  overflow: hidden;
}

.heat-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.heat-cell {
  width: 11px;
  height: 11px;
  background: var(--cp-bg-hover);
  border-radius: 3px;

  &.lv-1 { background: color-mix(in srgb, var(--cp-primary) 28%, var(--cp-bg-hover)); }
  &.lv-2 { background: color-mix(in srgb, var(--cp-primary) 52%, var(--cp-bg-hover)); }
  &.lv-3 { background: color-mix(in srgb, var(--cp-primary) 76%, var(--cp-bg-hover)); }
  &.lv-4 { background: var(--cp-primary); }

  &.ph { opacity: 0; }
}

.overview-note {
  margin-top: 8px;
  color: var(--cp-text-tertiary);
  font-size: 12px;
}

// ---- 书架 ----
.shelf-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    font-size: 17px;
    font-weight: 600;
  }

  .shelf-sub {
    color: var(--cp-text-tertiary);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .spacer {
    flex: 1;
  }
}

.view-toggle {
  display: flex;
  padding: 3px;
  background: var(--cp-bg-hover);
  border-radius: 8px;

  button {
    display: grid;
    width: 28px;
    height: 24px;
    place-items: center;
    color: var(--cp-text-tertiary);
    background: transparent;
    border: 0;
    border-radius: 6px;

    &.on {
      color: var(--cp-text);
      background: var(--cp-bg-elevated);
      box-shadow: $shadow-sm;
    }
  }
}

// 网格视图
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 18px 16px;
}

.gcard {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 0;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  transition: transform $transition-fast;

  &:hover {
    transform: translateY(-3px);

    .gcard-cover {
      box-shadow: $shadow-md;
    }
  }

  .gcard-cover {
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 10px;
    box-shadow: $shadow-sm;
    transition: box-shadow $transition-fast;
  }

  .gcard-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 2px;

    strong {
      overflow: hidden;
      font-family: var(--font-serif);
      font-size: 13.5px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gmeta {
      color: var(--cp-text-tertiary);
      font-size: 11.5px;
      font-variant-numeric: tabular-nums;
    }
  }
}

.gcard--new {
  display: grid;
  aspect-ratio: 3 / 4;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--cp-text-tertiary);
  border: 1.5px dashed var(--cp-border);
  border-radius: 10px;
  font-size: 12.5px;

  &:hover {
    color: var(--cp-text);
    border-color: var(--cp-text-tertiary);
    transform: translateY(-3px);
  }
}

// 列表视图
.list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.book-card {
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 16px;
  color: inherit;
  text-align: left;
  background: var(--cp-bg-elevated);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  transition: transform $transition-fast, box-shadow $transition-fast, border-color $transition-fast;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
    border-color: var(--cp-border);

    .arrow {
      opacity: 1;
      transform: none;
    }
  }

  .cover {
    flex: 0 0 auto;
    width: 76px;
    height: 100px;
    border-radius: 10px;
  }

  .body {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 6px;

    .row {
      display: flex;
      gap: 9px;
      align-items: center;

      strong {
        font-family: var(--font-serif);
        font-size: 16px;
      }
    }

    .meta {
      color: var(--cp-text-tertiary);
      font-size: 12px;
    }
  }

  .arrow {
    flex: 0 0 auto;
    color: var(--cp-text-tertiary);
    opacity: 0;
    transform: translateX(-4px);
    transition: all $transition-fast;
  }
}

.pill {
  padding: 2px 9px;
  background: var(--cp-bg-hover);
  border-radius: $radius-full;
  color: var(--cp-text-secondary);
  font-size: 11px;
  font-weight: 500;

  &[data-status='serial'],
  &[data-status='draft'] {
    background: var(--cp-primary-light);
    color: var(--cp-primary-hover);
  }

  &[data-status='done'] {
    background: rgba(20, 106, 62, 0.12);
    color: var(--cp-success);
  }
}

// 空书架
.shelf-empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 70px 20px;
  color: var(--cp-text-tertiary);
  border: 1.5px dashed var(--cp-border-light);
  border-radius: $radius-lg;
  font-size: 13px;
}

.shelf-loading {
  min-height: 200px;
}
</style>
