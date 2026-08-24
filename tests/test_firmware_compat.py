# tests/test_firmware_compat.py
"""Tests for logic/firmware_compat.py and its use in analyzer/cli_export.py."""

from logic.firmware_compat import (
    resolve_tier, param_name, dyn_notch_range_keyword, firmware_note,
    GYRO_LPF1, GYRO_LPF2, DTERM_LPF1, DTERM_LPF2, DYN_NOTCH_MAX,
    TIER_LEGACY, TIER_4_0, TIER_4_3,
)
from analyzer.cli_export import build_cli_diff


def test_resolve_tier_legacy():
    assert resolve_tier("3.5.7") == TIER_LEGACY


def test_resolve_tier_4_0_to_4_2():
    assert resolve_tier("4.0.1") == TIER_4_0
    assert resolve_tier("4.2.11") == TIER_4_0


def test_resolve_tier_4_3_plus():
    assert resolve_tier("4.3.0") == TIER_4_3
    assert resolve_tier("4.4.3") == TIER_4_3
    assert resolve_tier("4.5.1") == TIER_4_3
    assert resolve_tier("5.0.0") == TIER_4_3


def test_resolve_tier_missing_or_bad_defaults_to_current():
    assert resolve_tier(None) == TIER_4_3
    assert resolve_tier("") == TIER_4_3
    assert resolve_tier("not-a-version") == TIER_4_3


def test_param_name_gyro_lpf2_differs_by_tier():
    assert param_name(GYRO_LPF2, TIER_LEGACY) == "gyro_lowpass2_hz"
    assert param_name(GYRO_LPF2, TIER_4_0) == "gyro_lowpass2_hz"
    assert param_name(GYRO_LPF2, TIER_4_3) == "gyro_lpf2_static_hz"


def test_param_name_dterm_lpf1_differs_by_tier():
    assert param_name(DTERM_LPF1, TIER_LEGACY) == "dterm_lowpass_hz"
    assert param_name(DTERM_LPF1, TIER_4_3) == "dterm_lpf1_static_hz"


def test_dyn_notch_max_has_no_legacy_equivalent():
    assert param_name(DYN_NOTCH_MAX, TIER_LEGACY) is None
    assert param_name(DYN_NOTCH_MAX, TIER_4_0) == "dyn_notch_max_hz"
    assert param_name(DYN_NOTCH_MAX, TIER_4_3) == "gyro_lpf1_dyn_max_hz"


def test_dyn_notch_range_keyword_buckets():
    assert dyn_notch_range_keyword(300) == "LOW"
    assert dyn_notch_range_keyword(500) == "MEDIUM"
    assert dyn_notch_range_keyword(800) == "HIGH"
    assert dyn_notch_range_keyword("not-a-number") is None


def test_firmware_note_mentions_detected_version():
    note = firmware_note(TIER_4_3, "4.4.3")
    assert "4.4.3" in note
    note_unknown = firmware_note(TIER_4_3, None)
    assert "not specified" in note_unknown


_ANALYSIS = {
    "pid": {"roll": {"p": 40, "i": 45, "d": 25}, "pitch": {"p": 42, "i": 47, "d": 27}, "yaw": {"p": 45, "i": 45}},
    "filter": {"gyro_lpf2": 500, "dterm_lpf1": 120, "dyn_notch": 500},
    "style": "freestyle",
    "weight_class": "5in",
}


def test_build_cli_diff_uses_legacy_param_names_for_old_firmware():
    cli = build_cli_diff(_ANALYSIS, firmware_version="3.5.7")
    assert "set gyro_lowpass2_hz = 500" in cli
    assert "set dterm_lowpass_hz = 120" in cli
    assert "set dyn_notch_range = MEDIUM" in cli
    # Modern-only params should not appear for legacy firmware
    assert "gyro_lpf2_static_hz" not in cli
    assert "gyro_lpf1_dyn_max_hz" not in cli


def test_build_cli_diff_uses_explicit_hz_for_4_0_to_4_2():
    cli = build_cli_diff(_ANALYSIS, firmware_version="4.1.0")
    assert "set gyro_lowpass2_hz = 500" in cli
    assert "set dyn_notch_max_hz = 500" in cli
    assert "dyn_notch_range =" not in cli


def test_build_cli_diff_uses_modern_param_names_for_4_3_plus():
    cli = build_cli_diff(_ANALYSIS, firmware_version="4.4.3")
    assert "set gyro_lpf2_static_hz = 500" in cli
    assert "set dterm_lpf1_static_hz = 120" in cli
    assert "set gyro_lpf1_dyn_max_hz = 500" in cli
    # Old/incorrect param names must never appear
    assert "gyro_lpf2_hz =" not in cli
    assert "dyn_notch_range_hz" not in cli


def test_build_cli_diff_defaults_to_modern_when_firmware_unspecified():
    cli = build_cli_diff(_ANALYSIS)
    assert "set gyro_lpf2_static_hz = 500" in cli
    assert "not specified" in cli
