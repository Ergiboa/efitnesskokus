// ══════════════════════════════════════════════════════
//  RECIPE BANK — List + Full Editor
// ══════════════════════════════════════════════════════
function renderRecipeBank(){
  const list=document.getElementById('recipe-list-body');
  document.getElementById('recipe-count').textContent=RECIPES.length;
  const newBtnWrap=document.getElementById('recipe-new-btn-wrap');
  if(newBtnWrap) newBtnWrap.innerHTML=isCoachView()?'<button class="btn sm" onclick="newRecipe()">+ Nueva</button>':'';
  if(!list)return;
  list.innerHTML=RECIPES.map(r=>{
    const m=sumMac(r.items||[]);
    const isActive=r.id===currentRecipeId;
    return`<div style="display:flex;align-items:center;gap:7px;padding:8px 12px;border-bottom:1px solid var(--card2);cursor:pointer;${isActive?'background:rgba(194,242,79,.05);border-left:3px solid var(--accent)':''}" onclick="selectRecipe('${r.id}')">
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:600;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.name}</div>
        <div style="font-size:10px;color:var(--muted2);margin-top:1px">${(r.items||[]).length} ingredientes</div>
      </div>
      <span style="font-size:10px;color:var(--accent3);white-space:nowrap">${m.kcal}kcal</span>
    </div>`;
  }).join('')||`<div style="padding:14px;color:var(--muted2);font-size:11px;text-align:center">Sin recetas</div>`;
}

window.selectRecipe=(id)=>{
  currentRecipeId=id;
  renderRecipeBank();
  renderRecipeEditor();
};

function recMacBar(items) {
  const m = sumMac(items||[]);
  if (!m.kcal && !m.prot) return '';
  return `<div class="rec-macros-bar">
    <span style="color:var(--accent3);font-weight:700">${m.kcal} kcal</span>
    <span style="color:var(--accent)">P: ${m.prot}g</span>
    <span style="color:var(--accent2)">C: ${m.carb}g</span>
    <span style="color:var(--orange)">G: ${m.fat}g</span>
    <span style="color:var(--purple)">F: ${m.fib}g</span>
  </div>`;
}

function renderRecipeEditor(){
  const area=document.getElementById('recipe-editor-area');
  if(!currentRecipeId){
    area.innerHTML=`<div style="background:var(--card);border:1px solid var(--border);border-radius:9px;padding:14px;min-height:200px;display:flex;align-items:center;justify-content:center;color:var(--muted2);font-family:'Syne',sans-serif">Selecciona o crea una receta</div>`;
    return;
  }
  const r=RECIPES.find(x=>x.id===currentRecipeId);
  if(!r)return;

  const ingsHtml=(r.items||[]).map((ing,idx)=>`
    <div class="rec-ing-row" id="rec-ing-${r.id}-${idx}">
      <input class="ing-qty" type="number" min="0" value="${ing.qty}"
        onchange="updRecIng('${r.id}',${idx},'qty',+this.value)" style="width:50px">
      <select class="ing-unit" onchange="updRecIng('${r.id}',${idx},'u',this.value)">
        ${['g','ml','ud'].map(u=>`<option ${ing.u===u?'selected':''}>${u}</option>`).join('')}
      </select>
      <input class="ing-name" type="text" value="${ing.p}" placeholder="ingrediente..."
        autocomplete="off"
        onchange="updRecIng('${r.id}',${idx},'p',this.value)"
        oninput="showACDrop(this)"
        onblur="hideACDrop()"
        style="flex:1;min-width:0;background:var(--card2);border:1px solid var(--border);border-radius:4px;padding:3px 6px">
      <button class="ing-del" onclick="delRecIng('${r.id}',${idx})" style="flex-shrink:0">×</button>
    </div>`).join('');

  area.innerHTML=`<div class="rec-editor-wrap">
    <div class="rec-editor-head">
      <input class="rec-name-inp" type="text" value="${r.name.replace(/"/g,'&quot;')}"
        oninput="updRecName('${r.id}',this.value)" placeholder="Nombre de la receta...">
      <button class="btn danger sm" onclick="deleteRecipe('${r.id}')">🗑</button>
    </div>
    <div class="rec-editor-body">

      <div>
        <div class="rec-section-label">🥩 Ingredientes</div>
        <div id="rec-ings-${r.id}">${ingsHtml}</div>
        ${canEditRecipe?`<button class="add-ing-btn" style="margin-top:6px" onclick="addRecIng('${r.id}')">+ añadir ingrediente</button>`:''}
      </div>

      ${recMacBar(r.items)}

      <div>
        <div class="rec-section-label">📋 Notas de preparación</div>
        <textarea class="rec-notes-inp"
          placeholder="Notas de preparación..."
          ${canEditRecipe?`oninput="updRecNotes('${r.id}',this.value)"`:'readonly style="opacity:.8"'}>${(r.notes||'').replace(/</g,'&lt;')}</textarea>
      </div>

      <div class="rec-footer">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${(r.tags||[]).map(t=>`<span style="font-size:10px;padding:2px 7px;background:rgba(79,242,194,.08);border:1px solid rgba(79,242,194,.18);color:var(--accent2);border-radius:4px">${t}</span>`).join('')}
        </div>
        ${canEditRecipe?`<button class="btn sm" onclick="saveRecipeLocal('${r.id}')">💾 Guardar receta</button>`:''}
      </div>

    </div>
  </div>`;
}

// Recipe CRUD helpers
window.updRecName=(id,val)=>{
  const r=RECIPES.find(x=>x.id===id);
  if(!r)return;
  r.name=val;
  // Live update the list item name
  renderRecipeBank();
};

window.updRecNotes=(id,val)=>{
  const r=RECIPES.find(x=>x.id===id);
  if(r)r.notes=val;
};

window.updRecIng=(id,idx,field,val)=>{
  const r=RECIPES.find(x=>x.id===id);
  if(!r||!r.items[idx])return;
  r.items[idx][field]=val;
  // Refresh macro bar
  const bar=document.querySelector(`#recipe-editor-area .rec-macros-bar`);
  if(bar)bar.outerHTML=recMacBar(r.items);
  else {
    // Insert bar after ingredients section
    const area=document.getElementById('recipe-editor-area');
    const ingsSection=area?.querySelector(`#rec-ings-${id}`)?.parentElement;
    if(ingsSection){
      const existing=area.querySelector('.rec-macros-bar');
      const newBar=document.createElement('div');
      newBar.innerHTML=recMacBar(r.items);
      if(existing)existing.replaceWith(newBar.firstChild);
    }
  }
};

window.addRecIng=(id)=>{
  const r=RECIPES.find(x=>x.id===id);
  if(!r)return;
  if(!r.items)r.items=[];
  const idx=r.items.length;
  r.items.push({p:'',qty:100,u:'g'});
  const container=document.getElementById(`rec-ings-${id}`);
  if(container){
    const div=document.createElement('div');
    div.className='rec-ing-row';
    div.id=`rec-ing-${id}-${idx}`;
    div.innerHTML=`
      <input class="ing-qty" type="number" min="0" value="100"
        onchange="updRecIng('${id}',${idx},'qty',+this.value)" style="width:50px">
      <select class="ing-unit" onchange="updRecIng('${id}',${idx},'u',this.value)">
        <option>g</option><option>ml</option><option>ud</option>
      </select>
      <input class="ing-name" type="text" value="" placeholder="ingrediente..."
        autocomplete="off"
        onchange="updRecIng('${id}',${idx},'p',this.value)"
        oninput="showACDrop(this)"
        onblur="hideACDrop()"
        style="flex:1;min-width:0;background:var(--card2);border:1px solid var(--border);border-radius:4px;padding:3px 6px">
      <button class="ing-del" onclick="delRecIng('${id}',${idx})" style="flex-shrink:0">×</button>`;
    container.appendChild(div);
    div.querySelector('.ing-name').focus();
  }
};

window.delRecIng=(id,idx)=>{
  const r=RECIPES.find(x=>x.id===id);
  if(!r)return;
  r.items.splice(idx,1);
  renderRecipeEditor();
};

window.saveRecipeLocal=(id)=>{
  // Re-read any pending input values before save
  const r=RECIPES.find(x=>x.id===id);
  if(!r)return;
  // Read notes textarea (in case oninput missed something)
  const ta=document.querySelector(`#recipe-editor-area .rec-notes-inp`);
  if(ta)r.notes=ta.value;
  // Read name
  const ni=document.querySelector(`#recipe-editor-area .rec-name-inp`);
  if(ni)r.name=ni.value.trim()||r.name;
  localStorage.setItem('nc_recipes',JSON.stringify(RECIPES));
  renderRecipeBank();
  toast(`✓ "${r.name}" guardada`);
};

window.deleteRecipe=(id)=>{
  if(!confirm('¿Eliminar esta receta?'))return;
  RECIPES=RECIPES.filter(x=>x.id!==id);
  currentRecipeId=null;
  localStorage.setItem('nc_recipes',JSON.stringify(RECIPES));
  renderRecipeBank();
  renderRecipeEditor();
  toast('Receta eliminada');
};

window.newRecipe=()=>{
  const id='r'+Date.now();
  RECIPES.push({id,name:'Nueva receta',tags:[],items:[{p:'',qty:100,u:'g'}],notes:''});
  currentRecipeId=id;
  localStorage.setItem('nc_recipes',JSON.stringify(RECIPES));
  renderRecipeBank();
  renderRecipeEditor();
  // Focus the name input
  setTimeout(()=>{
    const ni=document.querySelector('#recipe-editor-area .rec-name-inp');
    if(ni){ni.focus();ni.select();}
  },50);
};

