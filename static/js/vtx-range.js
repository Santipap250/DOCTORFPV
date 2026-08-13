// static/js/vtx-range.js — Batch D: extracted from templates/vtx_range.html inline <script>. No logic change.

/* ═══════════════════════════════════════════════════════
   VTX Signal Range Lab — Brain
   Physics: Free-Space Path Loss (Friis transmission)
   FSPL(dB) = 20·log10(d) + 20·log10(f) + 92.45
   (d in km, f in GHz)
═══════════════════════════════════════════════════════ */

const ANTENNAS = [
  { id:'stock',    name:'Stock Whip', gain:0,    icon:'📡' },
  { id:'clover',   name:'Cloverleaf', gain:1.5,  icon:'🍀' },
  { id:'pagoda',   name:'Pagoda',     gain:3,    icon:'🗼' },
  { id:'patch',    name:'Patch/Yagi', gain:8,    icon:'📻' },
  { id:'helical',  name:'Helical',    gain:10,   icon:'🌀' },
  { id:'ibcrazy',  name:'IBCrazy Twisty', gain:2, icon:'🌪' },
];

const ENVIRONMENTS = [
  { id:'los',    name:'Open Field',  factor:1.0, icon:'🌾' },
  { id:'sub',    name:'Suburban',    factor:0.6, icon:'🏘' },
  { id:'urban',  name:'Urban',       factor:0.4, icon:'🏙' },
  { id:'indoor', name:'Indoor',      factor:0.15,icon:'🏠' },
];

const FREQS = [
  { mhz:5800, label:'5.8GHz',  color:'#00e5ff',  pen:'Poor' },
  { mhz:2400, label:'2.4GHz',  color:'#00ff88',  pen:'Good' },
  { mhz:900,  label:'900MHz',  color:'#cc55ff',   pen:'Excellent' },
];

let ST = { pwr:400, freq:5800, rxs:-90, txg:2, rxg:2, env:'los', antTx:'clover', antRx:'clover' };

// ── Build antenna grids ───────────────────────────────
function buildAntennaGrid(id, stateKey) {
  const g = document.getElementById(id);
  g.innerHTML = ANTENNAS.map(a => `
    <button class="ant-btn${ST[stateKey]===a.id?' active':''}" data-id="${a.id}"
      onclick="setAnt('${stateKey}','${a.id}',this)">
      <span class="ab-name">${a.icon} ${a.name}</span>
      <span class="ab-gain">${a.gain>=0?'+':''}${a.gain} dBi</span>
    </button>`).join('');
}
function setAnt(key, id, btn) {
  ST[key] = id;
  const slider = key==='antTx'?'s_txg':'s_rxg';
  const lv     = key==='antTx'?'lv_txg':'lv_rxg';
  const ant = ANTENNAS.find(a=>a.id===id);
  document.getElementById(slider).value = ant.gain;
  document.getElementById(lv).textContent = ant.gain + ' dBi';
  ST[key==='antTx'?'txg':'rxg'] = ant.gain;
  btn.closest('.ant-grid').querySelectorAll('.ant-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ── Build env buttons ─────────────────────────────────
function buildEnv() {
  document.getElementById('envRow').innerHTML = ENVIRONMENTS.map(e => `
    <button class="env-btn${ST.env===e.id?' active':''}" data-id="${e.id}" onclick="setEnv('${e.id}',this)">
      <span class="ev-icon">${e.icon}</span>${e.name}
    </button>`).join('');
}
function setEnv(id, btn) {
  ST.env = id;
  document.querySelectorAll('.env-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ── Physics ────────────────────────────────────────────
function calcRange(pwr_mW, freq_MHz, rxs_dBm, txg_dBi, rxg_dBi) {
  const txPow_dBm = 10 * Math.log10(pwr_mW);
  const linkBudget = txPow_dBm + txg_dBi + rxg_dBi - rxs_dBm;
  // FSPL(km,GHz) = 92.45 + 20log10(GHz) + 20log10(km)
  const fGHz = freq_MHz / 1000;
  const fspl_1m = 92.45 + 20*Math.log10(fGHz) + 20*Math.log10(0.001); // at 1m
  const exponent = (linkBudget - 92.45 - 20*Math.log10(fGHz)) / 20;
  const range_km = Math.pow(10, exponent);
  return { range_km, linkBudget, txPow_dBm };
}

function fmtRange(km) {
  if (km >= 1) return km.toFixed(2) + ' km';
  return (km * 1000).toFixed(0) + ' m';
}

// ── Render ────────────────────────────────────────────
function render() {
  const envObj = ENVIRONMENTS.find(e=>e.id===ST.env);
  const { range_km, linkBudget, txPow_dBm } = calcRange(ST.pwr, ST.freq, ST.rxs, ST.txg, ST.rxg);
  const practical = range_km * envObj.factor;

  // Results
  document.getElementById('r_los').textContent = fmtRange(range_km);
  document.getElementById('r_env').textContent = fmtRange(practical);
  document.getElementById('r_lb').textContent  = linkBudget.toFixed(1) + ' dB';
  document.getElementById('r_dbm').textContent = txPow_dBm.toFixed(1) + ' dBm';
  document.getElementById('envName').textContent = envObj.name;
  document.getElementById('ringLabel').textContent = fmtRange(range_km) + ' LoS';

  // Link budget bar
  const lbPct = Math.min(100, Math.max(0, ((linkBudget - 50) / 80) * 100));
  document.getElementById('lbBar').style.width = lbPct + '%';

  // Warnings
  const warns = [];
  if (ST.freq === 5800 && practical < 0.3) warns.push('⚠ 5.8GHz ระยะสั้นในสภาพแวดล้อมนี้ — พิจารณา 2.4GHz หรือเพิ่ม antenna gain');
  if (ST.pwr > 800) warns.push('⚠ กำลังส่งสูง — ตรวจสอบกฎหมายท้องถิ่น (ประเทศไทย max 100mW บนความถี่ 5.8GHz)');
  if (linkBudget < 80) warns.push('⚠ Link budget ต่ำ — ควรมีอย่างน้อย 80-100dB สำหรับ FPV ที่เสถียร');
  if (ST.antTx === 'stock' && range_km > 1) warns.push('💡 Upgrade antenna เป็น Cloverleaf/Pagoda จะเพิ่มระยะได้ 20-50%');
  document.getElementById('warnArea').innerHTML = warns.map(w=>`<div class="warn-item">${w}</div>`).join('');

  // SVG Rings
  renderRings(range_km, practical);

  // Freq comparison table
  renderFreqTable();
}

function renderRings(los_km, pract_km) {
  const SVG_R = 230; // max radius in SVG units
  const maxKm = Math.max(los_km * 1.2, 0.1);

  // Decorative background rings
  const gridR = document.getElementById('gridRings');
  gridR.innerHTML = [50,100,150,200,230].map(r=>`
    <circle cx="250" cy="250" r="${r}" fill="none" stroke="rgba(0,170,255,.2)" stroke-width=".5" stroke-dasharray="3 4"/>`).join('');

  // Scale km → SVG radius
  const scale = SVG_R / maxKm;

  const losR    = Math.min(SVG_R, los_km * scale);
  const practR  = Math.min(SVG_R, pract_km * scale);

  document.getElementById('losRangeFill').setAttribute('r', losR);
  document.getElementById('practRangeFill').setAttribute('r', practR);

  // Labeled rings
  const ringsG = document.getElementById('rangeRings');
  const steps = generateSteps(los_km);
  ringsG.innerHTML = steps.map(km => {
    const r = Math.min(SVG_R - 2, km * scale);
    const isLoS = Math.abs(km - los_km) < los_km * 0.05;
    const isPract = Math.abs(km - pract_km) < pract_km * 0.05;
    const color = isLoS ? 'rgba(0,229,255,.6)' : isPract ? 'rgba(255,183,0,.5)' : 'rgba(0,170,255,.2)';
    const w = isLoS||isPract ? 1.5 : 0.7;
    const lbl = fmtRange(km);
    return `
      <circle cx="250" cy="250" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" ${isLoS||isPract?'':'stroke-dasharray="4 6"'}/>
      <text x="${250+r}" y="250" font-family="JetBrains Mono" font-size="8" fill="${color}" dy="-3" dx="3">${lbl}</text>`;
  }).join('') +
  // LoS label
  `<text x="250" y="${250 - losR - 8}" text-anchor="middle" font-family="Orbitron" font-size="8" font-weight="700" fill="rgba(0,229,255,.8)">LoS MAX</text>` +
  (practR > 20 ? `<text x="250" y="${250 - practR - 5}" text-anchor="middle" font-family="Orbitron" font-size="7" fill="rgba(255,183,0,.7)">PRACTICAL</text>` : '');
}

function generateSteps(maxKm) {
  const steps = [];
  const magnitudes = [0.05,0.1,0.2,0.3,0.5,1,1.5,2,3,5,10,15,20];
  for (const m of magnitudes) {
    if (m <= maxKm * 1.05) steps.push(m);
    if (steps.length >= 6) break;
  }
  return steps;
}

function renderFreqTable() {
  const tbody = document.getElementById('freqTable');
  tbody.innerHTML = FREQS.map(f => {
    const { range_km, linkBudget } = calcRange(ST.pwr, f.mhz, ST.rxs, ST.txg, ST.rxg);
    const env = ENVIRONMENTS.find(e=>e.id===ST.env);
    const pract = range_km * env.factor;
    const isActive = f.mhz === ST.freq;
    return `<tr style="${isActive?'background:rgba(0,170,255,.05)':''}">
      <td><span class="freq-badge" style="background:${f.color}22;color:${f.color};border:1px solid ${f.color}44">${f.label}</span></td>
      <td style="color:${f.color};font-weight:600">${fmtRange(range_km)}</td>
      <td>${fmtRange(pract)}</td>
      <td>${linkBudget.toFixed(1)} dB</td>
      <td style="color:var(--text)">${f.pen}</td>
    </tr>`;
  }).join('');
}

// ── Wire controls ─────────────────────────────────────
function wireSlider(id, lvId, unit, stateKey, decimals=0) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    const v = parseFloat(el.value);
    ST[stateKey] = v;
    document.getElementById(lvId).textContent = v.toFixed(decimals) + ' ' + unit;
    render();
  });
}
wireSlider('s_pwr','lv_pwr','mW','pwr');
wireSlider('s_rxs','lv_rxs','dBm','rxs');
wireSlider('s_txg','lv_txg','dBi','txg',1);
wireSlider('s_rxg','lv_rxg','dBi','rxg',1);

document.getElementById('seg_pwr').querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#seg_pwr .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const v = parseInt(btn.dataset.v);
    ST.pwr = v;
    document.getElementById('s_pwr').value = v;
    document.getElementById('lv_pwr').textContent = v + ' mW';
    render();
  });
});
document.getElementById('seg_freq').querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#seg_freq .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    ST.freq = parseInt(btn.dataset.v);
    render();
  });
});

// ── Init ──────────────────────────────────────────────
buildAntennaGrid('antTxGrid','antTx');
buildAntennaGrid('antRxGrid','antRx');
buildEnv();
render();
