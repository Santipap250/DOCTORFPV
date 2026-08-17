# core.py — OBIXConfig Doctor shared business logic
# ============================================================
# Extracted from app.py (Phase 4 core split, 2026-07-22) so the
# analysis/validation/db logic has zero dependency on the Flask `app`
# object. app.py imports the names it needs from here and re-exports
# them, so blueprints/*.py (which do `from app import X`) did not need
# to change. Tests that exercise these functions directly should
# import them from here (see tests/test_analyzer_route_fixes.py).
# ============================================================

import os, io, re, time, json, hashlib, logging
import sqlite3, threading as _threading
from datetime import datetime

from flask import request

from logic.presets import (PRESETS, detect_class_from_size,
                            get_baseline_for_class, get_pid_for_class_style,
                            get_filter_for_class)
from analyzer.prop_logic import analyze_propeller
from analyzer.units import cells_from_battery_string, is_valid_battery_string
from analyzer.thrust_logic import (calculate_thrust_weight,
                                    estimate_battery_runtime,
                                    estimate_battery_runtime_detail)
from werkzeug.utils import secure_filename
from analyzer.cli_surgeon import analyze_dump as cli_analyze_dump


# ── Logger init — MUST be first before any try/except import blocks ───────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("configdoctor")

import sqlite3, threading as _threading

_DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'community.db')
_db_lock = _threading.Lock()


def _get_db():
    """Open (or create) the SQLite community DB and ensure tables exist."""
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ratings (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_hash  TEXT    NOT NULL,
            stars    INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
            created  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        )""")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS likes (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_hash TEXT    NOT NULL UNIQUE,
            created INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        )""")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_rating_ip ON ratings(ip_hash)")
    conn.commit()
    return conn

# FIX C3: trust X-Forwarded-For only when TRUST_PROXY=1 in env
#         ถ้าไม่ set จะใช้ remote_addr ตรงๆ ป้องกัน header spoofing bypass rate-limit/vote
_TRUST_PROXY = os.environ.get("TRUST_PROXY", "0") in ("1", "true", "True")

def _ip_hash(request_obj):
    """SHA-256 of real client IP.
    ใช้ X-Forwarded-For เฉพาะเมื่อ TRUST_PROXY=1 (ตั้งค่าใน Render env vars)
    เพื่อป้องกัน header spoofing จาก client ทั่วไป
    """
    if _TRUST_PROXY:
        ip = request_obj.headers.get('X-Forwarded-For', '').split(',')[0].strip()
    else:
        ip = ''
    ip = ip or request_obj.remote_addr or 'unknown'
    return hashlib.sha256(ip.encode()).hexdigest()

# ── Optional modules ──────────────────────────────────────────────────────
try:
    from analyzer.rule_engine import evaluate_rules
except Exception as e:
    evaluate_rules = None
    logging.warning("rule_engine import failed: %s", e)

try:
    from analyzer.cli_export import build_cli_diff, build_snapshot_meta
    CLI_EXPORT_AVAILABLE = True
except Exception as e:
    CLI_EXPORT_AVAILABLE = False
    def build_cli_diff(a): return "# cli_export not available"
    def build_snapshot_meta(a): return {}

try:
    from analyzer.secret_sauce import generate_secret_sauce
    SECRET_SAUCE_AVAILABLE = True
except Exception as e:
    SECRET_SAUCE_AVAILABLE = False
    def generate_secret_sauce(*args, **kwargs): return {"cli": "# secret_sauce not available", "insights": [], "params": {}}
    logging.warning("secret_sauce import failed: %s", e)

try:
    from logic.presets import get_preset_groups
    PRESET_GROUPS = get_preset_groups()
except Exception:
    PRESET_GROUPS = {}

try:
    from analyzer.advanced_analysis import make_advanced_report
    ADV_ANALYSIS_AVAILABLE = True
except Exception as e:
    logging.warning("advanced_analysis import failed: %s", e)
    def make_advanced_report(*args, **kwargs): return {"advanced": {}}
    ADV_ANALYSIS_AVAILABLE = False

# ── FPV Affiliate Gear module — extension/UI layer, fully isolated from
#    analyzer/ and logic/ (see affiliate/gear_recommender.py docstring).
#    It never touches PID/motor-prop/blackbox math; it only reads the
#    already-computed drone_class/style/size strings to pick catalog
#    entries. Deleting affiliate/ + this try/except + the /fpv-gear route
#    below removes the whole feature with zero impact on analysis. ──────
try:
    from affiliate.gear_recommender import (
        recommend as _gear_recommend,
        get_starter_kits as _gear_starter_kits,
        get_categories as _gear_categories,
        get_disclaimer as _gear_disclaimer,
        get_all_by_category as _gear_all_by_category,
        CATEGORY_ORDER as _GEAR_CATEGORY_ORDER,
    )
    GEAR_MODULE_AVAILABLE = True
except Exception as e:
    GEAR_MODULE_AVAILABLE = False
    _GEAR_CATEGORY_ORDER = []
    def _gear_recommend(*args, **kwargs): return None
    def _gear_starter_kits(): return []
    def _gear_categories(): return {}
    def _gear_disclaimer(): return {"th": "", "en": ""}
    def _gear_all_by_category(): return {}
    logging.warning("affiliate.gear_recommender import failed: %s", e)

# ── Style normalizer ──────────────────────────────────────────────────────
_STYLE_MAP = {
    "micro": "freestyle", "whoop": "freestyle", "cine": "longrange",
    "mini": "freestyle", "heavy": "freestyle", "heavy_5": "freestyle",
    "mid_lr": "longrange", "long_range": "longrange",
    "longrange": "longrange", "racing": "racing", "freestyle": "freestyle",
    "cinematic": "longrange",  # FIX: ESC checker cinematic style
    "cinema": "longrange", "sport": "racing",
}

def _normalize_style(s: str) -> str:
    return _STYLE_MAP.get(str(s).lower().strip(), "freestyle")

def _cells_from_str(s):
    """Thin wrapper around the shared parser, kept for validate_input():
    returns None (not a default) when the string has no parseable cell
    count at all, so validate_input can warn the user instead of silently
    guessing. Everywhere else that needs a *usable* cell count should
    import cells_from_battery_string directly from analyzer.units."""
    if not is_valid_battery_string(s):
        return None
    return cells_from_battery_string(s, default=4, lo=1, hi=8)

# ── SHA-256 hash cache (avoid recomputing on every /downloads request) ────
_HASH_CACHE: dict = {}


def _file_sha256(path: str) -> str:
    """Return cached SHA-256 hex (first 16 chars). Recomputes only when mtime changes."""
    try:
        mtime = os.path.getmtime(path)
        cache_key = f"{path}:{mtime}"
        if cache_key not in _HASH_CACHE:
            h = hashlib.sha256()
            with open(path, 'rb') as f:
                for chunk in iter(lambda: f.read(65536), b''):
                    h.update(chunk)
            _HASH_CACHE[cache_key] = h.hexdigest()[:16]
        return _HASH_CACHE[cache_key]
    except Exception:
        logger.exception("_file_sha256 failed for %s", path)
        return "unknown"


# ═════════════════════════════════════════════════════════════════════════
# Validation
# ═════════════════════════════════════════════════════════════════════════
def validate_input(size, weight, prop_size, pitch, blades, battery,
                    motor_kv=None, motor_count=None, battery_mAh=None,
                    payload_g=None, esc_current_limit_a=None):
    warnings = []
    try:
        size = float(size)
    except Exception:
        warnings.append("ขนาด (size) ต้องเป็นตัวเลข"); size = 0.0
    if not (1 <= size <= 15):
        warnings.append("ขนาดโดรนควรอยู่ระหว่าง 1–15 นิ้ว")
    try:
        weight = float(weight)
        if weight <= 0 or weight > 8000:
            warnings.append("น้ำหนักโดรนควรอยู่ระหว่าง 1–8000 กรัม")
    except Exception:
        warnings.append("น้ำหนัก (weight) ต้องเป็นตัวเลข")
    try:
        prop_size = float(prop_size)
        if prop_size > (size + 4):
            warnings.append("ขนาดใบพัดดูใหญ่กว่าปกติสำหรับเฟรมที่ระบุ")
    except Exception:
        logger.debug("suppressed exception", exc_info=True)
    try:
        pitch = float(pitch)
        if not (1.5 <= pitch <= 8.0):
            warnings.append("Pitch ใบพัดอยู่นอกช่วงที่ใช้ทั่วไป")
    except Exception:
        logger.debug("suppressed exception", exc_info=True)
    try:
        blades = int(blades)
        if blades not in (2, 3, 4):
            warnings.append("จำนวนใบพัดควรเป็น 2, 3 หรือ 4")
    except Exception:
        warnings.append("จำนวนใบพัด (blades) ต้องเป็นจำนวนเต็ม")
    try:
        cells = _cells_from_str(battery)
        if cells is None or cells < 1 or cells > 8:
            warnings.append("แบตควรอยู่ในช่วง 1S ถึง 8S")
    except Exception:
        warnings.append("แบตรูปแบบผิด (เช่น 3S, 4S, 6S, 8S)")

    # FIX: these five fields used to have ZERO validation — a negative or
    # absurd motor_kv/motor_count/battery_mAh/payload_g/esc_current_limit_a
    # would flow straight into RPM, thrust, and ESC-sizing math with no
    # warning at all (e.g. motor_kv=-500 silently produces negative RPM).
    if motor_kv is not None:
        try:
            mk = float(motor_kv)
            if mk <= 0 or mk > 30000:
                warnings.append("Motor KV ควรอยู่ระหว่าง 1–30000")
        except Exception:
            warnings.append("Motor KV ต้องเป็นตัวเลข")
    if motor_count is not None:
        try:
            mc = int(motor_count)
            if mc not in (1, 2, 3, 4, 6, 8):
                warnings.append("จำนวนมอเตอร์ควรเป็น 1, 2, 3, 4, 6 หรือ 8")
        except Exception:
            warnings.append("จำนวนมอเตอร์ต้องเป็นจำนวนเต็ม")
    if battery_mAh is not None:
        try:
            mah = float(battery_mAh)
            if mah <= 0 or mah > 50000:
                warnings.append("ความจุแบต (mAh) ควรอยู่ระหว่าง 1–50000")
        except Exception:
            warnings.append("ความจุแบต (mAh) ต้องเป็นตัวเลข")
    if payload_g is not None:
        try:
            pg = float(payload_g)
            if pg < 0 or pg > 5000:
                warnings.append("น้ำหนักบรรทุกเพิ่ม (payload) ควรอยู่ระหว่าง 0–5000 กรัม")
        except Exception:
            warnings.append("น้ำหนักบรรทุกเพิ่ม (payload) ต้องเป็นตัวเลข")
    if esc_current_limit_a is not None:
        try:
            esc_a = float(esc_current_limit_a)
            if esc_a <= 0 or esc_a > 300:
                warnings.append("ESC current limit ควรอยู่ระหว่าง 1–300A")
        except Exception:
            warnings.append("ESC current limit ต้องเป็นตัวเลข")

    return warnings


def classify_weight(size, weight):
    try:
        size = float(size); weight = float(weight)
    except Exception:
        return "ไม่ระบุ"
    if size >= 5:
        if weight < 650:  return "เบา"
        if weight <= 900: return "กลาง"
        return "หนัก"
    return "ไม่ระบุ"

# ═════════════════════════════════════════════════════════════════════════
# Core analysis — now class+style aware
# ═════════════════════════════════════════════════════════════════════════
def analyze_drone(size, battery, style, prop_result, weight, detected_class=None, motor_kv=None):
    """
    Generate analysis dict. Uses detected_class + style for accurate PID/filter.
    If detected_class is None, falls back to style-only.

    motor_kv (optional): when the user provides it, dyn_notch_min/max are
    refined from the user's actual motor speed (see rpm_filter_calc.py)
    instead of a generic per-class static default — see note below.
    """
    analysis = {}
    try:
        sz = float(size)
    except Exception:
        sz = size

    analysis["overview"] = (
        f'โดรน {sz}" แบต {battery}, สไตล์ {style}, '
        f'ใบพัด: {prop_result.get("summary", "-") if isinstance(prop_result, dict) else "-"}'
    )
    analysis["weight_class"] = classify_weight(size, weight)
    analysis["basic_tips"] = [
        "ตรวจสอบใบพัดไม่บิดงอ",
        "ขันน็อตมอเตอร์ให้แน่น",
        "เช็คจุดบัดกรี ESC และแบตเตอรี่",
    ]

    # ── PID: use class+style lookup (accurate) ─────────────────────────
    if detected_class:
        pid = get_pid_for_class_style(detected_class, style)
        flt_raw = get_filter_for_class(detected_class)
    else:
        # fallback style-only (should rarely happen)
        if style == "racing":
            pid = {"roll": {"p":55,"i":83,"d":43}, "pitch": {"p":58,"i":83,"d":45}, "yaw": {"p":45,"i":78,"d":0}}
            flt_raw = {"gyro_lpf1":200, "gyro_lpf2":None, "dterm_lpf1":110, "dterm_lpf2":None, "dyn_notch_count":2, "rpm_filter":True, "anti_gravity":5}
        elif style == "longrange":
            pid = {"roll": {"p":38,"i":85,"d":22}, "pitch": {"p":40,"i":85,"d":24}, "yaw": {"p":32,"i":82,"d":0}}
            flt_raw = {"gyro_lpf1":150, "gyro_lpf2":None, "dterm_lpf1":90, "dterm_lpf2":None, "dyn_notch_count":1, "rpm_filter":True, "anti_gravity":3}
        else:  # freestyle
            pid = {"roll": {"p":48,"i":90,"d":38}, "pitch": {"p":52,"i":90,"d":40}, "yaw": {"p":40,"i":90,"d":0}}
            flt_raw = {"gyro_lpf1":200, "gyro_lpf2":None, "dterm_lpf1":110, "dterm_lpf2":None, "dyn_notch_count":2, "rpm_filter":True, "anti_gravity":5}

    analysis["pid"] = pid

    # ── Filter: comprehensive output ───────────────────────────────────
    _flt = {
        "gyro_lpf1":       flt_raw.get("gyro_lpf1"),
        "gyro_lpf2":       flt_raw.get("gyro_lpf2"),
        "dterm_lpf1":      flt_raw.get("dterm_lpf1"),
        "dterm_lpf2":      flt_raw.get("dterm_lpf2"),
        "dyn_notch_count": flt_raw.get("dyn_notch_count", 2),
        "dyn_notch_min":   flt_raw.get("dyn_notch_min"),
        "dyn_notch_max":   flt_raw.get("dyn_notch_max"),
        "rpm_filter":      flt_raw.get("rpm_filter", True),
        "anti_gravity":    flt_raw.get("anti_gravity", 5),
    }
    # Hz aliases — backward compat for templates that reference _hz keys
    _flt["gyro_lpf1_hz"]  = _flt["gyro_lpf1"]
    _flt["gyro_lpf2_hz"]  = _flt["gyro_lpf2"]
    _flt["dterm_lpf1_hz"] = _flt["dterm_lpf1"]
    _flt["dterm_lpf2_hz"] = _flt["dterm_lpf2"]
    _flt["dyn_notch"]     = _flt["dyn_notch_count"]  # short alias

    # ── FIX: personalize dyn_notch range from real motor speed ──────────
    # Without motor_kv, dyn_notch_min/max above are a flat per-class
    # default (e.g. every "freestyle" build gets 80-400Hz) regardless of
    # the user's actual motor/battery — even though calculate_rpm_filter()
    # already exists in this codebase and computes the real notch range
    # from KV+cells+prop (previously wired up only for the standalone
    # /rpm-filter tool, never for the main Drone Analyzer). A 2306KV/4S
    # build's real 1x fundamental at full throttle is ~473Hz, which the
    # static 400Hz max would clip — so when motor_kv is available, use
    # the personalized values instead.
    if motor_kv:
        try:
            mkv = float(motor_kv)
            if mkv > 0:
                _rpmf = calculate_rpm_filter(mkv, battery, float(size or 5.0))
                _rec = _rpmf.get("recommended", {}) if isinstance(_rpmf, dict) else {}
                if _rec.get("dyn_notch_min"):
                    _flt["dyn_notch_min"] = _rec["dyn_notch_min"]
                if _rec.get("dyn_notch_max"):
                    _flt["dyn_notch_max"] = _rec["dyn_notch_max"]
                if _rec.get("dyn_notch_count"):
                    _flt["dyn_notch_count"] = _rec["dyn_notch_count"]
                    _flt["dyn_notch"] = _rec["dyn_notch_count"]
                _flt["dyn_notch_source"] = "motor_kv"  # for UI: "personalized" vs "class default"
        except Exception:
            logger.exception("rpm-aware dyn_notch refinement failed for kv=%s", motor_kv)

    analysis["filter"] = _flt

    # ── Style tips ─────────────────────────────────────────────────────
    if style == "freestyle":
        analysis["extra_tips"] = ["Freestyle — ตอบสนองไว สมดุล I=90 RPM filter แนะนำ"]
    elif style == "racing":
        analysis["extra_tips"] = ["Racing — P สูง D สูง I ต่ำลงเล็กน้อยเพื่อ response ไว"]
    else:
        analysis["extra_tips"] = ["Long Range — P/D ต่ำ นิ่ง I สูงเพื่อ wind rejection"]

    # ── TWR (fallback — make_advanced_report overrides this with the
    # accurate value in the normal path; see thrust_logic.py for why this
    # fallback itself now uses real thrust data instead of a load score) ──
    try:
        effect = prop_result.get("effect", {}) if isinstance(prop_result, dict) else {}
        motor_load = effect.get("motor_load", 0)
        max_thrust_per_motor_g = effect.get("max_thrust_per_motor_g")
        analysis["thrust_ratio"] = calculate_thrust_weight(
            motor_load, float(weight),
            max_thrust_per_motor_g=max_thrust_per_motor_g, motor_count=4)
    except Exception:
        analysis["thrust_ratio"] = 0

    # ── Flight time (style-aware) ──────────────────────────────────────
    try:
        analysis["battery_est"] = estimate_battery_runtime(weight, battery, style=style, size_inch=float(size or 5.0))
    except Exception:
        analysis["battery_est"] = 0

    return analysis

# ═════════════════════════════════════════════════════════════════════════
# ROUTES
# ═════════════════════════════════════════════════════════════════════════
# ── FPV Affiliate Gear Guide — extension/UI layer only. ───────────────────
# Reads optional ?class=&style=&size= query params (set by links from the
# analysis result page / FPV hub) and maps them onto a small affiliate
# catalog (data/fpv_affiliate_products.json) via affiliate/gear_recommender.
# Does NOT read analyzer/PID/motor-prop/blackbox internals — only plain
# strings already computed elsewhere are passed in. No context → falls
# back to generic starter kits.
# ── Analysis helper — extracted from index() for readability ─────────────
def _parse_analysis_form():
    """Parse + validate form inputs. Returns (params_dict, warnings_list)."""
    def safe_float(x, default=0.0):
        try: return float(x)
        except Exception: return default
    def safe_int(x, default=0):
        try: return int(x)
        except Exception: return default

    preset_key  = request.form.get("preset", "").strip()
    size        = safe_float(request.form.get("size"), 5.0)
    battery     = request.form.get("battery", "4S")
    style_raw   = request.form.get("style", "freestyle")
    weight      = safe_float(request.form.get("weight"), 1000.0)
    prop_size   = safe_float(request.form.get("prop_size"), 5.0)
    blade_count = safe_int(request.form.get("blades"), 3)
    prop_pitch  = safe_float(request.form.get("pitch"), 4.0)
    battery_mAh       = safe_int(request.form.get("battery_mAh"), None)
    motor_count       = safe_int(request.form.get("motor_count"), 4)
    motor_kv          = safe_int(request.form.get("motor_kv"), None)
    weight      = max(10.0, weight)
    motor_count = max(1, motor_count)

    def _optional_float(key):
        v = request.form.get(key)
        try: return float(v) if v not in (None, "", "None") else None
        except Exception: return None

    payload_g           = _optional_float("payload_g")
    prop_thrust_g       = _optional_float("prop_thrust_g")
    esc_current_limit_a = _optional_float("esc_current_limit_a")

    # Preset override
    if preset_key:
        p = PRESETS.get(preset_key)
        if p:
            size        = float(p.get("size",       size))
            battery     = p.get("battery",           battery)
            style_raw   = p.get("style",             style_raw)
            weight      = float(p.get("weight",      weight))
            prop_size   = float(p.get("prop_size",   prop_size))
            prop_pitch  = float(p.get("pitch",       prop_pitch))
            blade_count = int(p.get("blades",        blade_count))

    return dict(
        preset_key=preset_key, size=size, battery=battery,
        style=_normalize_style(style_raw), weight=weight,
        prop_size=prop_size, blade_count=blade_count, prop_pitch=prop_pitch,
        battery_mAh=battery_mAh, motor_count=motor_count, motor_kv=motor_kv,
        payload_g=payload_g, prop_thrust_g=prop_thrust_g,
        esc_current_limit_a=esc_current_limit_a,
    )


def _handle_analysis_get_params():
    """Run analysis from GET query params (shared links).
    Maps ?size=5&battery=4S&style=freestyle&weight=700&... → same pipeline as POST."""
    def safe_float(x, default=0.0):
        try: return float(x)
        except Exception: return default
    def safe_int(x, default=0):
        try: return int(x) if x not in (None, "", "None") else default
        except Exception: return default

    a = request.args
    size        = safe_float(a.get("size"), 5.0)
    battery     = a.get("battery", "4S")
    style_raw   = a.get("style", "freestyle")
    weight      = max(10.0, safe_float(a.get("weight"), 720.0))
    prop_size   = safe_float(a.get("prop_size"), size)
    blade_count = safe_int(a.get("blades"), 3)
    prop_pitch  = safe_float(a.get("pitch"), 4.0)
    battery_mAh = safe_int(a.get("battery_mAh"), None) or None
    motor_count = max(1, safe_int(a.get("motor_count"), 4))
    motor_kv    = safe_int(a.get("motor_kv"), None) or None

    style = _normalize_style(style_raw)

    warnings = validate_input(size, weight, prop_size, prop_pitch, blade_count, battery,
                               motor_kv=motor_kv, motor_count=motor_count,
                               battery_mAh=battery_mAh)
    try:
        cls_det = detect_class_from_size(size)
        detected_class, class_meta = (cls_det[0], cls_det[1]) if isinstance(cls_det, (tuple, list)) else (cls_det, {})
    except Exception:
        detected_class, class_meta = "freestyle", {}

    try:
        _cells_int = cells_from_battery_string(battery, default=4, lo=1, hi=12)
        prop_result = analyze_propeller(prop_size, prop_pitch, blade_count, style,
                                        motor_kv=motor_kv, cells=_cells_int)
    except Exception:
        prop_result = {"summary": "n/a", "effect": {"motor_load": 0, "noise": 0,
                       "grip": "unknown", "efficiency": "unknown",
                       "est_g_per_w": None, "est_thrust_100w": None,
                       "pitch_speed_kmh": None, "notes": []}, "recommendation": ""}

    analysis = analyze_drone(size, battery, style, prop_result, weight, detected_class, motor_kv=motor_kv)
    analysis.update(dict(
        size=size, battery=battery, style=style, weight=weight,
        prop_size=prop_size, blade_count=blade_count, prop_pitch=prop_pitch,
        battery_mAh=battery_mAh, motor_count=motor_count, motor_kv=motor_kv,
        detected_class=detected_class, class_meta=class_meta,
        preset_used=None, warnings=warnings,
    ))

    try:
        from analyzer.advanced_analysis import make_advanced_report
        adv_extra = make_advanced_report(
            size=size, battery=battery, style=style,
            weight=weight, motor_kv=motor_kv, motor_count=motor_count,
            battery_mAh=battery_mAh,
            prop_size=prop_size, prop_pitch=prop_pitch, blade_count=blade_count,
        )
        analysis["advanced"] = adv_extra.get("advanced", {})
    except Exception:
        analysis.setdefault("advanced", {})

    try:
        from analyzer.rule_engine import apply_rules
        analysis["rules"] = apply_rules(analysis)
    except Exception:
        analysis.setdefault("rules", [])

    try:
        from analyzer.secret_sauce import get_secret_sauce
        analysis["secret_sauce"] = get_secret_sauce(
            detected_class, style, size, battery,
            motor_kv=motor_kv, prop_size=prop_size
        )
    except Exception:
        analysis.setdefault("secret_sauce", [])

    return analysis


def _handle_analysis_post():
    """Run full drone analysis from POST form data. Returns analysis dict."""
    p = _parse_analysis_form()
    size, battery, style = p["size"], p["battery"], p["style"]
    weight, prop_size    = p["weight"], p["prop_size"]
    blade_count, prop_pitch = p["blade_count"], p["prop_pitch"]
    battery_mAh, motor_count = p["battery_mAh"], p["motor_count"]
    motor_kv, payload_g  = p["motor_kv"], p["payload_g"]
    prop_thrust_g        = p["prop_thrust_g"]
    esc_current_limit_a  = p["esc_current_limit_a"]
    preset_key           = p["preset_key"]

    warnings = validate_input(size, weight, prop_size, prop_pitch, blade_count, battery,
                               motor_kv=motor_kv, motor_count=motor_count, battery_mAh=battery_mAh,
                               payload_g=payload_g, esc_current_limit_a=esc_current_limit_a)

    try:
        cls_det = detect_class_from_size(size)
        detected_class, class_meta = (cls_det[0], cls_det[1]) if isinstance(cls_det, (tuple, list)) else (cls_det, {})
    except Exception:
        detected_class, class_meta = "freestyle", {}

    try:
        # FIX (critical): this used to do
        #   int(str(battery).upper().replace("S","").strip())
        # which raises ValueError on anything except a bare "<N>S" string —
        # e.g. "4s2p", "6S+", "4S 1500mAh" (all real things people type).
        # That exception was caught by the `except` below, which discarded
        # the ENTIRE propeller analysis silently (no warning to the user —
        # they'd just get a degraded "prop analysis not available" result
        # while everything else looked like it worked fine). Using the
        # shared parser here means a weird battery string only affects the
        # cell-count guess, never blows up the whole propeller calculation.
        _cells_int = cells_from_battery_string(battery, default=4, lo=1, hi=12)
        prop_result = analyze_propeller(prop_size, prop_pitch, blade_count, style,
                                        motor_kv=motor_kv, cells=_cells_int)
    except Exception:
        logger.exception("analyze_propeller failed for size=%s pitch=%s blades=%s style=%s",
                          prop_size, prop_pitch, blade_count, style)
        prop_result = {
            "summary": "prop analysis not available",
            "effect": {"motor_load": 0, "noise": 0, "grip": "unknown",
                       "efficiency": "unknown", "est_g_per_w": None,
                       "est_thrust_100w": None, "pitch_speed_kmh": None, "notes": []},
            "recommendation": "",
        }

    try:
        analysis = analyze_drone(size, battery, style, prop_result, weight, detected_class, motor_kv=motor_kv)
    except Exception:
        logger.exception("analyze_drone failed for class=%s size=%s weight=%s", detected_class, size, weight)
        _fallback_pid = {"roll": {"p": 48, "i": 90, "d": 38},
                          "pitch": {"p": 52, "i": 90, "d": 40},
                          "yaw": {"p": 40, "i": 90, "d": 0}}
        _fallback_filter = {"gyro_lpf1": 100, "gyro_lpf2": 200, "dterm_lpf1": 75,
                             "dyn_notch": 2, "rpm_filter": True, "anti_gravity": 5,
                             "dyn_notch_min": 80, "dyn_notch_max": 400}
        analysis = {
            "style": style, "weight_class": "unknown", "thrust_ratio": 0,
            "flight_time": 0, "battery_est": 0, "est_flight_time_min": 0,
            "summary": "analysis fallback", "basic_tips": [],
            "pid": _fallback_pid, "filter": _fallback_filter, "extra_tips": [],
        }

    baseline_ctrl  = get_baseline_for_class(detected_class) or {}
    pid_axes       = baseline_ctrl.get("pid_axes", {})
    filter_baseline = baseline_ctrl.get("filter", {})
    r  = pid_axes.get("roll",  {"P": 48, "I": 90, "D": 38})
    pi = pid_axes.get("pitch", {"P": 52, "I": 90, "D": 40})
    y  = pid_axes.get("yaw",   {"P": 40, "I": 90, "D": 0})
    analysis["pid_baseline"] = {
        "roll":  {"p": r["P"],  "i": r["I"],  "d": r.get("D", 0)},
        "pitch": {"p": pi["P"], "i": pi["I"], "d": pi.get("D", 0)},
        "yaw":   {"p": y["P"],  "i": y["I"],  "d": 0},
    }
    analysis["filter_baseline"] = {
        "gyro_lpf1":  filter_baseline.get("gyro_lpf1"),
        "gyro_lpf2":  filter_baseline.get("gyro_lpf2"),
        "dterm_lpf1": filter_baseline.get("dterm_lpf1"),
        "dyn_notch":  filter_baseline.get("dyn_notch"),
        "gyro_lpf1_hz":    filter_baseline.get("gyro_lpf1"),
        "dterm_lpf2_hz":   filter_baseline.get("dterm_lpf2"),
        "rpm_filter":      filter_baseline.get("rpm_filter", True),
        "anti_gravity":    filter_baseline.get("anti_gravity", 5),
        "dyn_notch_min":   filter_baseline.get("dyn_notch_min"),
        "dyn_notch_max":   filter_baseline.get("dyn_notch_max"),
    }
    analysis["baseline_notes"]   = baseline_ctrl.get("notes", "")
    analysis["size"]             = size
    analysis["prop_size"]        = prop_size
    analysis["pitch"]            = prop_pitch
    analysis["motor_kv"]         = motor_kv
    analysis["preset_used"]      = preset_key or "custom"
    analysis["detected_class"]   = detected_class
    analysis["class_meta"]       = class_meta
    analysis["baseline_control"] = baseline_ctrl

    analysis.setdefault("style",   style)
    analysis.setdefault("summary", analysis.get("overview", ""))

    # ── Advanced analysis runs BEFORE the rule engine now. (FIX — real bug:
    # evaluate_rules() below reads analysis["advanced"].c_burst /
    # .esc_recommended_a / .tip_speed_mps / .peak_per_motor_a for its safety
    # warnings (overloaded battery, undersized ESC, dangerous tip speed).
    # Those all depend on analysis["advanced"] existing. It used to be
    # populated AFTER evaluate_rules() already ran, so every one of those
    # warning checks was silently looking at an empty dict and could never
    # fire — the safety warnings were effectively dead code in production.) ─
    _adv_inner: dict = {}
    _adv_power: dict = {}
    if ADV_ANALYSIS_AVAILABLE:
        try:
            adv = make_advanced_report(
                size=float(size), weight_g=float(weight),
                battery_s=battery, prop_result=prop_result,
                style=style, battery_mAh=battery_mAh,
                motor_count=motor_count,
                measured_thrust_per_motor_g=prop_thrust_g,
                motor_kv=motor_kv,
                esc_current_limit_a=esc_current_limit_a,
                blades=blade_count, payload_g=payload_g,
            )
            if isinstance(adv, dict):
                analysis.update(adv)
                _adv_inner = adv.get("advanced", {}) or {}
                _adv_power = _adv_inner.get("power", {}) or {}
        except Exception:
            logger.exception("Advanced analysis error")

    # ── Single flattening step — one source of truth (_adv_inner / _adv_power,
    # empty dicts if advanced analysis was unavailable or failed, in which
    # case these correctly fall back to whatever analyze_drone() set). ─────
    analysis["thrust_ratio"]             = _adv_inner.get("thrust_ratio", analysis.get("thrust_ratio", 0))
    analysis["est_flight_time_min"]      = _adv_power.get("est_flight_time_min", analysis.get("battery_est"))
    analysis["est_flight_time_min_aggr"] = _adv_power.get("est_flight_time_min_aggressive")
    analysis["esc_recommended_a"]        = _adv_inner.get("esc_recommended_a") or _adv_power.get("esc_recommended_a")
    analysis["hover_throttle_pct"]       = _adv_inner.get("hover_throttle_pct") or _adv_power.get("hover_throttle_pct")
    analysis["tip_speed_mps"]            = (_adv_inner.get("tip_speed_mps") or
                                             prop_result.get("effect", {}).get("tip_speed_mps"))
    analysis["rpm_estimated"]            = _adv_inner.get("rpm_estimated")
    analysis["c_burst"]                  = _adv_inner.get("c_burst") or _adv_power.get("c_burst")
    analysis["c_continuous"]             = _adv_inner.get("c_continuous") or _adv_power.get("c_continuous")
    analysis["c_recommended"]            = _adv_inner.get("c_recommended") or _adv_power.get("c_recommended")
    analysis["peak_per_motor_a"]         = _adv_inner.get("peak_per_motor_a")
    analysis["max_power_total_w"]        = _adv_inner.get("max_power_total_w") or _adv_power.get("est_max_power_w")

    # ── Rule engine — now runs AFTER analysis["advanced"] is populated ─────
    if evaluate_rules:
        try:
            analysis["rules"] = evaluate_rules(analysis)
        except Exception:
            logger.exception("Rule engine error")
            analysis["rules"] = []
    else:
        analysis["rules"] = []

    try:
        ft_detail = estimate_battery_runtime_detail(weight, battery, battery_mAh, style, float(size or 5.0))
        analysis["flight_time_detail"] = ft_detail
        analysis.setdefault("est_flight_time_min", ft_detail.get("avg_flight_min"))
    except Exception:
        logger.debug("suppressed exception", exc_info=True)

    norm_warnings = []
    for w in warnings:
        if isinstance(w, dict):
            norm_warnings.append({"level": w.get("level", "warning"), "msg": w.get("msg", str(w))})
        else:
            norm_warnings.append({"level": "warning", "msg": str(w)})
    analysis["warnings"] = norm_warnings

    effect = prop_result.get("effect", {})
    effect.setdefault("motor_load",       0)
    effect.setdefault("noise",            0)
    effect.setdefault("grip",             "unknown")
    effect.setdefault("est_g_per_w",      None)
    effect.setdefault("pitch_speed_kmh",  None)
    effect.setdefault("notes",            [])
    prop_result["effect"] = effect
    analysis["prop_result"] = prop_result

    if SECRET_SAUCE_AVAILABLE:
        try:
            _adv = analysis.get("advanced", {})
            sauce = generate_secret_sauce(
                cls_key=detected_class, style=style, battery=battery,
                size_inch=size, weight_g=weight, motor_kv=motor_kv,
                prop_size=prop_size, pid=analysis.get("pid", {}),
                flt=analysis.get("filter", {}),
                rpm_estimated=_adv.get("rpm_estimated") or analysis.get("rpm_estimated"),
                tip_speed_mps=_adv.get("tip_speed_mps") or analysis.get("tip_speed_mps"),
            )
            analysis["secret_sauce"] = sauce
        except Exception:
            logger.exception("Secret sauce error")
            analysis["secret_sauce"] = None
    else:
        analysis["secret_sauce"] = None

    analysis["motor_kv"]      = motor_kv
    analysis["battery_mAh"]   = battery_mAh   # FIX-B: store for template use
    analysis["weight"]         = weight         # FIX-C: store for template use
    logger.info("analysis keys: %s", list(analysis.keys()))
    return analysis


# ── Motor × Prop recommender ──────────────────────────────────────────────
def _recommend_motor_prop(form):
    try:
        size        = float(form.get('size')       or 5.0)
        weight_g    = float(form.get('weight')     or 900)
        battery     = form.get('battery')          or "4S"
        battery_mAh = int(form.get('battery_mAh') or 1500)
        prop_size   = float(form.get('prop_size')  or 5.0)
        blades      = int(form.get('blades')       or 3)
        pitch       = float(form.get('pitch')      or 4.0)
        motor_count = int(form.get('motor_count')  or 4)
        style       = _normalize_style(form.get('style') or 'freestyle')
        # FIX v5.1: clamp weight_g and motor_count to safe minimums
        weight_g    = max(10.0, weight_g)
        motor_count = max(1, motor_count)
    except Exception:
        size = 5.0; weight_g = 900; battery = "4S"; battery_mAh = 1500
        prop_size = 5.0; blades = 3; pitch = 4.0; motor_count = 4; style = 'freestyle'

    try:
        cells = int(str(battery).upper().replace('S', ''))
    except Exception:
        cells = 4

    target_twr = {'racing': 2.2, 'freestyle': 2.0}.get(style, 1.6)
    total_thrust_g  = max(1.0, weight_g * target_twr)
    thrust_per_motor = total_thrust_g / max(1, motor_count)

    if prop_size <= 3.5:
        stator = "1104–1407 (micro/whoop)"
        kv_hint = {3:4000,4:3500,5:3000,6:2600,7:2200,8:2000}
    elif prop_size <= 4.5:
        stator = "1407–1806 (light 3–4\")"
        kv_hint = {3:3500,4:3000,5:2600,6:2200,7:2000,8:1800}
    elif prop_size <= 5.5:
        stator = "1806–2207 (5\")"
        kv_hint = {3:3000,4:2500,5:2000,6:1700,7:1500,8:1200}
    elif prop_size <= 7.0:
        stator = "2207–2408 (6\")"
        kv_hint = {3:2600,4:2200,5:1800,6:1500,7:1200,8:1000}
    else:
        stator = "big stator (7–10\")"
        kv_hint = {3:2200,4:1800,5:1500,6:1200,7:1000,8:900}

    available_cells = sorted(kv_hint.keys())
    nearest_cell = min(available_cells, key=lambda c: abs(c - cells))
    base_kv = kv_hint.get(cells, kv_hint[nearest_cell])
    kv_range = f"{int(base_kv * 0.75)}–{int(base_kv * 1.25)} KV"

    style_power = {'freestyle': 550.0, 'racing': 700.0, 'longrange': 300.0}
    p_per_kg    = style_power.get(style, 500.0)
    est_hover_w = p_per_kg * (weight_g / 1000.0)
    pack_v      = cells * 3.7
    est_current = round(est_hover_w / max(0.1, pack_v), 2)
    batt_wh     = (battery_mAh / 1000.0) * pack_v * 0.85
    avg_power   = est_hover_w * 1.1
    est_flight  = int(max(0, round((batt_wh / max(0.1, avg_power)) * 60.0)))

    tips = []
    if thrust_per_motor < 200:
        tips.append("มอเตอร์โหลดต่ำ — อาจโอเวอร์พาวเวอร์สำหรับเฟรมขนาดเล็ก")
    if thrust_per_motor > 600:
        tips.append("มอเตอร์ถูกโหลดสูง — เลือกสเตเตอร์ใหญ่ขึ้นหรือใบพัดขนาดใหญ่ขึ้น")
    if cells >= 7 and base_kv > 1600:
        tips.append("ระวัง KV สูงบนแรงดันสูง (7S+) — อาจทำให้มอเตอร์ร้อน")
    tips.append("เริ่มจากค่าแนะนำแล้วปรับจูนจริงขณะบิน")

    sample_cli = (
        f"# OBIX: motor×prop sample (for {cells}S)\n"
        f"set throttle_limit_percent = {'90' if style=='freestyle' else '80'}\n"
        f"# Recommended stator: {stator}\n"
        f"# KV range: {kv_range}\n"
        "save\n"
    )
    return {
        "twr_display":        f"{round(total_thrust_g/weight_g, 2)} (target {target_twr})",
        "total_thrust_g":     int(total_thrust_g),
        "thrust_per_motor":   int(thrust_per_motor),
        "kv_range":           kv_range,
        "stator":             stator,
        "est_current_a":      est_current,
        "est_flight_time_min":est_flight,
        "tips":               tips,
        "sample_cli":         sample_cli,
    }

# ── PID Symptom Advisor ───────────────────────────────────────────────────
try:
    from analyzer.symptom_advisor import get_all_symptoms, get_advice as _get_symptom_advice
    SYMPTOM_ADVISOR_AVAILABLE = True
except Exception as e:
    SYMPTOM_ADVISOR_AVAILABLE = False
    def get_all_symptoms(): return []
    def _get_symptom_advice(sid): return {"error": "symptom_advisor not available"}
    logging.warning("symptom_advisor import failed: %s", e)

# ── RPM Filter Calculator ────────────────────────────────────────────────
try:
    from analyzer.rpm_filter_calc import calculate_rpm_filter
    RPM_FILTER_AVAILABLE = True
except Exception as e:
    RPM_FILTER_AVAILABLE = False
    def calculate_rpm_filter(kv, battery, prop_size=5.0): return {"error": "rpm_filter_calc not available"}
    logging.warning("rpm_filter_calc import failed: %s", e)

# ── Rates Visualizer ──────────────────────────────────────────────────────
# ── Blackbox CSV Analyzer ─────────────────────────────────────────────────────
try:
    from analyzer.blackbox_analyzer import analyze_blackbox_csv
    BLACKBOX_AVAILABLE = True
except Exception as _bb_err:
    logging.warning("blackbox_analyzer import failed: %s", _bb_err)
    BLACKBOX_AVAILABLE = False
    def analyze_blackbox_csv(csv_text): return {"error": "blackbox_analyzer not available"}

# ── OSD Designer ──────────────────────────────────────────────────────────

def _cleanup_osd_files(max_age_hours: int = 24) -> None:
    """ลบไฟล์ OSD เก่ากว่า max_age_hours ออกจาก static/downloads/osd/
    เรียกก่อน save ทุกครั้งเพื่อป้องกัน disk fill"""
    osd_dir = os.path.join(app.root_path, 'static', 'downloads', 'osd')
    if not os.path.isdir(osd_dir):
        return
    cutoff = time.time() - max_age_hours * 3600
    removed = 0
    for fn in os.listdir(osd_dir):
        fp = os.path.join(osd_dir, fn)
        try:
            if os.path.isfile(fp) and os.path.getmtime(fp) < cutoff:
                os.remove(fp)
                removed += 1
        except Exception:
            logger.debug("suppressed exception", exc_info=True)
    if removed:
        logger.info("OSD cleanup: removed %d old files", removed)

def _timestamped_filename(prefix="obix_osd", ext="txt"):
    # FIX M1: เพิ่ม microseconds เพื่อให้ unique แม้ concurrent request ในวินาทีเดียวกัน
    import uuid as _uuid
    ts = time.strftime('%Y%m%d-%H%M%S')
    uid = _uuid.uuid4().hex[:6]
    return f"{prefix}-{ts}-{uid}.{ext}"

def _generate_osd_text_from_model(model):
    return json.dumps(model, ensure_ascii=False, indent=2)

def _generate_cli_from_model(model):
    lines = ["# OBIXConfig pseudo CLI export"]
    for i, it in enumerate(model.get('items', []), start=1):
        lines.append(f"// {i}. {it.get('type')} '{it.get('label')}' @{it.get('x')},{it.get('y')} size={it.get('size')}")
        lines.append(f"// command: osd_add {it.get('type')} {it.get('x')} {it.get('y')} \"{it.get('label')}\" size={it.get('size')}")
    return "\n".join(lines)

