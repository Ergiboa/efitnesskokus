// ══════════════════════════════════════════════════════
//  EXERCISE LIBRARY (Coach)
// ══════════════════════════════════════════════════════
function renderExList() {
  const q = (document.getElementById('ex-search')?.value||'').toLowerCase();
  const body = document.getElementById('ex-list-body');
  const cnt  = document.getElementById('ex-count');
  const filtered = EX_LIBRARY.filter(e =>
    e.name.toLowerCase().includes(q) ||
    (e.muscles||[]).join(' ').toLowerCase().includes(q)
  );
  cnt.textContent = EX_LIBRARY.length;
  body.innerHTML = filtered.map(e => `
    <div class="ex-item ${e.id===currentExId?'active':''}" onclick="selectExercise('${e.id}')">
      ${e.gif_url
        ? `<img class="ex-thumb" src="${e.gif_url}" alt="${e.name}" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="ex-thumb-placeholder">💪</div>`}
      <div class="ex-item-info">
        <div class="ex-item-name">${e.name}</div>
        <div class="ex-item-muscles">${(e.muscles||[]).join(' · ')}</div>
      </div>
      ${e.source==='builtin'?`<span style="font-size:9px;color:var(--muted2);flex-shrink:0">global</span>`:''}
    </div>
  `).join('') || `<div style="padding:14px;color:var(--muted2);font-size:11px;text-align:center">Sin resultados</div>`;
}

window.selectExercise = (id) => {
  currentExId = id;
  renderExList();
  renderExEditor();
};

function renderExEditor() {
  const area = document.getElementById('ex-editor-area');
  if (!currentExId) { area.innerHTML = `<div class="ex-editor"><div style="padding:14px;display:flex;align-items:center;justify-content:center;min-height:200px;color:var(--muted2);font-family:'Syne',sans-serif">Selecciona un ejercicio</div></div>`; return; }
  const ex = EX_LIBRARY.find(e=>e.id===currentExId);
  if (!ex) return;
  const isCoach = currentProfile.role === 'coach';
  const isEditable = isCoach && ex.source !== 'builtin';
  const canEditTips = isCoach; // Tips always editable regardless of source
  const muscleChips = MUSCLES_LIST.map(m => `<span class="ex-mchip ${(ex.muscles||[]).includes(m)?'on':''}" ${canEditTips?`onclick="toggleExMuscle('${ex.id}','${m}')"`:'style="cursor:default"'}>${m}</span>`).join('');

  area.innerHTML = `<div class="ex-editor">
    <div style="padding:10px 13px;background:var(--card2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;flex:1">${ex.name}</span>
      ${isEditable?`<button class="btn danger sm" onclick="deleteExercise('${ex.id}')">🗑</button>`:''}
    </div>
    <div class="ex-gif-wrap">
      ${ex.gif_url
        ? `<img src="${ex.gif_url}" alt="${ex.name}" style="width:100%;max-height:320px;object-fit:contain" onerror="this.outerHTML='<div class=\\'ex-gif-placeholder\\'><span style=\\'font-size:40px\\'>🏋️</span><span>GIF no disponible</span></div>'">`
        : `<div class="ex-gif-placeholder"><span style="font-size:40px">🏋️</span><span>Sin GIF asignado</span></div>`}
    </div>
    <div class="ex-editor-content">
      <div class="ex-field">
        <label>Nombre</label>
        <input class="ex-input" type="text" value="${ex.name}" ${isEditable?`onchange="updateExField('${ex.id}','name',this.value)"`:' readonly style="opacity:.7"'}>
      </div>
      <div class="ex-field">
        <label>URL del GIF / imagen</label>
        <input class="ex-input" type="url" value="${ex.gif_url||''}" ${isEditable?`onchange="updateExField('${ex.id}','gif_url',this.value)" placeholder="https://...gif"`:' readonly style="opacity:.7"'}>
        ${isCoach && isEditable ? `
        <div style="margin-top:8px">
          <label style="font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted2);display:block;margin-bottom:5px">Buscar en ExerciseDB (requiere RapidAPI key)</label>
          <div class="exercisedb-row">
            <input class="exercisedb-input" type="text" id="edb-search-inp" placeholder="Nombre del ejercicio en inglés..." onkeydown="if(event.key==='Enter')searchExerciseDB()">
            <button class="btn ghost sm" onclick="searchExerciseDB()">Buscar</button>
          </div>
          <div class="exercisedb-results" id="edb-results"></div>
        </div>` : ''}
      </div>
      <div class="ex-field">
        <label>Músculos</label>
        <div class="ex-muscle-grid">${muscleChips}</div>
      </div>
      <div class="ex-field">
        <label>Consejos técnicos</label>
        <textarea class="ex-input" style="min-height:70px;resize:vertical" ${canEditTips?`onchange="updateExField('${ex.id}','tips',this.value)"`:' readonly style="opacity:.7"'}>${ex.tips||''}</textarea>
      </div>
      ${(isEditable||canEditTips)?`<div class="ex-actions"><button class="btn" onclick="saveExercise('${ex.id}')">💾 Guardar</button></div>`:''}
    </div>
  </div>`;
}

window.newExercise = () => {
  const id = 'ex-' + Date.now();
  const coachId = currentUser.id;
  EX_LIBRARY.unshift({ id, coach_id: coachId, name: 'Nuevo ejercicio', gif_url: '', muscles: [], tips: '', source: 'custom' });
  currentExId = id;
  renderExList();
  renderExEditor();
};

window.updateExField = (id, field, val) => {
  const ex = EX_LIBRARY.find(e => e.id === id);
  if (ex) { ex[field] = val; if (field === 'gif_url') renderExEditor(); }
};

window.toggleExMuscle = (id, m) => {
  const ex = EX_LIBRARY.find(e => e.id === id);
  if (!ex) return;
  const i = (ex.muscles||[]).indexOf(m);
  i >= 0 ? ex.muscles.splice(i,1) : (ex.muscles = ex.muscles||[], ex.muscles.push(m));
  const chips = document.querySelector('.ex-muscle-grid');
  if (chips) chips.innerHTML = MUSCLES_LIST.map(mu=>`<span class="ex-mchip ${(ex.muscles||[]).includes(mu)?'on':''}" onclick="toggleExMuscle('${id}','${mu}')">${mu}</span>`).join('');
};

window.saveExercise = async (id) => {
  const ex = EX_LIBRARY.find(e => e.id === id);
  if (!ex) return;
  const { error } = await sb.from('exercises_library').upsert({
    id: ex.id, coach_id: currentUser.id, name: ex.name, gif_url: ex.gif_url,
    muscles: ex.muscles, tips: ex.tips, source: 'custom'
  }, { onConflict: 'id' });
  if (!error) { flash(); toast('Ejercicio guardado ✓'); renderExList(); }
};

window.deleteExercise = async (id) => {
  if (!confirm('¿Eliminar ejercicio?')) return;
  await sb.from('exercises_library').delete().eq('id', id);
  EX_LIBRARY = EX_LIBRARY.filter(e => e.id !== id);
  currentExId = null;
  renderExList(); renderExEditor();
  toast('Eliminado');
};

window.searchExerciseDB = async () => {
  const q = document.getElementById('edb-search-inp')?.value?.trim();
  const resultsEl = document.getElementById('edb-results');
  if (!q || !resultsEl) return;
  if (!RAPIDAPI_KEY) {
    resultsEl.innerHTML = `<div style="color:var(--accent3);font-size:10px;padding:6px">Añade tu RAPIDAPI_KEY en la configuración del app para usar ExerciseDB.</div>`;
    return;
  }
  resultsEl.innerHTML = `<div style="color:var(--muted2);font-size:10px;padding:6px">Buscando...</div>`;
  try {
    const res = await fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(q.toLowerCase())}?limit=9`, {
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' }
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      resultsEl.innerHTML = `<div style="color:var(--muted2);font-size:10px;padding:6px">Sin resultados</div>`;
      return;
    }
    resultsEl.innerHTML = data.map(ex => `
      <div class="exercisedb-item" onclick="applyExerciseDBGif('${ex.gifUrl}','${ex.name}')">
        <img src="${ex.gifUrl}" alt="${ex.name}" loading="lazy">
        <span>${ex.name}</span>
      </div>
    `).join('');
  } catch(e) {
    resultsEl.innerHTML = `<div style="color:var(--red);font-size:10px;padding:6px">Error al conectar con ExerciseDB</div>`;
  }
};

window.applyExerciseDBGif = (gifUrl, exName) => {
  const ex = EX_LIBRARY.find(e => e.id === currentExId);
  if (!ex) return;
  ex.gif_url = gifUrl;
  renderExEditor();
  toast(`GIF aplicado de ExerciseDB ✓`);
};

// GIF Modal
window.openGifModal = (exName) => {
  const ex = EX_LIBRARY.find(e => e.name.toLowerCase() === exName.toLowerCase()) ||
             EX_LIBRARY.find(e => exName.toLowerCase().includes(e.name.toLowerCase().split(' ')[0]));
  document.getElementById('gif-name').textContent = exName;
  document.getElementById('gif-tags').innerHTML = '';
  document.getElementById('gif-tips').textContent = '';
  if (ex) {
    document.getElementById('gif-tags').innerHTML = (ex.muscles||[]).map(m=>`<span class="gif-tag">${m}</span>`).join('');
    document.getElementById('gif-tips').innerHTML = ex.tips ? `<strong>Técnica:</strong> ${ex.tips}` : '';
    document.getElementById('gif-visual-wrap').innerHTML = ex.gif_url
      ? `<img src="${ex.gif_url}" alt="${exName}" style="width:100%;max-height:280px;object-fit:contain"
          onerror="this.outerHTML='<div class=\\'gif-visual-ph\\'><span style=\\'font-size:40px\\'>🏋️</span><span>GIF no disponible</span></div>'">`
      : `<div class="gif-visual-ph"><span style="font-size:40px">🏋️</span><span style="text-align:center;padding:10px">Sin GIF.<br>Busca "${exName}" en YouTube.</span></div>`;
  } else {
    document.getElementById('gif-visual-wrap').innerHTML = `<div class="gif-visual-ph"><span style="font-size:40px">🏋️</span><span style="text-align:center;padding:10px">Ejercicio personalizado.<br>Busca "${exName}" en YouTube.</span></div>`;
  }
  document.getElementById('gif-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeGifModal = () => {
  document.getElementById('gif-modal').classList.remove('open');
  document.body.style.overflow = '';
};

