# Decisions: Flight Performance, Ambient Lasers and Boss Siren

- Date: 2026-10-29 (Asia/Seoul)
- Status: Confirmed. Interview complete; production implementation not started.
- This is a new change set after the completed boss-motion-aim-patterns plan. Do not reopen that plan or change its completed pointer.

## D01. Speed Growth Cap
- User requested cap220 for all aircraft, preserving actual+10px/s per10 progression points and separate boss multipliers.
- Derived ordinary ceilings: NOVA/AEGIS460px/s; VELOCITY700px/s. Existing easing and monotonic progression remain.

## D02. Ambient Line Lasers
- Confirmed: unlock after the second boss is cleared; allow both normal flight and WARNING.
- Confirmed: attempt every3 eligible flight seconds with70% probability; no queued missed attempts.
- Confirmed: one line70%, two lines30%, using the existing line-laser safety/edge restrictions and telegraph/fire/fade behavior.
- Preserve safe wall openings, moving-gap envelopes and imminent special-wall response checks. If two safe heights are unavailable fall back to one; skip if none is safe.
- Boss entrance/portals/challenges must not overlap a leftover ambient attack. Specific lifecycle implementation belongs in the plan.

## D03. Boss Background Travel
- User requested constant background travel throughout each boss fight, based on its entry-time travel speed, independent of boss slow/fast/shift changes.
- Wall speed and boss vertical motion remain their own systems. Preserve pause/WASD clock freezes and continuity of accumulated background distance.
- Code inspection also found an independent sinusoidal vertical artwork offset and a tile-blend overlap derived from live wall speed. During boss mode, keep the artwork vertically stable and use the captured background speed consistently for both accumulated travel and tile blending, so fixing distance alone cannot leave visible drifting/popping. Keep player/boss animation clocks separate.

## D04. Rendering Performance
- User requested preserving player/boss clarity while lowering other rendering resolutions in descending order: aircraft/boss > walls > projectiles > lasers.
- Inspection: all currently draw into the same viewport-resolution canvas; laser rays repeatedly use blur/glow passes. Original image file sizes alone do not establish the bottleneck.
- Confirmed option1: retain player/boss/UI at current100% render density; walls75%, projectiles50%, lasers35%, backgrounds50% of current width and height. Ratios describe raster dimensions, not frame/input/update rate or asset/world sizes.
- Measure before/after frame cost in matched representative scenes. Keep collision geometry, telegraph visibility, input rate and UI readability independent of raster density. Preserve danger boundaries and thin warning cues if low-density rasterization harms legibility; performance gain is to be measured, not presumed.

## D05. Boss Entry Siren
- Latest user revision supersedes the earlier1.5s/single-wail choice: use example01's broad low mechanical timbre, shorten each wail and repeat three times. User permits a longer overall alarm/intro.
- User dislikes the cute/beeping character of the current sound. Do not merely increase volume.
- Revised sound and timing approved by user choice1; existing mute, pause/resume, deduplication and BGM ducking behavior must remain.
- Original reference: [Two review-only1.5s sound examples](../previews/2026-10-29-flight-performance-lasers-siren/preview.html). User selected01 timbre and requested the three-repeat revision;02 is not selected.
- **Approved asset**: [03-broad-triple.wav](../previews/2026-10-29-flight-performance-lasers-siren/03-broad-triple.wav), demonstrated in the [three-repeat player](../previews/2026-10-29-flight-performance-lasers-siren/triple-review.html). Uses.7s pulses with.15s silent gaps, onsets0/.85/1.7, total2.4s. Frequencies are resynthesized at the same contour/pitches, not raised by sped-up playback. SHA256:`925ffc1b9ef079dd9dca52260398af72b9224ff633479a7b3111b6d50efb18b2`. Production remains unchanged at interview completion.
- Synchronize entry alert length and siren/BGM ducking to2.4s rather than cutting the sound off at the old1.5s. Keep existing.4s darkening/1s boss entrance durations and live-flight behavior.
- Current generated fallback: `src/audio/boss-entry-siren.js`; published asset generated/copied through `scripts/build-game-audio.mjs`. Update both consistently to match the approved sample.

## D06. Guest Aircraft Selection and No Persistent Guest Records — Confirmed
- User explicitly added this item for inspection and adjustment before planning is finalized.
- Verified pre-change UI and engine both bypass aircraft score locks in guest mode: NOVA, AEGIS and VELOCITY all selectable at0 points.
- Signed-in accounts: NOVA always, AEGIS best50, VELOCITY best100.
- The old guest best score is browser-local, not a global leaderboard submission and not transferred into the account on sign-in. This explains the visible hangar score despite absence from global ranking.
- Confirmed user choice2: guests may use NOVA only. AEGIS/VELOCITY require login and the existing account unlock thresholds. Enforce in the hangar and engine; do not merely disable the visible buttons.
- Additional explicit user request: do not save guest records. Remove guest best-score reads/writes and guest personal-record displays from hangar/ranking/results. Current-run HUD/result score remains transient; no guest score is submitted to the server or retained for another run/session.
- Retire the old dedicated key `void-surfer:guest-record:v1` with scoped cleanup only; never clear unrelated storage, account sessions, settings or account scores. Tolerate unavailable storage.
- Public ranking browsing may remain; guests have no own saved record row. Show a concise sign-in message where the personal-record area requires a state, rather than a fictitious0-point best.
- Keep signed-in account score storage/submission, unlock rules and administrator score exclusion unchanged.

## Interview Completion
- All six decision areas confirmed; no remaining user-design question.
- Confirmed by user: cap220, ambient lasers after boss2 in normal/WARNING with3s/70% and1/2-line70/30%, constant boss background, chosen rendering ratios, approved three-repeat siren, guest NOVA-only/no records.
- Derived from code/necessary implementation: actual speed ceilings460/700; shared-canvas layer separation; preserve background blend speed as well as distance; enforce guest policy in UI and engine; synchronize synthesized and packaged siren and alert timing.
- Known constraints to retain: existing laser safety logic, collision coordinates independent of raster size, account leaderboard/unlock behavior, pause/WASD freezing and audio lifecycle.
- No unrelated scope issue was found. Rendering performance improvement must be measured rather than asserted from image sizes.
- Next workflow stage: `/memory-plan flight-performance-lasers-siren`, followed by sequential execution when requested. Do not mark the completed previous plan active.
