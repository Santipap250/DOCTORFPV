// static/js/loop-analyzer.js — Batch D: extracted from templates/loop_analyzer.html inline <script>. No logic change.

const FC_DATA = {
  f405:{name:'F405',mhz:168,baseUs:28,jitterUs:6},
  f7:  {name:'F7xx',mhz:216,baseUs:20,jitterUs:3},
  h7:  {name:'H743',mhz:480,baseUs:12,jitterUs:2},
  f411:{name:'F411',mhz:168,baseUs:35,jitterUs:8},
  g4:  {name:'G4',  mhz:170,baseUs:25,jitterUs:4},
};
const GYRO_DATA = {
  mpu6000:  {name:'MPU-6000',   readUs:15, noiseNote:'SPI native 8kHz'},
  mpu6500:  {name:'MPU-6500',   readUs:15, noiseNote:'Similar to 6000'},
  icm20689: {name:'ICM-20689',  readUs:14, noiseNote:'Lower noise'},
  icm42688: {name:'ICM-42688P', readUs:12, noiseNote:'Best in class'},
  bmi270:   {name:'BMI270',     readUs:20, noiseNote:'3.2kHz max SPI'},
};
const RC_DATA = {
  elrs250:  {name:'ELRS 250Hz', latMs:4.0, jitterMs:0.5},
  elrs500:  {name:'ELRS 500Hz', latMs:2.0, jitterMs:0.3},
  elrs1000: {name:'ELRS 1000Hz',latMs:1.0, jitterMs:0.2},
  crossfire:{name:'TBS Crossfire',latMs:3.5,jitterMs:0.5},
  ghst:     {name:'Ghost',      latMs:1.0, jitterMs:0.2},
  frsky_d16:{name:'FrSky D16',  latMs:9.0, jitterMs:1.5},
  sbus:     {name:'SBUS',       latMs:3.0, jitterMs:0.5},
};
const DSHOT_DATA = {
  '300':    {name:'DShot300',    frameUs:111, bidir:false},
  '600':    {name:'DShot600',    frameUs:55,  bidir:false},
  '1200':   {name:'DShot1200',   frameUs:27,  bidir:false},
  '300bidir':{name:'DShot300 BiDi',frameUs:161,bidir:true},
  '600bidir':{name:'DShot600 BiDi',frameUs:80, bidir:true},
};

function analyzeLoop() {
  const fcKey  = document.getElementById('fcChip').value;
  const gyroKey= document.getElementById('gyro').value;
  const pidHz  = parseInt(document.getElementById('pidRate').value);
  const rcKey  = document.getElementById('rcProto').value;
  const dsKey  = document.getElementById('dshot').value;
  const rpmOn  = document.getElementById('rpmFilter').checked;
  const agOn   = document.getElementById('antiGrav').checked;
  const bbOn   = document.getElementById('blackbox').checked;
  const gpsOn  = document.getElementById('gps').checked;

  const fc   = FC_DATA[fcKey];
  const gyro = GYRO_DATA[gyroKey];
  const rc   = RC_DATA[rcKey];
  const ds   = DSHOT_DATA[dsKey];
  const pidCycleUs = 1000000 / pidHz;

  const stages = [];
  stages.push({icon:'🎮',name:'RC Link ('+rc.name+')',desc:'transmitter → receiver',latUs:rc.latMs*1000,jitterUs:rc.jitterMs*1000,color:'var(--blue)',note:rcKey==='frsky_d16'?'SLOW — upgrade เป็น ELRS':''});
  stages.push({icon:'📥',name:'RC Decode (FC)',desc:'UART parse + protocol decode',latUs:rcKey.startsWith('elrs')?50:200,jitterUs:20,color:'var(--teal)',note:''});
  stages.push({icon:'🧭',name:'Gyro Read ('+gyro.name+')',desc:'SPI transaction + interrupt',latUs:gyro.readUs,jitterUs:5,color:'var(--green)',note:''});
  let filterUs=fc.baseUs;
  if(rpmOn) filterUs+=Math.round(fc.baseUs*0.6);
  if(agOn)  filterUs+=5;
  if(bbOn)  filterUs+=20;
  if(gpsOn) filterUs+=35;
  stages.push({icon:'🔧',name:'FC Processing (PID+Filter)',desc:`${fc.name} @${fc.mhz}MHz${rpmOn?' + RPM filter':''}${bbOn?' + BB':''}`,latUs:filterUs,jitterUs:fc.jitterUs,color:'var(--purple)',note:filterUs>pidCycleUs*0.7?'CPU OVERLOAD RISK':''});
  stages.push({icon:'⚡',name:'DShot TX ('+ds.name+')',desc:'Digital motor command frame',latUs:ds.frameUs,jitterUs:ds.bidir?15:5,color:'var(--gold)',note:ds.bidir?'+RPM telemetry':''});
  const escUs=ds.frameUs<60?75:ds.frameUs<120?100:130;
  stages.push({icon:'🔌',name:'ESC Processing',desc:'FET switching + PWM update',latUs:escUs,jitterUs:20,color:'var(--orange)',note:''});
  stages.push({icon:'🌀',name:'Motor Response',desc:'Electrical → mechanical (kτ)',latUs:3000,jitterUs:200,color:'var(--red)',note:'Dominant — motor physics'});

  const totalUs=stages.reduce((s,x)=>s+x.latUs,0);
  const totalMs=totalUs/1000;
  const maxLatUs=Math.max(...stages.map(x=>x.latUs));
  const bottleneck=stages.find(x=>x.latUs===maxLatUs);

  const fcActiveUs=filterUs+gyro.readUs+ds.frameUs;
  const cpuPct=Math.min(99,Math.round(fcActiveUs/pidCycleUs*100));
  const effRateHz=cpuPct>80?Math.round(pidHz*(1-(cpuPct-80)/100)):pidHz;
  const jitterTotal=Math.round(stages.reduce((s,x)=>s+x.jitterUs,0)/stages.length);

  const pipeEl=document.getElementById('pipeline');
  pipeEl.innerHTML='';
  stages.forEach((s,i)=>{
    const pct=Math.round(s.latUs/totalUs*100);
    const barW=Math.round(s.latUs/maxLatUs*100);
    const isBot=s.latUs===maxLatUs;
    const d=document.createElement('div');
    d.className='pipe-stage'+(isBot?' bottleneck':' good');
    d.innerHTML=`<div class="pipe-icon">${s.icon}</div><div style="flex:1"><div class="pipe-name">${s.name} ${s.note?`<span style="color:var(--red);font-size:.7rem;font-weight:700">${s.note}</span>`:''}</div><div class="pipe-desc">${s.desc}</div><div class="pipe-bar" style="width:${barW}%;background:${s.color};opacity:.75"></div></div><div class="pipe-latency" style="color:${s.color}">${s.latUs>=1000?(s.latUs/1000).toFixed(1)+'ms':s.latUs+'µs'} <span style="font-size:.62rem;color:var(--muted)">(${pct}%)</span></div>`;
    pipeEl.appendChild(d);
    if(i<stages.length-1){const a=document.createElement('div');a.className='pipe-arrow';a.textContent='↓';pipeEl.appendChild(a);}
  });

  const totColor=totalMs<5?'#10c47a':totalMs<10?'#2dd4bf':totalMs<15?'#f1b65a':'#f87171';
  const totGrade=totalMs<5?'⚡ SNAPPY — Pro level':totalMs<10?'✅ GOOD — Fun to fly':totalMs<15?'🟡 AVERAGE — Noticeable lag':'🔴 LAGGY — Consider upgrade';
  document.getElementById('totalVal').innerHTML=`<span style="color:${totColor}">${totalMs.toFixed(1)} ms</span>`;
  document.getElementById('totalGrade').innerHTML=`<span style="color:${totColor}">${totGrade}</span>`;
  document.getElementById('bottleneckName').textContent=bottleneck.name.split('(')[0].trim();
  document.getElementById('bottleneckVal').textContent=(bottleneck.latUs/1000).toFixed(1)+'ms ('+Math.round(bottleneck.latUs/totalUs*100)+'% of total)';

  const cpuClass=cpuPct>80?'status-bad':cpuPct>60?'status-warn':'status-ok';
  document.getElementById('cpuLoad').innerHTML=`<span class="${cpuClass}">${cpuPct}%</span>`;
  document.getElementById('jitter').innerHTML=`<span class="status-warn">±${jitterTotal}µs</span>`;
  const rateClass=effRateHz>=pidHz*0.9?'status-ok':'status-warn';
  document.getElementById('effRate').innerHTML=`<span class="${rateClass}">${effRateHz} Hz</span>`;

  const recs=[];
  if(rcKey==='frsky_d16') recs.push({icon:'📡',text:'<strong>FrSky D16 latency สูงมาก (9ms)</strong> — upgrade เป็น ELRS 500Hz จะลด latency ได้ ~7ms ทันที'});
  if(cpuPct>80)           recs.push({icon:'⚠️',text:`CPU load ${cpuPct}% — อาจเกิด PID loop drop เปลี่ยน FC เป็น F7/H7 หรือลด pidRate เป็น 4kHz`});
  if(rpmOn&&cpuPct>70)    recs.push({icon:'🔔',text:'RPM Filter กิน CPU สูง — ถ้า FC เป็น F4 แนะนำใช้ F7+ เพื่อ RPM filter ไม่กระทบ loop rate'});
  if(bbOn)                recs.push({icon:'📋',text:'Blackbox logging เพิ่ม latency ~20µs — ปิดใน race day เปิดเฉพาะตอน tune'});
  if(totalMs<6)           recs.push({icon:'✅',text:`Setup นี้ latency ต่ำมาก (${totalMs.toFixed(1)}ms) — ระดับ professional FPV racer`});
  if(!ds.bidir&&rpmOn)    recs.push({icon:'💡',text:'ใช้ DShot BiDi เพื่อ RPM telemetry ที่แม่นยำกว่า — ลด RPM filter window และ noise ได้'});
  document.getElementById('recList').innerHTML=recs.map(r=>`<div class="rec-item"><span class="rec-icon">${r.icon}</span><span class="rec-text">${r.text}</span></div>`).join('');

  const breakdown=stages.map(s=>{const bar='█'.repeat(Math.max(1,Math.round(s.latUs/maxLatUs*20)));return`\u001b[0m${(s.icon+' '+s.name).padEnd(30)} ${bar.padEnd(20)} ${s.latUs>=1000?(s.latUs/1000).toFixed(1)+'ms':s.latUs+'µs'}`;}).join('\n');
  const bkLines=stages.map(s=>{const bar='█'.repeat(Math.max(1,Math.round(s.latUs/maxLatUs*20)));return`<span class="mu">${(s.icon+' '+s.name).padEnd(32)}</span><span class="hi">${bar.padEnd(20,' ')}</span><span class="go">${s.latUs>=1000?(s.latUs/1000).toFixed(1)+'ms':s.latUs+'µs'}</span>`;}).join('\n');
  document.getElementById('physicsEq').innerHTML=bkLines+`\n<span class="mu">${'─'.repeat(55)}</span>\n<span class="mu">Total:${' '.repeat(26)}</span><span style="color:${totColor};font-size:.9rem;font-weight:700">${totalMs.toFixed(2)} ms</span>`;

  document.getElementById('resultPanel').style.display='block';
  document.getElementById('hintPanel').style.display='none';
}
