# Task: T05 NOVA-only Guests Without Saved Records

## Status: done

## Goal
Guests can fly NOVA only and see only transient current-run scores; no guest best is saved/read/shown or submitted, while signed-in account scores/unlocks remain intact.

## Decision Summary
- D06 supersedes the old all-aircraft/browser-best guest design. AEGIS remains accountbest50, VELOCITY accountbest100; public leaderboard browsing remains available.
- Remove the old localrecord even for returning browsers, but only its exact dedicatedkey. Never clear whole storage or modify account/session/settings records.

## Implementation

### I01. Shared aircraft availability and fresh-run normalization
- Related Files:
  - `src/game/aircraft.js` :: new `canSelectAircraft`, existing accountunlock helpers — modify.
  - `src/game/game-engine.js` :: constructoraircraft selection, `setAircraft`, `setGuestMode`, `setAccountBestScore`, `start` — modify.
  - `src/ui/app-controller.js` :: `getHangarAircraft`, `dispatch SELECT_AIRCRAFT`, `refreshSession`, auth subscription/signout, `beginPlaying`, menuhero model — modify.

#### Details
- API `canSelectAircraft(id:string,{guestMode:boolean=false,bestScore:number=0}={}):boolean`: rejectunknown IDs; guest only`default`; account usesexisting50/100 score policy. Keep `getUnlockedAircraftIds(bestScore)` unchanged for account consumers.
- Engine constructor/setters normalize unknown/forbidden selection toNOVA or rejectselectionreturnfalse as appropriate. Guestmode transitions toguest atmenu resetcurrentaircraftdefault even ifoldaccountbest is high. Guest`setAccountBestScore(10000)` must not unlockanything. Preserve rejection ofmidflight setters; do not mutate activeaircraft due lateaccount refresh/auth callbacks.
- Make fresh-run configuration explicit to prevent oldengineplaying/paused state from silently ignoring menu setters after auth/return-to-menu. Extend `start(runOptions={})` withoptional `{aircraftId?:string,guestMode?:boolean,accountBestScore?:number}`. Apply supplied config atomically atnewsession boundary, normalize availability, then reset/start. Existing noargstart reuses current allowedconfig. Invalidnumericbest→0; invalidid→NOVA. No pendingconfig maychangean alreadyrunningframe unless `start` isexplicitlycalled.
- `beginPlaying` passes authoritative menu/authconfig tostart: guestdefault/true/0; accountselected/false/currentbest. Existingsettercalls mayremain forcompatibletestdoubles butmustnotbe the sole configuration path. On successfullogout/sessionloss normalize UIselecteddefault and menuhero together; asyncaccountloadguards remain. Valid accountaircraft choices survive hangarback/retry; no old guest bypass.
- UIhangar keeps allthreepreviewcards visible, NOVAenabled/selected, AEGIS/VELOCITYdisabled with concise login/accountunlock explanation. Prevent forgeddispatchselect forguest/unknownIDs; user cannot click or programmatically bypass intoanothercraft. Keep actualaircraft images and existing accountloading/error display.

### I02. Retire guest persistence and all best-score surfaces
- Related Files:
  - `src/services/guest-record-service.js` :: replace recordread/write API with cleanup-only helper `clearLegacyGuestRecord(storage?):boolean`; retain exact`GUEST_RECORD_STORAGE_KEY` — modify.
  - `src/ui/app-controller.js` :: state initializer, mount, `loadGameOverData`, `loadRankingPersonalRecord`, hangar/resultmodels — modify.
  - `src/ui/screens.js` :: `renderHangarScreen`, `renderPilotRankingScreen`, resultdisplay; `src/ui/leaderboard-view.js` if needed for suppressingguestneighborhood — modify.

#### Details
- Cleanup helper resolves suppliedstorage or guardedglobal.localStorage, calls onlyremoveItem('void-surfer:guest-record:v1'), catchesaccess/quota/errors andreturnsfalse rather thanblockingguestplay. Do notgetItem/parse or resurrectoldbest. Runonce oncontroller mount; never useclear(), enumerate/delete otherkeys, migrateguestrecord intoaccount, or create replacement guestrecord keys.
- Remove readGuestRecord/writeGuestRecordimports, state.guestBestRecord, gameoverlocalwrite and guestpersonalrecordconstruction. Sessionstate mayhold snapshot.finalScore/score forcurrentHUD/result/retry only; restarting clearspriorrun asbefore. No sessionStorage/indexedDB/cookie alternative tosaveguestbest.
- Add `guestMode:boolean=false` tohangarmodel (or explicitshowBestScore flag). Guesthangar omits `.hangar-best-score` entirely rather than showing0 or guest-best/loading state. Display concise loginunlock explanationnear lockedcards. Account UIscoreloading/error behavior unchanged.
- Ranking guestmodel: `guestMode:true`, `personalRecord:null`, `personalLoading:false`; omit fabricated ownrecord/scorefooter and browser-localtext. Personalarea may show "로그인하면 내 최고 기록을 확인할 수 있습니다."; publictable/pagination unchanged. Neverfetch accountprivatebest/neighborhood forguest.
- Guestgameover stillshowsactualcurrentrunscore and restart/menu/ranking buttons; no "saved" message, no ownbest/localrecord or accountsubmission attempt. Publictop isallowed; skipguestneighborhood requests and suppressits empty/errorownrecordpanel viaanexplicitoptionalmodel flag rather thanfabricatingaccountdata. Accountsubmission/retry/idempotency andadmin-skipped behavior mustremainunchanged.

### I03. Tests and old fixture migration
- Related Files:
  - `tests/services/guest-record-service.test.js` — replacepersistence specs withscopedcleanup/throwingstorage/unrelatedkeys tests.
  - `tests/ui/app-controller.test.js`, `tests/ui/screens.test.js`, `tests/game/aircraft.test.js`, `tests/game/game-engine.test.js`, `tests/ui/accessibility.test.js` — modify.
  - Aircraftregression fixtures in `tests/game/barrier-flow.test.js`, `tests/integration/central-hitbox.test.js`, `tests/integration/manual-boss-fire.test.js`, `tests/integration/combat-evolution.test.js`, `tests/integration/dash-boss-flow.test.js` — modify configuration only where they intentionally flynondefault.
  - Update any new T01/T02/T03 runtime-evidence fixtures that usedguestunlock fornondefault; existing historic evidence remains unchanged.

#### Details
- Existing fixtures frequently useguestMode:true toflyvelocity/aegis. Convertthose non-policy fixtures toguestMode:false/accountBestScore:100 (or explicitstartconfig), keepingoriginal assertions about craftidentity/HP/spacing/physics. Do not removeaircraftcoverage to makeguestrestrictionspass.
- Testguestfresh/returningoldrecord, constructorforbiddencraft, forgedselection, highguestbestinjection, sign-in/unlock/signout/newrun andmidflight setters. Useatleastone realappcontroller+realengine flow, notmockonly, forauth/menu→NOVA/newrunconfiguration and correcttitlehero.
- Verify oldkeydeleted, unrelatedsessionsettings untouched, no subsequentguestsetItem, localStorageunavailable works, no bestdisplay inhangar/ranking/results, currentrunscorestillvisible, publicrankingpaginationworks, no privateRPC/submission forguest and existing accountscore/save/unlock/retry tests stillpass.

## Acceptance Criteria
- [x] Guest cannot select/flynondefault through UI, engineconstructor, setters or fresh-run options.
- [x] Guest records are neither persisted nor displayed; onlyold dedicatedkey is retired, account/admin behavior preserved.

## Validation
- `npm test -- --run tests/services/guest-record-service.test.js tests/game/aircraft.test.js tests/game/game-engine.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js tests/ui/accessibility.test.js tests/integration/central-hitbox.test.js tests/integration/manual-boss-fire.test.js tests/integration/combat-evolution.test.js tests/integration/dash-boss-flow.test.js tests/game/barrier-flow.test.js`
- `rg -n 'readGuestRecord|writeGuestRecord|guestBestRecord|게스트 최고 기록|이 브라우저에만 저장' src` — no obsolete runtimeusage/text.
- `git diff --check`

## Commit Message
```text
feat(guest): restrict guests to NOVA and retire persistent guest records

Plan: 2026-10-29-flight-performance-lasers-siren
Phase: P01-runtime
Task: T05-guest-policy

- Enforce aircraft availability across menu and fresh engine sessions
- Remove guest best-score persistence and keep account ranking behavior intact
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
