import json

from django.test import RequestFactory

from src.application.services import LoadService
from src.domain.models import LoadFormat
from src.infrastructure.json_repository import JsonRepository
from src.warehouse_ui import views


def _post_load(factory, payload):
    request = factory.post(
        "/api/loads/",
        json.dumps(payload),
        content_type="application/json",
    )
    return views.LoadListCreateView.as_view()(request)


def test_route_conflict_reports_domain_error(tmp_path):
    repo_path = tmp_path / "loads.json"
    repo = JsonRepository(str(repo_path))
    views.repo = repo
    views.service = LoadService(repo)
    factory = RequestFactory()

    base_payload = {
        "client_name": "First",
        "expected_qty": 20,
        "format": "small",
        "load_order": "F",
        "route_code": "2601",
    }
    first_resp = _post_load(factory, base_payload)
    assert first_resp.status_code == 201

    conflict_payload = {
        "client_name": "Conflict",
        "expected_qty": 15,
        "format": "small",
        "load_order": "F",
        "route_code": "2602",
    }
    second_resp = _post_load(factory, conflict_payload)
    assert second_resp.status_code == 400
    data = json.loads(second_resp.content)
    assert data.get("code") == "ROUTE_CONFLICT"
    assert "already running route" in data.get("error", "").lower()
