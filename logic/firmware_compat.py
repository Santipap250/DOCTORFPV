"""Betaflight firmware-version-aware CLI compatibility layer."""
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
    if version in (None, "", "auto", "AUTO", "Auto"):
        return None
    s = str(version).strip().lower().removeprefix("bf")
    parts = s.split(".")
    if len(parts) == 1 and parts[0].isdigit():
        return f"{parts[0]}.0"
    if not parts or not parts[0].isdigit() or (len(parts) > 1 and not parts[1].isdigit()):
        return None
    return f"{int(parts[0])}.{int(parts[1])}" + (f".{int(parts[2])}" if len(parts)>2 and parts[2].isdigit() else "")

def resolve_tier(version: Optional[str]) -> str:
    v = normalize_version(version)
    if not v:
        return TIER_4_3
    parts=[int(x) for x in v.split(".")[:2]]
    major, minor = parts[0], parts[1]
    if major < 4:
        return TIER_LEGACY
    if major == 4 and minor < 3:
        return TIER_4_0
    return TIER_4_3

GYRO_LPF2 = {TIER_LEGACY:"gyro_lowpass2_hz", TIER_4_0:"gyro_lowpass2_hz", TIER_4_3:"gyro_lpf2_static_hz"}
DTERM_LPF1 = {TIER_LEGACY:"dterm_lowpass_hz", TIER_4_0:"dterm_lowpass_hz", TIER_4_3:"dterm_lpf1_static_hz"}
DYN_NOTCH_MAX = {TIER_LEGACY:None, TIER_4_0:"dyn_notch_max_hz", TIER_4_3:"gyro_lpf1_dyn_max_hz"}

def param_name(table, tier):
    return table.get(tier)

def dyn_notch_range_keyword(value_hz):
    try: v=float(value_hz)
    except (TypeError,ValueError): return None
    if v <= 400: return "LOW"
    if v <= 600: return "MEDIUM"
    return "HIGH"

def firmware_note(tier, version):
    return (f"# Firmware: Betaflight {normalize_version(version)} → {TIER_LABELS[tier]}"
            if version not in (None, "", "auto", "AUTO", "Auto")
            else f"# Firmware: auto/default → {TIER_LABELS[tier]}")
