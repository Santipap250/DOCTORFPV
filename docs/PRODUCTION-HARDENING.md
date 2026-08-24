# Production Hardening — Batch 3 Follow-up

This patch package is designed for the current `Santipap250/DOCTORFPV` main branch.

## Included

1. `render.yaml`
   - documents the Render service configuration
   - enables `/healthz` as the HTTP health check
   - keeps one Gunicorn worker because the current application uses SQLite

2. `tests/test_healthz.py`
   - verifies `/healthz` returns HTTP 200 JSON

3. `tests/test_registry_integrity.py`
   - validates registry IDs/routes/required fields
   - ensures system endpoints are not public tools
   - prevents the legacy military tool from returning to the public registry

4. `patches/app.py.patch`
   - removes the duplicate Flask import

5. `patches/tool_registry.py.patch`
   - documents the intended removal of the legacy military-UAS registry entry
   - IMPORTANT: because the exact entry is large, apply this logically rather than blindly
     if your local file differs from the current GitHub revision.

6. `README.md`
   - replaces stale architecture and future-feature documentation

## Verification

Run:

```bash
pip install -r requirements.txt -r requirements-dev.txt
pytest -q
```

Then verify:

```bash
curl -i https://configdoctor.onrender.com/healthz
```

Expected:

```json
{"status":"ok"}
```

Only after the tests pass should `render.yaml` be synced with the existing Render service.

## Important

This package intentionally does NOT change:

- analyzer algorithms
- database schema
- Gunicorn worker count
- production secrets
- Render environment variable values
- existing public routes

The goal is a low-risk production-hardening gate before the Command Center Batch 4 work.
