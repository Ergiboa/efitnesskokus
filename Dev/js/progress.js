// ── RENDER ──
function renderProgress() {
  renderProgressStats();
  renderProgressAnalysis();
  renderProgressChart();
  renderProgressHistory();
}

function renderProgressStats() {
  if (!PROGRESS.length) {
    ['ps-weight','ps-fat','ps-waist'].forEach(id => {
      document.getElementById(id).textContent = '—';
      document.getElementById(id).className = 'ps-val';
    });
    document.getElementById('ps-count').textContent = '0';
    document.getElementById('ps-count-sub').textContent = 'Sin datos aún';
    document.getElementById('ps-weight-sub').textContent = '—';
    document.getElementById('ps-fat-sub').textContent = '—';
    document.getElementById('ps-waist-sub').textContent = '—';
    return;
  }

  const last = PROGRESS[PROGRESS.length - 1];
  const first = PROGRESS[0];

  // Weight
  if (last.weight !== null) {
    document.getElementById('ps-weight').textContent = last.weight + ' kg';
    const wDiff = PROGRESS.length > 1 ? +(last.weight - first.weight).toFixed(1) : null;
    const wEl = document.getElementById('ps-weight');
    if (wDiff !== null) {
      wEl.className = 'ps-val ' + (wDiff > 0 ? 'up' : wDiff < 0 ? 'dn' : 'eq');
      document.getElementById('ps-weight-sub').textContent =
        (wDiff > 0 ? '+' : '') + wDiff + ' kg desde inicio';
    } else {
      wEl.className = 'ps-val';
      document.getElementById('ps-weight-sub').textContent = 'Primer registro';
    }
  } else {
    document.getElementById('ps-weight').textContent = '—';
    document.getElementById('ps-weight-sub').textContent = 'No registrado';
  }

  // Fat %
  const lastFat = [...PROGRESS].reverse().find(e => e.fat !== null);
  if (lastFat) {
    document.getElementById('ps-fat').textContent = lastFat.fat + ' %';
    const firstFat = PROGRESS.find(e => e.fat !== null);
    if (firstFat && firstFat !== lastFat) {
      const fd = +(lastFat.fat - firstFat.fat).toFixed(1);
      document.getElementById('ps-fat').className = 'ps-val ' + (fd < 0 ? 'up' : fd > 0 ? 'dn' : 'eq');
      document.getElementById('ps-fat-sub').textContent = (fd > 0 ? '+' : '') + fd + '% desde inicio';
    } else {
      document.getElementById('ps-fat').className = 'ps-val';
      document.getElementById('ps-fat-sub').textContent = 'Primer registro';
    }
  } else {
    document.getElementById('ps-fat').textContent = '—';
    document.getElementById('ps-fat').className = 'ps-val';
    document.getElementById('ps-fat-sub').textContent = 'No registrado';
  }

  // Waist
  const lastWaist = [...PROGRESS].reverse().find(e => e.waist !== null);
  if (lastWaist) {
    document.getElementById('ps-waist').textContent = lastWaist.waist + ' cm';
    const firstWaist = PROGRESS.find(e => e.waist !== null);
    if (firstWaist && firstWaist !== lastWaist) {
      const wd = +(lastWaist.waist - firstWaist.waist).toFixed(1);
      document.getElementById('ps-waist').className = 'ps-val ' + (wd < 0 ? 'up' : wd > 0 ? 'dn' : 'eq');
      document.getElementById('ps-waist-sub').textContent = (wd > 0 ? '+' : '') + wd + ' cm desde inicio';
    } else {
      document.getElementById('ps-waist').className = 'ps-val';
      document.getElementById('ps-waist-sub').textContent = 'Primer registro';
    }
  } else {
    document.getElementById('ps-waist').textContent = '—';
    document.getElementById('ps-waist').className = 'ps-val';
    document.getElementById('ps-waist-sub').textContent = 'No registrado';
  }

  // Count
  document.getElementById('ps-count').textContent = PROGRESS.length;
  const span = PROGRESS.length > 1
    ? Math.round((new Date(last.date) - new Date(first.date)) / 86400000)
    : 0;
  document.getElementById('ps-count-sub').textContent = span > 0 ? `${span} días seguimiento` : 'Inicio hoy';
}

function renderProgressAnalysis() {
  const card = document.getElementById('prg-analysis');
  if (PROGRESS.length < 2) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const first = PROGRESS[0];
  const last  = PROGRESS[PROGRESS.length - 1];

  const wChange  = last.weight !== null && first.weight !== null ? +(last.weight - first.weight).toFixed(1) : null;
  const fChange  = (() => { const lf = [...PROGRESS].reverse().find(e=>e.fat!==null); const ff = PROGRESS.find(e=>e.fat!==null); return (lf&&ff&&lf!==ff) ? +(lf.fat-ff.fat).toFixed(1) : null; })();
  const waChange = (() => { const lw = [...PROGRESS].reverse().find(e=>e.waist!==null); const fw = PROGRESS.find(e=>e.waist!==null); return (lw&&fw&&lw!==fw) ? +(lw.waist-fw.waist).toFixed(1) : null; })();
  const armChange = (() => { const la = [...PROGRESS].reverse().find(e=>e.arm!==null); const fa = PROGRESS.find(e=>e.arm!==null); return (la&&fa&&la!==fa) ? +(la.arm-fa.arm).toFixed(1) : null; })();

  // Determine phase
  let icon='📊', title='Seguimiento activo', desc='Continúa registrando para obtener más análisis.', borderColor='var(--border2)';

  if (wChange !== null) {
    const wUp = wChange > 0.3;
    const wDn = wChange < -0.3;
    const waistDn = waChange !== null && waChange < -0.5;
    const waistUp = waChange !== null && waChange > 0.5;
    const armUp = armChange !== null && armChange > 0.3;
    const fatDn = fChange !== null && fChange < -0.5;
    const fatUp = fChange !== null && fChange > 0.5;

    if (wUp && (armUp || fatDn)) {
      icon='💪'; title='Volumen limpio'; desc='Estás ganando peso y mejorando masa muscular. Las medidas de extremidades suben o la grasa baja. ¡Buen trabajo!';
      borderColor='rgba(194,242,79,.3)';
    } else if (wUp && waistUp && !armUp) {
      icon='⚠️'; title='Volumen sucio'; desc='Estás ganando peso pero la cintura sube más que las extremidades. Revisa el déficit/superávit calórico.';
      borderColor='rgba(242,154,64,.3)';
    } else if (wDn && waistDn) {
      icon='🔥'; title='Definición activa'; desc='Estás perdiendo peso y la cintura disminuye. Si las medidas musculares se mantienen, estás preservando masa muscular.';
      borderColor='rgba(79,242,194,.3)';
    } else if (!wUp && !wDn && (waistDn || armUp)) {
      icon='⚡'; title='Recomposición corporal'; desc='El peso se mantiene estable pero mejoras en medidas indican recomposición: ganando músculo y perdiendo grasa simultáneamente.';
      borderColor='rgba(176,64,242,.3)';
    } else if (wDn && !waistDn && fatUp) {
      icon='⚠️'; title='Pérdida muscular posible'; desc='El peso baja pero la cintura no mejora. Asegúrate de consumir suficiente proteína y mantener el entreno de fuerza.';
      borderColor='rgba(242,80,80,.3)';
    } else if (wUp) {
      icon='📈'; title='Ganando peso'; desc='Estás en fase de volumen. Añade más medidas de extremidades o % grasa para un análisis más preciso.';
      borderColor='rgba(194,242,79,.2)';
    } else if (wDn) {
      icon='📉'; title='Perdiendo peso'; desc='Estás en fase de definición. Registra la cintura y % grasa regularmente para confirmar que es grasa y no músculo.';
      borderColor='rgba(79,242,194,.2)';
    }
  }

  document.getElementById('prg-analysis-status').innerHTML = `
    <div class="analysis-icon">${icon}</div>
    <div>
      <div class="analysis-title">${title}</div>
      <div class="analysis-desc">${desc}</div>
    </div>`;
  document.getElementById('prg-analysis-status').style.borderColor = borderColor;

  // Mini bars
  const bars = [];
  if (wChange !== null) bars.push({ lbl: 'Peso', val: wChange, unit: 'kg', good: null });
  if (fChange !== null) bars.push({ lbl: '% Grasa', val: fChange, unit: '%', good: 'dn' });
  if (waChange !== null) bars.push({ lbl: 'Cintura', val: waChange, unit: 'cm', good: 'dn' });
  if (armChange !== null) bars.push({ lbl: 'Brazo', val: armChange, unit: 'cm', good: 'up' });

  document.getElementById('prg-analysis-bars').innerHTML = bars.map(b => {
    const pct = Math.min(100, Math.abs(b.val) * 10);
    const isGood = b.good === null ? true : (b.good === 'dn' ? b.val < 0 : b.val > 0);
    const fillColor = b.val === 0 ? 'var(--muted)' : isGood ? 'var(--accent)' : 'var(--red)';
    const trendCls = b.val > 0 ? 'trend-up' : b.val < 0 ? 'trend-dn' : 'trend-eq';
    const arrow = b.val > 0 ? '↑' : b.val < 0 ? '↓' : '=';
    return `<div class="abar">
      <div class="abar-lbl">${b.lbl}</div>
      <div class="abar-track"><div class="abar-fill" style="width:${pct}%;background:${fillColor}"></div></div>
      <div class="abar-vals">
        <span class="abar-cur">${b.val > 0 ? '+' : ''}${b.val}${b.unit}</span>
        <span class="abar-trend ${trendCls}">${arrow}</span>
      </div>
    </div>`;
  }).join('');
}

// ── SVG LINE CHART ──
function renderProgressChart() {
  const area = document.getElementById('prg-chart-area');
  if (!area) return;

  // Pick dataset
  const datasets = {
    weight:   { key: 'weight',   label: 'Peso (kg)',     color: 'var(--accent3)', colorHex: '#f2d24f' },
    fat:      { key: 'fat',      label: '% Grasa',       color: 'var(--red)',     colorHex: '#f25050' },
    waist:    { key: 'waist',    label: 'Cintura (cm)',   color: 'var(--accent2)', colorHex: '#4ff2c2' },
    measures: null,
  };

  const entries = PROGRESS.filter(e => {
    if (currentChartTab === 'measures') return e.chest || e.arm || e.thigh || e.waist;
    return e[currentChartTab] !== null && e[currentChartTab] !== undefined;
  });

  if (entries.length < 1) {
    area.innerHTML = `<span>Sin datos para este gráfico</span>`;
    return;
  }

  const W = 500, H = 180;
  const PAD = { top: 15, right: 15, bottom: 30, left: 45 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  let lines = [];
  if (currentChartTab === 'measures') {
    const measureKeys = [
      { key: 'chest',    label: 'Pecho',    hex: '#c2f24f' },
      { key: 'arm',      label: 'Brazo',    hex: '#4ff2c2' },
      { key: 'thigh',    label: 'Muslo',    hex: '#b040f2' },
      { key: 'waist',    label: 'Cintura',  hex: '#f25050' },
    ];
    measureKeys.forEach(mk => {
      const pts = PROGRESS.filter(e => e[mk.key] !== null).map(e => ({ date: e.date, v: e[mk.key] }));
      if (pts.length > 0) lines.push({ pts, label: mk.label, hex: mk.hex });
    });
  } else {
    const ds = datasets[currentChartTab];
    const pts = entries.map(e => ({ date: e.date, v: e[ds.key] }));
    lines.push({ pts, label: ds.label, hex: ds.colorHex });
  }

  if (!lines.length || !lines.some(l => l.pts.length > 0)) {
    area.innerHTML = `<span>Sin datos para este gráfico</span>`;
    return;
  }

  // Scales
  const allVals = lines.flatMap(l => l.pts.map(p => p.v));
  const allDates = [...new Set(lines.flatMap(l => l.pts.map(p => p.date)))].sort();
  const minV = Math.min(...allVals), maxV = Math.max(...allVals);
  const vRange = maxV - minV || 1;
  const vPad = vRange * 0.12;
  const vMin = minV - vPad, vMax = maxV + vPad;

  const xScale = d => {
    const i = allDates.indexOf(d);
    return PAD.left + (allDates.length > 1 ? (i / (allDates.length - 1)) * cW : cW / 2);
  };
  const yScale = v => PAD.top + cH - ((v - vMin) / (vMax - vMin)) * cH;

  // Grid Y lines
  const yTicks = 4;
  let gridLines = '', yLabels = '';
  for (let i = 0; i <= yTicks; i++) {
    const v = vMin + (vMax - vMin) * (i / yTicks);
    const y = yScale(v);
    gridLines += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="#1e2122" stroke-width="1"/>`;
    yLabels += `<text x="${PAD.left - 5}" y="${y + 3}" text-anchor="end" class="axis-label">${v.toFixed(1)}</text>`;
  }

  // X labels (show max 6)
  let xLabels = '';
  const step = Math.max(1, Math.ceil(allDates.length / 6));
  allDates.forEach((d, i) => {
    if (i % step !== 0 && i !== allDates.length - 1) return;
    const x = xScale(d);
    const short = d.slice(5); // MM-DD
    xLabels += `<text x="${x}" y="${H - 5}" text-anchor="middle" class="axis-label">${short}</text>`;
  });

  // Lines + dots
  let pathsHtml = '';
  lines.forEach(line => {
    if (line.pts.length === 0) return;
    const pathD = line.pts.map((p, i) => {
      const x = xScale(p.date), y = yScale(p.v);
      return (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    // Area fill
    const firstX = xScale(line.pts[0].date), lastX = xScale(line.pts[line.pts.length - 1].date);
    const areaD = `${pathD} L${lastX.toFixed(1)},${(PAD.top + cH).toFixed(1)} L${firstX.toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;

    pathsHtml += `
      <path d="${areaD}" fill="${line.hex}" opacity="0.07"/>
      <path d="${pathD}" class="data-line" stroke="${line.hex}" stroke-width="2"/>`;

    // Dots
    line.pts.forEach(p => {
      const x = xScale(p.date).toFixed(1), y = yScale(p.v).toFixed(1);
      pathsHtml += `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--bg)" stroke="${line.hex}" stroke-width="2" class="data-dot"/>`;
    });
  });

  // Legend for multi-line
  let legendHtml = '';
  if (lines.length > 1) {
    legendHtml = lines.map(l =>
      `<span style="display:inline-flex;align-items:center;gap:4px;font-family:'Syne',sans-serif;font-size:10px;color:var(--muted2);margin-right:10px">
        <span style="width:16px;height:2px;background:${l.hex};display:inline-block;border-radius:1px"></span>${l.label}
      </span>`
    ).join('');
    legendHtml = `<div style="margin-bottom:8px;flex-wrap:wrap;display:flex">${legendHtml}</div>`;
  }

  area.innerHTML = `
    ${legendHtml}
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" style="height:${H}px">
      ${gridLines}${yLabels}${xLabels}
      ${pathsHtml}
    </svg>`;
}

function renderProgressHistory() {
  const tbody = document.getElementById('prg-history-body');
  if (!tbody) return;
  if (!PROGRESS.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="color:var(--muted2);text-align:center;padding:16px;font-family:'Syne',sans-serif">Sin registros todavía. Añade tu primer pesaje.</td></tr>`;
    return;
  }

  // Reverse order (newest first)
  const rows = [...PROGRESS].reverse();
  tbody.innerHTML = rows.map((entry, idx) => {
    const prevEntry = rows[idx + 1]; // older entry
    const wDiff = (entry.weight != null && prevEntry?.weight != null)
      ? +(entry.weight - prevEntry.weight).toFixed(1) : null;

    const diffBadge = wDiff === null ? '' :
      wDiff > 0 ? `<span class="badge-up">+${wDiff}</span>` :
      wDiff < 0 ? `<span class="badge-dn">${wDiff}</span>` :
      `<span class="badge-eq">0</span>`;

    const fmtDate = entry.date ? new Date(entry.date + 'T12:00:00').toLocaleDateString('es-ES', {day:'2-digit',month:'short'}) : '—';

    return `<tr>
      <td style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px">${fmtDate}</td>
      <td style="color:var(--accent3);font-weight:700">${entry.weight ?? '—'} ${entry.weight ? 'kg' : ''}</td>
      <td>${diffBadge}</td>
      <td style="color:var(--muted2)">${entry.fat !== null ? entry.fat + '%' : '—'}</td>
      <td>${entry.waist !== null ? entry.waist + ' cm' : '—'}</td>
      <td>${entry.chest !== null ? entry.chest + ' cm' : '—'}</td>
      <td>${entry.arm !== null ? entry.arm + ' cm' : '—'}</td>
      <td>${entry.thigh !== null ? entry.thigh + ' cm' : '—'}</td>
      <td style="color:var(--muted2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${entry.notes||''}">${entry.notes || '—'}</td>
      <td><button class="btn danger xs" onclick="deleteProgressEntry('${entry.id}')">✕</button></td>
    </tr>`;
  }).join('');
}

// ══════════════════════════════════════════════════════
//  PROFILE + WEIGHT
// ══════════════════════════════════════════════════════
let weightLog = [];

function initProfilePanel(){
  if(!currentProfile) return;
  const ni = document.getElementById('profile-name-inp');
  if(ni) ni.value = currentProfile.full_name || '';
  const ai = document.getElementById('profile-avatar-initials');
  if(ai) ai.textContent = (currentProfile.full_name||currentProfile.email||'?')[0].toUpperCase();
  // Restore avatar
  const savedUrl = localStorage.getItem('nc_avatar_'+currentUser.id);
  if(savedUrl) applyAvatar(savedUrl);

  const isSelf = currentClientId === currentUser?.id;
  const clientCard = document.getElementById('client-profile-card');

  if(isCoachView() && !isSelf){
    // Coach viendo un cliente → mostrar panel del cliente, ocultar su propio peso/progreso
    const ownSection = document.querySelector('#panel-perfil > div[style*="grid-template-columns:340px"]');
    if(ownSection) ownSection.style.display = 'none';
    if(clientCard) clientCard.style.display = 'block';

    const client = allClients.find(c=>c.id===currentClientId);
    const cName = client?.full_name || client?.email || '—';

    const nm  = document.getElementById('client-profile-name');   if(nm)  nm.textContent  = cName;
    const fn  = document.getElementById('client-profile-fullname'); if(fn) fn.textContent = cName;
    const em  = document.getElementById('client-profile-email');  if(em)  em.textContent  = client?.email || '—';
    const av  = document.getElementById('client-profile-avatar'); if(av)  av.textContent  = (cName[0]||'?').toUpperCase();
    const pn  = document.getElementById('client-personal-notes-view');
    if(pn) pn.textContent = coachClientNotes.personal || personalNotes || 'Sin notas.';
    const cf  = document.getElementById('client-coach-feedback-view');
    if(cf) cf.textContent = coachFeedback || 'Sin feedback publicado.';

    // Renderizar peso del cliente
    try{ weightLog = JSON.parse(localStorage.getItem('nc_weight_'+currentClientId)||'[]'); }
    catch(e){ weightLog=[]; }
    renderClientWeightChart();

    // Cargar progreso del cliente
    loadProgressFromServer().then(()=>{ initProgressForm(); renderProgress(); });
  } else {
    // Coach viéndose a sí mismo o es cliente
    if(clientCard) clientCard.style.display = 'none';
    const ownSection = document.querySelector('#panel-perfil > div[style*="grid-template-columns:340px"]');
    if(ownSection) ownSection.style.display = '';
    try{ weightLog = JSON.parse(localStorage.getItem('nc_weight_'+currentUser.id)||'[]'); }
    catch(e){ weightLog=[]; }
    renderWeightLog();
    loadProgressFromServer().then(()=>{ initProgressForm(); renderProgress(); });
  }
}

function renderClientWeightChart(){
  const chart = document.getElementById('client-weight-chart');
  const list  = document.getElementById('client-weight-list');
  if(!chart) return;
  if(!weightLog.length){
    chart.innerHTML=`<div style="color:var(--muted2);font-size:10px;text-align:center;width:100%;padding:6px">Sin registros</div>`;
    if(list) list.innerHTML=''; return;
  }
  const recent = weightLog.slice(-20);
  const min = Math.min(...recent.map(e=>e.w))-0.5;
  const max = Math.max(...recent.map(e=>e.w))+0.5;
  const range = max-min||1;
  chart.innerHTML = recent.map(e=>{
    const pct = Math.round(((e.w-min)/range)*90);
    const d   = e.date.slice(5);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;flex:1;min-width:18px">
      <span style="font-size:7px;color:var(--accent);font-weight:700">${e.w}</span>
      <div style="width:100%;background:var(--border);border-radius:2px;height:50px;display:flex;align-items:flex-end">
        <div style="width:100%;height:${pct}%;background:var(--accent2);border-radius:2px"></div>
      </div>
      <span style="font-size:6px;color:var(--muted2)">${d}</span>
    </div>`;
  }).join('');
  if(list) list.innerHTML = [...weightLog].reverse().slice(0,6).map(e=>{
    const d = new Date(e.date+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'});
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg2);border-radius:5px">
      <span style="color:var(--muted2);font-size:10px">${d}</span>
      <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--accent);font-size:13px">${e.w} kg</span>
    </div>`;
  }).join('');
}

function applyAvatar(url){
  const img = document.getElementById('profile-avatar-img');
  const ini = document.getElementById('profile-avatar-initials');
  if(img){ img.src=url; img.style.display='block'; }
  if(ini) ini.style.display='none';
  // Also update sidebar avatar
  const av = document.getElementById('sb-avatar');
  if(av && url){
    av.style.backgroundImage=`url(${url})`;
    av.style.backgroundSize='cover';
    av.style.backgroundPosition='center';
    av.textContent='';
  }
}

window.uploadAvatar = (input) => {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ toast('Imagen demasiado grande (máx 2MB)'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target.result;
    localStorage.setItem('nc_avatar_'+currentUser.id, url);
    applyAvatar(url);
    toast('✓ Foto de perfil actualizada');
  };
  reader.readAsDataURL(file);
};

window.saveProfileName = async () => {
  const name = document.getElementById('profile-name-inp')?.value?.trim();
  if(!name){ toast('Introduce un nombre'); return; }
  const {error} = await sb.from('profiles').update({full_name:name}).eq('id',currentUser.id);
  if(error){ toast('Error: '+error.message); return; }
  currentProfile.full_name = name;
  document.getElementById('sb-username').textContent = name;
  const av = document.getElementById('sb-avatar');
  if(av && !av.style.backgroundImage){
    av.textContent = name[0].toUpperCase();
  }
  toast('✓ Nombre guardado');
};

window.changePassword = async () => {
  const pass = document.getElementById('profile-newpass')?.value;
  if(!pass||pass.length<8){ toast('Mínimo 8 caracteres'); return; }
  const {error} = await sb.auth.updateUser({password:pass});
  if(error){ toast('Error: '+error.message); return; }
  document.getElementById('profile-newpass').value='';
  toast('✓ Contraseña actualizada');
};

window.deleteAccount = async () => {
  if(!confirm('⚠️ ¿Eliminar tu cuenta? Esta acción NO se puede deshacer.')) return;
  const confirmTxt = prompt('Escribe ELIMINAR para confirmar:');
  if(confirmTxt !== 'ELIMINAR'){ toast('Cancelado'); return; }
  try{
    await sb.from('client_diets').delete().eq('client_id',currentUser.id);
    await sb.from('training_logs').delete().eq('client_id',currentUser.id);
    await sb.from('client_stock').delete().eq('client_id',currentUser.id);
    await sb.from('client_notes').delete().eq('client_id',currentUser.id);
    await sb.from('profiles').delete().eq('id',currentUser.id);
    await sb.auth.signOut();
  }catch(e){}
  window.location.href='login.html';
};

window.logWeight = () => {
  const val = parseFloat(document.getElementById('weight-inp')?.value);
  if(isNaN(val)||val<30||val>300){ toast('Peso no válido'); return; }
  const today = new Date().toISOString().split('T')[0];
  weightLog = weightLog.filter(e=>e.date!==today);
  weightLog.push({date:today, w:val});
  weightLog.sort((a,b)=>a.date.localeCompare(b.date));
  localStorage.setItem('nc_weight_'+currentUser.id, JSON.stringify(weightLog));
  document.getElementById('weight-inp').value='';
  renderWeightLog();
  toast(`⚖️ ${val} kg registrado`);
};

window.removeWeight = (date) => {
  weightLog = weightLog.filter(e=>e.date!==date);
  localStorage.setItem('nc_weight_'+currentUser.id, JSON.stringify(weightLog));
  renderWeightLog();
};

function renderWeightLog(){
  const chart = document.getElementById('weight-chart');
  const list  = document.getElementById('weight-list');
  if(!chart||!list) return;
  if(!weightLog.length){
    chart.innerHTML=`<div style="color:var(--muted2);font-size:10px;text-align:center;width:100%;padding:6px">Sin registros aún</div>`;
    list.innerHTML=''; return;
  }
  const recent = weightLog.slice(-20);
  const min = Math.min(...recent.map(e=>e.w))-0.5;
  const max = Math.max(...recent.map(e=>e.w))+0.5;
  const range = max-min||1;
  chart.innerHTML = recent.map(e=>{
    const pct = Math.round(((e.w-min)/range)*90);
    const d   = e.date.slice(5);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;flex:1;min-width:18px">
      <span style="font-size:7px;color:var(--accent);font-weight:700">${e.w}</span>
      <div style="width:100%;background:var(--border);border-radius:2px;height:50px;display:flex;align-items:flex-end">
        <div style="width:100%;height:${pct}%;background:var(--accent2);border-radius:2px"></div>
      </div>
      <span style="font-size:6px;color:var(--muted2)">${d}</span>
    </div>`;
  }).join('');
  list.innerHTML = [...weightLog].reverse().slice(0,6).map(e=>{
    const d = new Date(e.date+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'});
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg2);border-radius:5px">
      <span style="color:var(--muted2);font-size:10px">${d}</span>
      <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--accent);font-size:13px">${e.w} kg</span>
      <button onclick="removeWeight('${e.date}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:0 2px">×</button>
    </div>`;
  }).join('');
}

