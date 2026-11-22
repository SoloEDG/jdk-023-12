<script setup lang="ts">
import type { SpawnId } from '@/shared/document'
import { SPAWN_POINTS } from '@/features/practice/model/practice-rules'

const props = defineProps<{
  active: boolean
  spawn: SpawnId
  score: number
  balls: number
  liveScore: number
}>()

const emit = defineEmits<{
  enter: []
  exit: []
  spawn: [id: SpawnId]
}>()
</script>

<template>
  <section class="slip practice-panel" aria-label="练习">
    <header class="slip-head">
      <p class="eyebrow">练习</p>
      <h2>{{ active ? '练习台' : '试打台面' }}</h2>
    </header>

    <template v-if="active">
      <p class="practice-score" aria-live="polite">{{ score }}</p>
      <p class="slip-copy">
        练习第 {{ balls + 1 }} 颗球，落靶、闸门与连锁都只在练习台生效。正式局停在 {{ liveScore }} 分。
      </p>
    </template>
    <p v-else class="slip-copy">
      复制当前台面试打：无限发球、单独计分。练习不会写回正式局的球、奖励时间、轻推次数，也不写记录、不点亮生涯徽章。正式局会保持暂停。
    </p>

    <div class="spawn-grid" role="group" aria-label="出生点">
      <button
        v-for="point in SPAWN_POINTS"
        :key="point.id"
        type="button"
        class="spawn-key"
        :class="{ picked: point.id === props.spawn }"
        :aria-pressed="point.id === props.spawn"
        @click="emit('spawn', point.id)"
      >
        <strong>{{ point.label }}</strong>
        <span>{{ point.detail }}</span>
      </button>
    </div>

    <div class="practice-actions">
      <button v-if="!active" type="button" class="text-key text-key-strong" @click="emit('enter')">进入练习</button>
      <button v-else type="button" class="text-key text-key-strong" @click="emit('exit')">退出练习</button>
    </div>
  </section>
</template>
