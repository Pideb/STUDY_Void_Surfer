export function createButton(label, onClick, options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', options.ariaLabel ?? label);
  if (options.className) button.className = options.className;
  button.addEventListener('click', onClick);
  return button;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function createVolumeIcon(icon) {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const speaker = document.createElementNS(SVG_NAMESPACE, 'path');
  speaker.setAttribute('d', 'M4 10h4l5-4v12l-5-4H4z');
  svg.append(speaker);

  if (icon === 'volume-on') {
    const waves = document.createElementNS(SVG_NAMESPACE, 'path');
    waves.setAttribute('d', 'M16 9a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10');
    svg.append(waves);
  } else if (icon === 'volume-off') {
    const slash = document.createElementNS(SVG_NAMESPACE, 'path');
    slash.setAttribute('d', 'm16 9 4 4m0-4-4 4');
    svg.append(slash);
  }

  return svg;
}

export function createIconButton({ label, icon, onClick, className = '' }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `icon-button ${className}`.trim();
  button.setAttribute('aria-label', label);
  button.append(createVolumeIcon(icon));
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
