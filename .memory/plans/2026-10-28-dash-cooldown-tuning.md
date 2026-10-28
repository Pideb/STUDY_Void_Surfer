# Plan: Dash Cooldown Tuning

## Goal
Use0.7s Space cooldown with matching recharge ring and README; preserve1.2s special spacing and all other dash semantics.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | done | One focused constants/docs/regression task | [P01](../phases/2026-10-28-dash-cooldown-tuning/P01-tuning/phase.md) |

## Rationale
A single shared constant drives engine and ring; one Task keeps behavior and existing assertions consistent. No new feature or external dependency.

## Result
Completed1/1; implementation 86e460e. Focused128 tests, build and whitespace checks passed.
