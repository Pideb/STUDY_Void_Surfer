# v0.2b startup-audio investigation and final deployment decision

## User request
- Deploy as v0.2b (explicit version override).
- Prepend guide notes, preserving every existing entry verbatim:
  - 플레이어가 보스 공격시 피격 판정 개선
  - GUEST 랭킹 불러오기 이슈 수정
- User then interrupted deployment and requested investigation/solution for immediate startup audio before deployment. No release preparation, version edits, push or deployment performed for this request yet.

## Verified constraints2026-11-03
- Existing manager.tryAutoplay attempts AudioContext.resume once on startup; controller unlocks on first real pointer/key gesture. Previous fresh-profile Edge test recorded suspended before first gesture, running/music1 after click; explicit autoplay-allowed profile starts without gesture.
- Chrome official policy requires eligibility/user activation for audible playback: https://developer.chrome.com/blog/autoplay/ . WebKit likewise advises detecting denial and providing a user gesture: https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/ . defer/onload or a scripted click cannot guarantee audible autoplay for all first visitors.
- Browser/enterprise permission can enable zero-gesture autoplay on configured devices, but it is not an app-side guarantee for public shared links.

## Final decision
User said leave audio for now and proceed with previously requested deployment. Keep existing audio/menu behavior, no new entry screen. Deploy canonical version0.2b, base0.2 retained and automatic next0.21. Prepend exact two guide bullets without altering any old entry. Implement an explicit validated release-version option rather than relabelling an unrelated numeric release. Full checks, commit/push, exact Actions HEAD/live bundle/guide verification, record proof and metadata follow-up are authorized.
