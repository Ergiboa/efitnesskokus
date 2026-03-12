// ══════════════════════════════════════════════════════
//  MACROS ENGINE
// ══════════════════════════════════════════════════════
function mac(p, qty) {
  const e = DB[p.toLowerCase().trim()];
  if (!e) return null;
  const f = (e.base==='100g'||e.base==='100ml') ? qty/100 : qty;
  return {kcal:+(e.kcal*f).toFixed(1),prot:+(e.prot*f).toFixed(1),carb:+(e.carb*f).toFixed(1),fat:+(e.fat*f).toFixed(1),fib:+(e.fib*f).toFixed(1)};
}
function sumMac(items) {
  let t={kcal:0,prot:0,carb:0,fat:0,fib:0};
  (items||[]).forEach(i=>{if(!i.p)return;const m=mac(i.p,i.qty);if(m){t.kcal+=m.kcal;t.prot+=m.prot;t.carb+=m.carb;t.fat+=m.fat;t.fib+=m.fib;}});
  return{kcal:+t.kcal.toFixed(0),prot:+t.prot.toFixed(1),carb:+t.carb.toFixed(1),fat:+t.fat.toFixed(1),fib:+t.fib.toFixed(1)};
}
function dayMac(dayObj) {
  let t={kcal:0,prot:0,carb:0,fat:0,fib:0};
  Object.values(dayObj).forEach(its=>{const m=sumMac(its);t.kcal+=+m.kcal;t.prot+=+m.prot;t.carb+=+m.carb;t.fat+=+m.fat;t.fib+=+m.fib;});
  return{kcal:+t.kcal.toFixed(0),prot:+t.prot.toFixed(1),carb:+t.carb.toFixed(1),fat:+t.fat.toFixed(1),fib:+t.fib.toFixed(1)};
}
function getCompraList(){const map={};Object.values(DIET).forEach(d=>Object.values(d).forEach(its=>its.forEach(i=>{if(!i.p)return;const k=i.p.toLowerCase().trim();if(!map[k])map[k]={p:k,qty:0,u:i.u};map[k].qty+=i.qty;})));return Object.values(map).sort((a,b)=>a.p.localeCompare(b.p));}

// ══════════════════════════════════════════════════════
//  MICROS ENGINE
// ══════════════════════════════════════════════════════
const MICRO_KEYS = ['vA','vC','vD','vE','vK','B1','B2','B3','B6','B12','fol','Ca','Fe','Zn','Mg','K'];
function zeroMicros(){const z={};MICRO_KEYS.forEach(k=>z[k]=0);return z;}
function micIng(p,qty){
  const k=p.toLowerCase().trim();
  const e=DB[k],m=MICROS_DB[k];
  if(!m)return null;
  const base=(e?.base)||'100g';
  let f=1;
  if(base==='100g'||base==='100ml')f=qty/100;
  else{const bm=base.match(/^(\d+(?:\.\d+)?)\s*(g|ml|L|kg)?/i);
    if(bm){const bq=parseFloat(bm[1]);const bu=(bm[2]||'').toLowerCase();
      if(bu==='g'||bu==='ml')f=qty/bq;
      else if(bu==='l')f=qty/(bq*1000)*1000;
      else if(bu==='kg')f=qty/(bq*1000)*100;}
    else f=qty;}
  const r=zeroMicros();
  MICRO_KEYS.forEach(k=>{if(m[k]!=null)r[k]=+(m[k]*f).toFixed(3);});
  return r;
}
function dayMicros(dayObj){
  const t=zeroMicros();
  Object.values(dayObj).forEach(its=>(its||[]).forEach(i=>{
    if(!i.p)return;
    const r=micIng(i.p,i.qty);
    if(r)MICRO_KEYS.forEach(k=>{t[k]+=r[k];});
  }));
  MICRO_KEYS.forEach(k=>{t[k]=+t[k].toFixed(2);});
  return t;
}
function weekAvgMicros(){
  const days=Object.values(DIET);if(!days.length)return zeroMicros();
  const t=zeroMicros();
  days.forEach(d=>{const m=dayMicros(d);MICRO_KEYS.forEach(k=>{t[k]+=m[k];});});
  MICRO_KEYS.forEach(k=>{t[k]=+(t[k]/days.length).toFixed(2);});
  return t;
}
// Top sources for a given micronutrient
function topSources(vit,n=3){
  const ingMap={};
  Object.values(DIET).forEach(d=>Object.values(d).forEach(its=>(its||[]).forEach(i=>{
    if(!i.p)return;
    const r=micIng(i.p,i.qty);
    if(r&&r[vit]>0){const k=i.p.toLowerCase().trim();ingMap[k]=(ingMap[k]||0)+r[vit];}
  })));
  return Object.entries(ingMap).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([p,v])=>({p,v}));
}

// ══════════════════════════════════════════════════════
//  RENDER: RESUMEN
// ══════════════════════════════════════════════════════
function renderResumen(){
  // Ordenar días lunes→domingo
  const _DORD=['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO','LUN','MAR','MIE','JUE','VIE','SAB','DOM'];
  const _norm=s=>s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const days=Object.keys(DIET).sort((a,b)=>{
    const ia=_DORD.indexOf(_norm(a)),ib=_DORD.indexOf(_norm(b));
    return (ia===-1?99:ia)-(ib===-1?99:ib);
  });
  let sk=0,sp=0,sc=0,sf=0,sfib=0,rows='';
  days.forEach(d=>{const m=dayMac(DIET[d]);sk+=+m.kcal;sp+=+m.prot;sc+=+m.carb;sf+=+m.fat;sfib+=+m.fib;
    rows+=`<tr><td style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px">${d}</td><td style="color:var(--accent3)">${m.kcal}</td><td style="color:var(--accent)">${m.prot}</td><td style="color:var(--accent2)">${m.carb}</td><td style="color:var(--orange)">${m.fat}</td><td style="color:var(--purple)">${m.fib}</td></tr>`;});
  const n=days.length||1;
  document.getElementById('s-kcal').textContent=Math.round(sk/n);
  document.getElementById('s-prot').textContent=(sp/n).toFixed(1);
  document.getElementById('s-carb').textContent=(sc/n).toFixed(1);
  document.getElementById('s-fat').textContent=(sf/n).toFixed(1);
  document.getElementById('s-fib').textContent=(sfib/n).toFixed(1);
  document.getElementById('daily-table-wrap').innerHTML=`<table><thead><tr><th>Día</th><th>Kcal</th><th>Proteína(g)</th><th>Carbs(g)</th><th>Grasa(g)</th><th>Fibra(g)</th></tr></thead><tbody>${rows}</tbody></table>`;
  const miss={};Object.values(DIET).forEach(d=>Object.values(d).flat().forEach(i=>{if(i.p&&!DB[i.p.toLowerCase().trim()])miss[i.p.toLowerCase().trim()]=1;}));
  const mk=Object.keys(miss);
  document.getElementById('miss-alerts').innerHTML=mk.length?`<div style="background:#1e1400;border:1px solid #4a3400;border-radius:7px;padding:8px 13px;margin-bottom:10px;font-size:11px;color:var(--accent3)">⚠️ <strong>${mk.length} producto${mk.length>1?'s':''} sin datos nutricionales</strong> en DB.</div>`:'';

  // ── VITAMINS PANEL ──
  renderVitamins();
}

function renderVitamins(){
  const el=document.getElementById('vitamins-panel');
  if(!el)return;
  const avgs=weekAvgMicros();
  const vitKeys=['vA','vC','vD','vE','vK','B1','B2','B3','B6','B12','fol'];
  const minKeys=['Ca','Fe','Zn','Mg','K'];
  function buildGrid(keys){
    return keys.map(k=>{
      const meta=VITAMIN_META[k];
      const val=avgs[k]||0;
      const pct=Math.min(200,Math.round(val/meta.rda*100));
      const barPct=Math.min(100,pct);
      const col=pct>=100?'var(--accent)':pct>=60?'var(--accent3)':'var(--red)';
      const status=pct>=100?'✓':pct>=60?'~':'↓';
      const src=topSources(k,2);
      const srcHtml=src.length?src.map(s=>`<span class="vit-src">${s.p}</span>`).join(''):'<span class="vit-src" style="color:var(--muted)">sin fuente</span>';
      return `<div class="vit-card ${pct<60?'vit-deficit':''}">
        <div class="vit-head">
          <span class="vit-emoji">${meta.emoji}</span>
          <span class="vit-name">${meta.label}</span>
          <span class="vit-status" style="color:${col}">${status}</span>
        </div>
        <div class="vit-bar-wrap">
          <div class="vit-bar" style="width:${barPct}%;background:${col}"></div>
          ${pct>=100?`<div class="vit-bar-overflow" style="width:${Math.min(100,pct-100)}%"></div>`:''}
        </div>
        <div class="vit-vals">
          <span style="color:${col};font-weight:700">${val<10?val.toFixed(2):val.toFixed(1)} ${meta.unit}</span>
          <span style="color:var(--muted2)">${pct}% RDA</span>
        </div>
        <div class="vit-sources">${srcHtml}</div>
      </div>`;
    }).join('');
  }
  const deficits=MICRO_KEYS.filter(k=>{const pct=(avgs[k]||0)/VITAMIN_META[k].rda*100;return pct<60;});
  el.innerHTML=`
    <div class="vit-summary">
      ${deficits.length===0
        ?`<span style="color:var(--accent)">✅ Perfil de micronutrientes completo</span>`
        :`<span style="color:var(--red)">⚠️ Déficit en: ${deficits.map(k=>VITAMIN_META[k].label).join(', ')}</span>`}
      <span style="color:var(--muted2);font-size:9px">RDA adulto referencia · datos estimados</span>
    </div>
    <div class="vit-section-label">🧪 Vitaminas</div>
    <div class="vit-grid">${buildGrid(vitKeys)}</div>
    <div class="vit-section-label" style="margin-top:10px">⚗️ Minerales</div>
    <div class="vit-grid">${buildGrid(minKeys)}</div>`;
}
function recipeOptions(){return`<option value="">📖 Aplicar receta...</option>`+RECIPES.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');}
const isCoachView = () => currentProfile?.role === 'coach';

function makeIngNameInput(day, meal, idx, val, locked) {
  if (locked) {
    return `<input class="ing-name" type="text" value="${val}" placeholder="ingrediente" readonly>`;
  }
  return `<input class="ing-name" type="text" value="${val}" placeholder="ingrediente"
    autocomplete="off"
    onchange="updIng('${day}','${meal}',${idx},'p',this.value)"
    oninput="showACDrop(this)"
    onblur="hideACDrop()">`;
}

function renderDiet(){
  const locked = !isCoachView();
  // Normalizar claves de comida en cada día (por si el JSON de Supabase viene sin preCama)
  Object.keys(DIET).forEach(day=>{ MEALS_ORDER.forEach(m=>{ if(!Array.isArray(DIET[day][m])) DIET[day][m]=[]; }); });
  let html='';
  const DIET_DAY_ORDER = ['LUNES','MARTES','MIERCOLES','MIÉRCOLES','JUEVES','VIERNES','SABADO','SÁBADO','DOMINGO',
    'LUN','MAR','MIE','MIÉ','JUE','VIE','SAB','SÁB','DOM'];
  const sortedEntries = Object.entries(DIET).sort(([a],[b])=>{
    const ia = DIET_DAY_ORDER.findIndex(d=>d===a.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
    const ib = DIET_DAY_ORDER.findIndex(d=>d===b.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
    return (ia===-1?99:ia) - (ib===-1?99:ib);
  });
  sortedEntries.forEach(([day,dayObj])=>{
    const m=dayMac(dayObj);
    let mcols='';
    MEALS_ORDER.forEach(meal=>{
      const items=dayObj[meal]||[];
      const ings=items.map((ing,idx)=>`
        <div class="ing-row">
          <input class="ing-qty" type="number" min="0" value="${ing.qty}" ${locked?'readonly':''} onchange="updIng('${day}','${meal}',${idx},'qty',+this.value)">
          <select class="ing-unit" ${locked?'disabled':''} onchange="updIng('${day}','${meal}',${idx},'u',this.value)">${['g','ml','ud'].map(u=>`<option ${ing.u===u?'selected':''}>${u}</option>`).join('')}</select>
          ${makeIngNameInput(day, meal, idx, ing.p, locked)}
          ${locked?'':`<button class="ing-del" onclick="delIng('${day}','${meal}',${idx})">×</button>`}
        </div>`).join('');
      const noteVal = (MEAL_NOTES[meal] || '').replace(/</g,'&lt;');
      const noteHtml = locked
        ? (noteVal ? `<div class="meal-note-area">${noteVal.replace(/\n/g,'<br>')}</div>` : '')
        : `<textarea class="meal-note-inp" rows="2" placeholder="Nota para ${MEAL_LABELS[meal]||meal}…" oninput="updMealNote('${meal}',this.value)">${noteVal}</textarea>`;
      mcols+=`<div class="diet-meal-col">
        <div class="meal-col-title">${MEAL_LABELS[meal]||meal}</div>
        ${noteHtml}
        ${locked?'':`<select class="recipe-sel" onchange="applyRecipe('${day}','${meal}',this.value);this.value=''">${recipeOptions()}</select>`}
        <div id="di-${day}-${meal}">${ings}</div>
        ${locked?'':`<button class="add-ing-btn" onclick="addIng('${day}','${meal}')">+ ingrediente</button>`}
      </div>`;
    });
    html+=`<div class="diet-day-card ${locked?'diet-readonly':''}">
      <div class="diet-day-head">
        <h3>${day}</h3>
        <div class="diet-day-macros"><span style="color:var(--accent3)">${m.kcal} kcal</span><span style="color:var(--accent)">${m.prot}g P</span><span style="color:var(--accent2)">${m.carb}g C</span><span style="color:var(--orange)">${m.fat}g G</span></div>
        ${locked?'':`<button class="btn danger xs" onclick="removeDay('${day}')">✕ día</button>`}
      </div>
      <div class="diet-meals-row">${mcols}</div>
    </div>`;
  });
  document.getElementById('diet-week-grid').innerHTML=html;
}

window.updIng=(day,meal,idx,f,v)=>{if(!isCoachView())return;if(!DIET[day]||!DIET[day][meal])return;DIET[day][meal][idx][f]=v;refreshDayMacros(day);renderResumen();};
window.updMealNote=(meal,val)=>{if(!isCoachView())return;MEAL_NOTES[meal]=val;};
function refreshDayMacros(day){const m=dayMac(DIET[day]);document.querySelectorAll('.diet-day-card').forEach(c=>{const h=c.querySelector('.diet-day-head h3');if(h&&h.textContent===day){const md=c.querySelector('.diet-day-macros');if(md)md.innerHTML=`<span style="color:var(--accent3)">${m.kcal} kcal</span><span style="color:var(--accent)">${m.prot}g P</span><span style="color:var(--accent2)">${m.carb}g C</span><span style="color:var(--orange)">${m.fat}g G</span>`;}})}

window.addIng=(day,meal)=>{
  if(!isCoachView())return;
  if(!DIET[day][meal])DIET[day][meal]=[];
  const idx=DIET[day][meal].length;
  DIET[day][meal].push({p:'',qty:100,u:'g'});
  const c=document.getElementById(`di-${day}-${meal}`);
  if(c)c.insertAdjacentHTML('beforeend',`
    <div class="ing-row">
      <input class="ing-qty" type="number" min="0" value="100" onchange="updIng('${day}','${meal}',${idx},'qty',+this.value)">
      <select class="ing-unit" onchange="updIng('${day}','${meal}',${idx},'u',this.value)"><option>g</option><option>ml</option><option>ud</option></select>
      <input class="ing-name" type="text" value="" placeholder="ingrediente" autocomplete="off"
        onchange="updIng('${day}','${meal}',${idx},'p',this.value)"
        oninput="showACDrop(this)"
        onblur="hideACDrop()">
      <button class="ing-del" onclick="delIng('${day}','${meal}',${idx})">×</button>
    </div>`);
};

window.delIng=(day,meal,idx)=>{if(!isCoachView())return;DIET[day][meal].splice(idx,1);renderDiet();renderResumen();};
window.applyRecipe=(day,meal,rid)=>{if(!rid||!isCoachView())return;const r=RECIPES.find(x=>x.id===rid);if(!r)return;DIET[day][meal]=r.items.map(i=>({...i}));renderDiet();renderResumen();toast(`✓ "${r.name}" aplicada`);};
window.addDietDay=()=>{if(!isCoachView())return;const n=prompt('Nombre del día:');if(!n)return;const k=n.trim().toUpperCase();if(DIET[k]){alert('Ya existe');return;}DIET[k]={desayuno:[],comida:[],preEntreno:[],cena:[],preCama:[]};renderDiet();};
window.removeDay=(day)=>{if(!isCoachView())return;if(!confirm(`¿Eliminar ${day}?`))return;delete DIET[day];renderDiet();renderResumen();};
window.resetDietToDefault=()=>{if(!isCoachView())return;if(!confirm('¿Restaurar?'))return;DIET=getDefaultDiet();MEAL_NOTES={};renderDiet();renderResumen();toast('Dieta restaurada ✓');};
window.saveDietToServer=saveDietToServer;

