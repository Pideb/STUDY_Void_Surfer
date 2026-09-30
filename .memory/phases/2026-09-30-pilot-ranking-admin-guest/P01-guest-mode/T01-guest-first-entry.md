# Task: T01 Guest-First Entry

## Status: done

## Goal
Let users reach the main menu and start a run without signing in, while retaining Microsoft sign-in and sign-out actions in the same menu account-action location.

## Decision Summary
- No-session startup displays the main title menu and the identity label `GUEST`; guests see a `로그인` action, signed-in users see `로그아웃`.
- The guest login action starts the existing Microsoft OAuth flow. Login errors must not trap a guest outside the title menu.

## Implementation

### I01. Auth-state routing and menu account actions
- Related Files:
  - `src/ui/app-controller.js` :: `createAppController`, `refreshSession`, `handleSignIn`, `handleSignOut`, `beginPlaying`, `dispatch`; modify
  - `src/ui/screens.js` :: `renderMenuScreen`; modify
  - `tests/ui/app-controller.test.js` :: auth/menu/start tests; modify
  - `tests/ui/screens.test.js` :: main-menu account-action tests; modify

#### Details
- **State fields**: Preserve `state.user` as `User | null`. Add `state.authActionError: string | null` for menu-level sign-in/out errors. Do not add a synthetic guest user or persist a guest as an authenticated identity.
- **Execution flow**:
  1. `refreshSession()` resolves a user as today; for no user, clear account-only state and call `setScreen('menu')`, not `setScreen('login')`. On auth/config/network read failure, also allow `menu` in guest state and expose a recoverable menu-level error.
  2. `renderMenuScreen` receives `displayName: state.user ? getDisplayName(state.user) : 'GUEST'`, `signedIn: Boolean(state.user)`, and `authError`. Render `로그인` when signed out and `로그아웃` when signed in at the existing separated account-action location.
  3. The guest `로그인` handler calls `handleSignIn()` directly; on failure leave screen at `menu` and show `authActionError`, while success updates `state.user`, loads account best score, clears the error, and remains on menu.
  4. Successful sign-out clears account state and returns to `menu` (not `login`) with `GUEST` identity. Do not erase guest-local score or selected guest aircraft.
  5. `START_GAME_FROM_MENU` and `beginPlaying()` must allow `state.user === null`; continue to `tutorial` before gameplay. Account-only score loading/submission stays conditional on a real `state.user`.
- **Accessibility**: Login/logout controls retain accessible names and keyboard activation; announce auth result/error in the existing live region.
- **Error handling**: A sign-in failure must not replace the menu with the old blocking login screen. Keep `renderLoginScreen` only if another explicit recovery route still needs it; do not show it on initial boot.

### I02. Guest-first flow tests
- Related Files:
  - `tests/ui/app-controller.test.js` :: guest boot, sign-in, sign-out, menu start behavior; modify
  - `tests/ui/screens.test.js` :: conditional login/logout text and GUEST label; modify
  - `tests/integration/game-flow.test.js` :: guest can reach tutorial/game and completes without auth; modify

#### Details
- Cover no-session boot, auth service failure that still permits guest play, guest start/tutorial transition, OAuth success from menu, OAuth failure retaining the menu, and sign-out returning to guest menu.
- Assert no sign-in call occurs merely from app startup and no score submit occurs for a guest.

## Acceptance Criteria
- [ ] A new visitor sees the game title menu without a blocking login screen.
- [ ] Guest identity displays `GUEST`; the menu action is `로그인`; signed-in state shows `로그아웃`.
- [ ] Guests can proceed through tutorial to a game run without authentication.
- [ ] Sign-in errors leave guest access usable; sign-out returns to guest menu without erasing guest-local data.

## Validation
- `npm test -- --run tests/ui/app-controller.test.js tests/ui/screens.test.js tests/integration/game-flow.test.js`

## Commit Message
```text
feat(auth): allow guest-first game entry

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P01-guest-mode
Task: T01-guest-first-entry

- Route unauthenticated startup to the title menu
- Switch account action between login and logout
- Keep OAuth errors recoverable without blocking guest play
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
