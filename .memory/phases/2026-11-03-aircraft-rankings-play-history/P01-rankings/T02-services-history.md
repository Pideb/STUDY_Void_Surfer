# Task: T02 Services and private run scores

## Status: done

## Goal
Connect scoped ranking reads and retain every observed terminal score through existing telemetry/outbox.

## Decision Summary
- Overall submit response remains overall best even when aircraft best is lower.
- Extend existing logging only; telemetry never blocks flight.

## Implementation
### I01. Ranking service contracts
- Related Files: `src/services/leaderboard-service.js` fetchLeaderboardPage/new fetchPlayerAircraftRecord; `src/main.js` facade; `tests/services/leaderboard-service.test.js`.
#### Details
- `fetchLeaderboardPage(client,{limit=50,offset=0,aircraftId=null}={})`: null scope calls existing get_public_leaderboard with unchanged params; known craft calls get_aircraft_leaderboard(p_aircraft_id,p_limit,p_offset). Invalid ID validation error/no request. Never silently fallback to overall if new RPC absent.
- `fetchPlayerAircraftRecord(client,aircraftId)` -> `{record:normalizedRow|null,error}`; validate known craft, call get_player_aircraft_record; empty list=no record; normalizeLeaderboardRows using session user ID, excluding private fields. Add main facade/config error stub.
- Preserve submitBestScore/fetchTopScores/fetchPlayerNeighborhood/fetchPlayerBestScore overall behavior; controller accepts returned overall aircraft different from submitted craft.
### I02. Final-score transport
- Related Files: `src/services/play-session-tracker.js` finish; `src/services/play-record-outbox.js` endData; `src/services/play-record-service.js` finish; `src/ui/app-controller.js` terminal paths.
#### Details
- `finish(outcome,finalScore=null)` end DTO adds integer0..2147483647|null, freezes once. Missing legacy value=null, known0 stays0; invalid supplied value rejected. Preserve field across outbox serialization/reload without changing schemaVersion1, caps100/30days or nonce/owner checks.
- Service known score sends5arg finish_play_session including p_final_score; unknown uses old4arg. Missing5arg migration uses existing nonretryable diagnostic, never silently drops known score to old RPC.
- Controller helper captures snapshot.finalScore??snapshot.score at death (first explosion frame), abandoned on menu/pagehide/destroy using latest observable snapshot. Repeated death/restart cannot mutate old score/duration; abandon never submits ranking. Existing tracker begin auto-abandon without observable score remainsNULL. Guest/admin telemetry allowed, ranking eligibility unchanged.
### I03. Regression tests
- Related Files: existing service/tracker/outbox tests and `tests/integration/ranking-duration.test.js`.
- Test null/0/invalid, reload/retry score retention, lower-score history, frozen score/time on restart, multiplier finalScore, abandonment, identity changes. No private fields in ranking DTO/UI.

## Acceptance Criteria
- [x] Scoped endpoints validate/rout correctly; overall unchanged.
- [x] Terminal scores persist through outbox and freeze per run.
- [x] Guest/admin histories never enter official rankings.

## Validation
- `npm run test -- --run tests/services/leaderboard-service.test.js tests/services/play-session-tracker.test.js tests/services/play-record-outbox.test.js tests/services/play-record-service.test.js tests/integration/ranking-duration.test.js tests/ui/app-controller.test.js`

## Commit Message
```text
feat(records): connect aircraft ranking services and private final scores

Plan: 2026-11-03-aircraft-rankings-play-history
Phase: P01-rankings
Task: T02-services-history
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history (T02-services-history); 122 targeted tests passed
