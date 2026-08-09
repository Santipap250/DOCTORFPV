// static/js/rpm-filter.js — Batch C: extracted from templates/rpm_filter.html inline <script>. No logic change.

/* ═══════════════════════════════════════════════════════
   RPM FILTER SPECTRUM ANALYZER — Brain
═══════════════════════════════════════════════════════ */

const LOAD_FACTOR = 0.75;
const MAX_CELL_V  = 4.2;
const THROTTLE_LEVELS = [
  { label: '20%',  pct: 0.20 },
  { label: '50%',  pct: 0.50 },
  { label: '70%',  pct: 0.70 },
  { label: '100%', pct: 1.00 },
];
const HARMONIC_COLORS = ['var(--h1)', 'var(--h2)', 'var(--h3)', 'var(--h4)'];

// State
let ST = { kv: 2400, cells: 4, prop: 5, thr: 50, harmonics: 3 };

// ── Calculate ──────────────────────────────────────────
function calc() {
  const { kv, cells, prop, harmonics } = ST;
  const vMax = cells * MAX_CELL_V;
  const rpmMax = kv * vMax * LOAD_FACTOR;

  const table = THROTTLE_LEVELS.map(t => {
    const rpm = rpmMax * t.pct;
    const harms = [1,2,3,4].map(n => ({ n, hz: Math.round(rpm * n / 60) }));
    return { label: t.label, pct: t.pct, rpm: Math.round(rpm), harmonics: harms };
  });

  // Current throttle row
  const thrRpm = rpmMax * (ST.thr / 100);
  const thrHarms = [1,2,3,4].map(n => ({ n, hz: Math.round(thrRpm * n / 60) }));

  // Notch window
  const f1Min = Math.round(rpmMax * 0.20 / 60);
  const f1Max = Math.round(rpmMax * 1.00 / 60);
  const notchMin = Math.max(60,  Math.round(f1Min * 0.80 / 10) * 10);
  const notchMax = Math.min(1000, Math.round(f1Max * 1.20 / 10) * 10);
  const notchCnt = (cells >= 6 || kv >= 2200) ? 3 : 2;

  // Warnings
  const warnings = [];
  if (cells >= 7 && kv > 1500)
    warnings.push(`KV ${kv} สูงบน ${cells}S — harmonic จะอยู่ย่าน Hz สูงมาก ระวัง motor ร้อน`);
  if (notchMax > 700)
    warnings.push(`Max notch freq ${notchMax}Hz สูง — ตรวจสอบ RPM filter mode = ON ใน BF Configurator`);
  if (kv > 3000 && cells >= 4)
    warnings.push(`KV ${kv} สูงมากบน ${cells}S — ตรวจสอบ ESC demag และ prop balance`);

  // Notes
  const notes = [
    `Max RPM (loaded 100% thr): ${Math.round(rpmMax).toLocaleString()} RPM`,
    `Fundamental at max throttle: ${Math.round(rpmMax / 60).toLocaleString()} Hz`,
    `ค่าเหล่านี้เป็นประมาณ — ยืนยันด้วย Blackbox + RPM filter graph เสมอ`,
    `Prop ${prop}" ส่งผลต่อ actual RPM — ใบใหญ่ = RPM ต่ำกว่า unloaded estimate`,
    `Load factor ที่ใช้ = ${LOAD_FACTOR} (75% ของ RPM ไม่มีโหลด — ค่าเฉลี่ย FPV)`,
  ];

  return { rpmMax: Math.round(rpmMax), table, thrHarms, notchMin, notchMax, notchCnt, warnings, notes };
}

// ── Spectrum visualizer ────────────────────────────────
const SVG_W = 760, SVG_H = 200, PAD_L = 50, PAD_B = 25, PLOT_W = SVG_W - PAD_L - 5, PLOT_H = SVG_H - 10 - PAD_B;

function buildGrid(maxHz) {
  const g = document.getElementById('gridLines');
  g.innerHTML = '';
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const y = 10 + PLOT_H * (1 - i / steps);
    const hz = Math.round(maxHz * i / steps);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'spec-grid');
    line.setAttribute('x1', PAD_L); line.setAttribute('y1', y);
    line.setAttribute('x2', SVG_W - 5); line.setAttribute('y2', y);
    g.appendChild(line);
    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('class', 'spec-label');
    txt.setAttribute('x', PAD_L - 4); txt.setAttribute('y', y + 3);
    txt.setAttribute('text-anchor', 'end');
    txt.textContent = hz >= 1000 ? (hz/1000).toFixed(1)+'k' : hz;
    g.appendChild(txt);
  }
}

function renderSpectrum(R) {
  const { kv, cells, thr, harmonics } = ST;
  const maxHz = R.notchMax * 1.3 || 800;

  buildGrid(maxHz);

  const barsG = document.getElementById('specBars');
  const labsG = document.getElementById('freqLabels');
  barsG.innerHTML = '';
  labsG.innerHTML = '';

  // Show current throttle bars
  const thrHarms = R.thrHarms;
  const barW = 18;
  const barGap = 4;
  const harmCount = harmonics; // how many to show

  thrHarms.slice(0, 4).forEach((h, i) => {
    if (i >= harmCount) { /* draw ghost */ }
    const xFrac = Math.min(1, h.hz / maxHz);
    const cx = PAD_L + xFrac * PLOT_W;
    const heightFrac = Math.min(1, h.hz / maxHz);
    const barH = Math.max(4, heightFrac * PLOT_H);
    const y = 10 + PLOT_H - barH;
    const color = HARMONIC_COLORS[i];
    const opacity = i < harmonics ? '1' : '0.18';

    // Bar
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'spec-bar');
    rect.setAttribute('x', cx - barW/2);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barW);
    rect.setAttribute('height', barH);
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', opacity);
    rect.style.filter = i < harmonics ? `drop-shadow(0 0 6px ${color})` : 'none';
    barsG.appendChild(rect);

    // Hz label
    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('class', 'spec-label');
    txt.setAttribute('x', cx);
    txt.setAttribute('y', y - 4);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', i < harmonics ? color : 'var(--muted)');
    txt.setAttribute('font-size', '8');
    txt.textContent = `${h.n}×  ${h.hz}Hz`;
    labsG.appendChild(txt);

    // X-axis label
    const xtxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xtxt.setAttribute('class', 'spec-label');
    xtxt.setAttribute('x', cx);
    xtxt.setAttribute('y', SVG_H - 5);
    xtxt.setAttribute('text-anchor', 'middle');
    xtxt.textContent = `${h.hz}`;
    labsG.appendChild(xtxt);
  });

  // Notch zone
  const nz = document.getElementById('notchZone');
  const x1Frac = Math.min(1, R.notchMin / maxHz);
  const x2Frac = Math.min(1, R.notchMax / maxHz);
  const nzX = PAD_L + x1Frac * PLOT_W;
  const nzW = Math.max(4, (x2Frac - x1Frac) * PLOT_W);
  nz.setAttribute('x', nzX);
  nz.setAttribute('width', nzW);

  // Throttle line
  const thrFrac = Math.min(1, R.thrHarms[0].hz / maxHz);
  const tl = document.getElementById('thrLine');
  const tlX = PAD_L + thrFrac * PLOT_W;
  tl.setAttribute('x1', tlX); tl.setAttribute('x2', tlX);
}

// ── Render all ─────────────────────────────────────────
function render() {
  const R = calc();

  // Live stats
  setEl('st_rpm', Math.round(R.rpmMax).toLocaleString());
  setEl('st_f1', Math.round(R.rpmMax / 60).toLocaleString() + ' Hz');
  setEl('st_f2', Math.round(R.rpmMax * 2 / 60).toLocaleString() + ' Hz');
  setEl('st_f3', Math.round(R.rpmMax * 3 / 60).toLocaleString() + ' Hz');

  // Throttle label
  setEl('thrLabel', ST.thr + '% throttle');
  setEl('sweepHz', `${R.thrHarms[0].hz} Hz (1×)`);
  document.getElementById('sweepFill').style.width = ST.thr + '%';

  // Spectrum
  renderSpectrum(R);

  // Table
  const tbody = document.getElementById('thrTableBody');
  tbody.innerHTML = R.table.map(row => `
    <tr>
      <td class="thr-row">${row.label}</td>
      <td>${row.rpm.toLocaleString()}</td>
      ${row.harmonics.map((h,i) => `<td class="hz-h${i+1}">${h.hz}</td>`).join('')}
    </tr>`).join('');

  // Recommendations
  setEl('rec_min', R.notchMin);
  setEl('rec_max', R.notchMax);
  setEl('rec_cnt', R.notchCnt);

  // CLI
  renderCLI(R);

  // Warnings
  const wp = document.getElementById('warnPanel');
  const wb = document.getElementById('warnBody');
  if (R.warnings.length) {
    wp.style.display = '';
    wb.innerHTML = R.warnings.map(w => `
      <div class="warn-card">
        <div class="warn-icon">⚠</div>
        <div>${w}</div>
      </div>`).join('');
  } else {
    wp.style.display = 'none';
  }

  // Notes
  document.getElementById('notesList').innerHTML =
    R.notes.map(n => `<li>${n}</li>`).join('');
}

function renderCLI(R) {
  const { kv, cells } = ST;
  const body = document.getElementById('cliBody');
  const btn = document.getElementById('cliCopyBtn');
  body.innerHTML = `
<span class="cli-cmt"># OBIX RPM Filter Setup — KV ${kv}, ${cells}S</span><br>
<span class="cli-cmt"># ─── dyn_notch settings ───</span><br>
<span class="cli-cmd">set </span><span class="cli-key">dyn_notch_count</span><span class="cli-cmd"> = </span><span class="cli-val">${R.notchCnt}</span><br>
<span class="cli-cmd">set </span><span class="cli-key">dyn_notch_min_hz</span><span class="cli-cmd"> = </span><span class="cli-val">${R.notchMin}</span><br>
<span class="cli-cmd">set </span><span class="cli-key">dyn_notch_max_hz</span><span class="cli-cmd"> = </span><span class="cli-val">${R.notchMax}</span><br>
<span class="cli-cmt"># ─── RPM filter harmonics ───</span><br>
<span class="cli-cmd">set </span><span class="cli-key">rpm_filter_harmonics</span><span class="cli-cmd"> = </span><span class="cli-val">${ST.harmonics}</span><br>
<span class="cli-cmd">set </span><span class="cli-key">rpm_filter_min_hz</span><span class="cli-cmd"> = </span><span class="cli-val">${R.notchMin}</span><br>
<span class="cli-cmt"># enable bidir + RPM filter in BF Configurator</span><br>
<span class="cli-cmd">set </span><span class="cli-key">dshot_bidir</span><span class="cli-cmd"> = </span><span class="cli-val">ON</span><br>
<span class="cli-cmd" style="color:var(--green);font-weight:600;">save</span>`;
  body.appendChild(btn);
}

function copyCLI() {
  const body = document.getElementById('cliBody');
  const lines = [];
  body.childNodes.forEach(n => {
    if (n.nodeType === 3) lines.push(n.textContent);
    else if (n.tagName === 'BR') lines.push('\n');
    else if (n.classList?.contains('cli-copy')) return;
    else lines.push(n.textContent);
  });
  navigator.clipboard.writeText(lines.join('').replace(/\n\n+/g, '\n').trim()).then(() => {
    const btn = document.getElementById('cliCopyBtn');
    btn.textContent = '✅ Copied!';
    btn.classList.add('ok');
    setTimeout(() => { btn.textContent = '📋 COPY'; btn.classList.remove('ok'); }, 2000);
  });
}

function setEl(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

// ── Wire controls ──────────────────────────────────────
const kvEl = document.getElementById('s_kv');
kvEl.addEventListener('input', () => {
  ST.kv = parseInt(kvEl.value);
  setEl('lv_kv', ST.kv.toLocaleString() + ' KV');
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  render();
});

const propEl = document.getElementById('s_prop');
propEl.addEventListener('input', () => {
  ST.prop = parseFloat(propEl.value);
  setEl('lv_prop', ST.prop + '"');
  render();
});

const thrEl = document.getElementById('s_thr');
thrEl.addEventListener('input', () => {
  ST.thr = parseInt(thrEl.value);
  setEl('lv_thr', ST.thr + '%');
  setEl('thrLabel', ST.thr + '% throttle');
  render();
});

document.getElementById('seg_cells').querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#seg_cells .seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ST.cells = parseInt(btn.dataset.val);
    render();
  });
});

document.getElementById('seg_harm').querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#seg_harm .seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ST.harmonics = parseInt(btn.dataset.val);
    render();
  });
});

document.getElementById('presetGrid').querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ST.kv    = parseInt(btn.dataset.kv);
    ST.cells = parseInt(btn.dataset.cell);
    ST.prop  = parseFloat(btn.dataset.prop);
    kvEl.value   = ST.kv;
    propEl.value = ST.prop;
    setEl('lv_kv', ST.kv.toLocaleString() + ' KV');
    setEl('lv_prop', ST.prop + '"');
    // Update cell seg
    document.querySelectorAll('#seg_cells .seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.val == String(ST.cells));
    });
    render();
  });
});

// ── Init ───────────────────────────────────────────────
setEl('lv_kv', ST.kv.toLocaleString() + ' KV');
setEl('lv_prop', ST.prop + '"');
setEl('lv_thr', ST.thr + '%');
render();
