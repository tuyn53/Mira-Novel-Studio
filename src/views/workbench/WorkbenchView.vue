<template>
  <div class="wb">
    <header class="wb-head">
      <el-button text @click="router.push('/')">
        <Icon icon="lucide:book-marked" width="15" />
        {{ workspace.current?.title ?? t.common.untitled }}
      </el-button>
      <nav class="tabs">
        <router-link v-for="item in sectionList" :key="item.key" :class="{ on: activeSection === item.key }" :to="`/book/${id}/${item.key}`">
          {{ item.label }}
          <span v-if="item.key === 'review'" class="badge">M2</span>
        </router-link>
      </nav>
    </header>

    <div v-if="workspace.projectLoading" v-loading="true" class="wb-body" />
    <template v-else-if="workspace.current">
      <component :is="sectionComponents[activeSection]" />
    </template>
    <el-empty v-else description="作品不存在或已删除">
      <el-button type="primary" @click="router.push('/')">回到书架</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { zhCN } from '@/locale/zh-CN'
import { useWorkspaceStore } from '@/stores/workspace'
import CodexSection from './sections/CodexSection.vue'
import PlanSection from './sections/PlanSection.vue'
import ReviewSection from './sections/ReviewSection.vue'
import WriteSection from './sections/WriteSection.vue'

const props = defineProps<{ id: string; section?: string }>()
const router = useRouter()
const workspace = useWorkspaceStore()
const t = zhCN

const sectionList = [
  { key: 'write', label: t.nav.write },
  { key: 'plan', label: t.nav.plan },
  { key: 'codex', label: t.nav.codex },
  { key: 'review', label: t.nav.review },
] as const

type SectionKey = (typeof sectionList)[number]['key']
const sectionComponents: Record<SectionKey, unknown> = {
  write: WriteSection,
  plan: PlanSection,
  codex: CodexSection,
  review: ReviewSection,
}

const SECTION_KEYS: SectionKey[] = ['write', 'plan', 'codex', 'review']
const activeSection = computed<SectionKey>(() => (SECTION_KEYS.includes(props.section as SectionKey) ? (props.section as SectionKey) : 'write'))

function load() {
  void workspace.openProject(props.id)
}
onMounted(load)
watch(() => props.id, load)
</script>

<style scoped lang="scss">
.wb {
  display: flex;
  height: 100vh;
  flex-direction: column;
  min-width: 0;
}

.wb-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 20px;
  height: 46px;
  padding: 0 14px;
  background: var(--cp-bg-elevated);
  border-bottom: 1px solid var(--cp-border-light);

  .tabs {
    display: flex;
    gap: 2px;
    height: 32px;
    padding: 3px;
    background: var(--cp-bg-hover);
    border-radius: 9px;
  }

  .tabs a {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 13px;
    color: var(--cp-text-secondary);
    border-radius: 7px;
    font-size: 12.5px;
    font-weight: 500;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover {
      color: var(--cp-text);
    }

    &.on {
      background: var(--cp-bg-elevated);
      color: var(--cp-text);
      box-shadow: $shadow-sm;
    }

    .badge {
      padding: 0 5px;
      color: #fff;
      background: var(--cp-warning);
      border-radius: $radius-full;
      font-size: 10.5px;
      font-weight: 600;
      line-height: 15px;
    }
  }
}

.wb-body {
  flex: 1;
}
</style>
