# Gameplay Text Audit — Confirmed

- Date: 2026-10-29
- Status: User confirmed remove/simplifyT01,T02,T04,T05; keepT03 completely unchanged. No production code edited during interview; implement confirmed changes in planned execution.
- Scope: Visible in-play HUD/canvas. Menu, preflight, pause and result screens are outside this visual-cleanup request.
- User explicitly requests an inventory/classification and confirmation before deletion.

## Explicit User Keep List
| Item | Current / planned examples |
| --- | --- |
| Score | 점수100 |
| Player laser charge/fire | LASER,72%,READY,레이저 발사 중,Shift/Ctrl guidance within its dedicated charge UI |
| WARNING notice | WARNING |
| Boss notice | BOSS / BOSS — 저속·고속·변속 at the entrance alert |
| Boss HP | BOSS HP,3/3 |

## Confirmed Removals / Simplifications
| ID | Visible text | Location / evidence | Proposed treatment |
| --- | --- | --- | --- |
| T01 | BOSS: SLOW / BOSS: FAST / BOSS: SHIFT | `src/game/renderer.js::drawBoss`, near line803; drawn under boss even with a sprite | Remove this persistent/faint lower label. It is a speed-pattern name, not an individual boss name. Preserve entrance BOSS notice. |
| T02 | 레이저 안전 구역: N번 구역 / 레이저 조준 중 · 세로 위치 확인 / 레이저 발사 중 | `src/ui/game-hud.js::update`, hud-combat-status near lines161..170; describes ENEMY lasers | Remove small combat-status sentence above playfield. Does not remove player weapon charge/fire indicator. |
| T03 | >> 가속 / << 감속 | `src/ui/game-hud.js::update`, speed-change-indicator near line181 | KEEP UNCHANGED: user explicitly excluded item3 from cleanup. Preserve both Korean words and symbols, timing and behavior. |
| T04 | INPUT SEQUENCE / 순서대로 입력 | Canvas `drawChallengeEffects` near line930 and DOM `challengeTitle` near line63 | Remove explanatory headings; retain one readable WASD sequence plus remaining-time indicator. There are currently both canvas and DOM key renderings; remove redundant visual copy, not the only playable sequence. |
| T05 | SAFE · 안전 구역 / DANGER · 발사 예정 / LASER ACTIVE / N초 후 발사 / 이 구역 안에서 회피 | NEW visual concept in `global-laser-review.mjs`, NOT yet production | Remove this wording from the implementation design. Preserve selected teal safe borders/chevrons/fill and red danger hatching plus real beam animation. Supersedes only D11's visible label/countdown text. |

## Functional Displays to Retain
- WASD letters/order and remaining time while the challenge is active; otherwise the player cannot determine the required inputs/deadline.
- Existing action-button labels where the buttons actually appear: mobile SPACE 대시, 레이저 발사 and 일시정지. Desktop HUD currently hides these buttons via `.game-hud button { display:none; }`; do not introduce them on PC.
- Entire speed-change notice >> 가속 / << 감속 (T03), preserving words AND symbols per explicit user choice.
- No new text or decorative wordmark is proposed.

## Non-visible Text Is Not Clutter
- Keep existing aria-label/aria-valuetext and sr-only live announcements; these are not visible screen clutter and support input/status accessibility.
- Do not remove interaction handlers or actual gameplay state while removing decorative labels.

## Evidence / Limits
- Searched all `src/game` and `src/ui` text draw/set calls and checked HUD CSS visibility. Portal renderer, boss motion and production laser renderer do not currently draw extra text.
- The code-generated faint label below the boss is `BOSS: <pattern>`, matching the user's example. No additional individual-boss-name label was found in current runtime code. Text baked inside raster artwork is not changed by this audit.
- User's exact selection: keep item3 as-is and clean up all other numbered candidates. No additional confirmation needed. This approval supersedes the earlier proposed symbol-only speed notice; it also supersedes visible SAFE/DANGER/countdown text in the earlier global-laser concept, while preserving that concept's colors/patterns/borders.
