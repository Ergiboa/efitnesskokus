// ══════════════════════════════════════════════════════
//  AJUSTES — API Keys, Client Management, AI Prices
// ══════════════════════════════════════════════════════
// Cache: matches real app_settings columns
let _apiKeys = { anthropic_key: '', last_price_update: null };

async function loadApiKeys() {
  if (!isCoachView()) return;
  try {
    const { data } = await sb.from('app_settings')
      .select('anthropic_key, rapidapi_key, last_price_update')
      .eq('user_id', currentUser.id).maybeSingle();
    if (data) {
      _apiKeys.anthropic_key    = data.anthropic_key || '';
      _apiKeys.last_price_update = data.last_price_update || null;
    }
    _syncKeyStatuses();
    _checkAutoPriceUpdate();
  } catch(e) { console.warn('loadApiKeys:', e); }
}

function _syncKeyStatuses() {
  _syncOneKey('claude-key-status', 'inp-claude-key', 'btn-edit-claude', 'btn-del-claude', _apiKeys.anthropic_key);
  const lastEl = document.getElementById('price-update-status');
  if (lastEl && _apiKeys.last_price_update) {
    const d = new Date(_apiKeys.last_price_update);
    lastEl.textContent = 'Última: ' + d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  }
}

function _syncOneKey(statusId, inputId, editBtnId, delBtnId, val) {
  const statusEl = document.getElementById(statusId);
  const inp      = document.getElementById(inputId);
  const editBtn  = document.getElementById(editBtnId);
  const delBtn   = document.getElementById(delBtnId);
  if (val) {
    if (statusEl) { statusEl.textContent = '✅ Guardada'; statusEl.style.color = 'var(--accent)'; }
    // Show masked value in input (read-only until "Modificar" clicked)
    if (inp) { inp.value = val; inp.readOnly = true; inp.style.color = 'var(--muted2)'; inp.style.letterSpacing = '2px'; }
    if (editBtn) editBtn.style.display = 'inline-flex';
    if (delBtn)  delBtn.style.display  = 'inline-flex';
  } else {
    if (statusEl) { statusEl.textContent = '⚠ No configurada'; statusEl.style.color = 'var(--muted2)'; }
    if (inp) { inp.value = ''; inp.readOnly = false; inp.style.color = ''; inp.style.letterSpacing = ''; }
    if (editBtn) editBtn.style.display = 'none';
    if (delBtn)  delBtn.style.display  = 'none';
  }
}

window.editApiKey = (inputId, keyName) => {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.readOnly = false;
  inp.style.color = '';
  inp.style.letterSpacing = '';
  inp.type = 'text';
  inp.select();
  inp.focus();
};

window.deleteApiKey = async (keyName, statusId, editBtnId, inputId) => {
  if (!confirm('¿Seguro que quieres borrar esta clave?')) return;
  _apiKeys[keyName] = '';
  try {
    const uid = currentUser.id;
    const { data: existing } = await sb.from('app_settings').select('id').eq('user_id', uid).maybeSingle();
    if (existing?.id) {
      const { error } = await sb.from('app_settings').update({ [keyName]: null }).eq('id', existing.id);
      if (error) throw error;
    }
    _syncKeyStatuses();
    toast('🗑 Clave eliminada');
  } catch(e) { toast('Error: ' + e.message); }
};

// keyName: 'anthropic_key'
window.saveApiKey = async (keyName, inputId, statusId) => {
  if (!isCoachView()) return;
  const val = document.getElementById(inputId)?.value?.trim();
  if (!val) { toast('⚠ Introduce la clave primero'); return; }
  _apiKeys[keyName] = val;
  try {
    await _saveApiKeys();
    _syncKeyStatuses();
    toast('🔑 Clave guardada');
  } catch(e) {
    toast('Error al guardar: ' + e.message);
  }
};

// Save ALL keys in one operation using select-then-update/insert to avoid duplicates
async function _saveApiKeys() {
  const uid = currentUser.id;
  // Check if row exists
  const { data: existing } = await sb.from('app_settings').select('id').eq('user_id', uid).maybeSingle();
  const payload = {};
  if (_apiKeys.anthropic_key) payload.anthropic_key = _apiKeys.anthropic_key;
  let err;
  if (existing?.id) {
    // UPDATE existing row
    ({ error: err } = await sb.from('app_settings').update(payload).eq('id', existing.id));
  } else {
    // INSERT new row
    ({ error: err } = await sb.from('app_settings').insert({ user_id: uid, ...payload }));
  }
  if (err) throw err;
}

window.toggleKeyVisibility = (inputId) => {
  const el = document.getElementById(inputId);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
};

// ── Crear cliente via Edge Function create-client ──
window.createClientAccount = async () => {
  if (!isCoachView()) return;
  const name  = document.getElementById('new-client-name')?.value?.trim();
  const email = document.getElementById('new-client-email')?.value?.trim();
  const pass  = document.getElementById('new-client-pass')?.value?.trim();
  const log   = document.getElementById('create-client-log');

  if (!name || !email || !pass) { log.textContent = '⚠ Rellena todos los campos'; log.style.color='var(--orange)'; return; }
  if (pass.length < 6)          { log.textContent = '⚠ Contraseña mínimo 6 caracteres'; log.style.color='var(--orange)'; return; }

  log.textContent = '⏳ Creando cuenta...'; log.style.color = 'var(--muted2)';

  try {
    const { data: { session: _sess2 } } = await sb.auth.getSession();
    const _token2 = _sess2?.access_token;
    if (!_token2) throw new Error('No hay sesión activa. Recarga la página.');
    const _res2 = await fetch(`${SUPABASE_URL}/functions/v1/create-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_token2}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ email, password: pass, full_name: name })
    });
    const _resText2 = await _res2.text();
    let result;
    try { result = JSON.parse(_resText2); } catch { throw new Error(`Respuesta inválida: ${_resText2.slice(0,200)}`); }
    if (!_res2.ok || result?.error) throw new Error(result?.error || `HTTP ${_res2.status}: ${_resText2.slice(0,200)}`);

    log.innerHTML = `✅ Cliente creado: <strong>${name}</strong> · ${email} · pass: <code>${pass}</code>`;
    log.style.color = 'var(--accent)';
    document.getElementById('new-client-name').value = '';
    document.getElementById('new-client-email').value = '';
    document.getElementById('new-client-pass').value = '';
    await loadClients();
    toast(`✅ Cliente "${name}" creado`);
  } catch(e) {
    log.textContent = '❌ Error: ' + e.message;
    log.style.color = 'var(--red)';
  }
};

// ── Auto price update check: once per day ──
function _checkAutoPriceUpdate() {
  if (!isCoachView()) return;
  if (!_apiKeys.anthropic_key) return;
  const last = _apiKeys.last_price_update;
  if (!last) { runAiPriceUpdate(); return; }
  const hoursSince = (Date.now() - new Date(last).getTime()) / 3600000;
  if (hoursSince >= 24) runAiPriceUpdate();
}

// ── AI price update using Claude ──
window.runAiPriceUpdate = async () => {
  if (!isCoachView()) { toast('Solo el coach puede actualizar precios'); return; }
  const claudeKey = _apiKeys.anthropic_key;
  if (!claudeKey) {
    toast('⚠ Configura la Claude API Key en Ajustes → API Keys');
    navItemClick(document.querySelector('[data-tab="ajustes"]'));
    return;
  }

  const btn      = document.getElementById('btn-ai-prices');
  const progress = document.getElementById('ai-price-progress');
  const logEl    = document.getElementById('ai-price-log');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Actualizando...'; }
  if (logEl) { logEl.style.display = 'block'; logEl.textContent = ''; }

  const products = Object.keys(PRICES).length > 0
    ? Object.keys(PRICES)
    : Object.keys(DB);

  const log = (msg) => {
    if (logEl) { logEl.textContent += msg + '\n'; logEl.scrollTop = logEl.scrollHeight; }
    if (progress) progress.textContent = msg;
  };

  log('🤖 Llamando a Edge Function → Claude...');

  try {
    const productList = products;

    // Call edge function with full error detail
    const { data: { session: _sess } } = await sb.auth.getSession();
    const _token = _sess?.access_token;
    if (!_token) throw new Error('No hay sesión activa. Recarga la página.');
    const _res = await fetch(`${SUPABASE_URL}/functions/v1/ai-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_token}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ products: productList })
    });
    const _resText = await _res.text();
    log(`📡 HTTP ${_res.status} · ${_resText.slice(0,300)}`);
    let data;
    try { data = JSON.parse(_resText); } catch { throw new Error(`Respuesta inválida (${_res.status}): ${_resText.slice(0,300)}`); }
    if (!_res.ok) throw new Error(data?.error || data?.detail || data?.message || `HTTP ${_res.status}: ${_resText.slice(0,300)}`);
    if (data?.error) throw new Error(data.error);

    // Edge function returns raw Anthropic response: { content: [{type:'text', text:'...'}] }
    const rawText = data.content?.[0]?.text || '';
    if (!rawText) throw new Error('Respuesta vacía de Claude');
    log('✓ Respuesta recibida. Procesando...');

    let prices;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      prices = JSON.parse(cleaned);
    } catch(pe) {
      throw new Error('Claude no devolvió JSON válido: ' + rawText.slice(0, 200));
    }
    if (!prices || typeof prices !== 'object') throw new Error('JSON inválido en respuesta');

    let updated = 0;
    for (const [prod, vals] of Object.entries(prices)) {
      if (!PRICES[prod]) PRICES[prod] = {};
      if (vals.merc      != null) PRICES[prod].merc      = vals.merc;
      if (vals.lidl      != null) PRICES[prod].lidl      = vals.lidl;
      if (vals.carrefour != null) PRICES[prod].carrefour = vals.carrefour;
      if (vals.dia       != null) PRICES[prod].dia       = vals.dia;
      if (vals.eroski    != null) PRICES[prod].eroski    = vals.eroski;
      if (vals.base      != null) PRICES[prod].base      = vals.base;
      updated++;
    }
    log(`✅ ${updated} productos actualizados`);

    // Save to server (shared with all clients)
    const coachId = currentUser.id;
    const rows = Object.entries(PRICES).map(([product, v]) => ({
      coach_id: coachId, product,
      merc: v.merc||null, lidl: v.lidl||null,
      carrefour: v.carrefour||null, dia: v.dia||null, eroski: v.eroski||null,
      base_unit: v.base||null
    }));
    if (rows.length > 0) {
      const { error: pErr } = await sb.from('prices').upsert(rows, { onConflict: 'coach_id,product' });
      if (pErr) log('⚠ Error guardando: ' + pErr.message);
      else log('💾 Precios guardados en Supabase (visible a todos los clientes)');
    }

    // Save last update timestamp
    _apiKeys.last_price_update = new Date().toISOString();
    try {
      const uid = currentUser.id;
      const { data: ex2 } = await sb.from('app_settings').select('id').eq('user_id', uid).maybeSingle();
      if (ex2?.id) await sb.from('app_settings').update({ last_price_update: _apiKeys.last_price_update }).eq('id', ex2.id);
    } catch(e) { console.warn('last_price_update save:', e); }

    _syncKeyStatuses();
    renderCompra();
    toast('💰 Precios actualizados con IA ✓');

  } catch(e) {
    log('❌ Error: ' + e.message);
    toast('Error actualizando precios: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🤖 Actualizar precios ahora'; }
    if (progress) setTimeout(() => { progress.textContent = ''; }, 4000);
  }
};

