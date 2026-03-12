// ══════════════════════════════════════════════════════
//  💬 CHAT
// ══════════════════════════════════════════════════════
// ══ CHAT ══
let chatPollingInterval = null;
// Usamos un Map<id, msg> como única fuente de verdad — deduplicación automática
const chatMap = new Map();

function getChatLabel(){
  if(isCoachView()){
    const isSelf = currentClientId === currentUser.id;
    if(isSelf) return 'Tú mismo';
    return allClients.find(c=>c.id===currentClientId)?.full_name || 'Cliente';
  }
  return 'Tu entrenador';
}

function getChatCoachId(){
  return currentProfile.role==='coach' ? currentUser.id : currentProfile.coach_id;
}

async function loadChat(){
  if(!currentClientId) return;
  const coachId = getChatCoachId();
  if(!coachId) return;
  chatMap.clear();
  const { data, error } = await sb
    .from('client_messages')
    .select('*')
    .eq('client_id', currentClientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })
    .limit(300);
  if(error){ console.warn('chat load error', error.message); return; }
  (data||[]).forEach(m => chatMap.set(m.id, m));
  renderChat();
}

async function pollChat(){
  if(!currentClientId) return;
  const coachId = getChatCoachId();
  if(!coachId) return;
  const { data } = await sb
    .from('client_messages')
    .select('*')
    .eq('client_id', currentClientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })
    .limit(300);
  if(!data) return;
  const prevSize = chatMap.size;
  data.forEach(m => chatMap.set(m.id, m));
  // Solo re-renderizar si llegó algo nuevo
  if(chatMap.size !== prevSize) renderChat();
}

function startChatPolling(){
  stopChatPolling();
  chatPollingInterval = setInterval(pollChat, 4000);
}
function stopChatPolling(){
  if(chatPollingInterval){ clearInterval(chatPollingInterval); chatPollingInterval=null; }
}

function renderChat(){
  const container = document.getElementById('chat-messages');
  if(!container) return;
  const label = document.getElementById('chat-with-label');
  if(label) label.textContent = getChatLabel();

  // Ordenar por created_at (el Map puede tener orden de inserción variado con el poll)
  const msgs = Array.from(chatMap.values())
    .sort((a,b) => a.created_at.localeCompare(b.created_at));

  if(!msgs.length){
    container.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--muted2)">
      <div style="font-size:36px">💬</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700">Sin mensajes aún</div>
      <div style="font-size:11px">Empieza la conversación 👇</div>
    </div>`;
    return;
  }

  let html = '';
  let lastDate = '';
  msgs.forEach(msg => {
    const dt = new Date(msg.created_at);
    const dateStr = dt.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    if(dateStr !== lastDate){
      html += `<div class="chat-day-sep">${dateStr}</div>`;
      lastDate = dateStr;
    }
    const mine = msg.sender_id === currentUser.id;
    const timeStr = dt.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
    html += `<div style="display:flex;flex-direction:column;align-self:${mine?'flex-end':'flex-start'};max-width:72%">
      <div class="chat-bubble ${mine?'mine':'theirs'}">${msg.message.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>
      <div class="chat-meta">${timeStr}</div>
    </div>`;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

window.sendChatMessage = async () => {
  const inp = document.getElementById('chat-input');
  const text = inp?.value?.trim();
  if(!text || !currentClientId) return;
  const coachId = getChatCoachId();
  if(!coachId) return;
  inp.value = '';
  inp.focus();
  const { data, error } = await sb.from('client_messages').insert({
    client_id: currentClientId,
    coach_id: coachId,
    sender_id: currentUser.id,
    sender_role: currentProfile.role,
    message: text
  }).select().single();
  if(error){ toast('Error: '+error.message); inp.value=text; return; }
  chatMap.set(data.id, data);
  renderChat();
};

function chatReadKey(){ return `ek_chat_read_${currentClientId}`; }
function updateChatBadge(count){
  const badge = document.getElementById('chat-unread-badge');
  if(!badge) return;
  if(count>0){ badge.textContent=count>9?'9+':count; badge.style.display='block'; }
  else badge.style.display='none';
}

function checkUnreadForClient(clientId){
  if(!currentUser || !sb) return;
  const coachId = currentProfile?.role==='coach' ? currentUser.id : currentProfile?.coach_id;
  if(!coachId) return;
  sb.from('client_messages')
    .select('id', {count:'exact',head:true})
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .then(({count})=>{ updateChatBadge(count||0); });
}
