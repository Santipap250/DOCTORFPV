# tests/test_community_storage.py
import importlib

import pytest

pytest.importorskip("flask")


def _reload_core(monkeypatch, community_db=None, legacy_db=None):
    import core

    monkeypatch.delenv("COMMUNITY_DB_PATH", raising=False)
    monkeypatch.delenv("DATABASE_PATH", raising=False)

    if community_db is not None:
        monkeypatch.setenv("COMMUNITY_DB_PATH", str(community_db))
    if legacy_db is not None:
        monkeypatch.setenv("DATABASE_PATH", str(legacy_db))

    return importlib.reload(core)


def test_community_db_path_priority(monkeypatch, tmp_path):
    community_db = tmp_path / "community-priority.db"
    legacy_db = tmp_path / "legacy.db"

    core = _reload_core(monkeypatch, community_db=community_db, legacy_db=legacy_db)

    assert core._resolve_community_db_path() == community_db


def test_legacy_database_path_fallback(monkeypatch, tmp_path):
    legacy_db = tmp_path / "legacy-fallback.db"

    core = _reload_core(monkeypatch, community_db=None, legacy_db=legacy_db)

    assert core._resolve_community_db_path() == legacy_db


def test_default_community_db_location(monkeypatch):
    core = _reload_core(monkeypatch, community_db=None, legacy_db=None)

    default_path = core._resolve_community_db_path()
    assert default_path.name == "community.db"
    assert default_path.parent.name == "data"


def test_get_db_creates_file_and_sets_pragmas(monkeypatch, tmp_path):
    community_db = tmp_path / "nested" / "community.db"
    core = _reload_core(monkeypatch, community_db=community_db, legacy_db=None)

    conn = core._get_db()
    try:
        assert community_db.exists()

        journal_mode = conn.execute("PRAGMA journal_mode").fetchone()[0]
        busy_timeout = conn.execute("PRAGMA busy_timeout").fetchone()[0]
        synchronous = conn.execute("PRAGMA synchronous").fetchone()[0]

        assert str(journal_mode).lower() == "wal"
        assert int(busy_timeout) == 30000
        assert int(synchronous) == 1  # NORMAL
    finally:
        conn.close()
