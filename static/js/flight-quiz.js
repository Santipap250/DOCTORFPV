// static/js/flight-quiz.js — Batch E: extracted from templates/flight_quiz.html inline <script>. No logic change.

'use strict';

/* ── QUESTIONS ─────────────────────────────── */
const QUESTIONS = [
  {
    id: 'experience',
    label: 'คุณบินโดรน FPV มานานแค่ไหน?',
    sub: 'ประสบการณ์ช่วยให้เราแนะนำ rates ที่เหมาะกับการควบคุมของคุณ',
    choices: [
      { icon:'🐣', label:'มือใหม่', desc:'ไม่ถึง 6 เดือน หรือยังฝึกอยู่',
        s: { beginner:3, cine:1 } },
      { icon:'✈️', label:'พอใช้ได้', desc:'6 เดือน – 2 ปี คุมได้แน่นแล้ว',
        s: { fl:3, beginner:1, freestyle:1 } },
      { icon:'🎯', label:'มีประสบการณ์', desc:'2–4 ปี ทำ trick ได้หลายอย่าง',
        s: { freestyle:3, race:1, fl:1 } },
      { icon:'🏆', label:'เทพ', desc:'4 ปีขึ้นไป หรือแข่งขันระดับชมรม',
        s: { race:3, freestyle:2 } },
    ]
  },
  {
    id: 'drone',
    label: 'โดรนที่คุณบินเป็นหลักคืออะไร?',
    sub: 'ขนาดและสไตล์โดรนมีผลต่อ rates ที่เหมาะสม',
    choices: [
      { icon:'🐝', label:'Micro / Whoop', desc:'1–3 นิ้ว โดรนขนาดเล็ก ใช้ใบพัด duct',
        s: { beginner:3, cine:1 } },
      { icon:'🎬', label:'Cinewhoop / Cinema', desc:'3–4 นิ้ว ถ่ายวีดีโอ ใบพัดมีกาบ',
        s: { cine:4, beginner:1 } },
      { icon:'✊', label:'5 นิ้ว Freestyle / Race', desc:'มาตรฐาน 5" เป็นที่นิยมสูงสุด',
        s: { freestyle:3, race:2, fl:1 } },
      { icon:'🗺️', label:'Long Range 7–10 นิ้ว', desc:'บินระยะไกล ใบพัดขนาดใหญ่',
        s: { longrange:5 } },
    ]
  },
  {
    id: 'location',
    label: 'คุณบินที่ไหนเป็นส่วนใหญ่?',
    sub: 'สภาพแวดล้อมกำหนดว่าคุณต้องการ rates แบบไหน',
    choices: [
      { icon:'🏠', label:'ในร่ม / พื้นที่แคบ', desc:'ห้อง โกดัง ใต้ตึก สนามเล็ก',
        s: { beginner:3, cine:2 } },
      { icon:'🌿', label:'สวน / สนามกลาง', desc:'สวนสาธารณะ สนามโรงเรียน ลานบ้าน',
        s: { fl:3, cine:1, beginner:1 } },
      { icon:'🏟️', label:'สนามเปิด / โล่งกว้าง', desc:'ทุ่งนา สนามแข่ง ที่ว่างขนาดใหญ่',
        s: { freestyle:3, race:3 } },
      { icon:'🏔️', label:'ป่า / เขา / ที่ไกล', desc:'นอกเมือง เส้นทาง trail ระยะไกล',
        s: { longrange:5, freestyle:1 } },
    ]
  },
  {
    id: 'goal',
    label: 'สิ่งที่คุณต้องการจากการบินมากที่สุด?',
    sub: 'เป้าหมายหลักของคุณ — เลือกที่ตรงใจมากที่สุด',
    choices: [
      { icon:'🎥', label:'ถ่ายวีดีโอสวยงาม', desc:'ภาพนิ่ง smooth ไม่มี jello ไม่สั่น',
        s: { cine:4, longrange:1 } },
      { icon:'😊', label:'สนุก ทำ trick เบาๆ', desc:'วน loop เบสิก split-S ไม่ต้องหักโหม',
        s: { fl:4, beginner:2 } },
      { icon:'⚡', label:'Freestyle จัดเต็ม', desc:'flip / roll / dive / gap ทุกแบบ',
        s: { freestyle:4, race:1 } },
      { icon:'🏁', label:'ความเร็วสูงสุด', desc:'แข่ง gate race หรือ proximity chase',
        s: { race:5 } },
    ]
  },
  {
    id: 'feel',
    label: 'คุณชอบโดรนที่ตอบสนอง stick แบบไหน?',
    sub: 'ความรู้สึกของ stick เป็นส่วนสำคัญในการเลือก rates',
    choices: [
      { icon:'🕊️', label:'นุ่มนวล คุมง่าย', desc:'dead zone กว้าง ไม่กระตุก อยู่มือ',
        s: { beginner:3, cine:2 } },
      { icon:'🎯', label:'สมดุล ตอบสนองดี', desc:'ว่องไวพอ snap ชัดแต่ยังคุมได้',
        s: { fl:3, freestyle:2 } },
      { icon:'⚡', label:'ว่องไว snap ชัดเจน', desc:'หมุนเร็ว ตอบสนองทันที agile',
        s: { freestyle:3, race:2 } },
      { icon:'🔥', label:'สุดขีด ต้องมือเร็ว', desc:'race-spec ทุก input instant',
        s: { race:5 } },
    ]
  },
];

/* ── PROFILES ──────────────────────────────── */
const PROFILES = {
  beginner: {
    name:'BEGINNER',    nameth:'มือใหม่',    icon:'🐣',  color:'#00ff88',
    desc:'ตั้งค่าสำหรับผู้เริ่มต้น — นิ่ง คุมง่าย ฝึกได้สบาย ลดโอกาสอุบัติเหตุ',
    rates:{ roll:{rc:0.80,sr:0.40,expo:0.15}, pitch:{rc:0.80,sr:0.40,expo:0.15}, yaw:{rc:0.60,sr:0.30,expo:0.10} },
    maxdeg:380, tag:'SAFE', tagColor:'#00ff88',
    filter:'Conservative — Gyro LPF2 ต่ำ, D-term filter แน่น ลด motor noise',
    fcli:['set gyro_lpf2_hz = 120','set dterm_lpf1_hz = 100','set anti_gravity_gain = 3','set throttle_limit_percent = 85'],
    notes:[
      {t:'เพิ่ม Expo ทีละ 0.05 ถ้าต้องการ dead zone กลาง stick มากขึ้น', w:false},
      {t:'ฝึก hover ให้นิ่งก่อน แล้วค่อยเพิ่ม Super Rate ทีละ 0.05', w:false},
      {t:'เมื่อคุมได้มั่นใจแล้ว ลองเปลี่ยนเป็น Freestyle Lite', w:false},
    ],
    persPos:8,
  },
  cine: {
    name:'CINEMATIC',   nameth:'ถ่ายวีดีโอ', icon:'🎬', color:'#00aaff',
    desc:'ออกแบบสำหรับการถ่ายวีดีโอ — ภาพนิ่ง smooth stick นุ่มมาก',
    rates:{ roll:{rc:0.70,sr:0.20,expo:0.35}, pitch:{rc:0.70,sr:0.20,expo:0.35}, yaw:{rc:0.55,sr:0.15,expo:0.20} },
    maxdeg:280, tag:'SMOOTH', tagColor:'#00aaff',
    filter:'Aggressive filter — Gyro LPF2 ต่ำมาก ลด vibration สุดๆ ภาพนิ่ง',
    fcli:['set gyro_lpf2_hz = 100','set dterm_lpf1_hz = 90','set anti_gravity_gain = 2','set iterm_relax = OFF','set throttle_limit_percent = 80'],
    notes:[
      {t:'Expo 0.35 ให้ dead zone กลาง stick กว้าง — key สำหรับ cinematic shot', w:false},
      {t:'Super Rate 0.20 ทำให้ขอบ stick หมุนได้พอ แต่ไม่หักโหม', w:false},
      {t:'เพิ่ม throttle_limit ถ้า footage ยังสั่นเล็กน้อย', w:false},
    ],
    persPos:5,
  },
  fl: {
    name:'FREESTYLE LITE', nameth:'Freestyle เบา', icon:'😊', color:'#70ddff',
    desc:'สำหรับนักบินระดับกลาง — สนุก ทำ trick ได้ ยังคุมได้สบาย',
    rates:{ roll:{rc:1.10,sr:0.60,expo:0.20}, pitch:{rc:1.10,sr:0.60,expo:0.20}, yaw:{rc:0.75,sr:0.40,expo:0.10} },
    maxdeg:580, tag:'BALANCED', tagColor:'#70ddff',
    filter:'Balanced filter — เสียง motor เงียบ ตอบสนองดี ใช้งานทั่วไป',
    fcli:['set gyro_lpf2_hz = 150','set dterm_lpf1_hz = 110','set anti_gravity_gain = 5','set iterm_relax = RP','set throttle_limit_percent = 100'],
    notes:[
      {t:'จุดเริ่มต้นที่ดีก่อนขึ้นไป Freestyle เต็มที่ — เหมาะสำหรับ intermediate', w:false},
      {t:'เพิ่ม Super Rate ทีละ 0.05 จนรู้สึก comfortable กับความเร็ว rotation', w:false},
      {t:'Yaw ต่ำกว่า Roll/Pitch — เจตนา ทำให้บินตรงง่ายกว่า', w:false},
    ],
    persPos:40,
  },
  freestyle: {
    name:'FREESTYLE',   nameth:'Freestyle',  icon:'⚡', color:'#00ff88',
    desc:'Rates มาตรฐาน Freestyle — ตอบสนองดี flip/roll ลื่น snap ชัด',
    rates:{ roll:{rc:1.20,sr:0.70,expo:0.15}, pitch:{rc:1.20,sr:0.70,expo:0.15}, yaw:{rc:0.80,sr:0.45,expo:0.10} },
    maxdeg:720, tag:'FREESTYLE', tagColor:'#00ff88',
    filter:'Freestyle balance — filter พอเพียง latency ต่ำ ตอบสนองดี',
    fcli:['set gyro_lpf2_hz = 175','set dterm_lpf1_hz = 120','set anti_gravity_gain = 5','set iterm_relax = RPY','set feedforward_transition = 50'],
    notes:[
      {t:'Yaw ต่ำกว่า Roll/Pitch เจตนา — yaw หนักเกินทำให้โดรนหมุนพาไปยาก', w:false},
      {t:'ถ้าต้องการ snap มากขึ้น เพิ่ม RC Rate ทีละ 0.1 และทดสอบ', w:false},
      {t:'Expo 0.15 ให้ center stick ตอบสนองโดยตรง — เหมาะ freestyle สไตล์',w:false},
    ],
    persPos:62,
  },
  race: {
    name:'RACE',        nameth:'แข่งขัน',   icon:'🏁', color:'#ff4455',
    desc:'Race-spec ความเร็วสูง — ต้องมือเร็วและมีประสบการณ์มาก',
    rates:{ roll:{rc:1.80,sr:0.80,expo:0.00}, pitch:{rc:1.80,sr:0.80,expo:0.00}, yaw:{rc:1.10,sr:0.50,expo:0.00} },
    maxdeg:1200, tag:'EXPERT', tagColor:'#ff4455',
    filter:'Light filter — response เร็วสุด latency ต่ำมาก',
    fcli:['set gyro_lpf2_hz = 250','set dterm_lpf1_hz = 150','set anti_gravity_gain = 3','set iterm_relax = RPY','set feedforward_transition = 0'],
    notes:[
      {t:'⚠️ ไม่แนะนำสำหรับมือใหม่ — โดรนจะตอบสนองรวดเร็วมาก อาจบินหลุดทันที', w:true},
      {t:'Expo = 0 ทำให้ center stick ตรงแม่น race-style ไม่มี dead zone', w:false},
      {t:'ถ้าบินผิดพลาดบ่อย ให้ลองปรับลดเป็น Freestyle Lite ก่อน', w:false},
    ],
    persPos:92,
  },
  longrange: {
    name:'LONG RANGE',  nameth:'ระยะไกล',  icon:'🗺️', color:'#ffb700',
    desc:'สำหรับบินระยะไกล — นิ่ง ประหยัดไฟ ต้านลมได้ดี',
    rates:{ roll:{rc:1.00,sr:0.45,expo:0.20}, pitch:{rc:1.00,sr:0.45,expo:0.20}, yaw:{rc:0.65,sr:0.30,expo:0.15} },
    maxdeg:520, tag:'ENDURANCE', tagColor:'#ffb700',
    filter:'Stable filter — noise ต่ำ motor ไม่ร้อน flight time สูง',
    fcli:['set gyro_lpf2_hz = 130','set dterm_lpf1_hz = 100','set anti_gravity_gain = 4','set iterm_relax = RP','set iterm_relax_type = SETPOINT'],
    notes:[
      {t:'I-term สูงขึ้นช่วยต้านลมระยะไกล — อย่าลดต่ำกว่า default', w:false},
      {t:'RC Rate 1.0 ให้ response กลางพอดีสำหรับการบินยาว 20–40 นาที', w:false},
      {t:'ถ้าต้องการ smooth กว่านี้ลดลง Expo เป็น 0.30 ได้', w:false},
    ],
    persPos:28,
  },
};

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let state = { step:0, answers:[], scores:{} };

function resetState() {
  state = {
    step: 0,
    answers: new Array(QUESTIONS.length).fill(null),
    scores: { beginner:0, cine:0, fl:0, freestyle:0, race:0, longrange:0 }
  };
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function show(id)  { document.getElementById(id).classList.add('active'); }
function hide(id)  { document.getElementById(id).classList.remove('active'); }
function toggle(id, on) { on ? show(id) : hide(id); }
function el(id)    { return document.getElementById(id); }

function showToast(msg) {
  const t = el('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ══════════════════════════════════════════
   QUIZ FLOW
══════════════════════════════════════════ */
function startQuiz() {
  resetState();
  el('heroSection').style.display = 'none';
  show('quizSection');
  buildProgress();
  renderQuestion(0);
}

/* ── Progress bar ── */
function buildProgress() {
  const icons = ['❓','🚁','📍','🎯','🕹️'];
  const labels = ['ประสบการณ์','โดรน','สถานที่','เป้าหมาย','ความรู้สึก'];
  let stepsHtml = '';
  QUESTIONS.forEach((_, i) => {
    if (i > 0) {
      stepsHtml += `<div class="progress-connector" id="conn${i}">
        <div class="progress-connector-fill"></div></div>`;
    }
    stepsHtml += `<div class="progress-step ${i===0?'current':''}" id="step${i}">${icons[i]}</div>`;
  });
  el('progressSteps').innerHTML = stepsHtml;

  let labelsHtml = '';
  QUESTIONS.forEach((_, i) => {
    labelsHtml += `<div class="progress-label ${i===0?'current':''}" id="label${i}">${labels[i]}</div>`;
  });
  el('progressLabels').innerHTML = labelsHtml;
}

function updateProgress(step) {
  QUESTIONS.forEach((_, i) => {
    const s = el(`step${i}`);
    const l = el(`label${i}`);
    if (!s) return;
    s.classList.toggle('done',    i < step);
    s.classList.toggle('current', i === step);
    l.classList.toggle('done',    i < step);
    l.classList.toggle('current', i === step);
    if (i > 0) {
      el(`conn${i}`)?.classList.toggle('done', i <= step);
    }
  });
}

/* ── Render question ── */
function renderQuestion(idx) {
  const q = QUESTIONS[idx];
  updateProgress(idx);

  const html = `
  <div class="q-card" id="qCard">
    <div class="q-head">
      <span class="q-num">คำถาม ${idx+1} / ${QUESTIONS.length}</span>
      <div>
        <div class="q-title">${q.label}</div>
        <div class="q-sub">${q.sub}</div>
      </div>
    </div>
    <div class="choices-grid">
      ${q.choices.map((c, ci) => `
      <div class="choice-card ${state.answers[idx]===ci?'selected':''}"
           id="choice${ci}" onclick="selectChoice(${ci})">
        <div class="choice-icon-wrap">${c.icon}</div>
        <div class="choice-body">
          <span class="choice-label">${c.label}</span>
          <span class="choice-desc">${c.desc}</span>
        </div>
        <div class="choice-check"><div class="choice-check-inner"></div></div>
      </div>`).join('')}
    </div>
    <div class="q-footer">
      <button class="q-back" ${idx===0?'disabled':''} onclick="goBack()">← ย้อนกลับ</button>
      <button class="q-next ${state.answers[idx]!==null?'ready':''}" id="nextBtn"
        onclick="${idx<QUESTIONS.length-1 ? 'goNext()' : 'submitQuiz()'}">
        ${idx<QUESTIONS.length-1 ? 'ถัดไป →' : '✓ ดูผลลัพธ์'}
      </button>
    </div>
  </div>`;

  el('qCardWrap').innerHTML = html;
}

function selectChoice(ci) {
  state.answers[state.step] = ci;
  // Update visual
  document.querySelectorAll('.choice-card').forEach((c, i) => {
    c.classList.toggle('selected', i === ci);
  });
  // Enable next
  const nb = el('nextBtn');
  if (nb) nb.classList.add('ready');
  // Auto-advance after short delay (except last question)
  if (state.step < QUESTIONS.length - 1) {
    setTimeout(() => goNext(), 380);
  }
}

function goNext() {
  if (state.answers[state.step] === null) return;
  const card = el('qCard');
  if (card) {
    card.classList.add('leaving');
    setTimeout(() => {
      state.step++;
      renderQuestion(state.step);
    }, 260);
  }
}

function goBack() {
  if (state.step === 0) return;
  const card = el('qCard');
  if (card) {
    card.style.animation = 'qSlideIn .3s cubic-bezier(.4,0,.2,1) reverse both';
    setTimeout(() => {
      state.step--;
      renderQuestion(state.step);
    }, 260);
  }
}

function submitQuiz() {
  if (state.answers[state.step] === null) return;
  hide('quizSection');
  show('computingSection');
  runComputing();
}

/* ── Computing animation ── */
function runComputing() {
  const msgs = [
    '// วิเคราะห์สไตล์การบิน...',
    '// คำนวณ RC Rate ที่เหมาะสม...',
    '// ปรับ Super Rate ตามประสบการณ์...',
    '// ตั้งค่า Filter สำหรับโดรนของคุณ...',
    '// สร้าง CLI commands...',
    '// เสร็จสิ้น ✓',
  ];

  const bar = el('compBar');
  const steps = el('compSteps');
  steps.innerHTML = msgs.map(m =>
    `<div class="comp-step"><span class="comp-step-dot"></span>${m}</div>`
  ).join('');
  const stepEls = steps.querySelectorAll('.comp-step');

  let pct = 0;
  let msgIdx = 0;
  const tick = setInterval(() => {
    pct += 3 + Math.random() * 5;
    if (pct > 100) pct = 100;
    bar.style.width = pct + '%';

    const targetMsg = Math.floor((pct / 100) * msgs.length);
    while (msgIdx < targetMsg && msgIdx < stepEls.length) {
      stepEls[msgIdx].classList.add('show');
      msgIdx++;
    }

    if (pct >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        const winner = calcResult();
        hide('computingSection');
        renderResult(winner);
        show('resultSection');
      }, 600);
    }
  }, 80);
}

/* ── Scoring ── */
function calcResult() {
  const s = { beginner:0, cine:0, fl:0, freestyle:0, race:0, longrange:0 };
  QUESTIONS.forEach((q, qi) => {
    const chosen = state.answers[qi];
    if (chosen === null) return;
    const scores = q.choices[chosen].s || {};
    Object.entries(scores).forEach(([k, v]) => { if (k in s) s[k] += v; });
  });
  state.scores = s;
  return Object.entries(s).sort((a,b) => b[1]-a[1])[0][0];
}

/* ══════════════════════════════════════════
   RENDER RESULT
══════════════════════════════════════════ */
function generateCLI(profile) {
  const r = profile.rates;
  const lines = [
    `# OBIXConfig Doctor — ${profile.name} Rates`,
    `# สร้างโดย Flight Style Quiz`,
    ``,
    `# ─── Rates Type ──────────────────────────`,
    `set rates_type = ACTUAL`,
    ``,
    `# ─── Roll ────────────────────────────────`,
    `set roll_rc_rate = ${Math.round(r.roll.rc * 100)}`,
    `set roll_srate   = ${Math.round(r.roll.sr * 100)}`,
    `set roll_expo    = ${Math.round(r.roll.expo * 100)}`,
    ``,
    `# ─── Pitch ───────────────────────────────`,
    `set pitch_rc_rate = ${Math.round(r.pitch.rc * 100)}`,
    `set pitch_srate   = ${Math.round(r.pitch.sr * 100)}`,
    `set pitch_expo    = ${Math.round(r.pitch.expo * 100)}`,
    ``,
    `# ─── Yaw ─────────────────────────────────`,
    `set yaw_rc_rate = ${Math.round(r.yaw.rc * 100)}`,
    `set yaw_srate   = ${Math.round(r.yaw.sr * 100)}`,
    `set yaw_expo    = ${Math.round(r.yaw.expo * 100)}`,
    ``,
    `# ─── Filter / Tuning ─────────────────────`,
    ...profile.fcli,
    ``,
    `save`,
  ];
  return lines.join('\n');
}

function renderResult(key) {
  const p = PROFILES[key];
  const cli = generateCLI(p);

  // Score breakdown for secondary display
  const scores = Object.entries(state.scores)
    .sort((a,b)=>b[1]-a[1])
    .map(([k,v]) => `${PROFILES[k]?.name||k}: ${v}`)
    .join(' · ');

  // Rates rows
  const axes = [
    ['ROLL',  p.rates.roll,  'val-big'],
    ['PITCH', p.rates.pitch, 'val-mid'],
    ['YAW',   p.rates.yaw,   'val-lo'],
  ];
  const ratesRows = axes.map(([ax, rv, cls]) => `
    <tr>
      <td>${ax}</td>
      <td><span class="${cls}">${rv.rc.toFixed(2)}</span></td>
      <td><span class="${cls}">${rv.sr.toFixed(2)}</span></td>
      <td><span class="${cls}">${rv.expo.toFixed(2)}</span></td>
    </tr>`).join('');

  // Notes
  const notesHtml = p.notes.map(n => `
    <div class="note-item ${n.w?'warn':''}">
      <span class="note-dot">${n.w?'⚠️':'▸'}</span>
      <span>${n.t}</span>
    </div>`).join('');

  el('resultSection').innerHTML = `
    <div class="result-header">
      <div class="result-header-top">
        <div class="result-badge" style="border-color:${p.color}22;background:${p.color}12;">
          ${p.icon}
        </div>
        <div class="result-badge-text">
          <div class="result-profile-label">ผลลัพธ์ของคุณ — Flight Profile</div>
          <div class="result-profile-name" style="color:${p.color};">${p.name}</div>
          <div class="result-profile-nameth">${p.nameth}</div>
          <span class="result-tag" style="color:${p.tagColor};border-color:${p.tagColor}44;background:${p.tagColor}12;">${p.tag}</span>
        </div>
      </div>
      <p class="result-desc">${p.desc}</p>

      <!-- Personality meter -->
      <div class="pers-wrap">
        <div class="pers-label">
          <span>FLYING STYLE SPECTRUM</span>
          <span style="color:${p.color};">${p.name}</span>
        </div>
        <div class="pers-bar">
          <div class="pers-needle" id="persNeedle" style="left:${p.persPos}%"></div>
        </div>
        <div class="pers-ticks">
          <span class="pers-tick">CINE</span>
          <span class="pers-tick">SMOOTH</span>
          <span class="pers-tick">BALANCED</span>
          <span class="pers-tick">FREESTYLE</span>
          <span class="pers-tick">RACE</span>
        </div>
      </div>
    </div>

    <div class="result-body">

      <!-- Max deg/s -->
      <div class="maxdeg-box">
        <div>
          <div class="maxdeg-val" style="color:${p.color};">${p.maxdeg}</div>
          <div class="maxdeg-unit">deg/s MAX</div>
        </div>
        <div class="maxdeg-desc">
          อัตราหมุนสูงสุดที่ full stick — เป็นตัวบอกว่าโดรนคุณจะ<strong> ${p.maxdeg < 400 ? 'นิ่งและคุมง่าย' : p.maxdeg < 600 ? 'สมดุลระหว่างความสนุกและความปลอดภัย' : p.maxdeg < 800 ? 'ตอบสนองดีเหมาะ freestyle' : 'ว่องไวมาก ต้องการประสบการณ์'}</strong>
        </div>
      </div>

      <!-- Rates table -->
      <div class="section-label">RATES — ACTUAL MODE</div>
      <table class="rates-table">
        <thead>
          <tr>
            <th>Axis</th>
            <th>RC Rate</th>
            <th>Super Rate</th>
            <th>Expo</th>
          </tr>
        </thead>
        <tbody>${ratesRows}</tbody>
      </table>

      <!-- Filter -->
      <div class="section-label">FILTER RECOMMENDATION</div>
      <div class="filter-box">
        <div class="filter-box-title">📡 ${p.filter}</div>
      </div>

      <!-- Notes -->
      <div class="section-label">TUNING NOTES</div>
      <div class="notes-list">${notesHtml}</div>

      <!-- CLI -->
      <div class="cli-section">
        <div class="section-label">
          BETAFLIGHT CLI
          <button class="cli-copy-btn" onclick="copyCLI()">📋 Copy CLI</button>
        </div>
        <pre class="cli-box" id="cliBock">${cli.replace(/</g,'&lt;')}</pre>
      </div>

      <!-- Score breakdown (subtle) -->
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#3d5470;margin-top:4px;line-height:1.8;">
        // scores: ${scores}
      </div>
    </div>

    <div class="result-actions">
      <a href="/rates-visualizer" class="btn-primary-out">📈 ลอง Rates ใน Visualizer</a>
      <a href="/app" class="btn-secondary-out">🚁 วิเคราะห์โดรน</a>
      <button class="btn-ghost-out" onclick="retakeQuiz()">🔄 ทำ Quiz ใหม่</button>
    </div>
  `;

  // Animate needle
  setTimeout(() => {
    const needle = el('persNeedle');
    if (needle) {
      needle.style.transition = 'none';
      needle.style.left = '0%';
      setTimeout(() => {
        needle.style.transition = 'left .9s cubic-bezier(.4,0,.2,1)';
        needle.style.left = p.persPos + '%';
      }, 80);
    }
  }, 300);
}

/* ── Copy CLI ── */
function copyCLI() {
  const pre = el('cliBock');
  if (!pre) return;
  navigator.clipboard.writeText(pre.innerText)
    .then(() => showToast('✓ คัดลอก CLI แล้ว'));
}

/* ── Retake ── */
function retakeQuiz() {
  el('resultSection').innerHTML = '';
  hide('resultSection');
  el('heroSection').style.display = '';
  // scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
