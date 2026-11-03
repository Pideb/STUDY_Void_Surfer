import './startup-update.css';

export function renderStartupUpdateDialog(entry, { close } = {}) {
  if (!entry || typeof entry.version !== 'string' || !entry.version.trim()
    || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    || !Array.isArray(entry.body) || !entry.body.length
    || entry.body.some(line => typeof line !== 'string' || !line.trim())) return null;

  const veil = document.createElement('section');
  veil.className = 'update-veil';
  const dialog = document.createElement('article');
  dialog.className = 'startup-update';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'startup-update-title');
  dialog.setAttribute('aria-describedby', 'startup-update-changes');
  const header = document.createElement('header');
  header.className = 'update-heading';
  const heading = document.createElement('div');
  const kicker = document.createElement('p');
  kicker.className = 'update-kicker';
  kicker.textContent = '업데이트 내역';
  const version = document.createElement('h2');
  version.id = 'startup-update-title';
  version.textContent = entry.version;
  const date = document.createElement('p');
  date.className = 'update-date';
  date.textContent = entry.date.replaceAll('-', '.');
  heading.append(kicker, version);
  header.append(heading, date);

  const changes = document.createElement('section');
  changes.id = 'startup-update-changes';
  changes.className = 'update-copy';
  changes.setAttribute('aria-label', '최신 업데이트 내용');
  const list = document.createElement('ul');
  for (const line of entry.body) {
    const item = document.createElement('li');
    item.textContent = line;
    list.append(item);
  }
  changes.append(list);
  const actions = document.createElement('footer');
  actions.className = 'update-actions';
  const guide = document.createElement('a');
  guide.className = 'update-guide';
  guide.href = '/guide/index.html#updates';
  guide.target = '_blank';
  guide.rel = 'noopener';
  guide.textContent = '플레이 가이드 ↗';
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'update-confirm';
  confirm.textContent = '확인';
  confirm.addEventListener('click', () => close?.());
  actions.append(guide, confirm);
  dialog.append(header, changes, actions);
  veil.append(dialog);

  // Consume modal keys before they reach the game's global menu shortcuts.
  veil.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); if (!event.repeat) close?.(); return; }
    if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const controls = [guide, confirm];
      const direction = (event.key === 'Tab' && event.shiftKey) || ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
      controls[(controls.indexOf(document.activeElement) + direction + controls.length) % controls.length].focus({ preventScroll: true });
    } else if (event.target === confirm && ['Enter', ' ', 'Spacebar'].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) confirm.click();
    }
  });
  return veil;
}
