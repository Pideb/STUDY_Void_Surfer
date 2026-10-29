import { describe, expect, it, vi } from 'vitest';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../src/game/constants.js';
import {
  createRenderer, drawManualLaser, drawBoss, drawDashCooldown, drawDashShockRing, drawDashTrail, drawObstacle, drawShip, drawShipDeathEffect, drawShipExhaust,
} from '../../src/game/renderer.js';
import { drawLaser } from '../../src/game/laser-renderer.js';
import { createSingleLaser, createQuarterLaser, getLaserFrontX, updateLaser } from '../../src/game/boss-attacks.js';
import { STAGE_VISUAL_THEMES, VISUAL_THEME } from '../../src/game/visual-theme.js';

function createContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    calls: [],
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    setLineDash: vi.fn(),
    gradient,
  };
}

describe('renderer', () => {
  it('keeps the ship on the primary context while wall textures use their own raster surface',()=>{
    const primary=createContext(),canvas=document.createElement('canvas'),surfaces=[];canvas.getContext=()=>primary;
    const ship={width:300,height:160},wall={width:1024,height:1536};
    const renderer=createRenderer(canvas,{visualAssets:{get:key=>key==='aircraft.default'?ship:key==='stages.crystal-gates.normalWall'?wall:null},
      layerCanvasFactory:()=>{const ctx=createContext(),surface={width:1,height:1,getContext:()=>ctx};surfaces.push({surface,ctx});return surface;}});
    renderer.render({stage:{id:'crystal-gates'},difficulty:{scrollSpeed:240},player:{x:240,y:270,width:36,height:24,velocityY:0},obstacles:[{x:500,width:72,kind:'normal',stageId:'crystal-gates',gapCenter:270,gapHeight:180}]});
    expect(primary.drawImage.mock.calls.some(([image])=>image===ship)).toBe(true);
    expect(primary.drawImage.mock.calls.some(([image])=>image===wall)).toBe(false);
    expect(surfaces.some(({ctx})=>ctx.drawImage.mock.calls.some(([image])=>image===wall))).toBe(true);
    expect(renderer.getLayerStats().walls.density).toBe(.75);renderer.destroy();
  });
  it('draws ambient laser warnings and passed timing-band edges on the primary context',()=>{
    const primary=createContext(),canvas=document.createElement('canvas');canvas.getContext=()=>primary;
    const renderer=createRenderer(canvas,{layerCanvasFactory:()=>{const ctx=createContext();return {width:1,height:1,getContext:()=>ctx};}});
    renderer.render({difficulty:{scrollSpeed:500,timingWindowSeconds:.15},player:{x:240,y:270,width:36,height:24,velocityY:0},
      obstacles:[{kind:'special',x:100,width:24,showTimingGuide:true,passed:true,timingGuideWidthPx:75,gapCenter:270,gapHeight:180}],
      ambientAttack:{type:'laser',kind:'single',y:200,ys:[200],telegraphRemainingSeconds:.7,telegraphDurationSeconds:.7,activeRemainingSeconds:1,fadeRemainingSeconds:.15}});
    expect(primary.lineTo).toHaveBeenCalledWith(960,200);expect(primary.moveTo).toHaveBeenCalledWith(25,0);
    expect(renderer.getLayerStats().lasers.density).toBe(.35);renderer.destroy();
  });
  it('anchors boss background vertically and keeps seam geometry tied to captured speed',()=>{
    const context=createContext(),canvas=document.createElement('canvas'),background={width:960,height:540};canvas.getContext=()=>context;
    const renderer=createRenderer(canvas,{visualAssets:{get:key=>key==='stages.crystal-gates.bossBackground'?background:null}});
    const state={stage:{id:'crystal-gates',mode:'boss'},backgroundScrollSpeed:440,backgroundScrollDistancePx:100,player:{x:240,y:270,width:36,height:24},difficulty:{scrollSpeed:330}};
    renderer.render({...state,elapsedSeconds:1});const first=context.drawImage.mock.calls.filter(args=>args[0]===background);
    context.drawImage.mockClear();renderer.render({...state,elapsedSeconds:9,difficulty:{scrollSpeed:550}});
    expect(context.drawImage.mock.calls.filter(args=>args[0]===background)).toEqual(first);
    expect(first.length).toBeGreaterThan(0);renderer.destroy();
  });
  it('draws entrance blackout over scenery but before the player',()=>{
    const c=createContext(),events=[],canvas=document.createElement('canvas');canvas.getContext=()=>c;
    c.fillRect.mockImplementation(function(){events.push(this.fillStyle);});
    c.translate.mockImplementation((x,y)=>{if(x===240&&y===270)events.push('player');});
    createRenderer(canvas).render({difficulty:{},bossEntry:{darkness:1},player:{x:240,y:270,width:36,height:24,velocityY:0}});
    expect(events.indexOf('rgba(0, 0, 0, 1)')).toBeGreaterThan(0);
    expect(events.indexOf('rgba(0, 0, 0, 1)')).toBeLessThan(events.indexOf('player'));
  });
  it('keeps a passed special timing band fixed while upcoming guides use current difficulty',()=>{
    const c=createContext(),wall={kind:'special',x:40,width:24,gapCenter:270,gapHeight:180,showTimingGuide:true,passed:true,timingGuideWidthPx:84};
    drawObstacle(c,wall,VISUAL_THEME,{scrollSpeed:800,timingWindowSeconds:.15,elapsedSeconds:0});
    expect(c.fillRect).toHaveBeenCalledWith(-44,0,84,540);
    c.fillRect.mockClear();drawObstacle(c,{...wall,passed:false},VISUAL_THEME,{scrollSpeed:800,timingWindowSeconds:.15,elapsedSeconds:0});
    expect(c.fillRect).toHaveBeenCalledWith(-80,0,120,540);
  });
  it('uses viewport pixels, preserves logical ship coordinates, and redraws cached scenes on resize', () => {
    const c=createContext(),canvas=document.createElement('canvas'),bounds={width:1920,height:1080};
    canvas.getContext=()=>c;canvas.getBoundingClientRect=()=>bounds;
    const previous=globalThis.ResizeObserver;
    let notify;const disconnect=vi.fn();
    globalThis.ResizeObserver=class{constructor(callback){notify=callback;}observe(){}disconnect(){disconnect();}};
    try{
      const renderer=createRenderer(canvas);
      expect(canvas.width).toBe(1920);expect(canvas.height).toBe(1080);
      expect(c.setTransform).toHaveBeenCalledWith(2,0,0,2,0,0);
      expect(c.imageSmoothingQuality).toBe('high');
      const widthSetter=vi.spyOn(canvas,'width','set');
      const snapshot={player:{x:240,y:270,width:36,height:24,velocityY:0},difficulty:{}};
      renderer.render(snapshot);renderer.render(snapshot);
      expect(widthSetter).not.toHaveBeenCalled();expect(c.translate).toHaveBeenCalledWith(240,270);
      bounds.width=2560;bounds.height=1440;notify();
      expect(canvas.width).toBe(2560);expect(c.setTransform).toHaveBeenLastCalledWith(2560/960,0,0,1440/540,0,0);
      renderer.renderMenuBackground();c.drawImage.mockClear();c.fillRect.mockClear();
      bounds.width=1280;bounds.height=720;notify();expect(c.fillRect).toHaveBeenCalled();
      renderer.destroy();expect(disconnect).toHaveBeenCalledOnce();
      c.fillRect.mockClear();bounds.width=1000;notify();expect(c.fillRect).not.toHaveBeenCalled();
      widthSetter.mockRestore();
    }finally{globalThis.ResizeObserver=previous;}
  });
  it('fires the manual beam horizontally regardless of boss core and supports temporary ship facing', () => {
    const c = createContext(), player = { x: 240, y: 300, width: 36, height: 24, velocityY: 100, facingAngle: -.2 };
    drawShip(c, player); expect(c.rotate).toHaveBeenCalledWith(-.2);
    drawManualLaser(c, { elapsedSeconds: .22, chargeSeconds: .2, toX: 750, toY: 270 }, player, { accent: '#67dfff' }, { x: 810, y: 220 });
    expect(c.lineTo).toHaveBeenCalledWith(960, 300);
    expect(player.width).toBe(36); expect(player.height).toBe(24);
  });
  it('draws the central square only with the explicit debug render option',()=>{
    const context=createContext(),canvas=document.createElement('canvas');canvas.getContext=()=>context;
    const renderer=createRenderer(canvas),snapshot={difficulty:{},player:{x:240,y:270,width:36,height:24,velocityY:0}};
    renderer.render(snapshot);expect(context.strokeRect).not.toHaveBeenCalled();
    renderer.render(snapshot,{showPlayerHitbox:true});expect(context.strokeRect).toHaveBeenCalledWith(232,262,16,16);
    renderer.destroy();
  });
  it('draws both warned and fired laser lines using the shared right-to-left sweep', () => {
    const context=createContext();
    const attack={type:'laser',kind:'single',ys:[80,460],y:80,thickness:18,telegraphDurationSeconds:.7,
      telegraphRemainingSeconds:.7,activeRemainingSeconds:1,fadeRemainingSeconds:.15};
    drawLaser(context,attack);
    expect(context.lineTo).toHaveBeenCalledWith(960,80);
    expect(context.lineTo).toHaveBeenCalledWith(960,460);
    context.moveTo.mockClear(); updateLaser(attack,1.1); drawLaser(context,attack);
    expect(context.moveTo).toHaveBeenCalledWith(996,80);
    expect(context.moveTo).toHaveBeenCalledWith(996,460);
  });
  it('fills a white recharge arc around the enlarged ship and hides it when ready', () => {
    const context = createContext(), player = { x: 240, y: 270, width: 36, dashCooldownRemainingSeconds: .35 };
    drawDashCooldown(context, player);
    expect(context.arc).toHaveBeenCalledWith(204, 246, 8, -Math.PI / 2, Math.PI / 2);
    expect(context.arc.mock.calls.every(([x,y,r])=>x===204&&y===246&&r<=9.5)).toBe(true);
    expect(context.strokeStyle).toBe('#ffffff');
    context.arc.mockClear(); drawDashCooldown(context, { ...player, dashCooldownRemainingSeconds: 0 });
    expect(context.arc).not.toHaveBeenCalled();
    expect(context.strokeRect).not.toHaveBeenCalled();
  });

  it('keeps charging the manual laser until.5s then renders its beam during recovery', () => {
    const c=createContext(),player={x:240,y:270},theme={accent:'#67dfff'};
    const shot={chargeSeconds:.5,durationSeconds:.7,toX:750,toY:270};
    drawManualLaser(c,{...shot,elapsedSeconds:.499},player,theme);
    expect(c.createRadialGradient).toHaveBeenCalled();expect(c.lineTo).not.toHaveBeenCalled();
    drawManualLaser(c,{...shot,elapsedSeconds:.5},player,theme);
    expect(c.lineTo).toHaveBeenCalledWith(960,270);
  });
  it('renders each live projectile of the stage volley and the player counterattack', () => {
    const canvas = document.createElement('canvas'), context = createContext();
    canvas.getContext = () => context;
    const image = { name: 'projectile', width: 160, height: 90 };
    const renderer = createRenderer(canvas, { visualAssets: { get: key => key === 'stages.crystal-gates.projectile' ? image : null } });
    renderer.render({
      stage: { id: 'crystal-gates', mode: 'boss' }, difficulty: { isBoss: true },
      player: { x: 240, y: 270, width: 36, height: 24, velocityY: 0 },
      boss: { stageId: 'crystal-gates', attack: { type: 'volley', stageId: 'crystal-gates', projectiles: [
        { type: 'projectile', state: 'flying', x: 500, y: 180 },
        { type: 'projectile', state: 'flying', x: 550, y: 340 },
        { type: 'projectile', state: 'resolved', x: 200, y: 270 },
      ] }, counterattack: { fromX: 240, fromY: 270, toX: 820, toY: 270, elapsedSeconds: .15, durationSeconds: .3 } },
    });
    expect(context.drawImage.mock.calls.filter(([drawn]) => drawn === image)).toHaveLength(2);
    expect(context.lineTo).toHaveBeenCalledWith(530, 270);
    renderer.destroy();
  });

  it('preserves a clear player corridor through the stronger failure obstruction', () => {
    const canvas = document.createElement('canvas'), context = createContext(); canvas.getContext = () => context;
    const renderer = createRenderer(canvas);
    renderer.render({
      stage: { id: 'crystal-gates', mode: 'normal' }, difficulty: {},
      player: { x: 240, y: 270, width: 36, height: 24, velocityY: 0 },
      feedbackEffect: { kind: 'ink', durationSeconds: 4, remainingSeconds: 4 },
    });
    expect(context.ellipse).toHaveBeenCalledWith(240, 270, 74, 52, 0, 0, Math.PI * 2);
    expect(context.clip).toHaveBeenCalledWith('evenodd');
    renderer.destroy();
  });
  it('keeps the darker background and mood layers behind foreground sprites in all six stages', () => {
    for (const stageId of Object.keys(STAGE_VISUAL_THEMES)) {
      for (const mode of ['normal', 'warning', 'boss']) {
        const canvas = document.createElement('canvas');
        const context = createContext();
        const operations = [];
        context.fillRect.mockImplementation((...rect) => {
          operations.push({ type: 'fill', color: context.fillStyle, rect });
        });
        context.drawImage.mockImplementation((image) => {
          operations.push({ type: 'image', name: image.name, alpha: context.globalAlpha, glow: context.shadowColor });
        });
        canvas.getContext = () => context;
        const image = (name) => ({ name, width: 1600, height: 900 });
        const assets = new Map([
          [`stages.${stageId}.background`, image('background')],
          [`stages.${stageId}.bossBackground`, image('background')],
          [`stages.${stageId}.boss`, image('boss')],
          ['aircraft.default', image('ship')],
        ]);
        const renderer = createRenderer(canvas, { visualAssets: { get: (key) => assets.get(key) ?? null } });
        renderer.render({
          stage: { id: stageId, mode, elapsedSeconds: 1 },
          difficulty: { isBoss: mode === 'boss', isWarning: mode !== 'normal' },
          boss: mode === 'boss' ? { hp: 3, maxHp: 3 } : null,
          aircraft: { id: 'default' },
          player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
          obstacles: [],
        });
        const darkening = operations.findIndex((operation) => operation.color === 'rgba(2, 6, 18, 0.34)');
        const shipIndex = operations.findIndex((operation) => operation.name === 'ship');
        expect(darkening).toBeGreaterThan(-1);
        expect(darkening).toBeLessThan(shipIndex);
        expect(operations[shipIndex]).toMatchObject({ alpha: 1, glow: '#55f6e5' });
        const firstActor = operations.findIndex((operation) => ['ship', 'boss'].includes(operation.name));
        expect(operations.every((operation, index) => operation.type !== 'fill'
          || operation.rect.join(',') !== `0,0,${WORLD_WIDTH},${WORLD_HEIGHT}` || index < firstActor)).toBe(true);
        if (mode === 'boss') {
          const bossIndex = operations.findIndex((operation) => operation.name === 'boss');
          const atmosphereIndex = operations.findIndex((operation) => operation.color === 'rgba(0, 0, 0, 0.2)');
          expect(atmosphereIndex).toBeGreaterThan(darkening);
          expect(atmosphereIndex).toBeLessThan(bossIndex);
          expect(operations[bossIndex].alpha).toBe(1);
        }
        expect(context.strokeRect).not.toHaveBeenCalled();
        renderer.destroy();
      }
    }
  });

  it('keeps six image-backed fallbacks intact when raster rig APIs are unavailable', () => {
    const stageIds = [
      'crystal-gates', 'industrial-void', 'signal-monoliths',
      'gravity-well', 'abyssal-beast', 'solar-forge',
    ];
    const signatures = [];
    const motionCalls = (context) => JSON.stringify({
      arcs: context.arc.mock.calls,
      moves: context.moveTo.mock.calls,
      lines: context.lineTo.mock.calls,
      rotations: context.rotate.mock.calls,
      images: context.drawImage.mock.calls,
    });

    for (const stageId of stageIds) {
      const image = { name: `${stageId}-boss`, width: 800, height: 600 };
      const assets = { get: (path) => path === `stages.${stageId}.boss` ? image : null };
      const theme = STAGE_VISUAL_THEMES[stageId];
      const first = createContext();
      const later = createContext();
      const reducedA = createContext();
      const reducedB = createContext();
      const boss = Object.freeze({ hp: 3, attack: Object.freeze({ state: 'charging', x: 600 }) });

      drawBoss(first, { isBoss: true, bossPattern: 'shift' }, theme, boss, 0, assets, stageId, false);
      drawBoss(later, { isBoss: true, bossPattern: 'shift' }, theme, boss, 1.2, assets, stageId, false);
      drawBoss(reducedA, { isBoss: true, bossPattern: 'shift' }, theme, boss, 0, assets, stageId, true);
      drawBoss(reducedB, { isBoss: true, bossPattern: 'shift' }, theme, boss, 8, assets, stageId, true);

      expect(motionCalls(first)).toBe(motionCalls(later));
      expect(motionCalls(reducedA)).toBe(motionCalls(reducedB));
      signatures.push(motionCalls(later));
      expect(boss).toEqual({ hp: 3, attack: { state: 'charging', x: 600 } });
    }

    expect(new Set(signatures).size).toBe(6);
  });

  it('keeps logical coordinates while resizing the physical canvas for DPR', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const previousDpr = globalThis.devicePixelRatio;
    Object.defineProperty(globalThis, 'devicePixelRatio', { configurable: true, value: 2 });

    const renderer = createRenderer(canvas);

    expect(canvas.width).toBe(WORLD_WIDTH * 2);
    expect(canvas.height).toBe(WORLD_HEIGHT * 2);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

    renderer.destroy();
    Object.defineProperty(globalThis, 'devicePixelRatio', { configurable: true, value: previousDpr ?? 1 });
  });

  it('renders background, obstacles, ship, warning, and boss state', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [{ id: 'wall-1', x: 520, width: 72, gapCenter: 270, gapHeight: 180, kind: 'special' }],
      difficulty: { isWarning: true, isBoss: true, bossPattern: 'fast' },
    });

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).not.toHaveBeenCalledWith('BOSS: FAST', 840, 392);
    expect(context.fillText).not.toHaveBeenCalledWith('BOSS WARNING', 480, 64);
    expect(context.arc).toHaveBeenCalled();
    renderer.destroy();
  });

  it('exposes pure drawing helpers for ship and obstacle visuals', () => {
    const context = createContext();

    drawShip(context, { x: 240, y: 270, velocityY: 10, width: 36, height: 24 });
    drawObstacle(context, { x: 520, width: 72, gapCenter: 270, gapHeight: 180, kind: 'normal' });

    expect(context.fill).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(VISUAL_THEME.ship).not.toBe(VISUAL_THEME.obstacle);
  });

  it('draws the gameplay ship 50% larger without changing logical hitbox geometry', () => {
    const context = createContext();
    const image = { width: 1774, height: 887 };
    const player = { x: 240, y: 270, velocityY: 0, width: 36, height: 24 };
    drawShip(context, player, VISUAL_THEME, 'velocity', { get: () => image });

    const [, x, y, width, height] = context.drawImage.mock.calls[0];
    expect(x).toBeCloseTo(-32.4);
    expect(y).toBeCloseTo(-16.2);
    expect(width).toBeCloseTo(64.8);
    expect(height).toBeCloseTo(32.4);
    expect(player).toMatchObject({ width: 36, height: 24 });
  });

  it('draws one tapered aircraft-accent trail following the recorded path', () => {
    const context = createContext();
    const player = { x: 240, y: 270, width: 36, height: 24, isDashing: false };
    drawShipExhaust(context, player, 'velocity', 1.25, [
      { x: 100, y: 220 }, { x: 140, y: 250 }, { x: 190, y: 270 }, { x: 223, y: 270 },
    ]);

    expect(context.stroke).toHaveBeenCalledTimes(3);
    expect(context.strokeStyle).toBe('#ff55cf');
    expect(context.lineWidth).toBeCloseTo(5.5);
    expect(context.moveTo.mock.calls[0]).toEqual([100, 220]);
    expect(context.lineTo.mock.calls.at(-1)).toEqual([223, 270]);
    expect(player).toEqual({ x: 240, y: 270, width: 36, height: 24, isDashing: false });
  });

  it('draws a deterministic expanding ship-destruction effect and honors reduced motion', () => {
    const context = createContext();
    drawShipDeathEffect(context, {
      x: 240, y: 270, elapsedSeconds: 0.25, durationSeconds: 0.5,
    }, 'velocity');

    expect(context.arc).toHaveBeenCalledWith(240, 270, 12.5, 0, Math.PI * 2);
    expect(context.moveTo).toHaveBeenCalledTimes(10);
    expect(context.lineTo).toHaveBeenCalledTimes(20);

    const reducedContext = createContext();
    drawShipDeathEffect(reducedContext, {
      x: 240, y: 270, elapsedSeconds: 0.25, durationSeconds: 0.5,
    }, 'velocity', true);
    expect(reducedContext.arc).toHaveBeenCalledOnce();
    expect(reducedContext.moveTo).not.toHaveBeenCalled();

    const completedContext = createContext();
    drawShipDeathEffect(completedContext, {
      x: 240, y: 270, elapsedSeconds: 0.5, durationSeconds: 0.5,
    });
    expect(completedContext.arc).not.toHaveBeenCalled();
  });

  it('replaces the live ship and trail with the death effect in gameplay rendering', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);
    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      aircraft: { id: 'default' },
      flightTrail: [{ x: 180, y: 260 }, { x: 220, y: 270 }],
      deathEffect: { x: 240, y: 270, elapsedSeconds: 0.25, durationSeconds: 0.5, aircraftId: 'default' },
      obstacles: [],
      difficulty: {},
    });

    expect(context.drawImage).not.toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledWith(240, 270, 12.5, 0, Math.PI * 2);
    renderer.destroy();
  });

  it('renders special walls as a full-height dash-only barrier', () => {
    const context = createContext();
    drawObstacle(context, { x: 520, width: 72, gapCenter: 270, gapHeight: 180, kind: 'special' });

    expect(context.fillRect).toHaveBeenCalledWith(520, 0, 72, WORLD_HEIGHT);
  });

  it('draws a timing guide only for enabled special walls', () => {
    const context = createContext();
    const specialWall = {
      x: 520, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special', showTimingGuide: true,
    };

    drawObstacle(context, specialWall, VISUAL_THEME, { scrollSpeed: 240, timingWindowSeconds: 0.5 });

    expect(context.fillRect).toHaveBeenCalledWith(400, 0, 120, WORLD_HEIGHT);
    expect(context.moveTo).toHaveBeenCalledWith(400, 0);
    expect(context.lineTo).toHaveBeenCalledWith(400, WORLD_HEIGHT);
    expect(context.moveTo).toHaveBeenCalledWith(520, 0);
    expect(context.lineTo).toHaveBeenCalledWith(520, WORLD_HEIGHT);
    const noGuideContext = createContext();
    drawObstacle(noGuideContext, { ...specialWall, showTimingGuide: false }, VISUAL_THEME, {
      scrollSpeed: 240,
      timingWindowSeconds: 0.5,
    });
    expect(noGuideContext.fillRect).not.toHaveBeenCalledWith(400, 0, 120, WORLD_HEIGHT);
  });

  it('brightens the exact-width guide as the wall approaches and freezes it for reduced motion', () => {
    const renderGuide = (x, elapsedSeconds, reducedMotion = false) => {
      const context = createContext();
      let bandAlpha = 0;
      context.fillRect.mockImplementation(function captureBandAlpha(...args) {
        if (args[0] === x - 120 && args[1] === 0 && args[2] === 120 && args[3] === WORLD_HEIGHT) {
          bandAlpha = this.globalAlpha;
        }
      });
      drawObstacle(context, {
        x, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special', showTimingGuide: true,
      }, VISUAL_THEME, {
        scrollSpeed: 240, timingWindowSeconds: 0.5, playerX: 240, elapsedSeconds,
      }, null, reducedMotion);
      return { context, bandAlpha };
    };

    const distant = renderGuide(520, 0.5);
    const approaching = renderGuide(280, 0.5);
    const staticGuide = renderGuide(280, 0.5, true);
    expect(distant.bandAlpha).toBeCloseTo(0.35 + Math.sin(3) * 0.04);
    expect(approaching.bandAlpha).toBeCloseTo(0.35 + (1 - (40 - 28) / 120) * 0.08 + Math.sin(3) * 0.04);
    expect(staticGuide.bandAlpha).toBe(0.42);
    expect(staticGuide.context.shadowBlur).toBe(0);
  });

  it('draws the special-wall break opening, expanding shock ring, and radial fragments at the crossing point', () => {
    const context = createContext();
    drawObstacle(context, {
      x: 520, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special',
      breakEffect: { centerY: 210, remainingSeconds: 0.3, durationSeconds: 0.65, seed: 0.2 },
    });

    expect(context.fillRect).toHaveBeenCalledWith(520, 0, 24, expect.any(Number));
    expect(context.arc).toHaveBeenCalledWith(532, 210, expect.any(Number), 0, Math.PI * 2);
    expect(context.moveTo.mock.calls.length).toBeGreaterThanOrEqual(8);
    expect(context.lineTo.mock.calls.length).toBeGreaterThanOrEqual(8);
  });

  it('clips the hybrid special blade to the ordinary opening and keeps the local break', () => {
    const context = createContext();
    const wall = { kind: 'hybrid', x: 500, width: 72, gapCenter: 270, gapHeight: 180, barrierBroken: false };
    drawObstacle(context, wall);
    expect(context.fillRect).toHaveBeenCalledWith(500, 0, 72, 180);
    expect(context.fillRect).toHaveBeenCalledWith(500, 360, 72, 180);
    expect(context.rect).toHaveBeenCalledWith(0, 180, WORLD_WIDTH, 180);
    expect(context.fillRect).toHaveBeenCalledWith(524, 0, 24, WORLD_HEIGHT);
    context.fillRect.mockClear();
    drawObstacle(context, { ...wall, barrierBroken: true, barrierBreakY: 270 });
    expect(context.fillRect).not.toHaveBeenCalledWith(524, 0, 24, WORLD_HEIGHT);
    expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
  });

  it('draws both a trail and a hull shock ring for normal and special dashes', () => {
    const canvas = document.createElement('canvas');
    const normalContext = createContext();
    canvas.getContext = vi.fn(() => normalContext);
    const normalRenderer = createRenderer(canvas);
    normalRenderer.render({
      player: {
        x: 240, y: 270, velocityY: 0, width: 36, height: 24,
        isDashing: true, dashKind: 'normal', dashRemainingSeconds: 0.6,
      },
      obstacles: [], difficulty: {},
    });

    const specialContext = createContext();
    canvas.getContext = vi.fn(() => specialContext);
    const specialRenderer = createRenderer(canvas);
    specialRenderer.render({
      player: {
        x: 240, y: 270, velocityY: 0, width: 36, height: 24,
        isDashing: true, dashKind: 'special', dashRemainingSeconds: 0.6,
      },
      obstacles: [], difficulty: {},
    });

    expect(normalContext.stroke.mock.calls.length).toBeGreaterThan(14);
    expect(specialContext.stroke.mock.calls.length).toBe(normalContext.stroke.mock.calls.length);
    expect(specialContext.arc.mock.calls.length).toBe(normalContext.arc.mock.calls.length);
    normalRenderer.destroy();
    specialRenderer.destroy();
  });

  it('shows a brief hull-centered shock ring on every dash and restores Canvas state', () => {
    for (const dashKind of ['normal', 'special']) {
      const context = createContext();
      const player = { x: 240, y: 270, width: 36, height: 24, isDashing: true, dashKind, dashRemainingSeconds: 0.6 };
      drawDashShockRing(context, player);
      expect(context.translate).toHaveBeenCalledWith(240, 270);
      expect(context.arc).toHaveBeenCalledTimes(4);
      expect(context.strokeRect).not.toHaveBeenCalled();
      expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
      context.arc.mockClear();
      drawDashShockRing(context, { ...player, dashRemainingSeconds: 0.2 });
      expect(context.arc).not.toHaveBeenCalled();
    }
  });

  it('brings the whole boss sprite in from outside the right edge to its idle anchor', () => {
    const context = createContext();
    const image = { width: 192, height: 128 };
    const positions = [];
    for (const remaining of [1, 0.5, 0]) {
      context.drawImage.mockClear();
      drawBoss(context, { isBoss: true }, STAGE_VISUAL_THEMES['crystal-gates'],
        { entranceDurationSeconds: 1, entranceRemainingSeconds: remaining }, 0, { get: () => image }, 'crystal-gates');
      positions.push(context.drawImage.mock.calls[0][1]);
    }
    expect(positions[0]).toBeGreaterThan(WORLD_WIDTH);
    expect(positions[1]).toBeLessThan(positions[0]);
    expect(positions[1]).toBeGreaterThan(positions[2]);
    expect(positions[2]).toBe(842 - 96);
  });

  it('renders exactly four thin acceleration lines for a dash without a filled trail', () => {
    const context = createContext();
    drawDashTrail(context, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24,
      isDashing: true, dashRemainingSeconds: 0.6,
    });

    expect(context.beginPath).toHaveBeenCalledTimes(4);
    expect(context.moveTo).toHaveBeenCalledTimes(4);
    expect(context.lineTo).toHaveBeenCalledTimes(4);
    expect(context.stroke).toHaveBeenCalledTimes(4);
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('omits acceleration lines outside a dash and keeps the procedural ship dash accents', () => {
    const idleTrailContext = createContext();
    drawDashTrail(idleTrailContext, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24, isDashing: false,
    });
    expect(idleTrailContext.stroke).not.toHaveBeenCalled();

    const dashShipContext = createContext();
    drawShip(dashShipContext, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24,
      isDashing: true, dashRemainingSeconds: 0.6,
    });
    expect(dashShipContext.stroke).toHaveBeenCalledTimes(3);
    expect(dashShipContext.arc).toHaveBeenCalledTimes(1);
  });

  it('does not draw a rectangular hitbox outline around an image-backed ship during dash', () => {
    const context = createContext();
    const image = { width: 100, height: 60 };
    drawShip(context, {
      x: 240, y: 270, velocityY: 0, width: 36, height: 24,
      isDashing: true, dashRemainingSeconds: 0.6,
    }, VISUAL_THEME, 'default', { get: () => image });

    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledTimes(1);
  });

  it('renders a deterministic static menu scene', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);

    renderer.renderMenuBackground();

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    expect(context.createRadialGradient).toHaveBeenCalled();
    expect(context.moveTo).toHaveBeenCalled();
    expect(context.drawImage).not.toHaveBeenCalled();
    renderer.destroy();
  });

  it('renders stage-specific full-screen scenes and crossfades background keys', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);
    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: {},
      stage: {
        id: 'solar-forge', mode: 'normal', elapsedSeconds: 3,
        transition: { fromKey: 'gravity-well-boss', toKey: 'solar-forge', progress: 0.4 },
      },
    });

    expect(Object.keys(STAGE_VISUAL_THEMES)).toHaveLength(6);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    expect(context.arc).toHaveBeenCalled();
    renderer.destroy();
  });

  it('scrolls repeated stage artwork leftward and overlaps copies at the wrap seam', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const background = { name: 'scrolling-bg', width: 2048, height: 1152 };
    const renderer = createRenderer(canvas, {
      visualAssets: { get: (path) => path === 'stages.crystal-gates.background' ? background : null },
      reducedMotion: false,
    });

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: { scrollSpeed: 240 },
      backgroundScrollDistancePx: 100,
      stage: { id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0 },
    });

    const backgroundCalls = context.drawImage.mock.calls.filter(([drawn]) => drawn === background);
    expect(backgroundCalls[0][1]).toBe(-100);
    expect(backgroundCalls.length).toBeGreaterThan(2);
    expect(context.clip).toHaveBeenCalled();
    renderer.destroy();
  });

  it('renders boss projectile telegraphs, quarter lasers, and challenge cues from snapshot state', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);
    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: { isBoss: true, bossPattern: 'signal' },
      stage: { id: 'signal-monoliths', mode: 'boss', elapsedSeconds: 2 },
      boss: {
        hitEffect: { remainingSeconds: 0.2, durationSeconds: 0.38 },
        attack: { type: 'projectile', state: 'charging', telegraphPoints: [{ x: 840, y: 180 }, { x: 240, y: 270 }] },
      },
      challenge: { active: true, sequence: ['KeyW', 'KeyA', 'KeyD'], cursor: 1 },
    });
    expect(context.fillText).not.toHaveBeenCalledWith('W', expect.any(Number), 258);
    expect(context.fillText).not.toHaveBeenCalledWith('BOSS: SIGNAL', expect.any(Number), 392);
    expect(context.arc.mock.calls.map((call) => call[2])).toContain(4);
    expect(context.arc.mock.calls.map((call) => call[2])).toContain(2);
    renderer.destroy();
  });

  it('adds visible outer and inner outlines to flying boss projectiles', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const renderer = createRenderer(canvas);

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: { isBoss: true },
      stage: { id: 'crystal-gates', mode: 'boss', elapsedSeconds: 0 },
      boss: { attack: { type: 'projectile', state: 'flying', x: 600, y: 260 } },
    });

    const radii = context.arc.mock.calls.map((call) => call[2]);
    expect(radii).toContain(18);
    expect(radii).toContain(12);
    renderer.destroy();
  });

  it('draws the loaded Crystal Gates art in layer order without mutating snapshot geometry', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const image = (name, width = 1024, height = 1024) => ({ name, width, height });
    const assets = new Map([
      ['stages.crystal-gates.background', image('stage-background')],
      ['stages.crystal-gates.normalWall', image('normal-wall', 1024, 1536)],
      ['stages.crystal-gates.specialWall', image('special-wall', 1024, 1536)],
      ['stages.crystal-gates.boss', image('boss')],
      ['stages.crystal-gates.projectile', image('projectile')],
      ['aircraft.velocity', image('velocity', 1774, 887)],
    ]);
    const renderer = createRenderer(canvas, { visualAssets: { get: (path) => assets.get(path) ?? null } });
    const player = Object.freeze({ x: 240, y: 270, velocityY: 0, width: 36, height: 24 });
    const normalWall = Object.freeze({ x: 500, width: 72, gapCenter: 270, gapHeight: 180, kind: 'normal' });
    const specialWall = Object.freeze({ x: 700, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special' });
    const projectile = Object.freeze({ type: 'projectile', state: 'flying', x: 600, y: 260, speed: 320 });

    renderer.render({
      player,
      aircraft: { id: 'velocity' },
      obstacles: [normalWall, specialWall],
      difficulty: { isBoss: true, bossPattern: 'shift' },
      stage: { id: 'crystal-gates', mode: 'normal', elapsedSeconds: 2 },
      boss: { attack: projectile },
    });

    const drawnImages = context.drawImage.mock.calls.map(([drawn]) => drawn.name);
    expect(drawnImages).toContain('stage-background');
    expect(drawnImages).toContain('normal-wall');
    expect(drawnImages).toContain('special-wall');
    expect(drawnImages).toContain('boss');
    expect(drawnImages).toContain('projectile');
    expect(drawnImages.at(-1)).toBe('velocity');
    expect(normalWall).toEqual({ x: 500, width: 72, gapCenter: 270, gapHeight: 180, kind: 'normal' });
    expect(specialWall).toEqual({ x: 700, width: 24, gapCenter: 270, gapHeight: 180, kind: 'special' });
    expect(player).toEqual({ x: 240, y: 270, velocityY: 0, width: 36, height: 24 });
    expect(projectile).toEqual({ type: 'projectile', state: 'flying', x: 600, y: 260, speed: 320 });
    expect(context.clip).toHaveBeenCalled();
    renderer.destroy();
  });

  it('draws approved luminous laser rays over stage art without stretching the old panel asset', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const stageBackground = { name: 'stage-background', width: 2048, height: 1152 };
    const laser = { name: 'laser', width: 2048, height: 768 };
    const assets = new Map([
      ['stages.crystal-gates.background', stageBackground],
      ['stages.crystal-gates.laser', laser],
    ]);
    const renderer = createRenderer(canvas, { visualAssets: { get: (path) => assets.get(path) ?? null } });

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: {},
      stage: { id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0 },
      boss: { attack: { type: 'laser', kind: 'single', y: 210, thickness: 18, telegraphRemainingSeconds: 0, activeRemainingSeconds: 1 } },
    });

    expect(context.drawImage.mock.calls.some(([drawn]) => drawn === stageBackground)).toBe(true);
    expect(context.drawImage.mock.calls.some(([drawn]) => drawn === laser)).toBe(false);
    expect(context.createLinearGradient).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalled(); // The unavailable player sprite uses the procedural fallback.
    renderer.destroy();
  });

  it('draws the same right-to-left front used for collision across warning, firing and fade', () => {
    const attack = { type: 'laser', ...createSingleLaser({ gapCenter: 270, gapHeight: 180 }) };
    const context = createContext();
    drawLaser(context, attack);
    expect(context.setLineDash).toHaveBeenCalledWith([12, 12]);
    expect(context.lineTo).toHaveBeenCalledWith(WORLD_WIDTH, attack.y);
    expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
    context.lineTo.mockClear();
    updateLaser(attack, 0.8);
    drawLaser(context, attack);
    const front = getLaserFrontX(attack);
    // The 2px white core is round-capped: its visible leading edge is exactly front.
    expect(context.lineTo).toHaveBeenCalledWith(front + 1, attack.y);
    expect(context.translate).toHaveBeenCalledWith(front + 18 * 0.18, attack.y);
    expect(context.createRadialGradient).toHaveBeenCalled();
    updateLaser(attack, 0.95);
    expect(attack.activeRemainingSeconds).toBe(0);
    drawLaser(context, attack);
    const fadingStrokes = context.stroke.mock.calls.length;
    updateLaser(attack, 1);
    drawLaser(context, attack);
    expect(context.stroke.mock.calls.length).toBe(fadingStrokes);
    expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
    for (const call of [...context.lineTo.mock.calls, ...context.arc.mock.calls]) {
      expect(call.every(Number.isFinite)).toBe(true);
    }
  });

  it.each([0, 0.3, 0.6, 0.9])('keeps quarter %s safe and uses shared glow without boxed danger panels', (random) => {
    const attack = { type: 'laser', ...createQuarterLaser({ rng: () => random }) };
    const context = createContext();
    drawLaser(context, attack);
    expect(context.setLineDash).toHaveBeenCalledWith([14, 16]);
    expect(context.strokeRect).not.toHaveBeenCalled();
    updateLaser(attack, 2.1);
    context.rect.mockClear();
    context.fillRect.mockClear(); context.clip.mockClear();
    drawLaser(context, attack);
    const safeTop = attack.safeZone * 135;
    for (const [, top, , height] of context.rect.mock.calls) {
      expect(top + height <= safeTop || top >= safeTop + 135).toBe(true);
    }
    expect(context.clip).toHaveBeenCalledTimes(4);
    expect(context.createLinearGradient).toHaveBeenCalled();
    // Three clipped hatch zones and one safe tint; no danger enters the safe lane.
    const zones=context.fillRect.mock.calls.filter(([, , width])=>width===WORLD_WIDTH);
    expect(zones).toHaveLength(4);
    expect(zones.at(-1)).toEqual([0,safeTop,WORLD_WIDTH,135]);
    for(const [,top,,height] of zones.slice(0,3))expect(top+height<=safeTop||top>=safeTop+135).toBe(true);
    expect(context.fillText).not.toHaveBeenCalled();
    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.save.mock.calls.length).toBe(context.restore.mock.calls.length);
  });

  it('uses the loaded menu background without drawing a duplicate default aircraft', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const background = { name: 'menu-background', width: 2048, height: 1152 };
    const assets = new Map([['menuBackground', background]]);
    const renderer = createRenderer(canvas, { visualAssets: { get: (path) => assets.get(path) ?? null } });

    renderer.renderMenuBackground();

    expect(context.drawImage.mock.calls.map(([drawn]) => drawn.name)).toEqual(['menu-background']);
    renderer.destroy();
  });

  it('keeps the source scenery until opaque portal cover and draws the cover last', () => {
    for (const [phase, swapped, phaseElapsedSeconds] of [
      ['lead-in', false, .1], ['white-out', false, .1], ['hold', true, .05], ['reveal', true, .3],
    ]) {
      const canvas = document.createElement('canvas');
      const context = createContext();
      canvas.getContext = vi.fn(() => context);
      const backgrounds = new Map([
        ['stages.crystal-gates.background', { name: 'normal', width: 1600, height: 900 }],
        ['stages.crystal-gates.bossBackground', { name: 'boss', width: 1600, height: 900 }],
      ]);
      const renderer = createRenderer(canvas, {
        visualAssets: { get: (path) => backgrounds.get(path) ?? null },
      });

      renderer.render({
        player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
        obstacles: [],
        difficulty: {},
        stage: {
          id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0,
          transition: {
            kind: 'portal', phase, swapped, phaseElapsedSeconds,
            fromKey: 'crystal-gates-boss', toKey: 'crystal-gates', destinationStageId: 'crystal-gates',
            portalX: 600, crossingX: 240, crossingY: 270, elapsedSeconds: 1,
          },
        },
      });

      expect(context.translate.mock.calls.filter(([, y]) => y === 0)).toEqual([]);
      const names = context.drawImage.mock.calls.map(([image]) => image.name);
      expect(names[0]).toBe(swapped ? 'normal' : 'boss');
      if (phase !== 'lead-in') {
        expect(context.fillStyle).toBe('#ffffff');
        expect(context.fillRect.mock.calls.at(-1)).toEqual([0, 0, WORLD_WIDTH, WORLD_HEIGHT]);
      }
      renderer.destroy();
    }
  });

  it('uses opaque reduced-motion portal cover rather than exposing the background switch', () => {
    const canvas = document.createElement('canvas');
    const context = createContext();
    canvas.getContext = vi.fn(() => context);
    const sceneDraws = [];
    context.drawImage = vi.fn((image, x, y) => sceneDraws.push({ name: image.name, x, y, alpha: context.globalAlpha }));
    const backgrounds = new Map([
      ['stages.crystal-gates.background', { name: 'normal', width: 1600, height: 900 }],
      ['stages.crystal-gates.bossBackground', { name: 'boss', width: 1600, height: 900 }],
    ]);
    const renderer = createRenderer(canvas, {
      visualAssets: { get: (path) => backgrounds.get(path) ?? null },
      reducedMotion: true,
    });

    renderer.render({
      player: { x: 240, y: 270, velocityY: 0, width: 36, height: 24 },
      obstacles: [],
      difficulty: {},
      stage: {
        id: 'crystal-gates', mode: 'normal', elapsedSeconds: 0,
        transition: {
          kind: 'portal', phase: 'hold', phaseElapsedSeconds: .05, swapped: true,
          fromKey: 'crystal-gates-boss', toKey: 'crystal-gates', destinationStageId: 'crystal-gates',
        },
      },
    });

    expect(sceneDraws[0].name).toBe('normal');
    expect(context.fillStyle).toBe('#c6dfed');
    expect(context.globalAlpha).toBe(1);
    expect(context.translate.mock.calls.filter(([, y]) => y === 0)).toEqual([]);
    renderer.destroy();
  });
});
