export function createInputController(target, onLift, onSpace, onPause = () => {}) {
  if (!target || typeof target.addEventListener !== 'function') {
    throw new TypeError('입력 대상은 EventTarget이어야 합니다.');
  }

  const handlePointerDown = (event) => {
    event.preventDefault?.();
    onLift();
  };

  const handleKeyDown = (event) => {
    if (event.code === 'Space') {
      if (event.repeat) {
        return;
      }

      event.preventDefault?.();
      onSpace();
      return;
    }

    if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault?.();
      onPause();
    }
  };

  target.addEventListener('pointerdown', handlePointerDown);
  target.addEventListener('keydown', handleKeyDown);

  return {
    destroy() {
      target.removeEventListener('pointerdown', handlePointerDown);
      target.removeEventListener('keydown', handleKeyDown);
    },
  };
}
