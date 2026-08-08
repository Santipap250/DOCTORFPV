# 🚀 ConfigDoctor — Setup Guide

## Quick Start

### 1. Clone & Enter the Project
```bash
git clone <YOUR_REPOSITORY_URL>
cd DOCTOR-CONFIG-FPV
```

### 2. Create a Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Environment Variables
```bash
cp .env.example .env
```

Set a strong `SECRET_KEY` inside `.env`:
```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
```

### 5. Prepare Data Folders
```bash
mkdir -p data static/downloads/osd static/downloads/diff_all
```

### 6. Run the App
```bash
python app.py
```

Open `http://localhost:10000`

---

## Production Run

Use Gunicorn in production:

```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 60
```

---

## Render Deployment

Set these environment variables in Render:

```bash
SECRET_KEY=your-strong-secret-key
TRUST_PROXY=1
FLASK_DEBUG=0
COMMUNITY_DB_PATH=/var/data/community.db
```

If you want community likes/ratings to persist across restarts, attach a persistent disk in Render and mount it at `/var/data`.

Build command:
```bash
pip install -r requirements.txt
```

Start command:
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 60
```

---

## Troubleshooting

- If you see a `SECRET_KEY` error, create a new `.env` value and redeploy.
- If the browser shows a 500 error, check the server logs for a missing template or dependency.
- If rate limiting behaves oddly behind a proxy, make sure `TRUST_PROXY=1` is set only on trusted hosts.
