// static/js/fpv-gear.js — Batch E: extracted from templates/fpv_gear.html inline <script>. No logic change.

(function(){
  const SHOP_URLS = {
    shopee:  q => 'https://shopee.co.th/search?keyword=' + encodeURIComponent(q),
    lazada:  q => 'https://www.lazada.co.th/catalog/?q=' + encodeURIComponent(q),
    ali:     q => 'https://www.aliexpress.com/wholesale?SearchText=' + encodeURIComponent(q)
  };

  // ── wire buy buttons ─────────────────────────────────
  document.querySelectorAll('[data-platform]').forEach(btn => {
    const card = btn.closest('[data-search]');
    if (!card) return;
    const q = card.dataset.search || card.dataset.name || '';
    const platform = btn.dataset.platform;
    if (SHOP_URLS[platform]) btn.href = SHOP_URLS[platform](q);
  });

  // ── wishlist (localStorage) ───────────────────────────
  const WL_KEY = 'cd_fpv_wishlist';
  function loadWL(){ try{ return JSON.parse(localStorage.getItem(WL_KEY)||'[]'); }catch(e){ return []; } }
  function saveWL(list){ try{ localStorage.setItem(WL_KEY, JSON.stringify(list)); }catch(e){} }

  function renderWL(){
    const list = loadWL();
    const count = list.length;
    // sidebar count
    const sc = document.getElementById('wlSideCount');
    if(sc) sc.textContent = count ? '(' + count + ')' : '';
    // float badge
    const fc = document.getElementById('wlFloatCount');
    if(fc) fc.textContent = count;
    const floatBtn = document.getElementById('wlFloatBtn');
    if(floatBtn) floatBtn.style.display = count ? 'flex' : 'none';
    // empty state
    const empty = document.getElementById('wlEmpty');
    if(empty) empty.style.display = count ? 'none' : 'block';
    // sidebar list
    const body = document.getElementById('wlSideBody');
    if(body){
      // remove old items (keep empty div)
      body.querySelectorAll('.wl-item').forEach(e=>e.remove());
      if(body.querySelector('.wl-clear')) body.querySelector('.wl-clear').remove();
      if(count){
        list.forEach(item => {
          const div = document.createElement('div');
          div.className = 'wl-item';
          div.innerHTML = '<span class="wi-name">' + item.name + '</span>'
            + (item.price ? '<span class="wi-price">' + item.price + '</span>' : '')
            + '<button type="button" class="wi-rm" data-id="' + item.id + '" title="ลบ">✕</button>';
          body.appendChild(div);
        });
        const clrBtn = document.createElement('button');
        clrBtn.className = 'wl-clear';
        clrBtn.textContent = 'ล้างทั้งหมด';
        clrBtn.onclick = () => { saveWL([]); renderWL(); updateSaveBtns(); };
        body.appendChild(clrBtn);
        body.querySelectorAll('.wi-rm').forEach(btn => {
          btn.addEventListener('click', e => {
            const id = btn.dataset.id;
            saveWL(loadWL().filter(x=>x.id!==id));
            renderWL(); updateSaveBtns();
          });
        });
      }
    }
  }

  function updateSaveBtns(){
    const list = loadWL();
    const ids = new Set(list.map(x=>x.id));
    document.querySelectorAll('[data-action="save"]').forEach(btn => {
      const card = btn.closest('[data-id]');
      if(!card) return;
      const id = card.dataset.id;
      const saved = ids.has(id);
      btn.classList.toggle('saved', saved);
      btn.innerHTML = saved
        ? '<span class="save-ic">♥</span> บันทึกแล้ว'
        : '<span class="save-ic">♡</span> บันทึกไว้ดูทีหลัง';
    });
  }

  document.querySelectorAll('[data-action="save"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-id]');
      if(!card) return;
      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = card.dataset.price;
      let list = loadWL();
      const idx = list.findIndex(x=>x.id===id);
      if(idx>=0) list.splice(idx,1);
      else list.push({id, name, price});
      saveWL(list);
      renderWL();
      updateSaveBtns();
    });
  });

  // float → scroll to wishlist sidebar
  const floatBtn = document.getElementById('wlFloatBtn');
  if(floatBtn) floatBtn.addEventListener('click', () => {
    const sb = document.querySelector('.shop-sidebar');
    if(sb) sb.scrollIntoView({behavior:'smooth'});
  });

  renderWL();
  updateSaveBtns();

  // ── category tab highlight on scroll ─────────────────
  const navLinks = document.querySelectorAll('#catNav a[data-cat]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.id;
        const cat = id.replace('cat-','');
        navLinks.forEach(a => a.classList.toggle('active', a.dataset.cat===cat));
      }
    });
  }, {rootMargin:'-40% 0px -55% 0px'});
  document.querySelectorAll('.cat-section').forEach(s => observer.observe(s));

  // ── starter kit tabs ─────────────────────────────────
  document.querySelectorAll('.kit-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.kit-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.kit-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('kit-' + tab.dataset.kit);
      if(panel) panel.classList.add('active');
    });
  });

  // ── wire kit buy buttons ──────────────────────────────
  document.querySelectorAll('.kit-card [data-platform]').forEach(btn => {
    const card = btn.closest('[data-search]');
    if(!card) return;
    const q = card.dataset.search || card.dataset.name || '';
    const platform = btn.dataset.platform;
    if(SHOP_URLS[platform]) btn.href = SHOP_URLS[platform](q);
  });

})();
