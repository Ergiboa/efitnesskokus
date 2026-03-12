// ══════════════════════════════════════════════════════
//  RENDER: DB
// ══════════════════════════════════════════════════════
function renderDB(){
  const q=(document.getElementById('db-search')?.value||'').toLowerCase();
  const coach=isCoachView();
  const rows=[...Object.keys(DB)].filter(k=>k.includes(q)).sort().map(k=>{
    const e=DB[k];
    if(coach) return`<tr>
      <td><input value="${k}" onchange="renDB('${k}',this.value)"></td>
      <td><select onchange="updDB('${k}','base',this.value)">${['100g','100ml','1ud'].map(b=>`<option ${e.base===b?'selected':''}>${b}</option>`).join('')}</select></td>
      <td><input type="number" value="${e.kcal}" onchange="updDB('${k}','kcal',+this.value)"></td>
      <td><input type="number" value="${e.prot}" onchange="updDB('${k}','prot',+this.value)"></td>
      <td><input type="number" value="${e.carb}" onchange="updDB('${k}','carb',+this.value)"></td>
      <td><input type="number" value="${e.fat}" onchange="updDB('${k}','fat',+this.value)"></td>
      <td><input type="number" value="${e.fib}" onchange="updDB('${k}','fib',+this.value)"></td>
      <td></td><td><button class="btn danger sm" onclick="delDB('${k}')">✕</button></td>
    </tr>`;
    return`<tr>
      <td style="font-size:12px;font-family:'Syne',sans-serif;font-weight:600">${k}</td>
      <td style="color:var(--muted2);font-size:11px">${e.base}</td>
      <td style="color:var(--accent3)">${e.kcal}</td>
      <td style="color:var(--accent)">${e.prot}</td>
      <td style="color:var(--accent2)">${e.carb}</td>
      <td style="color:var(--orange)">${e.fat}</td>
      <td style="color:var(--purple)">${e.fib}</td>
      <td></td><td></td>
    </tr>`;
  }).join('')||`<tr><td colspan="9" style="color:var(--muted2);text-align:center;padding:14px">Sin resultados</td></tr>`;
  document.getElementById('db-body').innerHTML=rows;
}
window.updDB=(k,f,v)=>{if(!DB[k])DB[k]={base:'100g',kcal:0,prot:0,carb:0,fat:0,fib:0};DB[k][f]=v;};
window.renDB=(ok,nk)=>{nk=nk.toLowerCase().trim();if(!nk||nk===ok)return;DB[nk]=DB[ok];delete DB[ok];renderDB();};
window.delDB=(k)=>{if(confirm(`Eliminar "${k}"?`)){delete DB[k];renderDB();}};
window.addDBRow=()=>{const n=prompt('Nombre del producto:');if(!n)return;const k=n.toLowerCase().trim();if(DB[k]){toast('Ya existe en la DB');renderDB();return;}DB[k]={base:'100g',kcal:0,prot:0,carb:0,fat:0,fib:0};renderDB();toast(`✓ "${k}" añadido`);};
window.saveDBToServer=saveDBToServer;
window.exportJ=(t)=>{const data=t==='db'?DB:STOCK;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=t+'.json';a.click();};

// ══════════════════════════════════════════════════════
//  RENDER: DB MICROS PANEL
// ══════════════════════════════════════════════════════
const MICRO_FIELDS = ['vA','vC','vD','vE','vK','B1','B2','B3','B6','B12','fol','Ca','Fe','Zn','Mg','K'];
let _microsVisible = false;

window.toggleMicrosPanel = function(){
  _microsVisible = !_microsVisible;
  const panel = document.getElementById('micros-panel');
  const btn   = document.getElementById('btn-toggle-micros');
  const addBtn= document.getElementById('btn-add-micros');
  panel.style.display  = _microsVisible ? '' : 'none';
  btn.textContent      = _microsVisible ? '\u{1F648} Ocultar vitaminas' : '\u{1F441} Mostrar vitaminas';
  addBtn.style.display = _microsVisible ? '' : 'none';
  if(_microsVisible) renderMicrosTable();
};

function renderMicrosTable(){
  const q=(document.getElementById('micros-search')?.value||'').toLowerCase();
  const allKeys = [...new Set([...Object.keys(DB), ...Object.keys(MICROS_DB)])].sort().filter(k=>k.includes(q));
  const tbody = document.getElementById('micros-body');
  if(!tbody) return;
  if(allKeys.length===0){tbody.innerHTML='<tr><td colspan="18" style="color:var(--muted2);text-align:center;padding:12px">Sin resultados</td></tr>';return;}
  tbody.innerHTML = allKeys.map(k=>{
    const m = MICROS_DB[k] || {};
    const fields = MICRO_FIELDS.map(f=>`<td><input type="number" step="0.01" value="${m[f]??''}" placeholder="0" style="width:46px;padding:2px 3px;font-size:10px;background:var(--bg2);border:1px solid var(--border);border-radius:3px;color:var(--text)" onchange="updMicro('${k}','${f}',+this.value)"></td>`).join('');
    const hasMicro = Object.keys(m).length > 0;
    const bg = hasMicro ? '' : 'opacity:0.5';
    return `<tr style="${bg}"><td style="font-size:11px;min-width:130px;padding:4px 6px">${k}</td>${fields}<td><button class="btn ghost sm" style="font-size:9px;padding:2px 5px" onclick="clearMicro('${k}')">✕</button></td></tr>`;
  }).join('');
}
window.renderMicrosTable = renderMicrosTable;
window.updMicro = (k,f,v)=>{if(!MICROS_DB[k])MICROS_DB[k]={};MICROS_DB[k][f]=v;};
window.clearMicro = (k)=>{if(confirm('Borrar micros de "'+k+'"?')){delete MICROS_DB[k];renderMicrosTable();}};
window.addMicrosRow = ()=>{
  const n=prompt('Nombre del producto (debe coincidir con el ingrediente):');
  if(!n)return;
  const k=n.toLowerCase().trim();
  if(!MICROS_DB[k]) MICROS_DB[k]={vA:0,vC:0,vD:0,vE:0,vK:0,B1:0,B2:0,B3:0,B6:0,B12:0,fol:0,Ca:0,Fe:0,Zn:0,Mg:0,K:0};
  renderMicrosTable();
  toast('Fila creada para "'+k+'"');
};

// ══════════════════════════════════════════════════════
//  RENDER: COMPRA
// ══════════════════════════════════════════════════════
function estCost(k,qty,u,s){
  const pr=PRICES[k];if(!pr)return null;
  const p=pr[s];if(p===null||p===undefined)return null;
  const b=pr.base||'';let pq=1,pu='ud';
  const m=b.match(/^(\d+(?:\.\d+)?)\s*(g|ml|kg|L|ud|l)?/i);
  if(m){pq=parseFloat(m[1]);pu=(m[2]||'ud').toLowerCase();
    if(pu==='kg'){pq*=1000;pu='g';}if(pu==='l'){pq*=1000;pu='ml';}}
  const packs=(pu!=='ud'&&(u==='g'||u==='ml'))?Math.ceil(qty/pq):1;
  return+(packs*p).toFixed(2);
}
function renderCompra(){
  const COMPRA=getCompraList();
  const soloFalta=document.getElementById('chk-solo-falta')?.checked||false;
  let rows='';
  const totals={merc:0,lidl:0,carrefour:0,dia:0,eroski:0};
  COMPRA.forEach((item,i)=>{
    const k=item.p,pr=PRICES[k],stk=STOCK[k]||{qty:0,u:item.u};
    const needed=Math.max(0,+(item.qty-stk.qty).toFixed(3));
    if(soloFalta&&needed<=0)return;
    // filter by selected super
    if(currentSuperTab!=='all'&&currentSuperTab!=='pendientes'){
      if(!pr||pr[currentSuperTab]===null||pr[currentSuperTab]===undefined)return;
    }
    if(currentSuperTab==='pendientes'&&pr)return;
    // stock display
    const nTxt=needed<=0
      ?`<span class="stock-ok">✓ OK</span>`
      :`<span class="${stk.qty>0?'stock-low':'stock-empty'}">${needed.toFixed(0)} ${item.u}</span>`;
    const sDisp=`<input class="stock-input" type="number" min="0" value="${stk.qty}" onchange="updStock('${k}','${item.u}',+this.value)">`;
    // compute costs per super
    const costs={};
    SUPERS.forEach(s=>{
      if(needed>0){const c=estCost(k,needed,item.u,s);costs[s]=c;if(c)totals[s]+=c;}
      else{costs[s]=null;}
    });
    const validCosts=SUPERS.map(s=>costs[s]).filter(v=>v!==null&&v>0);
    const minCost=validCosts.length?Math.min(...validCosts):null;
    // build price cells per super
    const superCells=SUPERS.map(s=>{
      const unitP=pr?pr[s]:null;
      if(unitP===null||unitP===undefined) return `<td style="color:var(--muted);text-align:center;font-size:10px">—</td>`;
      const isBest=minCost!==null&&costs[s]===minCost;
      const col=SUPER_COLORS[s];
      if(needed<=0) return `<td style="text-align:center"><span class="price-chip" style="color:${col};font-size:9px">${unitP}€</span></td>`;
      return `<td style="text-align:center"><span class="price-chip ${isBest?'cheapest':'normal'}" style="${isBest?'':'color:'+col}">${costs[s]!==null?costs[s]+'€':'—'}<br><span style="opacity:.55;font-size:8px">(${unitP}€/u)</span></span></td>`;
    }).join('');
    // best super label
    let bestLabel='—';
    if(minCost!==null){
      const bs=SUPERS.find(s=>costs[s]===minCost);
      if(bs) bestLabel=`<span style="color:${SUPER_COLORS[bs]};font-weight:700;font-family:'Syne',sans-serif;font-size:10px">${SUPER_LABELS[bs]}<br><span style="font-size:11px">${minCost}€</span></span>`;
    }
    const chk=CHECKED[i]||false;
    rows+=`<tr style="${chk?'opacity:.38;text-decoration:line-through':''}">
      <td><input type="checkbox" ${chk?'checked':''} onchange="togCheck(${i},this.checked)" style="width:14px;height:14px;cursor:pointer;accent-color:var(--accent)"></td>
      <td style="font-family:'Syne',sans-serif;font-weight:600;font-size:11px">${item.p}</td>
      <td style="color:var(--muted2);text-align:center">${item.qty.toFixed(0)} ${item.u}</td>
      <td><span style="display:flex;align-items:center;gap:3px">${sDisp}<span style="color:var(--muted2);font-size:10px">${item.u}</span></span></td>
      <td>${nTxt}</td>
      ${superCells}
      <td>${bestLabel}</td>
    </tr>`;
  });
  document.getElementById('compra-body').innerHTML=rows||`<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--muted2)">Sin ingredientes en la dieta</td></tr>`;
  // update totals bar
  const vals=SUPERS.map(s=>totals[s]).filter(v=>v>0);
  const minTotal=vals.length?Math.min(...vals):null;
  SUPERS.forEach(s=>{
    const el=document.getElementById('total-'+s);
    if(el) el.textContent=totals[s]>0?totals[s].toFixed(2)+'€':'—';
  });
  document.getElementById('total-global').textContent=minTotal?minTotal.toFixed(2)+'€':'—';
  // highlight best super box
  document.querySelectorAll('.price-total-bar .price-box').forEach(b=>b.classList.remove('best-super'));
  if(minTotal){
    const bs=SUPERS.find(s=>Math.abs(totals[s]-minTotal)<0.001);
    const el=document.getElementById('total-'+bs);
    if(el) el.closest('.price-box').classList.add('best-super');
  }
}
window.togCheck=(i,v)=>{CHECKED[i]=v;renderCompra();};
window.resetChecked=()=>{CHECKED={};renderCompra();};
window.showSuperTab=(n,el)=>{currentSuperTab=n;document.querySelectorAll('.super-tab').forEach(b=>b.classList.remove('active'));if(el)el.classList.add('active');renderCompra();};
window.onSuperDropdown=(val)=>{currentSuperTab=val;renderCompra();};

// ══════════════════════════════════════════════════════
//  RENDER: STOCK & COOK
// ══════════════════════════════════════════════════════
function renderRecipes(){
  const recs=[];
  Object.entries(DIET).forEach(([day,dayObj])=>{MEALS_ORDER.forEach(meal=>{const its=(dayObj[meal]||[]).filter(i=>i.p);if(its.length)recs.push({id:`${day}_${meal}`,day,meal,items:its});});});
  const COOKED=(JSON.parse(localStorage.getItem(`nc_cooked_${currentClientId}_${THIS_WEEK}`)||'{}'));
  const total=recs.length,done=recs.filter(r=>COOKED[r.id]).length,pct=total?Math.round(done/total*100):0;
  document.getElementById('week-badge').textContent=`Sem ${THIS_WEEK}`;
  document.getElementById('week-progress').innerHTML=`<div class="week-prog"><div class="wp-stat"><div class="wps-val">${done}</div><div class="wps-lbl">Cocinadas</div></div><div class="wp-stat"><div class="wps-val" style="color:var(--muted2)">${total-done}</div><div class="wps-lbl">Pendientes</div></div><div class="wp-bigbar"><div class="wp-bigfill" style="width:${pct}%"></div></div><div class="wp-stat" style="text-align:right"><div class="wps-val" style="color:var(--accent2)">${pct}%</div><div class="wps-lbl">Hecho</div></div></div>`;
  const byDay={};Object.keys(DIET).forEach(d=>{byDay[d]=[];});
  recs.forEach(r=>{if(byDay[r.day])byDay[r.day].push(r);});
  let html='';
  const DIET_DAY_ORDER=['LUNES','MARTES','MIERCOLES','MIÉRCOLES','JUEVES','VIERNES','SABADO','SÁBADO','DOMINGO','LUN','MAR','MIE','MIÉ','JUE','VIE','SAB','SÁB','DOM'];
  const norm=s=>s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const sortedDays=Object.entries(byDay).sort(([a],[b])=>{const ia=DIET_DAY_ORDER.findIndex(d=>d===norm(a));const ib=DIET_DAY_ORDER.findIndex(d=>d===norm(b));return(ia===-1?99:ia)-(ib===-1?99:ib);});
  sortedDays.forEach(([day,dr])=>{
    if(!dr.length)return;
    const dd=dr.filter(r=>COOKED[r.id]).length,dp=Math.round(dd/dr.length*100);
    const mls=dr.map(r=>{const cooked=!!COOKED[r.id];const chips=r.items.map(i=>`<span class="rc-chip"><span class="cq">${i.qty}${i.u==='ud'?'':i.u}</span> ${i.p}</span>`).join('');const btns=cooked?`<button class="rc-undo-btn" onclick="uncook('${r.id}')">↺</button>`:`<button class="rc-cook-btn" onclick="cook('${r.id}')">🍳 Cocinar</button>`;return`<div class="recipe-card ${cooked?'cooked':''}"><div class="rc-head"><span class="rc-label">${MEAL_LABELS[r.meal]||r.meal}</span><div style="display:flex;align-items:center;gap:5px">${btns}</div></div><div class="rc-items">${chips}</div></div>`;}).join('');
    html+=`<div class="day-recipe-block"><div class="day-recipe-head"><h3>${day}</h3><span style="font-size:10px;color:var(--muted2)">${dd}/${dr.length}</span><div class="day-cook-bar"><div class="day-cook-fill" style="width:${dp}%"></div></div></div><div class="meals-list">${mls}</div></div>`;
  });
  document.getElementById('recipes-grid').innerHTML=html;
}
window.cook=(id)=>{const k=`nc_cooked_${currentClientId}_${THIS_WEEK}`;const C=JSON.parse(localStorage.getItem(k)||'{}');if(C[id])return;const[day,meal]=id.split('_');(DIET[day]?.[meal]||[]).filter(i=>i.p).forEach(i=>{const pk=i.p.toLowerCase().trim();const cur=STOCK[pk]?STOCK[pk].qty:0;STOCK[pk]={qty:Math.max(0,+(cur-i.qty).toFixed(3)),u:i.u};});C[id]=true;localStorage.setItem(k,JSON.stringify(C));saveStockToServer();renderRecipes();renderStockSidebar();renderCompra();};
window.uncook=(id)=>{if(!confirm('¿Deshacer?'))return;const k=`nc_cooked_${currentClientId}_${THIS_WEEK}`;const C=JSON.parse(localStorage.getItem(k)||'{}');const[day,meal]=id.split('_');(DIET[day]?.[meal]||[]).filter(i=>i.p).forEach(i=>{const pk=i.p.toLowerCase().trim();const cur=STOCK[pk]?STOCK[pk].qty:0;STOCK[pk]={qty:+(cur+i.qty).toFixed(3),u:i.u};});delete C[id];localStorage.setItem(k,JSON.stringify(C));saveStockToServer();renderRecipes();renderStockSidebar();renderCompra();};
window.confirmResetWeek=()=>{if(!confirm('¿Resetear semana?'))return;localStorage.removeItem(`nc_cooked_${currentClientId}_${THIS_WEEK}`);renderRecipes();toast('Semana reseteada ✓');};
function renderStockSidebar(){
  const COMPRA=getCompraList();const q=(document.getElementById('stock-search')?.value||'').toLowerCase();
  const c=document.getElementById('stock-sidebar');if(!c)return;
  c.innerHTML=COMPRA.filter(item=>item.p.includes(q)).map(item=>{const k=item.p,stk=STOCK[k]||{qty:0,u:item.u},pct=Math.min(100,item.qty>0?Math.round(stk.qty/item.qty*100):0);const bc=pct>=80?'var(--accent)':pct>=40?'var(--accent3)':'var(--red)';const cls=pct>=100?'stock-ok':pct>0?'stock-low':'stock-empty';return`<div class="inv-item"><div class="inv-name">${item.p}</div><div class="inv-bar-wrap"><div class="inv-bar" style="width:${pct}%;background:${bc}"></div></div><input class="inv-input" type="number" min="0" value="${stk.qty}" onchange="updStock('${k}','${item.u}',+this.value)"><span class="${cls}" style="font-size:10px;font-weight:700;min-width:18px;text-align:right">${pct>=100?'✓':pct+'%'}</span></div>`;}).join('')||`<div style="color:var(--muted2);padding:12px;text-align:center">Sin resultados</div>`;
}
window.updStock=(k,u,v)=>{STOCK[k]={qty:Math.max(0,v),u};saveStockToServer();renderCompra();renderStockSidebar();};

