# OBIX ConfigDoctor
## FPV Diagnostic & Tuning Command Center

**OBIX ConfigDoctor** เป็นเว็บแอปสำหรับช่วยนักบิน FPV วิเคราะห์การตั้งค่า ประเมินระบบโดรน และสร้างคำแนะนำ/CLI ที่ใช้งานได้ตรงกับ Betaflight firmware tier ที่เลือก

เป้าหมายหลักคือทำให้การวิเคราะห์ FPV จาก “อาการหรือสเปก” ไปสู่ “เครื่องมือ → ผลวิเคราะห์ → ขั้นตอนถัดไป” ทำได้ง่ายขึ้นทั้งบนมือถือและเดสก์ท็อป

## Live

- Production: https://configdoctor.onrender.com
- Source: https://github.com/Santipap250/DOCTORFPV

## Current capabilities

### Drone analysis
- Frame size, weight, propeller, battery และ flight style analysis
- Motor/prop, battery, thermal และ control-loop helpers
- Performance estimates และ analysis reports

### Tuning & Betaflight
- PID symptom advice
- Quick tune helpers
- Rates visualization
- RPM filter calculations
- Betaflight configuration wizard
- CLI surgeon / comparator
- Firmware-aware CLI generation

### Blackbox & utilities
- Blackbox CSV analysis
- OSD tools
- VTX tools
- Build Card / Tuning Log
- FPV gear and knowledge pages

### Firmware-aware CLI
The analyzer accepts a Betaflight firmware version and maps CLI parameter names to the supported compatibility tier:

- **Legacy:** Betaflight < 4.0
- **4.0–4.2:** Betaflight 4.0.x–4.2.x
- **Modern:** Betaflight 4.3+

The firmware compatibility layer is centralized in `logic/firmware_compat.py`, while CLI generation is handled by `analyzer/cli_export.py`. The web flow passes the selected version through the analyzer backend and renders the generated CLI from `analysis.cli_meta`.

### Tool Registry
Public tool/page metadata is centralized in `logic/tool_registry.py` and consumed by navigation and sitemap generation. The current public registry contains **29 entries**. Operational/API/system endpoints are intentionally not part of the registry.

## Architecture

```text
DOCTORFPV/
├── app.py                    # Flask application + security/config
├── core.py                   # shared analyzer/DB flow
├── analyzer/                 # domain analysis + CLI generation
├── blueprints/               # Flask route groups
├── logic/
│   ├── tool_registry.py      # canonical public tool/page registry
│   └── firmware_compat.py    # Betaflight version → CLI mapping
├── templates/                # Jinja templates
├── static/                   # CSS / JS / images
├── tests/                    # automated tests
├── .github/workflows/ci.yml  # GitHub Actions pytest gate
├── render.yaml               # Render deployment baseline
├── requirements.txt          # production dependencies
└── requirements-dev.txt      # test/development dependencies
```

## Quality gates

Before merging or deploying:

```bash
python -m pytest -q
```

GitHub Actions runs the same command automatically on pushes and pull requests.

Production should only be considered release-ready when:

```text
GitHub CI        ✅ green
Render deploy    ✅ live
/healthz         ✅ 200 + {"status":"ok"}
/landing         ✅ 200
/app             ✅ 200
Firmware 3.x     ✅ correct legacy CLI
Firmware 4.0–4.2 ✅ correct compatibility CLI
Firmware 4.3+   ✅ correct modern CLI
```

## Local setup

See [`SETUP.md`](SETUP.md) for the complete setup, testing and Render deployment instructions.

## Security baseline

The production configuration includes CSRF protection, rate limiting, secure cookie settings, request-size limits, security headers, and a dedicated `/healthz` endpoint. Never commit `.env` or production secrets.

## Database

The default runtime database is SQLite with WAL settings. This is suitable for the current single-worker deployment. PostgreSQL is a future scalability option for multi-worker/high-concurrency workloads.

## Project identity

**OBIX Config Lab**  
Developer: **SanTiPapHacker / Santipap250**  
Copyright © 2026 Santipap. All rights reserved.

This repository is published for the project owner’s use. Redistribution, resale, or commercial reuse should follow the project owner’s chosen license/permission policy.
