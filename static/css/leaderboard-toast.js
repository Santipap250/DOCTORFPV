// static/js/leaderboard-toast.js — Batch E: extracted from templates/leaderboard.html (second inline script) inline <script>. No logic change.

window.showToast = function(msg, type, dur) {
  var t = document.getElementById('uiToast');
  if (!t) return;
  t.textContent = msg;
  t.className = (type === 'error' ? 'error' : type === 'info' ? 'info' : '') + ' show';
  clearTimeout(t._tid);
  t._tid = setTimeout(function() { t.className = t.className.replace(' show',''); }, dur || 2400);
};
// Scroll-animate observer (re-runs on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function() {
(function() {
  if (!window.IntersectionObserver) return;
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('ui-visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.ui-fade-up').forEach(function(el) { obs.observe(el); });
})();
});
