// static/js/leaderboard.js — Batch E: extracted from templates/leaderboard.html inline <script>. No logic change.

'use strict';
const VKEY='obix_lb_votes_v1';
const UKEY='obix_lb_user_v1';
let filter='all', selectedStyle='FREESTYLE';
let voted=JSON.parse(localStorage.getItem(VKEY)||'{}');

// Seed data
const SEED=[
  {id:1,name:'5" Freestyle Beast',pilot:'@maxxfpv',size:'5"',batt:'4S 1500mAh',style:'FREESTYLE',
   pid:{rp:48,ri:90,rd:38,pp:52,pi:90,pd:40,yp:40,yi:90,yd:0},
   note:'tune ใน BF 4.5 ลมน้อย lock-in ดีมาก ไม่มี propwash เลย',votes:127,
   cli:'set rates_type = ACTUAL\nset roll_rc_rate = 120\nset p_roll = 48\nset i_roll = 90\nset d_roll = 38\nset p_pitch = 52\nset i_pitch = 90\nset d_pitch = 40\nsave'},
  {id:2,name:'6" LR Champion',pilot:'@skyrange',size:'6"',batt:'6S 3000mAh',style:'LONG RANGE',
   pid:{rp:38,ri:85,rd:22,pp:40,pi:85,pd:24,yp:32,yi:82,yd:0},
   note:'LR setup ลม 20 km/h ยังนิ่งดีมาก filter conservative เน้น efficiency',votes:94,
   cli:'set rates_type = ACTUAL\nset roll_rc_rate = 80\nset p_roll = 38\nset i_roll = 85\nset d_roll = 22\nsave'},
  {id:3,name:'Race Knife',pilot:'@speedblade',size:'5"',batt:'6S 1300mAh',style:'RACING',
   pid:{rp:55,ri:83,rd:43,pp:60,pi:83,pd:46,yp:46,yi:83,yd:0},
   note:'Race setup P สูง D ค่อนข้างหนัก crispy มาก ใส่ใบ Gemfan',votes:88,
   cli:'set rates_type = ACTUAL\nset roll_rc_rate = 180\nset p_roll = 55\nset i_roll = 83\nset d_roll = 43\nsave'},
  {id:4,name:'Cine Smooth',pilot:'@cinemafpv',size:'3.5"',batt:'4S 850mAh',style:'CINEMATIC',
   pid:{rp:46,ri:88,rd:26,pp:49,pi:88,pd:28,yp:36,yi:85,yd:0},
   note:'Cinewhoop 3.5" เน้นความนิ่ง ไม่สั่น filter หนักหน่อยแต่ video สวยมาก',votes:72,
   cli:'set rates_type = ACTUAL\nset roll_rc_rate = 70\nset p_roll = 46\nset i_roll = 88\nset d_roll = 26\nsave'},
  {id:5,name:'Night Ripper',pilot:'@darkninja',size:'5"',batt:'4S 1300mAh',style:'FREESTYLE',
   pid:{rp:50,ri:92,rd:40,pp:54,pi:92,pd:42,yp:42,yi:92,yd:0},
   note:'tune สำหรับบินกลางคืน ปรับ I สูงขึ้นเล็กน้อยเพราะ wind กลางคืนไม่สม่ำเสมอ',votes:61,
   cli:'set rates_type = ACTUAL\nset roll_rc_rate = 130\nset p_roll = 50\nset i_roll = 92\nset d_roll = 40\nsave'},
];

let configs=[...SEED,...(JSON.parse(localStorage.getItem(UKEY)||'[]'))];

function score(c){return c.votes*10;}
function sortedFiltered(){
  return configs
    .filter(c=>filter==='all'||c.style===filter)
    .sort((a,b)=>b.votes-a.votes);
}

function styleCls(s){
  if(s==='RACING')return'st-race';if(s==='LONG RANGE')return'st-lr';
  if(s==='CINEMATIC')return'st-cine';return'st-free';
}

function renderPodium(list){
  const pod=document.getElementById('podium');
  if(list.length<3){pod.innerHTML='';return;}
  const order=[list[1],list[0],list[2]];
  const ranks=[{cls:'silver',label:'🥈','rc':'s'},{cls:'first gold',label:'👑','rc':'g'},{cls:'third bronze',label:'🥉','rc':'b'}];
  pod.innerHTML=order.map((c,i)=>`
    <div class="pod-card ${ranks[i].cls}">
      ${i===1?'<div class="crown">👑</div>':''}
      <div class="pod-rank ${ranks[i].rc==='g'?'gold':ranks[i].rc==='s'?'silver':'bronze'}">${i===1?'1':i===0?'2':'3'}</div>
      <div class="pod-name">${esc(c.name)}</div>
      <div class="pod-pilot">${esc(c.pilot)}</div>
      <div class="pod-score ${ranks[i].rc==='g'?'gold':ranks[i].rc==='s'?'silver':'bronze'}">${c.votes}</div>
      <div class="pod-label">votes</div>
    </div>`).join('');
}

function renderTable(){
  const list=sortedFiltered();
  renderPodium(list);
  const body=document.getElementById('lbBody');
  if(!list.length){body.innerHTML='<div style="padding:40px;text-align:center;color:var(--muted2)">ไม่พบ config ที่ตรงกัน</div>';return;}
  body.innerHTML=list.map((c,i)=>{
    const rCls=i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const rnkCls=i===0?'g':i===1?'s':i===2?'b':'n';
    const pid=c.pid||{};
    const isVoted=!!voted[c.id];
    return `<div class="lb-row ${rCls}" onclick="showDetail(${c.id})">
      <div class="rank-badge ${rnkCls}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
      <div class="entry-info">
        <div class="ei-name">${esc(c.name)}</div>
        <div class="ei-pilot">${esc(c.pilot)} <span class="ei-tag">${esc(c.size||'')}</span> <span class="ei-tag">${esc(c.batt||'')}</span></div>
      </div>
      <div class="pid-mini"><span style="color:var(--green)">${pid.rp??'—'}/${pid.ri??'—'}/${pid.rd??'—'}</span><br><span style="color:var(--blue);font-size:10px">${pid.pp??'—'}/${pid.pi??'—'}/${pid.pd??'—'}</span></div>
      <div><span class="style-tag ${styleCls(c.style)}">${c.style}</span></div>
      <div class="score-cell">${c.votes}</div>
      <div class="vote-cell" onclick="event.stopPropagation()">
        <button type="button" class="vote-btn ${isVoted?'voted':''}" onclick="vote(${c.id})">${isVoted?'✅':'👍'}</button>
        <span class="vote-count">${c.votes}</span>
      </div>
    </div>`;
  }).join('');
}

function vote(id){
  const c=configs.find(x=>x.id===id);if(!c)return;
  if(voted[id]){c.votes--;delete voted[id];}
  else{c.votes++;voted[id]=true;}
  localStorage.setItem(VKEY,JSON.stringify(voted));
  renderTable();
}

function showDetail(id){
  const c=configs.find(x=>x.id===id);if(!c)return;
  const pid=c.pid||{};
  document.getElementById('dt_title').textContent=c.name;
  document.getElementById('dt_body').innerHTML=`
    <div style="color:var(--muted2);font-size:12px;margin-bottom:12px">
      ${esc(c.pilot)} · ${esc(c.style)} · ${esc(c.size||'')} · ${esc(c.batt||'')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      ${[['ROLL','r',pid.rp,pid.ri,pid.rd],['PITCH','p',pid.pp,pid.pi,pid.pd],['YAW','y',pid.yp,pid.yi,pid.yd]].map(([n,c2,p,i2,d])=>`
        <div style="background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:10px">
          <div style="font-family:var(--font-d);font-size:8px;letter-spacing:.08em;color:var(--${c2==='r'?'green':c2==='p'?'blue':'amber'});margin-bottom:8px">${n}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${[['P',p],['I',i2],['D',d]].map(([k,v])=>`<div style="font-family:var(--font-m);text-align:center"><div style="font-size:9px;color:var(--muted2)">${k}</div><div style="font-size:18px;font-weight:700;color:var(--${c2==='r'?'green':c2==='p'?'blue':'amber'})">${v??'—'}</div></div>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    ${c.note?`<div style="font-size:12px;color:var(--muted2);border-left:2px solid var(--border);padding-left:10px;margin-bottom:12px;line-height:1.6;font-style:italic">"${esc(c.note)}"</div>`:''}
    ${c.cli?`<div style="font-family:var(--font-d);font-size:9px;color:var(--green);letter-spacing:.1em;margin-bottom:6px">CLI CONFIG</div><div class="cli-block">${esc(c.cli)}</div><button type="button" class="copy-cli-btn" id="copyCLIBtn_${c.id}" onclick="copyCLI(${c.id})">📋 COPY CLI</button>`:''}
    <div style="margin-top:12px;display:flex;align-items:center;gap:10px">
      <button type="button" class="vote-btn ${voted[id]?'voted':''}" onclick="vote(${id});closeDetail()" style="padding:7px 18px;font-size:13px">${voted[id]?'✅ Voted':'👍 Vote'}</button>
      <span style="font-family:var(--font-m);color:var(--amber);font-size:18px;font-weight:700">${c.votes} votes</span>
    </div>`;
  document.getElementById('detailModal').classList.add('open');
}
function closeDetail(){document.getElementById('detailModal').classList.remove('open');}
document.getElementById('detailModal').addEventListener('click',e=>{if(e.target===document.getElementById('detailModal'))closeDetail();});

function copyCLI(id){
  const c=configs.find(x=>x.id===id);if(!c||!c.cli)return;
  navigator.clipboard.writeText(c.cli).then(()=>{
    const btn=document.getElementById('copyCLIBtn_'+id);
    if(btn){btn.textContent='✅ Copied!';setTimeout(()=>btn.textContent='📋 COPY CLI',2000);}
  });
}

function openSubmit(){document.getElementById('subModal').classList.add('open');}
function closeSubmit(){document.getElementById('subModal').classList.remove('open');}
document.getElementById('subModal').addEventListener('click',e=>{if(e.target===document.getElementById('subModal'))closeSubmit();});

document.querySelectorAll('.ss-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.ss-btn').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');selectedStyle=b.dataset.v;
  });
});

function gv(id){return(document.getElementById(id)?.value||'').trim();}
function gn2(id){const v=parseInt(document.getElementById(id)?.value);return isNaN(v)?null:v;}
function submitConfig(){
  const name=gv('s_name');if(!name){alert('กรุณาใส่ Build Name');return;}
  const entry={
    id:Date.now(),name,pilot:gv('s_pilot')||'Anonymous',
    size:gv('s_size'),batt:gv('s_batt'),style:selectedStyle,
    pid:{rp:gn2('s_rp'),ri:gn2('s_ri'),rd:gn2('s_rd'),
         pp:gn2('s_pp'),pi:gn2('s_pi'),pd:gn2('s_pd'),
         yp:gn2('s_yp'),yi:gn2('s_yi'),yd:gn2('s_yd')},
    note:gv('s_note'),cli:gv('s_cli'),votes:0
  };
  const user=JSON.parse(localStorage.getItem(UKEY)||'[]');
  user.unshift(entry);localStorage.setItem(UKEY,JSON.stringify(user));
  configs=[...SEED,...user];
  closeSubmit();renderTable();
}

document.querySelectorAll('.ftab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.ftab').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');filter=t.dataset.f;renderTable();
  });
});

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
renderTable();
