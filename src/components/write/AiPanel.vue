<template>
  <aside class="ai-panel">
    <div class="ai-head">
      <h2><span v-if="running" class="live" />AI 伴写</h2>
      <span class="sub">{{ running ? `${actionLabel} · 生成中` : '多候选 · 可中断' }}</span>
    </div>

    <div class="ai-actions">
      <button v-for="action in SCENE_ACTIONS" :key="action.key" type="button" :disabled="running" @click="$emit('run', action.key)">
        <Icon :icon="ACTION_ICONS[action.key] ?? 'lucide:sparkles'" width="15" />{{ action.label }}
      </button>
    </div>

    <div class="ai-feed">
      <template v-if="candidates.length">
        <div v-if="selectionActive" class="feed-note">
          <Icon icon="lucide:highlighter" width="13" />本次结果将替换选中段落
        </div>
        <article
          v-for="candidate in candidates"
          :key="candidate.id"
          class="cand"
          :class="{ picked: acceptedId === candidate.id, dim: acceptedId && acceptedId !== candidate.id }"
        >
          <header class="cand-head">
            <span class="tagc">{{ candidate.label }}</span>
            <span class="meta">{{ candidate.text.length }} 字</span>
            <span class="act">
              <template v-if="acceptedId === candidate.id">
                <span class="picked-mark"><Icon icon="lucide:check" width="13" />已采纳 · 快照已存</span>
              </template>
              <template v-else-if="candidate.done">
                <button type="button" @click="$emit('discard', candidate.id)">丢弃</button>
                <button type="button" class="primary" :disabled="Boolean(candidate.error)" @click="$emit('accept', candidate.id)">采纳</button>
              </template>
              <span v-else class="streaming">生成中…</span>
            </span>
          </header>
          <div class="cand-body">
            <p v-if="candidate.error" class="cand-error">{{ candidate.error }}</p>
            <template v-else>{{ candidate.text }}<span v-if="!candidate.done" class="caret" /></template>
          </div>
        </article>
      </template>
      <div v-else class="feed-empty">
        <Icon icon="lucide:pen-line" width="20" />
        <p>{{ t.ai.empty }}</p>
        <p class="hint">{{ t.ai.emptyHint }}</p>
      </div>
      <p v-if="error" class="feed-error">{{ error }}</p>
    </div>

    <div class="composer">
      <div class="box">
        <textarea
          :value="instruction"
          :placeholder="selectionActive ? '对选中段落下达指令，例如：更压抑一点…' : '向伴写提问，或描述你想要的走向…'"
          @input="$emit('instruction-change', ($event.target as HTMLTextAreaElement).value)"
          @keydown.meta.enter.prevent="submit"
          @keydown.ctrl.enter.prevent="submit"
        />
        <button class="send" type="button" :disabled="running || !instruction.trim()" aria-label="发送" @click="submit">
          <Icon icon="lucide:arrow-up" width="15" />
        </button>
      </div>
      <div class="hint-row">
        <span>⌘↵ 发送</span>
        <button v-if="running" type="button" class="abort" @click="$emit('cancel')">中断生成</button>
        <span v-else>长任务可随时暂停，失败自动重试</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { SCENE_ACTIONS, type Candidate } from '@/domain/generation/service'
import { zhCN } from '@/locale/zh-CN'

const t = zhCN

const ACTION_ICONS: Record<string, string> = {
  continue: 'lucide:arrow-right',
  expand: 'lucide:maximize-2',
  dialogue: 'lucide:message-circle',
  foreshadow: 'lucide:link-2',
}

defineProps<{
  candidates: Candidate[]
  running: boolean
  actionLabel: string
  error: string
  acceptedId: string
  selectionActive: boolean
  instruction: string
}>()

const emit = defineEmits<{
  run: [actionKey: string]
  accept: [candidateId: string]
  discard: [candidateId: string]
  cancel: []
  send: []
  'instruction-change': [value: string]
}>()

function submit() {
  emit('send')
}
</script>

<style scoped lang="scss">
.ai-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--cp-bg-elevated);
  border-left: 1px solid var(--cp-border-light);
}

.ai-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: 13px 14px 9px;

  h2 {
    display: flex;
    gap: 7px;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
  }

  .live {
    width: 7px;
    height: 7px;
    background: var(--cp-warning);
    border-radius: 50%;
    animation: live-pulse 1.1s ease-in-out infinite;
  }

  .sub {
    color: var(--cp-text-tertiary);
    font-size: 11px;
  }
}

@keyframes live-pulse {
  50% { opacity: 0.35; }
}

.ai-actions {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  padding: 2px 14px 12px;

  button {
    display: flex;
    gap: 7px;
    align-items: center;
    padding: 9px 11px;
    color: var(--cp-text-secondary);
    text-align: left;
    background: var(--cp-bg);
    border: 1px solid var(--cp-border-light);
    border-radius: $radius-md;
    font-size: 12.5px;
    transition: all $transition-fast;

    &:hover:not(:disabled) {
      color: var(--cp-text);
      border-color: var(--cp-primary);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    svg {
      color: var(--cp-gold);
    }
  }
}

.ai-feed {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 4px 14px 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.feed-note {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  color: var(--cp-primary-hover);
  background: var(--cp-primary-lighter);
  border-radius: $radius-sm;
  font-size: 11.5px;
}

.feed-empty {
  display: grid;
  flex: 1;
  place-content: center;
  justify-items: center;
  gap: 6px;
  padding: 20px;
  color: var(--cp-text-tertiary);
  text-align: center;
  font-size: 12.5px;

  p {
    max-width: 210px;
    line-height: 1.7;
  }

  .hint {
    font-size: 11px;
    opacity: 0.8;
  }
}

.feed-error {
  color: var(--cp-danger);
  font-size: 12px;
}

.cand {
  overflow: hidden;
  background: var(--cp-bg);
  border: 1px solid var(--cp-border-light);
  border-radius: $radius-md;
  transition: opacity $transition-fast, border-color $transition-fast;

  &.picked {
    border-color: var(--cp-primary);
    box-shadow: 0 0 0 1px var(--cp-primary);
  }

  &.dim {
    opacity: 0.45;
  }
}

.cand-head {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  color: var(--cp-text-tertiary);
  border-bottom: 1px solid var(--cp-border-light);
  font-size: 11.5px;

  .tagc {
    padding: 1px 7px;
    color: var(--cp-gold);
    background: var(--cp-gold-soft);
    border-radius: $radius-sm;
    font-weight: 600;
    font-size: 10.5px;
  }

  .act {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-left: auto;

    button {
      padding: 2px 8px;
      color: var(--cp-text-tertiary);
      background: transparent;
      border: 0;
      border-radius: 5px;
      font-size: 11px;

      &:hover {
        color: var(--cp-text);
        background: var(--cp-bg-hover);
      }

      &.primary {
        color: #fff;
        background: var(--cp-primary);
        font-weight: 500;

        &:hover {
          background: var(--cp-primary-hover);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  .picked-mark,
  .streaming {
    display: flex;
    gap: 4px;
    align-items: center;
    color: var(--cp-primary-hover);
    font-weight: 600;
    font-size: 11px;
  }

  .streaming {
    color: var(--cp-text-tertiary);
    font-weight: 400;
  }
}

.cand-body {
  max-height: 220px;
  padding: 11px 13px;
  overflow-y: auto;
  color: var(--cp-text);
  font-family: var(--font-serif);
  font-size: 13.5px;
  line-height: 1.95;
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  .cand-error {
    color: var(--cp-danger);
    font-family: $font-family;
    font-size: 12px;
  }
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -0.15em;
  background: var(--cp-primary);
  animation: caret-blink 0.9s steps(1) infinite;
}

@keyframes caret-blink {
  50% { opacity: 0; }
}

.composer {
  flex: 0 0 auto;
  padding: 10px 14px 14px;
  border-top: 1px solid var(--cp-border-light);

  .box {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 9px 10px 9px 12px;
    background: var(--cp-bg);
    border: 1px solid var(--cp-border);
    border-radius: $radius-md;
  }

  textarea {
    flex: 1;
    height: 36px;
    color: var(--cp-text);
    resize: none;
    background: transparent;
    border: 0;
    outline: 0;
    font: inherit;
    font-size: 12.5px;
    line-height: 1.55;

    &::placeholder {
      color: var(--cp-text-placeholder);
    }
  }

  .send {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    color: #fff;
    background: var(--cp-primary);
    border: 0;
    border-radius: $radius-md;

    &:hover:not(:disabled) {
      background: var(--cp-primary-hover);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  .hint-row {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 7px;
    color: var(--cp-text-tertiary);
    font-size: 10.5px;

    .abort {
      padding: 0;
      color: var(--cp-warning);
      background: none;
      border: 0;
      font-size: 10.5px;
      text-decoration: underline;
    }
  }
}
</style>
