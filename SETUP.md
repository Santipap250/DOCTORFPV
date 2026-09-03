# OBIX ConfigDoctor — Setup & Release Guide

## 1. Clone

```bash
git clone https://github.com/Santipap250/DOCTORFPV.git
cd DOCTORFPV
```

## 2. Create a virtual environment

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux/Termux:

```bash
source .venv/bin/activate
```

## 3. Install dependencies

Runtime only:

```bash
python -m pip install -r requirements.txt
```

Development/test environment:

```bash
python -m pip install -r requirements-dev.txt
```

## 4. Environment

Copy the template:

```bash
cp .env.example .env
```

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

For local development, set the generated value in `.env`:

```text
SECRET_KEY=your-generated-secret
FLASK_ENV=development
FLASK_DEBUG=0
TRUST_PROXY=0
FORCE_INSECURE=0
BASE_URL=http://127.0.0.1:10000
```

Do not commit `.env`.

## 5. Run locally

```bash
python app.py
```

Open:

```text
http://127.0.0.1:10000/landing
```

Health check:

```text
http://127.0.0.1:10000/healthz
```

Expected JSON:

```json
{"status":"ok"}
```

## 6. Run the test suite

```bash
python -m pytest -q
```

Useful focused runs:

```bash
python -m pytest tests/test_firmware_compat.py tests/test_firmware_ui.py tests/test_firmware_e2e.py -q
python -m pytest tests/test_registry_integrity.py tests/test_healthz.py -q
```

GitHub Actions runs `python -m pytest -q` automatically on pushes and pull requests.

## 7. Git hygiene

Do not commit:

```text
.env
__pycache__/
*.pyc
.pytest_cache/
.coverage
*.log
data/*.db
```

The repository `.gitignore` already excludes these paths.

## 8. Render deployment

The production service is:

```text
https://configdoctor.onrender.com
```

The repository contains `render.yaml` with the baseline production configuration, including:

- Python runtime
- `main` branch
- automatic deploys
- Gunicorn
- one worker for the current SQLite deployment
- `/healthz` HTTP health check
- `FLASK_DEBUG=0`
- `FLASK_ENV=production`
- `FORCE_INSECURE=0`

Keep the production `SECRET_KEY` in Render Environment Variables. Never put it in GitHub.

## 9. Release procedure

Before pushing a release:

```bash
git status
git diff --check
python -m pytest -q
git add .
git commit -m "chore: release-ready cleanup"
git push origin main
```

After push:

1. Wait for GitHub Actions CI to finish green.
2. Confirm Render deploy uses the same commit.
3. Confirm Render is Live.
4. Confirm `/healthz` returns HTTP 200.
5. Confirm `/landing` and `/app` return HTTP 200.
6. Exercise Firmware 3.x, 4.0–4.2 and 4.3+ CLI paths.
7. Inspect Render runtime logs for startup errors, 5xx responses, worker crashes or memory pressure.

## 10. Database

SQLite is the default runtime store and uses WAL/busy-timeout settings. The current Render deployment is intentionally single-worker.

Move to PostgreSQL when there is a concrete need for multiple workers, stronger persistence requirements, or higher concurrent write volume.

## 11. Troubleshooting

### `ModuleNotFoundError: No module named 'flask'`

Install the development dependencies:

```bash
python -m pip install -r requirements-dev.txt
```

### Tests collect but application imports fail

Verify the virtual environment is active and that `requirements-dev.txt` was installed from the repository root.

### Database permission problems

Ensure the `data/` directory exists and is writable by the application process.

### Render deploy is live but health check is unhealthy

Check:

```text
/healthz
Render runtime logs
SECRET_KEY
required environment variables
startup command
```

## 12. Project structure

```text
DOCTORFPV/
├── app.py
├── core.py
├── analyzer/
├── blueprints/
├── logic/
├── templates/
├── static/
├── tests/
├── docs/
├── .github/workflows/ci.yml
├── render.yaml
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── Procfile
└── .env.example
```
