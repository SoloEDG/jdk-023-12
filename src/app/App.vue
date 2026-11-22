<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { createInputController } from '@/app/input-map'
import { startLoop } from '@/app/game-loop'
import { createSession } from '@/app/session'
import { BonusBanner, ChainMeter } from '@/features/bonus'
import { ControlDeck, TiltLamp } from '@/features/flippers'
import { PracticePanel } from '@/features/practice'
import { ChallengeBoard, HistoryList, ResultCard } from '@/features/records'
import { EventTicker, ScoreHud } from '@/features/scoring'
import { MechanismPanel, TableView } from '@/features/table'

const session = createSession()
const liveDoc = session.liveDoc
const viewDoc = session.activeDoc
const practice = session.inPractice
const input = createInputController(window)
let stop = (): void => {}

onMounted(() => {
  stop = startLoop(session, () => input.snapshot())
})

onBeforeUnmount(() => {
  stop()
  input.destroy()
})

const canPause = computed(() => viewDoc.value.phase === 'ready' || viewDoc.value.phase === 'playing' || viewDoc.value.phase === 'paused')
const plungerReady = computed(() => viewDoc.value.ball.held === 'plunger' && viewDoc.value.phase !== 'paused' && viewDoc.value.phase !== 'gameover')
const selectedSpawn = computed(() => (practice.value ? viewDoc.value.practice.spawn : session.spawn.value))

function onPlunger(down: boolean): void {
  if (down) input.setPlunger(true)
  else input.releasePlunger()
}

function enterPractice(): void {
  session.enterPractice()
}

function exitPractice(): void {
  session.exitPractice()
}
</script>

<template>
  <div class="hall" :class="{ 'hall-practice': practice }">
    <main class="cabinet">
      <header class="backglass">
        <div class="bulb-row" aria-hidden="true">
          <i v-for="index in 11" :key="index" :style="{ animationDelay: `${index * 0.12}s` }"></i>
        </div>
        <div class="marquee">
          <p class="marquee-kicker">{{ practice ? '练习模式' : '街机弹球' }}</p>
          <h1>霓虹弹珠厅</h1>
          <p v-if="practice" class="marquee-note">正式局已暂停，退出练习后原样回来</p>
        </div>
        <ScoreHud :doc="viewDoc" :practice="practice" />
      </header>

      <section class="play-row">
        <div class="table-wrap">
          <TableView :doc="viewDoc" />
          <p class="how">
            A 与左 Shift 是左挡板，D 与右 Shift 是右挡板。按住空格蓄力，松开把球打上发射槽。Q、E 轻推，三次会倾斜。P 暂停。
          </p>
        </div>
        <aside class="side">
          <TiltLamp :warnings="viewDoc.nudge.warnings" :tilted="viewDoc.nudge.tilted" />
          <PracticePanel
            :active="practice"
            :spawn="selectedSpawn"
            :score="viewDoc.score"
            :balls="viewDoc.practice.balls"
            :live-score="liveDoc.score"
            @enter="enterPractice"
            @exit="exitPractice"
            @spawn="session.setSpawn"
          />
          <BonusBanner :doc="viewDoc" />
          <ResultCard v-if="!practice" :doc="liveDoc" />
          <ChainMeter :doc="viewDoc" />
          <EventTicker :doc="viewDoc" />
          <ChallengeBoard v-if="!practice" :doc="liveDoc" />
          <MechanismPanel :doc="viewDoc" />
          <HistoryList :doc="liveDoc" />
        </aside>
      </section>

      <ControlDeck
        :plunger-power="viewDoc.plunger.power"
        :plunger-ready="plungerReady"
        :paused="viewDoc.phase === 'paused'"
        :can-pause="canPause"
        :practice="practice"
        @left="input.setLeft"
        @right="input.setRight"
        @plunger="onPlunger"
        @nudge-left="input.pulseNudge(-1)"
        @nudge-right="input.pulseNudge(1)"
        @pause="input.pulsePause"
        @restart="input.pulseRestart"
      />
    </main>
  </div>
</template>
