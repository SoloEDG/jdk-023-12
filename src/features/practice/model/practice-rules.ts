import { flashNote, type PinballDocument, type SpawnId } from '@/shared/document'
import { clearChain } from '@/features/bonus/model/bonus-clock'
import { clearWarnings } from '@/features/flippers/lib/plunger-nudge'
import { stickPlunger } from '@/features/table/lib/playfield-layout'

export type { SpawnId }

export interface SpawnPoint {
  id: SpawnId
  label: string
  detail: string
  x: number
  y: number
  onPlunger: boolean
}

export const SPAWN_POINTS: SpawnPoint[] = [
  { id: 'plunger', label: '发射槽', detail: '蓄力后发射', x: 372, y: 640, onPlunger: true },
  { id: 'center', label: '台面中央', detail: '弹力柱下方', x: 196, y: 330, onPlunger: false },
  { id: 'lanes', label: '顶部通道', detail: '从通道落下', x: 176, y: 120, onPlunger: false },
  { id: 'left-flipper', label: '左挡板前', detail: '直接试左挡板', x: 162, y: 620, onPlunger: false },
  { id: 'right-flipper', label: '右挡板前', detail: '直接试右挡板', x: 238, y: 620, onPlunger: false },
  { id: 'hole', label: '回球洞前', detail: '试试洞口反弹', x: 188, y: 400, onPlunger: false },
]

export function findSpawn(id: SpawnId): SpawnPoint {
  return SPAWN_POINTS.find((point) => point.id === id) ?? SPAWN_POINTS[0]!
}

function cloneDocument(source: PinballDocument): PinballDocument {
  return JSON.parse(JSON.stringify(source)) as PinballDocument
}

/** Drop the practice ball at a spawn point without touching score, drops, gates or chain. */
export function placePracticeBall(doc: PinballDocument, spawnId: SpawnId): void {
  const spawn = findSpawn(spawnId)
  const wasPaused = doc.phase === 'paused'
  doc.practice.spawn = spawnId
  doc.plunger.power = 0
  doc.plunger.charging = false
  doc.ball.holdMs = 0
  doc.ball.rideMs = 0
  doc.ball.rideDur = 1
  doc.ball.idleMs = 0
  doc.signals.drain = false
  doc.phaseBeforePause = null
  if (spawn.onPlunger) {
    stickPlunger(doc)
    doc.phase = 'ready'
  } else {
    doc.ball.held = 'none'
    doc.ball.x = spawn.x
    doc.ball.y = spawn.y
    doc.ball.vx = 0
    doc.ball.vy = 0
    doc.phase = 'playing'
  }
  if (wasPaused) {
    doc.phaseBeforePause = doc.phase
    doc.phase = 'paused'
  }
}

/**
 * Practice owns a throwaway copy of the live table. Drops we knock down, gates we
 * open and chains we build live only inside this document, so the paused live run
 * keeps its ball, remaining bonus time and nudge warnings exactly as they were.
 */
export function createPracticeDocument(source: PinballDocument, spawnId: SpawnId): PinballDocument {
  const doc = cloneDocument(source)
  doc.score = 0
  doc.feed = []
  doc.feedSeq = 0
  doc.note = { text: '', ms: 0 }
  doc.practice = { spawn: spawnId, balls: 0 }
  doc.run = {
    launched: false,
    committed: false,
    playMs: 0,
    storedScore: 0,
    storageWarned: source.run.storageWarned,
  }
  doc.plunger = { power: 0, charging: false }
  doc.nudge = { warnings: 0, tilted: false, flashMs: 0, flashDir: 0 }
  doc.live = { ...doc.live, tilted: false }
  doc.flippers.left = { ...doc.flippers.left, held: false, omega: 0 }
  doc.flippers.right = { ...doc.flippers.right, held: false, omega: 0 }
  doc.signals.drain = false
  // The copy always starts playable; the live table's pause state is not copied.
  doc.phase = 'ready'
  doc.phaseBeforePause = null
  placePracticeBall(doc, spawnId)
  return doc
}

/** Practice never runs out of balls: a drain simply serves the next one. */
export function applyPracticeDrain(doc: PinballDocument): void {
  doc.signals.drain = false
  doc.live.tilted = false
  clearWarnings(doc)
  clearChain(doc)
  doc.practice.balls += 1
  placePracticeBall(doc, doc.practice.spawn)
  flashNote(doc, `练习第 ${doc.practice.balls + 1} 颗球`)
}
