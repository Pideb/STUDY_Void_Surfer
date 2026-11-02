# Confirmed bug-fix scope

- Verify horizontal beam against visible boss artwork. Transparent corners must miss. Preserve timing, motion, damage and one hit per shot; cache alpha masks of the renderer's articulated layers, no per-frame pixel reads.
- Guest game-over TOP10 must use public RPC; private neighborhood remains authenticated. Auth error can fall back to public TOP10.
- Isolate read results, cache same-run responses during the pilot-ranking subview without repainting it; ignore later-run responses.
- Remove game-over retry button/callback only; full pilot ranking retry remains. Preserve truthful score-save errors.
- Local fix/test/commit only. Prior v0.2 deployment proof recorded separately before source changes; no new game release requested.
