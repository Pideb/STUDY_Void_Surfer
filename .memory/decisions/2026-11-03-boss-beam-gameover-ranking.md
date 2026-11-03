# Confirmed bug-fix scope

- Verify horizontal beam against visible boss artwork. Transparent corners must miss. Preserve timing, motion, damage and one hit per shot; cache alpha masks of the renderer's articulated layers, no per-frame pixel reads.
- Guest game-over TOP10 must use public RPC; private neighborhood remains authenticated. Auth error can fall back to public TOP10.
- Isolate read results, cache same-run responses during the pilot-ranking subview without repainting it; ignore later-run responses.
- Remove game-over retry button/callback only; full pilot ranking retry remains. Preserve truthful score-save errors.
- Local fix/test/commit only. Prior v0.2 deployment proof recorded separately before source changes; no new game release requested.

## Follow-up: pilot-ranking retry
User reports guest pilot-ranking error retry is still present and ineffective; authorizes fixing and renaming to `랭킹 다시 불러오기` or removing. Keep a working manual retry with explicit label. Automatic pagination must stop on error/loading and must never observe an error-retry control. Preserve already loaded rows/failed offset, deduplicate pending retries, and discard responses after leaving ranking. Game-over retry stays removed. No push/deploy authorized.
