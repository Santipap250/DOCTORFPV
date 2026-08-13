// static/js/quick-tune.js — Batch D: extracted from templates/quick_tune.html inline <script>. No logic change.


// Conflict rules: these symptom pairs have opposing PID directions
// [a, b, param] means symptom a and b conflict on param
const CONFLICTS = [
  ['oscillation_after_flip', 'propwash',    'd_main'],   // osc→D down, wash→D up
  ['oscillation_after_flip', 'slow_response','p_main'],  // osc→P down, slow→P up
  ['bounce_back',            'propwash',    'd_main'],   // bounce→D up, wash→D up (ok actually—but P conflicts)
  ['bounce_back',            'slow_response','p_main'],  // bounce→P down, slow→P up
  ['motor_hot',              'propwash',    'd_main'],   // hot→D down, wash→D up
  ['motor_hot',              'slow_response','filter'],
  ['jello_footage',          'slow_response','filter'],
];

// PID adjustment definitions (canonical, weighted)
const ADJ = {
  oscillation_after_flip:{
    p:{roll:-2,pitch:-2,yaw:0}, d:{roll:-4,pitch:-4,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:-15,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['set d_roll = {dr}','set d_pitch = {dp}','set dterm_lpf1_hz = {dlpf}'],
    confidence:82, priority:'HIGH',
    tips:['ลด D ทีละ 3 แล้วบินซ้ำ ถ้า propwash เพิ่มขึ้น = D ยังต้องการ ให้ปรับ filter แทน','ใช้ Blackbox ดู gyro noise หลัง maneuver','ตรวจสอบ motor balance และ prop crack ก่อน']
  },
  propwash:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:4,pitch:4,yaw:0}, i:{roll:3,pitch:3,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:4,rpm_filter:true},
    cli:['set d_roll = {dr}','set d_pitch = {dp}','set anti_gravity_gain = {ag}','set rpm_notch_harmonics = 3'],
    confidence:78, priority:'HIGH',
    tips:['RPM filter ช่วยได้มากที่สุด ต้องใช้ BLHeli_32 + BiDir DSHOT','ถ้ายัง propwash อยู่ ลอง เพิ่ม iterm_limit สูงขึ้น','Propwash มักดีขึ้นเมื่อ แบตไม่ sag มาก — ลอง battery ใหม่']
  },
  bounce_back:{
    p:{roll:-3,pitch:-3,yaw:0}, d:{roll:3,pitch:3,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null,feedforward:-12},
    cli:['set p_roll = {pr}','set p_pitch = {pp}','set d_roll = {dr}','set d_pitch = {dp}','set feedforward_roll = {ff}','set feedforward_pitch = {ff}'],
    confidence:80, priority:'MED',
    tips:['Bounce-back มักเกิดจาก P สูงเกิน หรือ feedforward สูง','ลด feedforward ก่อน แล้วค่อยปรับ P','ถ้าบิน freestyle ลอง setpoint_relax_ratio = 30']
  },
  yaw_spin:{
    p:{roll:0,pitch:0,yaw:-6}, d:{roll:0,pitch:0,yaw:0}, i:{roll:0,pitch:0,yaw:5},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['set p_yaw = {py}','set i_yaw = {iy}'],
    confidence:75, priority:'MED',
    tips:['ตรวจสอบ motor จาก Betaflight Motors tab ว่า motor ทุกตัวหมุนเร็วเท่ากัน','Yaw spin บางทีเกิดจาก prop ไม่สมดุล หรือ motor bearing เสีย','ลอง set yaw_stop_time = 0.02']
  },
  slow_response:{
    p:{roll:4,pitch:4,yaw:0}, d:{roll:0,pitch:0,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:20,anti_gravity:0,rpm_filter:null,feedforward:15},
    cli:['set p_roll = {pr}','set p_pitch = {pp}','set feedforward_roll = {ff}','set feedforward_pitch = {ff}','set gyro_lowpass_hz = {glpf}'],
    confidence:72, priority:'MED',
    tips:['เพิ่ม feedforward ก่อนเพิ่ม P — ผล response ชัดกว่า','ถ้า filter aggressive เกินไป ให้เพิ่ม gyro_lpf1 ขึ้น 20Hz','setpoint_relax_ratio ที่ต่ำจะทำให้ drone เร็วขึ้น แต่ bounce มากขึ้น']
  },
  toilet_bowl:{
    p:{roll:0,pitch:0,yaw:-2}, d:{roll:0,pitch:0,yaw:0}, i:{roll:4,pitch:4,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['set i_roll = {ir}','set i_pitch = {ip}','set p_yaw = {py}'],
    confidence:65, priority:'LOW',
    tips:['Toilet bowl อาจมาจาก compass/magnetometer enable โดยไม่ตั้งใจ — disable ใน BF','ตรวจสอบ GPS mode อาจรบกวน','ลอง iterm_limit = 400']
  },
  wind_rejection:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:0,pitch:0,yaw:0}, i:{roll:6,pitch:6,yaw:4},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:5,rpm_filter:null,iterm_relax:'RPH'},
    cli:['set i_roll = {ir}','set i_pitch = {ip}','set i_yaw = {iy}','set anti_gravity_gain = {ag}','set iterm_relax = RPH'],
    confidence:70, priority:'MED',
    tips:['iterm_relax = RPH ดีกว่า RP สำหรับ freestyle ที่มี throttle change บ่อย','ลม = ต้องการ I-term สูง แต่ถ้าสูงเกินจะ bounce ที่ stick release','anti_gravity ช่วยตอน throttle punch']
  },
  motor_hot:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:-4,pitch:-4,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:-18,gyro_lpf1:0,anti_gravity:0,rpm_filter:true},
    cli:['set d_roll = {dr}','set d_pitch = {dp}','set dterm_lpf1_hz = {dlpf}','set motor_pwm_protocol = DSHOT600'],
    confidence:76, priority:'HIGH',
    tips:['มอเตอร์ร้อนเพราะ D-term สูงทำให้ motor vibrate ตลอดเวลา','ใช้ DSHOT600 + BiDir ลด motor heat ได้ดีมาก','ตรวจ prop balance — prop ที่ไม่สมดุล = motor heat สูงมาก']
  },
  jello_footage:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:-2,pitch:-2,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:-20,anti_gravity:0,rpm_filter:true},
    cli:['set d_roll = {dr}','set d_pitch = {dp}','set gyro_lowpass_hz = {glpf}'],
    confidence:60, priority:'LOW',
    tips:['Jello ส่วนใหญ่มาจาก prop crack หรือ motor bearing เสีย — ตรวจก่อนปรับ filter','Camera gyro stabilization ที่ดีแก้ jello ได้ดีกว่าปรับ PID','Mount camera ด้วย soft foam/rubber ลด vibration ได้ดีที่สุด']
  },
  esc_desync:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:0,pitch:0,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['set motor_pwm_protocol = DSHOT300','set dshot_bidir = ON','set motor_poles = 14','set min_throttle = 1025'],
    confidence:85, priority:'CRITICAL',
    tips:['ESC Desync เป็น hardware issue — ปรับ PID ไม่ช่วย ต้องแก้ ESC settings','ลอง demag_compensation = HIGH ใน BLHeli Suite','motor_poles ต้องตรงกับ motor จริง: 12pole=12, 14pole=14']
  },
  not_arming:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:0,pitch:0,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['arm','set min_check = 1050','set max_check = 1900','set small_angle = 25'],
    confidence:88, priority:'CRITICAL',
    tips:['ใน CLI พิมพ์ "arm" เพื่อดู arming disable flags','ตรวจ throttle calibration — idle ต้องอยู่ต่ำกว่า min_check','วางโดรนราบก่อน ARM ถ้า small_angle limit เตะ']
  },
  turtle_mode_fail:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:0,pitch:0,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['set motor_pwm_protocol = DSHOT300','# กำหนด Flip Over After Crash ใน Modes tab'],
    confidence:90, priority:'HIGH',
    tips:['Turtle mode ต้องใช้ DSHOT protocol เท่านั้น — standard PWM ไม่รองรับ','ต้องกำหนด switch ใน Modes → Flip Over After Crash','ตรวจ ESC ว่า support bidirectional motor direction']
  },
  video_breakup:{
    p:{roll:0,pitch:0,yaw:0}, d:{roll:0,pitch:0,yaw:0}, i:{roll:0,pitch:0,yaw:0},
    filter:{dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,rpm_filter:null},
    cli:['set vtx_power = 200','set vtx_channel = 4','# ใส่ capacitor 470µF บน VTX power'],
    confidence:72, priority:'MED',
    tips:['ใส่ capacitor 470-1000µF บน power supply ของ VTX ลด voltage sag','Antenna ที่หัก/บิด ลดพิสัยสัญญาณ >50%','ทดสอบ VTX บนพื้น — ถ้าภาพดีแต่บินแล้วแตก = voltage sag']
  },
};

// Base PID values (typical 5" freestyle)
const BASE = {p:{roll:48,pitch:52,yaw:40}, d:{roll:38,pitch:40,yaw:0}, i:{roll:90,pitch:90,yaw:90}, filter:{dterm_lpf1:100,gyro_lpf1:200,anti_gravity:5,feedforward:25}};

let selected = new Set();

function toggle(btn){
  const id = btn.dataset.id;
  if(btn.classList.contains('conflict')) return;
  if(selected.has(id)){
    selected.delete(id);
    btn.classList.remove('active');
  } else {
    if(selected.size >= 4){ notify('เลือกได้สูงสุด 4 อาการ'); return; }
    selected.add(id);
    btn.classList.add('active');
  }
  updateConflicts();
  render();
}

function updateConflicts(){
  // Reset all conflict states
  document.querySelectorAll('.symp-btn').forEach(b=>b.classList.remove('conflict'));
  // Check each conflict rule
  for(const [a,b,param] of CONFLICTS){
    if(selected.has(a)&&!selected.has(b)) markConflict(b);
    if(selected.has(b)&&!selected.has(a)) markConflict(a);
  }
}
function markConflict(id){
  const btn=document.querySelector(`.symp-btn[data-id="${id}"]`);
  if(btn&&!selected.has(id)) btn.classList.add('conflict');
}

function resetAll(){
  selected.clear();
  document.querySelectorAll('.symp-btn').forEach(b=>{b.classList.remove('active','conflict');});
  render();
}

function render(){
  const n = selected.size;
  document.getElementById('sel-count').textContent = `${n} / 4 selected`;
  document.getElementById('mb-symp').textContent = `${n} อาการ`;
  document.getElementById('mb-symp').classList.toggle('on', n>0);

  if(n===0){
    document.getElementById('pid-grid-wrap').innerHTML = `<div class="empty-state"><div class="empty-ico">🎯</div><div class="empty-t">SELECT SYMPTOMS</div><div class="empty-s">เลือกอาการด้านซ้าย → PID delta จะปรากฏที่นี่</div></div>`;
    document.getElementById('flt-row').style.display='none';
    document.getElementById('tip-panel').style.display='none';
    document.getElementById('conflict-warn').style.display='none';
    document.getElementById('cli-out').innerHTML = `<span class="cli-comment"># เลือกอาการด้านซ้ายเพื่อ generate CLI...</span><span class="cli-cursor"></span>`;
    setConfidence(0,null,null);
    return;
  }

  // Aggregate PID deltas
  let dP={roll:0,pitch:0,yaw:0}, dD={roll:0,pitch:0,yaw:0}, dI={roll:0,pitch:0,yaw:0};
  let dFilter={dterm_lpf1:0,gyro_lpf1:0,anti_gravity:0,feedforward:0};
  let hasConflict=false, allTips=[], allCLI=[], totalConf=0, maxPrio='LOW';
  const prioOrder=['CRITICAL','HIGH','MED','LOW'];

  selected.forEach(id=>{
    const a=ADJ[id]; if(!a) return;
    dP.roll+=a.p.roll; dP.pitch+=a.p.pitch; dP.yaw+=a.p.yaw;
    dD.roll+=a.d.roll; dD.pitch+=a.d.pitch; dD.yaw+=a.d.yaw;
    dI.roll+=a.i.roll; dI.pitch+=a.i.pitch; dI.yaw+=a.i.yaw;
    dFilter.dterm_lpf1+=a.filter.dterm_lpf1||0;
    dFilter.gyro_lpf1+=a.filter.gyro_lpf1||0;
    dFilter.anti_gravity+=a.filter.anti_gravity||0;
    dFilter.feedforward+=(a.filter.feedforward||0);
    if(a.filter.rpm_filter===true) dFilter.rpm_filter=true;
    if(a.filter.iterm_relax) dFilter.iterm_relax=a.filter.iterm_relax;
    totalConf+=a.confidence;
    allTips.push(...a.tips);
    allCLI.push({id,cli:a.cli});
    if(prioOrder.indexOf(a.priority)<prioOrder.indexOf(maxPrio)) maxPrio=a.priority;
  });

  const avgConf = Math.min(95, Math.round(totalConf/n));
  // Detect conflict: any delta > 5 in one direction then >5 in other = conflict
  const conflictDetected = (Math.abs(dD.roll)>2 && conflictCheck('d_main'));

  // Confidence drops with conflict
  const dispConf = conflictDetected ? Math.max(30, avgConf-20) : avgConf;
  setConfidence(dispConf, maxPrio, conflictDetected);

  // Conflict warning
  document.getElementById('conflict-warn').style.display = conflictDetected?'block':'none';

  // Final values
  const fP={roll:BASE.p.roll+dP.roll, pitch:BASE.p.pitch+dP.pitch, yaw:BASE.p.yaw+dP.yaw};
  const fD={roll:BASE.d.roll+dD.roll, pitch:BASE.d.pitch+dD.pitch, yaw:BASE.d.yaw+dD.yaw};
  const fI={roll:BASE.i.roll+dI.roll, pitch:BASE.i.pitch+dI.pitch, yaw:BASE.i.yaw+dI.yaw};
  const ff=Math.max(5,BASE.filter.feedforward+(dFilter.feedforward||0));
  const dlpf=Math.max(60,BASE.filter.dterm_lpf1+dFilter.dterm_lpf1);
  const glpf=Math.max(80,BASE.filter.gyro_lpf1+dFilter.gyro_lpf1);
  const ag=Math.max(2,BASE.filter.anti_gravity+dFilter.anti_gravity);

  // Render PID grid
  document.getElementById('pid-grid-wrap').innerHTML = buildGrid(dP,dD,dI,fP,fD,fI);

  // Filter tags
  renderFilterTags(dFilter, dlpf, glpf, ag, ff);

  // Tips
  const uniqTips=[...new Set(allTips)].slice(0,5);
  document.getElementById('tip-list').innerHTML=uniqTips.map(t=>`<div class="tip-item">${t}</div>`).join('');
  document.getElementById('tip-panel').style.display='block';

  // CLI
  renderCLI(allCLI, fP, fD, fI, dlpf, glpf, ag, ff, dFilter);
}

function conflictCheck(type){
  const arr=[...selected];
  if(type==='d_main'){
    let up=0,dn=0;
    arr.forEach(id=>{const a=ADJ[id];if(!a)return;if(a.d.roll>0)up++;if(a.d.roll<0)dn++;});
    return up>0&&dn>0;
  }
  return false;
}

function buildGrid(dP,dD,dI,fP,fD,fI){
  const rows=[
    ['ROLL', fP.roll,dP.roll, fD.roll,dD.roll, fI.roll,dI.roll],
    ['PITCH',fP.pitch,dP.pitch, fD.pitch,dD.pitch, fI.pitch,dI.pitch],
    ['YAW',  fP.yaw,dP.yaw, fD.yaw,dD.yaw, fI.yaw,dI.yaw],
  ];
  let html=`<div class="delta-grid">
    <div class="dg-col-hd">AXIS</div>
    <div class="dg-col-hd">— P TERM —</div>
    <div class="dg-col-hd">— D TERM —</div>
  `;
  // Re-layout as 4 cols: axis, P, D, I
  html=`<div style="display:grid;grid-template-columns:auto 1fr 1fr 1fr;gap:0">
    <div class="dg-cell" style="font-family:var(--mono);font-size:.5rem;color:var(--muted);letter-spacing:.1em;text-align:center;border-bottom:1px solid var(--bord2);padding:6px 10px">AXIS</div>
    ${['P','D','I'].map(x=>`<div class="dg-cell" style="font-family:var(--mono);font-size:.5rem;color:var(--muted);letter-spacing:.1em;text-align:center;border-bottom:1px solid var(--bord2);border-left:1px solid var(--bord2);padding:6px 10px">${x}‑TERM</div>`).join('')}
  `;
  rows.forEach(([ax,pv,pd,dv,dd,iv,id_])=>{
    html+=`<div class="dg-cell axis-label" style="border-right:1px solid var(--bord2);border-bottom:1px solid var(--bord2)">${ax}</div>`;
    [[pv,pd],[dv,dd],[iv,id_]].forEach(([val,delta])=>{
      const cls=delta>0?'up':delta<0?'dn':'nc';
      const arr=delta>0?'▲':delta<0?'▼':'—';
      const sign=delta>0?'+':'';
      html+=`<div class="dg-cell" style="border-left:1px solid var(--bord2);border-bottom:1px solid var(--bord2)">
        <span class="dg-val ${cls}">${val}</span>
        <span class="dg-delta ${cls}">${arr} ${sign}${delta}</span>
      </div>`;
    });
  });
  html+='</div>';
  return html;
}

function renderFilterTags(df, dlpf, glpf, ag, ff){
  const tags=[];
  if(df.dterm_lpf1!==0) tags.push(`<span class="flt-tag ${df.dterm_lpf1<0?'dn':'up'}">${df.dterm_lpf1<0?'▼':'▲'} dterm_lpf1 → ${dlpf}Hz</span>`);
  if(df.gyro_lpf1!==0)  tags.push(`<span class="flt-tag ${df.gyro_lpf1<0?'dn':'up'}">${df.gyro_lpf1<0?'▼':'▲'} gyro_lpf1 → ${glpf}Hz</span>`);
  if(df.anti_gravity!==0) tags.push(`<span class="flt-tag up">▲ anti_gravity → ${ag}</span>`);
  if(df.feedforward!==0) tags.push(`<span class="flt-tag ${df.feedforward<0?'dn':'up'}">${df.feedforward<0?'▼':'▲'} feedforward → ${ff}</span>`);
  if(df.rpm_filter) tags.push(`<span class="flt-tag info">⚡ rpm_filter: ON (ต้องการ BiDir DSHOT)</span>`);
  if(df.iterm_relax) tags.push(`<span class="flt-tag info">◈ iterm_relax = ${df.iterm_relax}</span>`);
  if(tags.length===0) tags.push(`<span class="flt-tag nc">— Filter settings: ไม่ต้องเปลี่ยน —</span>`);
  document.getElementById('flt-row').innerHTML=tags.join('');
  document.getElementById('flt-row').style.display='flex';
}

function renderCLI(allCLI, fP,fD,fI,dlpf,glpf,ag,ff,df){
  // Collect unique CLI commands, format with actual values
  const seen=new Set(); const lines=[];
  const vals={
    pr:fP.roll, pp:fP.pitch, py:fP.yaw,
    dr:Math.max(0,fD.roll), dp:Math.max(0,fD.pitch),
    ir:fI.roll, ip:fI.pitch, iy:fI.yaw,
    dlpf, glpf, ag, ff
  };
  lines.push(`<span class="cli-comment"># ════ Quick Tune — ${[...selected].length} symptom${selected.size>1?'s':''} ════</span>`);
  lines.push(`<span class="cli-comment"># ${new Date().toLocaleDateString('th-TH')} · OBIXConfig Doctor v5.1</span>`);
  lines.push(`<span class="cli-comment"># Base: 5" freestyle · ปรับตามค่า PID จริงของคุณ</span>`);
  lines.push('');

  allCLI.forEach(({id,cli})=>{
    lines.push(`<span class="cli-comment"># — ${LABEL_MAP[id]||id} —</span>`);
    cli.forEach(cmd=>{
      // Replace placeholders
      let out=cmd.replace(/\{(\w+)\}/g,(_,k)=>vals[k]!==undefined?`<span class="cli-val">${vals[k]}</span>`:k);
      if(seen.has(cmd)) return; seen.add(cmd);
      if(cmd.startsWith('#')) lines.push(`<span class="cli-comment">${cmd}</span>`);
      else lines.push(`<span class="cli-key">set </span><span class="cli-cmd">${out}</span>`);
    });
    lines.push('');
  });
  if(df.rpm_filter){
    lines.push(`<span class="cli-comment"># RPM Filter</span>`);
    lines.push(`<span class="cli-key">set </span><span class="cli-cmd">rpm_notch_harmonics = <span class="cli-val">3</span></span>`);
    lines.push(`<span class="cli-key">set </span><span class="cli-cmd">dshot_bidir = <span class="cli-val">ON</span></span>`);
    lines.push('');
  }
  lines.push(`<span class="cli-ok">save</span>`);
  lines.push(`<span class="cli-comment"># reboot → ทดสอบบิน → บันทึกผล</span>`);
  document.getElementById('cli-out').innerHTML=lines.join('\n');
}

const LABEL_MAP={
  oscillation_after_flip:'สั่นหลัง flip',propwash:'Propwash',bounce_back:'Bounce-back',
  yaw_spin:'Yaw spin',slow_response:'ตอบสนองช้า',toilet_bowl:'Toilet bowl',
  wind_rejection:'กันลมไม่อยู่',motor_hot:'มอเตอร์ร้อน',jello_footage:'ภาพ Jello',
  esc_desync:'ESC Desync',not_arming:'ไม่ ARM',turtle_mode_fail:'Turtle mode',video_breakup:'ภาพ FPV แตก'
};

function setConfidence(pct, prio, conflict){
  const ring=document.getElementById('conf-ring');
  const num=document.getElementById('conf-num');
  const mb=document.getElementById('mb-conf');
  const mbp=document.getElementById('mb-prio');
  if(!pct){ring.style.background='';num.textContent='—';mb.textContent='CONFIDENCE: —';mb.classList.remove('on');mbp.textContent='PRIORITY: —';mbp.classList.remove('on');return;}
  const deg=Math.round(pct*3.6);
  const col=pct>=75?'#f5a623':pct>=55?'#f5a623':'#f87171';
  ring.style.background=`conic-gradient(${col} ${deg}deg, var(--bg3) ${deg}deg)`;
  num.textContent=pct+'%';
  mb.textContent=`CONFIDENCE: ${pct}%`; mb.classList.add('on');
  if(prio){
    const pc={CRITICAL:'var(--red)',HIGH:'var(--amber)',MED:'var(--blue)',LOW:'var(--muted)'};
    mbp.textContent=`PRIORITY: ${prio}`; mbp.classList.add('on');
    mbp.style.color=pc[prio]||'';mbp.style.borderColor=pc[prio]||'';
  }
}

function copyCLI(){
  const el=document.getElementById('cli-out');
  const plain=el.innerText.replace(/\n\n+/g,'\n');
  navigator.clipboard.writeText(plain).then(()=>{
    const btn=document.getElementById('copy-btn');
    btn.textContent='✅ COPIED!'; btn.classList.add('copied');
    setTimeout(()=>{btn.textContent='⎘ COPY ALL';btn.classList.remove('copied');},2200);
  });
}

function notify(msg){
  const el=document.createElement('div');
  el.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a2820;border:1px solid var(--amber);color:var(--amber);font-family:var(--mono);font-size:.68rem;letter-spacing:.08em;padding:9px 20px;border-radius:6px;z-index:9999;animation:fadeIn .2s ease';
  el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}
