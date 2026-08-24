(() => {
  "use strict";
  const search = document.querySelector("[data-cc-search]");
  const filters = [...document.querySelectorAll("[data-cc-filter]")];
  const tools = [...document.querySelectorAll("[data-cc-tool]")];
  const count = document.querySelector("[data-cc-count]");
  const emptyState = document.querySelector("[data-cc-empty]");
  let active = "all";

  function normalize(v){ return String(v || "").toLowerCase().trim(); }

  function apply(){
    const q = normalize(search?.value);
    let visible = 0;
    tools.forEach(tool => {
      const hay = normalize(tool.textContent + " " + tool.dataset.category + " " + tool.dataset.keywords);
      const cat = normalize(tool.dataset.category);
      const matchesQuery = !q || hay.includes(q);
      const matchesFilter = active === "all" || cat.split(/\s+/).includes(active);
      const show = matchesQuery && matchesFilter;
      tool.classList.toggle("hidden", !show);
      if(show) visible++;
    });
    if(count) count.textContent = `${visible} tools`;
    if(emptyState) emptyState.hidden = visible !== 0;
  }

  filters.forEach(btn => btn.addEventListener("click", () => {
    active = normalize(btn.dataset.ccFilter);
    filters.forEach(b => {
      const isActive = b === btn;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
    apply();
  }));

  search?.addEventListener("input", apply);

  document.querySelectorAll("[data-scroll]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      document.querySelector(btn.getAttribute("href"))?.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });

  // Keyboard shortcut: / focuses the launcher on desktop.
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      search?.focus();
    }
    if (e.key === "Escape") search?.blur();
  });

  apply();
})();
