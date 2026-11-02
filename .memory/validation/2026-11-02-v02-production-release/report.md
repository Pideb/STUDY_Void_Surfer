# v0.2 release validation

- User-authored player guide: large bold v0.2 heading and exactly seven supplied notes.
- 1,376 tests / 84 files passed. Build, configuration, guide and generated documents checked.
- guide-browser.json / guide-1200.png / guide-375.png: actual browser headings36px/32px, weight800, no horizontal overflow.
- runtime-release.test.js: deployment status/evidence changes leave compiled JavaScript unchanged.
- db-preflight.json: remote required functions now exist; invalid null requests are rejected and anonymous score submission is denied. No records written. Real authenticated/concurrent remote submissions remain untested; prior local SQL role suites passed.
- Azure deployment: pending; only mark complete with Actions HEAD and downloaded production bundle evidence.
