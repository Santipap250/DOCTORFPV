// static/js/military-uas.js — Batch E: extracted from templates/military_uas.html inline <script>. No logic change.

// ─── TAB SWITCH ───────────────────────────────────────────
function switchTab(id){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ─── HARDPOINT RENDERER ───────────────────────────────────
const WEAPONS_DB = [
  {id:'empty',name:'EMPTY',icon:'⬜',cat:'empty',weight:0,drag:0},
  {id:'atgm',name:'ATGM × 2',icon:'🚀',cat:'armed',weight:120,drag:10},
  {id:'pgb250',name:'PGB 250kg',icon:'💣',cat:'armed',weight:250,drag:18},
  {id:'pgb100',name:'PGB 100kg',icon:'💣',cat:'armed',weight:100,drag:12},
  {id:'loiter',name:'Loitering Munition × 4',icon:'🎯',cat:'armed',weight:80,drag:8},
  {id:'eoir',name:'EO/IR Targeting Pod',icon:'👁️',cat:'sensor',weight:55,drag:8},
  {id:'sar',name:'SAR Radar Pod',icon:'📡',cat:'sensor',weight:120,drag:14},
  {id:'comint',name:'COMINT/ELINT Pod',icon:'📻',cat:'sensor',weight:45,drag:6},
  {id:'ew',name:'EW Jammer Pod',icon:'⚡',cat:'sensor',weight:90,drag:12},
  {id:'drop',name:'Drop Container 50kg',icon:'📦',cat:'sensor',weight:50,drag:7},
  {id:'tank',name:'External Fuel Tank',icon:'⛽',cat:'fuel',weight:180,drag:8},
];

let hpSelections = [];

function renderHardpoints(){
  const n = parseInt(document.getElementById('numHardpoints').value)||0;
  const grid = document.getElementById('hardpointSlots');
  while(hpSelections.length < n) hpSelections.push('empty');
  hpSelections = hpSelections.slice(0,n);
  if(n===0){grid.innerHTML='<p style="color:var(--muted);font-family:\'Share Tech Mono\',monospace;font-size:11px;">ไม่มี hardpoints</p>';return;}
  grid.innerHTML = hpSelections.map((sel,i)=>{
    const w = WEAPONS_DB.find(x=>x.id===sel)||WEAPONS_DB[0];
    return `<div class="hp-slot ${w.cat}" onclick="cycleHardpoint(${i})">
      <div class="hp-num">HARDPOINT ${i+1}</div>
      <div class="hp-icon">${w.icon}</div>
      <div class="hp-name">${w.name}</div>
      <div class="hp-stats">Weight: ${w.weight} kg<br>Drag: +${w.drag}%<br><span style="font-size:8px;color:var(--muted);">Click to change</span></div>
    </div>`;
  }).join('');
  updateTotalPayload();
}

function cycleHardpoint(idx){
  const cur = WEAPONS_DB.findIndex(x=>x.id===hpSelections[idx]);
  hpSelections[idx] = WEAPONS_DB[(cur+1)%WEAPONS_DB.length].id;
  renderHardpoints();
}

function updateTotalPayload(){
  const total = hpSelections.reduce((s,id)=>{
    const w=WEAPONS_DB.find(x=>x.id===id)||WEAPONS_DB[0];
    return s+w.weight;
  },0);
  document.getElementById('totalPayloadKg').textContent = total+' kg';
  document.getElementById('actualPayload').value = total||document.getElementById('actualPayload').value;
}

document.getElementById('numHardpoints').addEventListener('change',renderHardpoints);
renderHardpoints();

// ─── PLATFORM PRESETS ─────────────────────────────────────
const PLATFORM_PRESETS = {
  male:         {ew:120,wing:8,area:3.2,ld:15,cd:0.035,cruise:180,vmax:280,ceil:25000,opalt:15000,thrust:45,power:22,fuel:80,fflow:12},
  hale:         {ew:450,wing:20,area:8.5,ld:28,cd:0.022,cruise:280,vmax:370,ceil:60000,opalt:45000,thrust:120,power:55,fuel:300,fflow:25},
  ucav:         {ew:4500,wing:10,area:15,ld:10,cd:0.055,cruise:700,vmax:900,ceil:45000,opalt:35000,thrust:4000,power:2000,fuel:2500,fflow:800},
  loiter:       {ew:8,wing:2.4,area:0.3,ld:12,cd:0.04,cruise:120,vmax:180,ceil:15000,opalt:10000,thrust:4,power:2,fuel:3,fflow:0.4},
  vtol_large:   {ew:25,wing:2.8,area:0,ld:0,cd:0.08,cruise:80,vmax:120,ceil:10000,opalt:6000,thrust:60,power:15,fuel:0,fflow:0},
  vtol_medium:  {ew:8,wing:1.4,area:0,ld:0,cd:0.1,cruise:60,vmax:100,ceil:8000,opalt:5000,thrust:24,power:6,fuel:0,fflow:0},
};
function onPlatformChange(){
  const k = document.getElementById('platformClass').value;
  const p = PLATFORM_PRESETS[k];
  if(!p) return;
  document.getElementById('emptyWeight').value = p.ew;
  document.getElementById('wingspan').value = p.wing;
  document.getElementById('wingArea').value = p.area;
  document.getElementById('ldRatio').value = p.ld;
  document.getElementById('cdValue').value = p.cd;
  document.getElementById('cruiseSpeed').value = p.cruise;
  document.getElementById('maxSpeed').value = p.vmax;
  document.getElementById('serviceCeiling').value = p.ceil;
  document.getElementById('opAltitude').value = p.opalt;
  document.getElementById('maxThrust').value = p.thrust;
  document.getElementById('powerKW').value = p.power;
  document.getElementById('fuelLiters').value = p.fuel;
  document.getElementById('fuelFlow').value = p.fflow;
  if(k.startsWith('vtol')){
    document.getElementById('configType').value='multirotor';
    document.getElementById('engineType').value='electric';
    document.getElementById('numRotors').value='8';
  } else {
    document.getElementById('configType').value= k==='flying_wing'?'flying_wing':'fixed';
    document.getElementById('engineType').value= k==='ucav'?'turbine':'ice';
  }
}

function onEngineChange(){
  const t = document.getElementById('engineType').value;
  document.getElementById('fg-battery').style.display = (t==='electric'||t==='hybrid')?'flex':'none';
  document.getElementById('fg-fuel').style.display = (t==='ice'||t==='turbine'||t==='hybrid')?'flex':'none';
  document.getElementById('fg-fueltype').style.display = (t==='ice'||t==='turbine'||t==='hybrid')?'flex':'none';
}
onEngineChange();

// ─── PHYSICS ENGINE ───────────────────────────────────────
function getNum(id,def=0){ return parseFloat(document.getElementById(id).value)||def; }
function getStr(id){ return document.getElementById(id).value; }

function calcDensity(ft){
  // ISA model simplified
  const h = ft * 0.3048; // to meters
  return 1.225 * Math.pow(1 - 2.2558e-5*h, 4.2559);
}

function calcPerformance(){
  const cls        = getStr('platformClass');
  const config     = getStr('configType');
  const emptyWt    = getNum('emptyWeight',100);
  const maxPayload = getNum('maxPayload',0);
  const actPayload = getNum('actualPayload',0);
  const dragPct    = getNum('dragPenalty',0)/100;
  const wingArea   = getNum('wingArea',1);
  const ldRatio    = getNum('ldRatio',10)||10;
  const cdVal      = getNum('cdValue',0.04);
  const cruiseKph  = getNum('cruiseSpeed',150);
  const maxKph     = getNum('maxSpeed',250);
  const ceil_ft    = getNum('serviceCeiling',25000);
  const opAlt_ft   = getNum('opAltitude',10000);
  const maxThrust  = getNum('maxThrust',40);  // kgf
  const powerKW    = getNum('powerKW',20);
  const fuelLit    = getNum('fuelLiters',50);
  const fuelFlow   = getNum('fuelFlow',10);   // L/hr
  const battWh     = getNum('batteryWh',0);
  const propEff    = getNum('propEff',0.82);
  const engType    = getStr('engineType');
  const numRotors  = parseInt(getStr('numRotors'))||0;
  const rotorDiam  = getNum('rotorDiam',0);
  
  const fuelDensity = {avgas:0.72, jp8:0.81, mogas:0.72, diesel:0.84};
  const fuelD = fuelDensity[getStr('fuelType')]||0.81;
  const fuelKg = fuelLit * fuelD;
  
  // MTOW
  const mtow = emptyWt + fuelKg + actPayload;
  
  // Endurance
  let endurance_hr, range_km;
  if(engType === 'electric'){
    const avgPowerW = (powerKW * 1000 * 0.6); // 60% avg
    endurance_hr = battWh / (avgPowerW/1000);
    range_km = endurance_hr * (cruiseKph * (1 - dragPct));
  } else {
    const fuelFlowLoaded = fuelFlow * (1 + dragPct * 0.7);
    endurance_hr = (fuelKg / fuelD) / fuelFlowLoaded;
    range_km = endurance_hr * cruiseKph * (1 - dragPct * 0.5);
  }
  
  // Breguet correction for fixed wing
  if(config==='fixed'||config==='flying_wing'){
    range_km = range_km * Math.min(ldRatio/10, 1.8);
  }
  
  // TWR
  const twr = maxThrust / mtow;
  
  // Wing loading
  const wingLoad = wingArea > 0 ? (mtow / wingArea) : 0;
  
  // Stall speed (simplified)
  const rho = calcDensity(opAlt_ft);
  const Cl_max = 1.6;
  const stallKph = wingArea > 0 
    ? Math.sqrt((2*mtow*9.81)/(rho*wingArea*Cl_max)) * 3.6 
    : 0;
  
  // Payload fraction
  const payloadFrac = mtow > 0 ? (actPayload/mtow)*100 : 0;
  
  // Survivability score (simple heuristic)
  const altBonus  = Math.min(opAlt_ft/60000 * 40, 40);
  const speedBonus= Math.min((cruiseKph-100)/8, 30);
  const rcsBonus  = getStr('hasInternalBay')==='yes' ? 20 : 0;
  const survScore = Math.min(Math.max(altBonus + speedBonus + rcsBonus, 5), 95);
  
  // Threat class
  let threatClass = 'MICRO';
  if(mtow > 5000) threatClass = 'CLASS-IV';
  else if(mtow > 600) threatClass = 'CLASS-III';
  else if(mtow > 25) threatClass = 'CLASS-II';
  else if(mtow > 5) threatClass = 'CLASS-I';
  
  return {mtow,endurance_hr,range_km,cruiseKph,maxKph,ceil_ft,
          twr,wingLoad,stallKph,payloadFrac,survScore,threatClass,
          emptyWt,fuelKg,actPayload,maxPayload};
}

function calcMission(perf){
  const dist    = getNum('targetDist',300);
  const tot     = getNum('totMinutes',30);
  const reserve = getNum('reservePct',20)/100;
  const wind    = getNum('headwind',0);
  const gs_out  = perf.cruiseKph - wind;
  const gs_ret  = perf.cruiseKph + wind;
  const transit_hr = dist / Math.max(gs_out,30);
  const return_hr  = dist / Math.max(gs_ret,30);
  const tot_hr  = tot/60;
  const total_needed = (transit_hr + return_hr + tot_hr) / (1-reserve);
  const feasible = perf.endurance_hr >= total_needed;
  const fuel_pct = Math.min(total_needed / perf.endurance_hr * 100, 120);
  const margin_hr = perf.endurance_hr - total_needed;
  
  const transitMin = Math.round(transit_hr*60);
  const returnMin  = Math.round(return_hr*60);
  const totalMin   = Math.round(total_needed*60);
  const bingoMin   = Math.round((transit_hr + tot_hr)*60);
  
  return {feasible,fuel_pct,margin_hr,transitMin,returnMin,tot,totalMin,bingoMin,gs_out,gs_ret};
}

// ─── UPDATE UI ────────────────────────────────────────────
function runAll(){
  const p = calcPerformance();
  
  // Status bar
  document.getElementById('sb-platform').textContent = document.getElementById('platformClass').options[document.getElementById('platformClass').selectedIndex].text.split('—')[0].trim();
  document.getElementById('sb-mtow').textContent     = p.mtow.toFixed(0)+' kg';
  document.getElementById('sb-range').textContent    = p.range_km.toFixed(0)+' km';
  document.getElementById('sb-endurance').textContent= p.endurance_hr.toFixed(1)+' hr';
  document.getElementById('sb-payload').textContent  = p.actPayload.toFixed(0)+' kg';
  document.getElementById('sb-threat').textContent   = p.threatClass;
  
  // Performance metrics
  document.getElementById('m-range').textContent      = p.range_km.toFixed(0);
  document.getElementById('m-endurance').textContent  = p.endurance_hr.toFixed(1);
  document.getElementById('m-cruise').textContent     = p.cruiseKph.toFixed(0);
  document.getElementById('m-mtow').textContent       = p.mtow.toFixed(0);
  document.getElementById('m-ceiling').textContent    = p.ceil_ft.toLocaleString();
  document.getElementById('m-twr').textContent        = p.twr.toFixed(2);
  document.getElementById('m-pfrac').textContent      = p.payloadFrac.toFixed(1)+'%';
  document.getElementById('m-wl').textContent         = p.wingLoad > 0 ? p.wingLoad.toFixed(1) : 'N/A';
  
  // Speed envelope
  const vne = p.maxKph;
  const vstall = Math.max(p.stallKph,30);
  const vcruise = p.cruiseKph;
  const stallPct  = (vstall/vne)*100;
  const cruisePct = (vcruise/vne)*100;
  document.getElementById('env-stall').style.width  = stallPct+'%';
  document.getElementById('env-cruise').style.left  = stallPct+'%';
  document.getElementById('env-cruise').style.width = (cruisePct-stallPct)*0.9+'%';
  document.getElementById('env-dash').style.left    = (cruisePct)+'%';
  document.getElementById('env-dash').style.width   = ((100-cruisePct)*0.6)+'%';
  document.getElementById('env-vne').style.left     = (cruisePct+(100-cruisePct)*0.6)+'%';
  document.getElementById('env-vne').style.width    = ((100-cruisePct)*0.4)+'%';
  document.getElementById('cruise-marker').style.left = cruisePct+'%';
  document.getElementById('spd-stall').textContent  = 'Stall: '+vstall.toFixed(0)+' km/h';
  document.getElementById('spd-cruise').textContent = 'Cruise: '+vcruise+' km/h';
  document.getElementById('spd-max').textContent    = 'VNE: '+vne+' km/h';
  
  // Gauges
  const setGauge = (id,pct,val)=>{
    document.getElementById('g-'+id).style.width = Math.min(pct,100)+'%';
    document.getElementById('gv-'+id).textContent = val;
  };
  setGauge('range',    Math.min(p.range_km/3000*100,100), p.range_km.toFixed(0)+' km');
  setGauge('endurance',Math.min(p.endurance_hr/24*100,100),p.endurance_hr.toFixed(1)+' hr');
  setGauge('payload',  Math.min(p.payloadFrac*2,100), p.payloadFrac.toFixed(1)+'%');
  setGauge('twr',      Math.min(p.twr*50,100), p.twr.toFixed(2));
  setGauge('surv',     p.survScore, Math.round(p.survScore)+'%');
  
  // Mission
  const m = calcMission(p);
  const feasEl = document.getElementById('missionFeasibility');
  if(m.feasible){
    feasEl.innerHTML = `
      <div class="alert alert-green">
        <span class="alert-icon">✅</span>
        <div><div class="alert-title">MISSION FEASIBLE</div>
        เชื้อเพลิง/พลังงานเพียงพอสำหรับภารกิจ · เหลือ margin ${m.margin_hr.toFixed(2)} ชั่วโมง (${(m.margin_hr/p.endurance_hr*100).toFixed(0)}%)</div>
      </div>
      <div class="data-table-wrap"><table class="data-table">
        <tr><th>PARAMETER</th><th>VALUE</th><th>STATUS</th></tr>
        <tr><td>Fuel/Energy Used</td><td>${m.fuel_pct.toFixed(1)}%</td><td class="dt-ok">✅ ปลอดภัย</td></tr>
        <tr><td>Ground Speed (outbound)</td><td>${m.gs_out.toFixed(0)} km/h</td><td>—</td></tr>
        <tr><td>Ground Speed (return)</td><td>${m.gs_ret.toFixed(0)} km/h</td><td>—</td></tr>
        <tr><td>Reserve Fuel</td><td>${(p.endurance_hr - m.total_needed/60||0).toFixed(2)} hr</td><td class="dt-ok">✅</td></tr>
      </table></div>`;
  } else {
    feasEl.innerHTML = `
      <div class="alert alert-red">
        <span class="alert-icon">🚨</span>
        <div><div class="alert-title">MISSION NOT FEASIBLE — INSUFFICIENT RANGE/ENDURANCE</div>
        ต้องการ ${(m.totalMin/60).toFixed(1)} ชั่วโมง แต่มีเพียง ${p.endurance_hr.toFixed(1)} ชั่วโมง — Deficit: ${Math.abs(m.margin_hr).toFixed(2)} hr
        <br><strong>แนวทางแก้ไข:</strong> เพิ่ม fuel/battery, ลด payload, เพิ่ม staging base, หรือลด TOT</div>
      </div>`;
  }
  
  // Mission timeline
  document.getElementById('tl-transit').textContent  = `T+${m.transitMin} min (${(m.transitMin/60).toFixed(2)} hr)`;
  document.getElementById('tl-transit').nextElementSibling && (document.getElementById('tl-transit').nextElementSibling.textContent = `GS = ${m.gs_out.toFixed(0)} km/h`);
  document.getElementById('tl-tot').textContent     = `T+${m.transitMin+m.tot} min | ${m.tot} min on target`;
  document.getElementById('tl-bingo').textContent   = `T+${m.bingoMin} min`;
  document.getElementById('tl-rtb').textContent     = `T+${m.bingoMin + m.returnMin} min`;
  
  // Report
  buildReport(p, m);
}

// ─── BUILD REPORT ─────────────────────────────────────────
function buildReport(p, m){
  const rScore = computeScore(p,m);
  const cls = document.getElementById('platformClass').options[document.getElementById('platformClass').selectedIndex].text;
  const now = new Date();
  const ts = now.toISOString().slice(0,19).replace('T',' ')+'Z';
  
  document.getElementById('reportContainer').innerHTML = `
    <div class="report-header">
      <div>
        <div class="report-title">UAS ANALYSIS REPORT</div>
        <div class="report-meta">
          PLATFORM: ${cls}<br>
          GENERATED: ${ts}<br>
          PHYSICS ENGINE: ConfigDoctor v5.1<br>
          CLASSIFICATION: UNCLASSIFIED · EDUCATIONAL
        </div>
      </div>
      <div class="report-score">
        <div class="report-score-val">${rScore.letter}</div>
        <div class="report-score-lbl">MISSION SCORE</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric"><div class="metric-label">MTOW</div><div class="metric-value">${p.mtow.toFixed(0)}</div><div class="metric-note">kg total</div></div>
      <div class="metric m-green"><div class="metric-label">ENDURANCE</div><div class="metric-value">${p.endurance_hr.toFixed(1)}</div><div class="metric-note">hours</div></div>
      <div class="metric"><div class="metric-label">RANGE</div><div class="metric-value">${p.range_km.toFixed(0)}</div><div class="metric-note">km cruise</div></div>
      <div class="metric m-blue"><div class="metric-label">CRUISE SPEED</div><div class="metric-value">${p.cruiseKph}</div><div class="metric-note">km/h</div></div>
      <div class="metric m-red"><div class="metric-label">PAYLOAD</div><div class="metric-value">${p.actPayload}</div><div class="metric-note">kg loaded</div></div>
      <div class="metric m-cyan"><div class="metric-label">TWR</div><div class="metric-value">${p.twr.toFixed(2)}</div><div class="metric-note">thrust/weight</div></div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-head-title">WEIGHT BREAKDOWN</span></div>
      <div class="card-body">
        <table class="data-table">
          <tr><th>COMPONENT</th><th>WEIGHT (kg)</th><th>% of MTOW</th><th>STATUS</th></tr>
          <tr><td>Empty Weight (OEW)</td><td>${p.emptyWt.toFixed(0)}</td><td>${(p.emptyWt/p.mtow*100).toFixed(1)}%</td><td>—</td></tr>
          <tr><td>Fuel / Battery</td><td>${p.fuelKg.toFixed(0)}</td><td>${(p.fuelKg/p.mtow*100).toFixed(1)}%</td>
            <td class="${p.fuelKg/p.mtow>0.35?'dt-ok':'dt-warn'}">${p.fuelKg/p.mtow>0.35?'✅ GOOD':'⚠️ LOW'}</td></tr>
          <tr><td>Weapons / Payload</td><td>${p.actPayload.toFixed(0)}</td><td>${(p.actPayload/p.mtow*100).toFixed(1)}%</td>
            <td class="${p.actPayload<=p.maxPayload?'dt-ok':'dt-danger'}">${p.actPayload<=p.maxPayload?'✅ WITHIN LIMIT':'🚨 OVERLOAD'}</td></tr>
          <tr><td><strong>MTOW TOTAL</strong></td><td><strong>${p.mtow.toFixed(0)}</strong></td><td>100%</td><td>—</td></tr>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-head-title">MISSION ASSESSMENT</span></div>
      <div class="card-body">
        ${m.feasible
          ? `<div class="alert alert-green"><span class="alert-icon">✅</span><div><div class="alert-title">MISSION FEASIBLE</div>Margin: ${m.margin_hr.toFixed(2)} hr (${(m.margin_hr/p.endurance_hr*100).toFixed(0)}%) · Fuel used: ${m.fuel_pct.toFixed(1)}%</div></div>`
          : `<div class="alert alert-red"><span class="alert-icon">🚨</span><div><div class="alert-title">MISSION NOT FEASIBLE</div>Endurance deficit: ${Math.abs(m.margin_hr).toFixed(2)} hr</div></div>`}
        <table class="data-table" style="margin-top:12px;">
          <tr><th>CHECK</th><th>RESULT</th><th>LIMIT</th><th>STATUS</th></tr>
          <tr><td>Payload ≤ Max Payload</td><td>${p.actPayload} kg</td><td>${p.maxPayload} kg</td>
            <td class="${p.actPayload<=p.maxPayload?'dt-ok':'dt-danger'}">${p.actPayload<=p.maxPayload?'✅ PASS':'❌ FAIL'}</td></tr>
          <tr><td>TWR (min 0.25 for fixed wing)</td><td>${p.twr.toFixed(2)}</td><td>≥ 0.25</td>
            <td class="${p.twr>=0.25?'dt-ok':'dt-danger'}">${p.twr>=0.25?'✅ PASS':'❌ FAIL'}</td></tr>
          <tr><td>Mission Feasibility</td><td>${m.fuel_pct.toFixed(0)}% fuel used</td><td>≤ 100%</td>
            <td class="${m.feasible?'dt-ok':'dt-danger'}">${m.feasible?'✅ PASS':'❌ FAIL'}</td></tr>
          <tr><td>Survivability Score</td><td>${Math.round(p.survScore)}%</td><td>≥ 40%</td>
            <td class="${p.survScore>=40?'dt-ok':'dt-warn'}">${p.survScore>=40?'✅ ADEQUATE':'⚠️ LOW'}</td></tr>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <span class="card-head-title">CLI OUTPUT — MISSION DATA BLOCK</span>
        <button class="copy-btn" onclick="copyReport()">📋 COPY</button>
      </div>
      <div class="card-body">
        <pre style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--green);line-height:1.9;white-space:pre-wrap;" id="cliOutput">${buildCLI(p,m,rScore)}</pre>
      </div>
    </div>
  `;
}

function computeScore(p,m){
  let s = 0;
  s += Math.min(p.endurance_hr/20*25, 25);
  s += Math.min(p.range_km/3000*25, 25);
  s += Math.min(p.payloadFrac/30*20, 20);
  s += m.feasible ? 20 : 0;
  s += Math.min(p.survScore/100*10, 10);
  const letters = ['F','D','C','B','B+','A','A+','S','S+'];
  const idx = Math.min(Math.floor(s/12.5), 8);
  return {score:Math.round(s), letter:letters[idx]};
}

function buildCLI(p,m,sc){
  return [
    '# ═══════════════════════════════════════',
    '# MILITARY UAS ANALYSIS — ConfigDoctor v5.1',
    '# ═══════════════════════════════════════',
    `platform_class     = ${document.getElementById('platformClass').value.toUpperCase()}`,
    `mtow_kg            = ${p.mtow.toFixed(1)}`,
    `empty_weight_kg    = ${p.emptyWt}`,
    `fuel_weight_kg     = ${p.fuelKg.toFixed(1)}`,
    `payload_kg         = ${p.actPayload}`,
    `payload_fraction   = ${p.payloadFrac.toFixed(1)}%`,
    ``,
    `# PERFORMANCE`,
    `endurance_hr       = ${p.endurance_hr.toFixed(2)}`,
    `range_km           = ${p.range_km.toFixed(0)}`,
    `cruise_speed_kmh   = ${p.cruiseKph}`,
    `max_speed_kmh      = ${p.maxKph}`,
    `service_ceiling_ft = ${p.ceil_ft}`,
    `twr                = ${p.twr.toFixed(3)}`,
    `wing_loading_kg_m2 = ${p.wingLoad > 0 ? p.wingLoad.toFixed(1) : 'N/A (VTOL)'}`,
    ``,
    `# MISSION`,
    `mission_type       = ${getStr('missionType').toUpperCase()}`,
    `target_dist_km     = ${getNum('targetDist')}`,
    `time_on_target_min = ${getNum('totMinutes')}`,
    `mission_feasible   = ${m.feasible ? 'YES' : 'NO'}`,
    `fuel_used_pct      = ${m.fuel_pct.toFixed(1)}%`,
    `margin_hr          = ${m.margin_hr.toFixed(2)}`,
    ``,
    `# ASSESSMENT`,
    `threat_class       = ${p.threatClass}`,
    `survivability_pct  = ${Math.round(p.survScore)}%`,
    `mission_score      = ${sc.letter} (${sc.score}/100)`,
    `# ─── EDUCATIONAL USE ONLY ───────────────`,
  ].join('\n');
}

function copyReport(){
  const txt = document.getElementById('cliOutput').textContent;
  navigator.clipboard.writeText(txt).then(()=>{
    const btn = event.currentTarget;
    btn.textContent = '✅ COPIED';
    setTimeout(()=>btn.textContent='📋 COPY', 2000);
  });
}

// ─── INIT ─────────────────────────────────────────────────
window.addEventListener('load', runAll);
