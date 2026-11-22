import { computed, reactive, shallowRef, ref, type ComputedRef, type Ref } from 'vue'
import { createDocument, flashNote, type Phase, type PinballDocument, type SpawnId } from '@/shared/document'
import { readSave } from '@/features/records'
import { mountFresh } from '@/features/table'
import { createPracticeDocument, findSpawn, placePracticeBall } from '@/features/practice'

/** The slice of the session the game loop drives. */
export interface GameSession {
  getLive: () => PinballDocument
  getActive: () => PinballDocument
  getPractice: () => PinballDocument | null
  restartPractice: () => void
}

export interface SessionHandle extends GameSession {
  liveDoc: PinballDocument
  activeDoc: ComputedRef<PinballDocument>
  inPractice: ComputedRef<boolean>
  spawn: Ref<SpawnId>
  enterPractice: () => void
  exitPractice: () => void
  setSpawn: (spawn: SpawnId) => void
}

export function createSession(): SessionHandle {
  const liveDoc = reactive(createDocument())
  mountFresh(liveDoc, readSave())

  const practiceRef = shallowRef<PinballDocument | null>(null)
  const spawn = ref<SpawnId>(liveDoc.practice.spawn)
  let phaseBeforePractice: Phase | null = null

  const activeDoc = computed(() => practiceRef.value ?? liveDoc)
  const inPractice = computed(() => practiceRef.value !== null)

  function openCopy(at: SpawnId): void {
    practiceRef.value = reactive(createPracticeDocument(liveDoc, at)) as PinballDocument
  }

  function enterPractice(): void {
    if (practiceRef.value) return
    phaseBeforePractice = liveDoc.phase
    // The live run never advances during practice; freeze it explicitly so the
    // player sees why, keeping phaseBeforePause for a clean hand-back on exit.
    if (liveDoc.phase === 'ready' || liveDoc.phase === 'playing') {
      liveDoc.phaseBeforePause = liveDoc.phase
      liveDoc.phase = 'paused'
    }
    openCopy(spawn.value)
  }

  function exitPractice(): void {
    if (!practiceRef.value) return
    practiceRef.value = null
    if (phaseBeforePractice && phaseBeforePractice !== 'paused') {
      liveDoc.phase = phaseBeforePractice
      liveDoc.phaseBeforePause = null
    }
    phaseBeforePractice = null
  }

  function setSpawn(next: SpawnId): void {
    spawn.value = next
    const current = practiceRef.value
    if (!current) return
    placePracticeBall(current, next)
    flashNote(current, `练习出生点：${findSpawn(next).label}`)
  }

  function restartPractice(): void {
    const current = practiceRef.value
    if (!current) return
    openCopy(current.practice.spawn)
  }

  return {
    liveDoc,
    activeDoc,
    inPractice,
    spawn,
    getLive: () => liveDoc,
    getActive: () => activeDoc.value,
    getPractice: () => practiceRef.value,
    enterPractice,
    exitPractice,
    setSpawn,
    restartPractice,
  }
}
