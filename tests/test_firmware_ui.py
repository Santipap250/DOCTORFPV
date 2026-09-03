from analyzer.cli_export import build_cli_diff
from logic.firmware_compat import resolve_tier, TIER_LEGACY, TIER_4_0, TIER_4_3

ANALYSIS={
    "pid":{"roll":{"p":40,"i":45,"d":25},"pitch":{"p":42,"i":47,"d":27},"yaw":{"p":45,"i":45}},
    "filter":{"gyro_lpf2":500,"dterm_lpf1":120,"dyn_notch":500},
    "style":"freestyle",
}

def test_firmware_tiers():
    assert resolve_tier("3.5.7") == TIER_LEGACY
    assert resolve_tier("4.2.11") == TIER_4_0
    assert resolve_tier("4.4.3") == TIER_4_3


def test_legacy_cli_uses_legacy_filter_names():
    cli=build_cli_diff(ANALYSIS,"3.5.7")
    assert "set gyro_lowpass2_hz = 500" in cli
    assert "set dterm_lowpass_hz = 120" in cli
    assert "set dyn_notch_range = MEDIUM" in cli
    assert "gyro_lpf2_static_hz" not in cli


def test_bf42_cli_uses_40_to_42_names():
    cli=build_cli_diff(ANALYSIS,"4.2.11")
    assert "set gyro_lowpass2_hz = 500" in cli
    assert "set dyn_notch_max_hz = 500" in cli
    assert "dyn_notch_range =" not in cli


def test_bf43plus_cli_uses_modern_names():
    cli=build_cli_diff(ANALYSIS,"4.4.3")
    assert "set gyro_lpf2_static_hz = 500" in cli
    assert "set dterm_lpf1_static_hz = 120" in cli
    assert "set dyn_notch_max_hz = 500" in cli
    assert "gyro_lpf1_dyn_max_hz" not in cli
    assert "dyn_notch_range_hz" not in cli


def test_none_optional_filter_values_are_not_emitted_as_zero():
    analysis = {
        "pid": ANALYSIS["pid"],
        "filter": {
            "gyro_lpf1": 200,
            "gyro_lpf2": None,
            "dterm_lpf1": 110,
            "dterm_lpf2": None,
            "dyn_notch_count": 2,
            "dyn_notch_min": 80,
            "dyn_notch_max": 400,
        },
        "style": "freestyle",
    }

    cli_legacy = build_cli_diff(analysis, "3.5.7")
    cli_modern = build_cli_diff(analysis, "4.4.3")

    assert "set gyro_lowpass2_hz = 0" not in cli_legacy
    assert "set gyro_lpf2_static_hz = 0" not in cli_modern
    assert "set dterm_lowpass2_hz = 0" not in cli_legacy
    assert "set dterm_lpf2_static_hz = 0" not in cli_modern


def test_explicit_zero_filter_value_is_preserved():
    analysis = {
        "pid": ANALYSIS["pid"],
        "filter": {
            "gyro_lpf1": 200,
            "gyro_lpf2": 0,
            "dterm_lpf1": 110,
            "dterm_lpf2": 0,
        },
        "style": "freestyle",
    }

    cli = build_cli_diff(analysis, "4.4.3")

    assert "set gyro_lpf2_static_hz = 0" in cli
    assert "set dterm_lpf2_static_hz = 0" in cli
