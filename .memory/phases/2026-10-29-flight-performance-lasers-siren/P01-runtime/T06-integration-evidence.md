# Task: T06 Complete Regression and Runtime Evidence

## Status: done

## Goal
Prove all six confirmed changes in actual gameplay/UI/audio assets, report real rendering measurements and finish memory accurately with a clean committed tree.

## Decision Summary
- No newdesignbranch or externaldeployment. Build onT01–T05 and keep existing aimedbosscombat, input, ranking/accountsave and graphicsidentities.
- Densityperformance must have a recordedoriginalbaseline; actualtimings mayvary bybrowser/GPU. Reportevidence andlimits rather thanpromiseFPS.

## Implementation

### I01. End-to-end runtime checks and documentation
- Related Files:
  - `README.md` gameplay/guest/performance/audio sections — modifyconfirmed behavior only.
  - `.memory/validation/2026-10-29-flight-performance-lasers-siren/` captureharness, matchedbaseline/postrecords, actualPNGs, manifest/verifier, reviewHTML/report — new/modifyT03evidence.
  - Affected tests asrequired byapprovedsemantics; no unrelatedrefactors.

#### Details
- UpdateREADME: cap220/460/700ordinaryceilings, separatebossfactors, capturedsteadybossbackground, secondclearambient3s70%/one-two70-30 withsafety, densityratios/nativeforeground, approved2.4ssiren, guestNOVA-only/nosavedrecords/publicrankbrowsing.
- Runactualproductionengine/renderer/HUD/CSS captures onPC andlandscape. Cases: guestmenu/hangarlockedcards/nohighestrecord, guestresultactualtransientscore/publicrankingnoprivatebest, accountbest/unlockregression withmockauthclearlylabeled, ambientnormalandWARNING withone/twolines, activecollision/safegaps, oldattackdrainsbeforebossintro, differentbosswalltargetswithconstantbackground, sharpnativeforegroundbesidelowdensityhazards,2.4sentryeventtimeline.
- ExistingT03performanceharness recordsbefore/after scenesatmatchednativeviewport/DPR/warmup/framecounts. Keeporiginalbaseline, newall1reference andbalanced resultsdistinct. Producepixelbudgettable andmedian/p95draw/frametimingobservations. Ifheadlesssoftwarebackend isused, explicitlylimitconclusions; no claimGPUframeratewasmeasured. VerifyPNGdimensions/missingassets/documentoverflow/actualchosenlayerdimensions andorderedpasses.
- Exerciseallthreecraft acrossmultiplebosses/stages usingunlockedaccountfixtures forAEGIS/VELOCITY. IncludefailedWASDpenalty/pausedentry/normal↔WARNING/ambient→bossdrain/portal/restart, scoringcap220 andnospeedrewindafterpause. EnsureambientdamageisnotshieldedbySpace, adminboundariesstillfatal andadminrunstillunranked.
- Realaccount/DBmutationsareoutside thisplan. Unit/integrationauth/rankingtests andmockUIevidence mustnotbe describedasactualremoteaccountverification.
- Assetverification includesapprovedsirenhash/runtimewave equivalence andunchangedplayer/bossfiles. Generatedpreviewfiles remainreviewevidence, notproductionimports.

### I02. Required checks and completion synchronization
- Related Files:
  - `.memory/phases/2026-10-29-flight-performance-lasers-siren/P01-runtime/T06-integration-evidence.md`, `phase.md`; `.memory/plans/2026-10-29-flight-performance-lasers-siren.md`; `.memory/current.md`; confirmeddecisionstatus/reportlink — modify.

#### Details
- Aftertargetedchecks pass runcompletesuite once; fixapproved-change regressions. Build THENverify:config becauseconfigurationverificationreads`dist`. Whitespacecheck, artifactmanifest/approvedsoundhash andgitstatus.
- UpdateT06done/commitwithprescribedmessage; thenphase6/6/plandone/currentnoactive. Finalmemory-synccommitrecordstaskhashes/statusandlinksactualreport. Do notpointbacktopreviouscompletedplan.
- Reportcompletedchanges, verificationcounts, actualperformancefindings withlimits, commits, captures anduserplaytestpath. Do notclaimimplementationcompletewithoutmeasurement/capturesorhideblockingtestfailures.
- Adjacentduplicatedadminresetassignmentsnotedbyplanningstayoutside scopeunlessindependentlynecessary totherequest; norelatedpermissionquestionneeded tofinishauthorizedwork.

## Acceptance Criteria
- [x] Complete tests/build/config pass and actualscreens/measurementsevidence reviewed.
- [x] All six decisions implemented, guest/account semantics preserved, approvedsiren synchronized.
- [x] Plan/phase/tasks/current accuratelycomplete and finalworkingtreeclean.

## Validation
- `npm test -- --run`
- `npm run build`
- `npm run verify:config` — afterbuild.
- Runactualruntimecapture/performanceartifactverifier, checkbefore/aftermatchedmetadata andapprovedWAVhash.
- `git diff --check`
- `git status --short` — cleanafterfinalsync.

## Commit Message
```text
test(game): verify ambient hazards performance audio and guest access end to end

Plan: 2026-10-29-flight-performance-lasers-siren
Phase: P01-runtime
Task: T06-integration-evidence

- Validate complete encounters and actual PC and landscape screens
- Record matched rendering measurements and synchronize final gameplay docs
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 72a625e
