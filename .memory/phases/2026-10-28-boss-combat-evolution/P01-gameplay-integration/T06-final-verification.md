# Task: T06 Integrated gameplay and production visual verification

## Status: pending

## Goal
Prove every approved feature works together in real game output, close any regression, and leave plan/current pointers complete.

## Decision Summary
- Implement approved decisions in .memory/decisions/2026-10-27-boss-combat-evolution.md, without reopening accepted art/audio/balance.
- Depends on preceding Tasks. Preserve their public snapshots/interfaces; execute sequentially. No external DB or credentials required.

## Implementation

### I01. Runtime behavior and public contracts
- Related Files: `tests/integration/combat-evolution.test.js` new, affected game/render/audio tests for regressions, optional `scripts/verify-combat-assets.mjs`, `README.md`, memory Task/phase/plan/current. Production files only if final validation identifies in-scope defects.

#### Details
- **Signatures & Types**:
```typescript
End-to-end deterministic simulation helpers pump createGameEngine with now/gravity/rng and admin invincibility; screenshot harness uses actual createRenderer/visual loader from production, never preview draw functions.
```
- **Data & Schema Fields**: Coverage matrix ties D01..D15 to unit/integration/asset/browser evidence. QA screenshots may be saved under `.memory/validation/2026-10-28-boss-combat-evolution/`; no credentials or DB writes. Existing live Supabase auth/leaderboard remains outside thisgameplay-onlyverification.
- **Execution Flow / Logic**:
  1. Precondition & Validation: normalize finite inputs, retain existing API defaults and engine state guards. Handle absent optional browser APIs through existing fallbacks.
  2. Core Processing: Run complete test suite/build/config verification once after integrating. Drive first/laterbosses, failures/retries, six stage identities andportal switches, all aircraftspeedcaps, restart/pause/death, and publicassetHTTP retrieval. Browser-render actual production renderer with deterministic injected snapshots for all six bosses/portals and capturefullframes; verify actualcharacter/obstacle/cuevisibility and mobile/DPR2fallback. Ensure no .memory URLs in deployedbundle and allapproved assets copied. Preserve original Industrial/Gravity hashes. Fix in-scope integration defects andrerun onlyrelevant checks before final fullpass. Document limits honestly: realuseraccountonlineleaderboardnotneededforthischange. Finish everyTask, updatephase/plan/current and commit completiondocs.
  3. Error & Exception Handling: deterministic fallback for missing assets/API, no unhandled promise rejection or permanently paused combat; malformed inputs must not introduce NaN/Infinity. Do not conceal validation failures.
  4. State Transition & Return: expose independent snapshot data; advance engine phases only once; restart/menu clear transient state.

### I02. Verification and regression coverage
- Related Files: tests listed above; modify existing superseded expectations and add focused behavioral tests.
#### Details
Complete Vitest suite plus new combat integration; productionbuild+verify:config; HTTPfetchallfournewboss/sixportal/sixroarassets; visualinspectactualruntime sixboss/portal with representativeaircraft. Record counts/results and material limitations.

## Acceptance Criteria
- [ ] Prove every approved feature works together in real game output, close any regression, and leave plan/current pointers complete.
- [ ] Actual runtime integration preserves earlier completed Tasks and existing guest/admin/aircraft behavior.
- [ ] Specified validation passes; evidence recorded below.

## Validation
- `npx vitest run` — passes
- `npm run build` — passes
- `npm run verify:config` — passes
- `git diff --check` — passes

## Commit Message
```text
test(game): verify integrated boss evolution and portal flow

Plan: 2026-10-28-boss-combat-evolution
Phase: P01-gameplay-integration
Task: T06-final-verification

- Prove every approved feature works together in real game output, close any regression, and leave plan/current pointers complete.
- Validate actual state transitions and regression boundaries
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

