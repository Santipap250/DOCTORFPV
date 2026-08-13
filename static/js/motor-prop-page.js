// static/js/motor-prop-page.js — Batch D: extracted from templates/motor_prop.html inline <script>. No logic change.

/* ═══════════════════════════════════════════════
   MOTOR × PROP LAB v5.3 — Brain
   Physics tables mirror prop_logic.py exactly
═══════════════════════════════════════════════ */
'use strict';

// ── Physics tables (from prop_logic.py) ────────
const _GPW = {  // base g/W by pitch bucket × blades
  low:  {2:6.2, 3:5.4, 4:4.6},
  med:  {2:5.4, 3:4.7, 4:3.9},
  high: {2:4.6, 3:3.9, 4:3.2},
};
const _SIZE_EFF = {2.5:.70,3:.77,3.5:.82,4:.88,4.5:.94,5:1.0,5.5:1.03,6:1.06,6.5:1.07,7:1.08,7.5:1.09,8:1.11,10:1.14};
const _MAX_PWR  = {2.5:65,3:80,3.5:115,4:195,4.5:270,5:385,5.5:430,6:460,7:330,8:390,10:460};
const _W_PER_G  = {2.5:.38,3:.35,3.5:.24,4:.19,4.5:.17,5:.155,5.5:.165,6:.20,7:.108,8:.095,10:.085};
const _EFF_MAX  = {2.5:.64,3:.62,4:.60,5:.55,6:.52,7:.48,8:.44,10:.40};
const FLT_V     = 3.85;   // V/cell average flight
const LOAD_F    = 0.80;   // RPM load factor

function _interp(val, tbl) {
  const ks = Object.keys(tbl).map(Number).sort((a,b)=>a-b);
  if (val <= ks[0]) return tbl[ks[0]];
  if (val >= ks[ks.length-1]) return tbl[ks[ks.length-1]];
  for (let i=0;i<ks.length-1;i++) {
    if (val >= ks[i] && val <= ks[i+1]) {
      const r = (val-ks[i])/(ks[i+1]-ks[i]);
      return tbl[ks[i]] + r*(tbl[ks[i+1]]-tbl[ks[i]]);
    }
  }
  return tbl[ks[Math.floor(ks.length/2)]];
}
function _pitchBucket(p) { return p<3.5?'low':p<=4.5?'med':'high'; }
function _bladeClamp(b)   { return [2,3,4].includes(b)?b:3; }
function _cellsEff(c)     { return 1.0+(c-4)*0.015; }

// ── Motor Database (30+ motors, Thai community favourites) ──
const MOTOR_DB = [
  // Whoop / Nano
  {name:'Happymodel EX1103 6000KV', kv:[5500,7000], stator:'1103', cells:[1,2,3], sizes:[2,3], tags:['whoop','indoor'], best:'freestyle'},
  {name:'BetaFPV 1102 18000KV',     kv:[15000,20000],stator:'1102', cells:[1,2],   sizes:[1.5,2.5], tags:['whoop','1S'], best:'freestyle'},
  {name:'iFlight XING 1404 3800KV', kv:[3500,4200], stator:'1404', cells:[2,3],   sizes:[2.5,3.5], tags:['micro'], best:'freestyle'},
  // 3–4"
  {name:'Emax RS1306 4000KV',       kv:[3500,4500], stator:'1306', cells:[3],     sizes:[3,3.5],  tags:['micro'], best:'racing'},
  {name:'GEPRC GR2204.5 2550KV',    kv:[2300,2800], stator:'2204', cells:[4,5],   sizes:[3.5,4.5],tags:['cine','micro'], best:'cinematic'},
  {name:'T-Motor F30A 2300KV',      kv:[2100,2500], stator:'2306', cells:[4],     sizes:[4,5],    tags:['4inch'], best:'freestyle'},
  // 5" 4S
  {name:'T-Motor F40 Pro IV 2400KV',kv:[2200,2600], stator:'2306', cells:[4,5],   sizes:[4.5,5.5],tags:['5inch','popular'], best:'freestyle'},
  {name:'Diatone Mamba 2306 2450KV',kv:[2200,2700], stator:'2306', cells:[4,5,6], sizes:[4.5,5.5],tags:['5inch'], best:'freestyle'},
  {name:'iFlight XING2 2306 2450KV',kv:[2200,2700], stator:'2306', cells:[4,5],   sizes:[4.5,5.5],tags:['5inch'], best:'freestyle'},
  {name:'EMAX ECO II 2306 2400KV',  kv:[2200,2600], stator:'2306', cells:[4],     sizes:[4.5,5.5],tags:['5inch','budget'], best:'freestyle'},
  {name:'BrotherHobby Tornado T5 2306',kv:[2200,2700],stator:'2306',cells:[4,5],  sizes:[4.5,5.5],tags:['5inch'], best:'freestyle'},
  // 5" Racing
  {name:'Helixx 2207 2500KV',       kv:[2300,2700], stator:'2207', cells:[4,5],   sizes:[4.5,5.5],tags:['race','5inch'], best:'racing'},
  {name:'EMAX LS2207 2300KV',       kv:[2100,2500], stator:'2207', cells:[4],     sizes:[5,5.5],  tags:['race'], best:'racing'},
  {name:'RaceKraft 2207 2500KV',    kv:[2300,2700], stator:'2207', cells:[4,5],   sizes:[4.5,5.5],tags:['race'], best:'racing'},
  // 5" 6S
  {name:'T-Motor F40 Pro IV 1750KV',kv:[1500,2000], stator:'2306', cells:[6],     sizes:[5,5.5],  tags:['5inch','6S'], best:'freestyle'},
  {name:'GEPRC SPEEDX2 2306 1750KV',kv:[1500,1900], stator:'2306', cells:[6],     sizes:[5,5.5],  tags:['5inch','6S'], best:'freestyle'},
  {name:'iFlight XING2 2306 1755KV',kv:[1500,2000], stator:'2306', cells:[6],     sizes:[5,5.5],  tags:['6S'], best:'freestyle'},
  {name:'Nazgul Evoque 2306 1750KV',kv:[1550,1950], stator:'2306', cells:[6],     sizes:[5,5.5],  tags:['6S','popular'], best:'freestyle'},
  // 6" + LR
  {name:'T-Motor Air40 1950KV',     kv:[1700,2200], stator:'2408', cells:[4,5,6], sizes:[5.5,6.5],tags:['6inch'], best:'freestyle'},
  {name:'GEPRC GR2510 1380KV',      kv:[1200,1500], stator:'2510', cells:[6],     sizes:[6,7],    tags:['LR','6inch'], best:'longrange'},
  {name:'iFlight XING-E 2208 1800KV',kv:[1600,2000],stator:'2208', cells:[5,6],   sizes:[5.5,6.5],tags:['6inch'], best:'freestyle'},
  // 7" LR
  {name:'T-Motor Air 40 2408 1200KV',kv:[1000,1400],stator:'2408', cells:[4,5,6], sizes:[6,7.5],  tags:['LR','7inch'], best:'longrange'},
  {name:'iFlight XING-E 2810 900KV',kv:[750,1050],  stator:'2810', cells:[6,7,8], sizes:[7,10],   tags:['LR','7inch'], best:'longrange'},
  {name:'GEPRC GR2812 900KV',       kv:[750,1050],  stator:'2812', cells:[6,7],   sizes:[7,8],    tags:['LR'], best:'longrange'},
  // 10" Ultra LR
  {name:'T-Motor Air 2814 770KV',   kv:[650,900],   stator:'2814', cells:[6,7,8], sizes:[8,10],   tags:['LR','10inch'], best:'longrange'},
  {name:'SunnySky X2814 900KV',     kv:[750,1050],  stator:'2814', cells:[6,7,8], sizes:[8,10],   tags:['LR','ultraLR'], best:'longrange'},
  {name:'GARTT ML5010 380KV',       kv:[300,450],   stator:'5010', cells:[6,8],   sizes:[10,15],  tags:['heavylift'], best:'longrange'},
  // Special
  {name:'Speedybee Master 2306 2450KV',kv:[2200,2700],stator:'2306',cells:[4,5],  sizes:[4.5,5.5],tags:['popular','🇹🇭'], best:'freestyle'},
  {name:'Foxeer Predator 2306 1750KV', kv:[1500,2000],stator:'2306',cells:[6],    sizes:[5,5.5],  tags:['6S','🇹🇭'], best:'freestyle'},
];

// ── Presets ─────────────────────────────────────
const PRESETS = {
  whoop:     {size:2.5, weight:80,   cells:3, mah:300,  prop:2.5, pitch:2.0, blades:2, kv:5000,  style:'freestyle', motors:4},
  micro3:    {size:3.0, weight:140,  cells:3, mah:450,  prop:3.0, pitch:2.5, blades:2, kv:3500,  style:'freestyle', motors:4},
  cine:      {size:3.5, weight:320,  cells:4, mah:850,  prop:3.5, pitch:2.5, blades:2, kv:2500,  style:'cinematic', motors:4},
  mini:      {size:4.0, weight:420,  cells:4, mah:1100, prop:4.0, pitch:3.5, blades:3, kv:2500,  style:'freestyle', motors:4},
  freestyle5:{size:5.0, weight:750,  cells:4, mah:1500, prop:5.0, pitch:4.3, blades:3, kv:2306,  style:'freestyle', motors:4},
  heavy6:    {size:6.0, weight:1050, cells:6, mah:2200, prop:6.0, pitch:4.5, blades:3, kv:1750,  style:'freestyle', motors:4},
  lr7:       {size:7.0, weight:1100, cells:6, mah:3000, prop:7.0, pitch:3.5, blades:2, kv:1200,  style:'longrange', motors:4},
  lr10:      {size:10., weight:1400, cells:6, mah:5000, prop:10., pitch:3.5, blades:2, kv:800,   style:'longrange', motors:4},
};

// ── State ───────────────────────────────────────
let S = {size:5,weight:750,cells:4,mah:1500,prop:5,pitch:4.3,blades:3,kv:2306,style:'freestyle',motors:4};
let lastR = null;

// ── Calculate ───────────────────────────────────
function calculate() {
  const {size,weight,cells,mah,prop,pitch,blades,kv,style,motors} = S;
  const packV = cells * 3.7;
  const motorsN = Math.max(1, motors);

  // ── KV recommendation ───────────────────────
  const kvMap = prop<=3.5?{3:4000,4:3500,5:3000,6:2600,7:2200,8:2000}
              : prop<=4.5?{3:3500,4:3000,5:2600,6:2200,7:2000,8:1800}
              : prop<=5.5?{3:3000,4:2500,5:2000,6:1700,7:1500,8:1200}
              : prop<=7  ?{3:2600,4:2200,5:1800,6:1500,7:1200,8:1000}
              :            {3:2200,4:1800,5:1500,6:1200,7:1000,8:900};
  const availC = Object.keys(kvMap).map(Number);
  const nearC  = availC.reduce((a,b)=>Math.abs(b-cells)<Math.abs(a-cells)?b:a);
  const baseKv = kvMap[cells]||kvMap[nearC];
  const kvLo = Math.round(baseKv*.75), kvHi = Math.round(baseKv*1.25);
  const stator  = prop<=3.5?'1104–1407':prop<=4.5?'1407–1806':prop<=5.5?'1806–2207':prop<=7?'2207–2408':'2506–2814';
  const statorS = prop<=3.5?'micro/whoop':prop<=4.5?'3–4" light':prop<=5.5?'5" standard':prop<=7?'6" heavy':'7–10"';

  // ── Prop physics (prop_logic.py exact) ──────
  const sScale  = _interp(prop, _SIZE_EFF);
  const vFactor = _cellsEff(cells);
  const bClamp  = _bladeClamp(blades);
  const baseGpW = (_GPW[_pitchBucket(pitch)]||_GPW.med)[bClamp] || 4.7;
  const gPerW   = +(baseGpW * sScale * vFactor).toFixed(2);
  const maxPwr  = Math.min(_interp(prop, _MAX_PWR) * (1 + (cells-4)/4*0.22), 1000);
  const effMax  = _interp(prop, _EFF_MAX);
  const maxThrMotor = Math.round(gPerW * effMax * maxPwr);

  // ── RPM & Tip Speed ─────────────────────────
  const vFlight = cells * FLT_V;
  const rpmEst  = kv > 0 ? kv * vFlight * LOAD_F : _interp(prop, {2.5:28000,3:24000,4:17000,5:13000,6:11000,7:9500,8:8000,10:6500}) * 0.80;
  const propM   = prop * 0.0254;
  const tipSpeed = Math.round(Math.PI * propM * rpmEst / 60);
  const pitchSpeedKmh = +((rpmEst * pitch * 0.0254 / 60) * 3.6).toFixed(1);
  const propCm   = prop * 2.54;
  const diskArea = Math.PI * (propCm/2)**2;
  const diskLoad = +((gPerW * 100 / Math.max(1,diskArea))).toFixed(2);
  const pitchRatio = +(pitch/prop).toFixed(2);

  // ── TWR ────────────────────────────────────
  const totalThrust = maxThrMotor * motorsN;
  const twr = +(Math.min(totalThrust / Math.max(1,weight), 12)).toFixed(2);
  const hoverThrPct = twr > 0 ? Math.round(Math.sqrt(1/twr)*100) : 50;

  // ── Power ──────────────────────────────────
  const wPerG = _interp(prop, _W_PER_G);
  const hoverW = wPerG * weight;
  const sfMap  = {freestyle:1.55,racing:2.00,longrange:1.05,cinematic:1.25};
  const sf     = sfMap[style] || 1.55;
  const avgW   = hoverW * sf;
  const peakW  = maxPwr * motorsN;

  // ── Flight time ────────────────────────────
  const battWh   = (mah/1000) * packV;
  const usableWh = battWh * 0.85;
  const ftMin    = avgW > 0.1 ? Math.max(0, Math.round((usableWh/avgW)*60*10)/10) : 0;
  const ftAggr   = avgW > 0.1 ? Math.max(0, Math.round((usableWh/(avgW*1.35))*60*10)/10) : 0;

  // ── Current ────────────────────────────────
  const hoverCurr = packV > 0 ? +(hoverW/packV).toFixed(1) : 0;
  const peakCurr  = packV > 0 ? +(peakW/packV).toFixed(1)  : 0;

  // ── C-Rate ─────────────────────────────────
  const cBurst = mah > 0 ? +(peakCurr / (mah/1000)).toFixed(1) : null;
  const cCont  = mah > 0 ? +((hoverCurr/(mah/1000))*sf).toFixed(1) : null;

  // ── ESC sizing ─────────────────────────────
  const escRaw = (peakW / motorsN) / packV * 1.5;
  const escMin = _interp(prop, {2.5:15,3:20,3.5:20,4:25,5:30,6:35,7:40,10:45});
  const escSizes = [15,20,25,30,35,40,45,50,60,70,80,100];
  const escA = escSizes.find(s=>s>=Math.max(escRaw,escMin)) || 100;

  // ── Load / Noise scores ─────────────────────
  const pitchScore = pitch>=4.5?3:pitch>=3.5?2:1;
  const bladeScore = blades>=4?3:blades===3?2:1;
  const motorLoad  = pitchScore + bladeScore;
  const noiseScore = motorLoad;
  const heatIdx    = Math.min(100, Math.round((motorLoad/6)*100 * (cells>=6?1.15:1)));

  // ── Warnings ───────────────────────────────
  const warns = [];
  if(tipSpeed > 290) warns.push({lvl:'danger', msg:`Tip speed ${tipSpeed} m/s เกิน 290 m/s — compressibility loss รุนแรง ลด KV หรือ prop เล็กลง`});
  else if(tipSpeed > 265) warns.push({lvl:'warn', msg:`Tip speed ${tipSpeed} m/s ใกล้ขีดจำกัด (265 m/s) — efficiency ลดที่ full throttle`});
  if(pitchRatio > 0.9) warns.push({lvl:'warn', msg:`Pitch/Size ratio ${pitchRatio} สูง — motor โหลดหนัก เสียงดัง`});
  if(cells>=7 && baseKv>1600) warns.push({lvl:'danger', msg:`KV ${baseKv} สูงบน ${cells}S — อาจทำให้ motor ร้อน`});
  if(twr < 1.3) warns.push({lvl:'warn', msg:'TWR ต่ำมาก — โดรนยกตัวลำบาก แนะนำ motor KV สูงขึ้น'});
  if(ftMin < 3) warns.push({lvl:'warn', msg:'เวลาบินสั้น — ลองเพิ่ม mAh หรือลด AUW'});
  if(cBurst && cBurst > 80) warns.push({lvl:'danger', msg:`C-Rate burst ${cBurst}C สูงมาก — ต้องการแบต HV quality`});

  // ── Tips ───────────────────────────────────
  const tips = [];
  const styleTips = {
    freestyle:'🌀 Freestyle sweet spot: 3 ใบ pitch 4.0–4.5, TWR 1.8–2.5',
    racing:   '🏁 Racing: TWR 2.0–2.5+ pitch 4.5+ grip สูง ตอบสนองไว',
    longrange:'🛸 Long Range: 2 ใบ pitch 3.0–3.5 ประหยัดไฟ noise ต่ำ',
    cinematic:'🎥 Cinematic: TWR 1.5–1.8 3 ใบ pitch 3.0–3.8 smooth'
  };
  if(styleTips[style]) tips.push({type:'b',msg:styleTips[style]});
  tips.push({type:'g',msg:`แนะนำ KV: ${kvLo}–${kvHi} · Stator: ${stator}`});
  tips.push({type:'a',msg:`Hover: ~${hoverThrPct}% stick · ESC: ≥${escA}A · C-Rate: ${cBurst||'?'}C burst`});
  if(kv > 0) {
    const rpmK = Math.round(rpmEst/1000*10)/10;
    tips.push({type:'p',msg:`RPM ≈ ${rpmK}k · Tip speed = ${tipSpeed} m/s · Pitch speed = ${pitchSpeedKmh} km/h`});
  }
  tips.push({type:'m',msg:`${cells}S ${mah}mAh → ~${ftMin} นาที (${style})`});

  // ── Motor DB match ──────────────────────────
  const matched = MOTOR_DB.filter(m => {
    const kvOk   = m.kv[0] <= kvHi*1.1 && m.kv[1] >= kvLo*0.9;
    const sizeOk = size >= m.sizes[0]-0.5 && size <= m.sizes[1]+0.5;
    const cellOk = m.cells.includes(cells) || m.cells.some(c=>Math.abs(c-cells)<=1);
    return kvOk && sizeOk && cellOk;
  }).sort((a,b)=>{
    const aOk = a.best===style?1:0, bOk = b.best===style?1:0;
    return bOk-aOk;
  }).slice(0,6);

  // ── CLI ────────────────────────────────────
  const throttleLimit = style==='freestyle'?90:style==='racing'?100:70;
  const protocol      = cells>=6?'DSHOT600':'DSHOT300';
  const gyroHz        = cells>=6?120:100;
  const rpmMinHz      = Math.max(80, Math.round(rpmEst*0.15));

  return {
    kvRange:`${kvLo}–${kvHi}`, kvSub:`${cells}S ${style}`,
    stator, statorS,
    hoverCurr, peakCurr, currentSub:`${Math.round(hoverW)}W hover`,
    totalThrust, thrustSub:`${Math.round(maxThrMotor)}g/motor`,
    ftMin, ftAggr, flightSub:`${mah}mAh · ${cells}S`,
    hoverW:Math.round(hoverW), powerSub:`${Math.round(hoverW/motorsN)}W/motor`,
    hoverThrPct, escA, cBurst, cCont,
    rpmEst: Math.round(rpmEst),
    tipSpeed, pitchSpeedKmh, diskLoad, pitchRatio, gPerW,
    motorLoad: Math.round((motorLoad/6)*100),
    noiseScore: Math.round((noiseScore/6)*100),
    heatIdx,
    effPct: Math.min(100,Math.round(gPerW/7*100)),
    loadLbl: motorLoad<3?'เบา':motorLoad<5?'ปานกลาง':'หนัก',
    noiseLbl: noiseScore<3?'เงียบ':noiseScore<5?'ปานกลาง':'ดัง',
    heatLbl:  heatIdx<40?'เย็น':heatIdx<65?'อุ่น':heatIdx<80?'ร้อน':'ร้อนมาก',
    effLbl:   gPerW>=5.5?'สูงมาก':gPerW>=4.5?'ดี':gPerW>=3.5?'กลาง':'ต่ำ',
    twr, hoverThrPct,
    warns, tips, matched,
    throttleLimit, protocol, gyroHz, rpmMinHz,
    cells, prop, blades, pitch, style,
  };
}

// ── Render ──────────────────────────────────────
function render() {
  const R = calculate();
  lastR = R;

  // Hero metrics
  flash('m_kv',      R.kvRange);    setEl('m_kv_sub',     R.kvSub);
  setEl('m_stator',  R.stator);     setEl('m_stator_sub', R.statorS);
  flash('m_current', R.hoverCurr+'A'); setEl('m_current_sub', R.currentSub);
  flash('m_thrust',  R.totalThrust.toLocaleString()+'g'); setEl('m_thrust_sub', R.thrustSub);
  flash('m_flight',  R.ftMin+'min'); setEl('m_flight_sub', R.flightSub);
  flash('m_power',   R.hoverW+'W'); setEl('m_power_sub', R.powerSub);
  // Physics row
  setColorEl('m_hover_thr', R.hoverThrPct+'%', R.hoverThrPct>65?'red':R.hoverThrPct>50?'amber':'green');
  setColorEl('m_esc',   R.escA+'A',             R.escA>=60?'amber':'green');
  setColorEl('m_cburst',R.cBurst?(R.cBurst+'C'):'—', R.cBurst&&R.cBurst>80?'red':R.cBurst&&R.cBurst>50?'amber':'cyan');
  setColorEl('m_rpm',  (Math.round(R.rpmEst/100)/10)+'k RPM', 'purple');

  // TWR arc
  const ARC_LEN = 232, maxTWR = 6.0;
  const twrPct  = Math.min(1, R.twr / maxTWR);
  const arc = document.getElementById('twrArc');
  if(arc){
    arc.style.strokeDashoffset = ARC_LEN * (1 - twrPct);
    const col = R.twr<1.3?'var(--red)':R.twr<1.7?'var(--amber)':R.twr<=3.5?'var(--green)':'var(--cyan)';
    arc.style.stroke = col;
    arc.style.filter = `drop-shadow(0 0 8px ${col})`;
  }
  setEl('twrValTxt', R.twr.toFixed(2));
  const [bText, bColor, bBg, verdict] = R.twr<1.3
    ? ['UNDER',  'var(--red)',   'rgba(239,68,68,.08)',   '⚠️ ไม่เพียงพอ — TWR ต่ำเกินไป มอเตอร์ หรือ KV สูงขึ้น']
    : R.twr<1.7
    ? ['CRUISER','var(--amber)', 'rgba(245,158,11,.08)',  '✓ LR / Cine — hover ใช้ throttle สูง headroom น้อย']
    : R.twr<=3.5
    ? ['OPTIMAL','var(--green)', 'rgba(0,255,136,.08)',   '✅ Sweet Spot — hover ~'+R.hoverThrPct+'% throttle เหลือ headroom ดี']
    : R.twr<=6.0
    ? ['PUNCHY', 'var(--cyan)',  'rgba(0,212,255,.08)',   '⚡ Over-powered — กำลังสูง เหมาะ racing/aggressive freestyle']
    : ['BEAST',  'var(--purple)','rgba(139,92,246,.08)',  '🚀 MONSTER — TWR สูงมาก ระวัง oscillation ต้องการ PID ที่ดี'];
  const badge = document.getElementById('twrBadge');
  if(badge){ badge.textContent=bText; badge.style.color=bColor; badge.style.borderColor=bColor+'44'; badge.style.background=bBg; }
  const zone = document.getElementById('twrZone');
  if(zone){ zone.textContent=bText; zone.style.color=bColor; zone.style.borderColor=bColor+'44'; zone.style.background=bBg; }
  setEl('twrVerdict', verdict);

  // Prop diagram
  drawProp(S.blades, S.prop);
  setEl('pitchSpeed', R.pitchSpeedKmh+' km/h');
  setEl('gPerW',      R.gPerW+' g/W');
  const prEl = document.getElementById('pitchRatio');
  if(prEl){ prEl.textContent=R.pitchRatio; prEl.style.color=R.pitchRatio>0.9?'var(--red)':R.pitchRatio>0.75?'var(--amber)':'var(--green)'; }

  // Tip speed gauge
  const tipVal = document.getElementById('tipSpeedVal');
  if(tipVal) tipVal.textContent = S.kv>0 ? R.tipSpeed+' m/s' : '— m/s';
  const needle = document.getElementById('tipNeedle');
  if(needle && S.kv>0) { needle.style.left = Math.min(95,Math.max(2, R.tipSpeed/350*100))+'%'; }
  const tipSt = document.getElementById('tipStatus');
  if(tipSt && S.kv>0){
    if(R.tipSpeed>290){
      tipSt.textContent='⛔ DANGER: '+R.tipSpeed+'m/s — เกิน 290 m/s compressibility loss รุนแรง ลด KV หรือ prop เล็กลง';
      tipSt.style.cssText='color:var(--red);border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.06);';
    } else if(R.tipSpeed>265){
      tipSt.textContent='⚠️ WARNING: '+R.tipSpeed+'m/s — ใกล้ขีดจำกัด (265m/s) efficiency drop ที่ full throttle';
      tipSt.style.cssText='color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.06);';
    } else {
      tipSt.textContent='✅ SAFE: '+R.tipSpeed+'m/s — ปลอดภัย subsonic (&lt;265 m/s)';
      tipSt.style.cssText='color:var(--green);border-color:rgba(0,255,136,.25);background:rgba(0,255,136,.05);';
    }
  } else if(tipSt && S.kv===0){
    tipSt.textContent='กรอก Motor KV เพื่อคำนวณ Tip Speed';
    tipSt.style.cssText='color:var(--muted);border-color:var(--border);background:rgba(255,255,255,.02);';
  }

  // Bar gauges
  setBar('bg_load',  R.motorLoad,  R.loadLbl+` (${R.motorLoad}%)`);
  setBar('bg_noise', R.noiseScore, R.noiseLbl+` (${R.noiseScore}%)`);
  setBar('bg_heat',  R.heatIdx,    R.heatLbl+` (${R.heatIdx}%)`);
  setBar('bg_eff',   R.effPct,     R.effLbl+` (${R.gPerW} g/W)`);

  // Flight timeline
  const total = Math.max(1, R.ftMin);
  const cpct = 55, ppct = 30, rpct = 15;
  setEl('ft_cruise_lbl',  Math.round(total*cpct/100)+'m');
  setEl('ft_punch_lbl',   Math.round(total*ppct/100)+'m');
  setEl('ft_reserve_lbl', Math.round(total*rpct/100)+'m');
  setEl('ft_total',       R.ftMin+' min');
  setEl('ft_aggr_lbl',    'Aggressive: '+(R.ftAggr||'—')+' min');
  document.getElementById('ft_cruise').style.width  = cpct+'%';
  document.getElementById('ft_punch').style.width   = ppct+'%';
  document.getElementById('ft_reserve').style.width = rpct+'%';

  // Warnings
  document.getElementById('warningArea').innerHTML = R.warns.map(w=>`
    <div class="warn-item" style="color:${w.lvl==='danger'?'var(--red)':'var(--amber)'};border-color:${w.lvl==='danger'?'rgba(239,68,68,.25)':'rgba(245,158,11,.2)'};background:${w.lvl==='danger'?'rgba(239,68,68,.05)':'rgba(245,158,11,.04)'};">
      <span>${w.lvl==='danger'?'⛔':'⚠️'}</span>
      <span>${w.msg}</span>
    </div>`).join('');

  // CLI
  renderCLI(R);

  // Motor DB + Tips
  renderMotors(R.matched);
  renderTips(R.tips);

  // Compare A
  setEl('compareA', `${S.prop}" · ${S.blades}ใบ · P${S.pitch} · ${S.style} → ${R.gPerW}g/W · ${R.pitchSpeedKmh}km/h · tip ${R.tipSpeed}m/s`);
}

function renderCLI(R) {
  const K = (v)=>`<span class="cli-k">${v}</span>`;
  const V = (v)=>`<span class="cli-v">${v}</span>`;
  const C = (v)=>`<span class="cli-c">${v}</span>`;
  setHTML('cli_c1', C(`# OBIX Motor×Prop — ${R.style.toUpperCase()} ${R.cells}S · Prop ${R.prop}" ${R.blades}ใบ P${R.pitch}`));
  setHTML('cli_c2', C(`# KV: ${R.kvRange} · Stator: ${R.stator} · ESC: ≥${R.escA}A`));
  setHTML('cli_c3', C(`# TWR: ${R.twr} · Hover: ${R.hoverThrPct}% · Flight: ~${R.ftMin}min`));
  setHTML('cli_c4', C(`# Tip: ${R.tipSpeed}m/s · g/W: ${R.gPerW} · RPM: ~${Math.round(R.rpmEst/100)/10}k`));
  setHTML('cli_1',  `${K('set throttle_limit_percent')} = ${V(R.throttleLimit)}`);
  setHTML('cli_2',  `${K('set throttle_limit_type')}    = ${V('SCALE')}`);
  setHTML('cli_3',  `${K('set motor_pwm_protocol')}     = ${V(R.protocol)}`);
  setHTML('cli_4',  `${K('set dshot_bidir')}            = ${V('ON')}`);
  setHTML('cli_5',  `${K('set motor_poles')}            = ${V(14)}`);
  setHTML('cli_6',  `${K('set rpm_filter_min_hz')}      = ${V(R.rpmMinHz)}`);
}

function renderMotors(motors) {
  const list = document.getElementById('motorList');
  const cnt  = document.getElementById('motorCount');
  if(!list) return;
  cnt.textContent = motors.length ? `${motors.length} ตรงสเปค` : '';
  if(!motors.length){
    list.innerHTML = '<p style="color:var(--muted);font-size:11px;padding:6px 0;">ลองปรับ prop size หรือ cells</p>';
    return;
  }
  const tagCol = {popular:'var(--green)',race:'var(--red)',LR:'var(--purple)',whoop:'var(--cyan)','🇹🇭':'var(--amber)'};
  list.innerHTML = motors.map(m=>`
    <div class="mdb-card" onclick="this.classList.toggle('sel')">
      <div class="mdb-name">${m.name}</div>
      <div class="mdb-specs">KV ${m.kv[0].toLocaleString()}–${m.kv[1].toLocaleString()} · ${m.stator}<br>${m.cells.join('/')}S · ${m.sizes[0]}–${m.sizes[1]}"</div>
      <div>${m.tags.map(t=>`<span class="mdb-tag" style="color:${tagCol[t]||'var(--green)'};border-color:${tagCol[t]||'var(--green)'}33;">${t}</span>`).join('')}</div>
    </div>`).join('');
}

function renderTips(tips) {
  const area = document.getElementById('tipsArea');
  if(!area) return;
  const tc = {g:'var(--green)',b:'var(--cyan)',a:'var(--amber)',r:'var(--red)',p:'var(--purple)',m:'var(--muted)'};
  area.innerHTML = tips.map(t=>`
    <div class="tip-item" style="border-color:${tc[t.type]||'var(--muted)'};color:var(--text2);">${t.msg}</div>`).join('');
}

// ── Prop diagram ────────────────────────────────
function drawProp(blades, size) {
  const g = document.getElementById('propBlades'); if(!g) return;
  g.innerHTML=''; const cx=50,cy=50;
  const r = Math.min(42, 10+size*3.4);
  for(let i=0;i<blades;i++){
    const ang=(i*360/blades-90)*Math.PI/180;
    const x2=cx+r*Math.cos(ang), y2=cy+r*Math.sin(ang);
    const nx=-Math.sin(ang)*8, ny=Math.cos(ang)*8;
    const w=blades<=2?10:blades===3?8:6;
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',`M${cx},${cy} C${cx+nx*.5},${cy+ny*.5} ${x2-nx*.3+nx*w/r},${y2-ny*.3+ny*w/r} ${x2},${y2} C${x2-nx},${y2-ny} ${cx-nx*.3},${cy-ny*.3} ${cx},${cy}Z`);
    p.setAttribute('fill',`rgba(0,255,136,${0.12+i*0.02})`);
    p.setAttribute('stroke','rgba(0,255,136,.5)'); p.setAttribute('stroke-width','1');
    p.style.filter='drop-shadow(0 0 3px rgba(0,255,136,.3))';
    g.appendChild(p);
  }
  g.style.transformOrigin='50px 50px';
  g.style.animation='propSpin 3s linear infinite';
}

// ── Compare ─────────────────────────────────────
function runCompare() {
  if(!lastR) return;
  const cp = parseFloat(document.getElementById('cmp_prop').value);
  const cb = parseInt(document.getElementById('cmp_blades').value);
  const cpt= parseFloat(document.getElementById('cmp_pitch').value);
  const cst= document.getElementById('cmp_style').value;
  const bk = {size:S.size,weight:S.weight,cells:S.cells,mah:S.mah,prop:S.prop,pitch:S.pitch,blades:S.blades,kv:S.kv,style:S.style,motors:S.motors};
  S.prop=cp; S.blades=cb; S.pitch=cpt; S.style=cst;
  const Rb = calculate();
  Object.assign(S, bk);
  const Ra = lastR;
  const diff=(a,b,inv=false)=>{
    const d=b-a, good=inv?(d<0):(d>0);
    return `<span style="color:${Math.abs(d)<0.01?'var(--muted)':good?'var(--green)':'var(--red)'};">${d>0?'+':''}${Number.isInteger(a)?Math.round(d):d.toFixed(2)}</span>`;
  };
  document.getElementById('compareResult').innerHTML=`
    <div style="font-family:var(--fm);font-size:9px;letter-spacing:.1em;color:var(--amber);margin-bottom:8px;">Δ A → B (${cp}" ${cb}ใบ P${cpt} ${cst})</div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:11px;">
      <span style="color:var(--muted);">g/W</span><span>${Ra.gPerW} → <b style="color:${Rb.gPerW>Ra.gPerW?'var(--green)':'var(--red)'}">${Rb.gPerW}</b> ${diff(Ra.gPerW,Rb.gPerW)}</span>
      <span style="color:var(--muted);">Tip Speed</span><span>${Ra.tipSpeed} → <b style="color:${Rb.tipSpeed<Ra.tipSpeed?'var(--green)':'var(--amber)'}">${Rb.tipSpeed}</b> m/s ${diff(Ra.tipSpeed,Rb.tipSpeed,true)}</span>
      <span style="color:var(--muted);">Motor Load</span><span>${Ra.motorLoad}% → ${Rb.motorLoad}% ${diff(Ra.motorLoad,Rb.motorLoad,true)}</span>
      <span style="color:var(--muted);">Noise</span><span>${Ra.noiseScore}% → ${Rb.noiseScore}% ${diff(Ra.noiseScore,Rb.noiseScore,true)}</span>
      <span style="color:var(--muted);">Heat</span><span>${Ra.heatIdx}% → ${Rb.heatIdx}% ${diff(Ra.heatIdx,Rb.heatIdx,true)}</span>
      <span style="color:var(--muted);">Pitch Speed</span><span>${Ra.pitchSpeedKmh} → ${Rb.pitchSpeedKmh} km/h ${diff(Ra.pitchSpeedKmh,Rb.pitchSpeedKmh)}</span>
    </div>`;
}

// ── CLI Copy ─────────────────────────────────────
function copyCLI() {
  const box = document.getElementById('cliBox'); if(!box) return;
  const btn = document.getElementById('cliCopyBtn');
  const text = box.innerText.replace(/📋 COPY/g,'').trim();
  navigator.clipboard.writeText(text).then(()=>{
    btn.textContent='✅ Copied!'; btn.classList.add('ok');
    setTimeout(()=>{ btn.textContent='📋 COPY'; btn.classList.remove('ok'); }, 2200);
    showToast('⚡ CLI copied — paste in Betaflight!');
  });
}

function showToast(msg) {
  const t=document.getElementById('mpToast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

// ── Helpers ──────────────────────────────────────
function setEl(id,v){ const e=document.getElementById(id); if(e) e.textContent=v; }
function setHTML(id,v){ const e=document.getElementById(id); if(e) e.innerHTML=v; }
function setColorEl(id,v,col){
  const e=document.getElementById(id); if(!e) return;
  e.textContent=v;
  const c={'red':'var(--red)','amber':'var(--amber)','green':'var(--green)','cyan':'var(--cyan)','purple':'var(--purple)'};
  e.style.color=c[col]||col;
}
function flash(id,v){
  const e=document.getElementById(id); if(!e) return;
  const u=e.querySelector('span'); const ut=u?.textContent||'';
  if(u) u.remove(); e.textContent=v; e.classList.remove('flash-anim');
  void e.offsetWidth; e.classList.add('flash-anim');
  if(ut){ const s=document.createElement('span'); s.textContent=ut; e.appendChild(s); }
}
function setBar(id,pct,lbl){
  const f=document.getElementById(id); const v=document.getElementById(id+'_v');
  if(f) f.style.width=Math.min(100,Math.max(0,pct))+'%';
  if(v) v.textContent=lbl;
}

// ── Slider wiring ─────────────────────────────────
function wireSlider(sid,tid,vid,fmt,key){
  const el=document.getElementById(sid);
  const tf=document.getElementById(tid);
  function upd(){
    const v=parseFloat(el.value);
    const min=parseFloat(el.min),max=parseFloat(el.max);
    const pct=((v-min)/(max-min))*100;
    if(tf) tf.style.width=pct+'%';
    setEl(vid,fmt(v));
    S[key]=v;
  }
  el.addEventListener('input',()=>{ upd(); render(); });
  upd();
}
function wireSeg(sid,vid,fmt,key){
  const seg=document.getElementById(sid);
  seg.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      seg.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      S[key]=isNaN(+btn.dataset.val)?btn.dataset.val:+btn.dataset.val;
      if(vid) setEl(vid,fmt(S[key]));
      render();
    });
  });
}

// ── Preset wiring ─────────────────────────────────
document.getElementById('presetGrid').querySelectorAll('.preset-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const p=PRESETS[btn.dataset.preset]; if(!p) return;
    document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    Object.assign(S, p);
    // Sync sliders
    [['s_size','tf_size','v_size',v=>v+'"','size'],
     ['s_weight','tf_weight','v_weight',v=>v+' g','weight'],
     ['s_mah','tf_mah','v_mah',v=>v+' mAh','mah'],
     ['s_prop','tf_prop','v_prop',v=>v+'"','prop'],
     ['s_pitch','tf_pitch','v_pitch',v=>parseFloat(v).toFixed(1)+'"','pitch'],
     ['s_kv','tf_kv','v_kv',v=>Math.round(v)+' KV','kv']
    ].forEach(([sid,tid,vid,fmt,key])=>{
      const el=document.getElementById(sid); if(!el) return;
      el.value=S[key];
      const min=parseFloat(el.min),max=parseFloat(el.max),val=S[key];
      const tf=document.getElementById(tid); if(tf) tf.style.width=((val-min)/(max-min))*100+'%';
      setEl(vid,fmt(val));
    });
    // Sync segs
    [{sid:'seg_battery',key:'cells',vid:'v_battery',fmt:v=>v+'S'},
     {sid:'seg_blades', key:'blades',vid:'v_blades', fmt:v=>v+' ใบ'},
     {sid:'seg_style',  key:'style', vid:null,        fmt:v=>v},
     {sid:'seg_motors', key:'motors',vid:'v_motors',  fmt:v=>v+' ตัว'}
    ].forEach(({sid,key,vid,fmt})=>{
      const seg=document.getElementById(sid); if(!seg) return;
      seg.querySelectorAll('.seg-btn').forEach(b=>b.classList.toggle('active',b.dataset.val==String(S[key])));
      if(vid) setEl(vid,fmt(S[key]));
    });
    render();
    showToast('✅ Preset loaded: '+btn.querySelector('.pb-name').textContent);
  });
});

// ── Init ──────────────────────────────────────────
wireSlider('s_size',  'tf_size',  'v_size',   v=>v+'"',                'size');
wireSlider('s_weight','tf_weight','v_weight', v=>v+' g',               'weight');
wireSlider('s_mah',   'tf_mah',   'v_mah',   v=>v+' mAh',             'mah');
wireSlider('s_kv',    'tf_kv',    'v_kv',    v=>Math.round(v)+' KV',  'kv');
wireSlider('s_prop',  'tf_prop',  'v_prop',   v=>v+'"',                'prop');
wireSlider('s_pitch', 'tf_pitch', 'v_pitch',  v=>parseFloat(v).toFixed(1)+'"', 'pitch');
wireSeg('seg_battery','v_battery',v=>v+'S','cells');
wireSeg('seg_blades', 'v_blades', v=>v+' ใบ','blades');
wireSeg('seg_style',  null,       v=>v,'style');
wireSeg('seg_motors', 'v_motors', v=>v+' ตัว','motors');

// Prop spin keyframe
const _st=document.createElement('style');
_st.textContent='@keyframes propSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
document.head.appendChild(_st);

render();
