# ConfigDoctor

ConfigDoctor is an FPV drone configuration and analysis tool for checking build inputs, tuning-related settings, and helper calculations.

## What it does

- Analyze basic drone build inputs
- Suggest tuning and setup guidance
- Estimate performance-related values
- Provide tool pages for FPV workflows
- Offer mobile-friendly HTML pages for core workflows

## Tech stack

- Python
- Flask
- Jinja2 templates
- SQLite for community data (set `COMMUNITY_DB_PATH` to a persistent disk path in production)
- Gunicorn for production

## Run locally

```bash
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Open `http://localhost:10000`

## Deployment notes

- `Procfile` is configured for Gunicorn
- Set `SECRET_KEY` in production
- Set `TRUST_PROXY=1` only when the app is behind a trusted reverse proxy
- SQLite works for single-server deployments; for production on Render, point `COMMUNITY_DB_PATH` to a persistent disk (for example `/var/data/community.db`) so likes/ratings survive restarts.

## Project structure

```text
DOCTOR-CONFIG-FPV--main/
├── app.py
├── core.py
├── analyzer/
├── blueprints/
├── templates/
├── static/
├── tests/
└── requirements.txt
```

## License

All rights reserved by the project owner unless a separate license is added.
