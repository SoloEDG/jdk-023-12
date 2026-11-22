<script setup lang="ts">
import { computed } from 'vue'
import type { PinballDocument } from '@/shared/document'
import { speedOf } from '@/shared/geometry'

const props = defineProps<{ doc: PinballDocument; practice?: boolean }>()

const ballLabel = computed(() => {
  if (props.practice) return '练习 · 无限发球'
  const index = props.doc.ballsLeft > 0 ? 4 - props.doc.ballsLeft : 3
  return `第 ${index} 颗 / 共 3 颗`
})

const clock = computed(() => {
  const total = Math.floor(props.doc.run.playMs / 1000)
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
})

const speed = computed(() => Math.round(speedOf(props.doc.ball.vx, props.doc.ball.vy)))

const phaseLabel = computed(() => {
  if (props.doc.phase === 'paused') return '暂停'
  if (props.doc.phase === 'gameover') return '结束'
  if (props.doc.phase === 'ready') return props.practice ? '练习待发' : '待发'
  if (props.doc.ball.held === 'plunger') return '回槽'
  return props.practice ? '练习中' : '游玩'
})

const bestScore = computed(() => (props.practice ? props.doc.bestScore : Math.max(props.doc.bestScore, props.doc.score)))

const scoreLabel = computed(() => (props.practice ? '练习得分' : '得分'))
</script>

<template>
  <div class="score-window" :class="{ 'score-practice': practice }">
    <p class="eyebrow score-eyebrow">{{ scoreLabel }}</p>
    <p class="score-digits" aria-live="polite">{{ doc.score }}</p>
    <dl class="score-meta">
      <div>
        <dt>最佳</dt>
        <dd>{{ bestScore }}</dd>
      </div>
      <div>
        <dt>用时</dt>
        <dd>{{ clock }}</dd>
      </div>
      <div>
        <dt>球速</dt>
        <dd>{{ speed }}</dd>
      </div>
      <div>
        <dt>状态</dt>
        <dd>{{ phaseLabel }}</dd>
      </div>
    </dl>
    <p class="ball-label">{{ ballLabel }}</p>
    <p v-if="doc.note.ms > 0" class="note-line">{{ doc.note.text }}</p>
  </div>
</template>
