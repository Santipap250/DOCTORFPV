(function () {
  'use strict';

  const launcher = document.getElementById('toolLauncher');
  const backdrop = document.getElementById('launcherBackdrop');
  const openers = document.querySelectorAll('.js-launcher-open');
  const closeBtn = document.getElementById('launcherClose');
  const search = document.getElementById('launcherSearch');
  const count = document.getElementById('launcherCount');
  const tabs = Array.from(document.querySelectorAll('.cd-launcher__tabs button'));
  const grid = document.getElementById('launcherGrid');
  const empty = document.getElementById('launcherEmpty');
  const topbar = document.getElementById('topbar');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tools = Array.isArray(window.__CONFIGDOCTOR_TOOL_LAUNCHER__)
    ? window.__CONFIGDOCTOR_TOOL_LAUNCHER__
    : [];

  const icons = {
    core: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"></rect><path d="M7 13h2l1.2-4 2.6 7 1.2-3H17"></path></svg>',
    tune: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4v16M12 4v16M18 4v16"></path><circle cx="6" cy="9" r="2"></circle><circle cx="12" cy="15" r="2"></circle><circle cx="18" cy="8" r="2"></circle></svg>',
    hw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.3 5.2L20 10l-4.2 3.7L17 19l-5-2.8L7 19l1.2-5.3L4 10l5.7-1.8z"></path></svg>',
    explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"></circle><path d="m14.8 9.2-2 4.3-4.3 2 2-4.3z"></path></svg>'
  };

  let activeCat = 'ALL';
  let lastOpener = null;
  let locked = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function filteredTools() {
    const query = (search?.value || '').trim().toLowerCase();
    return tools.filter((tool) => {
      if (activeCat !== 'ALL' && tool.cat !== activeCat) return false;
      if (!query) return true;
      return `${tool.name} ${tool.desc} ${tool.cat}`.toLowerCase().includes(query);
    });
  }

  function render() {
    if (!grid || !count || !empty) return;
    const filtered = filteredTools();
    count.textContent = String(filtered.length);
    empty.hidden = filtered.length !== 0;
    grid.innerHTML = filtered.map((tool) => {
      const icon = icons[tool.icon] || icons.core;
      return `<a class="cd-launcher-item" href="${escapeHtml(tool.href)}"><span class="cd-launcher-item__icon is-${escapeHtml(tool.icon || 'core')}">${icon}</span><strong>${escapeHtml(tool.name)}</strong><p>${escapeHtml(tool.desc)}</p></a>`;
    }).join('');
    tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.cat === activeCat));
  }

  function openLauncher(event) {
    if (!launcher || !backdrop) return;
    lastOpener = event?.currentTarget || document.activeElement;
    launcher.classList.add('is-open');
    backdrop.classList.add('is-open');
    launcher.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    openers.forEach((btn) => btn.setAttribute('aria-expanded', 'true'));
    locked = true;
    document.body.style.overflow = 'hidden';
    render();
    window.setTimeout(() => search?.focus(), reduceMotion ? 0 : 100);
  }

  function closeLauncher() {
    if (!launcher || !backdrop) return;
    launcher.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    launcher.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    openers.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
    locked = false;
    document.body.style.overflow = '';
    if (lastOpener && typeof lastOpener.focus === 'function') window.setTimeout(() => lastOpener.focus(), 0);
  }

  openers.forEach((btn) => btn.addEventListener('click', openLauncher));
  closeBtn?.addEventListener('click', closeLauncher);
  backdrop?.addEventListener('click', closeLauncher);
  search?.addEventListener('input', render);
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    activeCat = tab.dataset.cat || 'ALL';
    render();
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && launcher?.classList.contains('is-open')) closeLauncher();
    if (event.key === '/' && !locked && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      event.preventDefault();
      openLauncher();
    }
  });

  window.addEventListener('scroll', () => {
    topbar?.classList.toggle('is-scrolled', window.scrollY > 10);
  }, { passive: true });

  const revealTargets = document.querySelectorAll('.cd-reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  render();
})();
