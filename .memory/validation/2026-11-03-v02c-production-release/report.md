# v0.2c production release

User explicitly requested v0.2c and exactly one player-guide bullet: 기체별 랭킹 세부화. Prior v0.2b and v0.2 entries remain unchanged and ordered below the new entry. Startup popup shares the same source.

## Validation and release
- release:prepare --new-release --version0.2c completed:86 test files /1,421 tests passed; build/config/docs/guide checks passed.
- currentVersion/developmentVersion0.2c, versionBase0.2, next default0.21.
- All previous protected snapshot hashes and guide entries preserved (baseline.json/preparation.json).
- Published prepared commit7435c067ba72629bb73fb59a94943eb204a4ca7e via normal fast-forward main push. Aircraft rankings/private final-score plumbing and startup update popup are included; no balance/audio changes.
- Exact-HEAD Azure Actions run41590988690 completed successfully at2026-11-03T06:38:37Z (15:38:37 KST). Connector job inspection confirmed all build/deploy steps succeeded.
- Downloaded production index, JavaScript, CSS and guide with cache bypass. JS SHA2562a3953d4dda5edb8693c14c097d57e3567a9112e37e06fab47ae76da3966ed78; CSS SHA256703b2d70edb6489fa2d9c8fa02ae7b804b42e6e03b5497edeed0b4b743a14ed4. Both match the validated local build exactly.
- Production guide equals local generated guide, including versions v0.2c/v0.2b/v0.2 and exact preserved bullets. Emitted JS contains0.2c, the requested latest note, and both new aircraft-ranking RPC names.
- Ran release:record-deployment against newly captured proof; no previous proof was reused. Management/presentation/current release snapshot and registry were regenerated/protected by the normal tool.

## Limits and boundaries
No remote SQL migration, score/history writes, login/token extraction or forced browser permissions. The earlier public Supabase check showed overall13/NOVA10/AEGIS2/VELOCITY1 and private anonymous access denied; authenticated score/history delivery still requires a legitimate logged-in play session to verify. Deployment-byte checks are not a claim of that live write verification.

## Learnings
The guide entry is prepended to the manual `entries` array; `entries[0]` automatically supplies the startup popup. `release:prepare` distinguishes a validated pending release from deployed success. Exact workflow HEAD and asset SHA256 comparisons establish which source actually reached production. No unrelated adjacent issue required changes.

Metadata/evidence push follows this proof and can trigger the same workflow again. Its result is recorded separately; the original verified deployment HEAD is never relabeled.
