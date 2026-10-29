# Cooldown / speed / boss firing review

- Date: 2026-10-29
- Status: Implemented and verified2026-10-29;4/4 Tasks complete at6f95ba1. Confirmed decisions: ../../decisions/2026-10-29-cooldown-speed-boss-tuning.md. Actual renderer evidence: ../../validation/2026-10-29-cooldown-speed-boss-tuning/report.md.
- Use grill-me: one question at a time, inline choices.

## Accepted requests
- Remove the speed-cap-score suffix from aircraft descriptions; retain aircraft traits.
- Replace the preflight boss paragraph with: 보스전에서는 10초마다 레이저가 충전됩니다. Ctrl/Shift 키로 발사하세요
- Space cooldown confirmed by user option1: 16px diameter white progress ring, centered36px left /24px above ship center. Tracks ship, fills clockwise, disappears when ready; cooldown stays.70s.
- Manual boss laser firing time: user selected total .70s for playtesting. Proposed internal split .50s charge + .20s recovery; preserve the existing ship-only lock and live world hazards.
- All aircraft: fixed actual speed +10px/s per10 progression points, growth capped at100 progression points. NOVA/AEGIS240->340; VELOCITY480->580.
- Wall-free boss projectile volleys: choose3..6 projectiles randomly per volley. Preserve one projectile per wall-phase firing and existing1..3 volley repetitions.
- Single-line laser pattern: exclude top and bottom15% each (both one/two-line versions); preserve full-core and gap safety checks. Global lasers unchanged.

## Verified baseline
- Speed: 240 * 1.1^floor(min(progressionScore, aircraftCap)/10) logical px/s.
- NOVA/AEGIS cap100 => 622.50 px/s; VELOCITY cap70 and movement x2 => 935.38 px/s.
- Progression score does not fall on pause; boss clear adds10 to progression.
- Target changes interpolate over2s. Boss slow x.75 / fast x1.25; VELOCITY fast further x.88. Boss base snapshot held for encounter.
- Boss firing movement lock .30s: charge .20s, recovery .10s; world continues and no extra immunity.
- Space cooldown .70s; unchanged by this request. Current center ring radius40.4px.

## Visual candidates (option1 confirmed)
1. Selected: 16px diameter white progress ring, centered36px left /24px above ship center.
2. Minimal: 12px diameter, same placement.
3. Strong visibility: 20px diameter, same placement.
- All track ship, fill clockwise during cooldown, vanish when ready. Ship remains unobstructed.
- Preview uses actual aircraft assets and production drawShip; candidate rings only exist in this review.

## Boss firing duration (total confirmed)
- Current .30s = .20s charge + .10s recovery.
- User requested .70s total because current firing feels far too short. Use .50s charge + .20s recovery as implementation split.
- Ship movement/lift/dash remain locked for the total; world hazards continue and no new invulnerability is added. Speed growth/cap decision follows separately.

## Speed growth and caps (confirmed)
- Current compound10% every10 progression points. Keep initial240 / VELOCITY480 unless requested otherwise.
- User selected identical actual scroll-speed increment +10px/s per10 progression points for all three aircraft. VELOCITY must NOT double this increment.
- Supersede all previous unconfirmed growth options. Ordinary actual target = aircraft starting speed +10*floor(min(progressionScore, aircraftCap)/10): NOVA/AEGIS starting240, VELOCITY starting480.
- Implementation must account for current aircraft multiplier applied downstream: do not simply add10 in getBaseSpeed then multiply whole result by2 for VELOCITY. Audit all prediction/spacing/continuity/boss snapshot consumers to keep actual increments consistent.
- User confirmed score cap100 for every aircraft, including VELOCITY (was70). Ordinary maximum NOVA/AEGIS340px/s; VELOCITY580px/s. Boss multipliers remain separate. Pause deductions never reduce progression; boss clear+10 still contributes; preserve2s transition.
