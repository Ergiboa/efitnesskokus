// ══════════════════════════════════════════════════════
//  MERCADONA PRICE FETCHER (via Algolia — API oficial de tienda.mercadona.es)
// ══════════════════════════════════════════════════════

const MERC_ALGOLIA_URL = 'https://7uzjkl1dj0-dsn.algolia.net/1/indexes/products_prod_4281_es/query';
const MERC_ALGOLIA_KEY = '9d8f2e39e90df472b4f2e559a116fe17';
const MERC_ALGOLIA_APP = '7UZJKL1DJ0';

async function searchMercadona(query) {
  const res = await fetch(MERC_ALGOLIA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Algolia-Application-Id': MERC_ALGOLIA_APP,
      'X-Algolia-API-Key': MERC_ALGOLIA_KEY,
    },
    body: JSON.stringify({ query, hitsPerPage: 10 }),
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) throw new Error(`Algolia ${res.status}`);
  const data = await res.json();
  const hits = data.hits || [];
  if (!hits.length) return null;

  // Score: más palabras del ingrediente coinciden con el nombre del hit → mejor
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = hits.map(h => {
    const name = (h.display_name || h.name || '').toLowerCase();
    const matches = words.filter(w => name.includes(w)).length;
    // Mercadona Algolia fields: price_instructions.unit_price o price.value
    const pi = h.price_instructions || {};
    const price = parseFloat(pi.unit_price ?? pi.bulk_price ?? h.price?.value ?? 0);
    const sizeVal = pi.unit_size ?? h.unit_size ?? '';
    const sizeUnit = (pi.size_unit || h.unit || '').toLowerCase();
    const base = sizeVal ? `${sizeVal}${sizeUnit}` : (pi.reference_format || '1ud');
    return { name: h.display_name || h.name, price, base, matches };
  }).filter(h => h.price > 0);

  if (!scored.length) return null;
  scored.sort((a, b) => b.matches - a.matches || a.price - b.price);
  return scored[0];
}

// Main: fetch all diet products from Mercadona
window.fetchMercadonaPrices = async () => {
  if (!isCoachView()) { toast('Solo el entrenador puede actualizar precios'); return; }

  const btn = document.getElementById('btn-merc-fetch');
  const status = document.getElementById('merc-fetch-status');
  btn.disabled = true;
  btn.textContent = '⏳ Buscando...';

  const products = getCompraList().map(i => i.p);
  let ok = 0, fail = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    status.textContent = `(${i+1}/${products.length}) ${p}...`;
    try {
      const result = await searchMercadona(p);
      if (result) {
        if (!PRICES[p]) PRICES[p] = {};
        PRICES[p].merc = result.price;
        PRICES[p].base = PRICES[p].base || result.base;
        ok++;
      } else {
        fail++;
      }
    } catch(e) {
      console.warn('Mercadona fetch error for', p, e);
      fail++;
      if (i === 0) {
        status.textContent = '⚠ Error conectando con Mercadona. Prueba más tarde.';
        btn.disabled = false;
        btn.textContent = '🟢 Actualizar precios Mercadona';
        toast('⚠ Error de conexión con Mercadona');
        return;
      }
    }
    // Pequeño delay para no saturar
    await new Promise(r => setTimeout(r, 200));
  }

  // Save to Supabase
  const coachId = currentProfile?.role==='coach' ? currentUser?.id : currentProfile?.coach_id;
  if (coachId) {
    const rows = Object.entries(PRICES).map(([product,v])=>({
      coach_id:coachId, product,
      merc:v.merc??null, lidl:v.lidl??null,
      carrefour:v.carrefour??null, dia:v.dia??null, eroski:v.eroski??null,
      base_unit:v.base||'ud', updated_at:new Date().toISOString()
    }));
    try { await sb.from('prices').upsert(rows,{onConflict:'coach_id,product'}); flash(); }
    catch(e) { console.warn('prices save:', e); }
  }

  btn.disabled = false;
  btn.textContent = '🟢 Actualizar precios Mercadona';
  status.textContent = `✓ ${ok} actualizados${fail ? `, ${fail} no encontrados` : ''}`;
  renderCompra();
  toast(`✓ Mercadona: ${ok} precios actualizados`);
};

// ══════════════════════════════════════════════════════
//  PRICE EDITOR (manual, coach only)
// ══════════════════════════════════════════════════════
function setPriceStatus(msg, state=''){
  // kept for compat, no-op now
}
async function checkPrices(){
  renderCompra();
}
window.aiRefreshPrices = async () => {
  toast('💡 Usa el botón "✏️ Editar precios" para actualizar precios manualmente');
};

window.openPriceEditor = () => {
  if(!isCoachView()){ toast('Solo el entrenador puede editar precios'); return; }
  const products = getCompraList().map(i=>i.p);
  const extraProds = Object.keys(PRICES).filter(k=>!products.includes(k)).slice(0,20);
  const allProds = [...new Set([...products,...extraProds])].sort();

  const supers = ['merc','lidl','carrefour','dia','eroski'];
  const superNames = {merc:'Mercadona',lidl:'Lidl',carrefour:'Carrefour',dia:'Dia',eroski:'Eroski'};

  const rows = allProds.map(p => {
    const pr = PRICES[p] || {};
    const cells = supers.map(s =>
      `<td><input type="number" min="0" step="0.01" value="${pr[s]??''}" placeholder="—"
        style="width:68px;padding:4px 5px;background:var(--bg2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:11px;font-family:'JetBrains Mono',monospace"
        data-product="${p}" data-super="${s}" onchange="priceEditorChange(this)"></td>`
    ).join('');
    const base = pr.base || '100g';
    return `<tr>
      <td style="font-family:'Syne',sans-serif;font-weight:600;font-size:11px;padding:4px 8px;white-space:nowrap">${p}</td>
      <td><input type="text" value="${base}" placeholder="100g"
        style="width:58px;padding:4px 5px;background:var(--bg2);border:1px solid var(--border);border-radius:4px;color:var(--muted2);font-size:10px"
        data-product="${p}" data-super="base" onchange="priceEditorChange(this)"></td>
      ${cells}
    </tr>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'price-editor-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;width:min(820px,96vw);box-shadow:0 20px 60px rgba(0,0,0,.5)">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px">✏️ Editor de precios</div>
          <div style="font-size:10px;color:var(--muted2);margin-top:2px">Precio por envase/unidad indicada en "Base". Deja vacío si no disponible.</div>
        </div>
        <button onclick="closePriceEditor()" style="background:none;border:none;color:var(--muted2);font-size:20px;cursor:pointer;padding:4px 8px">✕</button>
      </div>
      <div style="padding:14px 20px;overflow-x:auto">
        <table style="border-collapse:collapse;width:100%">
          <thead><tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:6px 8px;font-family:'Syne',sans-serif;font-size:10px;color:var(--muted2)">Producto</th>
            <th style="text-align:left;padding:6px 8px;font-family:'Syne',sans-serif;font-size:10px;color:var(--muted2)">Base</th>
            ${supers.map(s=>`<th style="text-align:center;padding:6px 8px;font-family:'Syne',sans-serif;font-size:10px;color:var(--accent)">${superNames[s]}</th>`).join('')}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
        <button class="btn ghost" onclick="addPriceRow()">+ Añadir producto</button>
        <button class="btn" onclick="savePricesAndClose()">💾 Guardar precios</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e=>{ if(e.target===modal) closePriceEditor(); });
};

window.priceEditorChange = (inp) => {
  const p = inp.dataset.product;
  const s = inp.dataset.super;
  if(!PRICES[p]) PRICES[p] = {};
  if(s==='base'){
    PRICES[p].base = inp.value.trim() || '100g';
  } else {
    const v = parseFloat(inp.value);
    PRICES[p][s] = isNaN(v) ? null : v;
  }
};

window.addPriceRow = () => {
  const name = prompt('Nombre del producto (debe coincidir con el ingrediente):');
  if(!name) return;
  const k = name.toLowerCase().trim();
  if(!PRICES[k]) PRICES[k] = {base:'100g'};
  closePriceEditor();
  openPriceEditor();
};

window.savePricesAndClose = async () => {
  closePriceEditor();
  // Save to Supabase
  const coachId = currentProfile?.role==='coach' ? currentUser?.id : currentProfile?.coach_id;
  if(coachId){
    const rows = Object.entries(PRICES).map(([product,v])=>({
      coach_id:coachId, product,
      merc:v.merc??null, lidl:v.lidl??null,
      carrefour:v.carrefour??null, dia:v.dia??null, eroski:v.eroski??null,
      base_unit:v.base||'ud', updated_at:new Date().toISOString()
    }));
    try{
      await sb.from('prices').upsert(rows,{onConflict:'coach_id,product'});
      flash(); toast('✓ Precios guardados');
    }catch(e){ toast('Error guardando: '+e.message); }
  }
  renderCompra();
};

window.closePriceEditor = () => {
  document.getElementById('price-editor-modal')?.remove();
};

