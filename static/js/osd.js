// static/js/osd.js — Batch D: extracted from templates/osd.html inline <script>. No logic change.

'use strict';
/* ═══════════════════════════════════════════════════
   ELEMENT DEFINITIONS — 35 elements · 7 groups
   All BF4.3/4.4/4.5 verified CLI keys
═══════════════════════════════════════════════════ */
const EL = [
  /* ── ⚡ Flight Data ─────────────────────────── */
  {id:'rssi',        cli:'osd_rssi_pos',              n:'RSSI',            mock:'R 96',        color:'#00ff88',grp:'⚡ Flight Data',  desc:'RC signal strength %'},
  {id:'battery',     cli:'osd_battery_voltage_pos',   n:'Pack Voltage',    mock:'15.8V',       color:'#ffb700',grp:'⚡ Flight Data',  desc:'แรงดัน pack รวม',live:'v'},
  {id:'avg_cell',    cli:'osd_avg_cell_voltage_pos',  n:'Avg Cell Voltage',mock:'3.95V',       color:'#ffb700',grp:'⚡ Flight Data',  desc:'แรงดันเฉลี่ยต่อ cell',live:'vc'},
  {id:'current',     cli:'osd_current_draw_pos',      n:'Current Draw',    mock:'28.5A',       color:'#ff8844',grp:'⚡ Flight Data',  desc:'กระแสทันที (A)'},
  {id:'mah',         cli:'osd_mah_drawn_pos',         n:'mAh Used',        mock:'412mAh',      color:'#ffb700',grp:'⚡ Flight Data',  desc:'พลังงานใช้ไป',live:'mah'},
  {id:'power',       cli:'osd_power_pos',             n:'Motor Power',     mock:'387W',        color:'#ff4455',grp:'⚡ Flight Data',  desc:'กำลังวัตต์รวม'},
  {id:'wh',          cli:'osd_watt_hours_drawn_pos',  n:'Watt Hours',      mock:'1.52Wh',      color:'#ff8844',grp:'⚡ Flight Data',  desc:'พลังงานสะสม Wh'},
  /* ── 🛰️ Navigation ──────────────────────────── */
  {id:'altitude',    cli:'osd_altitude_pos',          n:'Altitude',        mock:'38.4m',       color:'#00aaff',grp:'🛰️ Navigation',   desc:'ความสูง baro/GPS',live:'alt'},
  {id:'gps_spd',     cli:'osd_gps_speed_pos',         n:'GPS Speed',       mock:'82km/h',      color:'#00aaff',grp:'🛰️ Navigation',   desc:'ความเร็วตามพื้น',live:'spd'},
  {id:'gps_sat',     cli:'osd_gps_sats_pos',          n:'GPS Satellites',  mock:'STS 12',      color:'#00e5ff',grp:'🛰️ Navigation',   desc:'จำนวนดาวเทียม GPS'},
  {id:'home_dist',   cli:'osd_home_dist_pos',         n:'Home Distance',   mock:'420m',        color:'#bb55ff',grp:'🛰️ Navigation',   desc:'ระยะจากจุด Home'},
  {id:'home_dir',    cli:'osd_home_dir_pos',          n:'Home Direction',  mock:'↗ HOME',      color:'#bb55ff',grp:'🛰️ Navigation',   desc:'ทิศทางกลับบ้าน'},
  {id:'trip',        cli:'osd_trip_dist_pos',         n:'Trip Distance',   mock:'1.23km',      color:'#00aaff',grp:'🛰️ Navigation',   desc:'ระยะทางสะสม'},
  {id:'vario',       cli:'osd_numeric_vario_pos',     n:'Vario (m/s)',     mock:'▲2.3m/s',     color:'#00e5ff',grp:'🛰️ Navigation',   desc:'อัตราไต่/ร่วง'},
  /* ── ⏱️ Time & Control ───────────────────────── */
  {id:'timer',       cli:'osd_flight_time_spent_pos', n:'Flight Timer',    mock:'03:42',       color:'#00ff88',grp:'⏱️ Time & Control',desc:'เวลาบินทั้งหมด',live:'t'},
  {id:'throttle',    cli:'osd_throttle_pos',          n:'Throttle %',      mock:'TH 62%',      color:'#aaaaaa',grp:'⏱️ Time & Control',desc:'throttle position',live:'thr'},
  {id:'remain',      cli:'osd_remaining_time_estimate_pos',n:'Remaining Time',mock:'ET 4:18',  color:'#ffb700',grp:'⏱️ Time & Control',desc:'เวลาบินที่เหลือ (estimate)'},
  /* ── 📊 Status & Info ────────────────────────── */
  {id:'craft',       cli:'osd_craft_name_pos',        n:'Craft Name',      mock:'OBIX-5R',     color:'#ffffff',grp:'📊 Status & Info', desc:'ชื่อโดรน'},
  {id:'warnings',    cli:'osd_warnings_pos',          n:'Warnings',        mock:'! WARN !',    color:'#ff4455',grp:'📊 Status & Info', desc:'คำเตือนระบบ'},
  {id:'disarmed',    cli:'osd_disarmed_pos',          n:'Disarmed',        mock:'DISARMD',     color:'#888888',grp:'📊 Status & Info', desc:'แสดงเมื่อ disarm'},
  {id:'vtx_ch',      cli:'osd_vtx_channel_pos',       n:'VTX Channel',     mock:'R:5 5806',    color:'#00e5ff',grp:'📊 Status & Info', desc:'Band/Ch VTX'},
  {id:'lq',          cli:'osd_link_quality_pos',      n:'Link Quality',    mock:'LQ:97:1',     color:'#00ff88',grp:'📊 Status & Info', desc:'ELRS LQ + SNR'},
  {id:'log',         cli:'osd_log_status_pos',        n:'Log Status',      mock:'●REC',        color:'#ff4455',grp:'📊 Status & Info', desc:'Blackbox recording'},
  {id:'eff',         cli:'osd_efficiency_pos',        n:'Efficiency',      mock:'12mAh/km',    color:'#00ff88',grp:'📊 Status & Info', desc:'ประสิทธิภาพ mAh/km'},
  /* ── 🎯 Visual ───────────────────────────────── */
  {id:'cross',       cli:'osd_crosshairs_pos',        n:'Crosshairs',      mock:'  [+]',       color:'#ffffff',grp:'🎯 Visual',        desc:'Crosshair กลางจอ'},
  {id:'horizon',     cli:'osd_artificial_horizon_pos',n:'Artificial Horizon',mock:'──┼──',    color:'#00ff88',grp:'🎯 Visual',        desc:'เส้นขอบฟ้า artificial'},
  {id:'horiz_sb',    cli:'osd_horizon_sidebars_pos',  n:'Horizon Sidebars',mock:'|  |',       color:'#00ff88',grp:'🎯 Visual',        desc:'แถบข้าง horizon'},
  {id:'flip',        cli:'osd_flip_arrow_pos',        n:'Flip Arrow',      mock:'↺ FLIP',      color:'#aaaaaa',grp:'🎯 Visual',        desc:'ทิศทาง flip over crash'},
  /* ── 🔧 PID / Tuning ─────────────────────────── */
  {id:'pid_r',       cli:'osd_roll_pids_pos',         n:'Roll PIDs',       mock:'R 48|90|38',  color:'#bb55ff',grp:'🔧 PID/Tuning',    desc:'P I D Roll axis'},
  {id:'pid_p',       cli:'osd_pitch_pids_pos',        n:'Pitch PIDs',      mock:'P 52|90|40',  color:'#bb55ff',grp:'🔧 PID/Tuning',    desc:'P I D Pitch axis'},
  {id:'pid_y',       cli:'osd_yaw_pids_pos',          n:'Yaw PIDs',        mock:'Y 40|90| 0',  color:'#bb55ff',grp:'🔧 PID/Tuning',    desc:'P I D Yaw axis'},
  {id:'rate_p',      cli:'osd_rate_profile_name_pos', n:'Rate Profile',    mock:'1:RACE',      color:'#bb55ff',grp:'🔧 PID/Tuning',    desc:'Rate profile ที่ใช้'},
  /* ── 🔩 Motor / ESC ─────────────────────────── */
  {id:'esc_t',       cli:'osd_esc_tmp_pos',           n:'ESC Temperature', mock:'ESC 43°',     color:'#ff8844',grp:'🔩 Motor/ESC',     desc:'อุณหภูมิ ESC สูงสุด',live:'esc'},
  {id:'esc_rpm',     cli:'osd_esc_rpm_pos',           n:'ESC RPM',         mock:'24.5k RPM',   color:'#ff8844',grp:'🔩 Motor/ESC',     desc:'รอบ motor เฉลี่ย',live:'rpm'},
  {id:'mot_d',       cli:'osd_motor_diag_pos',        n:'Motor Diagnostic',mock:'M 100%',      color:'#ff4455',grp:'🔩 Motor/ESC',     desc:'Motor diagnostic'},
];

/* ═══ PRESETS ═══ */
const PRESETS = {
  Racing:[
    {id:'rssi',c:0,r:0},{id:'battery',c:20,r:0},{id:'avg_cell',c:20,r:1},
    {id:'throttle',c:0,r:12},{id:'current',c:0,r:1},
    {id:'timer',c:13,r:0},{id:'warnings',c:8,r:11},
    {id:'cross',c:14,r:6},{id:'lq',c:21,r:12},
    {id:'esc_rpm',c:20,r:2},{id:'vtx_ch',c:20,r:3},{id:'craft',c:11,r:0},
  ],
  Freestyle:[
    {id:'battery',c:0,r:0},{id:'avg_cell',c:0,r:1},{id:'mah',c:0,r:2},
    {id:'rssi',c:22,r:0},{id:'lq',c:22,r:1},{id:'vtx_ch',c:22,r:2},
    {id:'timer',c:12,r:12},{id:'altitude',c:0,r:12},
    {id:'cross',c:14,r:6},{id:'warnings',c:9,r:11},
    {id:'craft',c:11,r:0},{id:'disarmed',c:12,r:6},
    {id:'current',c:0,r:3},{id:'throttle',c:22,r:12},
  ],
  LongRange:[
    {id:'battery',c:0,r:0},{id:'avg_cell',c:0,r:1},
    {id:'gps_spd',c:0,r:2},{id:'altitude',c:0,r:3},
    {id:'home_dist',c:0,r:4},{id:'home_dir',c:0,r:5},
    {id:'trip',c:0,r:6},{id:'remain',c:0,r:7},
    {id:'rssi',c:22,r:0},{id:'lq',c:22,r:1},
    {id:'gps_sat',c:22,r:2},{id:'timer',c:22,r:3},
    {id:'eff',c:22,r:4},{id:'vario',c:22,r:5},
    {id:'mah',c:10,r:12},{id:'warnings',c:9,r:11},
    {id:'craft',c:11,r:0},
  ],
  Cine:[
    {id:'battery',c:1,r:0},{id:'timer',c:22,r:0},
    {id:'cross',c:14,r:6},{id:'warnings',c:9,r:11},
    {id:'disarmed',c:12,r:6},{id:'craft',c:10,r:12},
    {id:'avg_cell',c:1,r:1},{id:'altitude',c:22,r:1},
    {id:'log',c:13,r:1},{id:'mah',c:1,r:2},
  ],
  Minimal:[
    {id:'battery',c:0,r:0},{id:'rssi',c:25,r:0},
    {id:'warnings',c:9,r:11},{id:'timer',c:13,r:12},
  ],
  Whoop:[
    {id:'battery',c:0,r:0},{id:'rssi',c:22,r:0},
    {id:'timer',c:11,r:0},{id:'throttle',c:0,r:12},
    {id:'warnings',c:9,r:11},{id:'lq',c:20,r:12},
    {id:'esc_t',c:0,r:1},{id:'avg_cell',c:0,r:2},
  ],
};

/* ═══ GRID CONFIG ═══ */
let GRID={cols:30,rows:13};
let CW=20,CH=26;

/* ═══ STATE ═══ */
let els=[];
let selId=null;
let showGrid=true;
let bgIdx=0;
let liveOn=false;
let liveTmr=null;
let undo=[];
let drag=null;

const BG_NAMES=['DARK','OUTDOOR','SKY'];
const BG_CSS=[
  'radial-gradient(ellipse at 35% 45%,#0d2010 0%,#040b06 40%,#000 100%)',
  'radial-gradient(ellipse at 50% 65%,#102a0e 0%,#071207 55%,#000 100%)',
  'radial-gradient(ellipse at 50% 25%,#0a1432 0%,#050920 55%,#000 100%)',
];
const COLORS=['#00ff88','#ffb700','#ff4455','#00aaff','#bb55ff','#ff8844','#00e5ff','#ffffff','#aaaaaa','#ff66bb'];

/* ═══ LIVE SIMULATION DATA ═══ */
let LD={rssi:96,v:15.84,mah:0,t:0,thr:62,alt:38,spd:82,esc:43,rpm:24500};
function liveGet(id,def){
  if(!liveOn) return def.mock;
  const mm=String(Math.floor(LD.t/60)).padStart(2,'0');
  const ss=String(LD.t%60).padStart(2,'0');
  switch(id){
    case 'rssi':    return 'R '+Math.round(LD.rssi);
    case 'battery': return LD.v.toFixed(2)+'V';
    case 'avg_cell':return (LD.v/4).toFixed(2)+'V';
    case 'mah':     return Math.round(LD.mah)+'mAh';
    case 'timer':   return mm+':'+ss;
    case 'throttle':return 'TH '+Math.round(LD.thr)+'%';
    case 'altitude':return LD.alt.toFixed(1)+'m';
    case 'gps_spd': return Math.round(LD.spd)+'km/h';
    case 'esc_t':   return 'ESC '+Math.round(LD.esc)+'°';
    case 'esc_rpm': return (LD.rpm/1000).toFixed(1)+'k RPM';
    default: return def.mock;
  }
}
function liveTick(){
  LD.t++;
  LD.mah=Math.min(1100,LD.mah+1.4+Math.random()*.6);
  LD.v=Math.max(12.0,LD.v-.007-Math.random()*.003);
  LD.rssi=Math.max(55,Math.min(99,LD.rssi+(Math.random()-.52)*3));
  LD.alt+=( Math.random()-.48)*2.5;
  LD.spd=Math.max(0,Math.min(140,LD.spd+(Math.random()-.5)*9));
  LD.thr=Math.max(15,Math.min(100,LD.thr+(Math.random()-.5)*10));
  LD.esc=Math.min(85,LD.esc+(Math.random()-.46)*.7);
  LD.rpm=Math.max(8000,Math.min(44000,LD.rpm+(Math.random()-.5)*1800));
  renderEls();
}

/* ═══ PALETTE ═══ */
function buildPal(filter){
  filter=(filter||'').toLowerCase();
  const container=document.getElementById('palList');
  const onC=new Set(els.map(e=>e.defId));
  const groups={};
  EL.forEach(e=>{
    if(filter&&!e.n.toLowerCase().includes(filter)&&!e.cli.toLowerCase().includes(filter)&&!e.grp.toLowerCase().includes(filter)) return;
    if(!groups[e.grp]) groups[e.grp]=[];
    groups[e.grp].push(e);
  });
  let h='';
  Object.entries(groups).forEach(([g,items])=>{
    h+=`<div class="pal-group-label">${g}</div>`;
    items.forEach(e=>{
      const on=onC.has(e.id);
      h+=`<div class="pal-item${on?' active':''}" draggable="true" data-id="${e.id}"
        ondragstart="palDrag(event,'${e.id}')" ondblclick="addEl('${e.id}')"
        title="${e.desc||e.n}">
        <div class="pi-dot" style="background:${e.color};box-shadow:0 0 5px ${e.color}50"></div>
        <div class="pi-body">
          <div class="pi-name">${e.n}</div>
          <div class="pi-cli">${e.cli}</div>
        </div>
        ${on?'<span class="pi-added-badge">ON</span>':'<div class="pi-add" onclick="event.stopPropagation();addEl(\''+e.id+'\')">＋</div>'}
      </div>`;
    });
  });
  container.innerHTML=h||'<div style="padding:20px;text-align:center;color:var(--muted2);font-size:11px">ไม่พบ element</div>';
}
function filterPal(v){buildPal(v);}
function palDrag(e,id){e.dataTransfer.setData('defId',id);}

/* ═══ CANVAS ═══ */
function initCanvas(){
  const scr=document.getElementById('fpvScreen');
  const W=GRID.cols*CW, H=GRID.rows*CH;
  scr.style.width=W+'px';scr.style.height=H+'px';
  document.getElementById('lbGrid').textContent=GRID.cols+'×'+GRID.rows;
  const layer=document.getElementById('osdLayer');
  layer.style.width=W+'px';layer.style.height=H+'px';
  // Set BG
  document.getElementById('fbg0').style.cssText=`position:absolute;inset:0;pointer-events:none;background:${BG_CSS[0]}`;
  document.getElementById('fbg1').style.cssText=`position:absolute;inset:0;pointer-events:none;background:${BG_CSS[1]};opacity:0`;
  document.getElementById('fbg2').style.cssText=`position:absolute;inset:0;pointer-events:none;background:${BG_CSS[2]};opacity:0`;
  // Drop
  layer.ondragover=e=>{
    e.preventDefault();
    const rect=layer.getBoundingClientRect();
    const col=clamp(Math.floor((e.clientX-rect.left)/CW),0,GRID.cols-1);
    const row=clamp(Math.floor((e.clientY-rect.top)/CH),0,GRID.rows-1);
    const hint=document.getElementById('dropHint');
    hint.style.display='block';
    hint.style.left=col*CW+'px';hint.style.top=row*CH+'px';
    hint.style.width=CW*5+'px';hint.style.height=CH+'px';
  };
  layer.ondragleave=()=>{document.getElementById('dropHint').style.display='none'};
  layer.ondrop=e=>{
    e.preventDefault();
    document.getElementById('dropHint').style.display='none';
    const defId=e.dataTransfer.getData('defId');if(!defId) return;
    const rect=layer.getBoundingClientRect();
    const col=clamp(Math.floor((e.clientX-rect.left)/CW),0,GRID.cols-1);
    const row=clamp(Math.floor((e.clientY-rect.top)/CH),0,GRID.rows-1);
    addEl(defId,col,row);
  };
  layer.onmousemove=e=>{
    const rect=layer.getBoundingClientRect();
    const col=clamp(Math.floor((e.clientX-rect.left)/CW),0,GRID.cols-1);
    const row=clamp(Math.floor((e.clientY-rect.top)/CH),0,GRID.rows-1);
    document.getElementById('cCol').textContent=col;
    document.getElementById('cRow').textContent=row;
    document.getElementById('cPos').textContent=epos(row,col,true);
  };
  layer.onclick=e=>{if(e.target===layer){selId=null;renderEls();renderProps();}};
  drawGrid();
}
function drawGrid(){
  const cv=document.getElementById('gridCv');
  const W=GRID.cols*CW,H=GRID.rows*CH;
  cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,W,H);
  if(!showGrid) return;
  ctx.strokeStyle='rgba(0,255,136,.8)';ctx.lineWidth=.35;
  for(let c=0;c<=GRID.cols;c++){ctx.beginPath();ctx.moveTo(c*CW,0);ctx.lineTo(c*CW,H);ctx.stroke();}
  for(let r=0;r<=GRID.rows;r++){ctx.beginPath();ctx.moveTo(0,r*CH);ctx.lineTo(W,r*CH);ctx.stroke();}
  // Center marker
  ctx.strokeStyle='rgba(0,255,136,.5)';ctx.lineWidth=.7;
  const cx=Math.floor(GRID.cols/2)*CW,cy=Math.floor(GRID.rows/2)*CH;
  ctx.beginPath();ctx.moveTo(cx-14,cy+CH/2);ctx.lineTo(cx+14,cy+CH/2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+CW/2,cy-10);ctx.lineTo(cx+CW/2,cy+CH+10);ctx.stroke();
}
function toggleGrid(){
  showGrid=!showGrid;drawGrid();
  document.getElementById('btnGrid').style.color=showGrid?'var(--green)':'';
}
function cycleBg(){
  bgIdx=(bgIdx+1)%3;
  ['fbg0','fbg1','fbg2'].forEach((id,i)=>{
    document.getElementById(id).style.opacity=i===bgIdx?'1':'0';
  });
  document.getElementById('lbBg').textContent=BG_NAMES[bgIdx];
}
function toggleLive(){
  liveOn=!liveOn;
  const btn=document.getElementById('btnLive');
  const lbl=document.getElementById('lbLive');
  if(liveOn){
    btn.className='tbtn live-on';btn.textContent='⏹ Live';
    lbl.textContent='ON';lbl.style.color='var(--red)';
    LD={rssi:96,v:15.84,mah:0,t:0,thr:62,alt:38,spd:82,esc:43,rpm:24500};
    liveTmr=setInterval(liveTick,1000);
    toast('▶ Live Simulation ON');
  }else{
    btn.className='tbtn ghost';btn.textContent='● Live';
    lbl.textContent='OFF';lbl.style.color='var(--muted2)';
    clearInterval(liveTmr);renderEls();
    toast('⏹ Live Simulation OFF');
  }
}

/* ═══ ELEMENTS ═══ */
function epos(row,col,vis){return vis?(0x800|(row*GRID.cols+col)):0;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pushU(){undo.push(JSON.stringify(els));if(undo.length>40)undo.shift();}
function undoAct(){
  if(!undo.length){toast('Nothing to undo');return;}
  els=JSON.parse(undo.pop());
  selId=null;renderEls();renderProps();updateCLI();buildPal(document.getElementById('palSearch').value);
  toast('↩ Undone');
}
function addEl(defId,col,row){
  const def=EL.find(e=>e.id===defId);if(!def) return;
  const ex=els.find(e=>e.defId===defId);
  pushU();
  if(ex){
    if(col!==undefined){ex.col=col;ex.row=row;}
    renderEls();updateCLI();selEl(ex.id);return;
  }
  const id=defId+'_'+Date.now();
  const c=col!==undefined?col:clamp(Math.floor(GRID.cols/2-4),0,GRID.cols-1);
  const r=row!==undefined?row:clamp(Math.floor(GRID.rows/2),0,GRID.rows-1);
  els.push({id,defId,col:c,row:r,vis:true,color:def.color});
  renderEls();updateCLI();selEl(id);
  document.getElementById('lbEl').textContent=els.length;
  buildPal(document.getElementById('palSearch').value);
}
function renderEls(){
  const layer=document.getElementById('osdLayer');
  layer.innerHTML='';
  els.forEach(el=>{
    const def=EL.find(d=>d.id===el.defId);if(!def) return;
    const mock=liveGet(el.defId,def);
    // Live color warning
    let col=el.color;
    if(liveOn){
      if(el.defId==='battery'&&LD.v<13.5) col='#ff4455';
      else if(el.defId==='avg_cell'&&(LD.v/4)<3.5) col='#ff4455';
      else if(el.defId==='rssi'&&LD.rssi<70) col='#ffb700';
      else if(el.defId==='esc_t'&&LD.esc>70) col='#ff4455';
    }
    const div=document.createElement('div');
    div.className='osd-el'+(el.id===selId?' sel':'')+(el.vis?'':' hid');
    div.style.cssText=`left:${el.col*CW}px;top:${el.row*CH}px;color:${col};`;
    div.dataset.id=el.id;
    div.textContent=mock;
    div.addEventListener('pointerdown',startDrag);
    div.addEventListener('click',e=>{e.stopPropagation();selEl(el.id);});
    layer.appendChild(div);
  });
  document.getElementById('lbEl').textContent=els.length;
}
function selEl(id){selId=id;renderEls();renderProps();updateCLI();}
function delEl(id){
  pushU();
  els=els.filter(x=>x.id!==id);
  if(selId===id)selId=null;
  renderEls();updateCLI();renderProps();
  buildPal(document.getElementById('palSearch').value);
}
function cloneEl(id){
  const el=els.find(x=>x.id===id);if(!el) return;pushU();
  const n={...el,id:el.defId+'_c'+Date.now(),col:clamp(el.col+1,0,GRID.cols-1),row:clamp(el.row+1,0,GRID.rows-1)};
  els.push(n);renderEls();updateCLI();selEl(n.id);
}

/* ═══ DRAG ═══ */
function startDrag(e){
  e.stopPropagation();
  const id=e.currentTarget.dataset.id;
  const el=els.find(x=>x.id===id);if(!el) return;
  pushU();
  e.currentTarget.setPointerCapture(e.pointerId);
  const rect=document.getElementById('osdLayer').getBoundingClientRect();
  drag={id,sx:e.clientX,sy:e.clientY,oc:el.col,or:el.row,rect};
  e.currentTarget.addEventListener('pointermove',onDrag);
  e.currentTarget.addEventListener('pointerup',endDrag,{once:true});
}
function onDrag(e){
  if(!drag) return;
  const el=els.find(x=>x.id===drag.id);if(!el) return;
  el.col=clamp(drag.oc+Math.round((e.clientX-drag.sx)/CW),0,GRID.cols-1);
  el.row=clamp(drag.or+Math.round((e.clientY-drag.sy)/CH),0,GRID.rows-1);
  renderEls();updateCLI();renderProps();
  document.getElementById('cCol').textContent=el.col;
  document.getElementById('cRow').textContent=el.row;
  document.getElementById('cPos').textContent=epos(el.row,el.col,el.vis);
}
function endDrag(e){e.currentTarget.removeEventListener('pointermove',onDrag);drag=null;}

/* ═══ KEYBOARD ═══ */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') return;
  if(e.key==='Escape'){selId=null;renderEls();renderProps();return;}
  if((e.key==='Delete'||e.key==='Backspace')&&selId){delEl(selId);return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undoAct();return;}
  if(!selId) return;
  const el=els.find(x=>x.id===selId);if(!el) return;
  const step=e.shiftKey?5:1;let mv=false;
  if(e.key==='ArrowLeft'){el.col=clamp(el.col-step,0,GRID.cols-1);mv=true;}
  if(e.key==='ArrowRight'){el.col=clamp(el.col+step,0,GRID.cols-1);mv=true;}
  if(e.key==='ArrowUp'){el.row=clamp(el.row-step,0,GRID.rows-1);mv=true;}
  if(e.key==='ArrowDown'){el.row=clamp(el.row+step,0,GRID.rows-1);mv=true;}
  if(mv){e.preventDefault();renderEls();updateCLI();renderProps();}
});

/* ═══ PROPERTIES ═══ */
function renderProps(){
  const body=document.getElementById('propsBody');
  const sel=document.getElementById('selName');
  if(!selId){
    sel.textContent='ไม่มี element ที่เลือก';
    body.innerHTML=`<div class="no-sel">
      <div class="no-sel-ring">🖱️</div>
      <div style="font-family:var(--font-d);font-size:8.5px;letter-spacing:.12em;color:var(--muted2)">SELECT AN ELEMENT</div>
      <div style="font-size:11px;color:var(--muted);margin-top:5px;line-height:1.6">คลิก element บน FPV screen<br>หรือ double-click ใน palette</div>
    </div>`;return;
  }
  const el=els.find(x=>x.id===selId);if(!el) return;
  const def=EL.find(d=>d.id===el.defId);
  sel.textContent=def.n;
  const pos=epos(el.row,el.col,el.vis);
  body.innerHTML=`
  <div class="prop-body">
    <!-- Name & info -->
    <div style="display:flex;align-items:center;gap:9px;padding-bottom:11px;border-bottom:1px solid var(--border);margin-bottom:12px">
      <div style="width:11px;height:11px;border-radius:50%;background:${el.color};box-shadow:0 0 8px ${el.color}60;flex-shrink:0"></div>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text)">${def.n}</div>
        <div style="font-family:var(--font-m);font-size:8.5px;color:var(--muted2)">${def.cli}</div>
        ${def.desc?`<div style="font-size:10px;color:var(--muted);margin-top:2px">${def.desc}</div>`:''}
      </div>
    </div>
    <!-- Position -->
    <div class="psec-title">Position</div>
    <div class="prow">
      <div>
        <label class="plabel">Col (0–${GRID.cols-1})</label>
        <input class="pinput" type="number" min="0" max="${GRID.cols-1}" value="${el.col}" oninput="setP('col',+this.value)">
      </div>
      <div>
        <label class="plabel">Row (0–${GRID.rows-1})</label>
        <input class="pinput" type="number" min="0" max="${GRID.rows-1}" value="${el.row}" oninput="setP('row',+this.value)">
      </div>
    </div>
    <label class="plabel">CLI Position Value</label>
    <div class="pval">
      <span>${pos} <span style="color:var(--muted2);font-size:9px">(0x${pos.toString(16).toUpperCase()})</span></span>
      <button type="button" onclick="navigator.clipboard.writeText('${pos}').then(()=>toast('✓ Copied ${pos}'))"
        style="background:none;border:1px solid var(--border);border-radius:4px;color:var(--muted2);font-size:10px;cursor:pointer;padding:2px 7px">⎘</button>
    </div>
    <!-- Color -->
    <div class="psec-title" style="margin-top:12px">Color</div>
    <div class="swatch-row">
      ${COLORS.map(c=>`<div class="sw${el.color===c?' on':''}" style="background:${c}" onclick="setP('color','${c}')"></div>`).join('')}
      <input type="color" class="sw-custom" value="${el.color}" oninput="setP('color',this.value)" title="Custom color">
    </div>
    <!-- Visibility -->
    <div class="psec-title" style="margin-top:12px">Visibility</div>
    <div class="tog" onclick="setP('vis',${!el.vis})">
      <span class="tog-lbl">${def.n} — ${el.vis?'✅ Visible':'❌ Hidden'}</span>
      <div class="tog-pill${el.vis?' on':''}"></div>
    </div>
    <!-- Preview -->
    <div class="psec-title" style="margin-top:4px">FPV Preview</div>
    <div class="mock-preview" style="color:${el.color}">${def.mock}</div>
    <!-- Actions -->
    <div class="pbtns">
      <button type="button" class="pbtn" style="background:rgba(255,68,85,.07);border-color:rgba(255,68,85,.22);color:var(--red)" onclick="delEl('${el.id}')">🗑 Delete</button>
      <button type="button" class="pbtn" style="background:rgba(0,255,136,.07);border-color:rgba(0,255,136,.22);color:var(--green)" onclick="cloneEl('${el.id}')">⎘ Clone</button>
    </div>
  </div>`;
}
function setP(k,v){
  const el=els.find(x=>x.id===selId);if(!el) return;
  if(k==='col') el.col=clamp(Math.round(v),0,GRID.cols-1);
  else if(k==='row') el.row=clamp(Math.round(v),0,GRID.rows-1);
  else el[k]=v;
  renderEls();updateCLI();renderProps();
}

/* ═══ CLI GENERATOR ═══ */
function updateCLI(){
  const out=document.getElementById('cliOut');
  if(!els.length){out.innerHTML='<span class="cc"># เพิ่ม element เพื่อ generate CLI commands...</span>';return;}
  const mode=document.querySelector('.mdbtn.active')?.dataset.mode==='hd'?'HD':'ANALOG';
  const byG={};
  els.forEach(el=>{
    const def=EL.find(d=>d.id===el.defId);if(!def) return;
    if(!byG[def.grp]) byG[def.grp]=[];
    byG[def.grp].push({el,def});
  });
  let h=`<span class="cc"># ═══════════════════════════════════════</span><br>
<span class="cc"># OBIXConfig Doctor — OSD Studio v3</span><br>
<span class="cc"># Mode: ${mode} Grid ${GRID.cols}×${GRID.rows} | ${els.length} elements</span><br>
<span class="cc"># ═══════════════════════════════════════</span><br><br>
<span class="cs">osd_profile 1</span><br><br>`;
  Object.entries(byG).forEach(([g,items])=>{
    h+=`<span class="cc"># ${g}</span><br>`;
    items.forEach(({el,def})=>{
      const pos=epos(el.row,el.col,el.vis);
      h+=`<span class="cmd">set </span><span class="ck">${def.cli}</span><span class="cmd"> = </span><span class="cv">${pos}</span><span class="cc">  # col=${el.col} row=${el.row}${el.vis?'':' [HIDDEN]'}</span><br>`;
    });
    h+=`<br>`;
  });
  h+=`<span class="cs">save</span>`;
  out.innerHTML=h;
}
function getCLIText(){
  const mode=document.querySelector('.mdbtn.active')?.dataset.mode==='hd'?'HD':'ANALOG';
  const lines=[
    '# ═══════════════════════════════════════',
    '# OBIXConfig Doctor — OSD Studio v3',
    `# Mode: ${mode} Grid ${GRID.cols}×${GRID.rows} | ${els.length} elements`,
    `# Generated: ${new Date().toLocaleString('th-TH')}`,
    '# ═══════════════════════════════════════',
    '','osd_profile 1',''
  ];
  const byG={};
  els.forEach(el=>{
    const def=EL.find(d=>d.id===el.defId);if(!def) return;
    if(!byG[def.grp]) byG[def.grp]=[];
    byG[def.grp].push({el,def});
  });
  Object.entries(byG).forEach(([g,items])=>{
    lines.push(`# ${g}`);
    items.forEach(({el,def})=>lines.push(`set ${def.cli} = ${epos(el.row,el.col,el.vis)}`));
    lines.push('');
  });
  lines.push('save');
  return lines.join('\n');
}
function copyCLI(){navigator.clipboard.writeText(getCLIText()).then(()=>toast('✅ คัดลอก CLI แล้ว'));}
function exportCLI(){dl('betaflight_osd.txt',getCLIText());toast('💾 บันทึก betaflight_osd.txt');}
function exportJSON(){
  const d={version:3,grid:GRID,mode:document.querySelector('.mdbtn.active')?.dataset.mode,
    created:new Date().toISOString(),
    elements:els.map(el=>{const def=EL.find(d=>d.id===el.defId);
      return{defId:el.defId,cliKey:def?.cli,name:def?.n,col:el.col,row:el.row,vis:el.vis,color:el.color};})};
  dl('osd_layout.json',JSON.stringify(d,null,2));toast('📤 บันทึก osd_layout.json');
}
function loadJSON(e){
  const f=e.target.files[0];if(!f) return;
  const rd=new FileReader();
  rd.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      if(d.elements){
        pushU();
        els=d.elements.map(el=>({...el,id:el.defId+'_'+Date.now()+Math.random()}));
        renderEls();updateCLI();renderProps();buildPal();
        toast('📂 โหลด JSON — '+els.length+' elements');
      }
    }catch{toast('❌ JSON format ไม่ถูกต้อง');}
    e.target.value='';
  };rd.readAsText(f);
}
function dl(name,text){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));
  a.download=name;a.click();URL.revokeObjectURL(a.href);
}

/* ═══ PRESETS ═══ */
function applyPreset(name,btn){
  const pd=PRESETS[name];if(!pd) return;
  if(els.length>0&&!confirm(`ล้าง layout ปัจจุบันแล้วโหลด "${name}" preset?`)) return;
  pushU();els=[];
  pd.forEach(item=>{
    const def=EL.find(d=>d.id===item.id);if(!def) return;
    els.push({id:item.id+'_'+Date.now()+Math.random(),defId:item.id,
      col:item.c,row:item.r,vis:true,color:def.color});
  });
  selId=null;renderEls();updateCLI();renderProps();
  buildPal(document.getElementById('palSearch').value);
  document.querySelectorAll('.ppill').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  toast('✅ โหลด preset: '+name);
}

/* ═══ UTILS ═══ */
function clearCanvas(){
  if(els.length>0&&!confirm('ล้าง elements ทั้งหมด?')) return;
  pushU();els=[];selId=null;renderEls();updateCLI();renderProps();buildPal();toast('🗑 Cleared');
}
function centerAll(){
  els.forEach(el=>{el.col=clamp(Math.floor(GRID.cols/2-3),0,GRID.cols-1);
    el.row=clamp(Math.floor(GRID.rows/2),0,GRID.rows-1);});
  renderEls();updateCLI();renderProps();
}
function snapToGrid(){
  els.forEach(el=>{el.col=clamp(Math.round(el.col),0,GRID.cols-1);
    el.row=clamp(Math.round(el.row),0,GRID.rows-1);});
  renderEls();updateCLI();toast('⌗ Snapped to grid');
}
function switchMode(btn){
  document.querySelectorAll('.mdbtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if(btn.dataset.mode==='hd'){GRID={cols:53,rows:20};CW=14;CH=20;}
  else{GRID={cols:30,rows:13};CW=20;CH=26;}
  els.forEach(el=>{el.col=clamp(el.col,0,GRID.cols-1);el.row=clamp(el.row,0,GRID.rows-1);});
  initCanvas();renderEls();updateCLI();
}
let toastTmr=null;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTmr);toastTmr=setTimeout(()=>t.classList.remove('show'),2100);
}

/* ═══ INIT ═══ */
buildPal();
initCanvas();
const fBtn=document.querySelector('.ppill.pp-f');
applyPreset('Freestyle',fBtn);
