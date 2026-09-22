# Decisions: Original BGM

- Date: 2026-09-22
- Status: Confirmed

## D01. Music source

- **Chosen**: Create original procedural chiptune loops with the existing Web Audio API; do not copy or bundle the provided Mega Man 2 MP3.
- **Rationale**: Code-generated music avoids third-party asset distribution and licensing concerns while preserving a retro game character.

## D02. Menu music

- **Chosen**: Play an original sci-fi space-combat synth/chiptune loop while the signed-in main menu is visible. It may evoke a broad 16-bit space-flight mood but must not reproduce a Starfox melody, arrangement, or sound recording.
- **Rationale**: A dedicated menu theme reinforces the new space-scene presentation without relying on external copyrighted audio.

## D03. Playback lifecycle

- **Chosen**: Loop menu music on menu entry, switch to a separate gameplay chiptune loop when a run begins, pause gameplay music during game pause, and resume it on continued play. Existing mute control silences both music and effects.
- **Rationale**: Audio state matches player-visible game state and avoids music continuing beneath a paused run.

## D04. WARNING and BOSS music

- **Chosen**: On WARNING entry, layer a short original urgent sci-fi alarm stinger over the active gameplay loop. On BOSS entry, switch to an original heavy, gritty military-synth/chiptune boss loop, then return to the gameplay loop when that BOSS segment ends.
- **Rationale**: WARNING gets immediate tension without interrupting momentum, while BOSS earns a distinct musical identity. The compositions may use broad genre characteristics only and must not reproduce Mega Man X warning sounds or Metal Slug melodies, arrangements, or recordings.
