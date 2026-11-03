<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'
import AppIcon from '@/components/AppIcon.vue'
const studio = useStudioStore()
const query = ref('')
const books = computed(() => studio.projects.filter(item => item.title.includes(query.value)))
const first = computed(() => studio.projects[0])
const previewText = '一名替亡者投递书信的邮差，在一封寄给明天的信里，看见了自己的死讯。'
</script>
<template>
  <div class="page library-page">
    <div class="page-heading"><div><h1>我的作品<span class="heading-count">{{ studio.projects.length }}</span></h1><p>把一个想法，写成一个完整的故事。</p></div><RouterLink to="/new" class="button primary"><AppIcon name="plus" :size="16" />新建作品</RouterLink></div>
    <section v-if="first && !query" class="continue-book" :class="{ 'real-book': !studio.preview }" aria-label="继续创作">
      <div class="typographic-cover"><strong>{{ first.title }}</strong><div class="cover-rule" /><span>{{ studio.preview ? '示例作品' : '创作手稿' }}</span></div>
      <div class="continue-content"><h2>{{ first.title }}</h2><div class="inline-meta"><span class="status-label">{{ studio.preview ? '写作中 · 示例' : '继续创作' }}</span><span>{{ first.chapterCount }} 个章节</span></div><p>{{ studio.preview ? previewText : '故事正在等待下一次落笔。打开工作台，回到你的章节。' }}</p><div class="current-chapter"><AppIcon name="file-pen-line" :size="17" /><div><strong>{{ studio.preview ? '第二章 潮水的方向' : '回到正文工作区' }}</strong><span>{{ studio.preview ? '草稿 · 让叶笙在旧码头首次出场' : '查看章节，继续上次的故事' }}</span></div></div><div class="continue-actions"><RouterLink :to="`/book/${first.id}/write`" class="button primary">{{ studio.preview ? '浏览写作工作台' : '继续写作' }}<AppIcon name="arrow-up-right" :size="16" /></RouterLink><RouterLink :to="`/book/${first.id}/blueprint`" class="text-button">查看创作蓝图<AppIcon name="arrow-right" :size="15" /></RouterLink></div></div>
      <div v-if="studio.preview" class="book-route"><h3>一本书的旅程</h3><div v-for="(step, index) in ['故事蓝图', '章节规划', '正文写作', '审阅与记忆']" :key="step" class="route-step" :class="{ current: index === 2 }"><span class="route-index"><AppIcon v-if="index < 2" name="check" :size="13" /><template v-else>{{ index + 1 }}</template></span><span>{{ step }}</span><span v-if="index === 2" class="current-caption">当前</span></div><p>每一步都可以回头，<br>你的故事由你决定。</p></div>
    </section>
    <section class="book-list-section"><div class="section-heading"><h2>全部作品</h2><label class="search-field"><AppIcon name="search" :size="16" /><input v-model="query" type="search" placeholder="搜索作品" aria-label="搜索作品" /></label></div><div class="book-table-head"><span>作品</span><span>章节</span><span>最近更新</span><span /></div><RouterLink v-for="(book, index) in books" :key="book.id" :to="`/book/${book.id}/blueprint`" class="book-row"><div class="book-row-title"><span class="book-spine" :class="{ earth: index % 2 }"><AppIcon name="book-open" :size="19" /></span><span><strong>{{ book.title }}</strong><small>{{ studio.preview ? index === 0 ? '悬疑 · 奇幻' : '现实 · 治愈' : '小说作品' }}</small></span></div><span>{{ book.chapterCount }} 章</span><span>{{ new Date(book.updatedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}</span><AppIcon name="arrow-up-right" :size="17" /></RouterLink><div v-if="!books.length" class="empty-state"><AppIcon name="book-open" :size="30" /><h3>{{ query ? '没有找到这部作品' : '从你的第一个想法开始' }}</h3><p>{{ query ? '试试其他关键词。' : '新建一部作品，故事不必一开始就完整。' }}</p><RouterLink v-if="!query" to="/new" class="button primary">新建作品</RouterLink></div></section>
    <p v-if="studio.preview" class="preview-footnote"><AppIcon name="info" :size="14" />此处为新版界面示例。当前 Mira 尚未开放创作接口，真实创作接入待完成。</p>
  </div>
</template>
