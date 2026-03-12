// ── BOOT ──
document.getElementById('gif-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeGifModal(); });
boot();

// ── THEME TOGGLE ──
function applyTheme(light){
  document.body.classList.toggle('light', light);document.documentElement.classList.toggle('light', light);
  const icon = document.getElementById('theme-icon');
  const lbl  = document.getElementById('theme-label');
  if(icon) icon.textContent = light ? '🌙' : '☀️';
  if(lbl)  lbl.textContent  = light ? 'Modo noche' : 'Modo día';
  try { localStorage.setItem('efk-theme', light ? 'light' : 'dark'); } catch(e){}
}
window.toggleTheme = () => applyTheme(!document.body.classList.contains('light'));

// Apply saved theme immediately (before DOMContentLoaded to avoid flash)
(function(){
  try {
    const saved = localStorage.getItem('efk-theme');
    if(saved === 'light'){document.body.classList.add('light');document.documentElement.classList.add('light');}
  } catch(e){}
})();

