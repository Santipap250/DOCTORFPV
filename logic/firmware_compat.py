from typing import Optional

TIER_LEGACY = "legacy"
TIER_4_0 = "4.0-4.2"
TIER_4_3 = "4.3+"

TIER_LABELS = {
    TIER_LEGACY: "Betaflight < 4.0",
    TIER_4_0: "Betaflight 4.0.x–4.2.x",
    TIER_4_3: "Betaflight 4.3.0+",
}


def normalize_version(version: Optional[str]) -> Optional[str]:
    if version is None:
        return None
    raw = str(version).strip()
    if not raw or raw.lower() == "auto":
        return None
    low = raw.lower()
    if low.startswith("betaflight"):
        raw = raw[len("betaflight"):].strip(" :-v")
    elif low.startswith("bf"):
        raw = raw[2:].strip(" .:-v")
    parts = raw.split(".")
    if not parts or not parts[0].isdigit():
        return None
    major = int(parts[0])
    if len(parts) == 1:
        return f"{major}.0"
    if not parts[1].isdigit():
        return None
    minor = int(parts[1])
    patch = int(parts[2]) if len(parts) >= 3 and parts[2].isdigit() else None
    return f"{major}.{minor}" + (f".{patch}" if patch is not None else "")


def resolve_tier(version: Optional[str]) -> str:
    v = normalize_version(version)
    if not v:
        return TIER_4_3
    major, minor = (int(x) for x in v.split('.')[:2])
    if major < 4:
        return TIER_LEGACY
    if major == 4 and minor < 3:
        return TIER_4_0
    return TIER_4_3


GYRO_LPF1 = {TIER_LEGACY: "gyro_lowpass_hz", TIER_4_0: "gyro_lowpass_hz", TIER_4_3: "gyro_lpf1_static_hz"}
GYRO_LPF2 = {TIER_LEGACY: "gyro_lowpass2_hz", TIER_4_0: "gyro_lowpass2_hz", TIER_4_3: "gyro_lpf2_static_hz"}
DTERM_LPF1 = {TIER_LEGACY: "dterm_lowpass_hz", TIER_4_0: "dterm_lowpass_hz", TIER_4_3: "dterm_lpf1_static_hz"}
DTERM_LPF2 = {TIER_LEGACY: "dterm_lowpass2_hz", TIER_4_0: "dterm_lowpass2_hz", TIER_4_3: "dterm_lpf2_static_hz"}
# Dynamic Notch is distinct from Dynamic LPF. Do not substitute gyro_lpf1_dyn_* here.
DYN_NOTCH_MIN = {TIER_LEGACY: None, TIER_4_0: "dyn_notch_min_hz", TIER_4_3: "dyn_notch_min_hz"}
DYN_NOTCH_MAX = {TIER_LEGACY: None, TIER_4_0: "dyn_notch_max_hz", TIER_4_3: "dyn_notch_max_hz"}


def param_name(table: dict, tier: str) -> Optional[str]:
    return table.get(tier)


def dyn_notch_range_keyword(value_hz) -> Optional[str]:
    try:
        v = float(value_hz)
    except (TypeError, ValueError):
        return None
    if v <= 400:
        return "LOW"
    if v <= 600:
        return "MEDIUM"
    return "HIGH"


def firmware_note(tier: str, version: Optional[str]) -> str:
    v = normalize_version(version)
    return (f"# Firmware target: Betaflight {v} · {TIER_LABELS[tier]}" if v
            else f"# Firmware target: AUTO/default (not specified) · {TIER_LABELS[tier]}")


def cli_param_names(version: Optional[str]) -> dict:
    tier = resolve_tier(version)
    return {
        "tier": tier,
        "tier_label": TIER_LABELS[tier],
        "firmware_version": normalize_version(version),
        "gyro_lpf1": param_name(GYRO_LPF1, tier),
        "gyro_lpf2": param_name(GYRO_LPF2, tier),
        "dterm_lpf1": param_name(DTERM_LPF1, tier),
        "dterm_lpf2": param_name(DTERM_LPF2, tier),
        "dyn_notch_min": param_name(DYN_NOTCH_MIN, tier),
        "dyn_notch_max": param_name(DYN_NOTCH_MAX, tier),
        "supports_dyn_notch_count": tier == TIER_4_3,
        "legacy_dyn_notch_range": tier == TIER_LEGACY,
    }
