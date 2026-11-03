<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { useStudioStore } from '@/stores/studio'
const studio = useStudioStore()
</script>
<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <AppShell><div v-if="studio.loading" class="empty-state" role="status">正在读取作品…</div><RouterView v-else /></AppShell>
</template>
