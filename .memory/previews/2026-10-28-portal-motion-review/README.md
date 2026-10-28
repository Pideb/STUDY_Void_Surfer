# Portal Destination Motion Review

Approved by the user on2026-10-28 (option1). Implementation reference only; not integrated into the production game yet.

- `animations.html`: six real, silent, roughly5.4s WebM recordings with native video controls, single-video looping, sequential playback and downloadable clips.
- `preview.html`: live Canvas view, destination/speed selection, pause/replay/scrub and a fixed-position ornament-motion view.
- Artwork: the exact six PNGs from `../2026-10-28-portal-destination-ornaments/`. No new illustration generation or replacement of the selected designs.
- Shared timing: .45s clear lead-in,960px of travel at current wall speed, .20s brighten/.10s white hold/.60s reveal, then new-stage obstacles. Demo craft stays fixed as a crossing reference.
- Approved motions: crystal sector float/sparkle; industrial tiny panel lock/pilot-light pulses; signal plate hover/sequential node illumination; gravity tangential drift/orbit arcs; abyss organic breathing/bioluminescence; solar thermal vibration/rising embers. Aperture exclusion mask prevents decorative obstruction.

Local export/review server:

```powershell
node .memory/previews/2026-10-28-portal-motion-review/serve-recordings.mjs
```

Open `http://127.0.0.1:4185/.memory/previews/2026-10-28-portal-motion-review/animations.html`.

For rebuilding, open the live page on that server with `?record=1` to export six clips, or `?poster=1` to export posters. The server accepts writes only to the six named review-video/poster outputs and fixed QA reports. Normal preview links never enable recording. Test-only Firefox profiles are ignored.

Verification:

```powershell
node .memory/previews/2026-10-28-portal-motion-review/verify.mjs
```

`qa/playback-report.json` records actual browser decoding, visible-frame variance, frame counts and reaching end-of-file for every clip. To refresh it, open `animations.html?verify=1` on the local export server. Byte-range responses are supported so video playback/seek resolves correctly.

`webm-duration.mjs` finalizes the browser recorder's zero duration field in-place using recorded frame timestamps. It changes no encoded frames or EBML element sizes, preserving seek offsets and giving native video controls the correct clip length. Angular ornament masks overlap to avoid artificial straight seams while the source design moves.
