import re

from logic.tool_registry import TOOL_REGISTRY


def test_registry_ids_are_unique():
    ids = [tool["id"] for tool in TOOL_REGISTRY]
    assert len(ids) == len(set(ids))


def test_registry_routes_are_unique():
    routes = [tool["route"] for tool in TOOL_REGISTRY]
    assert len(routes) == len(set(routes))


def test_registry_required_fields():
    required = {
        "id", "route", "label", "description", "category", "icon",
        "priority", "changefreq", "status", "input_type", "output_type",
        "firmware_dependency", "keywords",
    }
    for tool in TOOL_REGISTRY:
        assert required <= tool.keys(), tool.get("id")
        assert re.match(r"^/[A-Za-z0-9_./-]*$", tool["route"])
        assert 0.0 <= float(tool["priority"]) <= 1.0
        assert tool["status"] in {"stable", "beta", "experimental"}
        assert isinstance(tool["keywords"], list) and tool["keywords"]


def test_health_and_system_endpoints_are_not_registry_tools():
    routes = {tool["route"] for tool in TOOL_REGISTRY}
    for excluded in ("/healthz", "/robots.txt", "/sitemap.xml"):
        assert excluded not in routes


def test_registry_has_no_military_tool():
    # Military/UAS analysis is not part of the public FPV product surface.
    # Keep any legacy route/page private/unlisted rather than indexing it.
    assert not any(tool["id"] == "military_uas" for tool in TOOL_REGISTRY)
