import { createRenderer } from '/src/game/renderer.js';
import { createVisualAssetLoader } from '/src/game/visual-assets.js';
import { createGameEngine } from '/src/game/game-engine.js';
import { createGameHud } from '/src/ui/game-hud.js';

// Actual production engine, art, renderer, HUD and CSS. Synthetic initial score,
// gravity0 and collision bypass make the first boss reproducible, without auth/DB.
let clock = 0;
const id = new URLSearchParams(location.search).get('id') ?? 'boss-active';
const assets = createVisualAssetLoader(), loaded = await assets.preload();
const canvas = document.querySelector('#scene'), renderer = createRenderer(canvas, { visualAssets: assets });
const engine = createGameEngine({ now: () => clock, gravity: 0, rng: () => .6,
  stageRng: () => .5, initialScore: 20, initialClearedBossCount: 0, invincibilityEnabled: true });
const hud = createGameHud({ getMuted: () => false }, { pause(){},toggleMute(){},space(){},fire(){},challengeKey(){} });
document.querySelector('#ui').append(hud.element);
engine.start();
let snapshot;
for (let i = 0; i < 600; i++) {
  clock += 50; engine.update(clock); snapshot = engine.getSnapshot();
  if (snapshot.difficulty.isWarning) throw Error('Unexpected standalone WARNING');
  if (id === 'boss-entry' ? snapshot.bossPreview : snapshot.boss && !snapshot.bossEntry && snapshot.obstacles.length >= 3) break;
}
renderer.render(snapshot); hud.update(snapshot);
window.fixture = { id, failedAssets: loaded.failed, score: snapshot.score, clearedBossCount: snapshot.clearedBossCount,
  isWarning: snapshot.difficulty.isWarning, isBoss: snapshot.difficulty.isBoss, bossNumber: snapshot.boss?.number ?? null,
  preview: snapshot.bossPreview, obstacles: snapshot.obstacles.map(w => ({ type:w.type, bossNumber:w.bossNumber })),
  fixture: 'Actual engine/render/HUD; synthetic initial score20, gravity0, invincible; no account or DB mutation.' };
document.title = 'DONE ' + id;
