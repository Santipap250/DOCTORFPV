// static/js/pid-advisor.js — Batch B: extracted from templates/pid_advisor.html inline <script>. Reads ADVICE_MAP/ALL_SYMPTOMS globals (still rendered inline from Jinja) — no logic change.

const SYMPTOM_MAP = {};
ALL_SYMPTOMS.forEach(function(s){ SYMPTOM_MAP[s.id] = s; });

// ── State ──
var currentSymptom = null;
var currentProfile = 'freestyle';
var radarChart = null;

// ── Smart helpers ──
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function avg(nums) {
  var arr = (nums || []).filter(function(n){ return Number.isFinite(n); });
  if(!arr.length) return 0;
  return arr.reduce(function(a,b){ return a + b; }, 0) / arr.length;
}
function labelFromSeverity(sev) {
  var map = {critical:'CRITICAL', high:'HIGH', medium:'MEDIUM', low:'LOW'};
  return map[sev] || String(sev || 'INFO').toUpperCase();
}
function fitForProfile(profile, category) {
  profile = String(profile || '').toLowerCase();
  category = String(category || '').toLowerCase();
  var score = 66;

  if(profile === 'freestyle'){
    if(/oscillation|propwash|response|pid_advanced|thermal/.test(category)) score = 88;
    else if(/yaw|setup/.test(category)) score = 74;
    else score = 78;
  }else if(profile === 'racing'){
    if(/response|yaw|setup/.test(category)) score = 90;
    else if(/oscillation|thermal/.test(category)) score = 70;
    else score = 80;
  }else if(profile === 'longrange'){
    if(/thermal|setup|vtx|video/.test(category)) score = 88;
    else if(/oscillation|propwash/.test(category)) score = 72;
    else score = 77;
  }else{
    if(/setup|response/.test(category)) score = 82;
  }

  return clamp(Math.round(score), 45, 96);
}
function filterHeadroom(pid) {
  var gyro = Math.max(1, pid.gyro_lpf1 || 0);
  var dterm = Math.max(0, pid.dterm_lpf1 || 0);
  var gap = gyro - dterm;
  var pct = clamp(Math.round((gap / gyro) * 100), 0, 100);
  return { gap: gap, pct: pct };
}
function tuneLoad(pid, adv) {
  var pAvg = avg([pid.p_roll, pid.p_pitch, pid.p_yaw]);
  var dAvg = avg([pid.d_roll, pid.d_pitch, pid.d_yaw]);
  var ratio = dAvg / Math.max(1, pAvg);
  var sev = String(adv.severity || 'low').toLowerCase();
  var base = 24;
  if(sev === 'critical') base = 84;
  else if(sev === 'high') base = 70;
  else if(sev === 'medium') base = 52;
  else base = 34;

  base += clamp(Math.round((ratio - 0.65) * 42), -10, 18);
  base += clamp(Math.round((120 - pid.gyro_lpf1) / 8), -8, 8);
  base -= clamp(Math.round((pid.ff - 100) / 20), -6, 6);

  return clamp(base, 8, 96);
}
function tuneLoadLabel(v) {
  if(v >= 80) return 'Critical';
  if(v >= 65) return 'High';
  if(v >= 45) return 'Medium';
  return 'Low';
}
function smartSummary(sym, adv, pid) {
  var cat = String(sym.category || '').toLowerCase();
  var pAvg = avg([pid.p_roll, pid.p_pitch, pid.p_yaw]);
  var dAvg = avg([pid.d_roll, pid.d_pitch, pid.d_yaw]);
  var head = filterHeadroom(pid).pct;
  var fit = fitForProfile(currentProfile, cat);

  if(/oscillation|propwash/.test(cat)) {
    return 'อาการนี้มักตอบสนองดีที่สุดเมื่อ D-term และ filter ถูกตั้งแบบพอเหมาะ — ค่า P/D ปัจจุบันกับ headroom filter ชี้ว่าควรปรับทีละน้อย แล้วทดสอบ hover ก่อน';
  }
  if(/response|yaw/.test(cat)) {
    return 'แนวโน้มอยู่ที่การเพิ่มความคมของ stick response โดยคุม yaw/center behavior ให้เสถียร — profile ปัจจุบันเข้ากับการจูนแบบนี้พอสมควร';
  }
  if(/thermal|esc/.test(cat)) {
    return 'จุดสำคัญคือความร้อนและการป้องกันโหลดสะสม — ถ้า D สูงหรือ filter headroom น้อย ควรลดความร้อนของระบบก่อน';
  }
  if(/setup|video|vtx/.test(cat)) {
    return 'ปัญหากลุ่มนี้มักไม่ใช่ PID ล้วน แต่สัมพันธ์กับ hardware / signal / configuration — ควรตรวจทีละชั้นเพื่อตัดสาเหตุให้ชัด';
  }

  return 'ระบบคำนวณจาก PID จริง, filter headroom และ flight profile เพื่อให้คำแนะนำที่กะทัดรัดแต่แม่นยำที่สุดสำหรับอาการนี้';
}


// ── PID getters ──

function renderHeroMetrics(adv, sym, pid) {
  var conf = clamp(Math.round((adv.confidence || 76) + (adv.severity === 'critical' ? 8 : adv.severity === 'high' ? 5 : adv.severity === 'medium' ? 3 : 0)), 55, 98);
  var head = filterHeadroom(pid);
  var fit = fitForProfile(currentProfile, sym.category);
  var load = tuneLoad(pid, adv);
  var loadLbl = tuneLoadLabel(load);

  document.getElementById('heroConfVal').textContent = conf + '%';
  document.getElementById('heroConfSub').textContent = adv.quick_win ? 'ความมั่นใจจาก pattern นี้สูง' : 'Confidence จาก pattern + profile';
  document.getElementById('heroHeadroomVal').textContent = head.pct + '%';
  document.getElementById('heroHeadroomSub').textContent = head.gap >= 0 ? ('Gap '+head.gap+' Hz ระหว่าง gyro / d-term') : 'd-term สูงกว่า gyro — ควรระวัง noise';
  document.getElementById('heroFitVal').textContent = fit + '%';
  document.getElementById('heroFitSub').textContent = currentProfile.charAt(0).toUpperCase() + currentProfile.slice(1) + ' · ' + (fit >= 85 ? 'match ดีมาก' : fit >= 75 ? 'match ปานกลาง' : 'ควรทดสอบเพิ่ม');
  document.getElementById('heroLoadVal').textContent = loadLbl;
  document.getElementById('heroLoadSub').textContent = 'Tune load ประเมินจาก severity และ balance ของ PID';
}

function renderSmartPanel(adv, sym, pid) {
  var panel = document.getElementById('res-smart');
  var head = filterHeadroom(pid);
  var fit = fitForProfile(currentProfile, sym.category);
  var load = tuneLoad(pid, adv);
  var loadLbl = tuneLoadLabel(load);
  var summary = smartSummary(sym, adv, pid);
  panel.style.display = 'grid';
  panel.className = 'smart-grid';

  var cards = [
    {
      cls: load >= 80 ? 'warn' : load >= 55 ? 'info' : 'good',
      lbl: 'Profile Fit',
      val: fit + '%',
      desc: currentProfile.charAt(0).toUpperCase() + currentProfile.slice(1) + ' ↔ ' + (sym.category || 'general'),
      bar: fit
    },
    {
      cls: head.pct < 30 ? 'warn' : 'good',
      lbl: 'Filter Headroom',
      val: head.pct + '%',
      desc: 'Gyro LPF ' + pid.gyro_lpf1 + 'Hz · D-term LPF ' + pid.dterm_lpf1 + 'Hz',
      bar: head.pct
    },
    {
      cls: load >= 80 ? 'purple' : load >= 55 ? 'warn' : 'info',
      lbl: 'Tune Load',
      val: loadLbl,
      desc: 'ความเข้มของการปรับจากอาการที่เลือก',
      bar: load
    }
  ];

  panel.innerHTML = cards.map(function(c){
    return '<div class="smart-card ' + c.cls + '">' +
      '<div class="smart-lbl">' + c.lbl + '</div>' +
      '<div class="smart-val">' + c.val + '</div>' +
      '<div class="smart-desc">' + c.desc + '</div>' +
      '<div class="smart-bar"><span style="width:' + clamp(c.bar,0,100) + '%"></span></div>' +
    '</div>';
  }).join('');

  // add a summary card span under the grid if wanted
  var summaryCard = document.createElement('div');
  summaryCard.className = 'smart-card ' + (adv.severity === 'critical' ? 'warn' : 'good');
  summaryCard.style.gridColumn = '1 / -1';
  summaryCard.innerHTML =
    '<div class="smart-lbl">Smart Summary</div>' +
    '<div class="smart-desc" style="font-size:13px;color:var(--text);line-height:1.8">' + summary + '</div>';
  panel.appendChild(summaryCard);
}

function getPID() {
  return {
    p_roll:  +document.getElementById('pid_p_roll').value || 48,
    i_roll:  +document.getElementById('pid_i_roll').value || 90,
    d_roll:  +document.getElementById('pid_d_roll').value || 38,
    p_pitch: +document.getElementById('pid_p_pitch').value || 52,
    i_pitch: +document.getElementById('pid_i_pitch').value || 90,
    d_pitch: +document.getElementById('pid_d_pitch').value || 40,
    p_yaw:   +document.getElementById('pid_p_yaw').value || 40,
    i_yaw:   +document.getElementById('pid_i_yaw').value || 90,
    d_yaw:   +document.getElementById('pid_d_yaw').value || 0,
    gyro_lpf1: +document.getElementById('filt_gyro').value || 200,
    dterm_lpf1: +document.getElementById('filt_dterm').value || 110,
    ag:      +document.getElementById('filt_ag').value || 5,
    ff:      +document.getElementById('filt_ff').value || 100,
  };
}

// ── Profile ──
function setProfile(btn) {
  document.querySelectorAll('.profile-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  currentProfile = btn.dataset.p;
  if(currentSymptom) renderResult(currentSymptom);
}

// ── Symptom filter ──
function filterSymptoms(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll('.symptom-item').forEach(function(item) {
    var name = item.querySelector('.symptom-name').textContent.toLowerCase();
    var nameEn = (item.querySelector('.symptom-name-en') || {}).textContent || '';
    nameEn = nameEn.toLowerCase();
    item.style.display = (!q || name.indexOf(q)>=0 || nameEn.indexOf(q)>=0) ? '' : 'none';
  });
  // Hide empty category groups
  document.querySelectorAll('.category-group').forEach(function(g){
    var visible = Array.from(g.querySelectorAll('.symptom-item')).some(function(i){ return i.style.display !== 'none'; });
    g.style.display = visible ? '' : 'none';
  });
}

// ── Select symptom ──
function selectSymptom(id) {
  // Deactivate all
  document.querySelectorAll('.symptom-item').forEach(function(i){ i.classList.remove('active'); });
  var item = document.getElementById('si-'+id);
  if(item) item.classList.add('active');

  currentSymptom = id;
  renderResult(id);

  // Scroll to top of right panel on mobile
  if(window.innerWidth <= 960) {
    document.querySelector('.adv-right').scrollIntoView({behavior:'smooth'});
  }
}

// ── Render result ──
function renderResult(id) {
  var adv = ADVICE_MAP[id];
  var sym = SYMPTOM_MAP[id];
  if(!adv || !sym) return;
  var pid = getPID();

  document.getElementById('advEmpty').style.display = 'none';
  var result = document.getElementById('advResult');
  result.classList.add('show');

  // Header
  var iconWrap = document.getElementById('res-icon-wrap');
  iconWrap.textContent = sym.icon || '🔧';
  iconWrap.style.background = (sym.color||'#10c47a') + '15';
  iconWrap.style.borderColor = sym.color || 'var(--border)';

  document.getElementById('res-title').textContent = adv.label;
  document.getElementById('res-title-en').textContent = adv.label_en || '';

  // Severity pill
  var sevColors = {critical:'r', high:'r', medium:'a', low:'b'};
  var sevLabels = {critical:'🔴 CRITICAL', high:'🟠 HIGH', medium:'🟡 MEDIUM', low:'🔵 LOW'};
  var sevPill = document.getElementById('res-severity-pill');
  sevPill.className = 'v5-pill ' + (sevColors[adv.severity]||'a');
  sevPill.textContent = sevLabels[adv.severity] || adv.severity;

  // Confidence
  document.getElementById('res-confidence-fill').style.width = (adv.confidence||75) + '%';
  document.getElementById('res-confidence-pct').textContent = (adv.confidence||75) + '%';

  // Hero intelligence layer
  renderHeroMetrics(adv, sym, pid);
  renderSmartPanel(adv, sym, pid);

  // Axes pills
  var axesPills = document.getElementById('res-axes-pills');
  axesPills.innerHTML = '';
  if(adv.axes_affected && adv.axes_affected.length) {
    adv.axes_affected.forEach(function(ax){
      var span = document.createElement('span');
      span.className = 'v5-pill neu';
      span.style.fontSize = '9px';
      span.textContent = ax.toUpperCase();
      axesPills.appendChild(span);
    });
  }

  // Quick win
  var qwBanner = document.getElementById('res-quickwin');
  if(adv.quick_win) {
    qwBanner.style.display = 'flex';
    document.getElementById('res-quickwin-text').textContent = adv.quick_win;
  } else {
    qwBanner.style.display = 'flex';
    document.getElementById('res-quickwin-text').textContent = smartSummary(sym, adv, pid);
  }

  // Diagnosis
  document.getElementById('res-diagnosis').textContent = adv.diagnosis;
  document.getElementById('res-cause').textContent = adv.primary_cause;

  // Adjustments
  renderAdjustments(adv.adjustments);

  // PID Delta
  renderPIDDelta(adv.adjustments);

  // CLI
  renderCLI(adv.cli_template);

  // Radar
  renderRadar(adv);

  // Blackbox hint
  var bbWrap = document.getElementById('res-bb-wrap');
  if(adv.blackbox_hint) {
    bbWrap.style.display = 'block';
    document.getElementById('res-bb-hint').textContent = adv.blackbox_hint;
  } else {
    bbWrap.style.display = 'none';
  }

  // BF version note
  var bfWrap = document.getElementById('res-bf-wrap');
  if(adv.bf_version_note) {
    bfWrap.style.display = 'block';
    document.getElementById('res-bf-note').textContent = adv.bf_version_note;
  } else {
    bfWrap.style.display = 'none';
  }

  // Tips
  var tipsList = document.getElementById('res-tips');
  tipsList.innerHTML = '';
  (adv.tips || []).forEach(function(tip, i) {
    var div = document.createElement('div');
    div.className = 'tip-item';
    div.innerHTML = '<div class="tip-num">0'+(i+1)+'</div><div>'+tip+'</div>';
    tipsList.appendChild(div);
  });

  // Related
  var relWrap = document.getElementById('res-related-wrap');
  var relGrid = document.getElementById('res-related');
  relGrid.innerHTML = '';
  if(adv.related && adv.related.length) {
    relWrap.style.display = 'block';
    adv.related.forEach(function(relId) {
      var relSym = SYMPTOM_MAP[relId];
      if(!relSym) return;
      var chip = document.createElement('div');
      chip.className = 'related-chip';
      chip.onclick = function(){ selectSymptom(relId); };
      chip.innerHTML = '<span>'+relSym.icon+'</span><span>'+relSym.label+'</span>';
      relGrid.appendChild(chip);
    });
  } else {
    relWrap.style.display = 'none';
  }
}

// ── Adjustments ──
function renderAdjustments(adjs) {
  var grid = document.getElementById('res-adj');
  grid.innerHTML = '';
  if(!adjs) return;

  adjs.forEach(function(adj) {
    var dir = String(adj.direction || '');
    var dirClass = 'check';
    var dirLabel = dir || 'review';
    if(/เพิ่ม|up|raise|boost/i.test(dir)) { dirClass='up'; dirLabel='↑ '+dirLabel; }
    else if(/ลด|down|reduce|lower/i.test(dir)) { dirClass='down'; dirLabel='↓ '+dirLabel; }
    else if(/ตั้ง|เปลี่ยน|assign|set/i.test(dir)) { dirClass='set'; }

    var card = document.createElement('div');
    card.className = 'adj-card ' + dirClass;
    card.innerHTML =
      '<div class="adj-param">'+adj.param+'</div>'+
      '<div class="adj-delta-row">'+
        '<span class="adj-dir '+dirClass+'">'+dirLabel+'</span>'+
        '<span class="adj-amount">'+adj.amount+'</span>'+
      '</div>'+
      '<div class="adj-reason">'+adj.reason+'</div>';
    grid.appendChild(card);
  });
}

// ── PID Delta ──
function renderPIDDelta(adjs) {
  var pid = getPID();
  var deltas = {p_roll:0, i_roll:0, d_roll:0, p_pitch:0, i_pitch:0, d_pitch:0, p_yaw:0, i_yaw:0, d_yaw:0};

  function signedDelta(adj) {
    if(typeof adj.delta === 'number' && !isNaN(adj.delta)) return adj.delta;
    var amt = adj.amount;
    if(typeof amt === 'string') {
      var n = parseFloat(amt.replace(/[^\d.-]/g,''));
      if(!isNaN(n)) {
        if(/ลด|down|lower|reduce|decrease/i.test(String(adj.direction||''))) return -Math.abs(n);
        if(/เพิ่ม|up|raise|boost|increase/i.test(String(adj.direction||''))) return Math.abs(n);
        return n;
      }
    }
    if(typeof amt === 'number') return amt;
    return 0;
  }

  if(adjs) {
    adjs.forEach(function(adj) {
      var d = signedDelta(adj);
      if(d === 0) return;
      var axis = String(adj.axis || '').toLowerCase();
      var param = String(adj.param || '').toLowerCase();

      // Smart mapping: exact term first, then axis fallbacks
      if(/p[_-]?roll/.test(param) || (/roll/.test(axis) && /\bp\b/.test(param))) deltas.p_roll += d;
      if(/i[_-]?roll/.test(param) || (/roll/.test(axis) && /\bi\b/.test(param))) deltas.i_roll += d;
      if(/d[_-]?roll/.test(param) || (/roll/.test(axis) && /\bd\b/.test(param))) deltas.d_roll += d;

      if(/p[_-]?pitch/.test(param) || (/pitch/.test(axis) && /\bp\b/.test(param))) deltas.p_pitch += d;
      if(/i[_-]?pitch/.test(param) || (/pitch/.test(axis) && /\bi\b/.test(param))) deltas.i_pitch += d;
      if(/d[_-]?pitch/.test(param) || (/pitch/.test(axis) && /\bd\b/.test(param))) deltas.d_pitch += d;

      if(/p[_-]?yaw/.test(param) || (/yaw/.test(axis) && /\bp\b/.test(param))) deltas.p_yaw += d;
      if(/i[_-]?yaw/.test(param) || (/yaw/.test(axis) && /\bi\b/.test(param))) deltas.i_yaw += d;
      if(/d[_-]?yaw/.test(param) || (/yaw/.test(axis) && /\bd\b/.test(param))) deltas.d_yaw += d;

      // axis fallback when backend sends generic "both"
      if(axis === 'both') {
        if(/\bp\b/.test(param)) { deltas.p_roll += d; deltas.p_pitch += d; }
        if(/\bi\b/.test(param)) { deltas.i_roll += d; deltas.i_pitch += d; }
        if(/\bd\b/.test(param)) { deltas.d_roll += d; deltas.d_pitch += d; }
      }
    });
  }

  var tbody = document.getElementById('pidDeltaBody');
  tbody.innerHTML = '';

  var rows = [
    {label:'ROLL',  p_cur:pid.p_roll,  p_del:deltas.p_roll,  i_cur:pid.i_roll,  i_del:deltas.i_roll,  d_cur:pid.d_roll,  d_del:deltas.d_roll},
    {label:'PITCH', p_cur:pid.p_pitch, p_del:deltas.p_pitch, i_cur:pid.i_pitch, i_del:deltas.i_pitch, d_cur:pid.d_pitch, d_del:deltas.d_pitch},
    {label:'YAW',   p_cur:pid.p_yaw,   p_del:deltas.p_yaw,   i_cur:pid.i_yaw,   i_del:deltas.i_yaw,   d_cur:pid.d_yaw,   d_del:deltas.d_yaw},
  ];

  rows.forEach(function(r){
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="pdt-axis">'+r.label+'</td>'+
      makeDeltaCell(r.p_cur, r.p_del)+
      makeDeltaCell(r.i_cur, r.i_del)+
      makeDeltaCell(r.d_cur, r.d_del);
    tbody.appendChild(tr);
  });
}

function makeDeltaCell(cur, delta) {
  var newVal = Math.max(0, cur + delta);
  var cls = delta>0 ? 'up' : (delta<0 ? 'down' : 'same');
  var dStr = delta>0 ? '+'+delta : (delta<0 ? ''+delta : '—');
  return '<td>'+
    '<span class="pdt-cur">'+cur+'</span>'+
    ' <span class="pdt-arrow">→</span> '+
    '<span class="pdt-new '+cls+'">'+newVal+'</span>'+
    ' <span class="pdt-delta '+cls+'">'+dStr+'</span>'+
    '</td>';
}

// ── CLI render ──
function renderCLI(template) {
  var pid = getPID();
  var cliDiv = document.getElementById('res-cli');
  if(!template) { cliDiv.textContent = '# ไม่มี CLI template'; return; }

  function applyOffset(value, op, minClamp) {
    var v = Number(value) || 0;
    if(!op) return v;
    var m = String(op).match(/([+-])\s*(\d+(?:\.\d+)?)/);
    if(!m) return v;
    var n = parseFloat(m[2]);
    if(m[1] === '-') v -= n; else v += n;
    if(typeof minClamp === 'number') v = Math.max(minClamp, v);
    return v;
  }
  function resolvePlaceholder(key, op) {
    var map = {
      p_roll: pid.p_roll, p_pitch: pid.p_pitch, p_yaw: pid.p_yaw,
      i_roll: pid.i_roll, i_pitch: pid.i_pitch, i_yaw: pid.i_yaw,
      d_roll: pid.d_roll, d_pitch: pid.d_pitch, d_yaw: pid.d_yaw,
      gyro_lpf1: pid.gyro_lpf1, dterm_lpf1: pid.dterm_lpf1,
      ag: pid.ag, ff: pid.ff, ff_yaw: 70
    };
    var base = map[key];
    if(base === undefined) return '{' + key + (op || '') + '}';
    var clampMin = /gyro_lpf1/.test(key) ? 50 : /dterm_lpf1/.test(key) ? 40 : 0;
    return applyOffset(base, op, clampMin);
  }

  var lines = template.map(function(line) {
    return String(line).replace(/\{([a-z_]+)(\s*[+-]\s*\d+(?:\.\d+)?)?\}/gi, function(_, key, op){
      return resolvePlaceholder(String(key).toLowerCase(), op || '');
    });
  });

  // Syntax highlight
  cliDiv.innerHTML = lines.map(function(line) {
    if(line.trimStart().startsWith('#')) {
      return '<span class="cli-comment">'+escHtml(line)+'</span>';
    }
    var m = line.match(/^(set\s+)(\S+)(\s*=\s*)(.+)$/);
    if(m) {
      return '<span class="cli-key">'+escHtml(m[1]+m[2])+'</span>'+escHtml(m[3])+'<span class="cli-val">'+escHtml(m[4])+'</span>';
    }
    return escHtml(line);
  }).join('\n');

  window._currentCLIText = lines.join('\n');
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Radar chart ──
function renderRadar(adv) {
  var ctx = document.getElementById('impactRadar').getContext('2d');
  var adjs = adv.adjustments || [];

  // Score each PID term impact
  var impact = {P:0, I:0, D:0, Filter:0, System:0, Yaw:0};
  adjs.forEach(function(adj) {
    var d = Math.abs(adj.delta || 0);
    var ax = adj.axis || 'both';
    if(ax === 'both')   { impact.P += d*0.5; impact.D += d*0.5; }
    if(ax === 'roll' || ax === 'pitch') { impact.P += d*0.3; impact.D += d*0.7; }
    if(ax === 'yaw')    { impact.Yaw += d; }
    if(ax === 'filter') { impact.Filter += d*1.5; }
    if(ax === 'system') { impact.System += 20; }
  });

  // Normalize 0-100
  var maxV = Math.max(1, Math.max.apply(null, Object.values(impact)));
  var data = Object.values(impact).map(function(v){ return Math.min(100, Math.round(v/maxV*100)); });

  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['P-term','I-term','D-term','Filter','System','Yaw'],
      datasets: [{
        data: data,
        backgroundColor: 'rgba(16,196,122,0.15)',
        borderColor: 'rgba(16,196,122,0.7)',
        pointBackgroundColor: 'rgba(16,196,122,1)',
        pointRadius: 4,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min:0, max:100,
          ticks: { display:false },
          grid: { color:'rgba(255,255,255,0.06)' },
          angleLines: { color:'rgba(255,255,255,0.06)' },
          pointLabels: { color:'#5a7a8a', font: { size:10, family:"'Orbitron',monospace" } }
        }
      }
    }
  });

  // Legend
  var leg = document.getElementById('radarLegend');
  leg.innerHTML = '';
  var colors = ['var(--green)','var(--blue)','var(--amber)','var(--cyan)','var(--purple)','var(--orange)'];
  ['P-term','I-term','D-term','Filter','System','Yaw'].forEach(function(label, i) {
    var row = document.createElement('div');
    row.className = 'radar-leg-item';
    row.innerHTML =
      '<div class="radar-leg-dot" style="background:'+colors[i]+'"></div>'+
      '<div class="radar-leg-label">'+label+'</div>'+
      '<div class="radar-leg-val">'+data[i]+'%</div>';
    leg.appendChild(row);
  });
}

// ── Copy functions ──
function copyCLI() {
  var text = window._currentCLIText || document.getElementById('res-cli').textContent;
  navigator.clipboard && navigator.clipboard.writeText(text).then(function(){
    showToast('✅ Copy CLI แล้ว — paste ใน Betaflight CLI');
  });
}
function copyDelta() {
  var pid = getPID();
  var text = document.getElementById('res-cli').textContent
    .split('\n').filter(function(l){ return l.trim().startsWith('set '); }).join('\n');
  navigator.clipboard && navigator.clipboard.writeText(text).then(function(){
    showToast('✅ Copy delta commands แล้ว');
  });
}

function showToast(msg) {
  var t = document.getElementById('v5Toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2800);
}

function onPidChange() {
  if(currentSymptom) renderResult(currentSymptom);
}
