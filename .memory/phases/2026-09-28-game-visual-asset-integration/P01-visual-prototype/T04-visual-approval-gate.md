# Task: T04 Prototype Visual Approval Gate

## Status: pending

## Goal

Present the integrated main menu and CRYSTAL GATES prototype at desktop and mobile sizes so the user can approve or request targeted art/layout corrections before any remaining-stage artwork is generated.

## Decision Summary

- This is a deliberate human review gate, not permission to proceed automatically to P02.
- P02 asset production stays blocked until the user explicitly approves the integrated prototype.

## Implementation

### I01. Capture and review integrated visuals

- Related Files:
  - `src/game/renderer.js` :: `render`, `renderMenuBackground` — execute and capture actual application screens; no source changes expected unless user feedback requires a fix.
  - `.memory/current.md` :: active pointer remains at T04 until approval; modify only after approval.

#### Details

- Run the app with `npm run dev`, capture the actual main menu and ordinary Crystal gameplay at 16:9 desktop and narrow mobile sizes. To preview the transition before P02 art exists, use a deterministic renderer fixture with the real CRYSTAL GATES normal and dedicated BOSS backgrounds as outgoing/incoming layers; P02 will verify a true two-stage handoff with two distinct stage packs.
- Show the user those images, including enough gameplay context to inspect background fullness, art-vs-hitbox readability, and the no-stage/no-aircraft-label HUD requirement.
- Do not generate or wire P02 art until the user explicitly approves. If changes are requested, update the relevant P01 implementation/asset task and repeat this review.
- This task's completion condition is the user's explicit approval; no substitute automated assertion can mark it done.

## Acceptance Criteria

- [ ] User has seen the real integrated menu/gameplay/transition captures.
- [ ] User explicitly approves the prototype or requested P01 corrections have been completed and approved.
- [ ] Only after approval may the current pointer advance to P02-T05.

## Validation

- `npm run dev` — confirm the live Vite page renders the committed prototype without missing-image errors; inspect the transition through its deterministic renderer preview.
- Manual visual review at 960×540-equivalent desktop and mobile layouts — user approval required.

## Commit Message

```text
docs(visual): approve first gameplay art prototype

Plan: 2026-09-28-game-visual-asset-integration
Phase: P01-visual-prototype
Task: T04-visual-approval-gate

- capture and review menu and Crystal Gates prototype
- gate remaining stage art on explicit visual approval
```

## Progress

- [ ] User preview presented
- [ ] Explicit approval recorded
- commit: pending
