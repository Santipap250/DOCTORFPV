(() => {
  "use strict";

  const search = document.querySelector("[data-cc-search]");
  const clearSearch = document.querySelector("[data-cc-clear-search]");
  const filters = [...document.querySelectorAll("[data-cc-filter]")];
  const tools = [...document.querySelectorAll("[data-cc-tool]")];
  const count = document.querySelector("[data-cc-count]");
  const emptyState = document.querySelector("[data-cc-empty]");
  const recentWrap = document.querySelector("[data-cc-recent-wrap]");
  const recentList = document.querySelector("[data-cc-recent]");
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const recentKey = "configdoctor.recent-tools.v1";
  let active = "all";

  const normalize = (value) => String(value || "").toLowerCase().trim();

  function applyFilters() {
    const query = normalize(search?.value);
    let visible = 0;

    tools.forEach((tool) => {
      const category = normalize(tool.dataset.category);
      const haystack = normalize(
        `${tool.textContent} ${tool.dataset.category} ${tool.dataset.keywords}`
      );
      const matchesQuery = !query || haystack.includes(query);
      const matchesCategory = active === "all" || category.split(/\s+/).includes(active);
      const show = matchesQuery && matchesCategory;

      tool.classList.toggle("hidden", !show);
      tool.setAttribute("aria-hidden", String(!show));
      if (show) visible += 1;
    });

    if (count) count.textContent = `${visible} tools`;
    if (emptyState) emptyState.hidden = visible !== 0;
    if (clearSearch) clearSearch.hidden = !query;
  }

  function readRecent() {
    try {
      const value = JSON.parse(localStorage.getItem(recentKey) || "[]");
      return Array.isArray(value) ? value.slice(0, 4) : [];
    } catch (_) {
      return [];
    }
  }

  function writeRecent(items) {
    try {
      localStorage.setItem(recentKey, JSON.stringify(items.slice(0, 4)));
    } catch (_) {
      // Private browsing or storage-disabled browsers should still work normally.
    }
  }

  function renderRecent() {
    if (!recentWrap || !recentList) return;
    const items = readRecent();
    recentList.replaceChildren();
    recentWrap.hidden = items.length === 0;

    items.forEach((item) => {
      const link = document.createElement("a");
      link.className = "cc-recent-item";
      link.href = item.route;
      link.innerHTML = `<span>${item.label}</span><small>${item.category || "TOOL"}</small>`;
      recentList.appendChild(link);
    });
  }

  function rememberTool(tool) {
    if (!tool) return;
    const item = {
      route: tool.getAttribute("href") || "#",
      label: tool.querySelector(".cc-tool-title")?.textContent.trim() || "Tool",
      category: tool.dataset.category || "tool",
    };
    const next = [item, ...readRecent().filter((old) => old.route !== item.route)];
    writeRecent(next);
    renderRecent();
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

  clearSearch?.addEventListener("click", () => {
    if (!search) return;
    search.value = "";
    applyFilters();
    search.focus();
  });

  tools.forEach((tool) => {
    tool.addEventListener("click", () => rememberTool(tool));
  });

  document.querySelector("[data-cc-clear-recent]")?.addEventListener("click", () => {
    writeRecent([]);
    renderRecent();
  });

  document.querySelectorAll("[data-cc-focus-search]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const target = document.querySelector("#mission-control");
      target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      const focusSearch = () => search?.focus({ preventScroll: true });
      reducedMotion ? focusSearch() : window.setTimeout(focusSearch, 300);
    });
  });

  document.querySelectorAll("[data-scroll]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const selector = trigger.getAttribute("href");
      const target = selector ? document.querySelector(selector) : null;
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });

      const focusSearch = () => target.querySelector("input")?.focus({ preventScroll: true });
      reducedMotion ? focusSearch() : window.setTimeout(focusSearch, 300);
    });
  });

  document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const typing = activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);

    if (event.key === "/" && !typing) {
      event.preventDefault();
      search?.focus();
    }

    if (event.key === "Escape" && activeElement === search) {
      search.blur();
    }
  });

  renderRecent();
  applyFilters();
})();
