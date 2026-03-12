// ══════════════════════════════════════════════════════
//  DEFAULT DATA FACTORIES
// ══════════════════════════════════════════════════════

function getDefaultDiet(){return{LUNES:{desayuno:[{p:'avena',qty:70,u:'g'},{p:'leche de soja',qty:200,u:'ml'}],comida:[{p:'patata',qty:300,u:'g'},{p:'merluza',qty:200,u:'g'},{p:'esparragos trigueros',qty:200,u:'g'}],preEntreno:[{p:'scoop proteina',qty:1,u:'ud'},{p:'crema de arroz',qty:50,u:'g'},{p:'platano pequeno',qty:1,u:'ud'}],cena:[{p:'queso fresco batido',qty:200,u:'g'},{p:'arandanos congelados',qty:50,u:'g'},{p:'frambuesas congeladas',qty:50,u:'g'},{p:'yogur natural entero',qty:1,u:'ud'},{p:'huevo entero',qty:1,u:'ud'},{p:'fresas',qty:150,u:'g'}],preCama:[{p:'scoop proteina',qty:1,u:'ud'},{p:'kiwi',qty:1,u:'ud'},{p:'almendras',qty:15,u:'g'}]},MARTES:{desayuno:[{p:'avena',qty:70,u:'g'},{p:'leche de soja',qty:200,u:'ml'}],comida:[{p:'patata',qty:300,u:'g'},{p:'pechuga',qty:200,u:'g'}],preEntreno:[{p:'scoop proteina',qty:1,u:'ud'},{p:'crema de arroz',qty:50,u:'g'},{p:'platano pequeno',qty:1,u:'ud'}],cena:[{p:'queso fresco batido',qty:200,u:'g'},{p:'arandanos congelados',qty:50,u:'g'},{p:'queso cottage light',qty:50,u:'g'},{p:'frambuesas congeladas',qty:50,u:'g'},{p:'yogur natural entero',qty:1,u:'ud'},{p:'huevo entero',qty:1,u:'ud'},{p:'tomate',qty:100,u:'g'}],preCama:[{p:'scoop proteina',qty:1,u:'ud'},{p:'kiwi',qty:1,u:'ud'},{p:'mandarina',qty:1,u:'ud'}]},MIERCOLES:{desayuno:[{p:'avena',qty:70,u:'g'},{p:'leche de soja',qty:200,u:'ml'}],comida:[{p:'arroz integral',qty:80,u:'g'},{p:'atun tarro cristal',qty:150,u:'g'},{p:'esparragos trigueros',qty:200,u:'g'},{p:'lechuga',qty:1,u:'ud'}],preEntreno:[{p:'scoop proteina',qty:1,u:'ud'},{p:'crema de arroz',qty:50,u:'g'},{p:'platano pequeno',qty:1,u:'ud'}],cena:[{p:'queso fresco batido',qty:200,u:'g'},{p:'arandanos congelados',qty:50,u:'g'},{p:'queso cottage light',qty:50,u:'g'},{p:'frambuesas congeladas',qty:50,u:'g'},{p:'yogur natural entero',qty:1,u:'ud'},{p:'huevo entero',qty:1,u:'ud'},{p:'fresas',qty:150,u:'g'}],preCama:[{p:'scoop proteina',qty:1,u:'ud'},{p:'kiwi',qty:1,u:'ud'}]},JUEVES:{desayuno:[{p:'avena',qty:70,u:'g'},{p:'leche de soja',qty:200,u:'ml'}],comida:[{p:'carne de conejo',qty:250,u:'g'},{p:'patata',qty:300,u:'g'},{p:'pimiento tricolor congelado',qty:200,u:'g'}],preEntreno:[{p:'scoop proteina',qty:1,u:'ud'},{p:'crema de arroz',qty:50,u:'g'},{p:'platano pequeno',qty:1,u:'ud'}],cena:[{p:'queso fresco batido',qty:200,u:'g'},{p:'arandanos congelados',qty:50,u:'g'},{p:'frambuesas congeladas',qty:50,u:'g'},{p:'queso cottage light',qty:50,u:'g'},{p:'yogur natural entero',qty:1,u:'ud'},{p:'huevo entero',qty:1,u:'ud'}],preCama:[{p:'scoop proteina',qty:1,u:'ud'},{p:'kiwi',qty:1,u:'ud'},{p:'mandarina',qty:1,u:'ud'}]},VIERNES:{desayuno:[{p:'avena',qty:70,u:'g'},{p:'leche de soja',qty:200,u:'ml'}],comida:[{p:'queso fresco batido',qty:200,u:'g'},{p:'huevo entero',qty:1,u:'ud'},{p:'tomate',qty:100,u:'g'}],preEntreno:[{p:'scoop proteina',qty:1,u:'ud'},{p:'crema de arroz',qty:50,u:'g'},{p:'platano pequeno',qty:1,u:'ud'}],cena:[{p:'queso fresco batido',qty:200,u:'g'},{p:'arandanos congelados',qty:50,u:'g'},{p:'frambuesas congeladas',qty:50,u:'g'},{p:'huevo entero',qty:1,u:'ud'}],preCama:[{p:'scoop proteina',qty:1,u:'ud'},{p:'kiwi',qty:1,u:'ud'}]},SABADO:{desayuno:[{p:'pan integral',qty:2,u:'ud'},{p:'leche de soja',qty:200,u:'ml'},{p:'mandarina',qty:1,u:'ud'}],comida:[{p:'arroz integral',qty:50,u:'g'},{p:'lentejas',qty:150,u:'g'},{p:'espelta',qty:60,u:'g'},{p:'brocoli',qty:200,u:'g'},{p:'mandarina',qty:1,u:'ud'}],preEntreno:[],cena:[{p:'masa pizza integral',qty:1,u:'ud'},{p:'tomate frito',qty:80,u:'g'},{p:'tiras de pollo',qty:100,u:'g'},{p:'mozarella',qty:100,u:'g'}],preCama:[]},DOMINGO:{desayuno:[{p:'pan integral',qty:2,u:'ud'},{p:'leche de soja',qty:200,u:'ml'},{p:'mandarina',qty:1,u:'ud'}],comida:[{p:'filete ternera',qty:180,u:'g'},{p:'patata',qty:300,u:'g'},{p:'espelta',qty:60,u:'g'},{p:'lechuga',qty:1,u:'ud'},{p:'mandarina',qty:1,u:'ud'}],preEntreno:[],cena:[{p:'masa pizza integral',qty:1,u:'ud'},{p:'tomate frito',qty:80,u:'g'},{p:'tiras de pollo',qty:100,u:'g'},{p:'mozarella',qty:100,u:'g'}],preCama:[]}};}
function getDefaultRecipes(){return[{id:'r1',name:'Avena con leche soja',tags:['desayuno'],notes:'Calentar la leche, añadir la avena y remover 3 minutos a fuego medio-bajo.',items:[{p:'avena',qty:70,u:'g'},{p:'leche de soja',qty:200,u:'ml'}]},{id:'r2',name:'Merluza con patata',tags:['comida'],notes:'Cocer la patata 20 min. Hacer la merluza a la plancha con sal y limón. Los espárragos al vapor 5 min.',items:[{p:'patata',qty:300,u:'g'},{p:'merluza',qty:200,u:'g'},{p:'esparragos trigueros',qty:200,u:'g'}]},{id:'r3',name:'Bowl proteico nocturno',tags:['cena'],notes:'Mezclar el queso batido con el yogur. Añadir las frutas y el huevo cocido. Consumir frío.',items:[{p:'queso fresco batido',qty:200,u:'g'},{p:'arandanos congelados',qty:50,u:'g'},{p:'frambuesas congeladas',qty:50,u:'g'},{p:'yogur natural entero',qty:1,u:'ud'},{p:'huevo entero',qty:1,u:'ud'}]},{id:'r4',name:'Pre-entreno arroz',tags:['preEntreno'],notes:'Preparar la crema de arroz con agua caliente. Mezclar la proteína con agua fría aparte. Tomar 30 min antes del entreno.',items:[{p:'scoop proteina',qty:1,u:'ud'},{p:'crema de arroz',qty:50,u:'g'},{p:'platano pequeno',qty:1,u:'ud'}]},{id:'r5',name:'Pizza integral pollo',tags:['cena'],notes:'Extender el tomate frito sobre la masa. Añadir el pollo en tiras y cubrir con mozzarella. Horno a 200°C durante 12-15 minutos.',items:[{p:'masa pizza integral',qty:1,u:'ud'},{p:'tomate frito',qty:80,u:'g'},{p:'tiras de pollo',qty:100,u:'g'},{p:'mozarella',qty:100,u:'g'}]}];}
function getDefaultRoutines(){return[{id:'dr1',name:'Pecho + Tríceps',muscles:['Pecho','Tríceps'],client_id:currentClientId,coach_id:currentUser.id,exercises:[{id:'dr1e1',name:'Press banca plano',note:'Aumentar peso si completas todas las reps',sets:[{reps:10,weight:'',time:''},{reps:10,weight:'',time:''},{reps:10,weight:'',time:''}],rpe:0},{id:'dr1e2',name:'Press inclinado mancuernas',note:'',sets:[{reps:12,weight:'',time:''},{reps:12,weight:'',time:''},{reps:12,weight:'',time:''}],rpe:0},{id:'dr1e3',name:'Fondos en paralelas',note:'',sets:[{reps:12,weight:'',time:''},{reps:12,weight:'',time:''},{reps:12,weight:'',time:''}],rpe:0},{id:'dr1e4',name:'Extensiones tríceps polea',note:'',sets:[{reps:15,weight:'',time:''},{reps:15,weight:'',time:''},{reps:15,weight:'',time:''}],rpe:0}]},{id:'dr2',name:'Pierna',muscles:['Piernas','Glúteos'],client_id:currentClientId,coach_id:currentUser.id,exercises:[{id:'dr2e1',name:'Sentadilla barra',note:'Prioridad del día',sets:[{reps:8,weight:'',time:''},{reps:8,weight:'',time:''},{reps:8,weight:'',time:''},{reps:8,weight:'',time:''}],rpe:0},{id:'dr2e2',name:'Prensa 45°',note:'',sets:[{reps:12,weight:'',time:''},{reps:12,weight:'',time:''},{reps:12,weight:'',time:''}],rpe:0},{id:'dr2e3',name:'Curl femoral tumbado',note:'',sets:[{reps:15,weight:'',time:''},{reps:15,weight:'',time:''},{reps:15,weight:'',time:''}],rpe:0},{id:'dr2e4',name:'Elevaciones gemelos',note:'Rango completo',sets:[{reps:20,weight:'',time:''},{reps:20,weight:'',time:''},{reps:20,weight:'',time:''},{reps:20,weight:'',time:''}],rpe:0}]}];}

// ══════════════════════════════════════════════════════
//  PROGRESS / MEDIDAS MODULE
// ══════════════════════════════════════════════════════
let PROGRESS = [];       // array of entries sorted by date asc
let currentChartTab = 'weight';

function prgStorageKey() { return `nc_progress_${currentClientId}`; }

function loadProgressLocal() {
  try {
    const raw = localStorage.getItem(prgStorageKey());
    PROGRESS = raw ? JSON.parse(raw) : [];
    PROGRESS.sort((a, b) => a.date.localeCompare(b.date));
  } catch(e) { PROGRESS = []; }
}

function saveProgressLocal() {
  localStorage.setItem(prgStorageKey(), JSON.stringify(PROGRESS));
}

async function saveProgressToServer() {
  if (!currentClientId) return;
  try {
    await sb.from('client_notes').upsert({
      client_id: currentClientId,
      personal_notes: document.getElementById('personal-notes')?.value || personalNotes,
      progress_json: JSON.stringify(PROGRESS),
      updated_at: new Date().toISOString()
    }, { onConflict: 'client_id' });
    flash();
  } catch(e) {
    // Table might not have progress_json column yet — fall back to localStorage only
    saveProgressLocal();
    flash();
  }
}

async function loadProgressFromServer() {
  if (!currentClientId) return;
  try {
    const { data } = await sb.from('client_notes').select('progress_json').eq('client_id', currentClientId).maybeSingle();
    if (data?.progress_json) {
      PROGRESS = JSON.parse(data.progress_json);
      PROGRESS.sort((a, b) => a.date.localeCompare(b.date));
      saveProgressLocal();
      return;
    }
  } catch(e) {}
  loadProgressLocal();
}

// Set today's date as default
function initProgressForm() {
  const d = document.getElementById('prg-date');
  if (d && !d.value) d.value = new Date().toISOString().split('T')[0];
}

window.saveProgressEntry = async () => {
  const date = document.getElementById('prg-date').value;
  if (!date) { toast('⚠ Selecciona una fecha'); return; }

  const entry = {
    id: Date.now().toString(),
    date,
    weight:   parseFloatOrNull('prg-weight'),
    fat:      parseFloatOrNull('prg-fat'),
    chest:    parseFloatOrNull('prg-chest'),
    waist:    parseFloatOrNull('prg-waist'),
    hips:     parseFloatOrNull('prg-hips'),
    arm:      parseFloatOrNull('prg-arm'),
    thigh:    parseFloatOrNull('prg-thigh'),
    calf:     parseFloatOrNull('prg-calf'),
    neck:     parseFloatOrNull('prg-neck'),
    shoulder: parseFloatOrNull('prg-shoulder'),
    notes:    document.getElementById('prg-notes').value.trim(),
  };

  if (!entry.weight && !entry.fat && !entry.chest && !entry.waist) {
    toast('⚠ Introduce al menos peso o una medida');
    return;
  }

  // Replace if same date exists
  const existing = PROGRESS.findIndex(e => e.date === date);
  if (existing >= 0) {
    if (!confirm('Ya existe un registro para esta fecha. ¿Sobreescribir?')) return;
    PROGRESS.splice(existing, 1);
  }

  PROGRESS.push(entry);
  PROGRESS.sort((a, b) => a.date.localeCompare(b.date));

  saveProgressLocal();
  await saveProgressToServer();

  // Clear form (keep date for convenience)
  ['prg-weight','prg-fat','prg-chest','prg-waist','prg-hips','prg-arm','prg-thigh','prg-calf','prg-neck','prg-shoulder','prg-notes']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });

  renderProgress();
  toast('✅ Registro guardado');
};

function parseFloatOrNull(id) {
  const v = parseFloat(document.getElementById(id)?.value);
  return isNaN(v) ? null : v;
}

window.deleteProgressEntry = (id) => {
  if (!confirm('¿Eliminar este registro?')) return;
  PROGRESS = PROGRESS.filter(e => e.id !== id);
  saveProgressLocal();
  saveProgressToServer();
  renderProgress();
  toast('Registro eliminado');
};

window.switchChartTab = (tab, el) => {
  currentChartTab = tab;
  document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderProgressChart();
};

