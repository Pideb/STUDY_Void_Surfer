# Decisions: Dash Cooldown Tuning

- Date: 2026-10-28 (Asia/Seoul)
- Status: Confirmed

## D01. Shorter Space cooldown
- **Chosen**: User explicitly confirmed0.7 seconds from accepted activation, replacing1.0s.
- **Rationale**: More responsive reuse without continuously renewed projectile protection.

## D02. Preserve independent mechanics
- **Chosen**: Keep0.6s dash/projectile immunity,0.30s normal and0.15s WARNING/BOSS special timing, and1.2s minimum required-special passage spacing.
- **Rationale**: Cooldown and wall success timing are separate; faster reuse must not remove reachable wall spacing. Existing shared renderer constant controls white recharge arc.
