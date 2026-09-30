<template>
  <button class="theme-toggle" type="button" :title="workspace.theme === 'dark' ? '切换到白天' : '切换到黑夜'" :aria-label="workspace.theme === 'dark' ? '切换到白天' : '切换到黑夜'" @click="toggle">
    <Icon :icon="workspace.theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" width="16" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWorkspaceStore } from '@/stores/workspace'

const workspace = useWorkspaceStore()

function toggle() {
  void workspace.setTheme(workspace.theme === 'dark' ? 'light' : 'dark')
}
</script>

<style scoped lang="scss">
.theme-toggle {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--cp-text-secondary);
  background: transparent;
  border: 0;
  border-radius: $radius-md;
  transition: background $transition-fast, color $transition-fast;

  &:hover {
    color: var(--cp-text);
    background: var(--cp-bg-hover);
  }
}
</style>
