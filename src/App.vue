<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'

const workspace = useWorkspaceStore()
onMounted(() => {
  void workspace.initTheme()
})
</script>
