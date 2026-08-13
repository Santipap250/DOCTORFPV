// static/js/vtx-smartaudio.js — Batch D: extracted from templates/vtx_smartaudio.html inline <script>. No logic change.

const BANDS={
  Raceband:{key:'R',color:'#00e5ff',ch:[5658,5695,5732,5769,5806,5843,5880,5917],notes:['Pilot 1 std','Pilot 2','Pilot 3','Pilot 4','Pilot 5','Pilot 6','ใกล้ WiFi','Edge band']},
  Fatshark:{key:'F',color:'#00ff88',ch:[5740,5760,5780,5800,5820,5840,5860,5880],notes:['F1','F2','F3','F4 Center','F5','F6','F7','F8']},
  BoscamA:{key:'A',color:'#ffb700',ch:[5865,5845,5825,5805,5785,5765,5745,5725],notes:['A1','A2','A3','A4','A5','A6','A7','A8']},
  BoscamB:{key:'B',color:'#cc55ff',ch:[5733,5752,5771,5790,5809,5828,5847,5866],notes:['B1','B2','B3','B4','B5','B6','B7','B8']},
  BoscamE:{key:'E',color:'#ff8844',ch:[5705,5685,5665,5645,5885,5905,5925,5945],notes:['E1','E2','E3','E4','E5 ออกนอกช่วง','E6','E7','E8']},
};
const PWR=[{mw:25,dbm:14,note:'Indoor/Pit',pct:10},{mw:100,dbm:20,note:'Proximity',pct:25},{mw:200,dbm:23,note:'Indoor std',pct:38},{mw:400,dbm:26,note:'Freestyle std',pct:55},{mw:800,dbm:29,note:'Long range',pct:78},{mw:1000,dbm:30,note:'Max legal (many)',pct:88},{mw:2000,dbm:33,note:'⚠ ตรวจสอบกฎหมาย',pct:100}];
const COUNTRIES=[{flag:'🇹🇭',name:'Thailand',maxMw:100,note:'100mW · กสทช. (>100mW ต้องมีใบอนุญาต)'},{flag:'🇺🇸',name:'USA',maxMw:1000,note:'FCC Part15 · 1W EIRP'},{flag:'🇪🇺',name:'EU',maxMw:25,note:'25mW EIRP · CE required'},{flag:'🇯🇵',name:'Japan',maxMw:10,note:'10mW · 5.8GHz restricted'},{flag:'🇦🇺',name:'Australia',maxMw:200,note:'200mW EIRP · ACMA'},{flag:'🇬🇧',name:'UK',maxMw:25,note:'25mW · Ofcom regs'}];
let ST={band:'Raceband',ch:0,power:400,proto:'smartaudio',country:'Thailand'};
let pilots=[null,null,null,null];

function buildMatrix(){
  let html='';
  Object.entries(BANDS).forEach(([bn,bd])=>{
    html+=`<div class="band-label"><div class="band-dot" style="background:${bd.color}"></div>${bn} (${bd.key})</div><div class="ch-matrix">`;
    bd.ch.forEach((f,i)=>{
      const act=ST.band===bn&&ST.ch===i;
      const con=checkConflict(f,bn,i);
      html+=`<div class="ch-cell${act?' active':''}${con?' conflict':''}" onclick="selectCh('${bn}',${i},${f})"><span class="ch-num">${bd.key}${i+1}</span><span class="ch-freq">${f}</span></div>`;
    });
    html+='</div>';
  });
  document.getElementById('matrixBody').innerHTML=html;
}
function buildPower(){
  document.getElementById('pwrGrid').innerHTML=PWR.map(p=>`
    <button class="pwr-btn${ST.power===p.mw?' active':''}" onclick="selPwr(${p.mw},this)">
      <span class="pw-mw">${p.mw>=1000?(p.mw/1000)+'W':p.mw+'mW'}</span>
      <span class="pw-dbm">${p.dbm}dBm</span>
    </button>`).join('');
}
function buildCountries(){
  document.getElementById('countryGrid').innerHTML=COUNTRIES.map(c=>`
    <div class="country-card${ST.country===c.name?' active':''}" onclick="selCountry('${c.name}',this)">
      <div class="cc-flag">${c.flag}</div>
      <div class="cc-name">${c.name}</div>
      <div class="cc-limit">max ${c.maxMw}mW</div>
    </div>`).join('');
}
function buildPilots(){
  const bnames=Object.keys(BANDS);
  const cols=['#ff4455','#ffb700','#cc55ff','#00ff88'];
  document.getElementById('conflictPilots').innerHTML=pilots.map((pc,i)=>{
    let opts=['<option value="">— none —</option>'];
    bnames.forEach(bn=>{BANDS[bn].ch.forEach((f,ci)=>{opts.push(`<option value="${bn}|${ci}"${pc===`${bn}|${ci}`?' selected':''}>${BANDS[bn].key}${ci+1}: ${f}MHz</option>`);});});
    return `<div style="display:flex;align-items:center;gap:8px">
      <span style="font-family:var(--font-d);font-size:9px;font-weight:700;width:22px;text-align:center;color:${cols[i]}">P${i+1}</span>
      <select style="flex:1;background:var(--panel2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-family:var(--font-m);font-size:11px;padding:5px 8px;outline:none" onchange="setPilot(${i},this.value)">${opts.join('')}</select></div>`;
  }).join('');
  checkAllConflicts();
}
function selectCh(bn,ci,freq){ST.band=bn;ST.ch=ci;buildMatrix();updateDisplay();updateCLI();updateSpectrum();}
function selPwr(mw,btn){
  ST.power=mw;
  document.querySelectorAll('.pwr-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const p=PWR.find(x=>x.mw===mw);
  document.getElementById('pwrBar').style.width=p.pct+'%';
  document.getElementById('pwrBar').style.background=mw<=100?'var(--green)':mw<=400?'var(--amber)':mw<=800?'var(--orange)':'var(--red)';
  document.getElementById('pwrDisplay').textContent=mw>=1000?(mw/1000)+'W':mw+'mW';
  document.getElementById('pwrNote').textContent=p.note;
  document.getElementById('adPower').textContent=mw>=1000?(mw/1000)+'W':mw+'mW';
  updateCLI();checkCountryWarn();
}
function selCountry(name,el){
  ST.country=name;
  document.querySelectorAll('.country-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  checkCountryWarn();
}
function setProto(proto,btn){
  ST.proto=proto;
  document.querySelectorAll('.proto-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('protoDesc').innerHTML=proto==='smartaudio'
    ?'FC <span style="color:var(--cyan);font-family:var(--font-m)">UART TX</span> → VTX SA Pin<br>BF Ports: ตั้ง UART เป็น <span style="color:var(--cyan);font-family:var(--font-m)">IRC Tramp/SA</span><br>TX-only · ไม่ต้องการ RX pin'
    :'FC <span style="color:var(--amber);font-family:var(--font-m)">UART TX</span> → VTX Data Pin<br>BF Ports: ตั้ง UART เป็น <span style="color:var(--amber);font-family:var(--font-m)">IRC Tramp</span><br>บาง VTX ต้องการ bidirectional TX+RX';
  updateCLI();
}
function setPilot(i,val){pilots[i]=val||null;checkAllConflicts();buildMatrix();}
function updateDisplay(){
  const bd=BANDS[ST.band];const freq=bd.ch[ST.ch];
  document.getElementById('adBand').textContent=ST.band.toUpperCase();
  document.getElementById('adFreq').textContent=freq;
  document.getElementById('adCh').textContent=`${ST.band} · CH${ST.ch+1} (${bd.key}${ST.ch+1})`;
  document.getElementById('adPower').textContent=ST.power>=1000?(ST.power/1000)+'W':ST.power+'mW';
  document.getElementById('ii_band').textContent=ST.band;
  document.getElementById('ii_ch').textContent=`${bd.key}${ST.ch+1} (Ch${ST.ch+1})`;
  document.getElementById('ii_freq').textContent=freq+' MHz';
  document.getElementById('ii_pwr').textContent=ST.power>=1000?(ST.power/1000)+'W':ST.power+'mW';
  document.getElementById('ii_proto').textContent=ST.proto==='smartaudio'?'SmartAudio':'IRC Tramp';
  document.getElementById('ii_note').textContent=bd.notes[ST.ch]||'';
}
function updateSpectrum(){
  const canvas=document.getElementById('specCanvas');
  const W=canvas.offsetWidth,H=canvas.offsetHeight;
  if(!W)return;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);
  const FMIN=5580,FMAX=5960,FR=FMAX-FMIN;
  const fToX=f=>((f-FMIN)/FR)*W;
  Object.values(BANDS).forEach(b=>{
    b.ch.forEach(f=>{
      const x=fToX(f),bw=20*(W/FR);
      ctx.fillStyle=b.color+'28';ctx.fillRect(x-bw/2,0,bw,H);
    });
  });
  const af=BANDS[ST.band].ch[ST.ch];
  const ax=fToX(af);
  ctx.fillStyle='rgba(0,229,255,.22)';ctx.fillRect(ax-16,0,32,H);
  pilots.forEach((pc,i)=>{
    if(!pc)return;
    const[bn,ci]=pc.split('|');const f=BANDS[bn]?.ch[parseInt(ci)];if(!f)return;
    const px=fToX(f);const cols=['#ff4455','#ffb700','#cc55ff','#00ff88'];
    ctx.strokeStyle=cols[i];ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,H);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=cols[i];ctx.font='8px JetBrains Mono';ctx.fillText('P'+(i+1),px+3,H-4);
  });
  const pct=(af-FMIN)/FR*100;
  document.getElementById('specMarker').style.left=pct+'%';
  document.getElementById('specMhzLabel').style.left=pct+'%';
  document.getElementById('specMhzLabel').textContent=af+' MHz';
  document.getElementById('specLabel').textContent=`${ST.band} ${BANDS[ST.band].key}${ST.ch+1} · ${af} MHz`;
}
function checkConflict(freq,bn,ci){
  for(const pc of pilots){
    if(!pc)continue;
    const[pbn,pci]=pc.split('|');const pf=BANDS[pbn]?.ch[parseInt(pci)];
    if(pf&&pf!==freq&&Math.abs(pf-freq)<37)return true;
  }
  return false;
}
function checkAllConflicts(){
  const conflicts=[];
  for(let i=0;i<4;i++){
    if(!pilots[i])continue;
    const[bn1,ci1]=pilots[i].split('|');const f1=BANDS[bn1]?.ch[parseInt(ci1)];if(!f1)continue;
    for(let j=i+1;j<4;j++){
      if(!pilots[j])continue;
      const[bn2,ci2]=pilots[j].split('|');const f2=BANDS[bn2]?.ch[parseInt(ci2)];if(!f2)continue;
      if(Math.abs(f1-f2)<37)conflicts.push(`P${i+1}(${f1}MHz) ↔ P${j+1}(${f2}MHz) ห่างกัน ${Math.abs(f1-f2)}MHz`);
    }
  }
  const ca=document.getElementById('conflictAlert');
  ca.className='conflict-alert'+(conflicts.length?' show':'');
  if(conflicts.length)ca.innerHTML='🔴 <strong>Conflict Detected</strong><br>'+conflicts.map(c=>`<div>${c} — ต่ำกว่า 37MHz threshold</div>`).join('');
  document.getElementById('conflictSummary').textContent=conflicts.length?`${conflicts.length} conflict(s) — แนะนำ Raceband R1-R4 ห่างกัน ≥37MHz`:'ไม่พบ conflict ✅ (separation ≥37MHz ทุก pair)';
}
function checkCountryWarn(){
  const c=COUNTRIES.find(x=>x.name===ST.country);if(!c)return;
  const n=document.getElementById('countryNote');
  n.innerHTML=ST.power>c.maxMw
    ?`<span style="color:var(--red)">⚠ ${ST.power}mW เกินขีดสูงสุดของ ${c.name} (${c.maxMw}mW)</span><br><span style="color:#2a4060">${c.note}</span>`
    :`<span style="color:var(--green)">✅ ${ST.power}mW อยู่ในขีดจำกัดของ ${c.name}</span><br><span style="color:#2a4060">${c.note}</span>`;
}
function updateCLI(){
  const bd=BANDS[ST.band];const freq=bd.ch[ST.ch];
  const bIdx=Object.keys(BANDS).indexOf(ST.band)+1;
  const pIdx=PWR.findIndex(p=>p.mw===ST.power)+1;
  const box=document.getElementById('cliBox');const btn=document.getElementById('cliCopyBtn');
  box.innerHTML=`<div><span class="cc-cmt"># OBIX VTX Control — ${ST.proto==='smartaudio'?'SmartAudio':'IRC Tramp'}</span></div>
<div><span class="cc-cmt"># ${ST.band} ${bd.key}${ST.ch+1} · ${freq}MHz · ${ST.power}mW</span></div>
<div><span class="cc-cmt"># ───────────────────────────────</span></div><br>
<div><span class="cc-cmd">set </span><span class="cc-key">vtx_band</span><span class="cc-cmd"> = </span><span class="cc-val">${bIdx}</span><span class="cc-cmt">  # ${ST.band}</span></div>
<div><span class="cc-cmd">set </span><span class="cc-key">vtx_channel</span><span class="cc-cmd"> = </span><span class="cc-val">${ST.ch+1}</span><span class="cc-cmt">  # ${bd.key}${ST.ch+1} ${freq}MHz</span></div>
<div><span class="cc-cmd">set </span><span class="cc-key">vtx_power</span><span class="cc-cmd"> = </span><span class="cc-val">${pIdx}</span><span class="cc-cmt">  # ${ST.power}mW</span></div>
<div><span class="cc-cmd">set </span><span class="cc-key">vtx_low_power_disarm</span><span class="cc-cmd"> = </span><span class="cc-val">ON</span></div><br>
<div><span class="cc-cmt"># Ports tab: ตั้ง UART เป็น "${ST.proto==='smartaudio'?'SmartAudio':'IRC Tramp'}"</span></div><br>
<div><span class="cc-prot">save</span></div>`;
  box.appendChild(btn);
}
function copyCLI(){
  const text=document.getElementById('cliBox').innerText.replace(/COPY/g,'').trim();
  navigator.clipboard.writeText(text).then(()=>{
    const b=document.getElementById('cliCopyBtn');b.textContent='✅ OK';b.classList.add('ok');
    setTimeout(()=>{b.textContent='COPY';b.classList.remove('ok');},2000);
  });
}
buildMatrix();buildPower();buildCountries();buildPilots();
updateDisplay();updateCLI();
const ip=PWR.find(p=>p.mw===ST.power);
document.getElementById('pwrBar').style.width=ip.pct+'%';
document.getElementById('pwrBar').style.background='var(--amber)';
checkCountryWarn();
setTimeout(updateSpectrum,100);
window.addEventListener('resize',updateSpectrum);
