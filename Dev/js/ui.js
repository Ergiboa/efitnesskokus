// ══════════════════════════════════════════════════════
//  AUTOCOMPLETE ENGINE
// ══════════════════════════════════════════════════════
let _acInput = null;
let _acFocusIdx = -1;

window.showACDrop = (input) => {
  _acInput = input;
  _acFocusIdx = -1;
  const q = input.value.toLowerCase().trim();
  const drop = document.getElementById('ac-drop');
  if (!q || q.length < 1) { drop.style.display = 'none'; return; }

  const keys = Object.keys(DB).sort();
  const exact   = keys.filter(k => k.startsWith(q));
  const contains = keys.filter(k => !k.startsWith(q) && k.includes(q));
  const matches = [...exact, ...contains].slice(0, 8);

  if (!matches.length) { drop.style.display = 'none'; return; }

  const rect = input.getBoundingClientRect();
  drop.style.cssText = `position:fixed;z-index:502;left:${rect.left}px;top:${rect.bottom + 3}px;width:${Math.max(rect.width, 220)}px;display:block`;

  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  drop.innerHTML = matches.map((k, i) => {
    const e = DB[k];
    const hl = k.replace(new RegExp(`(${safeQ})`, 'gi'), '<span class="ac-highlight">$1</span>');
    const mac = `${e.kcal}kcal · ${e.prot}g P`;
    return `<div class="ac-item" data-idx="${i}" data-val="${k.replace(/"/g,'&quot;')}" onmousedown="applyAC(event,'${k.replace(/'/g,"\\'")}')" onmouseover="acHover(${i})">
      <span class="ac-name">${hl}</span>
      <span class="ac-mac">${mac}</span>
    </div>`;
  }).join('');
};

window.hideACDrop = () => {
  setTimeout(() => {
    const drop = document.getElementById('ac-drop');
    if (drop) drop.style.display = 'none';
    _acFocusIdx = -1;
  }, 160);
};

window.acHover = (idx) => {
  _acFocusIdx = idx;
  document.querySelectorAll('#ac-drop .ac-item').forEach((el, i) => {
    el.classList.toggle('ac-focused', i === idx);
  });
};

window.applyAC = (e, val) => {
  e.preventDefault();
  if (!_acInput) return;
  _acInput.value = val;
  _acInput.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('ac-drop').style.display = 'none';
  _acInput.focus();
};

// Keyboard navigation for autocomplete
document.addEventListener('keydown', (e) => {
  const drop = document.getElementById('ac-drop');
  if (!drop || drop.style.display === 'none' || !_acInput) return;
  const items = drop.querySelectorAll('.ac-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _acFocusIdx = Math.min(_acFocusIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('ac-focused', i === _acFocusIdx));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _acFocusIdx = Math.max(_acFocusIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('ac-focused', i === _acFocusIdx));
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (_acFocusIdx >= 0 && items[_acFocusIdx]) {
      e.preventDefault();
      const val = items[_acFocusIdx].dataset.val;
      _acInput.value = val;
      _acInput.dispatchEvent(new Event('change', { bubbles: true }));
      drop.style.display = 'none';
    }
  } else if (e.key === 'Escape') {
    drop.style.display = 'none';
  }
});

// Close AC when clicking outside
document.addEventListener('click', (e) => {
  const drop = document.getElementById('ac-drop');
  if (drop && !drop.contains(e.target) && e.target !== _acInput) {
    drop.style.display = 'none';
  }
});

