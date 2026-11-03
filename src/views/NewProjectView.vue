<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import AppIcon from '@/components/AppIcon.vue'
const studio = useStudioStore()
const router = useRouter()
const title = ref('')
const premise = ref('')
const firstDirection = ref('')
const step = ref(1)
const touched = ref(false)
const busy = ref(false)
async function advance() {
  if (step.value === 1) {
    touched.value = true
    if (studio.preview || title.value.trim()) step.value = 2
    return
  }
  if (!studio.writable || busy.value || !title.value.trim()) return
  busy.value = true
  try {
    const id = await studio.newProject(title.value, premise.value, firstDirection.value)
    await router.push('/book/' + id + '/blueprint')
  } catch (err) { studio.error = err instanceof Error ? err.message : String(err) }
  finally { busy.value = false }
}
</script>
<template>
  <div class="page new-page">
    <div class="new-page-intro"><span class="new-mark"><AppIcon name="feather" :size="25" /></span><div><h1>开始一部新作品</h1><p>先写下你现在知道的。剩下的，在写作中找到。</p></div></div>
    <div class="new-progress"><span :class="{ active: step >= 1 }">想法</span><i /><span :class="{ active: step >= 2 }">故事蓝图</span><i /><span>第一章</span></div>
    <form class="new-form" @submit.prevent="advance">
      <template v-if="step === 1">
        <label for="new-title">作品名 <span>先用暂定书名</span></label>
        <input id="new-title" v-model="title" :readonly="!studio.writable" placeholder="给这个故事一个暂时的名字" />
        <p v-if="touched && !title.trim() && !studio.preview" class="field-error" role="alert">先给故事一个名字，哪怕只是暂定的。</p>
        <label for="new-premise">一句话想法 <span>不必完整</span></label>
        <textarea id="new-premise" v-model="premise" :readonly="!studio.writable" rows="6" placeholder="谁，在什么地方，遇到了什么无法绕开的事？" />
        <div class="prompt-example"><AppIcon name="quote" :size="15" /><span>比如：<em>一名替亡者投递书信的邮差，在一封寄给明天的信里，看见了自己的死讯。</em></span></div>
      </template>
      <template v-else>
        <div class="form-review"><h2>{{ title || '你的故事起点' }}</h2><p>{{ premise || '还没有写下具体想法。也没关系，我们从人物开始。' }}</p></div>
        <label for="first-direction">你希望第一章先发生什么？ <span>可以空着</span></label>
        <textarea id="first-direction" v-model="firstDirection" :readonly="!studio.writable" rows="5" placeholder="一个场景、一个问题，或只是某种气氛…" />
        <p class="new-note"><AppIcon name="info" :size="15" />新作品会先保存一章空白稿件。你可以先做蓝图，也可以直接进入正文。</p>
      </template>
      <div class="new-actions"><RouterLink to="/" class="text-button">取消</RouterLink><button v-if="step === 2" type="button" class="button" @click="step = 1"><AppIcon name="arrow-left" :size="15" />返回</button><button type="submit" class="button primary" :disabled="step === 2 && (!studio.writable || busy)">{{ step === 1 ? studio.preview ? '继续浏览' : '继续' : busy ? '正在创建…' : '创建作品' }}<AppIcon name="arrow-right" :size="15" /></button></div>
    </form>
    <p class="preview-footnote"><AppIcon name="lock-keyhole" :size="14" />{{ studio.preview ? '当前是浏览示例。Mira 创作接口接入完成后，才能创建和保存作品。' : '作品会保存在 Mira 的本地数据库中。' }}</p>
  </div>
</template>
