# app.py — OBIXConfig Doctor v5.2
# ============================================================
# v5.2 — Security Hardening · Rate Limiting · CSP Fix
# v5.1 — FPV Simulator NEO · Quick Tune Pad · Physics Accuracy Fixes
# v2.3 — Blackbox CSV Analyzer + Full Tool Suite
# Tools: PID/Filter · Blackbox · CLI Surgeon · PID Advisor
#        RPM Filter · ESC Checker · Rates · VTX · OSD · Motor
# ============================================================

# ── Load .env สำหรับ local dev (ถ้ามี python-dotenv) ──────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from flask import (Flask, render_template, request, send_from_directory,
                   abort, send_file, jsonify, url_for)
from flask import (Flask, render_template, request, send_from_directory,
                   abort, send_file, jsonify, url_for)
from werkzeug.middleware.proxy_fix import ProxyFix
import os, time, logging, hashlib
from datetime import datetime

from core import (
    logger, _get_db, _db_lock, _ip_hash, _TRUST_PROXY,
    evaluate_rules, CLI_EXPORT_AVAILABLE, build_cli_diff, build_snapshot_meta,
    SECRET_SAUCE_AVAILABLE, generate_secret_sauce, PRESET_GROUPS,
    ADV_ANALYSIS_AVAILABLE, make_advanced_report,
    GEAR_MODULE_AVAILABLE, _gear_recommend, _gear_starter_kits, _gear_categories,
    _gear_disclaimer, _gear_all_by_category, _GEAR_CATEGORY_ORDER,
    _STYLE_MAP, _normalize_style, _cells_from_str,
    _HASH_CACHE, _file_sha256,
    PRESETS, detect_class_from_size, get_baseline_for_class,
    get_pid_for_class_style, get_filter_for_class,
    analyze_propeller, cells_from_battery_string, is_valid_battery_string,
    calculate_thrust_weight, estimate_battery_runtime, estimate_battery_runtime_detail,
    secure_filename, cli_analyze_dump,
    validate_input, classify_weight, analyze_drone,
    _parse_analysis_form, _handle_analysis_get_params, _handle_analysis_post,
    _recommend_motor_prop,
    get_all_symptoms, _get_symptom_advice, SYMPTOM_ADVISOR_AVAILABLE,
    calculate_rpm_filter, RPM_FILTER_AVAILABLE,
    analyze_blackbox_csv, BLACKBOX_AVAILABLE,
    _cleanup_osd_files, _timestamped_filename,
    _generate_osd_text_from_model, _generate_cli_from_model,
)

# ─────────────────────────────────────────────────────────────────────────────
# RATINGS & LIKES — SQLite persistent storage
# ─────────────────────────────────────────────────────────────────────────────


# ── CSRF Protection ───────────────────────────────────────────────────────
try:
    from flask_wtf.csrf import CSRFProtect, generate_csrf
    CSRF_AVAILABLE = True
except ImportError:
    CSRF_AVAILABLE = False
    logging.warning("flask_wtf not installed — CSRF protection disabled")

# ── Compression ───────────────────────────────────────────────────────────
try:
    from flask_compress import Compress
    COMPRESS_AVAILABLE = True
except ImportError:
    COMPRESS_AVAILABLE = False
    logging.warning("flask_compress not installed — response compression disabled")

# ── Rate Limiting ─────────────────────────────────────────────────────────
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False
    logging.warning("flask_limiter not installed — rate limiting disabled")


# ── Flask app ─────────────────────────────────────────────────────────────
app = Flask(__name__)

# FIX (critical): templates/index.html uses a |md5 filter to build a
# cosmetic "build fingerprint" hash for display. It was never registered,
# so every POST to /app — i.e. every actual use of the Drone Analyzer —
# was crashing with "jinja2.exceptions.TemplateRuntimeError: No filter
# named 'md5' found." This is unrelated to the calculation-logic fixes
# in this pass; found while re-running the test suite end-to-end.
@app.template_filter('md5')
def _jinja_md5_filter(s):
    return hashlib.md5(str(s).encode('utf-8')).hexdigest()

# RENDER FIX: trust one hop of X-Forwarded-For/Proto from Render's proxy
# Without this, remote_addr is always 127.0.0.1 → ALL users share one rate-limit bucket
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# SECURITY: ถ้า SECRET_KEY ไม่ถูก set ใน env จะ crash ทันที (ป้องกัน fallback key)
_secret = os.environ.get("SECRET_KEY", "")
if not _secret:
    import sys
    if os.environ.get("FLASK_DEBUG", "0") in ("1", "true", "True"):
        # local dev — ใช้ key ชั่วคราว แต่แจ้งเตือน
        _secret = "dev-only-insecure-key-do-not-use-in-production"
        logging.warning("SECRET_KEY not set — using insecure dev key")
    else:
        # production — crash hard เพื่อให้ fix ก่อน deploy
        sys.exit("FATAL: SECRET_KEY environment variable is not set. "
                 "Set it in Render dashboard before deploying.")
app.config['SECRET_KEY'] = _secret
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB global upload limit

# ── SHA-256 hash cache (avoid recomputing on every /downloads request) ────

# ── sitemap.xml daily cache (was referenced but never declared — caused a 500) ──
_SITEMAP_CACHE: dict = {}

# ── App start timestamp — ใช้ทำ ETag ให้ lightweight (เปลี่ยนทุก redeploy) ──
_APP_START_TIME: str = str(int(time.time()))

# ── Enable gzip/brotli compression ───────────────────────────────────────
if COMPRESS_AVAILABLE:
    Compress(app)

# ── Init CSRF protection ──────────────────────────────────────────────────
if CSRF_AVAILABLE:
    csrf = CSRFProtect(app)
    app.config['WTF_CSRF_TIME_LIMIT'] = 3600
    app.config['WTF_CSRF_HEADERS']    = ['X-CSRFToken', 'X-CSRF-Token']

    @app.after_request
    def inject_csrf_cookie(response):
        generate_csrf()
        return response

# SECURITY PATCH: SESSION_COOKIE_SECURE=True by default; set FORCE_INSECURE=1 only for local HTTP dev
FORCE_INSECURE = os.environ.get("FORCE_INSECURE", "0") in ("1", "true", "True")

# ── BASE_URL: single source of truth for all absolute URL generation ──
_BASE_URL = os.environ.get("BASE_URL", "https://configdoctor.onrender.com").rstrip("/")


@app.context_processor
def inject_base_url():
    """Inject BASE_URL into every Jinja2 template context."""
    return {"BASE_URL": _BASE_URL}
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=not FORCE_INSECURE,  # PATCH: Secure=True by default
)
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', '0') in ('1', 'true', 'True')


# ── Init Rate Limiter ─────────────────────────────────────────────────────
if LIMITER_AVAILABLE:
    # Use Redis if REDIS_URL is set in env (Render Redis add-on), else fall back to in-memory
    storage_uri = os.getenv("REDIS_URL", "memory://")
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[],          # No blanket limit — apply per-route only
        storage_uri=storage_uri,
    )
    logger.info("Rate limiter storage: %s", "redis" if storage_uri != "memory://" else "memory")
    def _rate(limit_str):
        """Decorator shortcut สำหรับ rate limit"""
        return limiter.limit(limit_str)
else:
    # Fallback no-op decorator เมื่อ flask_limiter ไม่ถูก install
    def _rate(limit_str):
        def decorator(f): return f
        return decorator

@app.template_filter('timestamp_to_datetime')
def timestamp_to_datetime_filter(ts):
    try:
        return datetime.fromtimestamp(int(ts)).strftime('%Y-%m-%d %H:%M')
    except Exception:
        return ''

# ═════════════════════════════════════════════════════════════════════════
# Security Headers — applied to every response
# ═════════════════════════════════════════════════════════════════════════
@app.after_request
def set_security_headers(response):
    response.headers["X-Frame-Options"]        = "SAMEORIGIN"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"]       = "1; mode=block"
    response.headers["Referrer-Policy"]        = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]     = "geolocation=(), microphone=(), camera=()"
    if request.is_secure or request.headers.get("X-Forwarded-Proto", "") == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' "
        "  https://cdnjs.cloudflare.com "
        "  https://cdn.jsdelivr.net "
        "  https://fonts.googleapis.com "
        "  https://www.gstatic.com; "
        "style-src 'self' 'unsafe-inline' "
        "  https://fonts.googleapis.com "
        "  https://fonts.gstatic.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' "
        "  https://*.firebaseio.com "
        "  https://*.firebasedatabase.app "
        "  wss://*.firebaseio.com "
        "  wss://*.firebasedatabase.app "
        "  https://*.supabase.co "
        "  https://*.supabase.net; "
        "frame-ancestors 'self';"
    )
    # PATCH BW-1: Static assets 1 year cache (immutable fingerprinted files)
    if request.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    # FIX SEC-1: HTML pages — MUST be private because every page contains a
    # per-user CSRF token via og_tags.html meta tag.
    # Using 'public' or 's-maxage' would allow CDN/proxy to cache one user's
    # CSRF token and serve it to another user → token leak.
    # ETag is computed from request.path + template mtime (not response body)
    # to avoid loading the full HTML into memory on every request.
    elif request.method == 'GET' and response.status_code == 200:
        if 'text/html' in response.content_type:
            response.headers['Cache-Control'] = 'private, max-age=300'
            # Lightweight ETag: hash of path + app start time (changes on redeploy)
            etag_src = f"{request.path}:{_APP_START_TIME}"
            etag_val = hashlib.md5(etag_src.encode()).hexdigest()[:16]
            response.headers['ETag'] = f'"{etag_val}"'
            if_none_match = request.headers.get('If-None-Match', '').strip('"')
            if if_none_match and if_none_match == etag_val:
                response.status_code = 304
                response.set_data(b'')
    return response
# ── Error handlers ─────────────────────────────────────────────────────────
@app.errorhandler(404)
def page_not_found(e): return render_template("404.html"), 404

@app.errorhandler(500)
def internal_server_error(e):
    app.logger.exception("Unhandled server error")
    return render_template("500.html"), 500

@app.errorhandler(429)
def rate_limit_exceeded(e):
    """Rate limit exceeded — คืน JSON สำหรับ API, HTML สำหรับ browser"""
    if request.is_json or request.path.startswith('/api') or request.path in (
        '/analyze_cli', '/compare_cli', '/blackbox/analyze'
    ):
        return jsonify({"error": "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่"}), 429
    return render_template("429.html"), 429



# ═════════════════════════════════════════════════════════════════════════
# Blueprints — feature-grouped routes split out of this file
# (Phase 2 + Phase 3 of the 2026-07-22 audit). Imported here, at the bottom,
# because several of these modules import names back from this module
# (e.g. get_all_symptoms, _get_db, _rate); those names must already exist
# in app's namespace before those imports run.
# ═════════════════════════════════════════════════════════════════════════
from blueprints.content_pages import bp as _content_pages_bp
from blueprints.tools_vtx import bp as _tools_vtx_bp
from blueprints.tools_static import bp as _tools_static_bp
from blueprints.tools_advisor import bp as _tools_advisor_bp
from blueprints.meta import bp as _meta_bp
from blueprints.downloads import bp as _downloads_bp
from blueprints.api_community import bp as _api_community_bp
from blueprints.tools_gear import bp as _tools_gear_bp
from blueprints.tools_rpm import bp as _tools_rpm_bp
from blueprints.tools_analysis import bp as _tools_analysis_bp
from blueprints.tools_cli_api import bp as _tools_cli_api_bp
from blueprints.tools_osd import bp as _tools_osd_bp

app.register_blueprint(_content_pages_bp)
app.register_blueprint(_tools_vtx_bp)
app.register_blueprint(_tools_static_bp)
app.register_blueprint(_tools_advisor_bp)
app.register_blueprint(_meta_bp)
app.register_blueprint(_downloads_bp)
app.register_blueprint(_api_community_bp)
app.register_blueprint(_tools_gear_bp)
app.register_blueprint(_tools_rpm_bp)
app.register_blueprint(_tools_analysis_bp)
app.register_blueprint(_tools_cli_api_bp)
app.register_blueprint(_tools_osd_bp)


if __name__ == "__main__":
    # ส่วนการตรวจสอบ Template ทำงานปกติได้
    try:
        from jinja2 import Environment, FileSystemLoader as _FL
        _env = Environment(loader=_FL("templates"))
        _env.get_template("index.html")
        logger.info("Startup: template validation passed ✓")
    except Exception as _te:
        logger.error("Startup: template validation FAILED - %s", _te)

# ลบชุดคำสั่ง app.run() ด้านล่างทิ้งไปเลยให้เหลือแค่นี้พอค่ะ คลีนที่สุดสำหรับ Vercel
