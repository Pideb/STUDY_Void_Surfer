# Decisions: aircraft rankings and private play scores

- Date: 2026-11-03
- Status: Confirmed
- Stage: grill-me complete; implementation planning not yet started.

## D01. Ranking categories
- **Chosen by user**: Preserve overall ranking and add independent NOVA / AEGIS / VELOCITY rankings.
- **Rationale**: Each aircraft has different gameplay characteristics; each account must retain a personal best for every aircraft, even below that account's overall personal best. Filtering the current single best per account is insufficient.
- **Implementation default**: Four tabs in the existing pilot-ranking screen: 종합 / NOVA / AEGIS / VELOCITY. Open on 종합; selected tab controls both public list and the fixed personal-best area. Preserve existing pagination/manual reload behavior and stale-response protection when switching tabs.

## D02. Game-over ranking
- **Chosen by user**: Game-over shows only overall ranking (existing TOP10 and neighborhood structure). Do not add aircraft ranking sections there. Aircraft rankings are available through the full pilot-ranking screen.
- **Rationale**: User explicitly chose overall-only instead of either previously offered game-over aircraft display.

## D03. Existing records
- **Chosen by user**: Preserve existing overall records and seed their stored aircraft's initial personal best from those same records. Preserve score, achieved_at and matching private tie duration; do not reset or replace historical scores.
- **Verified from code and read-only public RPC**: Current player_scores is keyed only by user_id. Public records include aircraft_id; at interview time12 accounts were returned, NOVA10/AEGIS2. Counts are an observation, not migration constants. Historical legacy migration assigns default when aircraft was absent/invalid; original unknown aircraft cannot be inferred beyond stored data.
- **Limit**: Scores below the old account-wide personal best were not retained. Private play_sessions currently stores aircraft, version, times and outcome but no score. Do not fabricate missing historical aircraft bests or retroactively fill unknown past scores with zero. Preserve such records with unknown/NULL score when extending history.

## D04. Every run's score history
- **Chosen by user**: Option1: save each run's final score privately in addition to best-score rankings. A low-scoring run is retained as history without replacing a higher personal best.
- **Implementation constraints**: Extend the existing private play_sessions/tracker/service/outbox path; do not create a second independent telemetry stream. Keep aircraft, duration, start/end, outcome, version and account/guest identity. New score field is nullable for legacy/incomplete/unknown results; known0 is a valid score distinct from unknown.
- **Default for terminal events**: Capture the actual final score at death. On abandonment, retain the observable current/final score if available and label abandoned, never rank an abandoned run; if unavailable preserve unknown. Repeated completion/retry must not change or duplicate a finalized run. Never let private-record delivery block flight/restart.
- **Reliability limit**: Existing browser outbox retries are bounded (100 runs/30 days); browser force-stop/storage failure/network loss can leave incomplete/undelivered records. Implementation must retain safe retry behavior, not claim guaranteed server persistence for every forced browser termination.

## D05. Preserve existing ranking rules
- **Derived from existing code; not a new balance decision**: Use the existing final score, including VELOCITY1.5 rounding. Overall ranking remains one account-wide best (maximum across aircraft), not three entries for the same account.
- **Derived from existing sorting**: Higher score first, equal score uses longer active play duration, then existing achieved_at/user_id deterministic ordering. Apply consistently to overall and aircraft rankings. Duration remains private and is not returned in public ranking UI/API columns.
- **Derived from existing behavior**: Aircraft unlock/account-best decisions keep using overall account best; temporary unlock policy/aircraft stats unchanged. Logged-out visitors can read all public ranking tabs but cannot submit official scores. Guest/admin-test private histories can include scores, with admin flag retained; neither enters official rankings.

## D06. Migration and compatibility constraints
- **Derived**: New DB schema/RPC migration is required; adding client-side filters alone loses lower aircraft bests. Preserve current deployed client's RPC behavior during rollout. Keep public reads separate from authenticated writes; private history and tie durations remain blocked from direct public reads.
- Migrate via verified SQL with before/after invariants; no reset/delete of real scores, no inferred scores from unrelated telemetry. Plan local SQL role/concurrency/rollback tests. Remote administrative access or operator SQL application may be needed; currently there is only a public client key, no administrator connection.
- No new provider or auth flow is needed. Do not apply migrations or deploy as part of this interview stage. Current production remains v0.2b; next default release0.21 is prepared only when requested.

## D07. Scope and next step
- Confirmed requirements are ready for memory-plan, then sequential memory-execute. This file records requirements/defaults, not completed implementation or a deployment promise.
- Necessary adjacent work: best-score response validation must account for aircraft-specific bests and overall best; tab-switch asynchronous state must not overwrite another tab; existing outbox serialization must retain the new score across retries and old pending records. Include in the plan to implement this same feature safely.
- No unrelated audio, boss balance, guest ranking eligibility, or release-history changes requested.
