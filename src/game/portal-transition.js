import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

const DURATIONS = Object.freeze({ 'lead-in': .45, 'white-out': .2, hold: .1, reveal: .6 });
const NEXT = Object.freeze({ 'lead-in': 'approach', approach: 'white-out', 'white-out': 'hold', hold: 'reveal', reveal: 'complete' });
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;

export function createPortalTransition({ fromKey, toKey, fromStageId, destinationStageId, crossingX = 240 } = {}) {
  return {
    kind: 'portal', fromKey, toKey, fromStageId, destinationStageId,
    phase: 'lead-in', elapsedSeconds: 0, phaseElapsedSeconds: 0,
    travelledPixels: 0, portalX: finite(crossingX, 240) + WORLD_WIDTH,
    crossingX: finite(crossingX, 240), crossingY: WORLD_HEIGHT / 2,
    progress: 0, swapped: false,
  };
}

export function advancePortalTransition(transition, deltaSeconds, scrollSpeed) {
  if (!transition || transition.phase === 'complete' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return transition;
  const speed = Math.max(1, finite(scrollSpeed, 240));
  let remaining = deltaSeconds;
  for (let guard = 0; guard < 6 && remaining > 1e-9 && transition.phase !== 'complete'; guard++) {
    const approach = transition.phase === 'approach';
    const available = approach ? (WORLD_WIDTH - transition.travelledPixels) / speed
      : DURATIONS[transition.phase] - transition.phaseElapsedSeconds;
    const consumed = Math.max(0, Math.min(remaining, available));
    transition.elapsedSeconds += consumed;
    transition.phaseElapsedSeconds += consumed;
    if (approach) transition.travelledPixels = Math.min(WORLD_WIDTH, transition.travelledPixels + speed * consumed);
    remaining -= consumed;
    if (available - consumed <= 1e-9) {
      transition.phase = NEXT[transition.phase];
      transition.phaseElapsedSeconds = 0;
      if (transition.phase === 'hold') transition.swapped = true;
    } else break;
  }
  transition.portalX = transition.crossingX + WORLD_WIDTH - transition.travelledPixels;
  if (['white-out', 'hold', 'reveal', 'complete'].includes(transition.phase)) transition.portalX = transition.crossingX;
  transition.progress = transition.travelledPixels / WORLD_WIDTH;
  return transition;
}
