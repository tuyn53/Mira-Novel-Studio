<template>
  <div class="shelf-page">
    <header class="shelf-head">
      <div>
        <h1>{{ t.shelf.title }}</h1>
        <p v-if="projects.length" class="sub">
          在写 {{ projects.filter(p => p.status === 'serial').length }} · 本库共
          {{ formatWords(projects.reduce((sum, p) => sum + p.wordCount, 0)) }}
        </p>
      </div>
      <div class="actions">
        <el-button :title="t.wizard.dropNote" @click="router.push('/new')">{{ t.shelf.import }}</el-button>
        <el-button type="primary" @click="router.push('/new')">{{ t.shelf.newBook }}</el-button>
      </div>
    </header>

    <div v-loading="shelfLoading" class="cards">
      <button v-for="p in projects" :key="p.id" class="book-card" type="button" @click="router.push(`/book/${p.id}/write`)">
        <span class="cover" :class="coverClass(p.id)">{{ p.title.slice(0, 1) }}</span>
        <span class="body">
          <span class="row">
            <strong>{{ p.title }}</strong>
            <span class="pill" :data-status="p.status">{{ t.status[p.status] }}</span>
          </span>
          <span class="meta">{{ p.sceneCount }} 个场景 · {{ formatWords(p.wordCount) }} · {{ formatDate(p.updatedAt) }}</span>
        </span>
        <Icon class="arrow" icon="lucide:chevron-right" width="18" />
      </button>
      <el-empty v-if="!shelfLoading && !projects.length" :description="t.shelf.empty" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatDate, formatWords } from '@/utils/format'

const t = useWorkspaceStore().t
const router = useRouter()
const store = useWorkspaceStore()
const projects = computed(() => store.projects)
const shelfLoading = computed(() => store.shelfLoading)

const COVER_STYLES = ['cv-gold', 'cv-blue', 'cv-rose'] as const
function coverClass(id: string) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return COVER_STYLES[hash % COVER_STYLES.length]
}

onMounted(() => void store.loadProjects())
</script>

<style scoped lang="scss">
.shelf-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 54px 24px 90px;
}

.shelf-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
  }

  .sub {
    margin-top: 7px;
    color: var(--cp-text-tertiary);
    font-size: 12.5px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-height: 200px;
}

.book-card {
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 16px;
  text-align: left;
  color: inherit;
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
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 76px;
    height: 100px;
    border-radius: 10px;
    color: #fff;
    font-family: var(--font-serif);
    font-size: 28px;
    font-weight: 600;
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
  border-radius: $radius-full;
  font-size: 11px;
  font-weight: 500;
  background: var(--cp-bg-hover);
  color: var(--cp-text-secondary);

  &[data-status='serial'],
  &[data-status='draft'] {
    background: var(--cp-primary-light);
    color: var(--cp-primary-hover);
  }

  &[data-status='done'] {
    background: rgba(16, 185, 129, 0.12);
    color: var(--cp-success);
  }
}

.cv-gold { background: linear-gradient(160deg, #8a5306, #4a2e00); }
.cv-blue { background: linear-gradient(160deg, #2f5fd0, #1d3a85); }
.cv-rose { background: linear-gradient(160deg, #c13a68, #7e2145); }
</style>
