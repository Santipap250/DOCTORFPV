# Production QA Report — DOCTORFPV

**Repository:** https://github.com/Santipap250/DOCTORFPV  
**Production:** https://configdoctor.onrender.com  
**Document role:** Current release/QA status and historical batch record

## Current status

The project has completed the planned 8-batch rebuild covering architecture cleanup, design tokens, tool registry, Command Center, firmware-aware CLI generation, mobile/accessibility/performance work, security/SEO hardening, and documentation/QA cleanup.

### Current architecture gates

| Gate | Status | Notes |
|---|---|---|
| Flask application | 🟢 | Main application and blueprints are present |
| Tool Registry | 🟢 | 29 public registry entries; unique IDs/routes enforced by tests |
| Sitemap | 🟢 | Generated from the canonical registry plus `/landing` |
| Firmware compatibility | 🟢 | Legacy / 4.0–4.2 / 4.3+ tiers |
| Firmware UI | 🟢 | Version selection is wired through the analyzer flow |
| Firmware E2E coverage | 🟢 | `/app` is exercised for 3.5.7, 4.2.11 and 4.4.3 |
| Health endpoint | 🟢 | `/healthz` returns JSON status |
| Render health check | 🟢 | Configured as `/healthz` |
| GitHub Actions | 🟢 | Push + PR pytest workflow exists |
| Production database | 🟡 | SQLite/WAL; acceptable for current single-worker deployment |
| UI pattern migration | 🟡 | `dc-*` patterns are not yet adopted by every legacy tool page |
| Blackbox firmware auto-detect → CLI | 🟡 | Detection exists; automatic handoff into CLI generation is future work |

## Public tool registry

The canonical registry currently contains **29 public tool/page entries** in `logic/tool_registry.py`.

The registry intentionally excludes operational/system endpoints such as:

```text
/healthz
/robots.txt
/sitemap.xml
/api/*
/analyze_cli
/compare_cli
/blackbox/analyze
/osd/export
```

Legacy military/UAS content is not part of the public FPV tool registry.

## Firmware-aware CLI

The supported compatibility tiers are:

```text
legacy    → Betaflight < 4.0
4.0-4.2   → Betaflight 4.0.x–4.2.x
4.3+      → Betaflight 4.3.0+
```

The request flow is:

```text
Firmware selection
      ↓
bf_version
      ↓
normalize_version()
      ↓
resolve_tier()
      ↓
build_cli_diff()
      ↓
analysis.cli_meta
      ↓
HTML CLI output
```

Dynamic Notch parameters are kept separate from Dynamic LPF parameters.

## CI / release gate

GitHub Actions is the authoritative automated regression gate.

The workflow runs:

```bash
python -m pytest -q
```

A release should not be treated as production-ready until the latest `main` commit has a green CI run and the corresponding Render deployment is healthy.

## Historical 8-batch record

| Batch | Scope | Final outcome |
|---|---|---|
| 1 | Audit fixes | Community DB path/WAL fixes and downloads route hardening |
| 2 | Design tokens | Canonical token layer and reusable pattern library introduced |
| 3 | Tool registry | Single public registry connected to nav/sitemap |
| 4 | Command Center | Landing tool launcher rendered from registry |
| 5 | Firmware-aware CLI | Firmware tier mapping and version-aware CLI generation |
| 6 | Mobile/a11y/performance | Touch targets, ARIA cleanup, responsive/performance improvements |
| 7 | Security/SEO | Flask/Werkzeug hardening and registry-derived metadata |
| 8 | Docs/QA | Documentation cleanup, setup correction, CI workflow and release hygiene |

## Remaining backlog

### P1 — production verification

- Keep GitHub CI green on the current `main` commit.
- Confirm the same commit is live on Render.
- Confirm `/healthz`, `/landing` and `/app` after each release.

### P2 — feature improvements

- Wire Blackbox-detected firmware directly into CLI generation where appropriate.
- Expand `dc-*` pattern adoption across the remaining legacy tool templates.
- Add PostgreSQL when multi-worker/high-concurrency deployment becomes necessary.

These are enhancements, not reasons to redesign the current application architecture.

## Non-regression principles

- Do not remove working routes without a migration plan.
- Keep calculation/business logic separate from templates.
- Keep firmware parameter mapping centralized.
- Keep public tool/page metadata centralized in `logic/tool_registry.py`.
- Do not weaken CI just to make a failing build appear green.
- Do not commit secrets, runtime SQLite databases, or generated artifacts.

## Release decision

**Current codebase:** 🟢 Release Candidate  
**Production release gate:** 🟡 Requires the latest GitHub Actions run to be green and Render smoke checks to confirm the deployed commit.
