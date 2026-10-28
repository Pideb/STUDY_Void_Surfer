# Menu Music and Manual Boss Laser — Validation

- Date: 2026-10-28 (Asia/Seoul).
- Result: all six planned Tasks implemented; final automated checks and renderer review passed.
- [View screenshots, penalty videos and the production menu loop](./review.html).

## Implemented behavior
- ORBIT RUN menu music: approved audition reproduced byte-for-byte before preparing its seamless 17.143-second, 8-bar, 112 BPM stereo loop. The loop has no fade-to-silence and is separate from the twelve stage tracks.
- One independent laser shot recharges over 10 seconds of active boss flight, with capacity one. Pause/WASD suspend the clock; success never grants ammunition or damage. Charge begins after entrance; sub-frame entrance remainder is excluded.
- Shift/Ctrl or the separate mobile fire button consumes one ready shot. Ship faces the boss, charges .20s, hits once, and resumes after .10s recovery. World attacks/walls continue, and firing grants no immunity. Physics resumes for only the unlocked portion of a frame.
- Three manual laser hits remove three HP and grant the existing +10 boss reward/stage transition. Remaining old boss walls cannot become ordinary score after an early kill.
- Wall-phase projectile opportunities fire one projectile, regardless of special-wall presence. After walls fully leave, 1–3 complete stage signatures fire in succession; every repeat waits for prior offscreen resolution and gives a new 1.1s warning.
- Ink set03 / glitch set05 are rendered once on canvas for 5 seconds, fading during the final 1.2s. Glitch uses changing noise/bands; reduced-motion mode retains the obstruction without rapid animation. Old CSS obstruction was removed to avoid doubling intensity.

## Automated verification
- `npm test -- --run`: **46 files / 597 tests passed**.
- `npm run build`: passed; Vite 7.3.6, 94 modules. Main JS 385.21 kB (110.73 kB gzip), CSS 18.70 kB (4.88 kB gzip).
- `npm run verify:config`: passed after the completed build. Build/config must run sequentially because the latter inspects dist.
- `git diff --check`: passed.
- Existing legacy tests were updated to use the public manual-fire API instead of assuming challenge success deals damage; other regression guarantees remain.
- Multi-cycle integration covers all three aircraft and six stage bosses, challenge failure/retry, manual hits, score, portal/restart, special-wall spacing and stage ownership.
- Independent signature coverage exercises all six stage identities at 1/2/3-repeat RNG selections. Firing tests cover one-slot capacity, exactly-once impact, paused clock, .3s lock, partial-frame physics, actual wall death during firing, detached snapshots, key-repeat/blocking and mobile button input.
- Audio checks cover approved audition hash, production reproducibility, loop sample format/edge/energy, menu cache/pause offsets, late-load scene isolation and existing mute/lifecycle behavior.

## Actual renderer / layout evidence
Captured using local headless Firefox and the **production renderer, game HUD and CSS**, with deterministic states obtained through the real engine API. Each fixture loaded **53/53 visual assets**, no failures. `runtime.mjs` documents the fixture; no production debug mutation API was added.

| Evidence | Finding |
| --- | --- |
| [ready.png](./ready.png) / ready.json | 1280×720: bottom ready gauge fits; touch fire button display is none. |
| [mobile.png](./mobile.png) / mobile.json | 640×360 landscape: separate fire button visible/enabled, bounds x512–624/y220.8–272; gauge and controls fit. |
| [charge.png](./charge.png) | Actual aligned ship / pre-shot charging glow. |
| [beam.png](./beam.png) | Luminous guaranteed-hit beam meets boss core; HP2/3 and gauge consumed. |
| [ink.png](./ink.png) / [ink.webm](./ink.webm) | Approved localized ink, clear ship corridor; normal→5s effect→recovery. |
| [glitch.png](./glitch.png) / [glitch.webm](./glitch.webm) | Approved stronger moving static/bands with readable underlying scene. |
| [menu.png](./menu.png) | Existing title/menu design retained; review page plays the new production ORBIT RUN loop. |

- All seven fixture reports confirm no document overflow. Gauge bounds fit both tested viewports.
- Ink video: **6.487s, 128 decoded frames**. Glitch: **6.525s, 131 decoded frames**. Both have different presented-frame hashes at the sampled effect times, reached EOF and seeked to3s. See ink.json / glitch.json playback fields and `verify-videos.html`.
- Video source is normal .5s → effect5s → normal recovery. Canvas is recorded; screenshots include HUD. Existing deterministic gameplay snapshot is used to isolate visual motion; these are not recordings of a human survival attempt.
- Reproduce: run Vite on127.0.0.1:4186, `node .memory/validation/2026-10-28-menu-music-manual-fire/serve.mjs`, then use runtime.html mode=ready/mobile/charge/beam/ink/glitch/menu with capture=1 through4188; record=1 for ink/glitch and verify-videos.html for native playback validation. Capture server writes only allow-listed local evidence filenames.

## Review limits and adjacent work
- Screenshot fixtures intentionally use gravity0/admin collision bypass for deterministic framing. Real high-speed firing difficulty, subjective audio mix and physical mobile touch ergonomics still benefit from the user's playtest; automated checks do not claim those subjective results.
- Related necessary fixes: remove duplicate CSS penalty cover; separate old WASD damage from HP; exclude leftover boss walls from ordinary scoring after a manual early kill; avoid counting entrance time toward recharge.
- No additional out-of-scope defect requiring a new Task was found. Azure access/deployment remains the previously deferred separate work; authentication, Supabase and leaderboard were not changed.
