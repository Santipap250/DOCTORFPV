// static/js/team.js — Batch E: extracted from templates/team.html inline <script>. No logic change.

/* ── Background video: lazy-load only when the device/network can handle it ── */
(function(){
  var v = document.getElementById('teamBgVideo');
  if(!v) return;

  var conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  var saveData = !!(conn && conn.saveData);
  var slow = !!(conn && /(^|[^0-9])2g/i.test(conn.effectiveType || ''));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(saveData || slow || reduceMotion){
    document.body.classList.add('no-team-bg-video');
    return;
  }

  var sources = v.querySelectorAll('source[data-src]');
  sources.forEach(function(s){
    if(!s.getAttribute('src')) s.setAttribute('src', s.getAttribute('data-src'));
  });

  try { v.load(); } catch(e) {}
  var playPromise = v.play();
  if(playPromise && typeof playPromise.catch === 'function'){
    playPromise.catch(function(){
      // If autoplay is blocked, the poster / plain gradient remains visible.
    });
  }
})();

/* ── Particle canvas ───────────────────────────── */
(function(){
  const canvas = document.getElementById('team-particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a,b){ return a + Math.random()*(b-a); }

  function spawn(){
    return {
      x: rand(0, W),
      y: H + 10,
      r: rand(0.5, 2),
      speed: rand(0.4, 1.2),
      opacity: rand(0.2, 0.7),
      color: Math.random() > .5 ? '16,196,122' : '0,170,255',
      dx: rand(-0.3, 0.3),
    };
  }

  for(let i=0; i<60; i++){
    const p = spawn();
    p.y = rand(0, H);
    particles.push(p);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    particles.forEach((p,i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
      ctx.fill();
      p.y -= p.speed;
      p.x += p.dx;
      if(p.y < -10){ particles[i] = spawn(); }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── Scroll reveal ─────────────────────────────── */
(function(){
  if(!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.dev-card, .ai-card, .team-stat, .sensor-badge').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    obs.observe(el);
  });
})();
