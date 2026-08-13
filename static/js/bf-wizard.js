// static/js/bf-wizard.js — Batch E: extracted from templates/bf_wizard.html inline <script>. No logic change.

'use strict';
const $=id=>document.getElementById(id);

/* ═══════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════ */
const S={
  size:5, weight:750, style:'freestyle', cells:4,
  fc:'F7', bfver:'4.4', esc:'DSHOT600', kv:2400, poles:14,
  bidir:false, idle:5.5, rx:'ELRS', vtx:'analog',
  rp:48, ri:90, rd:38, rf:100, pp:52, pi:90, pd:40, pf:100,
  yp:40, yi:90, yd:0, yf:80, master:100,
  tpa:10, tpabp:1450,
  rtype:'ACTUAL', rrc:120, rsr:70, rex:15, prc:120, psr:70, pex:15, yrc:80, ysr:45, yex:10,
  glpf1t:'PT1', glpf1:200, glpf2:0, dlpf1t:'PT1', dlpf1:110, dlpf2:0,
  rpm_filter:true, rpmh:3, rpmmin:100,
  dyn_notch:true, dync:2, dynmin:80, dynmax:400,
  airmode:'always', tboost:5, ag:5, irelax:'RP', irc:15,
  rcsm:'AUTO', ffavg:'2_POINT', blackbox:false, osd:'MAX7456',
  fsact:'DROP', fsd:4, fsod:1, motor_stop:false, mol:100,
  armang:25, minth:1000, mode3d:false
};

/* ═══ BASELINES ═══ */
const BL={
  micro2:    {rp:60,ri:75,rd:18,rf:80, pp:62,pi:75,pd:18,pf:85, yp:42,yi:75,yf:60, glpf1:280,dlpf1:140,dync:2,dynmin:120,dynmax:600},
  micro25:   {rp:55,ri:80,rd:22,rf:90, pp:58,pi:80,pd:22,pf:95, yp:40,yi:80,yf:65, glpf1:250,dlpf1:130,dync:2,dynmin:100,dynmax:500},
  whoop3:    {rp:52,ri:82,rd:24,rf:95, pp:55,pi:82,pd:25,pf:100,yp:38,yi:82,yf:65, glpf1:230,dlpf1:120,dync:2,dynmin:100,dynmax:500},
  cine35:    {rp:48,ri:88,rd:28,rf:60, pp:52,pi:88,pd:30,pf:65, yp:36,yi:85,yf:45, glpf1:190,dlpf1:105,dync:2,dynmin:80,dynmax:400},
  mini4r:    {rp:54,ri:88,rd:34,rf:130,pp:58,pi:88,pd:36,pf:135,yp:42,yi:86,yf:70, glpf1:210,dlpf1:115,dync:2,dynmin:80,dynmax:450},
  free5:     {rp:48,ri:90,rd:38,rf:100,pp:52,pi:90,pd:40,pf:105,yp:40,yi:90,yf:80, glpf1:200,dlpf1:110,dync:2,dynmin:80,dynmax:400},
  race5:     {rp:55,ri:88,rd:40,rf:145,pp:58,pi:88,pd:42,pf:150,yp:44,yi:86,yf:85, glpf1:220,dlpf1:118,dync:2,dynmin:90,dynmax:450},
  heavy6:    {rp:42,ri:88,rd:28,rf:80, pp:45,pi:88,pd:30,pf:85, yp:34,yi:85,yf:60, glpf1:170,dlpf1:100,dync:2,dynmin:70,dynmax:350},
  lr7:       {rp:36,ri:84,rd:22,rf:65, pp:38,pi:84,pd:24,pf:70, yp:30,yi:82,yf:50, glpf1:150,dlpf1:90, dync:1,dynmin:60,dynmax:300},
  lr10:      {rp:28,ri:78,rd:16,rf:50, pp:30,pi:78,pd:18,pf:55, yp:25,yi:76,yf:40, glpf1:130,dlpf1:80, dync:1,dynmin:50,dynmax:250}
};
const PD={
  '2_micro':  {bl:'micro2',  sz:2.0, wt:40,  c:2,kv:19000,st:'freestyle'},
  '25_micro': {bl:'micro25', sz:2.5, wt:80,  c:3,kv:16000,st:'freestyle'},
  '3_whoop':  {bl:'whoop3',  sz:3.0, wt:120, c:3,kv:14000,st:'freestyle'},
  '35_cine':  {bl:'cine35',  sz:3.5, wt:350, c:4,kv:3000, st:'cinematic'},
  '4_race':   {bl:'mini4r',  sz:4.0, wt:380, c:4,kv:2800, st:'racing'},
  '5_free':   {bl:'free5',   sz:5.0, wt:750, c:4,kv:2400, st:'freestyle'},
  '5_race':   {bl:'race5',   sz:5.0, wt:680, c:4,kv:2400, st:'racing'},
  '6_heavy':  {bl:'heavy6',  sz:6.0, wt:1000,c:6,kv:2200, st:'freestyle'},
  '7_lr':     {bl:'lr7',     sz:7.0, wt:1100,c:6,kv:1750, st:'longrange'},
  '10_lr':    {bl:'lr10',    sz:10.0,wt:2200,c:6,kv:1400, st:'longrange'}
};
const STYLE_MUL={
  freestyle: {p:1.00,i:1.00,d:1.00,f:1.00},
  racing:    {p:1.12,i:0.95,d:1.10,f:1.35},
  cinematic: {p:0.88,i:1.05,d:0.85,f:0.60},
  longrange: {p:0.82,i:1.05,d:0.78,f:0.70},
  proximity: {p:0.95,i:1.02,d:0.92,f:0.80}
};
const RP={
  beginner: {rrc:70, rsr:25,rex:20,prc:70, psr:25,pex:20,yrc:55,ysr:20,yex:10},
  cine:     {rrc:65, rsr:18,rex:40,prc:65, psr:18,pex:40,yrc:50,ysr:15,yex:20},
  freestyle:{rrc:120,rsr:70,rex:15,prc:120,psr:70,pex:15,yrc:80,ysr:45,yex:10},
  race:     {rrc:190,rsr:82,rex:0, prc:190,psr:82,pex:0, yrc:130,ysr:62,yex:0},
  lr:       {rrc:80, rsr:30,rex:30,prc:80, psr:30,pex:30,yrc:60,ysr:25,yex:15}
};
const STYLE_HINTS={
  freestyle:'Freestyle: trick, powerloop, split-S — สมดุล P/D สูง + FF',
  racing:'Racing: gate-to-gate speed — P/D สูง FF สูง rates เร็ว TPA จำเป็น',
  cinematic:'Cinematic: ภาพนิ่ง smooth — P/D ต่ำ FF ต่ำ rates ช้า anti-vibration',
  longrange:'Long Range: บิน efficiency ไกลๆ — P/D ปานกลาง GPS backup แนะนำ',
  proximity:'Proximity: บินใกล้สิ่งกีดขวาง — P precision สูง rates ต่ำ'
};

/* ═══ UTILS ═══ */
function clsOf(sz){
  if(sz<=2.0)return'micro2'; if(sz<=2.5)return'micro25'; if(sz<=3.0)return'whoop3';
  if(sz<=3.5)return'cine35'; if(sz<=4.0)return'mini4r';  if(sz<=5.0)return'free5';
  if(sz<=5.5)return'race5';  if(sz<=6.5)return'heavy6';  if(sz<=8.0)return'lr7';
  return'lr10';
}
function sbg(e){
  if(!e||!e.type)return;
  const p=((parseFloat(e.value)-parseFloat(e.min))/(parseFloat(e.max)-parseFloat(e.min)))*100;
  e.style.setProperty('--pct',p+'%');
}
function sv(id,val){const e=$(id);if(e){e.value=val;sbg(e);}}
function ev(id,val){const e=$(id);if(e)e.textContent=val;}
function allSliders(){document.querySelectorAll('input[type=range].ws').forEach(sbg);}

/* ═══ APPLY PID ═══ */
function applyPID(){
  const key=clsOf(S.size);
  const b=BL[key]||BL.free5;
  const m=STYLE_MUL[S.style]||STYLE_MUL.freestyle;
  const f=S.master/100;
  S.rp=Math.round(b.rp*m.p*f); S.ri=Math.round(b.ri*m.i*f); S.rd=Math.round(b.rd*m.d*f); S.rf=Math.round(b.rf*m.f*f);
  S.pp=Math.round(b.pp*m.p*f); S.pi=Math.round(b.pi*m.i*f); S.pd=Math.round(b.pd*m.d*f); S.pf=Math.round(b.pf*m.f*f);
  S.yp=Math.round(b.yp*m.p*f); S.yi=Math.round(b.yi*m.i*f); S.yd=0; S.yf=Math.round(b.yf*m.f*f);
  S.glpf1=b.glpf1; S.dlpf1=b.dlpf1; S.dync=b.dync; S.dynmin=b.dynmin; S.dynmax=b.dynmax;
  syncPIDUI(); syncFilterUI();
}
function syncPIDUI(){
  [['s_rp','pv_rp','rp'],['s_ri','pv_ri','ri'],['s_rd','pv_rd','rd'],['s_rf','pv_rf','rf'],
   ['s_pp','pv_pp','pp'],['s_pi','pv_pi','pi'],['s_pd','pv_pd','pd'],['s_pf','pv_pf','pf'],
   ['s_yp','pv_yp','yp'],['s_yi','pv_yi','yi'],['s_yd','pv_yd','yd'],['s_yf','pv_yf','yf']
  ].forEach(([s,v,k])=>{sv(s,S[k]);ev(v,S[k]);});
  updatePIDHealth();
}
function syncFilterUI(){
  [['s_glpf1','v_glpf1','glpf1',' Hz'],['s_glpf2','v_glpf2','glpf2',' Hz'],
   ['s_dlpf1','v_dlpf1','dlpf1',' Hz'],['s_dlpf2','v_dlpf2','dlpf2',' Hz'],
   ['s_dync','v_dync','dync',''],['s_dynmin','v_dynmin','dynmin',''],
   ['s_dynmax','v_dynmax','dynmax',''],['s_rpmh','v_rpmh','rpmh',''],
   ['s_rpmmin','v_rpmmin','rpmmin','']
  ].forEach(([s,v,k,u])=>{sv(s,S[k]);ev(v,S[k]+u);});
  updateBidirAlert();
}

/* ═══ PID HEALTH ═══ */
function updatePIDHealth(){
  const checks=[];
  if(S.rd>55||S.pd>58) checks.push({t:'bad',msg:'⚠️ D term สูงมาก — motor อาจร้อน ตรวจ temp หลังบิน'});
  else if(S.rd>45||S.pd>48) checks.push({t:'warn',msg:'⚠️ D term ค่อนข้างสูง — ดู motor temp หลังบิน'});
  else checks.push({t:'ok',msg:'✅ D term อยู่ในระดับปลอดภัย'});
  if(S.rp>70||S.pp>75) checks.push({t:'warn',msg:'⚠️ P term สูง — อาจ oscillate ถ้า filter ไม่พอ'});
  else checks.push({t:'ok',msg:'✅ P term อยู่ในระดับปกติ'});
  if(S.rpm_filter&&!S.bidir) checks.push({t:'warn',msg:'⚠️ RPM filter เปิดแต่ Bidir OFF — ตรวจ ESC firmware ก่อน'});
  const el=$('pidHealth');
  if(el) el.innerHTML=checks.map(c=>`<div class="health-row ${c.t}" style="margin-bottom:5px;font-size:11px">${c.msg}</div>`).join('');
}

/* ═══ BIDIR ALERT ═══ */
function updateBidirAlert(){
  const el=$('filterBidirAlert');
  if(!el)return;
  if(S.rpm_filter&&!S.bidir)
    el.innerHTML='<div class="alert warn" style="margin-bottom:10px"><span class="alert-icon">⚠️</span>RPM Filter เปิดอยู่ แต่ Bidir DSHOT ยังปิด — เปิด Bidir ใน Step 2 (Hardware) หรือตรวจสอบว่า ESC รองรับก่อน</div>';
  else el.innerHTML='';
}

/* ═══ RATES CANVAS ═══ */
function actualRate(st,rcr,sr,ex){
  const S_=sr/100,E_=ex/100,R_=rcr/100;
  const ec=st*(1-E_)+st*st*st*E_;
  return R_*ec*(1/Math.max(.0001,1-S_*st))*200;
}
function drawRates(){
  const cv=$('ratesCanvas');if(!cv)return;
  const dpr=window.devicePixelRatio||1,W=cv.offsetWidth,H=cv.offsetHeight||140;
  cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#06101e';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(0,255,136,.07)';ctx.lineWidth=1;
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(W*i/4,0);ctx.lineTo(W*i/4,H);ctx.stroke();}
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,H*i/4);ctx.lineTo(W,H*i/4);ctx.stroke();}
  const axes=[{r:S.rrc,s:S.rsr,e:S.rex,c:'#00ff88'},{r:S.prc,s:S.psr,e:S.pex,c:'#00aaff'},{r:S.yrc,s:S.ysr,e:S.yex,c:'#ffb700'}];
  let mx=0;axes.forEach(a=>{const v=actualRate(1,a.r,a.s,a.e);if(v>mx)mx=v;});
  const sc=mx>0?(H-16)/mx:1;
  axes.forEach(a=>{
    ctx.beginPath();ctx.strokeStyle=a.c;ctx.lineWidth=2;ctx.shadowColor=a.c;ctx.shadowBlur=6;
    for(let px=0;px<=W;px++){
      const st=px/W,y=H-8-actualRate(st,a.r,a.s,a.e)*sc;
      px===0?ctx.moveTo(px,y):ctx.lineTo(px,y);
    }
    ctx.stroke();ctx.shadowBlur=0;
  });
  // Center line
  ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(0,H-8);ctx.lineTo(W,H-8);ctx.stroke();ctx.setLineDash([]);
  const mr=Math.round(mx);
  ev('rateMaxLbl',mr);ev('statRate',mr);
}

/* ═══ CLI GENERATE ═══ */
function genCLI(){
  const clsName={micro2:'2" Micro',micro25:'2.5" Micro',whoop3:'3" Whoop',cine35:'3.5" Cine',
    mini4r:'4" Mini',free5:'5" Freestyle',race5:'5" Race',heavy6:'6" Heavy',lr7:'7" Mid-LR',lr10:'10" LR'}[clsOf(S.size)]||'Freestyle';
  const rxMap={ELRS:'CRSF',ELRS900:'CRSF',CRSF:'CRSF',SBUS:'SBUS',PPM:'PPM'};
  const d=new Date(), dt=`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()+543}`;
  const is45=S.bfver==='4.5';
  const gkey=is45?'gyro_lpf1_hz':'gyro_lowpass_hz';
  const dkey=is45?'dterm_lpf1_hz':'dterm_lowpass_hz';
  const L=[];
  L.push(`# ════════════════════════════════════════════════════════`);
  L.push(`# BETAFLIGHT CONFIG WIZARD — OBIXConfig Doctor · Apex v3`);
  L.push(`# โดรน  : ${S.size}" ${clsName} | ${S.weight}g | ${S.cells}S | ${S.kv} KV`);
  L.push(`# Style  : ${S.style.toUpperCase()} | BF ${S.bfver} | FC ${S.fc} | ${S.esc}`);
  L.push(`# RX/VTX : ${S.rx} / ${S.vtx} | Bidir: ${S.bidir?'ON':'OFF'}`);
  L.push(`# สร้างวันที่: ${dt}`);
  L.push(`# ════════════════════════════════════════════════════════`);
  L.push('');
  L.push('# ─── Motor / ESC ──────────────────────────────────────────');
  L.push(`set motor_pwm_protocol = ${S.esc}`);
  L.push(`set motor_poles        = ${S.poles}`);
  L.push(`set motor_idle_offset  = ${Math.round(S.idle*10)}`);
  if(S.mol<100) L.push(`set motor_output_limit = ${S.mol}`);
  if(S.bidir)   L.push(`set dshot_bidir        = ON`);
  L.push(`set min_throttle       = ${S.minth}`);
  L.push(S.motor_stop?'feature MOTOR_STOP':'feature -MOTOR_STOP');
  if(S.mode3d)  L.push('feature 3D');
  L.push('');
  L.push('# ─── Rates ─────────────────────────────────────────────────');
  L.push(`set rates_type        = ${S.rtype}`);
  L.push(`set roll_rc_rate      = ${S.rrc}`);
  L.push(`set roll_super_rate   = ${S.rsr}`);
  L.push(`set roll_expo         = ${S.rex}`);
  L.push(`set pitch_rc_rate     = ${S.prc}`);
  L.push(`set pitch_super_rate  = ${S.psr}`);
  L.push(`set pitch_expo        = ${S.pex}`);
  L.push(`set yaw_rc_rate       = ${S.yrc}`);
  L.push(`set yaw_super_rate    = ${S.ysr}`);
  L.push(`set yaw_expo          = ${S.yex}`);
  L.push('');
  L.push('# ─── PID ───────────────────────────────────────────────────');
  L.push(`set p_roll  = ${S.rp}`);
  L.push(`set i_roll  = ${S.ri}`);
  L.push(`set d_roll  = ${S.rd}`);
  L.push(`set f_roll  = ${S.rf}`);
  L.push(`set p_pitch = ${S.pp}`);
  L.push(`set i_pitch = ${S.pi}`);
  L.push(`set d_pitch = ${S.pd}`);
  L.push(`set f_pitch = ${S.pf}`);
  L.push(`set p_yaw   = ${S.yp}`);
  L.push(`set i_yaw   = ${S.yi}`);
  L.push(`set f_yaw   = ${S.yf}`);
  L.push(`set tpa_rate          = ${S.tpa}`);
  L.push(`set tpa_breakpoint    = ${S.tpabp}`);
  L.push('');
  L.push('# ─── Filters ───────────────────────────────────────────────');
  if(is45){
    L.push(`set gyro_lpf1_hz      = ${S.glpf1}`);
    L.push(`set gyro_lpf1_type    = ${S.glpf1t}`);
    if(S.glpf2>0){L.push(`set gyro_lpf2_hz   = ${S.glpf2}`);L.push(`set gyro_lpf2_type = PT1`);}
    L.push(`set dterm_lpf1_hz     = ${S.dlpf1}`);
    L.push(`set dterm_lpf1_type   = ${S.dlpf1t}`);
    if(S.dlpf2>0){L.push(`set dterm_lpf2_hz  = ${S.dlpf2}`);L.push(`set dterm_lpf2_type = PT1`);}
  } else {
    L.push(`set ${gkey.padEnd(22)}= ${S.glpf1}`);
    if(S.glpf2>0) L.push(`set gyro_lowpass2_hz   = ${S.glpf2}`);
    L.push(`set ${dkey.padEnd(22)}= ${S.dlpf1}`);
    if(S.dlpf2>0) L.push(`set dterm_lowpass2_hz  = ${S.dlpf2}`);
  }
  L.push(`set rpm_filter        = ${S.rpm_filter?'ON':'OFF'}`);
  if(S.rpm_filter){
    L.push(`set rpm_filter_harmonics = ${S.rpmh}`);
    L.push(`set rpm_filter_min_hz    = ${S.rpmmin}`);
  }
  L.push(`set dyn_notch_count   = ${S.dyn_notch?S.dync:0}`);
  if(S.dyn_notch){
    L.push(`set dyn_notch_min_hz  = ${S.dynmin}`);
    L.push(`set dyn_notch_max_hz  = ${S.dynmax}`);
  }
  L.push('');
  L.push('# ─── Receiver ──────────────────────────────────────────────');
  if(S.rx==='PPM'){L.push('feature RX_PPM');L.push('feature -SERIALRX');}
  else{L.push(`set serialrx_provider = ${rxMap[S.rx]||'CRSF'}`);L.push('feature SERIALRX');L.push('feature -RX_PPM');}
  L.push('');
  L.push('# ─── Features ──────────────────────────────────────────────');
  L.push(S.airmode==='always'?'feature AIRMODE':'feature -AIRMODE');
  L.push(`set anti_gravity_gain   = ${S.ag}`);
  L.push(`set iterm_relax         = ${S.irelax}`);
  L.push(`set iterm_relax_cutoff  = ${S.irc}`);
  L.push(`set throttle_boost      = ${S.tboost}`);
  L.push(`set rc_smoothing_mode   = ${S.rcsm}`);
  if(S.rcsm!=='OFF') L.push(`set feedforward_averaging = ${S.ffavg}`);
  if(S.blackbox) L.push('feature BLACKBOX');
  if(S.osd!=='NONE') L.push(`set osd_displayport_device = ${S.osd}`);
  L.push('');
  L.push('# ─── Safety / Failsafe ──────────────────────────────────────');
  L.push(`set failsafe_procedure  = ${S.fsact}`);
  L.push(`set failsafe_delay      = ${S.fsd}`);
  L.push(`set failsafe_off_delay  = ${S.fsod}`);
  L.push(`set small_angle         = ${S.armang}`);
  L.push('');
  L.push('save');
  return L.join('\n');
}

function hl(raw){
  return raw
    .replace(/(^# ═+.*)$/gm,'<span class="cc">$1</span>')
    .replace(/(^# ─+.*)$/gm,'<span class="cc">$1</span>')
    .replace(/(^# .*)$/gm,'<span class="cc">$1</span>')
    .replace(/^(feature )(.+)$/gm,'<span class="cf">$1$2</span>')
    .replace(/^(set )(\S+)(\s*=\s*)(.+)$/gm,'<span class="ck">$1</span>$2$3<span class="cv">$4</span>')
    .replace(/^(save)$/gm,'<span class="cs">$1</span>');
}

function rCLI(){
  const cli=genCLI();
  const co=$('cliOut');if(co)co.innerHTML=hl(cli);
  ev('statLines',cli.split('\n').length);
  ev('statPID',`${S.rp}/${S.ri}/${S.rd}`);
  ev('statBF',S.bfver);
  const oc=$('outCopy');if(oc)oc.textContent=cli;
  updateSafetyGrid();
  updateWarnZone(cli);
}
function updateWarnZone(cli){
  const w=[];
  if(S.kv>3500&&S.cells>=6) w.push({t:'warn',m:'KV สูงมากบน 6S+ — เสี่ยง motor ร้อน ตรวจ temp หลังบิน'});
  if(S.rx==='PPM') w.push({t:'warn',m:'PPM ไม่รองรับ RSSI telemetry — แนะนำ ELRS/CRSF'});
  if(S.glpf1>450) w.push({t:'warn',m:'Gyro LPF1 สูงมาก — เสี่ยง oscillation ถ้าไม่มี RPM filter'});
  if(S.rpm_filter&&!S.bidir) w.push({t:'warn',m:'RPM filter ON แต่ Bidir OFF — ตรวจ ESC firmware ก่อน'});
  if(S.rd>58||S.pd>60) w.push({t:'warn',m:'D term สูงมาก — motor อาจร้อนผิดปกติ ลด D ถ้า motor temp >60°C'});
  if(S.fsd<3) w.push({t:'danger',m:'Failsafe delay ต่ำเกิน ('+S.fsd*0.1+'s) อาจ false trigger จาก RF interference'});
  const el=$('warnZone');if(!el)return;
  el.innerHTML=w.map(x=>`<div class="alert ${x.t}" style="margin-bottom:7px"><span class="alert-icon">${x.t==='danger'?'🚨':'⚠️'}</span><div>${x.m}</div></div>`).join('');
}
function updateSafetyGrid(){
  const sg=$('safetyGrid');if(!sg)return;
  const items=[
    {t:S.fsact==='DROP'?'ok':'warn',title:'FAILSAFE',body:`${S.fsact} · Delay ${S.fsd*0.1}s`},
    {t:!S.motor_stop?'ok':'warn',title:'MOTOR STOP',body:S.motor_stop?'ON ⚠️ ระวัง':'OFF ✅'},
    {t:S.bidir?'ok':'warn',title:'BIDIR DSHOT',body:S.bidir?'ON ✅':'OFF (RPM filter จำกัด)'},
    {t:S.armang<=30?'ok':'warn',title:'ARM ANGLE',body:`${S.armang}°${S.armang>45?' ⚠️ สูง':' ✅'}`},
  ];
  sg.innerHTML=items.map(i=>`<div class="safety-item ${i.t}"><div class="si-title ${i.t}">${i.title}</div><div class="si-body">${i.body}</div></div>`).join('');
}

function refreshOutSummary(){
  const mr=Math.round(actualRate(1,S.rrc,S.rsr,S.rex));
  const items=[
    {l:'Frame',v:`${S.size}" · ${S.weight}g`},{l:'Battery',v:`${S.cells}S · ${S.kv} KV`},
    {l:'Style',v:S.style.toUpperCase()},{l:'FC / BF',v:`${S.fc} / BF${S.bfver}`},
    {l:'ESC Proto',v:S.esc},{l:'Receiver',v:S.rx},
    {l:'PID P/I/D',v:`${S.rp}/${S.ri}/${S.rd}`},{l:'Max Rates',v:`${mr} °/s`},
    {l:'Gyro LPF',v:`${S.glpf1} Hz`},{l:'Bidir',v:S.bidir?'ON ✅':'OFF'},
    {l:'Failsafe',v:S.fsact},{l:'Idle%',v:S.idle+'%'},
  ];
  const og=$('outGrid');
  if(og)og.innerHTML=items.map(i=>`<div class="out-card"><div class="oc-lbl">${i.l}</div><div class="oc-val">${i.v}</div></div>`).join('');
  const fn=`bf_wizard_${S.size}in_${S.cells}S_${S.style}_BF${S.bfver}.txt`;
  const db=$('dlBtn');if(db) db.onclick=()=>downloadCLI(fn);
}

/* ═══ STEP NAV ═══ */
let CUR=1;
function goStep(n){
  if(n<1||n>8)return;
  $('stp'+CUR)?.classList.remove('act');
  CUR=n;
  $('stp'+n)?.classList.add('act');
  // Update step bar
  document.querySelectorAll('.si').forEach((e,i)=>{
    const s=i+1;e.classList.remove('act','done');
    if(s===n) e.classList.add('act');
    else if(s<n) e.classList.add('done');
  });
  // Progress bar
  $('progFill').style.width=(n/8*100)+'%';
  ev('stepCtr',`ขั้นที่ ${n} / 8`);
  $('btnPrev').disabled=(n===1);
  const nb=$('btnNext');
  if(n===7){nb.textContent='🔥 GENERATE CLI';nb.className='nbtn gen';}
  else if(n===8){nb.style.display='none';}
  else{nb.textContent='ถัดไป →';nb.className='nbtn next';nb.style.display='';}
  if(n===4) setTimeout(drawRates,80);
  if(n===7) updateSafetyGrid();
  if(n===8){refreshOutSummary();rCLI();}
  window.scrollTo({top:0,behavior:'smooth'});
}
function stepNext(){if(CUR<8)goStep(CUR+1);}
function stepPrev(){if(CUR>1)goStep(CUR-1);}
document.querySelectorAll('.si').forEach(e=>{
  e.addEventListener('click',()=>{
    const n=parseInt(e.dataset.s);if(n<=CUR+1)goStep(n);
  });
});

/* ═══ PILLS ═══ */
function setActivePill(gid,val){
  const g=$(gid);if(!g)return;
  g.querySelectorAll('.pbtn').forEach(b=>b.classList.remove('sel','sel-b','sel-a','sel-r'));
  const b=g.querySelector(`[data-v="${val}"]`);if(b)b.classList.add('sel');
}
function initPills(gid,key,cb){
  const g=$(gid);if(!g)return;
  g.querySelectorAll('.pbtn').forEach(b=>{
    b.addEventListener('click',()=>{
      g.querySelectorAll('.pbtn').forEach(x=>x.classList.remove('sel','sel-b','sel-a','sel-r'));
      b.classList.add('sel');
      if(key)S[key]=b.dataset.v;
      if(cb)cb(b.dataset.v);
      rCLI();
    });
  });
}

/* ═══ SLIDERS ═══ */
function bind(id,key,vid,fmt,cb){
  const e=$(id);if(!e)return;sbg(e);
  e.addEventListener('input',()=>{
    const v=parseFloat(e.value);S[key]=v;sbg(e);
    if(vid)ev(vid,fmt?fmt(v):v);
    if(cb)cb(v);rCLI();
  });
}

/* ═══ TOGGLES ═══ */
function twClick(wrap,key,cbId){
  const cb=$(cbId);if(!cb)return;
  cb.checked=!cb.checked;S[key]=cb.checked;
  wrap.classList.toggle('on',cb.checked);
  if(key==='dyn_notch')$('dynExt').style.display=cb.checked?'':'none';
  if(key==='rpm_filter')$('rpmExt').style.display=cb.checked?'':'none';
  updateBidirAlert();
  rCLI();
}

/* ═══ COPY / DOWNLOAD ═══ */
function showToast(msg){
  const t=$('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);
}
function copyCLI(){navigator.clipboard.writeText(genCLI()).then(()=>showToast('✅ Copy แล้ว — ไปวาง paste ใน Betaflight CLI ได้เลย'));}
function downloadCLI(fn){
  fn=fn||`bf_wizard_${S.size}in_${S.cells}S_${S.style}.txt`;
  const a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(genCLI());
  a.download=fn;a.click();showToast('⬇️ Downloaded '+fn);
}

/* ═══ MOBILE CLI PANEL ═══ */
function toggleCLIPanel(){
  const p=$('cliPanel');p.classList.toggle('open');
  $('cliToggle').textContent=p.classList.contains('open')?'✕':'📟';
}

/* ═══ INIT ═══ */
// Preset cards
document.querySelectorAll('.pcard').forEach(c=>{
  c.addEventListener('click',()=>{
    document.querySelectorAll('.pcard').forEach(x=>x.classList.remove('sel'));
    c.classList.add('sel');
    const p=PD[c.dataset.p];if(!p)return;
    S.size=p.sz; S.weight=p.wt; S.cells=p.c; S.kv=p.kv;
    S.style=p.st;
    sv('s_size',p.sz*10);ev('v_size',p.sz.toFixed(1)+'"');
    sv('s_weight',p.wt);ev('v_weight',p.wt+' g');
    sv('s_kv',p.kv);ev('v_kv',p.kv+' KV');
    setActivePill('pg_style',p.st);
    setActivePill('pg_cells',p.c.toString());
    ev('styleHint',STYLE_HINTS[p.st]||'');
    applyPID();rCLI();
  });
});

initPills('pg_style','style',v=>{ev('styleHint',STYLE_HINTS[v]||'');applyPID();});
initPills('pg_cells','cells');
initPills('pg_fc','fc');
initPills('pg_bfver','bfver');
initPills('pg_esc','esc');
initPills('pg_poles','poles',v=>S.poles=parseInt(v));
initPills('pg_rx','rx');
initPills('pg_vtx','vtx');
initPills('pg_glpf1t','glpf1t');
initPills('pg_dlpf1t','dlpf1t');
initPills('pg_air','airmode');
initPills('pg_irelax','irelax');
initPills('pg_rcsm','rcsm');
initPills('pg_ffavg','ffavg');
initPills('pg_osd','osd');
initPills('pg_fsact','fsact');
initPills('pg_rtype','rtype');
initPills('pg_ratepre',null,pr=>{
  const p=RP[pr];if(!p)return;
  Object.assign(S,p);
  const vm={rrc:'rv_rrc',rsr:'rv_rsr',rex:'rv_rex',prc:'rv_prc',psr:'rv_psr',pex:'rv_pex',yrc:'rv_yrc',ysr:'rv_ysr',yex:'rv_yex'};
  const sm={rrc:'r_rrc',rsr:'r_rsr',rex:'r_rex',prc:'r_prc',psr:'r_psr',pex:'r_pex',yrc:'r_yrc',ysr:'r_ysr',yex:'r_yex'};
  Object.keys(vm).forEach(k=>{sv(sm[k],S[k]);ev(vm[k],(S[k]/100).toFixed(2));});
  drawRates();
});
initPills('pg_pidpre',null,v=>{
  S.master=parseInt(v);sv('s_master',v);ev('v_master',(parseInt(v)/100).toFixed(2)+'×');applyPID();
});

// Sliders
bind('s_size','size','v_size',v=>(v/10).toFixed(1)+'"',()=>applyPID());
bind('s_weight','weight','v_weight',v=>Math.round(v)+' g');
bind('s_kv','kv','v_kv',v=>Math.round(v)+' KV');
bind('s_idle','idle','v_idle',v=>parseFloat(v).toFixed(1));
bind('s_master','master','v_master',v=>(v/100).toFixed(2)+'×',()=>applyPID());
bind('s_tpa','tpa','v_tpa',v=>Math.round(v));
bind('s_tpabp','tpabp','v_tpabp',v=>Math.round(v));
bind('s_glpf1','glpf1','v_glpf1',v=>Math.round(v)+' Hz');
bind('s_glpf2','glpf2','v_glpf2',v=>v==0?'0 (ปิด)':Math.round(v)+' Hz');
bind('s_dlpf1','dlpf1','v_dlpf1',v=>Math.round(v)+' Hz');
bind('s_dlpf2','dlpf2','v_dlpf2',v=>v==0?'0 (ปิด)':Math.round(v)+' Hz');
bind('s_dync','dync','v_dync',v=>Math.round(v));
bind('s_dynmin','dynmin','v_dynmin',v=>Math.round(v));
bind('s_dynmax','dynmax','v_dynmax',v=>Math.round(v));
bind('s_rpmh','rpmh','v_rpmh',v=>Math.round(v));
bind('s_rpmmin','rpmmin','v_rpmmin',v=>Math.round(v));
bind('s_tboost','tboost','v_tboost',v=>Math.round(v));
bind('s_ag','ag','v_ag',v=>Math.round(v));
bind('s_irc','irc','v_irc',v=>Math.round(v)+' Hz');
bind('s_fsd','fsd','v_fsd',v=>Math.round(v));
bind('s_fsod','fsod','v_fsod',v=>Math.round(v));
bind('s_mol','mol','v_mol',v=>Math.round(v));
bind('s_armang','armang','v_armang',v=>Math.round(v));
bind('s_minth','minth','v_minth',v=>Math.round(v));

// PID sliders
[['s_rp','pv_rp','rp'],['s_ri','pv_ri','ri'],['s_rd','pv_rd','rd'],['s_rf','pv_rf','rf'],
 ['s_pp','pv_pp','pp'],['s_pi','pv_pi','pi'],['s_pd','pv_pd','pd'],['s_pf','pv_pf','pf'],
 ['s_yp','pv_yp','yp'],['s_yi','pv_yi','yi'],['s_yd','pv_yd','yd'],['s_yf','pv_yf','yf']
].forEach(([s,v,k])=>{
  const e=$(s);if(!e)return;sbg(e);
  e.addEventListener('input',()=>{S[k]=parseInt(e.value);sbg(e);ev(v,e.value);updatePIDHealth();rCLI();});
});

// Rates sliders
[['r_rrc','rv_rrc','rrc'],['r_rsr','rv_rsr','rsr'],['r_rex','rv_rex','rex'],
 ['r_prc','rv_prc','prc'],['r_psr','rv_psr','psr'],['r_pex','rv_pex','pex'],
 ['r_yrc','rv_yrc','yrc'],['r_ysr','rv_ysr','ysr'],['r_yex','rv_yex','yex']
].forEach(([s,v,k])=>{
  const e=$(s);if(!e)return;sbg(e);
  e.addEventListener('input',()=>{S[k]=parseInt(e.value);sbg(e);ev(v,(S[k]/100).toFixed(2));drawRates();rCLI();});
});

// Initial render
applyPID();syncPIDUI();syncFilterUI();rCLI();allSliders();
ev('v_size',(parseInt($('s_size').value)/10).toFixed(1)+'"');
ev('v_kv',$('s_kv').value+' KV');
