// static/js/vtx.js — Batch D: extracted from templates/vtx.html inline <script>. No logic change.

// ══════════════════════════════════════════════════════
//  OBIXConfig Doctor — VTX Bands & Channels v3
//  Comprehensive: Spectrum, Planner, CLI, Education
// ══════════════════════════════════════════════════════

// ─── DATA ─────────────────────────────────────────────
const BANDS = [
  {
    name: "Raceband", key: "R", bfIndex: 5, color: "#10c47a",
    desc: "มาตรฐานการแข่งขัน — แนะนำที่สุด", tag: "⭐ แนะนำ", tagColor: "#10c47a",
    info: "ทุกช่องห่างกัน 37 MHz → บินได้ 8 คนพร้อมกัน",
    channels: [
      {ch:"R1",f:5658,note:"ปลอดภัยที่สุด — ไกล WiFi"},{ch:"R2",f:5695,note:"Race มาตรฐาน"},
      {ch:"R3",f:5732,note:"Race มาตรฐาน"},{ch:"R4",f:5769,note:"Race มาตรฐาน"},
      {ch:"R5",f:5806,note:"Race มาตรฐาน"},{ch:"R6",f:5843,note:"Race มาตรฐาน"},
      {ch:"R7",f:5880,note:"⚠️ ใกล้ WiFi Ch140"},{ch:"R8",f:5917,note:"สูงสุด Raceband"}
    ]
  },
  {
    name: "Band A", key: "A", bfIndex: 1, color: "#58a6ff",
    desc: "Boscam A — เรียง frequency จากมากไปน้อย", tag: "Classic", tagColor: "#58a6ff",
    info: "A1 เริ่มที่ 5865 ลงมา — สังเกต: เรียงกลับด้านกับช่อง",
    channels: [
      {ch:"A1",f:5865,note:"⚠️ WiFi overlap"},{ch:"A2",f:5845,note:"⚠️ WiFi overlap"},
      {ch:"A3",f:5825,note:"⚠️ WiFi overlap"},{ch:"A4",f:5805,note:"⚠️ WiFi borderline"},
      {ch:"A5",f:5785,note:"⚠️ WiFi overlap"},{ch:"A6",f:5765,note:"⚠️ WiFi overlap"},
      {ch:"A7",f:5745,note:"⚠️ WiFi overlap"},{ch:"A8",f:5725,note:"⚠️ WiFi edge"}
    ]
  },
  {
    name: "Band B", key: "B", bfIndex: 2, color: "#f1b65a",
    desc: "Boscam B — เรียง frequency จากน้อยไปมาก", tag: "Classic", tagColor: "#f1b65a",
    info: "B ห่างกัน 19 MHz — บินพร้อมกันได้น้อยกว่า Raceband",
    channels: [
      {ch:"B1",f:5733,note:"⚠️ WiFi overlap"},{ch:"B2",f:5752,note:"⚠️ WiFi overlap"},
      {ch:"B3",f:5771,note:"⚠️ WiFi overlap"},{ch:"B4",f:5790,note:"⚠️ WiFi overlap"},
      {ch:"B5",f:5809,note:"⚠️ WiFi borderline"},{ch:"B6",f:5828,note:"⚠️ WiFi overlap"},
      {ch:"B7",f:5847,note:"⚠️ WiFi overlap"},{ch:"B8",f:5866,note:"⚠️ WiFi overlap"}
    ]
  },
  {
    name: "Band E", key: "E", bfIndex: 3, color: "#c9a6ff",
    desc: "ImmersionRC E — E1–E4 อยู่ต่ำ, E5–E8 อยู่สูง", tag: "Mixed", tagColor: "#c9a6ff",
    info: "ระวัง: E5–E8 อยู่เหนือ WiFi band แต่หายาก VTX รองรับ",
    channels: [
      {ch:"E1",f:5705,note:"ค่อนข้างปลอดภัย"},{ch:"E2",f:5685,note:"ปลอดภัย"},
      {ch:"E3",f:5665,note:"ปลอดภัย"},{ch:"E4",f:5645,note:"ต่ำที่สุดของ E band"},
      {ch:"E5",f:5885,note:"เหนือ WiFi — rare VTX"},{ch:"E6",f:5905,note:"เหนือ WiFi"},
      {ch:"E7",f:5925,note:"เหนือ WiFi"},{ch:"E8",f:5945,note:"สูงสุด — rare VTX"}
    ]
  },
  {
    name: "Band F", key: "F", bfIndex: 4, color: "#f85149",
    desc: "Fatshark F — ทับ WiFi ทั้งหมด!", tag: "⚠️ WiFi!", tagColor: "#f85149",
    info: "F band อยู่ในช่วง 5740–5880 MHz ทับ WiFi 5.8G ทั้งหมด",
    channels: [
      {ch:"F1",f:5740,note:"⚠️ WiFi overlap"},{ch:"F2",f:5760,note:"⚠️ WiFi overlap"},
      {ch:"F3",f:5780,note:"⚠️ WiFi overlap"},{ch:"F4",f:5800,note:"⚠️ WiFi overlap"},
      {ch:"F5",f:5820,note:"⚠️ WiFi overlap"},{ch:"F6",f:5840,note:"⚠️ WiFi overlap"},
      {ch:"F7",f:5860,note:"⚠️ WiFi overlap"},{ch:"F8",f:5880,note:"⚠️ WiFi overlap"}
    ]
  },
  {
    name: "Band D", key: "D", bfIndex: 6, color: "#88d4ab",
    desc: "Low Band (5.3 GHz) — VTX ทั่วไปไม่รองรับ", tag: "Low 5.3G", tagColor: "#88d4ab",
    info: "5.3 GHz band ระยะไกลกว่า 5.8G แต่ VTX / Goggle ส่วนใหญ่ไม่รองรับ",
    channels: [
      {ch:"D1",f:5362,note:"5.3GHz — rare"},{ch:"D2",f:5399,note:"5.3GHz — rare"},
      {ch:"D3",f:5436,note:"5.3GHz — rare"},{ch:"D4",f:5473,note:"5.3GHz — rare"},
      {ch:"D5",f:5510,note:"5.3GHz — rare"},{ch:"D6",f:5547,note:"5.3GHz — rare"},
      {ch:"D7",f:5584,note:"5.3GHz — rare"},{ch:"D8",f:5621,note:"5.3GHz — rare"}
    ]
  }
];

const WIFI_ZONES = [
  {label:"WiFi 5.8G Ch36–48",minF:5180,maxF:5240},
  {label:"WiFi 5.8G Ch149–165 (ใช้บ่อย)",minF:5725,maxF:5875},
  {label:"WiFi 5.8G Ch100–140",minF:5500,maxF:5700}
];

const POWER_LEVELS = [
  {mw:25,  label:"Pitmode / Indoor", color:"#4a9e7a", heat:1, legal:"✅ ปลอดภัยที่สุด", use:"Indoor / ซ้อมใกล้ๆ / Pitmode"},
  {mw:100, label:"Practice",        color:"#10c47a", heat:2, legal:"✅ แนะนำ",          use:"ซ้อมบิน / สนามเล็ก / Micro"},
  {mw:200, label:"Standard",        color:"#58a6ff", heat:3, legal:"✅ ทั่วไป",         use:"Freestyle / Race / สนามใหญ่"},
  {mw:400, label:"High Power",      color:"#f1b65a", heat:4, legal:"⚠️ ระวัง",         use:"Long Range / obstacle course"},
  {mw:600, label:"Very High",       color:"#ff8844", heat:5, legal:"⚠️⚠️ ร้อนมาก",   use:"Long Range extreme — ต้อง heatsink"},
  {mw:800, label:"Extreme",         color:"#f85149", heat:5, legal:"⚠️⚠️",            use:"Long range สุด — ระวัง VTX พัง"},
  {mw:1000,label:"MAX 1W",          color:"#ff2244", heat:6, legal:"⚠️⚠️⚠️",         use:"ใช้ด้วยความระมัดระวังสูงสุด"}
];

const PILOT_COLORS = ["#f85149","#58a6ff","#10c47a","#f1b65a","#c9a6ff","#ff9966","#66ddcc","#ff66aa"];
const RACE_PRESETS = [
  {name:"4 Pilots (Raceband R1/R2/R3/R4)", pilots:[{n:"Pilot 1",ch:"R1"},{n:"Pilot 2",ch:"R2"},{n:"Pilot 3",ch:"R3"},{n:"Pilot 4",ch:"R4"}]},
  {name:"6 Pilots (R1/R2/R3/R4/R5/R6)",   pilots:[{n:"Pilot 1",ch:"R1"},{n:"Pilot 2",ch:"R2"},{n:"Pilot 3",ch:"R3"},{n:"Pilot 4",ch:"R4"},{n:"Pilot 5",ch:"R5"},{n:"Pilot 6",ch:"R6"}]},
  {name:"8 Pilots (Raceband R1–R8)",        pilots:BANDS[0].channels.map((c,i)=>({n:"Pilot "+(i+1),ch:c.ch}))},
  {name:"Mixed 4 Pilots (ห่างมาก)",         pilots:[{n:"Pilot 1",ch:"R1"},{n:"Pilot 2",ch:"E3"},{n:"Pilot 3",ch:"R5"},{n:"Pilot 4",ch:"B8"}]}
];

// Build lookup
const FREQ_MAP = {};
const ALL_CHANNELS_LIST = [];
BANDS.forEach(b => b.channels.forEach(c => {
  FREQ_MAP[c.ch] = {freq:c.f, band:b.name, bandKey:b.key, bfIndex:b.bfIndex, color:b.color, note:c.note};
  ALL_CHANNELS_LIST.push({...c, band:b.name, bandKey:b.key, bfIndex:b.bfIndex, color:b.color});
}));
const ALL_FREQS = ALL_CHANNELS_LIST.map(c=>c.f).sort((a,b)=>a-b);
const FREQ_MIN = Math.min(...ALL_FREQS) - 100;
const FREQ_MAX = Math.max(...ALL_FREQS) + 100;

// State
let selBand = null, selCh = null, selFreq = null;
let currentProto = 'smartaudio';
let pilots = [];
let hiddenBands = new Set();

// ─── UTIL ──────────────────────────────────────────────
function toastMsg(msg){ const t=document.getElementById('vtxToast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200); }
function freqToX(f){ return ((f-FREQ_MIN)/(FREQ_MAX-FREQ_MIN))*100; }
function isWifi(f){ return f>=5725 && f<=5875; }
function chDist(ch1,ch2){ const f1=FREQ_MAP[ch1]?.freq, f2=FREQ_MAP[ch2]?.freq; return f1&&f2?Math.abs(f1-f2):9999; }

// ─── TAB ───────────────────────────────────────────────
function switchTab(id,btn){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.main-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
}

// ─── SPECTRUM ─────────────────────────────────────────
function buildSpectrum(){
  const wrap = document.getElementById('spectrumWrap');
  const w = wrap.clientWidth || 600;

  // Axis
  const axis = document.getElementById('spectrumAxis');
  axis.innerHTML = '';
  [5350,5400,5500,5600,5658,5700,5800,5880,5950].forEach(f=>{
    const pct = freqToX(f);
    const lbl = document.createElement('span');
    lbl.className='spectrum-axis-lbl';
    lbl.style.cssText=`position:absolute;left:${pct}%;transform:translateX(-50%)`;
    lbl.textContent=f;
    axis.appendChild(lbl);
  });

  // WiFi Zones
  const wz = document.getElementById('wifiZones');
  wz.innerHTML='';
  WIFI_ZONES.forEach(zone=>{
    const lPct=freqToX(zone.minF), rPct=freqToX(zone.maxF);
    const el=document.createElement('div');
    el.className='wifi-zone';
    el.style.cssText=`left:${lPct}%;width:${rPct-lPct}%`;
    const lbl=document.createElement('div');
    lbl.className='wifi-zone-label';
    lbl.textContent=zone.label;
    el.appendChild(lbl);
    wz.appendChild(el);
  });

  // Band BG
  const bgs = document.getElementById('spectrumBands');
  bgs.innerHTML='';
  BANDS.forEach(band=>{
    const freqs=band.channels.map(c=>c.f);
    const lo=Math.min(...freqs)-15, hi=Math.max(...freqs)+15;
    const lPct=freqToX(lo), rPct=freqToX(hi);
    const el=document.createElement('div');
    el.className='spectrum-bg-band';
    el.style.cssText=`left:${lPct}%;width:${rPct-lPct}%;background:${band.color}`;
    bgs.appendChild(el);
  });

  // Dots + Labels
  const dotsWrap = document.getElementById('spectrumDots');
  dotsWrap.innerHTML='';
  const tooltip = document.getElementById('specTooltip');

  ALL_CHANNELS_LIST.forEach(c=>{
    const pct=freqToX(c.f);
    const dot=document.createElement('div');
    dot.className='spectrum-channel-dot';
    dot.id='spc-'+c.ch;
    dot.style.cssText=`left:${pct}%;background:${c.color}`;
    dot.title=c.ch+' '+c.f+' MHz';

    dot.addEventListener('mouseenter', function(e){
      const info = FREQ_MAP[c.ch];
      tooltip.style.left = pct+'%';
      tooltip.innerHTML = `<strong style="color:${c.color}">${c.ch}</strong> &nbsp;${c.f} MHz<br><span style="color:var(--muted);font-size:.65rem;">${info.band} · ${info.note}</span>`;
      tooltip.classList.add('show');
    });
    dot.addEventListener('mouseleave', ()=>tooltip.classList.remove('show'));
    dot.addEventListener('click', ()=>selectChannel(c.band, c.ch, c.f));
    dotsWrap.appendChild(dot);

    // Label for selected bands
    const lbl=document.createElement('div');
    lbl.className='spectrum-label';
    lbl.id='splbl-'+c.ch;
    lbl.style.cssText=`left:${pct}%;color:${c.color}`;
    lbl.textContent=c.ch;
    dotsWrap.appendChild(lbl);
  });

  // Legend
  const leg = document.getElementById('spectrumLegend');
  leg.innerHTML='';
  BANDS.forEach(band=>{
    const item=document.createElement('div');
    item.className='spec-leg-item active';
    item.id='leg-'+band.key;
    item.innerHTML=`<span class="spec-leg-dot" style="background:${band.color}"></span>${band.name}`;
    item.addEventListener('click', ()=>toggleBandVis(band.key, item));
    leg.appendChild(item);
  });
}

function toggleBandVis(key, el){
  if(hiddenBands.has(key)){
    hiddenBands.delete(key);
    el.classList.add('active');
  } else {
    hiddenBands.add(key);
    el.classList.remove('active');
  }
  const band = BANDS.find(b=>b.key===key);
  if(band) band.channels.forEach(c=>{
    const dot=document.getElementById('spc-'+c.ch);
    const lbl=document.getElementById('splbl-'+c.ch);
    const vis=hiddenBands.has(key)?'hidden':'visible';
    if(dot)dot.style.visibility=vis;
    if(lbl)lbl.style.visibility=vis;
  });
}

// ─── BAND MATRIX ──────────────────────────────────────
function buildMatrix(){
  const mat = document.getElementById('bandMatrix');
  mat.innerHTML = '';
  BANDS.forEach(band=>{
    const sec = document.createElement('div');
    sec.className = 'band-section';

    const hdr = document.createElement('div');
    hdr.className = 'band-row-header';
    hdr.innerHTML = `
      <span class="band-dot" style="background:${band.color}"></span>
      <span class="band-row-name" style="color:${band.color}">${band.name}</span>
      <span class="band-row-key">${band.key}1–${band.key}8 · BF band=${band.bfIndex}</span>
      <span class="band-info-pill" style="color:${band.tagColor};border-color:${band.tagColor}44;background:${band.tagColor}11">${band.tag}</span>
      <span class="band-row-desc">${band.info}</span>`;
    sec.appendChild(hdr);

    const grid = document.createElement('div');
    grid.className = 'ch-grid';

    band.channels.forEach((item,idx)=>{
      const cell = document.createElement('div');
      cell.className = 'ch-cell';
      cell.id = 'cell-'+item.ch;
      cell.dataset.band = band.name;
      cell.dataset.ch = item.ch;
      cell.dataset.freq = item.f;
      cell.style.setProperty('--cell-color', band.color);
      cell.style.borderTopColor = band.color+'88';

      const wifiOverlap = isWifi(item.f);
      cell.innerHTML = `
        <span class="ch-num">Ch ${idx+1}</span>
        <span class="ch-freq">${item.f}</span>
        <span class="ch-label">${item.ch}</span>
        ${wifiOverlap?'<span class="ch-wifi-warn" title="WiFi overlap">📶</span>':''}
        <span class="ch-conflict-dot"></span>`;
      cell.addEventListener('click', ()=>selectChannel(band.name, item.ch, item.f));
      grid.appendChild(cell);
    });
    sec.appendChild(grid);
    mat.appendChild(sec);
  });
}

// ─── SELECT CHANNEL ────────────────────────────────────
function selectChannel(bandName, ch, freq){
  selBand = bandName; selCh = ch; selFreq = freq;

  // Cell highlight
  document.querySelectorAll('.ch-cell').forEach(c=>{
    c.classList.remove('selected');
    c.style.boxShadow='';
  });
  const cell = document.getElementById('cell-'+ch);
  if(cell){
    cell.classList.add('selected');
  }

  // Spectrum dot
  document.querySelectorAll('.spectrum-channel-dot').forEach(d=>d.classList.remove('selected'));
  const spcDot = document.getElementById('spc-'+ch);
  if(spcDot) spcDot.classList.add('selected');

  // Spectrum line
  const line = document.getElementById('spectrumLine');
  const band = BANDS.find(b=>b.name===bandName);
  const bColor = band?band.color:'var(--green)';
  line.style.left = freqToX(freq)+'%';
  line.style.background = bColor;
  line.style.display='block';

  // Live display
  const liveFq = document.getElementById('liveFreq');
  liveFq.innerHTML = freq+' <sup>MHz</sup>';
  liveFq.style.color = bColor;
  document.getElementById('liveMeta').innerHTML =
    `<strong style="color:${bColor}">${bandName}</strong> &nbsp;·&nbsp; <strong>${ch}</strong> &nbsp;·&nbsp;
     BF <code style="font-family:var(--mono);font-size:.75rem;background:rgba(255,255,255,.06);padding:1px 5px;border-radius:4px;">vtx_band=${FREQ_MAP[ch].bfIndex}</code> &nbsp;
     <code style="font-family:var(--mono);font-size:.75rem;background:rgba(255,255,255,.06);padding:1px 5px;border-radius:4px;">vtx_channel=${ch.replace(/[A-Za-z]/g,'')}</code>
     ${isWifi(freq)?'&nbsp;<span style="color:var(--red);font-size:.75rem;">⚠️ WiFi overlap</span>':''}`;

  // Ref table
  document.querySelectorAll('#refTableBody tr').forEach(tr=>{
    tr.classList.toggle('hl', tr.dataset.ch===ch);
    if(tr.dataset.ch===ch) tr.scrollIntoView({behavior:'smooth',block:'nearest'});
  });

  updateAll();
}

// ─── CLEAR ─────────────────────────────────────────────
function clearSelection(){
  selBand=selCh=selFreq=null;
  document.querySelectorAll('.ch-cell').forEach(c=>c.classList.remove('selected'));
  document.querySelectorAll('.spectrum-channel-dot').forEach(d=>d.classList.remove('selected'));
  document.getElementById('spectrumLine').style.display='none';
  document.getElementById('liveFreq').innerHTML='— <sup>MHz</sup>';
  document.getElementById('liveFreq').style.color='var(--green)';
  document.getElementById('liveMeta').textContent='คลิกเลือก Band / Channel จากตารางด้านล่าง หรือจะลากดูบน Spectrum ก็ได้';
  document.getElementById('cliOut').innerHTML='<span class="cli-comment"># เลือก Band / Channel จากตารางด้านบนเพื่อสร้าง CLI command<br># แล้ว paste ใน Betaflight CLI Tab แล้วกด Enter</span>';
  document.getElementById('pwrWarn').classList.remove('show');
  document.getElementById('livePwr').textContent='—';
  document.getElementById('pwrBar').style.width='0%';
  document.querySelectorAll('#refTableBody tr').forEach(tr=>tr.classList.remove('hl'));
}

// ─── PROTO ─────────────────────────────────────────────
function setProto(p, btn){
  currentProto = p;
  document.querySelectorAll('.proto-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  updateAll();
}

// ─── UPDATE ALL ────────────────────────────────────────
function updateAll(){
  const pwr = parseInt(document.getElementById('pwrSelect').value);
  const pctBar = Math.min(100, Math.round((pwr/1000)*100));
  const pColor = pwr>=600?'#f85149':pwr>=400?'#f1b65a':'#10c47a';

  const livePwr = document.getElementById('livePwr');
  livePwr.textContent = pwr+' mW';
  livePwr.style.color = pColor;
  document.getElementById('pwrBar').style.width = pctBar+'%';
  document.getElementById('pwrBar').style.background = pColor;
  document.getElementById('pwrWarn').classList.toggle('show', pwr>=600);

  if(!selCh) return;

  const band = BANDS.find(b=>b.name===selBand);
  const bfIdx = band?band.bfIndex:5;
  const chNum = parseInt(selCh.replace(/[A-Za-z]/g,''));
  const bandKey = band?band.key:'R';

  let html='';
  if(currentProto==='smartaudio'){
    html=`<span class="cli-comment"># SmartAudio — ${selBand} ${selCh} @ ${selFreq} MHz · ${pwr} mW</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_band = ${bfIdx}</span>         <span class="cli-comment"># ${selBand} (A=1,B=2,E=3,F=4,R=5,D=6)</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_channel = ${chNum}</span>      <span class="cli-comment"># Ch ${chNum} = ${selFreq} MHz</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_power = ${getPwrIdx(pwr)}</span>          <span class="cli-comment"># power index ${getPwrIdx(pwr)} = ${pwr}mW</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_low_power_disarm = ON</span>  <span class="cli-comment"># ลดกำลังขณะ disarm ✅</span>\n`+
         `<span class="cli-cmd">save</span>`;
  } else if(currentProto==='tramp'){
    html=`<span class="cli-comment"># IRC Tramp — ${selBand} ${selCh} @ ${selFreq} MHz · ${pwr} mW</span>\n`+
         `<span class="cli-cmd">vtx</span> <span class="cli-freq">${selFreq}</span> <span class="cli-val">${pwr}</span>   <span class="cli-comment"># frequency direct + power</span>\n`+
         `<span class="cli-comment"># หรือผ่าน vtxtable:</span>\n`+
         `<span class="cli-cmd">vtxtable</span> <span class="cli-band">band</span> <span class="cli-val">${bfIdx}</span>     <span class="cli-comment"># band index</span>\n`+
         `<span class="cli-cmd">vtxtable</span> <span class="cli-band">channel</span> <span class="cli-val">${chNum}</span>`;
  } else if(currentProto==='msp'){
    html=`<span class="cli-comment"># MSP VTX — ${selBand} ${selCh} @ ${selFreq} MHz · ${pwr} mW</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_band = ${bfIdx}</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_channel = ${chNum}</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_power = ${getPwrIdx(pwr)}</span>\n`+
         `<span class="cli-cmd">save</span>`;
  } else {
    // vtxtable — show full config
    html=`<span class="cli-comment"># vtxTable — Betaflight 4.3+ · สั่งแล้ว save ทันที</span>\n`+
         `<span class="cli-comment"># กดปุ่ม "vtxTable (BF4.3+)" ด้านบน แล้วเลือก Standard Bands เพื่อดู full vtxtable</span>\n\n`+
         `<span class="cli-comment"># ตั้งเฉพาะ channel ที่เลือก:</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_band = ${bfIdx}</span>         <span class="cli-comment"># ${selBand}</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_channel = ${chNum}</span>      <span class="cli-comment"># ${selCh} = ${selFreq} MHz</span>\n`+
         `<span class="cli-cmd">set</span> <span class="cli-val">vtx_power = ${getPwrIdx(pwr)}</span>\n`+
         `<span class="cli-cmd">save</span>`;
  }
  document.getElementById('cliOut').innerHTML=html;
}

function getPwrIdx(mw){
  if(mw<=25)  return '1';
  if(mw<=100) return '2';
  if(mw<=200) return '3';
  if(mw<=400) return '4';
  if(mw<=600) return '5';
  return '6';
}

// ─── COPY ──────────────────────────────────────────────
function copyAllCLI(){
  const el=document.getElementById('cliOut');
  navigator.clipboard.writeText(el.innerText||el.textContent).then(()=>toastMsg('คัดลอก CLI เรียบร้อย ✓'));
}
function copyBox(btn){
  const box=btn.closest('.cli-box,.vtxtable-box');
  const txt=box?box.innerText||box.textContent:'';
  navigator.clipboard.writeText(txt).then(()=>toastMsg('คัดลอกแล้ว ✓'));
}

// ─── REF TABLE ─────────────────────────────────────────
function buildRefTable(){
  const tbody=document.getElementById('refTableBody');
  tbody.innerHTML='';
  BANDS.forEach(band=>{
    band.channels.forEach((item,idx)=>{
      const tr=document.createElement('tr');
      tr.dataset.ch=item.ch;
      tr.style.cursor='pointer';
      const wifi=isWifi(item.f);
      tr.innerHTML=`<td><span class="td-band" style="background:${band.color}22;color:${band.color};border:1px solid ${band.color}44;">${band.name}</span></td>
        <td style="font-family:var(--mono);font-weight:700;color:${band.color}">${item.ch}</td>
        <td style="font-size:.72rem;color:var(--muted);">${band.channels[idx].ch}</td>
        <td class="td-freq">${item.f} <span style="color:var(--muted);font-size:.72rem;">MHz</span></td>
        <td style="font-family:var(--mono);color:var(--muted);">${band.bfIndex}</td>
        <td class="td-wifi">${wifi?'⚠️ YES':''}</td>
        <td class="td-note">${item.note}</td>`;
      tr.addEventListener('click',()=>{
        selectChannel(band.name,item.ch,item.f);
        switchTab('picker', document.querySelector('[onclick*="picker"]'));
      });
      tbody.appendChild(tr);
    });
  });
}

function filterRefTable(){
  const val=document.getElementById('refBandFilter').value;
  document.querySelectorAll('#refTableBody tr').forEach(tr=>{
    const chBand=FREQ_MAP[tr.dataset.ch]?.band||'';
    tr.style.display=(!val||chBand===val)?'':'none';
  });
}

// ─── BF BAND INDEX ─────────────────────────────────────
function buildBFIndex(){
  const cont=document.getElementById('bfBandIndex');
  cont.innerHTML='';
  const grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;';

  const sorted=[...BANDS].sort((a,b)=>a.bfIndex-b.bfIndex);
  sorted.forEach(band=>{
    const card=document.createElement('div');
    card.style.cssText=`background:var(--bg-elevated);border:1px solid var(--border);border-left:3px solid ${band.color};border-radius:8px;padding:10px 14px;`;
    card.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="font-family:var(--mono);font-size:1.1rem;font-weight:700;color:${band.color};">${band.bfIndex}</span>
      <span style="font-size:.82rem;font-weight:700;color:var(--text);">${band.name}</span>
      <span style="font-family:var(--mono);font-size:.68rem;background:rgba(255,255,255,.06);padding:1px 6px;border-radius:4px;color:var(--muted);">[${band.key}]</span>
    </div>
    <div style="font-size:.72rem;color:var(--muted);">${band.channels.map(c=>c.f).join(' · ')} MHz</div>`;
    grid.appendChild(card);
  });
  cont.appendChild(grid);
}

// ─── VTXTABLE OUTPUT ───────────────────────────────────
function showVtxTable(type){
  const el=document.getElementById('vtxtableOutput');
  let lines=[];

  if(type==='standard'){
    lines.push('# vtxTable — Standard 6 Bands (Betaflight 4.3+)');
    lines.push('# paste ใน CLI tab แล้วกด Enter ทีละบรรทัด หรือ paste ทั้งหมดแล้ว Enter ครั้งเดียว');
    lines.push('');
    lines.push('vtxtable bands 6');
    lines.push('vtxtable channels 8');
    lines.push('');
    BANDS.forEach(b=>{
      const freqs=b.channels.map(c=>c.f).join(' ');
      lines.push(`vtxtable band ${b.bfIndex} ${b.name.replace(' ','_').toUpperCase()} ${b.key} FACTORY ${freqs}`);
    });
    lines.push('');
    lines.push('vtxtable powerlevels 5');
    lines.push('vtxtable powervalues 25 200 500 800 1000');
    lines.push('vtxtable powerlabels 25 200 500 800 1000');
    lines.push('');
    lines.push('# ตั้ง active channel:');
    lines.push('set vtx_band = 5          # Raceband');
    lines.push('set vtx_channel = 1       # R1 = 5658 MHz');
    lines.push('set vtx_power = 2         # 200mW');
    lines.push('set vtx_low_power_disarm = ON');
    lines.push('save');
  } else if(type==='raceonly'){
    lines.push('# vtxTable — Raceband Only (สะอาด ไม่สับสน)');
    lines.push('');
    lines.push('vtxtable bands 1');
    lines.push('vtxtable channels 8');
    lines.push('vtxtable band 1 RACEBAND R FACTORY 5658 5695 5732 5769 5806 5843 5880 5917');
    lines.push('');
    lines.push('vtxtable powerlevels 3');
    lines.push('vtxtable powervalues 25 200 600');
    lines.push('vtxtable powerlabels 25 200 600');
    lines.push('');
    lines.push('set vtx_band = 1');
    lines.push('set vtx_channel = 1       # R1 = 5658 MHz');
    lines.push('set vtx_power = 2         # 200mW');
    lines.push('set vtx_low_power_disarm = ON');
    lines.push('save');
  } else {
    lines.push('# vtxTable — 25mW Safe Indoor Setup');
    lines.push('');
    lines.push('vtxtable bands 2');
    lines.push('vtxtable channels 8');
    lines.push('vtxtable band 1 RACEBAND R FACTORY 5658 5695 5732 5769 5806 5843 5880 5917');
    lines.push('vtxtable band 5 BOSCAM_A A FACTORY 5865 5845 5825 5805 5785 5765 5745 5725');
    lines.push('');
    lines.push('vtxtable powerlevels 2');
    lines.push('vtxtable powervalues 25 100');
    lines.push('vtxtable powerlabels 25 100');
    lines.push('');
    lines.push('set vtx_band = 1');
    lines.push('set vtx_channel = 1');
    lines.push('set vtx_power = 1         # 25mW');
    lines.push('set vtx_low_power_disarm = ON');
    lines.push('save');
  }

  el.innerHTML=`<button type="button" class="cli-copy-btn" onclick="copyBox(this)" style="top:8px;right:8px;">Copy</button><span class="cli-comment">${lines.map(l=>l.startsWith('#')?`<span class="cli-comment">${l}</span>`:l.startsWith('set ')?`<span class="cli-cmd">set</span> <span class="cli-val">${l.slice(4)}</span>`:l.startsWith('vtxtable')?`<span class="cli-cmd">vtxtable</span> <span class="cli-val">${l.slice(9)}</span>`:l.startsWith('save')?`<span class="cli-cmd">${l}</span>`:l).join('\n')}</span>`;
}

// ─── POWER GUIDE ───────────────────────────────────────
function buildPowerGuide(){
  const cont=document.getElementById('powerGuideCards');
  cont.innerHTML='';
  const grid=document.createElement('div');
  grid.className='pwr-table-grid';

  POWER_LEVELS.forEach((p,i)=>{
    const card=document.createElement('div');
    card.className='pwr-card';
    card.style.borderTopColor=p.color;
    const heatW=Math.min(100,(p.heat/6)*100);
    const heatColor=p.heat<=2?'#10c47a':p.heat<=3?'#58a6ff':p.heat<=4?'#f1b65a':'#f85149';
    card.innerHTML=`<div class="pwr-card-mw" style="color:${p.color}">${p.mw}<span style="font-size:.6em;font-weight:400;color:var(--muted);">mW</span></div>
      <div class="pwr-card-label">${p.label}</div>
      <div class="pwr-card-temp">🌡️ ความร้อน</div>
      <div class="pwr-heat-bar"><div style="width:${heatW}%;background:${heatColor};height:3px;border-radius:2px;"></div></div>
      <div class="pwr-card-use" style="margin-top:7px;">${p.use}</div>
      <div class="pwr-legal-badge" style="color:${heatColor};border-color:${heatColor}44;background:${heatColor}11;">${p.legal}</div>`;
    grid.appendChild(card);
  });
  cont.appendChild(grid);
}

// ─── PROTOCOL COMPARE ──────────────────────────────────
function buildProtoCompare(){
  const cont=document.getElementById('protocolCompare');
  const protos=[
    {
      name:'SmartAudio', icon:'🟢', color:'var(--green)',
      pros:['รองรับ VTX ส่วนใหญ่','ควบคุมผ่าน OSD ได้ทันที','Betaflight รองรับดีที่สุด','ปรับ Power/Band/Channel จาก OSD'],
      cons:['ต้องเชื่อมต่อ UART ถูก pin','บาง VTX ต้องการ V1/V2.1 specific']
    },
    {
      name:'IRC Tramp', icon:'🔵', color:'var(--blue)',
      pros:['ใช้ frequency MHz ตรงๆ','ยืดหยุ่นสูง','บาง VTX ราคาถูกรองรับแค่ Tramp'],
      cons:['ไม่รองรับทุก VTX','Command syntax ต่างออกไป']
    },
    {
      name:'MSP VTX', icon:'🟡', color:'var(--gold)',
      pros:['built-in ใน AIO boards','ไม่ต้องต่อสาย extra','เหมาะกับ Micro/Whoop'],
      cons:['ส่วนใหญ่อยู่ใน AIO เท่านั้น','ปรับ power range จำกัด','ไม่รองรับ power สูง']
    }
  ];

  cont.innerHTML='';
  protos.forEach(p=>{
    const card=document.createElement('div');
    card.className='proto-card';
    card.innerHTML=`<div class="proto-card-title"><span>${p.icon}</span><span style="color:${p.color}">${p.name}</span></div>
      <div class="proto-card-body">
        ${p.pros.map(x=>`<div><span class="proto-tick">✓</span> ${x}</div>`).join('')}
        ${p.cons.map(x=>`<div style="margin-top:4px;"><span class="proto-cross">✗</span> ${x}</div>`).join('')}
      </div>`;
    cont.appendChild(card);
  });
}

// ─── POWER INDEX TABLE ─────────────────────────────────
function buildPowerIndexTable(){
  const cont=document.getElementById('powerIndexTable');
  const rows=[
    {idx:1,mw:25,note:'Pitmode / Indoor'},
    {idx:2,mw:200,note:'Standard'},
    {idx:3,mw:500,note:'High (ขึ้นอยู่กับ VTX)'},
    {idx:4,mw:800,note:'Very High'},
    {idx:5,mw:1000,note:'1W MAX (ระวัง)'},
  ];
  cont.innerHTML=`<table class="vtx-table"><thead><tr><th>vtx_power =</th><th>Power (mW)</th><th>หมายเหตุ</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td style="font-family:var(--mono);color:var(--green);font-weight:700;">${r.idx}</td><td style="font-family:var(--mono);">${r.mw} mW</td><td style="color:var(--muted);font-size:.75rem;">${r.note}</td></tr>`).join('')}</tbody></table>
    <div style="font-size:.73rem;color:var(--muted);margin-top:8px;line-height:1.6;">⚠️ index จริงขึ้นอยู่กับ vtxTable powervalues ที่ตั้งไว้ — ค่าด้านบนเป็นค่าเริ่มต้น default ของ Betaflight</div>`;
}

// ─── RACE PLANNER ──────────────────────────────────────
function buildPilotSelect(){
  const opts=['<option value="">— ไม่ระบุ —'];
  BANDS.forEach(band=>{
    band.channels.forEach(c=>{
      const wifi=isWifi(c.f)?'📶':'';
      opts.push(`<option value="${c.ch}">${c.ch} — ${c.f} MHz (${band.name}) ${wifi}</option>`);
    });
  });
  return opts.join('');
}

function renderPilots(){
  const list=document.getElementById('pilotList');
  list.innerHTML='';
  pilots.forEach((p,i)=>{
    const row=document.createElement('div');
    row.className='pilot-row';
    row.id='pilot-'+i;
    row.innerHTML=`<div class="pilot-num pilot-color-${i+1}" style="background:${PILOT_COLORS[i]||'#aaa'}">${i+1}</div>
      <input class="pilot-name-input" value="${p.name}" placeholder="ชื่อ Pilot ${i+1}" oninput="pilots[${i}].name=this.value">
      <select class="pilot-ch-select" onchange="pilots[${i}].ch=this.value;checkConflicts()">
        ${buildPilotSelect().replace(`value="${p.ch}"`,`value="${p.ch}" selected`)}
      </select>
      <button type="button" class="pilot-remove-btn" onclick="removePilot(${i})" title="ลบ">✕</button>`;
    list.appendChild(row);
  });
}

function addPilot(){
  if(pilots.length>=8){ toastMsg('สูงสุด 8 pilots'); return; }
  pilots.push({name:'Pilot '+(pilots.length+1), ch:''});
  renderPilots();
}

function removePilot(i){
  pilots.splice(i,1);
  pilots.forEach((p,j)=>{ if(p.name==='Pilot '+(j+2)) p.name='Pilot '+(j+1); });
  renderPilots();
  checkConflicts();
}

function checkConflicts(){
  const conflicts=[];
  const assigned=pilots.filter(p=>p.ch);

  for(let i=0;i<assigned.length;i++){
    for(let j=i+1;j<assigned.length;j++){
      const dist=chDist(assigned[i].ch,assigned[j].ch);
      if(dist<20 && dist>0){
        conflicts.push({p1:assigned[i],p2:assigned[j],dist});
      }
    }
  }

  const rep=document.getElementById('conflictReport');
  const ok=document.getElementById('okReport');

  // Mark rows
  pilots.forEach((_,i)=>{
    const row=document.getElementById('pilot-'+i);
    if(row){
      const hasConflict=conflicts.some(c=>c.p1===pilots[i]||c.p2===pilots[i]);
      row.classList.toggle('has-conflict',hasConflict);
    }
  });

  if(conflicts.length>0){
    rep.innerHTML='<strong>⚠️ พบ Conflict ดังนี้:</strong><br>'+
      conflicts.map(c=>`• <strong>${c.p1.name}</strong> (${c.p1.ch}=${FREQ_MAP[c.p1.ch]?.freq}MHz) กับ <strong>${c.p2.name}</strong> (${c.p2.ch}=${FREQ_MAP[c.p2.ch]?.freq}MHz) — ห่างกันแค่ <strong>${c.dist} MHz</strong> (ต้อง ≥20 MHz)`).join('<br>');
    rep.classList.add('show');
    ok.classList.remove('show');
  } else if(assigned.length>=2){
    const chList=assigned.map(p=>`${p.name}:${p.ch}(${FREQ_MAP[p.ch]?.freq}MHz)`).join(' · ');
    ok.innerHTML=`✅ ไม่มี Conflict! ทุก Channel ห่างกัน ≥20 MHz — บินได้พร้อมกันทันที<br><span style="font-size:.75rem;opacity:.8;">${chList}</span>`;
    ok.classList.add('show');
    rep.classList.remove('show');
  } else {
    rep.classList.remove('show');
    ok.classList.remove('show');
  }
}

function autoAssign(){
  if(pilots.length===0){ toastMsg('เพิ่ม pilot ก่อน'); return; }
  // Use Raceband R1–R8 first, then expand
  const raceChs=BANDS[0].channels.map(c=>c.ch);
  const allSorted=[...raceChs, ...ALL_CHANNELS_LIST.filter(c=>!raceChs.includes(c.ch)).map(c=>c.ch)];
  const used=[];
  let assigned=0;
  for(const ch of allSorted){
    if(assigned>=pilots.length) break;
    const ok=used.every(u=>chDist(u,ch)>=20);
    if(ok){ pilots[assigned].ch=ch; used.push(ch); assigned++; }
  }
  renderPilots();
  checkConflicts();
  toastMsg('Auto-Assign เสร็จแล้ว ✓');
}

function clearPilots(){
  pilots=[];
  renderPilots();
  document.getElementById('conflictReport').classList.remove('show');
  document.getElementById('okReport').classList.remove('show');
}

function buildRacePresets(){
  const cont=document.getElementById('racePresets');
  cont.innerHTML='';
  RACE_PRESETS.forEach(preset=>{
    const card=document.createElement('div');
    card.style.cssText='background:var(--bg-elevated);border:1px solid var(--border);border-radius:9px;padding:12px 14px;margin-bottom:10px;';
    const rows=preset.pilots.map((p,i)=>{
      const info=FREQ_MAP[p.ch];
      return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:3px 8px;font-size:.72rem;margin:3px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${PILOT_COLORS[i]};flex-shrink:0;"></span>
        <strong style="color:var(--text)">${p.n}:</strong> <span style="font-family:var(--mono);color:${info?info.color:'var(--green)'}">${p.ch}</span> <span style="color:var(--muted)">${info?info.freq+' MHz':''}</span>
      </span>`;
    }).join('');
    card.innerHTML=`<div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:8px;">${preset.name}</div>
      <div>${rows}</div>
      <button type="button" class="btn-sm btn-sm-green" style="margin-top:10px;" onclick='loadPreset(${JSON.stringify(preset.pilots)})'>โหลด Preset นี้</button>`;
    cont.appendChild(card);
  });
}

function loadPreset(pilotData){
  pilots=pilotData.map(p=>({name:p.n,ch:p.ch}));
  renderPilots();
  checkConflicts();
  switchTab('planner', document.querySelectorAll('.main-tab')[1]);
  toastMsg('โหลด Preset เรียบร้อย ✓');
}

// ─── EXPORT CSV ────────────────────────────────────────
function exportFreqCSV(){
  const rows=[['Band','Channel','Frequency_MHz','BF_Band_Index','WiFi_Overlap','Note']];
  BANDS.forEach(b=>b.channels.forEach(c=>{
    rows.push([b.name,c.ch,c.f,b.bfIndex,isWifi(c.f)?'YES':'NO',c.note.replace(/,/g,' ')]);
  }));
  const csv=rows.map(r=>r.join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='vtx_channels_obix.csv';
  a.click();
  toastMsg('Export CSV เสร็จแล้ว ✓');
}

// ─── INIT ──────────────────────────────────────────────
(function init(){
  buildSpectrum();
  buildMatrix();
  buildRefTable();
  buildBFIndex();
  buildPowerGuide();
  buildProtoCompare();
  buildPowerIndexTable();
  buildRacePresets();
  // Default 2 pilots for planner
  pilots=[{name:'Pilot 1',ch:''},{name:'Pilot 2',ch:''}];
  renderPilots();

  // Re-build spectrum on resize
  let _resizeT;
  window.addEventListener('resize', ()=>{
    clearTimeout(_resizeT);
    _resizeT=setTimeout(buildSpectrum, 200);
  });

  document.getElementById('pwrSelect').addEventListener('change', updateAll);
})();
