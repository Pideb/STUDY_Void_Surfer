import { describe, it, expect } from 'vitest';
import { getRenderResolution, MAX_RENDER_PIXELS } from '../../src/game/render-resolution.js';

describe('viewport-sized render buffers', () => {
  it.each([[1920,1080,1,1920,1080],[2560,1440,1,2560,1440],[3840,2160,1,3840,2160],
    [1920,1080,2,3840,2160],[3840,2160,2,3840,2160],[640,360,3,1280,720]])(
    '%sx%s DPR%s renders at%sx%s', (width,height,dpr,outWidth,outHeight) => {
      const r=getRenderResolution({width,height,dpr});
      expect(r.width).toBe(outWidth);expect(r.height).toBe(outHeight);
      expect(r.scaleX).toBe(outWidth/960);expect(r.scaleY).toBe(outHeight/540);
      expect(r.width*r.height).toBeLessThanOrEqual(MAX_RENDER_PIXELS);
    });
  it('falls back without layout and handles tiny/non-finite viewports safely', () => {
    expect(getRenderResolution()).toMatchObject({width:960,height:540});
    expect(getRenderResolution({width:NaN,height:Infinity,dpr:Infinity})).toMatchObject({width:960,height:540});
    const tiny=getRenderResolution({width:.01,height:.01,dpr:2});expect(tiny.width).toBe(1);expect(tiny.height).toBe(1);
    const ultrawide=getRenderResolution({width:7680,height:2160,dpr:2});
    expect(ultrawide.width*ultrawide.height).toBeLessThanOrEqual(MAX_RENDER_PIXELS);
    expect(Math.abs(ultrawide.width/ultrawide.height-7680/2160)).toBeLessThan(.003);
  });
});
