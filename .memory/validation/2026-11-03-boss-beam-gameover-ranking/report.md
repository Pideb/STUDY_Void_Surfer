# Boss beam and game-over ranking validation

## Boss beam
- Confirmed bug: old full-art bounding rectangle includes transparent sprite regions and unions swept extremes. Actual sprite tests find215 false contacts across54 motion/action cases.
- Fix: cached alpha rectangles from the renderer's base/parts, identical movement/recoil/tail/reduced-motion transforms, pose-by-pose contact rather than swept empty-space bounds.
- Six PNG bosses × nine poses: 10,674 clear-row misses and zero mismatch. Artwork contacts remain; engine regression verifies missed shot HP3, subsequent real contact HP2 and single-hit rule.27 one-time layer reads; no warm per-frame reads.
- 81 focused tests and build passed. Browser JSON/montage alongside this report.

## Previous release follow-up
- Original v0.2 release and metadata-only follow-up both succeeded. Metadata run41545383697 for4a05dc4 produces identical JS SHA256cca98444faf29925fbe1ad7397be23e2856c1a239e3ac48d657e6b94c2eec5f8. Proofs under previous release validation directory.

## Game-over ranking
- Remote read-only probe: anonymous get_leaderboard401/42501, public ranking200. Current game-over guest route uses the former; pilot-ranking uses latter. No score rows mutated.
- Fixed guest TOP10/public fallback, independent per-list publish and error handling, same-finished-run response caching during pilot ranking. Removed only game-over retry; full ranking retry retained. Score-write errors remain truthful and are not converted into successful saves.
- Real Chromium controller connected to live Supabase: TOP10 rows10, full public ranking rows12, all RPCs200, zero writes; simulated game-over list failure has no retry control and pilot ranking remains reachable. Signed-in interruption/session scenarios tested with deterministic unit fixtures rather than a real affected user's account session.
- Healthy/pending/rejected sibling, subview roundtrip, immediate restart stale response, no duplicate score write covered. Full1393 tests/85 files passed, build/config/diff check passed. Detailed JSON report kept locally; compact tests-summary.json committed.
- One old integration test still clicked the removed retry button; updated it to validate the new pilot-ranking route and single score submission.
- Local game commits only; no new deployment/version bump. Official docs retain the deployed0.2 source fingerprint and protected snapshots until the next requested release preparation.
