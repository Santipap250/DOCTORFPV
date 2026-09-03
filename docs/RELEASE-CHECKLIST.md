# DOCTORFPV Release Checklist

Use this checklist before treating a `main` commit as production-ready.

## GitHub

- [ ] `git diff --check` passes
- [ ] No `.env`, SQLite database, `.pyc`, cache or log files are staged
- [ ] `python -m pytest -q` passes locally when dependencies are installed
- [ ] GitHub Actions CI for the exact `main` commit is green
- [ ] No unexpected uncommitted changes remain

## Render

- [ ] Render is Live
- [ ] Render is deploying the same Git commit as GitHub `main`
- [ ] Health Check Path is `/healthz`
- [ ] `GET /healthz` returns HTTP 200 and `{"status":"ok"}`
- [ ] `GET /landing` returns HTTP 200
- [ ] `GET /app` returns HTTP 200
- [ ] No startup traceback / worker crash / recent 5xx in runtime logs

## Firmware CLI smoke test

- [ ] Betaflight 3.5.x uses legacy parameter names
- [ ] Betaflight 4.0–4.2 uses the compatibility-tier names
- [ ] Betaflight 4.3+ uses modern parameter names
- [ ] Dynamic Notch names are not confused with Dynamic LPF names
- [ ] Generated CLI displays the selected firmware target/tier

## Release discipline

- [ ] Do not modify business calculations during a documentation-only release
- [ ] Do not disable or weaken CI to bypass failures
- [ ] Do not deploy while the latest CI run is red
- [ ] Record any intentionally deferred work in QA-REPORT.md
