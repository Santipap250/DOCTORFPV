// static/js/tuning-log.js — Batch E: extracted from templates/tuning_log.html inline <script>. No logic change.

'use strict';
const STORE_KEY='obix_tuning_log_v1';
let logs=[];
let selectedResult='BETTER';
let selectedSymptoms=[];

function load(){
  try{const d=localStorage.getItem(STORE_KEY);if(d)logs=JSON.parse(d);}catch(e){logs=[];}
}
function save(){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(logs));}catch(e){}
}

function gv(id){return(document.getElementById(id)?.value||'').trim();}
function gn(id){const v=parseInt(document.getElementById(id)?.value);return isNaN(v)?null:v;}

function openModal(){
  document.getElementById('modal').classList.add('open');
  // Set today's date
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('m_date').value=today;
  selectedResult='BETTER';selectedSymptoms=[];
  document.querySelectorAll('#resultPills .rpill').forEach(p=>{
    p.classList.remove('on-g','on-a','on-r');
  });
  document.querySelector('#resultPills .rpill[data-v="BETTER"]').classList.add('on-g');
  document.querySelectorAll('#symptomPills .rpill').forEach(p=>p.classList.remove('on-a'));
}
function closeModal(){document.getElementById('modal').classList.remove('open');}
document.getElementById('modal').addEventListener('click',e=>{
  if(e.target===document.getElementById('modal'))closeModal();
});

// result pills — ใช้ #resultPills เพื่อไม่ conflict กับ #symptomPills
document.querySelectorAll('#resultPills .rpill').forEach(p=>{
  p.addEventListener('click',()=>{
    document.querySelectorAll('#resultPills .rpill').forEach(x=>x.classList.remove('on-g','on-a','on-r'));
    const cls=p.dataset.v==='BETTER'?'on-g':p.dataset.v==='WORSE'?'on-r':'on-a';
    p.classList.add(cls); selectedResult=p.dataset.v;
  });
});
document.getElementById('symptomPills').querySelectorAll('.rpill').forEach(p=>{
  p.addEventListener('click',()=>{
    p.classList.toggle('on-a');
    const v=p.dataset.v;
    if(p.classList.contains('on-a')){if(!selectedSymptoms.includes(v))selectedSymptoms.push(v);}
    else{selectedSymptoms=selectedSymptoms.filter(x=>x!==v);}
  });
});

function saveSession(){
  const entry={
    id:Date.now(),
    date:gv('m_date')||new Date().toISOString().split('T')[0],
    name:gv('m_name')||'Unnamed Session',
    loc:gv('m_loc'),
    weather:gv('m_weather')||'☀️ แดดจัด ลมน้อย',
    result:selectedResult,
    symptoms:[...selectedSymptoms],
    note:gv('m_note'),
    pid:{
      rp:gn('m_rp'),ri:gn('m_ri'),rd:gn('m_rd'),
      pp:gn('m_pp'),pi:gn('m_pi'),pd:gn('m_pd'),
      yp:gn('m_yp'),yi:gn('m_yi'),yd:gn('m_yd'),
    }
  };
  logs.unshift(entry);save();closeModal();renderLog();
  // clear form
  ['m_name','m_loc','m_note','m_rp','m_ri','m_rd','m_pp','m_pi','m_pd','m_yp','m_yi','m_yd']
    .forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
}

function deltaHtml(cur,prev,cls){
  if(cur==null||prev==null)return `<span class="pval-v" style="color:var(--${cls})">${cur??'—'}</span>`;
  const d=cur-prev;
  const dCls=d>0?'up':d<0?'dn':'eq';
  const dStr=d>0?`+${d}`:d===0?'':d.toString();
  return `<span class="pval-v" style="color:var(--${cls})">${cur}<span class="delta ${dCls}">${dStr}</span></span>`;
}

function renderLog(){
  const q=document.getElementById('searchInput').value.toLowerCase();
  const rf=document.getElementById('filterResult').value;
  let filtered=logs.filter(e=>{
    const matchQ=!q||(e.name+' '+e.note+' '+e.loc).toLowerCase().includes(q);
    const matchR=!rf||e.result===rf;
    return matchQ&&matchR;
  });

  const ok=logs.filter(e=>e.result==='BETTER').length;
  const bad=logs.filter(e=>e.result==='WORSE').length;
  document.getElementById('totalSessions').textContent=logs.length;
  document.getElementById('totalOK').textContent=ok;
  document.getElementById('totalBad').textContent=bad;

  const tl=document.getElementById('timeline');
  if(!filtered.length){
    tl.innerHTML=`<div class="empty"><div class="empty-ico">📋</div>
      <div class="empty-title">${logs.length?'ไม่พบ session ที่ตรงกัน':'ยังไม่มี session'}  </div>
      <div class="empty-sub">${logs.length?'ลองเปลี่ยน filter':'กด "+ NEW SESSION" เพื่อบันทึก session แรก'}</div></div>`;
    return;
  }

  tl.innerHTML=filtered.map((e,i)=>{
    const prev=filtered[i+1];
    const dotCls=e.result==='BETTER'?'ok':e.result==='WORSE'?'bad':'warn';
    const badgeCls=e.result==='BETTER'?'badge-ok':e.result==='WORSE'?'badge-bad':'badge-warn';
    const badgeTxt=e.result==='BETTER'?'🟢 Better':e.result==='WORSE'?'🔴 Worse':'🟡 Neutral';
    const pid=e.pid||{};
    const pp=prev?.pid||{};

    const axHtml=(lbl,keys,cls)=>`
      <div class="pid-block">
        <div class="pid-block-lbl ${cls}">${lbl}</div>
        <div class="pid-vals">
          ${keys.map(([k,pk])=>`<div class="pval"><span class="pval-k">${k.toUpperCase()}</span>
            ${deltaHtml(pid[pk],pp[pk],cls)}</div>`).join('')}
        </div>
      </div>`;

    const tagHtml=e.symptoms?.length?e.symptoms.map(s=>`<span class="etag">${s}</span>`).join(''):'';

    return `<div class="tl-entry">
      <div class="tl-dot ${dotCls}"></div>
      <div class="entry-card">
        <div class="entry-hd">
          <div class="entry-meta">
            <div class="entry-title">${e.name}</div>
            <div class="entry-date">📅 ${e.date}${e.loc?' · 📍 '+e.loc:''} · ${e.weather}</div>
          </div>
          <span class="entry-badge ${badgeCls}">${badgeTxt}</span>
        </div>
        <div class="entry-pid">
          ${axHtml('ROLL',[['p','rp'],['i','ri'],['d','rd']],'r')}
          ${axHtml('PITCH',[['p','pp'],['i','pi'],['d','pd']],'p')}
          ${axHtml('YAW',[['p','yp'],['i','yi'],['d','yd']],'y')}
        </div>
        ${e.note?`<div class="entry-note">${e.note}</div>`:''}
        ${tagHtml?`<div class="entry-tags">${tagHtml}</div>`:''}
        <div class="entry-actions">
          <button class="ea-btn ea-del" onclick="deleteEntry(${e.id})">🗑 ลบ</button>
          <button class="ea-btn ea-export" onclick="exportEntry(${e.id})">⬇️ Export</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function deleteEntry(id){
  if(!confirm('ลบ session นี้?'))return;
  logs=logs.filter(e=>e.id!==id);save();renderLog();
}
function exportEntry(id){
  const e=logs.find(x=>x.id===id);if(!e)return;
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(e,null,2));
  a.download=`tuning_${e.date}_${e.name.replace(/\s+/g,'_')}.json`;a.click();
}
function exportAll(){
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(logs,null,2));
  a.download=`obix_tuning_log_${new Date().toISOString().split('T')[0]}.json`;a.click();
}

load();renderLog();
