<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { studioIcons } from './icons'
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
const icon = computed(() => studioIcons[props.name] ?? studioIcons['circle-help'])
</script>
<template><Icon :icon="icon" :width="size" :height="size" aria-hidden="true" /></template>
