# Firmware CLI Regression Fix

## Root cause

`get_filter_for_class()` intentionally returns `gyro_lpf2=None` and `dterm_lpf2=None` for the current presets. The CLI exporter previously used `or 0`, which converted `None` into `0` and emitted commands such as:

```text
set gyro_lpf2_static_hz = 0
```

This was an incorrect fallback for a missing recommendation.

## Fix

`analyzer/cli_export.py` now preserves the distinction:

- `None` = no recommendation → do not emit the command.
- explicit numeric `0` = intentional value → preserve and emit it.

The existing firmware parameter mapping is unchanged.

## Regression coverage

`tests/test_firmware_ui.py` now verifies both behaviours:

1. `None` does not become an `lpf2 = 0` command.
2. An explicitly supplied `0` is preserved.

## Verification

Focused non-Flask tests passed in the working environment:

- `test_firmware_compat.py`
- `test_firmware_ui.py`
- `test_registry_integrity.py`

Result: 25 passed before Flask-dependent integration tests were skipped by the environment because Flask is not installed in that runner.

A direct `build_cli_diff()` regression check also confirmed that current freestyle presets no longer emit an LPF2 `= 0` command for firmware 3.5.7, 4.2.11 or 4.4.3.

## Installation

Replace only these repository files:

```text
analyzer/cli_export.py
tests/test_firmware_ui.py
```

Then run the full project test suite in the normal project environment:

```bash
python -m pytest -q
```
