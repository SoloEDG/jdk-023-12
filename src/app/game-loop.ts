import { commandFromInput, type FrameInput } from '@/shared/commands'
import { absorbZones, tickBonus } from '@/features/bonus'
import { advanceControls } from '@/features/flippers'
import { persist, syncRecords } from '@/features/records'
import { simulateBall } from '@/features/scoring'
import { applyPracticeDrain } from '@/features/practice'
import { anchors, consumeContacts, publishGates, sampleRamp, sampleScoop, stickPlunger, syncTable } from '@/features/table'
import { applyDrain, restartGame, togglePause } from '@/app/cabinet-actions'
import type { GameSession } from '@/app/session'

export function runFrame(session: GameSession, input: FrameInput, dtMs: number): void {
  const doc = session.getActive()
  const inPractice = session.getPractice() !== null
  const command = commandFromInput(input)
  if (command?.type === 'restart') {
    if (inPractice) session.restartPractice()
    else restartGame(doc)
    return
  }
  if (command?.type === 'pause-toggle') {
    togglePause(doc)
    return
  }
  if (doc.phase !== 'paused' && doc.note.ms > 0) doc.note.ms -= dtMs
  if (doc.phase === 'paused' || doc.phase === 'gameover') return

  advanceControls(doc, input, dtMs, anchors())
  if (doc.ball.held === 'plunger') stickPlunger(doc)
  if (doc.phase !== 'playing') return

  doc.run.playMs += dtMs
  tickBonus(doc, dtMs)
  const solids = syncTable(doc, dtMs)
  if (doc.ball.held !== 'plunger') {
    const events = simulateBall(doc, solids, dtMs, { ramp: sampleRamp, scoop: sampleScoop })
    consumeContacts(doc, events)
    absorbZones(doc, events)
    publishGates(doc)
    if (doc.signals.drain) {
      if (inPractice) applyPracticeDrain(doc)
      else applyDrain(doc)
    }
  }
  if (!inPractice) syncRecords(doc)
}

export function startLoop(session: GameSession, pull: () => FrameInput): () => void {
  let last = performance.now()
  let handle = 0
  const onHide = (): void => {
    if (document.hidden) persist(session.getLive())
  }
  const onLeave = (): void => persist(session.getLive())
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onLeave)
  const tick = (now: number): void => {
    const step = Math.min(32, Math.max(0, now - last))
    last = now
    runFrame(session, pull(), step)
    handle = requestAnimationFrame(tick)
  }
  handle = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(handle)
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onLeave)
  }
}
