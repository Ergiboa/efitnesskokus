// ══════════════════════════════════════════════════════
//  TRAINING MODULE — Hevy-style
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
//  TRAINING MODULE — Hevy-style
// ══════════════════════════════════════════════════════
const DAY_NAMES = {LUN:'Lunes',MAR:'Martes',MIE:'Miércoles',JUE:'Jueves',VIE:'Viernes',SAB:'Sábado',DOM:'Domingo'};

function getRtn(id){
  if(!id) return null;
  let r = ROUTINES.find(r=>r.id===id);
  if(r) return r;
  // Fallback: look in schedule snapshots (for clients whose routines RLS is blocked)
  for(const day of DAY_LABELS){
    if(SCHEDULE[day]===id){
      // Already in ROUTINES if snapshot was loaded — this is just a safety net
      break;
    }
  }
  return null;
}
function getTodayLabel(){const d=new Date().getDay();return DAY_LABELS[[6,0,1,2,3,4,5][d]];}

// ── Logs keyed by day label (LUN, MAR...) — never by routine id ──
function getDayLog(day){return(TRN_LOG[THIS_WEEK]&&TRN_LOG[THIS_WEEK][day])||{done:false,exercises:{}};}
function getWeekLog(rid){return{done:false,exercises:{}};}// kept for compat
function getPrevLog(day,exId){
  const histKeys=Object.keys(TRN_LOG_HISTORY||{}).sort();
  for(let i=histKeys.length-1;i>=0;i--){
    const e=TRN_LOG_HISTORY[histKeys[i]]?.[day]?.exercises?.[exId];
    if(e) return e;
  }
  return null;
}

// ── Sidebar rendering ──
function renderTrnSidebar(){
  // week pane
  const wp=document.getElementById('trn-week-pane');
  if(wp) wp.innerHTML=DAY_LABELS.map(day=>{
    const rid=SCHEDULE[day]||'', rtn=rid?getRtn(rid):null;
    const log=getDayLog(day), isDone=log.done;
    const isToday=day===getTodayLabel(), isSel=day===currentDay;
    return`<div class="sched-row" style="${isSel?'border-color:var(--accent);background:rgba(194,242,79,.05)':''}" onclick="selectDay('${day}')">
      <span class="sched-day-lbl">${day}</span>
      <span style="flex:1;font-size:11px;font-family:'Syne',sans-serif;font-weight:600;${rtn?'':'color:var(--muted)'};${isToday?'color:var(--accent2)':''}">${rtn?rtn.name:'Descanso'}${isToday?' ·':''}</span>
      <span class="sched-done-icon">${isDone?'✅':rtn?'':'😴'}</span>
    </div>`;
  }).join('');
  // routines pane (program tab)
  const rp=document.getElementById('trn-routines-pane');
  if(rp) rp.innerHTML=ROUTINES.length===0
    ?`<div style="padding:14px;color:var(--muted2);font-size:11px;text-align:center">${isCoachView()?'Sin rutinas. Crea una.':'Sin rutinas asignadas.'}</div>`
    :ROUTINES.map(r=>`<div class="rtn-item ${r.id===currentRtnId?'active':''}" onclick="selectRtnProgram('${r.id}')">
        <div class="rtn-item-name">${r.name}</div>
        <div class="rtn-item-meta">${(r.exercises||[]).length} ejercicios · ${(r.muscles||[]).slice(0,2).join(', ')||'—'}</div>
      </div>`).join('');
  // schedule pane
  renderSchedule();
}

function renderSchedule(){
  const sp=document.getElementById('trn-schedule-pane');if(!sp)return;
  sp.innerHTML=DAY_LABELS.map(day=>{
    const rid=SCHEDULE[day]||'';
    const opts=`<option value="">— Descanso —</option>`+ROUTINES.map(r=>`<option value="${r.id}" ${r.id===rid?'selected':''}>${r.name}</option>`).join('');
    return`<div class="sched-row"><span class="sched-day-lbl">${day}</span>
      <select class="sched-sel" onchange="setScheduleDay('${day}',this.value)" ${isCoachView()?'':'disabled'}>${opts}</select></div>`;
  }).join('');
}

window.setScheduleDay=async(day,rid)=>{
  SCHEDULE[day]=rid||'';
  renderTrnSidebar();
  renderTrnWeekBar();
  if(isCoachView()) await saveRoutinesToServer();
};

window.switchTrnTab=(tab)=>{
  trnTabMode=tab;
  ['week','program','progress'].forEach(t=>{
    const el=document.getElementById('trn-'+t+'-pane');
    if(el) el.style.display=t===tab?'block':'none';
    document.getElementById('trnTab-'+t)?.classList.toggle('active',t===tab);
  });
  const pa=document.getElementById('trn-progress-area');
  const sa=document.getElementById('trn-stats-area');
  if(pa) pa.style.display=tab==='progress'?'block':'none';
  if(sa) sa.style.display=(tab!=='progress'&&sa.dataset.hasData==='1')?'block':'none';
  if(tab==='progress') renderTrnProgress();
};

// ── Week bar ──
function renderTrnWeekBar(){
  const bar=document.getElementById('trn-week-bar');if(!bar)return;
  const today=getTodayLabel();
  bar.innerHTML=DAY_LABELS.map(day=>{
    const rid=SCHEDULE[day]||'', rtn=rid?getRtn(rid):null;
    const log=getDayLog(day), isDone=log.done;
    const isToday=day===today, isRest=!rid, isSel=day===currentDay;
    const cls=['twd',isRest?'rest':'',isDone?'done':'',isToday&&!isRest?'today':'',isSel?'selected':''].filter(Boolean).join(' ');
    const icon=isDone?'✅':isRest?'—':'🏋️';
    return`<div class="${cls}" onclick="selectDay('${day}')">
      <div class="twd-day">${day}</div>
      <div class="twd-icon">${icon}</div>
      <div class="twd-rtn">${rtn?rtn.name:'descanso'}</div>
    </div>`;
  }).join('');
}

window.selectDay=(day)=>{
  currentDay=day;
  const rid=SCHEDULE[day]||'';
  currentRtnId=rid||null;
  renderTrnWeekBar();
  renderTrnSidebar();
  renderTrnEditor();
};

window.selectRtnProgram=(id)=>{
  currentRtnId=id;
  renderTrnSidebar();
  renderRtnEditor();
};

// ── WORKOUT EDITOR (day view — what client uses) ──
function renderTrnEditor(){
  const area=document.getElementById('trn-editor-area');if(!area)return;
  const day=currentDay;
  if(!day){area.innerHTML=`<div class="trn-empty"><div style="font-size:36px">📅</div><div>Selecciona un día</div></div>`;return;}
  const rid=SCHEDULE[day]||'';
  if(!rid){
    area.innerHTML=`<div class="trn-empty"><div style="font-size:36px">😴</div><div style="font-family:'Syne',sans-serif;font-weight:700">${DAY_NAMES[day]}</div><div>Día de descanso</div>${isCoachView()?`<div style="font-size:11px;margin-top:6px"><button class="btn ghost sm" onclick="switchTrnTab('program')">Asignar rutina</button></div>`:''}</div>`;
    return;
  }
  const r=getRtn(rid);
  if(!r){
    area.innerHTML=`<div class="trn-empty"><div style="font-size:36px">⚠</div><div>Rutina no encontrada</div><div style="font-size:11px;color:var(--muted2)">ID: ${rid}</div><div style="font-size:11px;color:var(--red);margin-top:8px">Ejecuta el SQL de permisos en Supabase.<br>Ver archivo supabase_rls_fix.sql</div></div>`;
    return;
  }
  const log=getDayLog(day);
  const coach=isCoachView();
  const isDone=log.done;
  const exBlocksHtml=(r.exercises||[]).map((ex,ei)=>renderExBlock(day,ex,ei,log,coach)).join('');
  const muscleChips=coach?`<div class="muscle-chips">${MUSCLES_LIST.map(m=>`<span class="mchip ${(r.muscles||[]).includes(m)?'on':''}" onclick="toggleMuscle('${r.id}','${m}')">${m}</span>`).join('')}</div>`:'';
  area.innerHTML=`<div class="workout-card">
    <div class="workout-head">
      <div>
        <div class="workout-title">${r.name}</div>
        <div class="workout-subtitle">${DAY_NAMES[day]||day} · ${THIS_WEEK} · ${(r.muscles||[]).slice(0,3).join(', ')||'—'}</div>
      </div>
      ${isDone
        ?`<button class="workout-done-btn undone" onclick="markDayDone('${day}',false)">↺ Desmarcar</button>`
        :`<button class="workout-done-btn" onclick="markDayDone('${day}',true)">✅ Completado</button>`
      }
      ${coach?`<button class="btn ghost sm" onclick="selectRtnProgram('${r.id}');switchTrnTab('program')">✏ Editar</button>`:''}
    </div>
    ${isDone?`<div class="workout-done-banner">✅ Completado esta semana</div>`:''}
    ${muscleChips}
    <div id="workout-exblocks-${day}">${exBlocksHtml}</div>
    ${coach?`<div class="workout-actions"><button class="btn ghost sm" onclick="addExToWorkout('${day}')">+ Ejercicio</button></div>`:''}
  </div>`;
}

function renderExBlock(day,ex,ei,log,coach){
  const exLog=(log.exercises&&log.exercises[ex.id])||{sets:[],rpe:0};
  const prevLog=getPrevLog(day,ex.id);
  const setsHtml=(ex.sets||[]).map((set,si)=>{
    const ls=(exLog.sets&&exLog.sets[si])||{};
    const ps=(prevLog&&prevLog.sets&&prevLog.sets[si])||{};
    const isDone=ls.done||false;
    const phW=ps.weight?`Ant: ${ps.weight}kg`:(set.weight?`${set.weight}kg`:'—');
    const phR=ps.reps||set.reps||'—';
    const wVal=ls.weight!=null&&ls.weight!==''?ls.weight:'';
    const rVal=ls.reps!=null&&ls.reps!==''?ls.reps:'';
    return`<div class="set-row${isDone?' set-done':''}" id="sr-${day}-${ex.id}-${si}">
      <span class="set-num">${si+1}</span>
      <input class="set-inp${isDone?' done-val':''}" type="number" min="0" step="0.5" placeholder="${phW}" value="${wVal}" inputmode="decimal"
        onchange="logSetVal('${day}','${ex.id}',${si},'weight',this.value)">
      <input class="set-inp${isDone?' done-val':''}" type="number" min="0" placeholder="${phR}" value="${rVal}" inputmode="numeric"
        onchange="logSetVal('${day}','${ex.id}',${si},'reps',this.value)">
      <input class="set-inp" type="text" placeholder="—" value="${ls.time||''}"
        onchange="logSetVal('${day}','${ex.id}',${si},'time',this.value)">
      <button class="set-check-btn${isDone?' checked':''}" onclick="toggleSetDone('${day}','${ex.id}',${si})" title="${isDone?'Desmarcar':'Marcar hecha'}">${isDone?'✓':'○'}</button>
      ${coach?`<button class="set-del-btn" onclick="delSet('${day}',${ei},${si})" title="Eliminar">×</button>`:''}
    </div>`;
  }).join('');
  const rpeVal=exLog.rpe||0;
  const rpeBtns=[...Array(10)].map((_,i)=>`<button class="rpebtn${rpeVal===i+1?' on':''}" onclick="logRpe('${day}','${ex.id}',${i+1})" title="RPE ${i+1}">${i+1}</button>`).join('');
  const noteHtml=ex.note
    ?(coach?`<input class="ex-note-inp" type="text" value="${(ex.note||'').replace(/"/g,'&quot;')}" placeholder="Nota..." onchange="updateExNote('${ex.id}',${ei},'${currentRtnId||SCHEDULE[day]||''}',this.value)">`
          :`<div class="ex-note">${ex.note}</div>`)
    :(coach?`<input class="ex-note-inp" type="text" value="" placeholder="Nota técnica..." onchange="updateExNote('${ex.id}',${ei},'${currentRtnId||SCHEDULE[day]||''}',this.value)">`:'');
  const libEx=EX_LIBRARY.find(e=>e.name&&ex.name&&e.name.toLowerCase()===ex.name.toLowerCase())||
              EX_LIBRARY.find(e=>e.name&&ex.name&&ex.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0]));
  const gifSide=libEx?.gif_url
    ?`<div class="ex-block-gif-side" onclick="openGifModal('${(ex.name||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" title="Ver GIF">
        <img src="${libEx.gif_url}" alt="${ex.name}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'no-gif\\'>🏋️</span>'">
      </div>`
    :`<div class="ex-block-gif-side" onclick="openGifModal('${(ex.name||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" title="Sin GIF">
        <span class="no-gif">🏋️</span>
      </div>`;
  return`<div class="ex-block" id="exb-${day}-${ex.id}">
    <div class="ex-block-inner">
      ${gifSide}
      <div style="flex:1;min-width:0">
        <div class="ex-block-head">
          ${coach
            ?`<input class="ex-block-name-inp" type="text" value="${(ex.name||'').replace(/"/g,'&quot;')}" placeholder="Nombre del ejercicio" onchange="updateExName('${ex.id}',${ei},'${currentRtnId||SCHEDULE[day]||''}',this.value)">`
            :`<span class="ex-block-name">${ex.name||'Ejercicio'}</span>`
          }
          ${coach?`<button class="set-del-btn" onclick="delExFromWorkout('${day}','${ex.id}')" title="Eliminar ejercicio">🗑</button>`:''}
        </div>
        ${noteHtml}
        <div class="sets-table" style="margin:0 16px 6px">
          <div class="sets-hdr"><span>#</span><span>Peso kg</span><span>Reps</span><span>Tiempo</span><span>✓</span>${coach?'<span></span>':''}</div>
          <div id="sets-${day}-${ex.id}">${setsHtml}</div>
        </div>
        <div class="rpe-row"><span class="rpe-lbl">RPE</span>${rpeBtns}</div>
        ${coach?`<button class="add-set-btn" onclick="addSetToWorkout('${day}','${ex.id}')">+ Serie</button>`:''}
      </div>
    </div>
  </div>`;
}

// ── ROUTINE EDITOR (coach — program tab) ──
function renderRtnEditor(){
  const area=document.getElementById('trn-editor-area');if(!area)return;
  const r=getRtn(currentRtnId);
  if(!r){area.innerHTML=`<div class="trn-empty"><div style="font-size:32px">📋</div><div>Selecciona una rutina para editar</div></div>`;return;}
  const exBlocksHtml=(r.exercises||[]).map((ex,ei)=>renderRtnExBlock(r.id,ex,ei)).join('');
  const muscleChips=MUSCLES_LIST.map(m=>`<span class="mchip ${(r.muscles||[]).includes(m)?'on':''}" onclick="toggleMuscle('${r.id}','${m}')">${m}</span>`).join('');
  area.innerHTML=`<div class="workout-card">
    <div class="workout-head">
      <input class="rtn-name-inp" type="text" id="rtnname-${r.id}" value="${(r.name||'').replace(/"/g,'&quot;')}" oninput="updateRtnName('${r.id}',this.value)" style="flex:1">
      <button class="btn ghost sm" onclick="saveRoutineAndToast('${r.id}')">💾 Guardar</button>
      <button class="btn danger sm" onclick="deleteRoutine('${r.id}')">🗑</button>
    </div>
    <div class="muscle-chips">${muscleChips}</div>
    <div id="rtn-exblocks-${r.id}">${exBlocksHtml}</div>
    <div class="workout-actions">
      <button class="btn ghost sm" onclick="addExToRoutine('${r.id}')">+ Ejercicio</button>
    </div>
  </div>`;
}

function renderRtnExBlock(rid,ex,ei){
  const setsHtml=(ex.sets||[]).map((set,si)=>`<div class="set-row" id="rsr-${rid}-${ex.id}-${si}">
    <span class="set-num">${si+1}</span>
    <input class="set-inp" type="number" min="0" step="0.5" placeholder="kg" value="${set.weight||''}" onchange="updateTmplSet('${rid}',${ei},${si},'weight',this.value)">
    <input class="set-inp" type="number" min="0" placeholder="reps" value="${set.reps||''}" onchange="updateTmplSet('${rid}',${ei},${si},'reps',this.value)">
    <input class="set-inp" type="text" placeholder="—" value="${set.time||''}" onchange="updateTmplSet('${rid}',${ei},${si},'time',this.value)">
    <span></span>
    <button class="set-del-btn" onclick="delTmplSet('${rid}',${ei},${si})">×</button>
  </div>`).join('');
  const libEx2=EX_LIBRARY.find(e=>e.name&&ex.name&&e.name.toLowerCase()===ex.name.toLowerCase())||
               EX_LIBRARY.find(e=>e.name&&ex.name&&ex.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0]));
  const gifSide2=libEx2?.gif_url
    ?`<div class="ex-block-gif-side" onclick="openGifModal('${(ex.name||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" title="Ver GIF">
        <img src="${libEx2.gif_url}" alt="${ex.name}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'no-gif\\'>🏋️</span>'">
      </div>`
    :`<div class="ex-block-gif-side" onclick="openGifModal('${(ex.name||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;')}')" title="Sin GIF">
        <span class="no-gif">🏋️</span>
      </div>`;
  return`<div class="ex-block" id="rtne-${rid}-${ex.id}">
    <div class="ex-block-inner">
      ${gifSide2}
      <div style="flex:1;min-width:0">
        <div class="ex-block-head">
          <input class="ex-block-name-inp" type="text" value="${(ex.name||'').replace(/"/g,'&quot;')}" placeholder="Nombre" onchange="updateRtnExName('${rid}',${ei},this.value)">
          <button class="gif-btn" onclick="openGifModal('${(ex.name||'').replace(/'/g,'&#39;')}')">🎬</button>
          <button class="set-del-btn" onclick="delRtnEx('${rid}','${ex.id}')">🗑</button>
        </div>
        <input class="ex-note-inp" type="text" value="${(ex.note||'').replace(/"/g,'&quot;')}" placeholder="Nota técnica..." onchange="updateRtnExNote('${rid}',${ei},this.value)" style="margin:0 16px 6px;display:block;width:calc(100% - 32px)">
        <div class="sets-table" style="margin:0 16px 6px">
          <div class="sets-hdr"><span>#</span><span>Peso ref.</span><span>Reps ref.</span><span>Tiempo</span><span></span><span></span></div>
          <div id="rtns-${rid}-${ex.id}">${setsHtml}</div>
        </div>
        <button class="add-set-btn" onclick="addTmplSet('${rid}','${ex.id}')">+ Serie</button>
      </div>
    </div>
  </div>`;
}

// ── ROUTINE CRUD ──
window.newRoutine=async()=>{
  if(!isCoachView())return;
  const id='rt'+Date.now();
  ROUTINES.push({id,name:'Nueva rutina',muscles:[],exercises:[],client_id:currentClientId,coach_id:currentUser.id});
  await saveRoutinesToServer();
  currentRtnId=id;
  switchTrnTab('program');
  renderTrnSidebar();
  renderRtnEditor();
};
window.deleteRoutine=async(id)=>{
  if(!confirm('¿Eliminar rutina?')||!isCoachView())return;
  await sb.from('routines').delete().eq('id',id);
  ROUTINES=ROUTINES.filter(r=>r.id!==id);
  Object.keys(SCHEDULE).forEach(d=>{if(SCHEDULE[d]===id)delete SCHEDULE[d];});
  await saveRoutinesToServer();
  currentRtnId=null;
  renderTrnSidebar();renderTrnWeekBar();
  const area=document.getElementById('trn-editor-area');
  if(area)area.innerHTML=`<div class="trn-empty"><div style="font-size:32px">🗑</div><div>Rutina eliminada</div></div>`;
};
window.updateRtnName=(id,val)=>{const r=getRtn(id);if(r)r.name=val;};
window.saveRoutineAndToast=async(id)=>{
  const r=getRtn(id);if(!r)return;
  const inp=document.getElementById(`rtnname-${id}`);
  if(inp) r.name=inp.value.trim()||r.name;
  await saveRoutinesToServer();
  renderTrnSidebar();renderTrnWeekBar();
  toast('Rutina guardada ✓');
};
window.toggleMuscle=(rid,m)=>{
  const r=getRtn(rid);if(!r)return;
  const i=(r.muscles||[]).indexOf(m);
  i>=0?r.muscles.splice(i,1):(r.muscles=r.muscles||[],r.muscles.push(m));
  document.querySelector(`#rtn-exblocks-${rid}`)?.closest('.workout-card')?.querySelector('.muscle-chips')
    ?.querySelectorAll('.mchip').forEach(c=>{c.classList.toggle('on',(r.muscles||[]).includes(c.textContent));});
};
// Routine template CRUD
window.addExToRoutine=(rid)=>{
  if(!isCoachView())return;
  const r=getRtn(rid);if(!r)return;
  const ex={id:'ex'+Date.now(),name:'',note:'',sets:[{reps:10,weight:'',time:''}]};
  r.exercises.push(ex);
  document.getElementById(`rtn-exblocks-${rid}`)?.insertAdjacentHTML('beforeend',renderRtnExBlock(rid,ex,r.exercises.length-1));
};
window.delRtnEx=(rid,exId)=>{
  if(!isCoachView())return;
  const r=getRtn(rid);if(!r)return;
  r.exercises=r.exercises.filter(e=>e.id!==exId);
  document.getElementById(`rtne-${rid}-${exId}`)?.remove();
};
window.updateRtnExName=(rid,ei,val)=>{const r=getRtn(rid);if(r&&r.exercises[ei])r.exercises[ei].name=val;};
window.updateRtnExNote=(rid,ei,val)=>{const r=getRtn(rid);if(r&&r.exercises[ei])r.exercises[ei].note=val;};
window.updateTmplSet=(rid,ei,si,f,v)=>{const r=getRtn(rid);if(r&&r.exercises[ei]&&r.exercises[ei].sets[si])r.exercises[ei].sets[si][f]=v;};
window.addTmplSet=(rid,exId)=>{
  if(!isCoachView())return;
  const r=getRtn(rid);if(!r)return;
  const ex=r.exercises.find(e=>e.id===exId);if(!ex)return;
  const last=ex.sets[ex.sets.length-1]||{};
  ex.sets.push({reps:last.reps||10,weight:'',time:''});
  const si=ex.sets.length-1;
  const set=ex.sets[si];
  const ei=r.exercises.indexOf(ex);
  document.getElementById(`rtns-${rid}-${exId}`)?.insertAdjacentHTML('beforeend',
    `<div class="set-row" id="rsr-${rid}-${exId}-${si}">
      <span class="set-num">${si+1}</span>
      <input class="set-inp" type="number" min="0" step="0.5" placeholder="kg" value="" onchange="updateTmplSet('${rid}',${ei},${si},'weight',this.value)">
      <input class="set-inp" type="number" min="0" placeholder="reps" value="${set.reps||''}" onchange="updateTmplSet('${rid}',${ei},${si},'reps',this.value)">
      <input class="set-inp" type="text" placeholder="—" value="" onchange="updateTmplSet('${rid}',${ei},${si},'time',this.value)">
      <span></span>
      <button class="set-del-btn" onclick="delTmplSet('${rid}',${ei},${si})">×</button>
    </div>`
  );
};
window.delTmplSet=(rid,ei,si)=>{
  const r=getRtn(rid);if(!r||!r.exercises[ei])return;
  r.exercises[ei].sets.splice(si,1);
  renderRtnEditor();
};

// ── WORKOUT DAY CRUD (coach adds/removes exercises for a specific day's workout) ──
window.addExToWorkout=(day)=>{
  if(!isCoachView())return;
  const rid=SCHEDULE[day]||'';const r=getRtn(rid);if(!r)return;
  const ex={id:'ex'+Date.now(),name:'',note:'',sets:[{reps:10,weight:'',time:''}]};
  r.exercises.push(ex);
  const log=getDayLog(day);
  document.getElementById(`workout-exblocks-${day}`)?.insertAdjacentHTML('beforeend',renderExBlock(day,ex,r.exercises.length-1,log,true));
};
window.delExFromWorkout=(day,exId)=>{
  if(!isCoachView())return;
  const rid=SCHEDULE[day]||'';const r=getRtn(rid);if(!r)return;
  r.exercises=r.exercises.filter(e=>e.id!==exId);
  document.getElementById(`exb-${day}-${exId}`)?.remove();
};
window.updateExName=(exId,ei,rid,val)=>{const r=getRtn(rid);if(r&&r.exercises[ei])r.exercises[ei].name=val;};
window.updateExNote=(exId,ei,rid,val)=>{const r=getRtn(rid);if(r&&r.exercises[ei])r.exercises[ei].note=val;};
window.addSetToWorkout=(day,exId)=>{
  if(!isCoachView())return;
  const rid=SCHEDULE[day]||'';const r=getRtn(rid);if(!r)return;
  const ex=r.exercises.find(e=>e.id===exId);if(!ex)return;
  const last=ex.sets[ex.sets.length-1]||{};
  ex.sets.push({reps:last.reps||10,weight:'',time:''});
  const si=ex.sets.length-1,ei=r.exercises.indexOf(ex);
  const log=getDayLog(day);
  document.getElementById(`sets-${day}-${exId}`)?.insertAdjacentHTML('beforeend',
    renderExBlock(day,ex,ei,log,true).match(new RegExp(`id="sr-${day}-${exId}-${si}"[\\s\\S]*?<\\/div>`))?.[0]||'');
  // Simpler: just re-render
  renderTrnEditor();
};
window.delSet=(day,ei,si)=>{
  if(!isCoachView())return;
  const rid=SCHEDULE[day]||'';const r=getRtn(rid);if(!r||!r.exercises[ei])return;
  r.exercises[ei].sets.splice(si,1);
  renderTrnEditor();
};

// ── LOG FUNCTIONS ──
function ensureExLog(day,exId){
  if(!TRN_LOG[THIS_WEEK])TRN_LOG[THIS_WEEK]={};
  if(!TRN_LOG[THIS_WEEK][day])TRN_LOG[THIS_WEEK][day]={done:false,exercises:{}};
  if(!TRN_LOG[THIS_WEEK][day].exercises[exId])TRN_LOG[THIS_WEEK][day].exercises[exId]={sets:[],rpe:0};
  return TRN_LOG[THIS_WEEK][day].exercises[exId];
}
function ensureSetLog(day,exId,si){
  const el=ensureExLog(day,exId);
  while(el.sets.length<=si)el.sets.push({});
  return el.sets[si];
}
window.logSetVal=async(day,exId,si,f,v)=>{
  const s=ensureSetLog(day,exId,si);
  s[f]=f==='weight'||f==='reps'?parseFloat(v)||0:v;
  await saveTrainingLog(day);
  renderTrnStats();
};
window.toggleSetDone=async(day,exId,si)=>{
  const s=ensureSetLog(day,exId,si);
  s.done=!s.done;
  const btn=document.getElementById(`sr-${day}-${exId}-${si}`)?.querySelector('.set-check-btn');
  const row=document.getElementById(`sr-${day}-${exId}-${si}`);
  if(btn){btn.classList.toggle('checked',s.done);btn.textContent=s.done?'✓':'○';}
  if(row){
    row.classList.toggle('set-done',s.done);
    row.querySelectorAll('.set-inp').forEach(i=>i.classList.toggle('done-val',s.done));
  }
  if(s.done){
    // Get rest time: logged value > template value > nothing
    const timeRaw = s.time || (()=>{
      const r=getRtn(SCHEDULE[day]);
      return r?.exercises?.find(e=>e.id===exId)?.sets?.[si]?.time || '';
    })();
    const secs = parseTimeSecs(timeRaw);
    if(secs > 0) startRestTimer(secs);
  } else {
    stopRestTimer();
  }
  await saveTrainingLog(day);
  renderTrnStats();
};
window.logRpe=async(day,exId,val)=>{
  const el=ensureExLog(day,exId);el.rpe=val;
  const rpeRow=document.querySelector(`#exb-${day}-${exId} .rpe-row`);
  if(rpeRow)rpeRow.innerHTML=`<span class="rpe-lbl">RPE</span>`+[...Array(10)].map((_,i)=>`<button class="rpebtn${val===i+1?' on':''}" onclick="logRpe('${day}','${exId}',${i+1})">${i+1}</button>`).join('');
  await saveTrainingLog(day);
};
window.markDayDone=async(day,done)=>{
  if(!TRN_LOG[THIS_WEEK])TRN_LOG[THIS_WEEK]={};
  if(!TRN_LOG[THIS_WEEK][day])TRN_LOG[THIS_WEEK][day]={done:false,exercises:{}};
  TRN_LOG[THIS_WEEK][day].done=done;
  await saveTrainingLog(day);
  renderTrnSidebar();renderTrnWeekBar();renderTrnEditor();renderTrnStats();
  toast(done?'✅ ¡Entrenamiento completado!':'↺ Desmarcado');
};
window.markRtnDone=window.markDayDone;

// ── REST TIMER ──
// Parsea: "90" → 90s, "1:30" → 90s, "2:00" → 120s, "2m" → 120s, "30s" → 30s
function parseTimeSecs(raw){
  if(!raw) return 0;
  const s = String(raw).trim().toLowerCase();
  if(!s || s==='-' || s==='—') return 0;
  // mm:ss
  const mmsс = s.match(/^(\d+):(\d{2})$/);
  if(mmsс) return parseInt(mmsс[1])*60 + parseInt(mmsс[2]);
  // Xm or Xmin
  const min = s.match(/^(\d+)\s*m(in)?$/);
  if(min) return parseInt(min[1])*60;
  // Xs or Xseg
  const sec = s.match(/^(\d+)\s*s(eg)?$/);
  if(sec) return parseInt(sec[1]);
  // plain number → seconds
  const n = parseFloat(s);
  if(!isNaN(n) && n > 0) return Math.round(n);
  return 0;
}
let _restInterval=null;
function startRestTimer(secs){
  stopRestTimer();
  let left=secs;
  const el=document.getElementById('rest-timer');
  const timeEl=document.getElementById('rest-timer-time');
  if(!el||!timeEl)return;
  el.classList.add('visible');
  const update=()=>{if(left<=0){stopRestTimer();return;}const m=Math.floor(left/60),s=left%60;timeEl.textContent=`${m}:${s.toString().padStart(2,'0')}`;left--;};
  update();
  _restInterval=setInterval(update,1000);
}
window.stopRestTimer=()=>{
  if(_restInterval){clearInterval(_restInterval);_restInterval=null;}
  const el=document.getElementById('rest-timer');
  if(el)el.classList.remove('visible');
};

// ── STATS ──
function renderTrnStats(){
  const sa=document.getElementById('trn-stats-area');const sg=document.getElementById('trn-stats-grid');if(!sa||!sg)return;
  const wd=TRN_LOG[THIS_WEEK]||{};
  let tv=0,tDone=0,tR=0;
  const prRows=[];
  DAY_LABELS.forEach(day=>{
    const rid=SCHEDULE[day]||'';if(!rid)return;
    tR++;
    const dl=wd[day]||{};
    if(dl.done)tDone++;
    const rtn=getRtn(rid);if(!rtn)return;
    (rtn.exercises||[]).forEach(ex=>{
      const exLog=(dl.exercises||{})[ex.id]||{};
      (exLog.sets||[]).forEach(s=>{if(s.done)tv+=((+s.weight||0)*(+s.reps||0));});
      const tMax=Math.max(...(exLog.sets||[]).filter(s=>s.done).map(s=>+s.weight||0),0);
      if(tMax>0&&ex.name)prRows.push(`<div class="stat-row"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ex.name} <span style="color:var(--muted2);font-size:9px">${day}</span></span><span class="sv">${tMax}kg</span></div>`);
    });
  });
  sg.innerHTML=`<div class="stat-card"><h4>Semana ${THIS_WEEK}</h4><div class="stat-row"><span>Días</span><span class="sv">${tDone}/${tR}</span></div><div class="stat-row"><span>Volumen</span><span class="sv">${tv.toLocaleString()}kg</span></div></div><div class="stat-card" style="grid-column:1/-1"><h4>Pesos máximos</h4>${prRows.length?prRows.join(''):'<div class="stat-row" style="color:var(--muted2)">Sin series completadas</div>'}</div>`;
  const show=tDone>0||tv>0;
  sa.style.display=show&&trnTabMode!=='progress'?'block':'none';
  sa.dataset.hasData=show?'1':'0';
}

// ── PROGRESS MODULE ──
function renderTrnProgress(){
  const area=document.getElementById('trn-progress-area');if(!area)return;
  const allWeeks={};
  Object.entries(TRN_LOG_HISTORY||{}).forEach(([wk,d])=>{allWeeks[wk]=d;});
  if(TRN_LOG[THIS_WEEK])allWeeks[THIS_WEEK]=TRN_LOG[THIS_WEEK];
  const sortedWeeks=Object.keys(allWeeks).sort();
  const weeksList=document.getElementById('prog-weeks-list');
  if(weeksList)weeksList.innerHTML=sortedWeeks.length
    ?sortedWeeks.slice(-12).reverse().map(wk=>{const wd=allWeeks[wk]||{};const done=Object.values(wd).filter(v=>v.done).length;return`<div>${wk} <span style="color:var(--accent);font-weight:700">${done}</span> días</div>`;}).join('')
    :'<div style="color:var(--muted)">Sin datos</div>';
  const exIndex={};
  ROUTINES.forEach(r=>{(r.exercises||[]).forEach(ex=>{if(ex.id&&ex.name)exIndex[ex.id]=ex.name;});});
  const exData={};
  sortedWeeks.forEach(wk=>{
    const wd=allWeeks[wk]||{};
    Object.values(wd).forEach(rlog=>{
      Object.entries(rlog.exercises||{}).forEach(([exId,exlog])=>{
        const doneSets=(exlog.sets||[]).filter(s=>s.done);if(!doneSets.length)return;
        const maxW=Math.max(...doneSets.map(s=>+s.weight||0));
        const vol=doneSets.reduce((a,s)=>a+((+s.weight||0)*(+s.reps||0)),0);
        if(!exData[exId])exData[exId]=[];
        const ex=exData[exId].find(e=>e.week===wk);
        if(ex){ex.maxWeight=Math.max(ex.maxWeight,maxW);ex.totalVol+=vol;}
        else exData[exId].push({week:wk,maxWeight:maxW,totalVol:vol});
      });
    });
  });
  const filterSel=document.getElementById('prog-ex-sel');
  if(filterSel){
    const cur=filterSel.value;
    filterSel.innerHTML='<option value="">— Todos —</option>'+Object.keys(exData).map(id=>`<option value="${id}" ${id===cur?'selected':''}>${exIndex[id]||id}</option>`).join('');
  }
  const filterId=filterSel?.value||'';
  const entries=filterId?(exData[filterId]?[[filterId,exData[filterId]]]:[]): Object.entries(exData);
  const totalSessions=sortedWeeks.filter(wk=>Object.values(allWeeks[wk]||{}).some(v=>v.done)).length;
  let globalVol=0;Object.values(exData).forEach(arr=>arr.forEach(e=>globalVol+=e.totalVol));
  const kpiHtml=`<div class="prog-summary">
    <div class="prog-kpi"><div class="prog-kpi-val">${totalSessions}</div><div class="prog-kpi-lbl">Sesiones</div></div>
    <div class="prog-kpi"><div class="prog-kpi-val">${sortedWeeks.length}</div><div class="prog-kpi-lbl">Semanas</div></div>
    <div class="prog-kpi"><div class="prog-kpi-val">${(globalVol/1000).toFixed(1)}t</div><div class="prog-kpi-lbl">Volumen total</div></div>
  </div>`;
  if(!entries.length){area.innerHTML=kpiHtml+`<div class="trn-empty"><div style="font-size:32px">📈</div><div>Sin datos de progreso</div><div style="font-size:11px">Completa series con ✓ para ver tu evolución</div></div>`;return;}
  const cardsHtml=entries.map(([exId,ents])=>{
    const name=exIndex[exId]||exId;
    const sorted=[...ents].sort((a,b)=>a.week.localeCompare(b.week));
    const maxW=Math.max(...sorted.map(e=>e.maxWeight));
    const totalV=sorted.reduce((a,e)=>a+e.totalVol,0);
    const chartSvg=buildProgressSVG(sorted,exId);
    const histRows=sorted.slice(-8).reverse().map((e,i,arr)=>{
      const prev=arr[i+1];const diff=prev?e.maxWeight-prev.maxWeight:0;
      const arrow=diff>0?`<span class="prog-up">↑${diff}</span>`:diff<0?`<span class="prog-dn">↓${Math.abs(diff)}</span>`:'';
      return`<div class="prog-hist-row"><span class="prog-hist-week">${e.week}</span><span class="prog-hist-sets">${(e.totalVol/1000).toFixed(2)}t vol</span><span class="prog-hist-max">${e.maxWeight}kg ${arrow}</span></div>`;
    }).join('');
    return`<div class="prog-ex-card"><div class="prog-ex-head"><span class="prog-ex-name">${name}</span><div class="prog-ex-badges"><span class="prog-badge best">🏆 ${maxW}kg</span><span class="prog-badge vol">📦 ${(totalV/1000).toFixed(1)}t</span></div></div><div class="prog-chart-wrap">${chartSvg}</div><div class="prog-history">${histRows}</div></div>`;
  }).join('');
  area.innerHTML=kpiHtml+cardsHtml;
}

function buildProgressSVG(entries,id){
  if(entries.length<1)return'';
  const W=520,H=80,PAD={top:8,right:10,bottom:20,left:34};
  const cW=W-PAD.left-PAD.right,cH=H-PAD.top-PAD.bottom;
  const weights=entries.map(e=>e.maxWeight);
  const minV=Math.min(...weights),maxV=Math.max(...weights),range=maxV-minV||1;
  const xs=entries.map((_,i)=>PAD.left+(i/(Math.max(entries.length-1,1)))*cW);
  const ys=entries.map(e=>PAD.top+cH-(((e.maxWeight-minV)/range)*cH));
  let path=`M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for(let i=1;i<xs.length;i++)path+=` L${xs[i].toFixed(1)},${ys[i].toFixed(1)}`;
  const areaPath=path+` L${xs[xs.length-1].toFixed(1)},${PAD.top+cH} L${xs[0].toFixed(1)},${PAD.top+cH} Z`;
  const dots=xs.map((x,i)=>`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="3" fill="var(--accent)" stroke="var(--bg)" stroke-width="1.5"/>${(i===0||i===xs.length-1||entries.length<=6)?`<text x="${x.toFixed(1)}" y="${(ys[i]-5).toFixed(1)}" text-anchor="middle" font-size="8" fill="var(--accent)" font-family="JetBrains Mono,monospace">${weights[i]}</text>`:''}`).join('');
  const xLabels=xs.map((x,i)=>(entries.length<=6||i===0||i===entries.length-1)?`<text x="${x.toFixed(1)}" y="${(H-4).toFixed(1)}" text-anchor="middle" font-size="7" fill="var(--muted2)" font-family="JetBrains Mono,monospace">${entries[i].week.slice(5)}</text>`:'').join('');
  const uid='pg'+(id||'x').replace(/[^a-z0-9]/gi,'');
  return`<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:200px"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".18"/><stop offset="100%" stop-color="var(--accent)" stop-opacity=".01"/></linearGradient></defs><path d="${areaPath}" fill="url(#${uid})"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>${dots}${xLabels}</svg>`;
}


