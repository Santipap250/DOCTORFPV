// static/js/downloads.js — Batch E: extracted from templates/downloads.html inline <script>. No logic change.

(function(){
  'use strict';

  var cards   = Array.from(document.querySelectorAll('.dl-card'));
  var search  = document.getElementById('dlSearch');
  var fcSel   = document.getElementById('dlFilterFC');
  var countEl = document.getElementById('dlCount');
  var empty   = document.getElementById('dlEmpty');

  // ── Filter ──
  function applyFilter(){
    var q  = (search.value || '').trim().toLowerCase();
    var fc = fcSel.value;
    var vis = 0;
    cards.forEach(function(c){
      var nm = (c.dataset.name || '').toLowerCase();
      var cf = (c.dataset.fc  || '').toLowerCase();
      var ok = (fc === 'all' || cf === fc.toLowerCase()) && (!q || nm.indexOf(q) >= 0 || cf.indexOf(q) >= 0);
      c.style.display = ok ? '' : 'none';
      if(ok) vis++;
    });
    countEl.textContent = vis + ' ไฟล์';
    empty.classList.toggle('show', vis === 0);
  }
  search.addEventListener('input', applyFilter);
  fcSel.addEventListener('change', applyFilter);

  // ── Preview toggle (lazy load) ──
  window.togglePreview = function(btn){
    var open = btn.dataset.open === 'true';
    var pre  = btn.nextElementSibling;
    btn.dataset.open = !open;
    btn.querySelector('span:first-child').textContent = open ? '▶ ดู CLI Preview' : '▼ ซ่อน Preview';
    pre.classList.toggle('open', !open);

    if(!open && pre.textContent === 'Loading...'){
      var fc = pre.dataset.fc, fn = pre.dataset.fn;
      fetch('/downloads/' + encodeURIComponent(fc) + '/' + encodeURIComponent(fn))
        .then(function(r){ return r.text(); })
        .then(function(t){ pre.textContent = t.slice(0,3000) + (t.length>3000?'\n... (truncated)':''); })
        .catch(function(){ pre.textContent = 'Preview unavailable'; });
    }
  };

  // ── Copy CLI ──
  document.getElementById('dlGrid').addEventListener('click', function(e){
    var btn = e.target.closest('.dl-btn-copy');
    if(!btn) return;
    var fc = btn.dataset.fc, fn = btn.dataset.fn;
    fetch('/downloads/' + encodeURIComponent(fc) + '/' + encodeURIComponent(fn))
      .then(function(r){ return r.text(); })
      .then(function(t){
        return navigator.clipboard.writeText(t);
      })
      .then(function(){
        showToast('✅ คัดลอก CLI สำเร็จ — paste ใน Betaflight CLI');
        btn.textContent = '✅ Copied!';
        setTimeout(function(){ btn.innerHTML = '📋 Copy CLI'; }, 2000);
      })
      .catch(function(){ showToast('❌ คัดลอกไม่สำเร็จ'); });
  });

  function showToast(msg){
    var t = document.getElementById('v5Toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); }, 2800);
  }
})();
