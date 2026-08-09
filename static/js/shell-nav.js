// static/js/shell-nav.js — Batch A: extracted from templates/partials/nav.html inline <script>. No logic change.

(function(){
'use strict';
var ham=document.getElementById('onHam'),drawer=document.getElementById('onDrawer'),
    overlay=document.getElementById('onOverlay'),closeBtn=document.getElementById('onClose'),
    searchEl=document.getElementById('onSearch'),navEl=document.getElementById('onNav'),
    noRes=document.getElementById('onNoResults'),searchBtn=document.getElementById('onSearchBtn');

/* ── THEME ── */
var theme=localStorage.getItem('obix-theme')||'dark';
function applyTheme(t){
  document.body.classList.toggle('light',t==='light');
  document.body.classList.toggle('dark',t!=='light');
  var icon=document.getElementById('onThemeIcon');
  if(icon)icon.textContent=t==='light'?'☀️':'🌙';
  localStorage.setItem('obix-theme',t);theme=t;
}
applyTheme(theme);
var themeBtn=document.getElementById('onTheme');
if(themeBtn)themeBtn.addEventListener('click',function(){applyTheme(theme==='light'?'dark':'light');});

/* ── LANGUAGE ── */
var lang=localStorage.getItem('obix-lang')||localStorage.getItem('obix_lang')||'th';
function applyLang(l){
  document.body.classList.toggle('lang-en',l==='en');
  var lbl=document.getElementById('onLangLabel');
  if(lbl)lbl.textContent=l==='en'?'EN':'TH';
  ['','Mobile'].forEach(function(s){
    var i=document.getElementById('langIcon'+s),t=document.getElementById('langLabel'+s),b=document.getElementById('langBtn'+s);
    if(i)i.textContent=l==='en'?'🇬🇧':'🇹🇭';
    if(t)t.textContent=l==='en'?'EN':'TH';
    if(b)b.classList.toggle('lang-en',l==='en');
  });
  localStorage.setItem('obix-lang',l);localStorage.setItem('obix_lang',l);lang=l;
}
applyLang(lang);
window.toggleLang=function(){applyLang(lang==='th'?'en':'th');};
var langBtn=document.getElementById('onLang');
if(langBtn)langBtn.addEventListener('click',function(){window.toggleLang();});

/* ── DRAWER ── */
function openDrawer(){
  if(ham){ham.setAttribute('aria-expanded','true');ham.classList.add('on-open');}
  if(drawer)drawer.classList.add('on-open');
  if(overlay){overlay.classList.add('on-open');overlay.setAttribute('aria-hidden','false');}
  document.addEventListener('keydown',handleKey);
  if(window.innerWidth<960)document.body.style.overflow='hidden';
  setTimeout(function(){if(searchEl)searchEl.focus();},80);
}
function closeDrawer(){
  if(ham){ham.setAttribute('aria-expanded','false');ham.classList.remove('on-open');}
  if(drawer)drawer.classList.remove('on-open');
  if(overlay){overlay.classList.remove('on-open');overlay.setAttribute('aria-hidden','true');}
  document.removeEventListener('keydown',handleKey);
  document.body.style.overflow='';
  if(searchEl){searchEl.value='';filterLinks('');}
  if(ham)ham.focus();
}
function handleKey(e){
  if(e.key==='Escape')closeDrawer();
  if(e.key==='/'&&document.activeElement!==searchEl){e.preventDefault();if(searchEl)searchEl.focus();}
}
window.onNavOpen=openDrawer;window.onNavClose=closeDrawer;
/* sync ham button when tpPanel closes externally */
document.addEventListener('tpClosed',function(){
  if(ham){ham.setAttribute('aria-expanded','false');ham.classList.remove('on-open');}
});
if(ham)ham.addEventListener('click',function(){
  if(window.openTP){
    var open=document.getElementById('tpPanel')&&document.getElementById('tpPanel').classList.contains('tp-open');
    if(open){window.closeTP&&window.closeTP();ham.setAttribute('aria-expanded','false');ham.classList.remove('on-open');}
    else{window.openTP();ham.setAttribute('aria-expanded','true');ham.classList.add('on-open');}
  } else { ham.getAttribute('aria-expanded')==='true'?closeDrawer():openDrawer(); }
});
if(overlay)overlay.addEventListener('click',closeDrawer);
if(closeBtn)closeBtn.addEventListener('click',closeDrawer);
if(searchBtn)searchBtn.addEventListener('click',function(){
  if(window.openTP){window.openTP();setTimeout(function(){var s=document.getElementById('tpSearch');if(s)s.focus();},80);}
  else openDrawer();
});
if(navEl)navEl.querySelectorAll('.on-dlink').forEach(function(l){
  l.addEventListener('click',function(){if(window.innerWidth<960)closeDrawer();});
});
document.addEventListener('keydown',function(e){
  var tag=document.activeElement?document.activeElement.tagName:'';
  if(e.key==='/'||e.key==='t'||e.key==='T'){
    e.preventDefault();
    if(window.openTP){window.openTP();setTimeout(function(){var s=document.getElementById('tpSearch');if(s)s.focus();},80);}
    else openDrawer();
  }
});

/* ── SWIPE ── */
if(drawer){
  var tx=0,ty=0;
  drawer.addEventListener('touchstart',function(e){tx=e.changedTouches[0].clientX;ty=e.changedTouches[0].clientY;},{passive:true});
  drawer.addEventListener('touchmove',function(e){var dx=e.changedTouches[0].clientX-tx;if(dx<0){var r=Math.min(Math.abs(dx)*.35,40);drawer.style.transform='translateX(-'+r+'px)';drawer.style.transition='none';}},{passive:true});
  drawer.addEventListener('touchend',function(e){drawer.style.transform='';drawer.style.transition='';var dx=e.changedTouches[0].clientX-tx,dy=Math.abs(e.changedTouches[0].clientY-ty);if(dx<-60&&dy<80)closeDrawer();},{passive:true});
}

/* ── SEARCH ── */
function filterLinks(q){
  q=q.trim().toLowerCase();
  var links=navEl?navEl.querySelectorAll('.on-dlink'):[],groups=navEl?navEl.querySelectorAll('.on-grp'):[],visible=0;
  if(!q){links.forEach(function(l){l.style.display='';});groups.forEach(function(g){g.style.display='';});if(noRes)noRes.style.display='none';return;}
  groups.forEach(function(g){g.style.display='none';});
  links.forEach(function(l){var t=(l.textContent+' '+(l.dataset.search||'')).toLowerCase(),show=t.indexOf(q)!==-1;l.style.display=show?'':'none';if(show)visible++;});
  if(noRes)noRes.style.display=visible===0?'block':'none';
}
if(searchEl){
  searchEl.addEventListener('input',function(){filterLinks(this.value);});
  searchEl.addEventListener('keydown',function(e){
    if(e.key==='Escape'){if(this.value){this.value='';filterLinks('');e.stopPropagation();}else closeDrawer();}
  });
}

/* ── DESKTOP DROPDOWN keyboard a11y ── */
document.querySelectorAll('.on-mg-btn').forEach(function(btn){
  btn.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();var g=btn.closest('.on-mg'),o=g.classList.toggle('on-dd-open');btn.setAttribute('aria-expanded',String(o));}
    if(e.key==='Escape'){btn.closest('.on-mg').classList.remove('on-dd-open');btn.setAttribute('aria-expanded','false');btn.focus();}
  });
});
document.addEventListener('click',function(e){
  if(!e.target.closest('.on-mg')){
    document.querySelectorAll('.on-mg.on-dd-open').forEach(function(g){g.classList.remove('on-dd-open');var b=g.querySelector('.on-mg-btn');if(b)b.setAttribute('aria-expanded','false');});
  }
});
/* ── TOOL PANEL ─────────────────────────────────────── */
var TP_TOOLS={
  TUNE:[
    {n:'Drone Analyzer',d:'PID · Filter · Flight time · Motor physics',u:'/app',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10 7 7" /><path d="m10 14-3 3" /><path d="m14 10 3-3" /><path d="m14 14 3 3" /><path d="M14.205 4.139a4 4 0 1 1 5.439 5.863" /><path d="M19.637 14a4 4 0 1 1-5.432 5.868" /><path d="M4.367 10a4 4 0 1 1 5.438-5.862" /><path d="M9.795 19.862a4 4 0 1 1-5.429-5.873" /><rect x="10" y="8" width="4" height="8" rx="1" /></svg>'},
    {n:'PID Symptom Advisor',d:'บอกอาการ → รับคำแนะนำ PID/Filter + CLI',u:'/pid-advisor',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>'},
    {n:'Quick Tune Pad',d:'เลือกอาการ → PID delta + CLI พร้อม copy',u:'/quick-tune',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>'},
    {n:'RPM Filter Calculator',d:'คำนวณ harmonic Hz + dyn_notch',u:'/rpm-filter',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>'},
    {n:'Rates Visualizer',d:'Real-time rate curve · per-axis',u:'/rates-visualizer',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg>'},
    {n:'BF Config Wizard',d:'7 ขั้นตอน → CLI พร้อม paste',u:'/bf-wizard',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" /></svg>'},
  ],
  HW:[
    {n:'Motor × Prop Recommender',d:'แนะนำ motor/prop ตาม KV + สเปค',u:'/motor-prop',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" /><path d="M12 12v.01" /></svg>'},
    {n:'ESC Compatibility Checker',d:'ตรวจ ESC amps · protocol · KV limit',u:'/esc-checker',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v2" /><path d="M12 2v2" /><path d="M17 20v2" /><path d="M17 2v2" /><path d="M2 12h2" /><path d="M2 17h2" /><path d="M2 7h2" /><path d="M20 12h2" /><path d="M20 17h2" /><path d="M20 7h2" /><path d="M7 20v2" /><path d="M7 2v2" /><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" /></svg>'},
    {n:'Battery Health Advisor',d:'IR · Sag · Health Score',u:'/battery-health',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 7-3 5h4l-3 5" /><path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" /><path d="M22 14v-4" /><path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" /></svg>'},
    {n:'Motor Thermal Estimator',d:'อุณหภูมิ winding · thermal margin',u:'/motor-thermal',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /></svg>'},
    {n:'Control Loop Analyzer',d:'Stick→Prop latency chain',u:'/loop-analyzer',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>'},
  ],
  ANALYZE:[
    {n:'Blackbox CSV Analyzer',d:'วิเคราะห์ flight log · PID score A–D',u:'/blackbox',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>'},
    {n:'CLI Surgeon',d:'วิเคราะห์ diff all / dump CLI',u:'/cli_surgeon',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19h8" /><path d="m4 17 6-6-6-6" /></svg>'},
    {n:'CLI Diff Comparator',d:'วาง 2 config → เห็นทุกค่าที่เปลี่ยน',u:'/cli-comparator',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18" /><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" /><path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M7 21h10" /></svg>'},
    {n:'OSD Designer',d:'ออกแบบ OSD layout + export CLI',u:'/osd',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>'},
    {n:'Build Card Generator',d:'สร้างรูปสเปคแชร์ Social',u:'/build-card',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>'},
    {n:'Tuning Log',d:'บันทึก session · เปรียบเทียบ PID',u:'/tuning-log',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>'},
  ],
  VIDEO:[
    {n:'VTX Bands & Channels',d:'ตาราง Band/Channel + CLI generator',u:'/vtx',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.247 7.761a6 6 0 0 1 0 8.478" /><path d="M19.075 4.933a10 10 0 0 1 0 14.134" /><path d="M4.925 19.067a10 10 0 0 1 0-14.134" /><path d="M7.753 16.239a6 6 0 0 1 0-8.478" /><circle cx="12" cy="12" r="2" /></svg>'},
    {n:'VTX Range Calculator',d:'ประมาณระยะสัญญาณ + กราฟ',u:'/vtx-range',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" /><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /><path d="M12 18h.01" /><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /><circle cx="12" cy="12" r="2" /><path d="m13.41 10.59 5.66-5.66" /></svg>'},
    {n:'VTX SmartAudio Guide',d:'SmartAudio / Tramp commands',u:'/vtx-smartaudio',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19v3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><rect x="9" y="2" width="6" height="13" rx="3" /></svg>'},
  ],
  EXPLORE:[
    {n:'FPV Training Simulator',d:'ฝึกบิน 3D · 4 โหมด · Gamepad',u:'/fpv-trainer',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="11" y2="11" /><line x1="8" x2="8" y1="9" y2="13" /><line x1="15" x2="15.01" y1="12" y2="12" /><line x1="18" x2="18.01" y1="10" y2="10" /><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" /></svg>'},
    {n:'Flight Style Quiz',d:'5 คำถาม → rates + preset แนะนำ',u:'/flight-quiz',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>'},
    {n:'Config Leaderboard',d:'Vote · rank · copy config',u:'/leaderboard',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" /><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" /><path d="M18 9h1.5a1 1 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /><path d="M6 9H4.5a1 1 0 0 1 0-5H6" /></svg>'},
    {n:'Military UAS Analyzer',d:'วิเคราะห์โดรนทหาร · physics engine',u:'/military-uas',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>'},
    {n:'FPV Knowledge Hub',d:'รวมบทความ & เครื่องมือ',u:'/fpv',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>'},
    {n:'FPV Gear Guide',d:'แนะนำอุปกรณ์ตาม class/style',u:'/fpv-gear',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>'},
    {n:'Downloads',d:'DIFF & DUMP config files',u:'/downloads',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /></svg>'},
    {n:'About',d:'ที่มา & วิธีใช้งาน',u:'/about',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>'},
    {n:'Team',d:'ผู้พัฒนา & AI Partners',u:'/team',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg>'},
    {n:'Changelog',d:'บันทึกการอัปเดต',u:'/changelog',ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>'},
  ],
};
var TP_COLORS={
  TUNE:{c:'#10c47a',rgb:'16,196,122'},
  HW:{c:'#00e5ff',rgb:'0,229,255'},
  ANALYZE:{c:'#f5a623',rgb:'245,166,35'},
  VIDEO:{c:'#4f8ef7',rgb:'79,142,247'},
  EXPLORE:{c:'#a855f7',rgb:'168,85,247'},
  ALL:{c:'#8892a4',rgb:'136,146,164'},
};
var ALL_TOOLS=[];
Object.keys(TP_TOOLS).forEach(function(k){TP_TOOLS[k].forEach(function(t){ALL_TOOLS.push(Object.assign({},t,{cat:k}));});});

var tpOv=document.getElementById('tpOverlay'),
    tpPn=document.getElementById('tpPanel'),
    tpBtn=document.getElementById('tpBtn'),
    tpClose=document.getElementById('tpClose'),
    tpSearch=document.getElementById('tpSearch'),
    tpItems=document.getElementById('tpItems'),
    tpEmpty=document.getElementById('tpEmpty'),
    tpCount=document.getElementById('tpCount'),
    tpListHd=document.getElementById('tpListHd'),
    tpListPip=document.getElementById('tpListPip'),
    tpListName=document.getElementById('tpListName'),
    tpListCnt=document.getElementById('tpListCnt'),
    tpCats=document.getElementById('tpCats');

var curCat='TUNE', curSel=-1, curItems=[];

window.openTP=function openTP(){
  if(!tpOv||!tpPn)return;
  tpOv.classList.add('tp-open');tpPn.classList.add('tp-open');
  tpOv.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  document.addEventListener('keydown',tpKey);
  setTimeout(function(){if(tpSearch)tpSearch.focus();},60);
  renderCat(curCat);
}
window.closeTP=function closeTP(){
  document.dispatchEvent(new CustomEvent('tpClosed'));
  if(!tpOv||!tpPn)return;
  tpOv.classList.remove('tp-open');tpPn.classList.remove('tp-open');
  tpOv.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  document.removeEventListener('keydown',tpKey);
  if(tpSearch){tpSearch.value='';renderCat(curCat);}
  curSel=-1;
  if(tpBtn)tpBtn.focus();
}
window.openToolsPanel = window.openTP;
window.closeToolsPanel = window.closeTP;
window.toggleToolsPanel = function(){
  if(tpPn && tpPn.classList.contains('tp-open')){
    window.closeTP();
  } else {
    window.openTP();
  }
};
function tpKey(e){
  if(e.key==='Escape'){closeTP();return;}
  if(e.key==='ArrowDown'){e.preventDefault();moveSel(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();moveSel(-1);}
  else if(e.key==='Enter'&&curSel>=0&&curItems[curSel]){window.location.href=curItems[curSel].href;}
}
function moveSel(dir){
  var els=curItems;if(!els.length)return;
  curSel=Math.max(0,Math.min(els.length-1,curSel+dir));
  els.forEach(function(el,i){el.classList.toggle('tp-sel',i===curSel);if(i===curSel)el.scrollIntoView({block:'nearest'});});
}

function renderCat(cat){
  var q=(tpSearch&&tpSearch.value.trim().toLowerCase())||'';
  var col=TP_COLORS[cat]||TP_COLORS.ALL;

  // update header
  if(tpListPip)tpListPip.style.background=col.c;
  if(tpListName){tpListName.textContent=cat;tpListName.style.color=col.c;}

  // update sidebar CSS vars on list
  if(tpItems){
    tpItems.style.setProperty('--tpc',col.c);
    tpItems.style.setProperty('--tpc-rgb',col.rgb);
  }
  // find parent .tp-list and set vars there
  var tpList=document.getElementById('tpList');
  if(tpList){
    tpList.style.setProperty('--tpc',col.c);
    tpList.style.setProperty('--tpc-rgb',col.rgb);
  }

  var tools=cat==='ALL'?ALL_TOOLS:(TP_TOOLS[cat]||[]).map(function(t){return Object.assign({},t,{cat:cat});});
  if(q)tools=tools.filter(function(t){return (t.n+' '+t.d+' '+t.cat).toLowerCase().indexOf(q)!==-1;});

  if(tpListCnt)tpListCnt.textContent=tools.length+' tools';
  if(tpCount)tpCount.textContent=tools.length;

  if(!tpItems)return;
  tpItems.innerHTML='';curItems=[];curSel=-1;
  if(tools.length===0){if(tpEmpty)tpEmpty.style.display='block';return;}
  if(tpEmpty)tpEmpty.style.display='none';

  tools.forEach(function(t,i){
    var c=TP_COLORS[t.cat]||col;
    var a=document.createElement('a');
    a.className='tp-item';a.href=t.u;
    a.style.setProperty('--tpc',c.c);
    a.style.setProperty('--tpc-rgb',c.rgb);
    a.innerHTML='<div class="tp-item-ico">'+t.ic+'</div>'
      +'<div class="tp-item-body"><span class="tp-item-name">'+t.n+'</span>'
      +'<span class="tp-item-desc">'+t.d+'</span></div>'
      +'<span class="tp-item-arr">→</span>';
    tpItems.appendChild(a);curItems.push(a);
  });
}

function setCat(cat){
  curCat=cat;
  var col=TP_COLORS[cat]||TP_COLORS.ALL;
  document.querySelectorAll('#tpCats .tp-cat').forEach(function(b){
    var isAct=b.dataset.cat===cat;
    b.classList.toggle('active',isAct);
    if(isAct){
      b.style.setProperty('--tpc',col.c);
      b.style.setProperty('--tpc-rgb',col.rgb);
    }
  });
  if(tpSearch)tpSearch.value='';
  renderCat(cat);
}

// wire events
if(tpBtn)tpBtn.addEventListener('click',function(){tpPn&&tpPn.classList.contains('tp-open')?closeTP():openTP();});
if(tpClose)tpClose.addEventListener('click',closeTP);
if(tpOv)tpOv.addEventListener('click',closeTP);
if(tpSearch)tpSearch.addEventListener('input',function(){renderCat(curCat);});
if(tpSearch)tpSearch.addEventListener('keydown',function(e){if(e.key==='Escape'){if(this.value){this.value='';renderCat(curCat);e.stopPropagation();}else closeTP();}});
if(tpCats)tpCats.querySelectorAll('.tp-cat').forEach(function(btn){btn.addEventListener('click',function(){setCat(btn.dataset.cat);});});

// keyboard shortcut: T = open tool panel (when not in input)
document.addEventListener('keydown',function(e){
  if(document.activeElement&&['INPUT','TEXTAREA','SELECT'].indexOf(document.activeElement.tagName)!==-1)return;
  if(e.key==='t'||e.key==='T'){
    if(tpPn&&!tpPn.classList.contains('tp-open')){e.preventDefault();openTP();}
  }
});

// swipe-to-close
if(tpPn){
  var sx=0,sy=0;
  tpPn.addEventListener('touchstart',function(e){sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY;},{passive:true});
  tpPn.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-sx,dy=Math.abs(e.changedTouches[0].clientY-sy);
    if(dx>55&&dy<80)closeTP();
  },{passive:true});
}
}());
