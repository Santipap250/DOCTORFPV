# OBIX ConfigDoctor

**FPV Diagnostic & Tuning Command Center**

OBIX ConfigDoctor is a mobile-first web toolkit for FPV pilots. It brings configuration analysis, tuning guidance, Blackbox analysis, CLI tools, rates, battery/motor calculations, VTX utilities and FPV knowledge into one workflow.

## Live

- https://configdoctor.onrender.com

## Core workflow

**Identify → Verify → Change → Test → Log**

Start with the symptom or task, use evidence where possible, change one variable at a time, then record the result.

## Main tool groups

- Drone configuration analysis
- PID / filter guidance
- Quick tuning
- RPM filter
- Rates visualization
- Betaflight configuration wizard
- Motor / propeller analysis
- Battery and thrust calculations
- Blackbox CSV analysis
- CLI Surgeon and CLI comparison
- OSD designer
- VTX tools
- FPV training / knowledge
- Build and tuning logs

## Architecture

```text
DOCTORFPV/
├── app.py
├── core.py
├── analyzer/
├── blueprints/
├── logic/
│   └── tool_registry.py
├── templates/
├── static/
├── data/
├── tests/
├── requirements.txt
├── requirements-dev.txt
├── Procfile
└── render.yaml
```

### Canonical Tool Registry

`logic/tool_registry.py` is the canonical metadata source for public tools.

It feeds:

- the Tool Launcher
- Command Center
- sitemap generation
- tool search/filter metadata

API/internal/system endpoints must not be added to the public registry merely because they are Flask routes.

## Local development

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS/Termux: source .venv/bin/activate

pip install -r requirements.txt
pip install -r requirements-dev.txt
pytest -q
```

## Render

Production uses:

```text
Runtime: Python
Build: pip install -r requirements.txt
Start: Gunicorn
Health: /healthz
Region: Singapore
```

`render.yaml` documents the intended deployment configuration. Review existing Render environment variables before syncing a Blueprint.

Render's HTTP health check should remain lightweight and return a 2xx response without doing expensive analysis or external-service calls.

## Data / persistence

SQLite is suitable for the current lightweight deployment, but Render filesystem storage is not a substitute for durable application data. If community data becomes important, migrate durable state to a managed database and define a backup/restore procedure.

## Security

The application currently uses security controls including CSRF protection, rate limiting, secure cookie settings, security headers, upload limits and path containment checks. Keep secrets in Render environment variables and never commit `.env` files.

## Tuning safety

Recommendations are starting points, not guarantees. Inspect props, motors, ESCs, battery condition and Blackbox evidence before making aggressive changes. Change one variable at a time and keep a known-good configuration backup.

## License / ownership

Copyright © 2026 Santipap / OBIX Config Lab.
