<template>
  <div class="codex">
    <aside class="list">
      <div v-for="group in groups" :key="group.kind" class="group">
        <div class="g-title">{{ kindLabel(group.kind) }} <span>{{ group.items.length }}</span></div>
        <button
          v-for="entity in group.items"
          :key="entity.id"
          class="item"
          :class="{ on: entity.id === selectedId }"
          type="button"
          @click="selectedId = entity.id"
        >
          <span class="avatar" :data-kind="entity.kind">{{ entity.name.slice(0, 1) }}</span>
          <span class="info">
            <strong>{{ entity.name }}</strong>
            <small v-if="entity.aliases.length">别名：{{ entity.aliases.join(' · ') }}</small>
          </span>
          <i class="inj-dot" :data-mode="entity.injection.mode" :title="injectionLabel(entity.injection.mode)" />
        </button>
      </div>
      <el-empty v-if="!groups.length" description="设定库为空" />
    </aside>

    <main class="detail">
      <template v-if="selected">
        <header>
          <h2>{{ selected.name }}</h2>
          <div class="aliases">
            <span v-for="alias in selected.aliases" :key="alias" class="alias">{{ alias }}</span>
          </div>
          <span class="inj-label">注入：{{ injectionLabel(selected.injection.mode) }}</span>
        </header>
        <div class="fields">
          <div v-for="(value, key) in selected.fields" :key="key" class="field">
            <h3>{{ key }}</h3>
            <p>{{ value }}</p>
          </div>
        </div>
        <p v-if="selected.notes" class="notes">{{ selected.notes }}</p>
      </template>
      <el-empty v-else :description="t.workbench.codexReadonly" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Entity, EntityKind } from '@/domain/model'
import { zhCN } from '@/locale/zh-CN'
import { useWorkspaceStore } from '@/stores/workspace'

const t = zhCN
const workspace = useWorkspaceStore()
const project = computed(() => workspace.current)

const KIND_LABELS: Record<EntityKind, string> = {
  character: '角色',
  location: '地点',
  faction: '势力',
  item: '物品',
  concept: '概念',
}
const KIND_ORDER: EntityKind[] = ['character', 'location', 'faction', 'item', 'concept']

const groups = computed(() => {
  const byKind = new Map<EntityKind, Entity[]>()
  for (const entity of project.value?.entities ?? []) {
    const list = byKind.get(entity.kind) ?? []
    list.push(entity)
    byKind.set(entity.kind, list)
  }
  return KIND_ORDER.filter(kind => byKind.has(kind)).map(kind => ({ kind, items: byKind.get(kind)! }))
})

const selectedId = ref('')
watch(groups, next => {
  if (!next.some(g => g.items.some(e => e.id === selectedId.value))) {
    selectedId.value = next[0]?.items[0]?.id ?? ''
  }
}, { immediate: true })

const selected = computed(() => project.value?.entities.find(e => e.id === selectedId.value))

function kindLabel(kind: EntityKind) {
  return KIND_LABELS[kind]
}

function injectionLabel(mode: string) {
  return { always: '总是注入', mentioned: '被提及时注入', never: '从不注入' }[mode] ?? mode
}
</script>

<style scoped lang="scss">
.codex {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 250px minmax(0, 1fr);
}

.list {
  overflow-y: auto;
  padding: 14px 10px;
  background: var(--cp-bg-elevated);
  border-right: 1px solid var(--cp-border-light);

  .g-title {
    display: flex;
    justify-content: space-between;
    padding: 6px 8px;
    color: var(--cp-text-tertiary);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
}

.item {
  display: flex;
  gap: 9px;
  align-items: center;
  width: 100%;
  padding: 7px 9px;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: $radius-sm;

  &:hover { background: var(--cp-bg-hover); }
  &.on { background: var(--cp-primary-lighter); }

  .avatar {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    color: #fff;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--cp-bg-hover);
    color: var(--cp-text-secondary);

    &[data-kind='character'] { background: var(--cp-primary-light); color: var(--cp-primary-hover); }
    &[data-kind='item'] { background: rgba(245, 158, 11, 0.16); color: var(--cp-warning); }
  }

  .info {
    min-width: 0;

    strong { display: block; font-size: 12.5px; }
    small { display: block; overflow: hidden; color: var(--cp-text-tertiary); text-overflow: ellipsis; white-space: nowrap; font-size: 10.5px; }
  }

  .inj-dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    margin-left: auto;
    border-radius: 50%;
    background: var(--cp-border);

    &[data-mode='always'] { background: var(--cp-success); }
    &[data-mode='mentioned'] { background: var(--cp-info); }
  }
}

.detail {
  overflow-y: auto;
  padding: 24px 32px;

  header {
    display: flex;
    gap: 10px;
    align-items: center;

    h2 {
      font-family: var(--font-serif);
      font-size: 20px;
    }

    .alias {
      padding: 2px 9px;
      background: var(--cp-primary-lighter);
      border-radius: $radius-full;
      color: var(--cp-primary-hover);
      font-size: 11px;
    }

    .inj-label {
      margin-left: auto;
      color: var(--cp-text-tertiary);
      font-size: 11.5px;
    }
  }

  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 20px;
  }

  .field {
    padding: 12px 14px;
    background: var(--cp-bg-elevated);
    border: 1px solid var(--cp-border-light);
    border-radius: $radius-md;

    h3 {
      margin-bottom: 5px;
      color: var(--cp-text-tertiary);
      font-size: 11px;
      letter-spacing: 0.05em;
    }

    p {
      color: var(--cp-text-secondary);
      font-size: 12.5px;
      line-height: 1.75;
    }
  }

  .notes {
    margin-top: 16px;
    color: var(--cp-text-tertiary);
    font-size: 12px;
  }
}
</style>
