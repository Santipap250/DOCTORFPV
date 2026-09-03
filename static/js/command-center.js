(() => {
  "use strict";
  const search = document.querySelector("[data-cc-search]");
  const filters = [...document.querySelectorAll("[data-cc-filter]")];
  const tools = [...document.querySelectorAll("[data-cc-tool]")];
  const count = document.querySelector("[data-cc-count]");
  const emptyState = document.querySelector("[data-cc-empty]");
  let active = "all";

  const normalize = (value) => String(value || "").toLowerCase().trim();

  function applyFilters() {
    const query = normalize(search?.value);
    let visible = 0;
    tools.forEach((tool) => {
      const category = normalize(tool.dataset.category);
      const haystack = normalize(`${tool.textContent} ${tool.dataset.category} ${tool.dataset.keywords}`);
      const matchesQuery = !query || haystack.includes(query);
      const matchesCategory = active === "all" || category.split(/\s+/).includes(active);
      const show = matchesQuery && matchesCategory;
      tool.classList.toggle("hidden", !show);
      if (show) visible += 1;
    });
    if (count) count.textContent = `${visible} tools`;
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      active = normalize(button.dataset.ccFilter);
      filters.forEach((item) => {
        const activeState = item === button;
        item.classList.toggle("is-active", activeState);
        item.setAttribute("aria-pressed", String(activeState));
      });
      applyFilters();
    });
  });

  search?.addEventListener("input", applyFilters);

  document.querySelectorAll("[data-scroll]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const selector = trigger.getAttribute("href");
      const target = selector ? document.querySelector(selector) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => target.querySelector("input")?.focus({ preventScroll: true }), 300);
    });
  });

  document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const typing = activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);
    if (event.key === "/" && !typing) {
      event.preventDefault();
      search?.focus();
    }
    if (event.key === "Escape" && activeElement === search) search.blur();
  });

  applyFilters();
})();
