export function createButton(label, onClick, options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', options.ariaLabel ?? label);
  if (options.className) button.className = options.className;
  button.addEventListener('click', onClick);
  return button;
}

export function createPanel(title, className = '') {
  const panel = document.createElement('section');
  panel.className = `screen-panel ${className}`.trim();
  panel.setAttribute('aria-label', title);

  const heading = document.createElement('h1');
  heading.textContent = title;
  panel.append(heading);
  return panel;
}

export function announce(root, message) {
  let region = root.querySelector('[data-live-region]');
  if (!region) {
    region = document.createElement('div');
    region.className = 'sr-only';
    region.dataset.liveRegion = '';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    root.append(region);
  }
  region.textContent = message;
}
