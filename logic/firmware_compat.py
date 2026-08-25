# logic/firmware_compat.py
"""
Betaflight firmware-version-aware CLI compatibility layer.

Betaflight has renamed several filter-related `set` parameters across major
versions. Pasting the wrong parameter name into the Betaflight CLI produces
an "unknown command" error and the setting is silently skipped — so getting
this right matters. This module is the single source of truth for which CLI
parameter name applies to a given firmware version, so every CLI-generating
code path in the app stays correct as firmware evolves, instead of each tool
hardcoding one (possibly outdated) parameter name independently.

Compat tiers, based on Betaflight's own tuning-notes/release history:
  - "legacy"  : Betaflight < 4.0
                gyro_lowpass_hz / gyro_lowpass2_hz, dterm_lowpass_hz / dterm_lowpass2_hz
                dyn_notch_range = LOW | MEDIUM | HIGH (no explicit Hz value)
  - "4.0-4.2" : Betaflight 4.0.x - 4.2.x
                same gyro/dterm lowpass names as legacy, but the dynamic notch
                range dropdown was replaced with an explicit dyn_notch_max_hz
                (+ dyn_notch_min_hz) — see the 4.2 Tuning Notes
  - "4.3+"    : Betaflight 4.3.0 and newer
                gyro_lpf1_static_hz / gyro_lpf2_static_hz,
                dterm_lpf1_static_hz / dterm_lpf2_static_hz,
                gyro_lpf1_dyn_min_hz / gyro_lpf1_dyn_max_hz

If firmware can't be detected, this defaults to "4.3+" — current-generation
naming, matching what the large majority of flight controllers in the field
run today. This mapping should be re-verified against
https://betaflight.com/docs/wiki whenever a new major Betaflight version
ships; it is not guaranteed to cover every point release's exact behavior.
"""

from typing import Optional

TIER_LEGACY = "legacy"
TIER_4_0 = "4.0-4.2"
TIER_4_3 = "4.3+"

TIER_LABELS = {
    TIER_LEGACY: "Betaflight < 4.0",
    TIER_4_0: "Betaflight 4.0.x-4.2.x",
    TIER_4_3: "Betaflight 4.3.0+",
}


def resolve_tier(version: Optional[str]) -> str:
    """Map a 'major.minor[.patch]' firmware version string to a compat tier.
    Falls back to the current-generation tier if version is missing/unparseable."""
    if not version:
        return TIER_4_3
    try:
        parts = [int(p) for p in str(version).strip().split('.')[:2]]
        major = parts[0]
        minor = parts[1] if len(parts) > 1 else 0
    except (ValueError, IndexError):
        return TIER_4_3
    if major < 4:
        return TIER_LEGACY
    if major == 4 and minor < 3:
        return TIER_4_0
    return TIER_4_3


# Parameter-name tables, keyed by compat tier. `None` means "no direct
# equivalent for this tier" — callers should skip emitting that `set` line
# rather than guess.
GYRO_LPF1 = {TIER_LEGACY: "gyro_lowpass_hz", TIER_4_0: "gyro_lowpass_hz", TIER_4_3: "gyro_lpf1_static_hz"}
GYRO_LPF2 = {TIER_LEGACY: "gyro_lowpass2_hz", TIER_4_0: "gyro_lowpass2_hz", TIER_4_3: "gyro_lpf2_static_hz"}
DTERM_LPF1 = {TIER_LEGACY: "dterm_lowpass_hz", TIER_4_0: "dterm_lowpass_hz", TIER_4_3: "dterm_lpf1_static_hz"}
DTERM_LPF2 = {TIER_LEGACY: "dterm_lowpass2_hz", TIER_4_0: "dterm_lowpass2_hz", TIER_4_3: "dterm_lpf2_static_hz"}
DYN_NOTCH_MAX = {TIER_LEGACY: None, TIER_4_0: "dyn_notch_max_hz", TIER_4_3: "gyro_lpf1_dyn_max_hz"}
DYN_NOTCH_MIN = {TIER_LEGACY: None, TIER_4_0: "dyn_notch_min_hz", TIER_4_3: "gyro_lpf1_dyn_min_hz"}
# NOTE: dyn_notch_count has no confirmed equivalent prior to 4.3 (a real
# firmware CLI dump from 4.2.4 does not include it) — callers should not
# emit a dyn_notch_count line for TIER_LEGACY or TIER_4_0.


def param_name(table: dict, tier: str) -> Optional[str]:
    """Look up a CLI parameter name for a given tier from one of the tables above."""
    return table.get(tier)


def dyn_notch_range_keyword(value_hz) -> Optional[str]:
    """Legacy (<4.0) firmware doesn't take an explicit dyn_notch Hz value — it
    takes a LOW/MEDIUM/HIGH keyword. Bucket a numeric Hz figure into the
    closest keyword using the boundaries Betaflight's own 4.2 tuning notes
    give as the LOW/HIGH equivalents (~350Hz / ~700Hz, default 500Hz)."""
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
    """A one-line CLI comment documenting which firmware tier this diff targets."""
    label = TIER_LABELS[tier]
    if version:
        return f"# Firmware: Betaflight {version} (detected) -> compat tier: {label}"
    return f"# Firmware: not specified -> assuming {label} (current-generation default)"


def cli_param_names(version: Optional[str]) -> dict:
    """Resolve the full set of tier-correct CLI parameter names for a given
    firmware version string, for callers (templates, other analyzers) that
    need more than one parameter name at once. `supports_dyn_notch_count`
    is False for tiers where dyn_notch_count has no confirmed equivalent
    (see the NOTE above DYN_NOTCH_MIN) — callers should skip that `set`
    line entirely rather than guess, not substitute a different name."""
    tier = resolve_tier(version)
    return {
        "tier": tier,
        "tier_label": TIER_LABELS[tier],
        "is_legacy_range_keyword": tier == TIER_LEGACY,
        "gyro_lpf1": param_name(GYRO_LPF1, tier),
        "gyro_lpf2": param_name(GYRO_LPF2, tier),
        "dterm_lpf1": param_name(DTERM_LPF1, tier),
        "dterm_lpf2": param_name(DTERM_LPF2, tier),
        "dyn_notch_min": param_name(DYN_NOTCH_MIN, tier),
        "dyn_notch_max": param_name(DYN_NOTCH_MAX, tier),
        "supports_dyn_notch_count": tier == TIER_4_3,
    }
