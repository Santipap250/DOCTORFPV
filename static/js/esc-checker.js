// static/js/esc-checker.js — Batch D: extracted from templates/esc_checker.html inline <script>. No logic change.

'use strict';

var STATOR_DATA = {
  1105:{wMax:55,rOhm:180}, 1404:{wMax:90,rOhm:120}, 1507:{wMax:120,rOhm:90},
  2004:{wMax:150,rOhm:80}, 2205:{wMax:200,rOhm:65}, 2206:{wMax:240,rOhm:58},
  2207:{wMax:290,rOhm:50}, 2306:{wMax:320,rOhm:45}, 2812:{wMax:380,rOhm:38}, 3115:{wMax:450,rOhm:32}
};

var STYLE_FAC = {freestyle:1.55, racing:2.00, longrange:1.05, cinematic:1.25}; // synced with thrust_logic.py

var PROTOS = [
  {name:'DSHOT300',    f:'F4', us:0.27, bidir:false, note:'ใช้ได้ทุก FC — เสถียรมาก'},
  {name:'DSHOT600',    f:'F4', us:0.14, bidir:true,  note:'มาตรฐาน BiDir OK F4+'},
  {name:'DSHOT1200',   f:'F7', us:0.07, bidir:true,  note:'ต้องการ F7/H7 + ESC ดี'},
  {name:'DSHOT600_BD', f:'F4', us:0.20, bidir:true,  note:'BiDir mode RPM filter'}
];

var BUILD_PRESETS = {
  whoop:{cells:2,kv:19000,stator:'1105',style:'cinematic',escA:10,escVolt:2,propSz:1.6,poles:12,numMot:4,ambient:28},
  micro:{cells:3,kv:6000, stator:'1507',style:'freestyle', escA:20,escVolt:3,propSz:2.5,poles:12,numMot:4,ambient:30},
  fs4:  {cells:4,kv:2400, stator:'2207',style:'freestyle', escA:45,escVolt:4,propSz:5.1,poles:14,numMot:4,ambient:30},
  fs6:  {cells:6,kv:1750, stator:'2207',style:'racing',    escA:45,escVolt:6,propSz:5.0,poles:14,numMot:4,ambient:32},
  cine: {cells:4,kv:1900, stator:'2206',style:'cinematic', escA:35,escVolt:4,propSz:3.5,poles:14,numMot:4,ambient:28},
  lr7:  {cells:6,kv:1600, stator:'2812',style:'longrange', escA:40,escVolt:6,propSz:7.0,poles:14,numMot:4,ambient:35}
};

var ESC_PRESETS = {
  tekko32_45: {escA:45,escVolt:6,cpu:'h7'},
  tekko32_65: {escA:65,escVolt:6,cpu:'h7'},
  flywoo_35:  {escA:35,escVolt:4,cpu:'f4'},
  aikon_45:   {escA:45,escVolt:6,cpu:'f7'},
  holybro_55: {escA:55,escVolt:6,cpu:'f7'},
  am32_60:    {escA:60,escVolt:6,cpu:'h7'},
  blheli_s_20:{escA:20,escVolt:4,cpu:'f4'},
  blheli32_35:{escA:35,escVolt:6,cpu:'f4'}
};

function applyPreset(key){
  var p=BUILD_PRESETS[key]; if(!p) return;
  sv('cells',p.cells); sv('kv',p.kv); sv('stator',p.stator); sv('style',p.style);
  sv('escA',p.escA); sv('escVolt',p.escVolt); sv('propSz',p.propSz);
  sv('poles',p.poles); sv('numMot',p.numMot); sv('ambient',p.ambient);
  document.querySelectorAll('.preset-btn').forEach(function(b){b.classList.remove('active')});
  var keys=['whoop','micro','fs4','fs6','cine','lr7'];
  var idx=keys.indexOf(key);
  var btns=document.querySelectorAll('.preset-btn');
  if(idx>=0&&btns[idx]) btns[idx].classList.add('active');
  liveCheck();
  document.getElementById('results').classList.add('hidden');
}

function applyEscPreset(key,btn){
  var p=ESC_PRESETS[key]; if(!p) return;
  sv('escA',p.escA); sv('escVolt',p.escVolt); sv('cpu',p.cpu);
  document.querySelectorAll('.esc-pb').forEach(function(b){b.classList.remove('active')});
  if(btn) btn.classList.add('active');
  liveCheck();
}

function sv(id,val){ var el=document.getElementById(id); if(el) el.value=val; }
function gv(id){ return document.getElementById(id).value; }

function liveCheck(){
  var cells=+gv('cells'), kv=+gv('kv'), escVolt=+gv('escVolt');
  var hint=document.getElementById('v-hint');
  if(hint) hint.textContent='Nominal: '+(cells*3.7).toFixed(1)+'V · Max: '+(cells*4.2).toFixed(1)+'V';
  var kvLive=document.getElementById('kv-live');
  var kvEl=document.getElementById('kv');
  if(kv&&cells){
    if((cells>=7&&kv>1500)||(cells>=6&&kv>2200)){
      showLive(kvLive,'lt-bad','❌ KV อันตราย × '+cells+'S');
      kvEl.classList.add('live-bad'); kvEl.classList.remove('live-warn');
    } else if(cells>=6&&kv>1750){
      showLive(kvLive,'lt-warn','⚠️ KV สูงบน '+cells+'S');
      kvEl.classList.add('live-warn'); kvEl.classList.remove('live-bad');
    } else { hideLive(kvLive); kvEl.classList.remove('live-bad','live-warn'); }
  }
  var voltLive=document.getElementById('volt-live');
  var escVoltEl=document.getElementById('escVolt');
  if(cells>escVolt){
    showLive(voltLive,'lt-bad','❌ แบต '+cells+'S > ESC '+escVolt+'S!');
    escVoltEl.classList.add('live-bad'); escVoltEl.classList.remove('live-warn');
  } else if(cells===escVolt){
    showLive(voltLive,'lt-warn','⚡ ชนพิกัด — ต้องใส่ cap ดี');
    escVoltEl.classList.add('live-warn'); escVoltEl.classList.remove('live-bad');
  } else { hideLive(voltLive); escVoltEl.classList.remove('live-bad','live-warn'); }
}

function showLive(el,cls,msg){ if(!el) return; el.style.display='inline-block'; el.className='live-tag '+cls; el.textContent=msg; }
function hideLive(el){ if(el){ el.style.display='none'; } }

function calculate(){
  var cells=parseInt(gv('cells')), kv=parseInt(gv('kv'));
  var stName=gv('stator'), style=gv('style');
  var escA=parseInt(gv('escA')), escVolt=parseInt(gv('escVolt'));
  var cpu=gv('cpu'), poles=parseInt(gv('poles'));
  var propSz=parseFloat(gv('propSz')), ambient=parseFloat(gv('ambient'))||30;
  var numMot=parseInt(gv('numMot'));
  var st=STATOR_DATA[parseInt(stName)]||STATOR_DATA[2207];
  var vNom=cells*3.7, vMax=cells*4.2;
  var sfac=STYLE_FAC[style]||1.55;

  /* Current */
  var hoverPwrPm=st.wMax*0.42;
  var hoverA_pm=hoverPwrPm/vNom, hoverA_tot=hoverA_pm*numMot;
  var avgA_pm=hoverPwrPm*sfac/vNom, avgA_tot=avgA_pm*numMot;
  var peakA_pm=(st.wMax*0.88)/vNom, peakA_tot=peakA_pm*numMot;
  var recEscA=Math.max(20,Math.ceil(peakA_pm*1.25/5)*5);
  var escSt=escA>=recEscA?'ok':escA>=recEscA*0.82?'warn':'bad';

  /* Protocol */
  var bidirOk=!(cpu==='f4'&&cells>=6);
  var recProto='DSHOT600';

  /* Throttle profile */
  var profile=[
    {label:'Idle 10%', pct:0.10},{label:'Hover 40%', pct:0.40},
    {label:'Cruise 65%',pct:0.65},{label:'Sport 80%', pct:0.80},{label:'Burst 100%',pct:1.00}
  ];
  profile.forEach(function(p){ p.currentPm=(st.wMax*p.pct*0.88)/vNom; p.currentTot=p.currentPm*numMot; });

  /* Thermal */
  var pHeat_pm=peakA_pm*peakA_pm*0.003*4;
  var rTh=8.5-(escA/100*2.5);
  var airflow={freestyle:0.65,racing:0.55,longrange:0.75,cinematic:0.85}[style]||0.7;
  var dT=pHeat_pm*rTh*airflow;
  var tEsc=ambient+dT;

  /* Signal chain */
  var cpuUs={f4:28,g4:24,f7:20,h7:12}[cpu]||28;
  var dshotUs=bidirOk?200:140, rcMs=2.5, motorMs=3.0, gyroUs=12.5, escUs=80;
  var totalMs=rcMs+(cpuUs+gyroUs+dshotUs+escUs)/1000+motorMs;
  var scRating=totalMs<5?'ok':totalMs<9?'warn':'bad';

  /* Health score */
  var scoreVolt=cells<=escVolt-1?100:cells===escVolt?55:0;
  var scoreCurrent=Math.min(100,Math.max(0,Math.round((1-peakA_pm/escA)*100*1.4)));
  var scoreKV=cells>=6&&kv>2200?20:cells>=6&&kv>1750?55:cells>=7&&kv>1500?30:95;
  var scoreThermal=tEsc<60?100:tEsc<75?75:tEsc<90?45:20;
  var scoreProto=bidirOk?100:75;
  var healthScore=Math.round(scoreVolt*0.30+scoreCurrent*0.30+scoreKV*0.20+scoreThermal*0.10+scoreProto*0.10);

  /* RENDER */
  renderScoreRing(healthScore);
  renderGauges(hoverA_tot,hoverA_pm,avgA_tot,avgA_pm,peakA_tot,peakA_pm,recEscA,escA,escSt,style);
  renderReportCard(healthScore,scoreVolt,scoreCurrent,scoreKV,scoreThermal,scoreProto);
  renderChart(profile,escA,numMot);
  buildHealth(peakA_pm,avgA_pm,hoverA_pm,escA,kv,vNom);
  buildThermal(tEsc,ambient,dT,pHeat_pm);
  buildProto(recProto,cpu,bidirOk,cells);
  buildSignalChain(rcMs,cpuUs,gyroUs,dshotUs,escUs,motorMs,totalMs,scRating,cpu,bidirOk);
  buildCap(cells,vMax,peakA_tot);
  buildAlerts(kv,cells,escA,recEscA,escVolt,peakA_pm,avgA_pm,bidirOk,cpu,poles,vMax,tEsc);
  buildCLI(recProto,bidirOk,poles,recEscA,cells,kv,propSz,style,escA,tEsc,cpu);

  document.getElementById('results').classList.remove('hidden');
  setTimeout(function(){ document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'}); }, 60);
}

function renderScoreRing(score){
  var circ=345.4, offset=circ-(score/100)*circ;
  var col=score>=75?'#10c47a':score>=50?'#fbbf24':'#f87171';
  var grade=score>=90?'A+':score>=80?'A':score>=70?'B':score>=60?'C':score>=45?'D':'F';
  var sub=score>=80?'Excellent — ESC เหมาะสมมาก':score>=65?'Good — ใช้ได้ดี':score>=50?'Acceptable — มีจุดระวัง':'⚠️ Need Attention — ดูคำเตือน';
  var circle=document.getElementById('scoreCircle');
  circle.style.stroke=col;
  setTimeout(function(){ circle.style.strokeDashoffset=offset; }, 60);
  document.getElementById('scoreNum').textContent=score;
  document.getElementById('scoreNum').style.color=col;
  document.getElementById('scoreGrade').textContent=grade;
  document.getElementById('scoreGrade').style.color=col;
  document.getElementById('scoreSubtitle').textContent=sub;
  document.getElementById('scoreCard').style.borderColor=col+'44';
}

function renderGauges(hA,hApm,avgA,avgApm,peakA,peakApm,recEscA,escA,escSt,style){
  var sl={freestyle:'Freestyle',racing:'Racing',longrange:'Long Range',cinematic:'Cine'}[style]||style;
  setGauge('g-hover','v-hover','n-hover',hA.toFixed(1),'A',hApm.toFixed(1)+'A/motor — hover','ok');
  setGauge('g-avg','v-avg','n-avg',avgA.toFixed(1),'A',avgApm.toFixed(1)+'A/motor ('+sl+')',avgApm>escA*0.80?'warn':'ok');
  setGauge('g-peak','v-peak','n-peak',peakA.toFixed(0),'A',peakApm.toFixed(0)+'A/motor burst',peakApm>escA?'bad':peakApm>escA*0.85?'warn':'ok');
  setGauge('g-esc','v-esc','n-esc',recEscA+'A+','','มีอยู่ '+escA+'A → '+(escSt==='ok'?'✅ OK':escSt==='warn'?'⚠️ ตึง':'❌ ไม่พอ'),escSt);
}

function renderReportCard(total,v,c,k,t,p){
  var grade=total>=90?'A+':total>=80?'A':total>=70?'B':total>=60?'C':total>=45?'D':'F';
  var col=total>=75?'var(--g)':total>=50?'var(--amb)':'var(--red)';
  var badge=document.getElementById('gradeBadge');
  badge.textContent=grade; badge.style.color=col; badge.style.borderColor=col;
  badge.style.background=total>=75?'rgba(16,196,122,.08)':total>=50?'rgba(251,191,36,.08)':'rgba(248,113,113,.08)';
  var rows=[
    {lbl:'Voltage Safety', pct:v},{lbl:'Current Headroom',pct:c},
    {lbl:'KV × Cells',     pct:k},{lbl:'Thermal Load',    pct:t},{lbl:'Protocol',pct:p}
  ];
  var html='';
  rows.forEach(function(r){
    var rc=r.pct>=80?'var(--g)':r.pct>=50?'var(--amb)':'var(--red)';
    html+='<div class="grade-row"><span class="grade-row-lbl">'+r.lbl+'</span>';
    html+='<div class="grade-row-bar"><div class="grade-row-fill" style="width:'+r.pct+'%;background:'+rc+'"></div></div>';
    html+='<span class="grade-row-score" style="color:'+rc+'">'+r.pct+'</span></div>';
  });
  document.getElementById('gradeRows').innerHTML=html;
}

function renderChart(profile,escA,numMot){
  var canvas=document.getElementById('profileCanvas');
  var ctx=canvas.getContext('2d');
  var dpr=window.devicePixelRatio||1;
  var w=canvas.parentElement.clientWidth||600, h=165;
  canvas.width=w*dpr; canvas.height=h*dpr;
  canvas.style.width=w+'px'; canvas.style.height=h+'px';
  ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
  var pad={top:12,right:20,bottom:32,left:46};
  var cw=w-pad.left-pad.right, ch=h-pad.top-pad.bottom;
  var maxA=Math.max(escA*1.12,profile[profile.length-1].currentTot*1.12);
  var bw=cw/profile.length-10;
  /* Grid */
  ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
  [0.25,0.5,0.75,1].forEach(function(f){
    var y=pad.top+ch*(1-f);
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cw,y); ctx.stroke();
    ctx.fillStyle='rgba(122,143,158,.5)'; ctx.font='9px "JetBrains Mono"'; ctx.textAlign='right';
    ctx.fillText(Math.round(maxA*f)+'A',pad.left-4,y+3);
  });
  /* ESC line */
  var escY=pad.top+ch*(1-escA/maxA);
  ctx.strokeStyle='rgba(16,196,122,.5)'; ctx.setLineDash([4,3]); ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(pad.left,escY); ctx.lineTo(pad.left+cw,escY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle='rgba(16,196,122,.6)'; ctx.font='9px "JetBrains Mono"'; ctx.textAlign='left';
  ctx.fillText('ESC '+escA+'A',pad.left+4,escY-4);
  /* Bars */
  profile.forEach(function(p,i){
    var bh=ch*(p.currentTot/maxA);
    var x=pad.left+i*(bw+10)+5, y=pad.top+ch-bh;
    var col=p.currentTot>escA?'rgba(248,113,113,.9)':p.currentTot>escA*0.85?'rgba(251,191,36,.85)':'rgba(88,166,255,.8)';
    ctx.fillStyle=col;
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,bw,bh,[4,4,0,0]); ctx.fill(); }
    else { ctx.fillRect(x,y,bw,bh); }
    ctx.fillStyle='rgba(221,231,239,.75)'; ctx.font='bold 9px "JetBrains Mono"'; ctx.textAlign='center';
    ctx.fillText(p.currentTot.toFixed(0)+'A',x+bw/2,y-3);
    ctx.fillStyle='rgba(122,143,158,.7)'; ctx.font='8px "JetBrains Mono"';
    ctx.fillText(p.label,x+bw/2,pad.top+ch+14);
  });
}

function buildHealth(peakApm,avgApm,hoverApm,escA,kv,vNom){
  var rows=[
    {lbl:'ESC Peak Load', pct:Math.min(100,Math.round(peakApm/escA*100)), note:'Peak '+peakApm.toFixed(0)+'A / '+escA+'A', ok:peakApm/escA<.80, warn:peakApm/escA<1.0},
    {lbl:'ESC Avg Load',  pct:Math.min(100,Math.round(avgApm/escA*100)),  note:'Avg '+avgApm.toFixed(1)+'A / '+escA+'A',   ok:avgApm/escA<.60,  warn:avgApm/escA<.85},
    {lbl:'KV×Voltage',   pct:Math.min(100,Math.round(Math.min(kv*vNom,1e5)/1e5*100)), note:'KV×Vnom='+(kv*vNom/1000).toFixed(0)+'k (safe<50k)', ok:kv*vNom<40000, warn:kv*vNom<65000},
    {lbl:'Hover Effic.',  pct:Math.min(100,Math.round(hoverApm/escA*100)), note:'Hover '+hoverApm.toFixed(1)+'A/motor = '+Math.round(hoverApm/escA*100)+'% ESC', ok:true, warn:hoverApm/escA>.45}
  ];
  var html='';
  rows.forEach(function(r){
    var col=r.ok?'#10c47a':r.warn?'#fbbf24':'#f87171';
    html+='<div class="hrow"><span class="h-lbl">'+r.lbl+'</span><div class="h-track"><div class="h-fill" style="width:'+r.pct+'%;background:'+col+'"></div></div><span class="h-pct" style="color:'+col+'">'+r.pct+'%</span></div>';
    html+='<div class="h-sub">'+r.note+'</div>';
  });
  document.getElementById('health-bars').innerHTML=html;
}

function buildThermal(tEsc,ambient,dT,pHeat){
  var col=tEsc<60?'#10c47a':tEsc<75?'#fbbf24':'#f87171';
  var pct=Math.min(100,Math.round(tEsc/120*100));
  var status=tEsc<60?'✅ เย็นดี':tEsc<75?'⚠️ ร้อนปานกลาง':'🔥 ร้อนมาก';
  var grad='linear-gradient(90deg,#10c47a,#fbbf24 60%,#f87171)';
  var html='<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">';
  html+='<span style="font-family:var(--font-d);font-size:1.3rem;font-weight:900;color:'+col+'">'+tEsc.toFixed(0)+'°C</span>';
  html+='<span style="font-size:.71rem;color:var(--muted)">'+status+'</span></div>';
  html+='<div class="thermal-bar-wrap"><div class="thermal-bar-fill" style="width:'+pct+'%;background:'+grad+'"></div></div>';
  html+='<div class="thermal-ticks"><span>0°</span><span>30°</span><span>60°</span><span>90°</span><span>120°</span></div>';
  html+='<div class="thermal-zones"><div class="tz"><div class="tz-dot" style="background:#10c47a"></div>0–60° OK</div><div class="tz"><div class="tz-dot" style="background:#fbbf24"></div>60–80° Warm</div><div class="tz"><div class="tz-dot" style="background:#f87171"></div>80°+ Danger</div></div>';
  html+='<div style="margin-top:11px;font-size:.71rem;color:var(--muted);line-height:1.6">Ambient: '+ambient+'°C &nbsp;|&nbsp; ΔT: +'+dT.toFixed(1)+'°C &nbsp;|&nbsp; P_heat: '+pHeat.toFixed(2)+'W/motor</div>';
  document.getElementById('thermal-section').innerHTML=html;
}

function buildProto(rec,cpu,bidirOk,cells){
  var cpuRank={f4:0,g4:1,f7:2,h7:3};
  var cn=cpuRank[cpu]||0, fRank={F4:0,F7:2,H7:3};
  var html='';
  PROTOS.forEach(function(p){
    var canRun=cn>=(fRank[p.f]||0);
    var isRec=p.name===rec&&p.name!=='DSHOT600_BD';
    var biOk=p.bidir&&bidirOk;
    var cls=isRec?'rec':canRun?'compat':'nocompat';
    html+='<div class="pb '+cls+'">';
    if(isRec) html+='<div class="pb-badge">★ แนะนำ</div>';
    html+='<div class="pb-name">'+p.name+'</div>';
    html+='<div class="pb-lat">'+p.us+'ms latency</div>';
    html+='<div class="pb-row '+(canRun?'tok':'tno')+'">'+(canRun?'✅':'❌')+' '+p.f+'+ FC</div>';
    html+='<div class="pb-row '+(biOk?'tok':p.bidir?'twarn':'tmuted')+'">'+(biOk?'✅':p.bidir?'⚠️':'—')+' BiDir</div>';
    html+='<div style="font-size:.62rem;color:var(--muted);margin-top:5px">'+p.note+'</div></div>';
  });
  document.getElementById('proto-grid').innerHTML=html;
  document.getElementById('proto-explain').innerHTML=
    '<strong style="color:var(--g)">'+rec+'</strong> '+(bidirOk
      ?'+ <strong style="color:var(--blue)">Bidirectional DShot</strong> → RPM Filter real-time แม่นมาก<br>ต้องการ ESC firmware: BLHeli_32, AM32 หรือ BLHeli_S + JESC'
      :'— F4 + '+cells+'S อาจมี BiDir unstable — monitor Blackbox ก่อน')+
    '<br><span style="font-size:.71rem;color:var(--muted2)">💡 ตรวจ ESC firmware ก่อนเปิด BiDir — firmware เก่าทำให้ motor desync</span>';
}

function buildSignalChain(rcMs,cpuUs,gyroUs,dshotUs,escUs,motorMs,totalMs,rating,cpu,bidirOk){
  var nodes=[
    {icon:'🎮',name:'RC LINK',   lat:rcMs.toFixed(1)+'ms',  sub:'ELRS/Crossfire',    pct:rcMs/totalMs,              col:'#58a6ff'},
    {icon:'🧭',name:'GYRO',      lat:gyroUs.toFixed(0)+'µs',sub:'ICM42688/MPU',       pct:(gyroUs/1000)/totalMs,     col:'#a78bfa'},
    {icon:'🔧',name:cpu.toUpperCase()+' FC',lat:cpuUs.toFixed(0)+'µs',sub:'PID loop',pct:(cpuUs/1000)/totalMs,      col:'#10c47a'},
    {icon:'⚡',name:'DSHOT',     lat:dshotUs.toFixed(0)+'µs',sub:bidirOk?'BiDir ON':'BiDir OFF',pct:(dshotUs/1000)/totalMs,col:'#f1b65a'},
    {icon:'🔌',name:'ESC',       lat:escUs.toFixed(0)+'µs', sub:'processing',         pct:(escUs/1000)/totalMs,      col:'#fbbf24'},
    {icon:'🌀',name:'MOTOR',     lat:motorMs.toFixed(1)+'ms',sub:'mechanical',         pct:motorMs/totalMs,           col:'#f87171'}
  ];
  var html='';
  nodes.forEach(function(n,i){
    var barW=Math.round(n.pct*100);
    html+='<div class="sc-node"><span class="sc-icon">'+n.icon+'</span><span class="sc-name">'+n.name+'</span>';
    html+='<span class="sc-lat" style="color:'+n.col+'">'+n.lat+'</span>';
    html+='<span class="sc-sublat">'+n.sub+'</span>';
    html+='<div class="sc-bar" style="background:'+n.col+';opacity:.6;width:'+barW+'%"></div></div>';
    if(i<nodes.length-1) html+='<div class="sc-arrow"><div class="sc-arrow-line"></div></div>';
  });
  document.getElementById('signal-chain').innerHTML=html;
  var ratingTxt=rating==='ok'?'✅ Snappy — latency ดีมาก (<5ms)':rating==='warn'?'⚠️ Acceptable (5–9ms)':'❌ Laggy — ตรวจ RC link และ DShot';
  document.getElementById('sc-label').textContent=ratingTxt;
  document.getElementById('sc-num').textContent=totalMs.toFixed(2)+'ms';
  document.getElementById('sc-total').className='sc-total-box '+rating;
}

function buildCap(cells,vMax,peakAtot){
  var capV=cells<=4?35:cells<=6?50:63;
  var capMin=Math.max(330,330*cells), capRec=Math.max(1000,470*cells), capHP=Math.max(2200,1000*cells);
  var html='<div class="cb"><div class="cb-lbl">MINIMUM</div><div class="cb-val">'+capMin+'µF / '+capV+'V+</div><div class="cb-note">ขั้นต่ำ ยังมี noise บ้าง</div></div>';
  html+='<div class="cb rec"><div class="cb-lbl">แนะนำ ★</div><div class="cb-val">'+capRec+'µF / '+capV+'V+</div><div class="cb-note">ป้องกัน spike ได้ดี วางใกล้ XT60</div></div>';
  html+='<div class="cb"><div class="cb-lbl">High Performance</div><div class="cb-val">'+capHP+'µF / '+capV+'V+</div><div class="cb-note">Racing/6S+ ลด ripple สูงสุด</div></div>';
  document.getElementById('cap-grid').innerHTML=html;
  document.getElementById('cap-note').textContent=
    'วาง capacitor ใกล้ XT60/ESC power input | Voltage rating > '+vMax.toFixed(1)+'V | Low-ESR: Panasonic FM/FC, Nichicon UHE | อย่าวางที่สายยาว — inductance ลด effectiveness';
}

function buildAlerts(kv,cells,escA,recEscA,escVolt,peakApm,avgApm,bidirOk,cpu,poles,vMax,tEsc){
  var al=[];
  if(cells>escVolt)
    al.push({lvl:'bad',icon:'🔥',t:'ESC Voltage ไม่รองรับ — อันตราย!',b:'ESC Max '+escVolt+'S แต่ใช้ '+cells+'S ('+vMax.toFixed(1)+'V) — ห้ามบิน! ESC จะระเบิด เปลี่ยน ESC ที่รองรับ '+cells+'S ก่อน'});
  else if(cells===escVolt)
    al.push({lvl:'warn',icon:'⚡',t:'ESC Voltage ชนพิกัด',b:'ESC Max '+escVolt+'S / แบต '+cells+'S ('+vMax.toFixed(1)+'V) — spike อาจเกินพิกัด ใส่ low-ESR cap คุณภาพดีเสมอ'});
  else
    al.push({lvl:'ok',icon:'✅',t:'Voltage Safety OK',b:'ESC Max '+escVolt+'S รองรับ '+cells+'S ได้ดี มี headroom เพียงพอ'});
  if(peakApm>escA)
    al.push({lvl:'bad',icon:'❌',t:'ESC Current ไม่เพียงพอ',b:'Peak '+peakApm.toFixed(0)+'A/motor > ESC '+escA+'A — MOSFET จะพัง แนะนำ ESC ≥'+recEscA+'A'});
  else if(peakApm>escA*0.85)
    al.push({lvl:'warn',icon:'⚠️',t:'ESC Current ค่อนข้างตึง',b:'Peak '+peakApm.toFixed(0)+'A = '+Math.round(peakApm/escA*100)+'% — ใช้ได้แต่ ESC จะร้อน ต้องการ airflow ดี'});
  else
    al.push({lvl:'ok',icon:'✅',t:'Current Headroom OK',b:'Peak '+peakApm.toFixed(0)+'A = '+Math.round(peakApm/escA*100)+'% ของ '+escA+'A — safety margin ดี'});
  if(tEsc>=80)
    al.push({lvl:'bad',icon:'🌡️',t:'ESC Temperature อันตราย ('+tEsc.toFixed(0)+'°C)',b:'คาดการณ์ร้อนเกิน 80°C — MOSFET เสื่อมเร็ว ต้องการ airflow เพิ่ม หรือ ESC rating สูงกว่านี้'});
  else if(tEsc>=65)
    al.push({lvl:'warn',icon:'🌡️',t:'ESC Temperature ร้อน ('+tEsc.toFixed(0)+'°C)',b:'Monitor temp หลังบิน pack แรก ถ้าจับแล้วร้อนมากต้องการ airflow เพิ่ม'});
  else
    al.push({lvl:'ok',icon:'❄️',t:'Thermal OK ('+tEsc.toFixed(0)+'°C)',b:'อุณหภูมิ ESC คาดการณ์อยู่ในช่วงปลอดภัย'});
  if((cells>=7&&kv>1500)||(cells>=6&&kv>2200))
    al.push({lvl:'bad',icon:'🔥',t:'KV อันตราย × '+cells+'S',b:'KV '+kv+'×'+cells+'S — motor/ESC เสียถาวร ชุมชน FPV แนะนำ KV ≤ '+(cells>=7?1200:1750)+' บน '+cells+'S'});
  else if(cells>=6&&kv>1750)
    al.push({lvl:'warn',icon:'⚠️',t:'KV สูงบน 6S',b:'KV '+kv+'×6S ต้องการ motor/ESC คุณภาพสูง ตรวจ temp หลัง pack แรกเสมอ'});
  else
    al.push({lvl:'ok',icon:'✅',t:'KV × Cells OK',b:'KV '+kv+' เหมาะกับ '+cells+'S อยู่ในช่วงปลอดภัย'});
  if(!bidirOk)
    al.push({lvl:'info',icon:'ℹ️',t:'BiDir DShot — ระวัง F4 + 6S+',b:'F4+'+cells+'S อาจมี BiDir unstable — monitor RPM graph ใน Blackbox ถ้า desync ปิด BiDir ใช้ Dynamic Notch แทน'});
  else
    al.push({lvl:'info',icon:'💡',t:'Bidirectional DShot พร้อมใช้',b:'เปิด dshot_bidir = ON + rpm_filter_harmonics = 3 เพื่อรับ RPM real-time จาก ESC — filter แม่นขึ้นมาก'});
  if(cells>=6)
    al.push({lvl:'warn',icon:'🔌',t:'6S+ — Capacitor สำคัญมาก',b:'6S voltage spike รุนแรงกว่า 4S ใส่ low-ESR cap ≥ 1000µF/50V ใกล้ XT60 ทุก arm'});
  if(poles!==14)
    al.push({lvl:'info',icon:'ℹ️',t:'Motor Poles: '+poles,b:'motor_poles ผิดทำให้ RPM Filter คำนวณ harmonic ผิด — filter ไม่ทำงาน ดู motor spec ให้แน่ใจ'});
  var html='';
  al.forEach(function(a){
    html+='<div class="alert '+a.lvl+'"><span class="a-icon">'+a.icon+'</span><div class="a-body"><strong>'+a.t+'</strong><p>'+a.b+'</p></div></div>';
  });
  document.getElementById('alerts').innerHTML=html;
}

function buildCLI(rec,bidirOk,poles,recEscA,cells,kv,propSz,style,escA,tEsc,cpu){
  var sl={freestyle:'Freestyle',racing:'Racing',longrange:'Long Range',cinematic:'Cinematic'}[style]||style;
  var lines=[
    {t:'cm',v:'# ═══════════════════════════════════════════'},
    {t:'cm',v:'# OBIXConfig Doctor v5.0 — ESC Setup Export'},
    {t:'cm',v:'# KV='+kv+' | '+cells+'S | Prop='+propSz+'" | '+sl},
    {t:'cm',v:'# ESC: '+escA+'A (rec ≥'+recEscA+'A) | FC: '+cpu.toUpperCase()+' | Thermal: '+tEsc.toFixed(0)+'°C est.'},
    {t:'cm',v:'# BiDir: '+(bidirOk?'ON ✓':'OFF — F4+'+cells+'S unstable')},
    {t:'cm',v:'# ═══════════════════════════════════════════'},
    {t:'br'},
    {t:'cm',v:'# ── Motor Protocol ─────────────────────────'},
    {t:'set',k:'motor_pwm_protocol',       v:rec},
    {t:'set',k:'dshot_bidir',              v:bidirOk?'ON':'OFF'},
    {t:'cm', v:'# BiDir ON = ESC ส่ง RPM real-time → RPM filter แม่น'},
    {t:'br'},
    {t:'cm',v:'# ── Motor Config ───────────────────────────'},
    {t:'set',k:'motor_poles',              v:String(poles)},
    {t:'cm', v:'# 14=2207/2306 standard | 12=micro | 22=large LR'},
    {t:'set',k:'dshot_idle_value',         v:'550'},
    {t:'cm', v:'# idle: 400=smooth 550=default 700=aggressive'},
    {t:'br'},
    {t:'cm',v:'# ── RPM Filter ─────────────────────────────'},
    {t:'set',k:'rpm_filter_harmonics',     v:'3'},
    {t:'set',k:'rpm_filter_min_hz',        v:'100'},
    {t:'cm', v:'# ต้องการ BiDir DShot + ESC firmware รองรับ'},
    {t:'br'},
    {t:'cm',v:'# ── Voltage Protection ─────────────────────'},
    {t:'set',k:'vbat_sag_compensation',    v:'100'},
    {t:'set',k:'vbat_warning_cell_voltage',v:'350'},
    {t:'set',k:'vbat_critical_cell_voltage',v:'330'},
    {t:'br'},
    {t:'cm',v:'# ── Dynamic Notch (backup if BiDir off) ────'},
    {t:'set',k:'dyn_notch_count',          v:'4'},
    {t:'set',k:'dyn_notch_min_hz',         v:'100'},
    {t:'set',k:'dyn_notch_max_hz',         v:'600'},
    {t:'br'},
    {t:'cm',v:'# ── Save ───────────────────────────────────'},
    {t:'save'}
  ];
  var html='';
  lines.forEach(function(l){
    if(l.t==='cm')   html+='<span class="cm">'+esc(l.v)+'</span>\n';
    else if(l.t==='br') html+='\n';
    else if(l.t==='save') html+='<span class="cg">save</span>\n';
    else html+='<span class="cg">set </span><span class="ck">'+esc(l.k)+'</span> = <span class="cv">'+esc(l.v)+'</span>\n';
  });
  document.getElementById('cli-out').innerHTML=html.trim();
}

function setGauge(gid,vid,nid,val,unit,note,st){
  var g=document.getElementById(gid); g.className='gauge '+st;
  document.getElementById(vid).innerHTML=val+'<span class="g-unit">'+unit+'</span>';
  document.getElementById(nid).textContent=note;
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function copyCLI(){ navigator.clipboard.writeText(document.getElementById('cli-out').textContent).then(function(){toast('คัดลอก CLI แล้ว ✓');}); }
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.style.opacity='1'; clearTimeout(t._t); t._t=setTimeout(function(){t.style.opacity='0';},2200); }

/* Init */
(function(){ liveCheck(); })();
