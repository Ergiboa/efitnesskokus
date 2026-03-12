// ══════════════════════════════════════════════════════
//  NAV + SIDEBAR
// ══════════════════════════════════════════════════════
window.toggleSidebar=()=>{const s=document.getElementById('sidebar');const o=document.getElementById('sidebar-overlay');s.classList.toggle('open');o.classList.toggle('visible');};
window.closeSidebar=()=>{document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebar-overlay').classList.remove('visible');};
window.switchClient=switchClient;

// ── NAV HELPERS ──
window.navItemClick = (el, e) => {
  const tab = el.dataset.tab;
  if(!tab) return;
  const sub = document.getElementById('sub-'+tab);
  // If has submenu: toggle it, but also navigate to the tab itself
  if(sub){
    const isOpen = sub.classList.contains('open');
    // Close all submenus
    document.querySelectorAll('.nav-submenu').forEach(s=>s.classList.remove('open'));
    document.querySelectorAll('.nav-chevron').forEach(c=>{c.style.transform='';});
    if(!isOpen){
      sub.classList.add('open');
      const chev=document.getElementById('chev-'+tab);
      if(chev) chev.style.transform='rotate(90deg)';
    }
  } else {
    document.querySelectorAll('.nav-submenu').forEach(s=>s.classList.remove('open'));
    document.querySelectorAll('.nav-chevron').forEach(c=>{c.style.transform='';});
  }
  // Mark active
  document.querySelectorAll('.nav-item,.nav-sub-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  showTab(tab);
  if(window.innerWidth<=768) closeSidebar();
};

window.navSubClick = (el) => {
  const tab = el.dataset.tab;
  if(!tab) return;
  document.querySelectorAll('.nav-item,.nav-sub-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  showTab(tab);
  if(window.innerWidth<=768) closeSidebar();
};

function showTab(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('panel-'+name);if(panel)panel.classList.add('active');
  if(name==='resumen')renderResumen();
  if(name==='dieta')renderDiet();
  if(name==='recetas'){renderRecipeBank();renderRecipeEditor();}
  if(name==='db'){
    renderDB();
    const coachBtns=document.getElementById('db-coach-btns');
    if(coachBtns) coachBtns.style.display=isCoachView()?'':'none';
    const addMicrosBtn=document.getElementById('btn-add-micros');
    if(addMicrosBtn&&!isCoachView()) addMicrosBtn.style.display='none';
  }
  if(name==='compra'){checkPrices();renderCompra();}
  if(name==='stock'){renderRecipes();renderStockSidebar();}
  if(name==='entreno'){renderTrnSidebar();renderTrnWeekBar();renderTrnStats();renderTrnEditor();if(trnTabMode==='progress')renderTrnProgress();}
  else if(name==='ajustes'){_syncKeyStatuses?.();}
  if(name==='progreso'){loadProgressFromServer().then(()=>{initProgressForm();renderProgress();});}
  if(name==='ejercicios')renderExList();
  if(name==='notas'){
    renderNotasPanel();
  }
  if(name==='chat'){
    stopChatPolling();
    
    loadChat().then(startChatPolling);
  }
  if(name==='perfil') initProfilePanel();
}

window.confirmLogout=async()=>{if(!confirm('¿Cerrar sesión?'))return;await sb.auth.signOut();window.location.href='login.html';};

// ══════════════════════════════════════════════════════
//  CREAR CLIENTE (coach)
// ══════════════════════════════════════════════════════
window.openNewClientModal = function(){
  const m = document.getElementById('modal-new-client');
  m.style.display = 'flex';
  document.getElementById('nc-name').value = '';
  document.getElementById('nc-email').value = '';
  document.getElementById('nc-pass').value = '';
  document.getElementById('nc-pass2').value = '';
  const err = document.getElementById('nc-error');
  err.style.display = 'none';
  setTimeout(()=>document.getElementById('nc-name').focus(), 50);
};
window.closeNewClientModal = function(){
  document.getElementById('modal-new-client').style.display = 'none';
};
// Cerrar al hacer clic fuera del modal
document.getElementById('modal-new-client').addEventListener('click', function(e){
  if(e.target === this) window.closeNewClientModal();
});

window.submitNewClient = async function(){
  const name  = document.getElementById('nc-name').value.trim();
  const email = document.getElementById('nc-email').value.trim().toLowerCase();
  const pass  = document.getElementById('nc-pass').value;
  const pass2 = document.getElementById('nc-pass2').value;
  const errEl = document.getElementById('nc-error');
  const btnEl = document.getElementById('nc-submit-btn');

  const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = ''; };
  errEl.style.display = 'none';

  if(!name)  return showErr('El nombre es obligatorio');
  if(!email) return showErr('El email es obligatorio');
  if(!email.includes('@')) return showErr('Email no válido');
  if(pass.length < 6) return showErr('La contraseña debe tener al menos 6 caracteres');
  if(pass !== pass2)  return showErr('Las contraseñas no coinciden');

  btnEl.textContent = '⏳ Creando...';
  btnEl.disabled = true;

  try {
    const { data: { session: sess } } = await sb.auth.getSession();
    if (!sess) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    const res = await sb.functions.invoke('create-client', {
      body: { full_name: name, email, password: pass },
      headers: { Authorization: `Bearer ${sess.access_token}` },
    });
    // Surfacear error real de la función (no el genérico del SDK)
    const data = res.data;
    if(data?.error) throw new Error(data.error);
    if(res.error) throw new Error(data?.message || data?.error || res.error.message || JSON.stringify(res.error));

    // Añadir al selector y seleccionar el nuevo cliente
    const newClient = data.client;
    allClients.push(newClient);
    const sel = document.getElementById('client-select');
    const o = document.createElement('option');
    o.value = newClient.id;
    o.textContent = newClient.full_name || newClient.email;
    sel.appendChild(o);
    sel.value = newClient.id;

    window.closeNewClientModal();
    toast('✓ Cliente "' + (newClient.full_name||newClient.email) + '" creado');
    await switchClient(newClient.id);
  } catch(e) {
    showErr(e.message);
  } finally {
    btnEl.textContent = '✓ Crear cliente';
    btnEl.disabled = false;
  }
};

// ══════════════════════════════════════════════════════
//  CAMBIAR CONTRASEÑA (cliente)
// ══════════════════════════════════════════════════════
window.openChangePassModal = function(){
  const m = document.getElementById('modal-change-pass');
  m.style.display = 'flex';
  document.getElementById('cp-new').value = '';
  document.getElementById('cp-new2').value = '';
  document.getElementById('cp-error').style.display = 'none';
  setTimeout(()=>document.getElementById('cp-new').focus(), 50);
};
window.closeChangePassModal = function(){
  document.getElementById('modal-change-pass').style.display = 'none';
};
document.getElementById('modal-change-pass').addEventListener('click', function(e){
  if(e.target === this) window.closeChangePassModal();
});

window.submitChangePass = async function(){
  const p1    = document.getElementById('cp-new').value;
  const p2    = document.getElementById('cp-new2').value;
  const errEl = document.getElementById('cp-error');
  const btnEl = document.getElementById('cp-submit-btn');

  const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = ''; };
  errEl.style.display = 'none';

  if(p1.length < 6) return showErr('La contraseña debe tener al menos 6 caracteres');
  if(p1 !== p2)     return showErr('Las contraseñas no coinciden');

  btnEl.textContent = '⏳ Guardando...';
  btnEl.disabled = true;

  try {
    const { error } = await sb.auth.updateUser({ password: p1 });
    if(error) throw new Error(error.message);
    window.closeChangePassModal();
    toast('✓ Contraseña cambiada correctamente');
  } catch(e) {
    showErr(e.message);
  } finally {
    btnEl.textContent = '🔑 Cambiar contraseña';
    btnEl.disabled = false;
  }
};

let toastT;
window.toast=(msg)=>{const el=document.getElementById('toast');if(!el){console.log('TOAST:',msg);return;}el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2600);};

