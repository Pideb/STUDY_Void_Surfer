# Task: T01 Startup dialog and migration check

## Status: done

## Goal
On a fresh game load, show the approved latest-update modal without blocking menu audio/auth/orientation or reappearing on restart. Provide honest remote migration evidence.

## Decision Summary
- One task keeps modal state, styling and composition-root wiring testable together.
- Guide source remains docs/player/updates.json; no copied production patch-note strings.

## Implementation
### I01. Modal renderer and source wiring
- Related Files: new `src/ui/startup-update.js`, `src/ui/startup-update.css`; modify `src/main.js`; `docs/player/updates.json` read-only.
#### Details
- `renderStartupUpdateDialog(entry,{close}) -> HTMLElement`: entry shape `{version:string,date:string,title:string,body:string[]}`; safe textContent; semantic dialog aria-modal/labelledby/describedby; exact version/date/bullets. Confirm close callback and `/guide/index.html#updates` link with target_blank rel_noopener. Empty/invalid entry yields no modal (caller validation), never blocks game.
- Reuse approved popup.css geometry/colors under startup-specific selectors: fixed viewport overlay, dim existing menu, width<=640, modest220ms entrance, scrollable list, reduced-motion, mobile44px+ controls and16px body; safe-area-aware. Do not scale modal down with PC design-space.
- Composition root imports guide JSON and passes `startupUpdateEntry: updates.entries[0]??null` to controller. Controllers without injected entry stay suitable for non-startup integration harnesses; real application always wires latest source. No preference storage.
### I02. Controller lifecycle/accessibility
- Related Files: `src/ui/app-controller.js` create/mount/dispatch/syncOrientation/destroy; existing menu-navigation read-only unless necessary.
#### Details
- Dedicated `.startup-update-host` sibling of root, outside `.menu-design-space`, below orientation-host z100. Open once on mount, keep during async auth/menu paints; remove on dismissal/destroy. Modal entry never reopens from paint/return-menu/restart/account refresh. Keep menu art/animation subtree intact.
- While open set root.inert=true and guard menu dispatch/key handlers from triggering gameplay. Modal consumes keydown propagation; Tab/ShiftTab cycle guide/confirm; arrows can move between two actions; Enter/Space confirm exactly once with preventDefault; ignore repeat; Escape closes. Do not leak dismissing Space to game/menu start or keyup synthetic clicks. Allow first gesture audio unlock unchanged.
- Orientation state combines `root.inert = orientationBlocked || startupOpen`; hide/inert modal under portrait orientation gate; show/focus Confirm when landscape resumes; dismiss restores menu focus only when orientation permits. Cleanup host, listeners and inert on destroy.
### I03. Tests and read-only remote validation
- Related Files: new tests/ui/startup-update.test.js; extend tests/ui/app-controller.test.js harness entry injection and lifecycle tests; new `.memory/validation/2026-11-03-startup-update-dialog/verify-remote.mjs`, fixture/browser screenshots/report.
- Test exact latest guide text including future injected entry/escaping, Confirm/Escape/Tab/Enter/Space, repeat, behind-modal dispatch, auth async repaint, close returns menu not tutorial, return-menu/restart no reopen, fresh mount shows again, orientation priority/cleanup. Production wiring test reads main.js/guide schema if needed.
- Remote script loads VITE variables via Vite loadEnv without printing secrets, creates transient nonpersistent anonymous client or REST requests. Read overall and3aircraft RPCs; assert valid shapes/no private duration; compare observed overall records to matching known-aircraft public records (report match count only, no identities). Probe anonymous denial for own-aircraft record/private tables via GET/SELECT only. No score/finish/start RPC calls, no data mutation. Timeouts and clear partial-failure report; do not log tokens or full payloads.
- Report verified read RPCs/counts vs unverified authenticated submissions/history/concurrency. Public checks cannot prove private final_score storage or every historical invariant.
- Browser screenshots of actual renderer/controller at1600x900,844x390,568x320 and375px no overflow using isolated Firefox headless screenshot path that worked for approved preview. Fixture deterministic/mocked services, no live DB. DOM tests separate from actual render; reduced-motion only in capture fixture for stable screenshots.
- Run full tests then build then config check; guide check unchanged. docs:check expected source-fingerprint gate until release request; record rather than changing version to bypass. No deployment.

## Acceptance Criteria
- [x] Latest guide popup appears once per fresh startup and matches approved PC/mobile design.
- [x] Keyboard/focus/orientation/auth/audio interactions do not accidentally start a run or reopen dialog.
- [x] Remote public SQL checks passed without writes; authenticated/private limits disclosed in report.
- [x] 1,421 tests/build/config passed; local commit recorded in git history. Release-only docs fingerprint gate intentionally pending.

## Validation
- `npm run test -- --run tests/ui/startup-update.test.js tests/ui/app-controller.test.js`
- `node .memory/validation/2026-11-03-startup-update-dialog/verify-remote.mjs`
- `npm run test -- --run`
- `npm run build`
- `npm run verify:config`
- `npm run guide:check`
- `npm run docs:check` — release fingerprint gate expected while no new release requested.

## Commit Message
```text
feat(ui): show latest guide updates on game startup

Plan: 2026-11-03-startup-update-dialog
Phase: P01-startup
Task: T01-startup-dialog
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (report documents scope and release-only gate)
- commit: recorded in git history (T01-startup-dialog)
