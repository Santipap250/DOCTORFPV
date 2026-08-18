/*
 * static/js/patterns.js — OBIX ConfigDoctor Pattern Library behaviors
 * ============================================================
 * Phase 1 of the Command Center rebuild. Loaded globally (base.html).
 * Purely additive — does not touch any existing page-specific script
 * or global function name (existing copyCLI()/copyDelta() etc. on
 * individual pages are untouched and keep working as-is).
 *
 * Usage:
 *   <button class="dc-btn dc-btn--copy" data-dc-copy="#my-cli-block">Copy</button>
 *   <div id="my-cli-block" class="dc-cli-block">set ...</div>
 *
 *   <div class="dc-toast-region" id="dc-toast-region" aria-live="polite"></div>
 */
(function () {
  'use strict';

  function dcToast(message) {
    var region = document.getElementById('dc-toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'dc-toast-region';
      region.setAttribute('aria-live', 'polite');
      region.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 76px);transform:translateX(-50%);z-index:9999;';
      document.body.appendChild(region);
    }
    var el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'background:var(--surface-elevated,#142130);border:1px solid var(--border-hi,rgba(255,255,255,.12));color:var(--text,#dde8f0);padding:10px 16px;border-radius:10px;font-size:13px;box-shadow:var(--shadow,0 16px 48px rgba(0,0,0,.65));margin-top:8px;';
    region.appendChild(el);
    window.setTimeout(function () {
      el.style.transition = 'opacity 200ms ease';
      el.style.opacity = '0';
      window.setTimeout(function () { el.remove(); }, 220);
    }, 2200);
  }

  function dcCopyText(text, triggerEl) {
    var done = function (ok) {
      if (!triggerEl) return;
      dcToast(ok ? 'คัดลอกแล้ว' : 'คัดลอกไม่สำเร็จ ลองอีกครั้ง');
      if (ok) {
        triggerEl.classList.add('is-copied');
        window.setTimeout(function () { triggerEl.classList.remove('is-copied'); }, 1600);
      }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    // Fallback for non-secure contexts / older browsers
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) {
      done(false);
    }
  }

  document.addEventListener('click', function (evt) {
    var trigger = evt.target.closest('[data-dc-copy]');
    if (!trigger) return;
    var selector = trigger.getAttribute('data-dc-copy');
    var source = document.querySelector(selector);
    if (!source) return;
    var text = 'value' in source ? source.value : source.textContent;
    dcCopyText(text.trim(), trigger);
  });

  window.dcToast = dcToast;
  window.dcCopyText = dcCopyText;
})();
