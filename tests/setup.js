Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({
    clearRect() {},
    fillRect() {},
    fillText() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    arc() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
  }),
});

globalThis.requestAnimationFrame ??= (callback) => setTimeout(() => callback(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);

class TestAudioContext {
  state = 'suspended';

  async resume() {
    this.state = 'running';
  }

  close() {
    this.state = 'closed';
  }
}

globalThis.AudioContext ??= TestAudioContext;
