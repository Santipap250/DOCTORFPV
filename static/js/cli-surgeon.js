// static/js/cli-surgeon.js — Batch C: extracted from templates/cli_surgeon.html inline <script>. No logic change.

/* ═══════════════════════════════════════════════════════
   CLI SURGEON — Operating Theater Brain
═══════════════════════════════════════════════════════ */

const RULE_ICONS = {
  critical: '🔴', danger: '🔴',
  warning: '🟡',
  info: '🔵',
};
const RULE_COLORS = {
  critical: 'var(--red)', danger: 'var(--red)',
  warning:  'var(--amber)',
  info:     'var(--blue)',
};

let lastResult = null;
let allParams  = {};

// ── Pipeline ────────────────────────────────────────────
function pipe(step) {
  // step: 0=paste,1=parse,2=diagnose,3=fix,4=export
  document.querySelectorAll('.pipe-step').forEach((el, i) => {
    el.classList.remove('active', 'done', 'error');
    if (i < step) el.classList.add('done');
    else if (i === step) el.classList.add('active');
  });
}
function pipeError(step) {
  document.querySelectorAll('.pipe-step').forEach((el, i) => {
    if (i === step) el.classList.add('error');
  });
}

// ── Server check ─────────────────────────────────────
async function checkServer() {
  try {
    const r = await fetch('/ping', { cache: 'no-store' });
    setStatus(r.ok);
  } catch { setStatus(false); }
}
function setStatus(on) {
  const el = document.getElementById('srvStatus');
  el.className = 'srv-status ' + (on ? 'online' : 'offline');
  el.innerHTML = `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="currentColor"/></svg> ${on ? 'Server Online' : 'Local Mode'}`;
}
checkServer();

// ── Line counter ─────────────────────────────────────
const dumpEl = document.getElementById('dumpEditor');
dumpEl.addEventListener('input', () => {
  const lines = dumpEl.value.split('\n').length;
  document.getElementById('lineInfo').textContent = lines.toLocaleString() + ' บรรทัด';
  if (dumpEl.value.trim()) pipe(0);
});

// ── Analyze ───────────────────────────────────────────
async function analyze() {
  const txt = dumpEl.value.trim();
  if (!txt) { alert('กรุณาวาง diff all / dump ก่อน'); return; }

  pipe(1);
  document.getElementById('sumText').textContent = 'กำลังวิเคราะห์...';
  document.getElementById('rulesList').innerHTML = '<div style="color:#3a6050;font-size:12px;padding:16px;text-align:center;font-family:var(--font-d);letter-spacing:.1em;">SCANNING...</div>';

  try {
    pipe(2);
    const res = await fetch('/analyze_cli', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ dump: txt }),
    });

    if (res.ok) {
      const data = await res.json();
      pipe(3);
      applyResult(data);
      pipe(4);
    } else {
      // Fallback to local
      const data = localAnalyze(txt);
      pipe(3);
      applyResult(data);
      pipe(4);
    }
  } catch (e) {
    console.warn('Server fail, local fallback:', e);
    setStatus(false);
    const data = localAnalyze(txt);
    pipe(3);
    applyResult(data);
    pipe(4);
  }
}

// ── Local analysis fallback ───────────────────────────
function parseParams(text) {
  const params = {};
  const rawLines = text.split('\n');
  for (const raw of rawLines) {
    let ln = raw.replace(/(#|;).*$/, '').trim();
    if (!ln) continue;
    const m = ln.match(/^(?:set\s+)?([a-z0-9_\-]+)\s*=\s*(.+)$/i);
    if (m) {
      const k = m[1].toLowerCase().replace(/-/g, '_');
      let v = m[2].trim();
      if (/^-?\d+$/.test(v)) v = parseInt(v);
      else if (/^-?\d+\.\d+$/.test(v)) v = parseFloat(v);
      params[k] = v;
    }
  }
  params._raw = text.toLowerCase();
  return params;
}

function localAnalyze(text) {
  const params = parseParams(text);
  const rules = [];
  const raw = params._raw || '';

  const add = (id, level, msg, suggestion) => rules.push({ id, level, msg, suggestion });

  // min throttle
  for (const k of ['min_throttle','mincommand']) {
    if (k in params) {
      const v = Number(params[k]);
      if (!isNaN(v)) {
        if (v < 1000) add('min_throttle_low','warning',`${k} ต่ำ (${v}) — อาจเกิด motor stutter/idle`,'ตั้ง min_throttle ~1000-1020');
        else if (v > 1100) add('min_throttle_high','info',`${k} สูง (${v})`,'พิจารณาลดหาก throttle response แย่');
      }
      break;
    }
  }

  // failsafe
  if (!/(failsafe|failsafe_delay|failsafe_action)/.test(raw))
    add('no_failsafe','warning','ไม่พบการตั้งค่า failsafe','ตั้ง failsafe_delay, failsafe_action, failsafe_throttle');

  // protocol
  const proto = String(params.motor_pwm_protocol||'').toUpperCase();
  if (proto && ['DISABLED','STANDARD','ONESHOT125','ONESHOT42','MULTISHOT'].includes(proto))
    add('protocol_old','warning',`motor_pwm_protocol = ${proto} เป็น protocol เก่า`,'set motor_pwm_protocol = DSHOT600');

  // bidir + rpm
  const bidir = String(params.dshot_bidir||'').toUpperCase();
  if (/rpm_filter/.test(raw) && bidir === 'OFF')
    add('bidir_off_with_rpm','warning','RPM filter เปิดอยู่แต่ dshot_bidir = OFF — RPM filter ไม่ทำงาน','set dshot_bidir = ON');

  // iterm_relax
  if (String(params.iterm_relax||'').toUpperCase() === 'OFF')
    add('iterm_relax_off','warning','iterm_relax = OFF — I-term wind up ระหว่าง maneuver','set iterm_relax = RPH');

  // TPA
  if (params.tpa_rate !== undefined) {
    const t = Number(params.tpa_rate);
    if (!isNaN(t)) {
      if (t > 70) add('tpa_high','warning',`tpa_rate = ${t}% สูงมาก`,'set tpa_rate = 50 | set tpa_breakpoint = 1600');
      if (t === 0) add('tpa_zero','info','tpa_rate = 0 — D-term ไม่ถูก attenuate','set tpa_rate = 40 | set tpa_breakpoint = 1600');
    }
  }

  // PID extremes
  const pidMap = { p: 100, i: 130, d: 80 };
  for (const [type, thresh] of Object.entries(pidMap)) {
    for (const axis of ['roll','pitch','yaw']) {
      const key = `${type}_${axis}`;
      if (key in params) {
        const v = Number(params[key]);
        if (!isNaN(v) && v > thresh)
          add(`pid_high_${key}`, 'critical', `${key} สูง (${v}) — อาจเกิด oscillation (threshold ${thresh})`, 'ลด PID ลงทีละ 10-20% แล้วทดสอบ');
        if (!isNaN(v) && v === 0)
          add(`pid_zero_${key}`, 'info', `${key} = 0 — แกนนี้ไม่มีการควบคุม`, 'ตรวจสอบว่าตั้งใจหรือไม่');
      }
    }
  }

  // VTX
  if (/vtx|smartaudio|tramp/.test(raw))
    add('vtx_found','info','พบ VTX config (SmartAudio/Tramp)','ตรวจสอบ power/channel/pitmode/antenna');

  // serial
  if (!/(serial|uart|serialrx|receiver)/.test(raw))
    add('no_serial','info','ไม่พบ serial/receiver config','ตรวจสอบ port สำหรับ ELRS/FrSky/OSD');

  // looptime
  if (params.looptime !== undefined) {
    const lt = Number(params.looptime);
    if (!isNaN(lt)) {
      if (lt < 1000) add('looptime_low','warning',`looptime ต่ำ (${lt}µs)`,'ESC/CPU อาจไม่รองรับ — ลองเพิ่มเป็น 1000');
      if (lt > 4000) add('looptime_high','warning',`looptime สูง (${lt}µs)`,'ลดเพื่อลด input lag หากฮาร์ดแวร์รองรับ');
    }
  }

  const fixes = buildFixes(rules, params);
  return {
    summary: `พบ ${Object.keys(params).length - 1} parameters · ${rules.length} issues`,
    rules, fix_commands: fixes, params,
  };
}

function buildFixes(rules, params) {
  const fixes = [];
  fixes.push('# OBIX Auto-Fix — ตรวจสอบก่อน paste เสมอ');
  rules.forEach(r => {
    if (r.id === 'min_throttle_low')   fixes.push('set min_throttle = 1000');
    if (r.id === 'no_failsafe') {
      fixes.push('set failsafe_delay = 10');
      fixes.push('set failsafe_off_delay = 60');
      fixes.push('set failsafe_throttle = 1000');
      fixes.push('set failsafe_action = DROP');
    }
    if (r.id === 'protocol_old')       fixes.push('set motor_pwm_protocol = DSHOT600');
    if (r.id === 'bidir_off_with_rpm') fixes.push('set dshot_bidir = ON');
    if (r.id === 'iterm_relax_off')    fixes.push('set iterm_relax = RPH\nset iterm_relax_type = SETPOINT');
    if (r.id === 'tpa_high')           fixes.push('set tpa_rate = 50\nset tpa_breakpoint = 1600');
    if (r.id === 'tpa_zero')           fixes.push('set tpa_rate = 40\nset tpa_breakpoint = 1600');
    if (r.id === 'looptime_low')       fixes.push('set looptime = 1000');
    if (r.id.startsWith('pid_high_')) {
      const key = r.id.replace('pid_high_', '');
      if (params[key] !== undefined) {
        const cur = Number(params[key]);
        if (!isNaN(cur)) fixes.push(`set ${key} = ${Math.round(cur * 0.80)}`);
      }
    }
  });
  if (fixes.length > 1) fixes.push('save');
  return fixes;
}

// ── Apply result ──────────────────────────────────────
function applyResult(data) {
  lastResult = data;
  const rules = data.rules || [];
  const params = data.params || {};
  allParams = params;

  // Summary
  document.getElementById('sumText').textContent = data.summary || `${rules.length} issues พบ`;

  // Firmware badge
  const fw = data.firmware;
  const fwEl = document.getElementById('fwBadge');
  if (fw && fw !== 'unknown') {
    fwEl.style.display = '';
    fwEl.textContent = 'BF ' + fw;
  } else {
    fwEl.style.display = 'none';
  }

  // Stats
  const critN = rules.filter(r => ['critical','danger'].includes(r.level)).length;
  const warnN = rules.filter(r => r.level === 'warning').length;
  const infoN = rules.filter(r => r.level === 'info').length;
  const paramN = Object.keys(params).filter(k => !k.startsWith('_')).length;
  setEl('st_params', paramN);
  setEl('st_crit',   critN);
  setEl('st_warn',   warnN);
  setEl('st_info',   infoN);
  document.getElementById('paramCount').textContent = paramN + ' params detected';
  document.getElementById('paramCountBadge').textContent = paramN + ' params';

  // Severity badges
  ['Ok','Warn','Crit','Info'].forEach(s => document.getElementById('badge'+s).classList.remove('show'));
  if (critN > 0) document.getElementById('badgeCrit').classList.add('show');
  if (warnN > 0) document.getElementById('badgeWarn').classList.add('show');
  if (infoN > 0) document.getElementById('badgeInfo').classList.add('show');
  if (critN === 0 && warnN === 0) document.getElementById('badgeOk').classList.add('show');

  // Rules
  renderRules(rules);

  // Fix CLI
  renderFixCLI(data.fix_commands || []);

  // Param explorer
  renderParams(params);
}

function renderRules(rules) {
  const list = document.getElementById('rulesList');
  document.getElementById('rulesEmpty').style.display = rules.length ? 'none' : 'block';

  const existing = list.querySelectorAll('.rule-card');
  existing.forEach(e => e.remove());

  if (rules.length === 0) return;

  rules.forEach((r, i) => {
    const level = r.level === 'danger' ? 'critical' : r.level;
    const color = RULE_COLORS[level] || 'var(--blue)';
    const icon  = RULE_ICONS[level]  || '🔵';

    const card = document.createElement('div');
    card.className = 'rule-card fade-in';
    card.style.animationDelay = (i * 0.05) + 's';
    card.innerHTML = `
      <div class="rule-hd" onclick="toggleRule(this)">
        <div class="rule-sev-bar" style="background:${color}"></div>
        <div class="rule-icon">${icon}</div>
        <div class="rule-body">
          <div class="rule-msg">${escHtml(r.msg)}</div>
          <div class="rule-sug">${escHtml(r.suggestion || '')}</div>
        </div>
        <div class="rule-expand" style="color:${color};">▾</div>
      </div>
      <div class="rule-detail">
        <div class="rule-detail-inner">
          <div style="font-family:var(--font-m);font-size:11px;color:#3a6050;margin-bottom:8px;">
            ID: ${r.id} · Level: ${r.level.toUpperCase()}
          </div>
          ${r.suggestion ? `<div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:10px;">${escHtml(r.suggestion)}</div>` : ''}
          ${r.suggestion && r.suggestion.includes('set ') ? `<button class="rule-fix-btn" onclick="addFix('${escHtml(r.suggestion)}')">⚡ Add to Fix CLI</button>` : ''}
        </div>
      </div>`;
    list.appendChild(card);
  });
}

function toggleRule(hd) {
  const card = hd.closest('.rule-card');
  card.classList.toggle('open');
}

function renderFixCLI(lines) {
  const wrap = document.getElementById('fixCLIWrap');
  if (!lines || lines.length === 0) {
    wrap.innerHTML = '<div class="fix-empty">ไม่มี fix command (ไม่พบปัญหา หรือยังไม่ได้วิเคราะห์)</div>';
    return;
  }
  wrap.innerHTML = lines.map(line => {
    const l = line.trim();
    if (!l) return '<br>';
    if (l.startsWith('#')) return `<div><span class="fc-cmt">${escHtml(line)}</span></div>`;
    if (l === 'save') return `<div><span class="fc-cmd" style="color:var(--green);font-weight:600;">save</span></div>`;
    const m = l.match(/^(set\s+)(\S+)(\s*=\s*)(.+)$/);
    if (m) return `<div><span class="fc-cmd">${escHtml(m[1])}</span><span class="fc-key">${escHtml(m[2])}</span><span class="fc-cmd">${escHtml(m[3])}</span><span class="fc-val">${escHtml(m[4])}</span></div>`;
    return `<div><span class="fc-cmd">${escHtml(line)}</span></div>`;
  }).join('');
}

function renderParams(params) {
  const flagged = new Set((lastResult?.rules||[]).flatMap(r => {
    const m = r.msg.match(/^([a-z0-9_]+)\s/);
    return m ? [m[1]] : [];
  }));

  const entries = Object.entries(params).filter(([k]) => !k.startsWith('_'));
  const grid = document.getElementById('paramGrid');
  const query = document.getElementById('paramSearch').value.toLowerCase();

  const filtered = entries.filter(([k, v]) => !query || k.includes(query) || String(v).includes(query));

  grid.innerHTML = filtered.slice(0, 200).map(([k, v]) => `
    <div class="param-row ${flagged.has(k) ? 'flagged' : ''}">
      <span class="param-key">${k}</span>
      <span class="param-val">${String(v)}</span>
    </div>`).join('') || '<div style="color:#2a5040;font-size:11px;padding:6px 0;">ไม่พบ parameter ที่ตรงกัน</div>';
}

document.getElementById('paramSearch').addEventListener('input', () => {
  if (allParams) renderParams(allParams);
});

function addFix(sug) {
  const wrap = document.getElementById('fixCLIWrap');
  const div = document.createElement('div');
  div.innerHTML = `<span class="fc-cmt"># (added manually)</span>\n<span class="fc-cmd">${escHtml(sug)}</span>`;
  wrap.appendChild(div);
}

// ── Compare ────────────────────────────────────────────
function runCompare() {
  const a = document.getElementById('cmpA').value.trim();
  const b = document.getElementById('cmpB').value.trim();
  if (!a || !b) { alert('ต้องการทั้ง Config A และ B'); return; }

  const pA = parseParams(a), pB = parseParams(b);
  const allKeys = new Set([
    ...Object.keys(pA).filter(k => !k.startsWith('_')),
    ...Object.keys(pB).filter(k => !k.startsWith('_')),
  ]);

  const diffs = [];
  for (const k of allKeys) {
    const va = pA[k], vb = pB[k];
    if (va === undefined) diffs.push({ type: 'added', k, va: '—', vb });
    else if (vb === undefined) diffs.push({ type: 'removed', k, va, vb: '—' });
    else if (String(va) !== String(vb)) diffs.push({ type: 'changed', k, va, vb });
  }

  const res = document.getElementById('diffResult');
  if (diffs.length === 0) {
    res.innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px 0;">✅ ไม่พบความต่าง — config ทั้งสองเหมือนกัน</div>';
    return;
  }

  res.innerHTML = `
    <div style="font-family:var(--font-d);font-size:8px;letter-spacing:.1em;color:#3a6050;margin-bottom:10px;">${diffs.length} DIFFERENCES FOUND</div>` +
    diffs.map(d => `
      <div class="diff-row ${d.type}">
        <span class="diff-key">${d.k}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="diff-a">${d.va}</span>
          <span style="color:#3a6050;">→</span>
          <span class="diff-b">${d.vb}</span>
        </div>
      </div>`).join('');
}

// ── Utilities ─────────────────────────────────────────
function copyAllFixes() {
  if (!lastResult || !lastResult.fix_commands?.length) { alert('ไม่มี fix command'); return; }
  navigator.clipboard.writeText(lastResult.fix_commands.join('\n')).then(() => {
    const btn = document.getElementById('copyAllBtn');
    btn.textContent = '✅ Copied!'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = '📋 COPY ALL'; btn.classList.remove('ok'); }, 2000);
  });
}

function downloadReport() {
  if (!lastResult) { alert('ยังไม่มีผลการวิเคราะห์'); return; }
  const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'obix_cli_surgeon_report.json'; a.click();
  URL.revokeObjectURL(url);
}

function setEl(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Tabs ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Events ────────────────────────────────────────────
document.getElementById('analyzeBtn').addEventListener('click', analyze);
document.getElementById('clearBtn').addEventListener('click', () => {
  dumpEl.value = '';
  document.getElementById('lineInfo').textContent = '0 บรรทัด';
  document.getElementById('paramCount').textContent = 'รอวิเคราะห์...';
  lastResult = null; allParams = {};
  pipe(0);
});
document.getElementById('sampleBtn').addEventListener('click', () => {
  dumpEl.value = `# Betaflight / INAV CLI diff all — sample
set min_throttle = 980
set motor_pwm_protocol = ONESHOT125
set dshot_bidir = OFF
set p_roll = 95
set i_roll = 90
set d_roll = 75
set p_pitch = 95
set i_pitch = 90
set d_pitch = 70
set p_yaw = 40
set i_yaw = 45
set tpa_rate = 80
set tpa_breakpoint = 1450
set iterm_relax = OFF
set rpm_filter_harmonics = 3
# save`;
  document.getElementById('lineInfo').textContent = dumpEl.value.split('\n').length + ' บรรทัด';
  pipe(0);
});

document.getElementById('fileInput').addEventListener('change', ev => {
  const f = ev.target.files[0]; if (!f) return;
  document.getElementById('edFilename').textContent = f.name;
  const r = new FileReader(); r.onload = () => {
    dumpEl.value = r.result;
    document.getElementById('lineInfo').textContent = dumpEl.value.split('\n').length + ' บรรทัด';
    pipe(0);
  };
  r.readAsText(f);
});

// Drag & drop
const dz = document.getElementById('dropzone');
dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', e => { dz.classList.remove('drag-over'); });
dz.addEventListener('drop', e => {
  e.preventDefault(); dz.classList.remove('drag-over');
  const f = e.dataTransfer.files?.[0];
  if (f) {
    document.getElementById('edFilename').textContent = f.name;
    const r = new FileReader(); r.onload = () => {
      dumpEl.value = r.result;
      document.getElementById('lineInfo').textContent = dumpEl.value.split('\n').length + ' บรรทัด';
      pipe(0);
    };
    r.readAsText(f);
  } else {
    const t = e.dataTransfer.getData('text'); if (t) { dumpEl.value = t; pipe(0); }
  }
});

pipe(0);
