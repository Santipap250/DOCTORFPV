// static/js/blackbox.js — Batch C: extracted from templates/blackbox.html main inline <script>. No logic change.

'use strict';
let chartInstances = {};

/* ── Upload / Drag-drop ── */
const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover', e=>{e.preventDefault();uploadZone.classList.add('drag-over')});
uploadZone.addEventListener('dragleave', ()=>uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e=>{
  e.preventDefault();uploadZone.classList.remove('drag-over');
  const file=e.dataTransfer.files[0]; if(file) processFile(file);
});
uploadZone.addEventListener('click', e=>{
  if(e.target.classList.contains('upload-btn')||e.target.closest('.upload-btn')) return;
  document.getElementById('csvFileInput').click();
});
function handleFileSelect(evt){const file=evt.target.files[0]; if(file) processFile(file);}

function processFile(file){
  if(file.size > 10*1024*1024){showToast('❌ ไฟล์ใหญ่เกิน 10MB');return}
  const reader=new FileReader();
  reader.onload=e=>sendToAnalyze(e.target.result, file.name);
  setStatus('กำลังอ่านไฟล์...');
  showAnalyzing();
  reader.readAsText(file);
}

function sendToAnalyze(csvText, filename){
  setStatus(`กำลังถอดรหัส ${filename}...`);
  fetch('/blackbox/analyze', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content || ''
    },
    body: JSON.stringify({csv: csvText, filename: filename || 'upload.csv'})
  })
  .then(r=>{ if(!r.ok) return r.json().then(e=>Promise.reject(e)); return r.json(); })
  .then(data=>{
    hideAnalyzing();
    if(data.error){ showToast('❌ '+data.error); return; }
    renderResults(data);
  })
  .catch(err=>{
    hideAnalyzing();
    showToast('❌ '+(err.error||err.message||'เกิดข้อผิดพลาด'));
  });
}

function showAnalyzing(){
  document.getElementById('uploadZone').style.display='none';
  document.getElementById('analyzingBar').classList.add('show');
  document.getElementById('resultsSection').classList.remove('show');
}
function hideAnalyzing(){ document.getElementById('analyzingBar').classList.remove('show'); }
function setStatus(msg){ document.getElementById('analyzeStatus').textContent=msg; }
function resetUpload(){
  document.getElementById('uploadZone').style.display='';
  document.getElementById('resultsSection').classList.remove('show');
  document.getElementById('csvFileInput').value='';
  Object.values(chartInstances).forEach(c=>{try{c.destroy()}catch(e){}});
  chartInstances={};
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ── Render ── */
function renderResults(data){
  renderMeta(data.meta||{});
  renderGrade(data.pid_quality||{});
  renderOscillations(data.oscillations||{});
  renderMotors(data.motor_balance||{});
  renderBattery(data.battery||{});
  renderThrottle(data.throttle||{});
  renderCliRecs(data.recommendations||[]);
  document.getElementById('resultsSection').classList.add('show');
  document.getElementById('resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
}

/* Meta strip */
function renderMeta(meta){
  const strip=document.getElementById('metaStrip');
  const items=[
    ['ROWS', fmtNum(meta.rows_analyzed)],
    ['DURATION', meta.duration_s>0 ? meta.duration_s+'s' : 'N/A'],
    ['FIRMWARE', meta.firmware||'Unknown'],
    ['COLUMNS', (meta.columns_found||[]).length+' found'],
  ];
  strip.innerHTML = items.map(([k,v])=>
    `<div class="meta-pill"><span class="meta-pill-key">${k}</span><span class="meta-pill-val">${esc(String(v))}</span></div>`
  ).join('');
}

/* Grade — glowing radial gauge */
function renderGrade(pq){
  const grade=pq.grade||'A', score=pq.score??100;
  const all=[...(pq.issues||[]),...(pq.findings||[])];
  const color = score>=90?'var(--gr)':score>=75?'var(--bl)':score>=55?'var(--am)':'var(--rd)';
  const CIRC = 2*Math.PI*52;
  const dash = CIRC*Math.max(0,Math.min(100,score))/100;

  const issueHtml = all.length===0
    ? `<div class="issue-row issue-good"><span class="issue-badge badge-good">GOOD</span>
        <div class="issue-body"><div class="issue-title">ไม่พบปัญหา</div><div class="issue-desc">PID และ filter ทำงานได้ดี</div></div></div>`
    : all.map(issue=>{
        const sev=issue.severity||'info';
        return `<div class="issue-row issue-${sev}"><span class="issue-badge badge-${sev}">${sev.toUpperCase()}</span>
          <div class="issue-body"><div class="issue-title">${esc(issue.axis||'')} ${esc(issue.diagnosis||issue.msg||issue.type||'')}</div>
          ${issue.fix?`<div class="issue-fix">💡 ${esc(issue.fix)}</div>`:''}</div></div>`;
      }).join('');

  document.getElementById('gradeCard').innerHTML = `
    <div class="grade-left">
      <div class="grade-ring-wrap">
        <svg viewBox="0 0 120 120">
          <circle class="grade-ring-bg" cx="60" cy="60" r="52"/>
          <circle class="grade-ring-fill" id="gradeRingFill" cx="60" cy="60" r="52"
            stroke="${color}" stroke-dasharray="0 ${CIRC.toFixed(1)}"
            style="filter:drop-shadow(0 0 6px ${color})"/>
        </svg>
        <div class="grade-ring-center">
          <div class="grade-letter-big grade-${grade}">${grade}</div>
          <div class="grade-score-sub">${score}/100</div>
        </div>
      </div>
      <div class="grade-label">PID GRADE</div>
    </div>
    <div class="grade-right"><div class="grade-issues">${issueHtml}</div></div>`;

  setTimeout(()=>{
    const ring=document.getElementById('gradeRingFill');
    if(ring) ring.setAttribute('stroke-dasharray', dash.toFixed(1)+' '+CIRC.toFixed(1));
  },120);
}

/* Oscillations — mini waveform svg per axis */
function waveSvg(severity, freq){
  const col = severity==='critical'||severity==='danger' ? '#ff3355' : severity==='warning' ? '#ffb020' : severity==='info' ? '#5b8cff' : '#00ff88';
  const amp = severity==='critical'||severity==='danger' ? 13 : severity==='warning' ? 9 : 5;
  const cycles = Math.max(3, Math.min(10, Math.round((freq||40)/25)));
  let d = 'M0,17 ';
  const pts = 60;
  for(let i=0;i<=pts;i++){
    const x = i/pts*300;
    const y = 17 + Math.sin(i/pts*Math.PI*2*cycles)*amp*(0.4+0.6*Math.sin(i/pts*Math.PI));
    d += `L${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return `<svg viewBox="0 0 300 34" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${col}" stroke-width="1.6" opacity="0.85"/></svg>`;
}

function renderOscillations(osc){
  const axes=['roll','pitch','yaw'];
  const labels={roll:'ROLL',pitch:'PITCH',yaw:'YAW'};
  document.getElementById('axisGrid').innerHTML = axes.map(ax=>{
    const d=osc[ax]||{};
    const grms=d.gyro_rms??'-', freq=d.gyro_freq_hz??0, drms=d.d_rms;
    const sev=d.osc_severity||'good';
    const cls='val-'+sev;
    return `<div class="axis-card ax-${ax}">
      <div class="axis-name">${labels[ax]}</div>
      <div class="axis-wave">${waveSvg(sev, freq)}</div>
      <div class="axis-stat"><span class="axis-stat-label">GYRO RMS</span><span class="axis-stat-val ${cls}">${grms}</span></div>
      <div class="axis-stat"><span class="axis-stat-label">DOMINANT FREQ</span><span class="axis-stat-val">${freq>0?freq+' Hz':'—'}</span></div>
      ${drms!==undefined ? `<div class="axis-stat"><span class="axis-stat-label">D-TERM NOISE</span><span class="axis-stat-val val-${d.d_severity||'good'}">${drms}</span></div>` : ''}
      <div class="axis-sub">${esc(d.osc_msg||'')}</div>
    </div>`;
  }).join('');
}

/* Motors — X-frame diagram + cards */
function renderMotors(mb){
  const sev=mb.balance_severity||'good';
  const balRow=document.getElementById('motorBalanceRow');
  balRow.className='issue-row issue-'+sev;
  balRow.innerHTML = `<span class="issue-badge badge-${sev}">${sev.toUpperCase()}</span>
    <div class="issue-body"><div class="issue-title">Diagonal Imbalance ${mb.imbalance_pct??'—'}%</div>
    <div class="issue-desc">${esc(mb.balance_msg||'')}</div>
    ${(mb.stuck_motors||[]).length>0 ? `<div class="issue-fix">⚠️ Motor ผิดปกติ: ${mb.stuck_motors.join(', ')}</div>` : ''}</div>`;

  const stats = mb.motor_stats || [];
  const avgs = stats.filter(s=>s.available).map(s=>s.avg);
  const maxAvg = avgs.length ? Math.max(...avgs) : 2000;
  const posClass = ['tl','tr','bl','br'];

  // X-frame visual (motors 0-3 → corners; standard BF order: rear-right, front-right, rear-left, front-left ish — just place by id)
  document.getElementById('motorFrame').innerHTML = `
    <div class="motor-frame-x"><svg viewBox="0 0 200 200"><line x1="20" y1="20" x2="180" y2="180" stroke="rgba(255,255,255,.08)" stroke-width="2"/><line x1="180" y1="20" x2="20" y2="180" stroke="rgba(255,255,255,.08)" stroke-width="2"/><circle cx="100" cy="100" r="22" fill="none" stroke="rgba(0,229,255,.18)" stroke-width="1.5"/></svg></div>
    ${stats.map((s,i)=>{
      if(!s.available) return '';
      const pct = maxAvg>0 ? Math.round(s.avg/maxAvg*100) : 0;
      return `<div class="motor-node ${posClass[i]||'tl'}">
        <div class="motor-node-id">M${s.id+1}</div>
        <div class="motor-node-val">${s.avg}</div>
        <div class="motor-node-bar"><div class="motor-node-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('')}`;

  document.getElementById('motorGrid').innerHTML = stats.map(s=>{
    if(!s.available) return `<div class="motor-card"><div class="motor-id">MOTOR ${s.id+1}</div><div style="color:var(--t3);font-size:12px">N/A</div></div>`;
    const pct = maxAvg>0 ? Math.round(s.avg/maxAvg*100) : 0;
    return `<div class="motor-card">
      <div class="motor-id">MOTOR ${s.id+1}</div>
      <div class="motor-avg">${s.avg}</div>
      <div class="motor-range">${s.min} – ${s.max}</div>
      <div class="motor-bar-wrap"><div class="motor-bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  const cs = mb.chart_series || {};
  const keys = Object.keys(cs);
  if(keys.length){
    document.getElementById('motorChartWrap').style.display='';
    renderLineChart('motorChart', {
      labels: cs[keys[0]].map((_,i)=>i),
      datasets: keys.map((k,i)=>({
        label:'Motor '+(parseInt(k.replace('m',''))+1),
        data:cs[k],
        borderColor:['#00e5ff','#ffb020','#ff3d9a','#00ff88'][i]||'#999',
        borderWidth:1.5, pointRadius:0, tension:0.3, fill:false,
      }))
    });
  }
}

/* Battery — gauge + cards */
function renderBattery(batt){
  const statRow=document.getElementById('battStatRow');
  const gaugeWrap=document.getElementById('battGaugeWrap');
  if(!batt.available){
    gaugeWrap.style.display='none';
    statRow.innerHTML=`<div class="stat-card" style="grid-column:1/-1;text-align:center;color:var(--t3)">ไม่พบข้อมูล voltage ใน CSV</div>`;
    return;
  }
  const cells = batt.cells||4;
  const nomV = cells*4.2, minSafeV = cells*3.3;
  const vmin = batt.v_min||0;
  const pct = Math.max(0,Math.min(100, (vmin-minSafeV)/(nomV-minSafeV)*100));

  gaugeWrap.style.display='';
  document.getElementById('battGaugeMin').textContent = minSafeV.toFixed(1)+'V';
  document.getElementById('battGaugeMax').textContent = nomV.toFixed(1)+'V';
  setTimeout(()=>{
    document.getElementById('battGaugeMarker').style.left = pct+'%';
  },150);

  const cards=[
    ['CELLS', cells+'S', ''],
    ['V MIN', batt.v_min+'V', batt.cell_msg],
    ['SAG', batt.sag_v+'V', batt.sag_msg],
    ['V/CELL MIN', batt.v_per_cell_min+'V', ''],
  ];
  statRow.innerHTML = cards.map(([label,val,sub])=>
    `<div class="stat-card"><div class="stat-card-label">${label}</div><div class="stat-card-val">${esc(val)}</div>
     ${sub?`<div class="stat-card-sub">${esc(sub)}</div>`:''}</div>`
  ).join('');

  if(batt.chart_vbat && batt.chart_vbat.length){
    document.getElementById('battChartWrap').style.display='';
    renderLineChart('battChart', {
      labels: batt.chart_vbat.map((_,i)=>i),
      datasets:[{label:'Voltage (V)', data:batt.chart_vbat, borderColor:'#ffb020',
        borderWidth:2, pointRadius:0, tension:0.3, fill:{target:'origin', above:'rgba(255,176,32,.07)'}}]
    });
  }
}

/* Throttle — stacked bar + buckets */
function renderThrottle(thr){
  const dist=document.getElementById('thrDist');
  const stack=document.getElementById('thrStackbar');
  const badge=document.getElementById('thrStyleBadge');
  if(!thr.available){
    stack.innerHTML=''; badge.innerHTML='';
    dist.innerHTML=`<div style="grid-column:1/-1;text-align:center;color:var(--t3);padding:20px">ไม่พบข้อมูล throttle ใน CSV</div>`;
    return;
  }
  const buckets=[
    ['HOVER', thr.distribution.hover, '0–20%', '#00ff88'],
    ['MID',   thr.distribution.mid,   '20–60%','#5b8cff'],
    ['HIGH',  thr.distribution.high,  '60–85%','#ffb020'],
    ['FULL',  thr.distribution.full,  '85–100%','#ff3355'],
  ];
  stack.innerHTML = buckets.map(([l,pct,r,c])=>`<div class="thr-seg" style="width:${pct}%;background:${c}" title="${l} ${pct}%"></div>`).join('');
  dist.innerHTML = buckets.map(([label,pct,range,color])=>
    `<div class="thr-bucket"><div class="thr-bucket-pct" style="color:${color}">${pct}%</div>
     <div class="thr-bucket-label">${label}</div><div class="thr-bucket-range">${range}</div></div>`
  ).join('');
  badge.innerHTML = `<div class="meta-pill" style="margin-bottom:14px;display:inline-flex">
    <span class="meta-pill-key">FLIGHT STYLE</span><span class="meta-pill-val">${esc(thr.style_guess||'—')}</span></div>`;

  if(thr.chart_thr && thr.chart_thr.length){
    document.getElementById('thrChartWrap').style.display='';
    renderLineChart('thrChart', {
      labels: thr.chart_thr.map((_,i)=>i),
      datasets:[{label:'Throttle %', data:thr.chart_thr, borderColor:'#00ff88',
        borderWidth:1.5, pointRadius:0, tension:0.4, fill:{target:'origin', above:'rgba(0,255,136,.07)'}}]
    });
  }
}

/* CLI Recommendations */
function renderCliRecs(recs){
  const list=document.getElementById('cliRecsList');
  if(!recs.length){
    list.innerHTML=`<div class="no-issues"><div class="no-issues-icon">✅</div>
      <div class="no-issues-title">ไม่มีคำแนะนำ CLI</div>
      <div class="no-issues-sub">การตั้งค่าดูดีจากข้อมูล Blackbox ที่วิเคราะห์</div></div>`;
    return;
  }
  list.innerHTML = recs.map((r,i)=>{
    const sev=r.severity||'info';
    return `<div class="cli-rec sev-${sev}" id="rec-${i}">
      <div class="cli-rec-header" onclick="toggleRec(${i})">
        <span class="cli-rec-num">#${r.priority||i+1}</span>
        <span class="issue-badge badge-${sev}">${sev.toUpperCase()}</span>
        <div><div class="cli-rec-title">${esc(r.title||'')}</div><div class="cli-rec-reason">${esc(r.reason||'')}</div></div>
        <span class="cli-chevron">▼</span>
      </div>
      ${r.cli ? `<div class="cli-rec-body"><div class="cli-code" id="cliCode-${i}"><span class="cli-copy-btn" onclick="copyCli(${i})">COPY</span>${esc(r.cli)}</div></div>` : ''}
    </div>`;
  }).join('');
  const first=document.querySelector('.cli-rec'); if(first) first.classList.add('open');
}

/* Chart helper */
function renderLineChart(canvasId, chartData){
  if(chartInstances[canvasId]){ try{chartInstances[canvasId].destroy()}catch(e){} }
  const ctx=document.getElementById(canvasId); if(!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type:'line', data:chartData,
    options:{
      responsive:true, maintainAspectRatio:true, animation:{duration:600},
      interaction:{intersect:false,mode:'index'},
      plugins:{
        legend:{labels:{color:'#7088a0', font:{family:'JetBrains Mono',size:10}, boxWidth:12}},
        tooltip:{backgroundColor:'#080d16', borderColor:'rgba(255,255,255,.1)', borderWidth:1,
          titleColor:'#dce8f0', bodyColor:'#7088a0', titleFont:{family:'JetBrains Mono',size:11}}
      },
      scales:{
        x:{display:false},
        y:{grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'#7088a0', font:{family:'JetBrains Mono',size:10}}}
      }
    }
  });
}

/* UI helpers */
function toggleRec(i){ document.getElementById('rec-'+i).classList.toggle('open'); }
function copyCli(i){
  const el=document.getElementById('cliCode-'+i);
  const text = el ? el.innerText.replace('COPY','').trim() : '';
  if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>showToast('✓ คัดลอก CLI แล้ว'));
  else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy')}catch(e){} document.body.removeChild(ta); showToast('✓ คัดลอก CLI แล้ว'); }
}
function showToast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtNum(n){ return n ? Number(n).toLocaleString() : '—'; }
