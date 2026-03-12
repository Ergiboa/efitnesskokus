// ══════════════════════════════════════════════════════
//  BOOTSTRAP
// ══════════════════════════════════════════════════════
async function boot() {
  try{
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    currentUser = session.user;

    setLoadText('Cargando perfil...');
    let { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();

    // Si no hay perfil, intentar crearlo (puede pasar si el trigger falla)
    if (!profile) {
      const emailPrefix = (currentUser.email||'').split('@')[0] || 'usuario';
      const { data: newProfile } = await sb.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || emailPrefix,
        role: 'client',
        username: emailPrefix,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' }).select().maybeSingle();

      if (!newProfile) {
        // Aun así no hay perfil: cerrar sesión limpia para evitar bucle
        await sb.auth.signOut();
        window.location.href = 'login.html';
        return;
      }
      profile = newProfile;
    }
    currentProfile = profile;

    const isCoach = profile.role === 'coach';
    document.getElementById('sb-username').textContent = profile.full_name || profile.email;
    document.getElementById('sb-role').textContent     = isCoach ? '👨‍💼 Entrenador' : '🏋️ Cliente';
    document.getElementById('sb-avatar').textContent   = (profile.full_name||profile.email||'?')[0].toUpperCase();
    // Restore saved avatar
    const _savedAvatar = localStorage.getItem('nc_avatar_'+currentUser.id);
    if(_savedAvatar){
      const av=document.getElementById('sb-avatar');
      if(av){av.style.backgroundImage=`url(${_savedAvatar})`;av.style.backgroundSize='cover';av.style.backgroundPosition='center';av.textContent='';}
    }

    if (isCoach) {
      document.getElementById('client-selector').style.display = 'block';
      // GIF lib shown in boot finally block
      setLoadText('Cargando clientes...');
      await loadClients();
    } else {
      currentClientId = currentUser.id;
      setLoadText('Cargando datos...');
      await loadClientData(currentUser.id);
      document.getElementById('diet-locked-notice').style.display = 'flex';
      document.getElementById('diet-edit-btns').style.display = 'none';
      document.getElementById('new-routine-btn').style.display = 'none';
      loadPublishedFeedback();
      // Auto-select today for client
      const todayLabel = getTodayLabel();
      if (todayLabel && SCHEDULE[todayLabel]) {
        currentDay = todayLabel;
        currentRtnId = SCHEDULE[todayLabel] || null;
      }
    }

    // Non-critical loads
    setLoadText('Finalizando...');
    await Promise.allSettled([loadExLibrary()]);
    await checkPrices();

  }catch(err){
    console.error('Boot error:', err);
    // Si el error es de sesión/auth, salir limpio para evitar bucle
    if(err.message?.includes('JWT') || err.message?.includes('session') || err.message?.includes('auth')){
      await sb.auth.signOut();
      window.location.href = 'login.html';
      return;
    }
    toast('⚠ Error al iniciar: '+err.message);
  }finally{
    // Siempre quita la pantalla de carga
    document.getElementById('app-loading').classList.add('hidden');
    // GIF Library only visible to coaches
    const gifNav = document.getElementById('nav-giflib');
    const ajNav  = document.getElementById('nav-ajustes');
    const isCoach = currentProfile?.role === 'coach';
    if(gifNav) gifNav.style.display = isCoach ? 'flex' : 'none';
    if(ajNav)  ajNav.style.display  = isCoach ? 'flex' : 'none';
    if(isCoach) loadApiKeys();
    renderResumen();
  }
}

function setLoadText(t) { document.getElementById('load-text').textContent = t; }

// ══════════════════════════════════════════════════════
//  DATA LOAD
// ══════════════════════════════════════════════════════
async function loadClients() {
  try{
    const { data, error } = await sb.from('profiles').select('id,full_name,email').eq('coach_id', currentUser.id).eq('role','client');
    if(error) throw error;
    allClients = data || [];
    const sel = document.getElementById('client-select');
    sel.innerHTML = '';
    // Coach themselves as first option
    const selfOpt = document.createElement('option');
    selfOpt.value = currentUser.id;
    selfOpt.textContent = '👤 Yo (entrenador)';
    sel.appendChild(selfOpt);
    allClients.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.full_name || c.email;
      sel.appendChild(o);
    });
    await loadCoachData();
    // Auto-select first client if exists, otherwise self
    if (allClients.length > 0) {
      sel.value = allClients[0].id;
      await switchClient(allClients[0].id);
    } else {
      sel.value = currentUser.id;
      currentClientId = currentUser.id;
    }
  }catch(e){
    console.error('loadClients error:', e.message);
    toast('Error cargando clientes: '+e.message);
  }
}

async function loadCoachData() {
  const cid = currentUser.id;
  const [dbRes, pricesRes] = await Promise.all([
    sb.from('nutrition_db').select('*').eq('coach_id', cid),
    sb.from('prices').select('*').eq('coach_id', cid),
  ]);
  const dbFromServer = {};
  (dbRes.data||[]).forEach(r => dbFromServer[r.product] = {base:r.base,kcal:r.kcal,prot:r.prot,carb:r.carb,fat:r.fat,fib:r.fib});
  if(Object.keys(dbFromServer).length > 0) DB = dbFromServer;
  else {
    const defRows = Object.entries(DB).map(([product,v]) => ({coach_id:currentUser.id,product,...v}));
    sb.from('nutrition_db').upsert(defRows, {onConflict:'coach_id,product'});
  }

  const pricesFromServer = {};
  (pricesRes.data||[]).forEach(r => pricesFromServer[r.product] = {merc:r.merc,lidl:r.lidl,carrefour:r.carrefour??null,dia:r.dia??null,eroski:r.eroski??null,base:r.base_unit});
  if(Object.keys(pricesFromServer).length > 0) PRICES = pricesFromServer;
  else {
    const priceRows = Object.entries(PRICES).map(([product,v]) => ({coach_id:currentUser.id,product,merc:v.merc??null,lidl:v.lidl??null,carrefour:v.carrefour??null,dia:v.dia??null,eroski:v.eroski??null,base_unit:v.base}));
    try{ await sb.from('prices').upsert(priceRows, {onConflict:'coach_id,product'}); }catch(e){ console.warn('prices upsert:',e); }
  }
  RECIPES = JSON.parse(localStorage.getItem('nc_recipes') || '[]');
  if (RECIPES.length === 0) RECIPES = getDefaultRecipes();
}

async function loadClientData(clientId) {
  currentClientId = clientId;
  const coachId = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;

  const [dietRes, routinesRes, schedRes, logRes, stockRes, notesRes, allLogsRes] = await Promise.all([
    sb.from('client_diets').select('*').eq('client_id', clientId).maybeSingle(),
    sb.from('routines').select('*').eq('client_id', clientId).order('name'),
    sb.from('week_schedules').select('*').eq('client_id', clientId).maybeSingle(),
    sb.from('training_logs').select('*').eq('client_id', clientId).eq('week_key', THIS_WEEK),
    sb.from('client_stock').select('*').eq('client_id', clientId).maybeSingle(),
    sb.from('client_notes').select('*').eq('client_id', clientId).maybeSingle(),
    sb.from('training_logs').select('week_key,routine_id,exercises,completed').eq('client_id', clientId).order('week_key', {ascending: true}).limit(500),
  ]);

  DIET     = dietRes.data?.diet_json || getDefaultDiet();
  // Extraer notas de comida si están guardadas dentro del diet_json
  if (DIET._mealNotes) { MEAL_NOTES = DIET._mealNotes; delete DIET._mealNotes; }
  else { MEAL_NOTES = {}; }
  // Normalizar: asegurar que todos los días tengan todas las comidas
  Object.keys(DIET).forEach(day=>{MEALS_ORDER.forEach(m=>{if(!DIET[day][m])DIET[day][m]=[];});});
  ROUTINES = (routinesRes.data||[]).map(r => ({...r, exercises: r.exercises || [], muscles: r.muscles || []}));
  console.log('[DEBUG] Routines loaded from DB:', ROUTINES.length, 'role:', currentProfile.role);
  // Parse schedule — may contain embedded snapshots: {LUN: {rid, snapshot}, ...} or legacy strings
  const rawSched = schedRes.data?.schedule || {};
  SCHEDULE = {};
  const _snapshotRoutines = {}; // id -> routine, rebuilt from snapshots
  Object.entries(rawSched).forEach(([day, val]) => {
    if (typeof val === 'string') {
      SCHEDULE[day] = val; // legacy: plain routine id
    } else if (val && typeof val === 'object' && val.rid) {
      SCHEDULE[day] = val.rid; // new format: extract rid
      if (val.snapshot) _snapshotRoutines[val.snapshot.id] = { ...val.snapshot, exercises: val.snapshot.exercises||[], muscles: val.snapshot.muscles||[] };
    }
  });
  // If client has 0 routines from DB, rebuild from snapshots embedded in schedule
  if (ROUTINES.length === 0 && Object.keys(_snapshotRoutines).length > 0) {
    ROUTINES = Object.values(_snapshotRoutines);
    console.log('[DEBUG] Rebuilt', ROUTINES.length, 'routines from schedule snapshots');
  }
  console.log('[DEBUG] Schedule:', Object.keys(SCHEDULE).length, 'days. Routines:', ROUTINES.length);
  STOCK    = stockRes.data?.stock_json || {};
  personalNotes   = notesRes.data?.personal_notes || '';
  coachFeedback   = notesRes.data?.coach_feedback  || '';
  publishedFeedback = notesRes.data?.coach_feedback || '';
  // Parsear notas estructuradas del coach (guardadas como JSON en personal_notes cuando es el coach)
  if (isCoachView()) {
    try {
      const parsed = JSON.parse(personalNotes);
      if (parsed && typeof parsed === 'object' && ('quickRules' in parsed || 'supplements' in parsed || 'personal' in parsed)) {
        coachClientNotes = {
          quickRules: parsed.quickRules || DEFAULT_QUICK_RULES,
          supplements: parsed.supplements || DEFAULT_SUPPLEMENTS,
          personal: parsed.personal||''
        };
        personalNotes = coachClientNotes.personal;
      } else { coachClientNotes = { quickRules: DEFAULT_QUICK_RULES, supplements: DEFAULT_SUPPLEMENTS, personal: personalNotes }; }
    } catch(e) { coachClientNotes = { quickRules: DEFAULT_QUICK_RULES, supplements: DEFAULT_SUPPLEMENTS, personal: personalNotes }; }
  }
  publishedFeedback = notesRes.data?.coach_feedback || '';

  TRN_LOG = {};
  TRN_LOG_HISTORY = {};
  if (!TRN_LOG[THIS_WEEK]) TRN_LOG[THIS_WEEK] = {};
  (logRes.data||[]).forEach(row => {
    TRN_LOG[THIS_WEEK][row.routine_id] = { done: row.completed, exercises: row.exercises || {} };
  });
  // Build full history for progress charts
  (allLogsRes.data||[]).forEach(row => {
    if (!TRN_LOG_HISTORY[row.week_key]) TRN_LOG_HISTORY[row.week_key] = {};
    TRN_LOG_HISTORY[row.week_key][row.routine_id] = { done: row.completed, exercises: row.exercises || {} };
  });

  DB = getDefaultDB();
  PRICES = getDefaultPrices();
  const coachId2 = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;
  if (coachId2) {
    const [dbRes2, pricesRes2] = await Promise.all([
      sb.from('nutrition_db').select('*').eq('coach_id', coachId2),
      sb.from('prices').select('*').eq('coach_id', coachId2),
    ]);
    if ((dbRes2.data||[]).length > 0)
      (dbRes2.data).forEach(r => DB[r.product] = {base:r.base,kcal:r.kcal,prot:r.prot,carb:r.carb,fat:r.fat,fib:r.fib});
    if ((pricesRes2.data||[]).length > 0)
      (pricesRes2.data).forEach(r => PRICES[r.product] = {merc:r.merc,lidl:r.lidl,carrefour:r.carrefour??null,dia:r.dia??null,eroski:r.eroski??null,base:r.base_unit});
  }

  // Load coach's recipes for client view
  try {
    const coachIdForRecipes = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;
    if (coachIdForRecipes) {
      const { data: recSet } = await sb.from('app_settings')
        .select('recipes_json').eq('user_id', coachIdForRecipes).maybeSingle();
      if (recSet?.recipes_json && recSet.recipes_json.length > 0) {
        RECIPES = recSet.recipes_json;
      } else {
        RECIPES = getDefaultRecipes();
      }
    }
  } catch(e) {
    RECIPES = getDefaultRecipes();
  }

  if (ROUTINES.length === 0 && currentProfile.role === 'coach') {
    ROUTINES = getDefaultRoutines();
    await saveRoutinesToServer();
  }

  const clientName = allClients.find(c=>c.id===clientId)?.full_name ||
    (currentProfile.role==='client' ? currentProfile.full_name : '—');
  document.querySelector('.sb-brand small').textContent = clientName;
  document.getElementById('mob-client-label').textContent = clientName;
  CHECKED = {};
}

async function switchClient(clientId) {
  if (!clientId) return;
  stopChatPolling();
  currentClientId = clientId;
  CHECKED = {}; // reset lista compra al cambiar cliente
  await loadClientData(clientId);
  const selectedText = document.getElementById('client-select').selectedOptions[0]?.text || '';
  const isSelf = clientId === currentUser.id;
  document.getElementById('sb-username').textContent = isSelf
    ? (currentProfile.full_name || currentProfile.email || 'Entrenador')
    : (currentProfile.full_name||'') + ' → ' + selectedText;
  // Re-renderizar TODOS los paneles del cliente
  renderResumen();
  renderDiet();
  renderTrnSidebar(); renderTrnWeekBar(); renderTrnStats();
  if (currentRtnId) renderTrnEditor();
  renderRecipes();
  renderStockSidebar();
  renderCompra();
  loadProgressFromServer().then(()=>renderProgress());
  renderVitamins();
  renderNotasPanel();
  // Restart chat if panel is open
  const chatPanel = document.getElementById('panel-chat');
  if(chatPanel?.classList.contains('active')){
    loadChat().then(startChatPolling);
  } else {
    if(typeof checkUnreadForClient === 'function') checkUnreadForClient(clientId);
  }
  toast('✓ ' + (isSelf ? 'Viendo tus datos' : selectedText));
}

async function loadExLibrary() {
  try{
    const coachId = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;
    let query = sb.from('exercises_library').select('*');
    if (coachId) {
      query = query.or(`coach_id.is.null,coach_id.eq.${coachId}`);
    } else {
      query = query.is('coach_id', null);
    }
    const { data, error } = await query.order('name');
    if(error) throw error;
    EX_LIBRARY = data || [];
  }catch(e){
    console.warn('exercises_library no disponible:', e.message);
    EX_LIBRARY = [];
  }
}

async function loadPublishedFeedback() {
  const { data } = await sb.from('client_notes').select('coach_feedback').eq('client_id', currentUser.id).maybeSingle();
  publishedFeedback = data?.coach_feedback || '';
  coachFeedback = publishedFeedback;
  const el = document.getElementById('published-feedback-text');
  if (el) el.textContent = publishedFeedback || 'Tu entrenador aún no ha dejado ningún mensaje.';
}

// ══════════════════════════════════════════════════════
//  SAVE TO SERVER
// ══════════════════════════════════════════════════════
let autoSaveTimer;
function flash() {
  const d = document.getElementById('autosave-dot');
  d.classList.add('saved');
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => d.classList.remove('saved'), 1400);
}

async function saveDietToServer() {
  if (!currentClientId) return;
  const coachId = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;
  const dietWithNotes = { ...DIET, _mealNotes: MEAL_NOTES };
  await sb.from('client_diets').upsert({
    client_id: currentClientId, coach_id: coachId,
    diet_json: dietWithNotes, updated_by: currentUser.id, updated_at: new Date().toISOString()
  }, { onConflict: 'client_id' });
  flash(); toast('Dieta guardada ✓');
}

async function saveDBToServer() {
  const coachId = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;
  if (!coachId) return;
  const rows = Object.entries(DB).map(([product, v]) => ({
    coach_id: coachId, product, ...v
  }));
  for (let i = 0; i < rows.length; i += 100) {
    await sb.from('nutrition_db').upsert(rows.slice(i, i+100), { onConflict: 'coach_id,product' });
  }
  flash(); toast('DB nutricional guardada ✓');
}

async function saveRoutinesToServer() {
  if (!currentClientId) return;
  const coachId = currentProfile.role === 'coach' ? currentUser.id : currentProfile.coach_id;
  // Save routines table (coach access)
  const rows = ROUTINES.map(r => ({
    id: r.id, client_id: currentClientId, coach_id: coachId,
    name: r.name, muscles: r.muscles, exercises: r.exercises,
    updated_at: new Date().toISOString()
  }));
  if (rows.length > 0) {
    const { error: rErr } = await sb.from('routines').upsert(rows, { onConflict: 'id', ignoreDuplicates: false });
    if (rErr) console.warn('routines upsert:', rErr.message);
  }
  // Build schedule with embedded routine snapshots so client can read without routines RLS
  const schedWithSnapshots = {};
  Object.entries(SCHEDULE).forEach(([day, val]) => {
    const rid = typeof val === 'object' ? val.rid : val;
    if (!rid) return;
    const r = getRtn(rid);
    schedWithSnapshots[day] = r
      ? { rid, snapshot: { id: r.id, name: r.name, muscles: r.muscles||[], exercises: r.exercises||[] } }
      : { rid };
  });
  const { error: sErr } = await sb.from('week_schedules').upsert({
    client_id: currentClientId, coach_id: coachId,
    schedule: schedWithSnapshots, updated_at: new Date().toISOString()
  }, { onConflict: 'client_id' });
  if (sErr) console.warn('week_schedules upsert:', sErr.message);
  flash();
}

async function saveTrainingLog(day) {
  // day = 'LUN','MAR'... stored in routine_id column so each day is independent
  if (!currentClientId) return;
  const log = (TRN_LOG[THIS_WEEK]||{})[day] || {};
  const { error } = await sb.from('training_logs').upsert({
    client_id: currentClientId, routine_id: day, week_key: THIS_WEEK,
    exercises: log.exercises || {}, completed: log.done || false,
    logged_at: new Date().toISOString()
  }, { onConflict: 'client_id,routine_id,week_key' });
  if (error) {
    console.error('saveTrainingLog error:', error.message, error.code);
    if (error.code === '42501') {
      toast('⚠ Sin permisos. Ejecuta el SQL de RLS en Supabase.');
    } else {
      toast('⚠ Error guardando: ' + error.message);
    }
    return;
  }
  flash();
}

async function saveStockToServer() {
  if (!currentClientId) return;
  await sb.from('client_stock').upsert({ client_id: currentClientId, stock_json: STOCK, updated_at: new Date().toISOString() }, { onConflict: 'client_id' });
  flash();
}

async function saveNotesToServer() {
  if (!currentClientId) return;
  let notesToSave = personalNotes;
  if (isCoachView()) {
    notesToSave = JSON.stringify(coachClientNotes);
  }
  await sb.from('client_notes').upsert({
    client_id: currentClientId,
    personal_notes: notesToSave,
    updated_at: new Date().toISOString()
  }, { onConflict: 'client_id' });
  flash(); toast('Notas guardadas ✓');
}

async function saveCoachFeedback() {
  if (!currentClientId || currentProfile.role !== 'coach') return;
  const txt = document.getElementById('coach-feedback-inp')?.value || '';
  coachFeedback = txt;
  await sb.from('client_notes').upsert({
    client_id: currentClientId, coach_feedback: txt,
    updated_at: new Date().toISOString()
  }, { onConflict: 'client_id' });
  // Actualizar vista del perfil si está abierta
  const cf = document.getElementById('client-coach-feedback-view');
  if(cf) cf.textContent = txt || 'Sin feedback publicado.';
  flash(); toast('Feedback publicado al cliente 📤');
}

