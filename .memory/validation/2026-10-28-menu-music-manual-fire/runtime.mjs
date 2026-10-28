import { createRenderer } from '/src/game/renderer.js';
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { createGameEngine } from '/src/game/game-engine.js';
import { createGameHud } from '/src/ui/game-hud.js';
import { renderMenuScreen } from '/src/ui/screens.js';

const query = new URLSearchParams(location.search), mode = query.get('mode') || 'ready';
const assets = createVisualAssetLoader(), loaded = await assets.preload();
const canvas = document.querySelector('#scene'), ui = document.querySelector('#ui');
const renderer = createRenderer(canvas, { visualAssets: assets, reducedMotion: query.has('reduced') });
let clock = 0;
const engine = createGameEngine({ now: () => clock, gravity: 0, initialScore: 60, initialCompletedWarningCount: 1,
  rng: () => mode === 'ink' ? .1 : .9, stageRng: () => .999, guestMode: true, invincibilityEnabled: true });
engine.start();
const step = (seconds = .05) => { clock += seconds * 1000; engine.update(clock); const s = engine.getSnapshot(); hud.update(s); return s; };
const until = predicate => {
  for (let i = 0; i < 6000; i++) { const s = engine.getSnapshot(); if (predicate(s)) return s; step(); }
  throw new Error('QA fixture did not reach ' + mode);
};
const hud = createGameHud({ getMuted: () => false }, { fire: () => { engine.fire(); draw(engine.getSnapshot()); },
  space: () => engine.dash(), challengeKey: key => engine.handleChallengeKey(key), pause() {}, toggleMute() {} });
function draw(snapshot) { renderer.render(snapshot); hud.update(snapshot); }
let snapshot;
if (mode === 'ink' || mode === 'glitch') {
  snapshot = until(s => s.challenge?.active);
  const wrong = ['KeyW','KeyA','KeyS','KeyD'].find(code => code !== snapshot.challenge.sequence[0]);
  engine.handleChallengeKey(wrong);
  for (let i = 0; i < 30; i++) step();
  snapshot = engine.getSnapshot();
} else {
  snapshot = until(s => s.boss?.weapon.ready && !s.challenge?.active && s.obstacles.length > 0);
  if (mode === 'charge' || mode === 'beam') {
    engine.fire(); step(.1); if (mode === 'beam') step(.1);
    snapshot = engine.getSnapshot();
  }
}
if (mode === 'menu') {
  renderer.renderMenuBackground();
  ui.append(renderMenuScreen({ displayName: 'GUEST', selectedAircraft: 'NOVA', selectedAircraftId: 'default', signedIn: false },
    { start() {}, hangar() {}, ranking() {}, toggleMute() {}, signIn() {} }));
} else { ui.append(hud.element); draw(snapshot); }

const rect = element => { const r = element?.getBoundingClientRect(); return r ? { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom } : null; };
const button = ui.querySelector('.mobile-fire-button'), gauge = ui.querySelector('.weapon-hud');
const report = { mode, assets: loaded.loaded.length, failedAssets: loaded.failed, viewport: { width: innerWidth, height: innerHeight },
  documentOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
  fireButton: { display: button ? getComputedStyle(button).display : null, disabled: button?.disabled, bounds: rect(button) },
  gauge: rect(gauge), hp: snapshot.boss?.hp, weapon: snapshot.boss?.weapon, effect: snapshot.feedbackEffect,
  fixture: 'Real public engine state, production renderer/HUD/styles, gravity0/admin collision bypass for deterministic screenshots; not a manual playtest.' };
window.RuntimeReview = { engine, renderer, hud, snapshot, report };
document.title = 'READY · ' + mode + ' · assets ' + report.assets;
if (query.has('capture')) window.addEventListener('load', async () => {
  try {
    await fetch('/runtime-report/' + mode, { method:'POST', body:JSON.stringify(report) });
    if (!query.has('record')) return;
    const stream = canvas.captureStream(24), recorder = new MediaRecorder(stream, { mimeType:'video/webm;codecs=vp8', videoBitsPerSecond:1900000 }), chunks = [];
    const done = new Promise(resolve => { recorder.ondataavailable = e => { if(e.data.size)chunks.push(e.data); }; recorder.onstop = () => resolve(new Blob(chunks,{type:'video/webm'})); });
    recorder.start(400); const began = performance.now();
    await new Promise(resolve => {
      const tick = now => {
        const t = Math.min(6.5,(now-began)/1000), s = structuredClone(snapshot);
        s.elapsedSeconds += t; s.stage.elapsedSeconds += t; s.backgroundScrollDistancePx += t*65;
        s.feedbackEffect = t < .5 || t >= 5.5 ? null : {kind:mode,durationSeconds:5,remainingSeconds:5.5-t};
        draw(s); if(t<6.5)requestAnimationFrame(tick);else resolve();
      }; requestAnimationFrame(tick);
    });
    recorder.stop();const blob = await done;stream.getTracks().forEach(track=>track.stop());
    await fetch('/runtime-video/'+mode,{method:'POST',body:blob});
  } catch(error) { await fetch('/runtime-report/'+mode,{method:'POST',body:JSON.stringify({error:error.message})}); }
}, { once:true });
