// ══════════════════════════════════════════════════════
//  NOTES
// ══════════════════════════════════════════════════════
window.saveNotes=()=>{
  if(isCoachView()){
    coachClientNotes.personal = document.getElementById('personal-notes')?.value||'';
    personalNotes = coachClientNotes.personal;
  } else {
    personalNotes = document.getElementById('personal-notes')?.value||'';
  }
};
window.saveCoachNotesField=(field,val)=>{
  if(!isCoachView()) return;
  coachClientNotes[field]=val;
};

function renderNotasPanel(){
  const coach = isCoachView();
  const clientName = allClients.find(c=>c.id===currentClientId)?.full_name || 'Cliente';
  const isSelf = currentClientId === currentUser?.id;
  const feedbackEscaped = (coachFeedback||'').replace(/</g,'&lt;');
  const personalEscaped = (coach ? (coachClientNotes.personal||'') : (personalNotes||'')).replace(/</g,'&lt;');
  const qrEscaped  = (coachClientNotes.quickRules  || DEFAULT_QUICK_RULES).replace(/</g,'&lt;');
  const supEscaped = (coachClientNotes.supplements || DEFAULT_SUPPLEMENTS).replace(/</g,'&lt;');

  let html = `<div class="sec" style="margin-bottom:12px">\u{1F4DD} NOTAS${coach&&!isSelf?' \u2014 '+clientName:''}</div><div class="notes-grid">`;

  if(coach){
    html += `
      <div class="note-card">
        <h4>\u{1F4A7} Reglas r\u00e1pidas</h4>
        <textarea style="width:100%;min-height:90px;background:transparent;border:1px dashed var(--border);border-radius:5px;color:var(--text);font-size:11px;line-height:1.6;padding:6px;resize:vertical;font-family:inherit;outline:none;box-sizing:border-box"
          oninput="saveCoachNotesField('quickRules',this.value)">${qrEscaped}</textarea>
      </div>
      <div class="note-card">
        <h4>\u{1F3CB} Suplementos</h4>
        <textarea style="width:100%;min-height:90px;background:transparent;border:1px dashed var(--border);border-radius:5px;color:var(--text);font-size:11px;line-height:1.6;padding:6px;resize:vertical;font-family:inherit;outline:none;box-sizing:border-box"
          oninput="saveCoachNotesField('supplements',this.value)">${supEscaped}</textarea>
      </div>
      <div class="note-card" style="grid-column:span 2">
        <h4>\u{1F5D2} Notas privadas${isSelf?' personales':' sobre '+clientName} <span style="font-size:9px;color:var(--muted2);font-weight:400">(solo las ves t\u00fa)</span></h4>
        <textarea id="personal-notes" placeholder="Apuntes privados..." oninput="saveNotes()">${personalEscaped}</textarea>
        <button class="btn ghost sm" style="margin-top:7px" onclick="saveNotesToServer()">\u{1F4BE} Guardar todo</button>
      </div>
      ${!isSelf?`
      <div class="feedback-card" style="grid-column:span 2;background:var(--card);border:1px solid rgba(242,210,79,.18);border-radius:9px;padding:14px">
        <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;color:var(--accent3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">\u{1F468}\u200D\u{1F4BC} Feedback publicado a ${clientName}</h4>
        <textarea id="coach-feedback-inp" placeholder="Mensaje que ver\u00e1 ${clientName}..." style="min-height:100px;border:1px solid rgba(242,210,79,.15);border-radius:6px;padding:9px;background:rgba(242,210,79,.02)">${feedbackEscaped}</textarea>
        <button class="btn gold sm" style="margin-top:8px" onclick="saveCoachFeedback()">\u{1F4E4} Publicar al cliente</button>
      </div>`:''}
    `;
  } else {
    const qrHtml = (coachClientNotes.quickRules||DEFAULT_QUICK_RULES).replace(/\n/g,'<br>');
    const supHtml = (coachClientNotes.supplements||DEFAULT_SUPPLEMENTS).replace(/\n/g,'<br>');
    html += `
      <div class="note-card"><h4>\u{1F4A7} Reglas r\u00e1pidas</h4><div style="font-size:11px;line-height:1.8;color:var(--muted2)">${qrHtml}</div></div>
      <div class="note-card"><h4>\u{1F3CB} Suplementos</h4><div style="font-size:11px;line-height:1.8;color:var(--muted2)">${supHtml}</div></div>
      <div class="note-card" style="grid-column:span 2">
        <h4>\u{1F4DD} Mis notas personales</h4>
        <textarea id="personal-notes" placeholder="A\u00f1ade tus notas..." oninput="saveNotes()">${personalEscaped}</textarea>
        <button class="btn ghost sm" style="margin-top:7px" onclick="saveNotesToServer()">\u{1F4BE} Guardar</button>
      </div>
      <div class="feedback-published" style="grid-column:span 2;background:var(--card);border:1px solid rgba(100,220,200,.15);border-radius:9px;padding:14px">
        <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;color:var(--accent2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">\u{1F4E8} Mensaje de tu entrenador</h4>
        <div id="published-feedback-text" style="font-size:12px;line-height:1.7;color:var(--muted2);white-space:pre-wrap">${feedbackEscaped||'Tu entrenador a\u00fan no ha dejado ning\u00fan mensaje.'}</div>
      </div>
      <div class="note-card" style="grid-column:span 2">
        <h4>\u{1F511} Cambiar contrase\u00f1a</h4>
        <p style="font-size:11px;color:var(--muted2);margin:0 0 10px">Cambia tu contrase\u00f1a de acceso a la app.</p>
        <button class="btn ghost sm" onclick="openChangePassModal()">\u{1F511} Cambiar contrase\u00f1a</button>
      </div>
    `;
  }

  html += '</div>';
  const nc = document.getElementById('notas-content');
  if(nc) nc.innerHTML = html;
}
window.saveNotesToServer=saveNotesToServer;
window.saveCoachFeedback=saveCoachFeedback;

