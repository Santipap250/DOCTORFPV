// static/js/index-page.js — Batch B: extracted from templates/index.html second inline <script> (share-button handlers use SHARE_URL/SHARE_TEXT/SHARE_TITLE globals still rendered inline). No logic change.

(function(){
'use strict';
var g=function(id){return document.getElementById(id)};
var _PT=[[1.5,70],[2.5,190],[3,280],[3.5,380],[4,520],[5,850],[6,1200],[7,1600],[8,2050],[10,3200]];
var _PP=[[1.5,15],[2.5,55],[3,80],[3.5,120],[4,180],[5,300],[6,440],[7,620],[8,800],[10,1200]];
var _PW=[[1.5,.65],[2.5,.42],[3,.34],[3.5,.28],[4,.24],[5,.20],[6,.17],[7,.15],[8,.14],[10,.12]];
var _SF={freestyle:1.55,longrange:1.25,racing:2.1};
function lerp(t,x){for(var i=0;i<t.length-1;i++){if(x>=t[i][0]&&x<=t[i+1][0]){var r=(x-t[i][0])/(t[i+1][0]-t[i][0]);return t[i][1]+(t[i+1][1]-t[i][1])*r}}return x<t[0][0]?t[0][1]:t[t.length-1][1]}

window.liveCalc=function(){
  var wt=parseFloat((g('fWt')||{}).value)||720;
  var prop=parseFloat((g('fPr')||{}).value)||5;
  var sel=g('battSel'); var cells=sel?parseInt((sel.value||'4S').replace(/[Ss]/,''))||4:4;
  var mah=parseFloat((g('fMah')||{}).value)||0;
  var kv=parseFloat((g('fKv')||{}).value)||0;
  var style=(g('fSt')||{}).value||'freestyle';

  var maxRPM=kv>0?kv*cells*3.85*.8:0;
  var tip=kv>0?(Math.PI*prop*.0254*maxRPM)/60:0;
  var tt;
  if(kv>0){var ce=1+(cells-4)*.055;var em=Math.max(.40,.55-(prop-5)*.015);var mp=Math.min(lerp(_PP,prop)*(1+(cells-4)/4*.22),1000);tt=4.7*(0.9+prop*.02)*ce*em*mp*4}
  else{var cs=cells<=4?(.55+cells*.1125):(1+(cells-4)*.18);tt=lerp(_PT,prop)*cs*4}
  var twr=wt>0?Math.min(tt/wt,12):0;
  var packV=cells*3.7;var wg=lerp(_PW,prop);var aw=wg*wt*(_SF[style]||1.55);
  var uwh=mah>0?(mah/1000)*packV*.85:0;var ft=aw>1&&mah>0?Math.min(30,Math.round((uwh/aw)*60*10)/10):0;

  var tEl=g('pTwr');if(tEl){tEl.textContent=twr>0?twr.toFixed(2)+':1':'—';tEl.style.color=twr>=3.5?'#00ff44':twr>=2?'#ffbb00':twr>0?'#ff3355':''}
  var fEl=g('pFt');if(fEl){fEl.textContent=ft>0?ft.toFixed(1)+'m':'—';fEl.style.color=ft>6?'#00ff44':ft>3?'#ffbb00':ft>0?'#ff3355':''}
  var tiEl=g('pTip');if(tiEl){tiEl.textContent=tip>0?Math.round(tip)+'m/s':'—';tiEl.style.color=tip>290?'#ff3355':tip>265?'#ffbb00':tip>0?'#00ff44':''}

  updateMahHint();
};

window.updateMahHint=function(){
  var mE=g('fMah'),bE=g('battSel'),h=g('mahHint');if(!mE||!bE||!h)return;
  var mah=parseInt(mE.value)||0;if(!mah){h.textContent='';return}
  var cells=parseInt((bE.value||'4S').replace(/[Ss]/,''))||4;
  var wt=parseFloat((g('fWt')||{}).value)||720;
  var prop=parseFloat((g('fPr')||{}).value)||5;
  var style=(g('fSt')||{}).value||'freestyle';
  var wh=(mah/1000)*cells*3.7*.85;
  var aw=lerp(_PW,prop)*wt*(_SF[style]||1.55);
  var ft=aw>1?Math.round((wh/aw)*60*10)/10:0;
  h.textContent=ft>0?'≈ '+ft+' min':'';
};

var _ct=null;
window.dCalc=function(){clearTimeout(_ct);_ct=setTimeout(function(){window.liveCalc&&window.liveCalc()},150)};

window.setSz=function(chip){
  document.querySelectorAll('.sz').forEach(function(c){c.classList.remove('on')});
  chip.classList.add('on');
  var sz=chip.dataset.sz,w=chip.dataset.w,p=chip.dataset.p,pt=chip.dataset.pt,kv=chip.dataset.kv;
  function sv(id,v){var e=g(id);if(e)e.value=v}
  sv('fSz',sz);sv('fPr',p);sv('fPt',pt);sv('fWt',w);sv('fPrV',p);sv('fPtV',pt);sv('fWtV',w);
  var kve=g('fKv');if(kv&&kve&&!kve.value)kve.value=kv;
  window.dCalc&&window.dCalc();
};

window.syncSzFromProp=function(){
  var p=parseFloat((g('fPr')||{}).value)||5;
  var sv=g('fSz');if(sv)sv.value=p;
  document.querySelectorAll('.sz').forEach(function(c){
    c.classList.remove('on');
    if(Math.abs(parseFloat(c.dataset.p)-p)<0.01)c.classList.add('on');
  });
};

window.setBatt=function(s,btn){
  document.querySelectorAll('.bp').forEach(function(b){b.classList.remove('on')});
  if(btn)btn.classList.add('on');
  var sel=g('battSel');if(sel)sel.value=s;
  window.dCalc&&window.dCalc();
};
window.syncBp=function(s){
  document.querySelectorAll('.bp').forEach(function(b){b.classList.remove('on')});
  var m=document.querySelector('.bp.bp'+s.toLowerCase());if(m)m.classList.add('on');
};

window.setStyle=function(style,card){
  document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('on')});
  if(card)card.classList.add('on');
  var sel=g('fSt');if(sel)sel.value=style;
  window.dCalc&&window.dCalc();
};
window.syncSc=function(style){
  document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('on')});
  var m=document.querySelector('.sc.'+(style=='freestyle'?'free':style=='racing'?'race':'lr'));if(m)m.classList.add('on');
};

window.setBfv=function(v,btn){
  document.querySelectorAll('.bfv').forEach(function(b){b.classList.remove('on')});
  if(btn)btn.classList.add('on');
  var e=g('fBfv');if(e)e.value=v;
};

window.cpEl=function(id){
  var el=g(id);if(!el)return;var t=el.textContent||el.innerText;
  navigator.clipboard?navigator.clipboard.writeText(t).catch(function(){_fb(t)}):_fb(t);
};
function _fb(t){var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta)}

window.toast=function(msg){
  var el=g('toastEl');if(!el)return;
  el.textContent=msg;el.classList.add('show');
  setTimeout(function(){el.classList.remove('show')},2200);
};

window.onPreset=window.onPreset||function(){};

window.onAnalyzeSubmit=function(form){
  var btn=g('btnA');
  if(btn&&!btn.disabled){
    setTimeout(function(){
      btn.disabled=true;
      var m=btn.querySelector('.bta-m');if(m)m.textContent='กำลังวิเคราะห์...';
      var s=btn.querySelector('.bta-s');if(s)s.textContent='คำนวณ Physics + PID + Filter';
    },0);
  }
  return true;
};

document.addEventListener('DOMContentLoaded',function(){
  var bs=g('battSel');if(bs)window.syncBp(bs.value||'4S');
  var bv=g('fBfv');if(bv){document.querySelectorAll('.bfv').forEach(function(c){c.classList.remove('on');if(c.dataset.v===bv.value)c.classList.add('on')})}
  window.liveCalc&&window.liveCalc();
  var form=g('aForm');
  if(form)form.querySelectorAll('input[type="number"]').forEach(function(i){i.addEventListener('input',window.dCalc,{passive:true})});
},false);

var TOOLS = [
  {group:'Analyzer', icon:'📊', name:'Drone Analyzer', desc:'วิเคราะห์ PID / Filter / CLI จากสเปคโดรน', href:'/app', tag:'Core'},
  {group:'Analyzer', icon:'🧠', name:'PID Advisor', desc:'ช่วยเลือก PID ตามสไตล์การบิน', href:'/pid-advisor', tag:'Tune'},
  {group:'Analyzer', icon:'⚡', name:'Quick Tune', desc:'ปรับจูนแบบเร็วสำหรับงานทั่วไป', href:'/quick-tune', tag:'Fast'},
  {group:'Analysis', icon:'🛰️', name:'Blackbox', desc:'ดูอาการบินและหาสาเหตุอาการสั่น', href:'/blackbox', tag:'Debug'},
  {group:'Analysis', icon:'🎥', name:'CLI Surgeon', desc:'ช่วยจัดการ/แก้คำสั่ง CLI', href:'/cli_surgeon', tag:'CLI'},
  {group:'Analysis', icon:'🔁', name:'CLI Comparator', desc:'เปรียบเทียบคำสั่ง CLI หลายชุด', href:'/cli-comparator', tag:'Compare'},
  {group:'Performance', icon:'🔧', name:'RPM Filter', desc:'คำนวณช่วงกรอง RPM ให้เหมาะกับมอเตอร์', href:'/rpm-filter', tag:'Filter'},
  {group:'Performance', icon:'🧭', name:'Rates Visualizer', desc:'ดูอัตราการหมุนและความรู้สึกการบังคับ', href:'/rates-visualizer', tag:'Rates'},
  {group:'Performance', icon:'🧰', name:'BF Wizard', desc:'ตัวช่วยตั้งค่า Betaflight แบบเป็นขั้นตอน', href:'/bf-wizard', tag:'Wizard'},
  {group:'Hardware', icon:'🔋', name:'Battery Health', desc:'ตรวจสุขภาพแบตและประเมินการใช้งาน', href:'/battery-health', tag:'Power'},
  {group:'Hardware', icon:'🌡️', name:'Motor Thermal', desc:'ประเมินความร้อนของมอเตอร์ระหว่างบิน', href:'/motor-thermal', tag:'Thermal'},
  {group:'Hardware', icon:'🪛', name:'ESC Checker', desc:'เช็ก ESC และความเข้ากันกับระบบ', href:'/esc-checker', tag:'ESC'},
  {group:'Hardware', icon:'⚙️', name:'Motor×Prop', desc:'ดูคู่มอเตอร์กับใบพัดที่เข้ากัน', href:'/motor-prop', tag:'Match'},
  {group:'Hardware', icon:'📡', name:'VTX', desc:'ตั้งค่าช่องและช่วงสัญญาณ VTX', href:'/vtx', tag:'Video'},
  {group:'Hardware', icon:'🎛️', name:'VTX Range', desc:'คำนวณย่านกำลังส่งและช่องใช้งาน', href:'/vtx-range', tag:'Range'},
  {group:'Hardware', icon:'📶', name:'SmartAudio', desc:'คู่มือการตั้งค่า SmartAudio', href:'/vtx-smartaudio', tag:'Audio'},
  {group:'Training', icon:'🎮', name:'FPV Trainer', desc:'ฝึกบินและพัฒนาทักษะพื้นฐาน', href:'/fpv-trainer', tag:'Train'},
  {group:'Training', icon:'❓', name:'Flight Quiz', desc:'ทดสอบความรู้การบิน FPV', href:'/flight-quiz', tag:'Quiz'},
  {group:'Training', icon:'🏆', name:'Leaderboard', desc:'ดูอันดับและผลงานในระบบ', href:'/leaderboard', tag:'Rank'},
  {group:'Explore', icon:'📦', name:'Build Card', desc:'สรุปสเปคโดรนเป็นการ์ดสวย ๆ', href:'/build-card', tag:'Share'},
  {group:'Explore', icon:'📝', name:'Tuning Log', desc:'บันทึกประวัติการจูนและการปรับแต่ง', href:'/tuning-log', tag:'Log'},
  {group:'Explore', icon:'🧾', name:'Downloads', desc:'ดาวน์โหลดไฟล์และเครื่องมือเสริม', href:'/downloads', tag:'Files'},
  {group:'Explore', icon:'🖥️', name:'OSD', desc:'ออกแบบข้อมูล OSD สำหรับจอ FPV', href:'/osd', tag:'Display'},
  {group:'Explore', icon:'ℹ️', name:'About', desc:'ข้อมูลโปรเจกต์และแนวคิดของระบบ', href:'/about', tag:'Info'},
  {group:'Explore', icon:'👥', name:'Team', desc:'ดูทีมและผู้พัฒนา', href:'/team', tag:'People'},
  {group:'Explore', icon:'🧬', name:'Changelog', desc:'ดูบันทึกการอัปเดตล่าสุด', href:'/changelog', tag:'Updates'},
  {group:'Explore', icon:'🛰️', name:'FPV Hub', desc:'ศูนย์รวมความรู้ FPV สำหรับผู้ใช้', href:'/fpv', tag:'Hub'},
  {group:'Explore', icon:'🧢', name:'FPV Gear', desc:'แนะนำอุปกรณ์ FPV ตามงบและคลาส', href:'/fpv-gear', tag:'Gear'},
  {group:'Explore', icon:'🪖', name:'Military UAS', desc:'ข้อมูล/หน้าเฉพาะด้าน military UAS', href:'/military-uas', tag:'Special'}
];

var TOOL_GROUPS = [
  {key:'ALL', label:'ทั้งหมด', icon:'✨'},
  {key:'Analyzer', label:'Analyzer', icon:'📊'},
  {key:'Analysis', label:'Analysis', icon:'🛰️'},
  {key:'Performance', label:'Performance', icon:'⚡'},
  {key:'Hardware', label:'Hardware', icon:'🧰'},
  {key:'Training', label:'Training', icon:'🎮'},
  {key:'Explore', label:'Explore', icon:'🧭'}
];

var currentQuery = '';
var currentGroup = 'ALL';

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g,function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

function countByGroup(list, key){
  if(key === 'ALL') return list.length;
  return list.filter(function(t){ return t.group === key; }).length;
}

function renderRail(list){
  var rail = g('toolsRail');
  if(!rail) return;
  var html = TOOL_GROUPS.map(function(grp){
    var n = countByGroup(list, grp.key);
    return [
      '<button type="button" class="tools-filter', (currentGroup === grp.key ? ' active' : ''), '" data-group="', grp.key, '">',
        '<span class="tools-filter-ic">', grp.icon, '</span>',
        '<span class="tools-filter-copy">',
          '<span class="tools-filter-name">', escapeHtml(grp.label), '</span>',
          '<span class="tools-filter-count">', n, ' tools</span>',
        '</span>',
        '<span class="tools-filter-dot"></span>',
      '</button>'
    ].join('');
  }).join('');
  rail.innerHTML = html;
  rail.querySelectorAll('.tools-filter').forEach(function(btn){
    btn.addEventListener('click', function(){
      currentGroup = btn.getAttribute('data-group') || 'ALL';
      renderTools(currentQuery);
    });
  });
}

function renderTools(filter){
  var container = g('toolsGroups');
  if(!container) return;

  currentQuery = (filter || '').trim();
  var q = currentQuery.toLowerCase();

  var list = TOOLS.filter(function(t){
    var matchesQuery = !q || [t.group,t.name,t.desc,t.tag,t.href].join(' ').toLowerCase().indexOf(q) !== -1;
    var matchesGroup = currentGroup === 'ALL' || t.group === currentGroup;
    return matchesQuery && matchesGroup;
  });

  var keys = (currentGroup === 'ALL' ? ['Analyzer','Analysis','Performance','Hardware','Training','Explore'] : [currentGroup]);
  var html = '';
  var totalVisible = 0;
  var visibleGroups = 0;

  keys.forEach(function(key){
    var arr = list.filter(function(t){ return t.group === key; });
    if(!arr.length) return;
    visibleGroups += 1;
    totalVisible += arr.length;
    html += '<section class="tools-section">';
    html +=   '<div class="tools-sec-h">';
    html +=     '<div class="tools-sec-title">' + escapeHtml(key) + '</div>';
    html +=     '<div class="tools-sec-count">' + arr.length + ' tools</div>';
    html +=   '</div>';
    html +=   '<div class="tools-grid">';
    arr.forEach(function(t){
      html += '<a class="tools-card" href="' + escapeHtml(t.href) + '">';
      html +=   '<div class="tools-ic">' + escapeHtml(t.icon) + '</div>';
      html +=   '<div class="tools-copy">';
      html +=     '<div class="tools-name">' + escapeHtml(t.name) + '</div>';
      html +=     '<div class="tools-desc">' + escapeHtml(t.desc) + '</div>';
      html +=     '<div class="tools-tag-row"><span class="tools-tag">' + escapeHtml(t.tag) + '</span></div>';
      html +=   '</div>';
      html +=   '<span class="tools-arrow">↗</span>';
      html += '</a>';
    });
    html +=   '</div>';
    html += '</section>';
  });

  if(!totalVisible){
    html = '<div class="tools-empty">ไม่พบเครื่องมือที่ตรงกับคำค้น ลองพิมพ์คำอื่น เช่น PID, VTX, Blackbox, Battery</div>';
  }

  container.innerHTML = html;

  var total = TOOLS.length;
  var b = g('toolsCount'); if(b) b.textContent = String(totalVisible || total);
  var st = g('toolsTotal'); if(st) st.textContent = String(total);
  var vis = g('toolsVisible'); if(vis) vis.textContent = String(totalVisible || 0);
  var gc = g('toolsGroupsCount'); if(gc) gc.textContent = String(visibleGroups || TOOL_GROUPS.length - 1);
  var sc = g('toolsSearchCount'); if(sc) sc.textContent = String(totalVisible || total);
  var empty = g('toolsEmpty'); if(empty) empty.style.display = totalVisible ? 'none' : 'block';
}

window.openToolsModal = function(){
  var m = g('toolsModal');
  if(!m) return;
  currentGroup = 'ALL';
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  renderTools(g('toolsSearch') ? g('toolsSearch').value : '');
  setTimeout(function(){ var s=g('toolsSearch'); if(s) s.focus(); }, 50);
};

window.closeToolsModal = function(){
  var m = g('toolsModal');
  if(!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
};

window.filterTools = function(){
  renderTools(g('toolsSearch') ? g('toolsSearch').value : '');
};

document.addEventListener('keydown', function(ev){
  var m = g('toolsModal');
  if (ev.key === 'Escape' && m && m.classList.contains('open')) closeToolsModal();
});

document.addEventListener('click', function(ev){
  if(ev.target && ev.target.closest && ev.target.closest('.tools-modal-panel')) return;
  if(ev.target && ev.target.classList && ev.target.classList.contains('tools-modal-backdrop')) closeToolsModal();
});

renderTools('');

})();
