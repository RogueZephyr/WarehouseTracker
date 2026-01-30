import json
import os

from django.conf import settings
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from dataclasses import asdict

from src.domain.models import LoadRecord, LoadFormat, LoadStatus, VerificationStatus
from src.infrastructure.json_repository import JsonRepository
from src.infrastructure.orm_repository import OrmRepository

# Initialize Repository
REPO_PATH = os.path.join("data", "loads.json")
USE_JSON_REPO = settings.REPOSITORY_BACKEND == "json" or (
    settings.REPOSITORY_BACKEND == "auto" and settings.DEBUG
)
repo = JsonRepository(REPO_PATH) if USE_JSON_REPO else OrmRepository()


def serialize_load(load: LoadRecord):
    """Convert domain model to dictionary safe for JSON."""
    d = asdict(load)
    # Convert enums
    d["format"] = load.format.value if hasattr(load.format, "value") else load.format
    d["status"] = load.status.value if hasattr(load.status, "value") else load.status
    if load.verification_status:
        d["verification_status"] = (
            load.verification_status.value
            if hasattr(load.verification_status, "value")
            else load.verification_status
        )
    return d


class IndexView(TemplateView):
    template_name = "index.html"


@method_decorator(csrf_exempt, name="dispatch")
class LoadListCreateView(View):
    def get(self, request):
        loads = repo.list_all()
        data = [serialize_load(l) for l in loads]
        return JsonResponse(data, safe=False)

    def post(self, request):
        try:
            data = json.loads(request.body)

            load = LoadRecord(
                client_name=data.get("client_name"),
                expected_qty=int(data.get("expected_qty")),
                format=LoadFormat(data.get("format")),
                load_order=data.get("load_order", "F"),
                route_code=data.get("route_code"),
                route_group_id=data.get("route_group_id"),
                pallet_count=int(data.get("pallet_count"))
                if data.get("pallet_count")
                else None,
                vehicle_id=data.get("vehicle_id"),
                missing_refs=data.get("missing_refs") or [],
            )
            repo.save_load(load)
            return JsonResponse(serialize_load(load), status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class LoadDetailView(View):
    def get(self, request, load_id):
        load = repo.get_load(load_id)
        if not load:
            return JsonResponse({"error": "Not found"}, status=404)
        return JsonResponse(serialize_load(load))

    def patch(self, request, load_id):
        load = repo.get_load(load_id)
        if not load:
            return JsonResponse({"error": "Not found"}, status=404)

        try:
            data = json.loads(request.body)

            # Map of fields to update
            updatable_fields = [
                ("status", lambda v: LoadStatus(v)),
                ("loaded_qty", int),
                ("vehicle_id", str),
                ("missing_refs", list),
                ("route_group_id", str),
                ("route_code", str),
                ("pallet_count", int),
                ("client_name", str),
                ("expected_qty", int),
                ("load_order", str),
                ("format", lambda v: LoadFormat(v)),
            ]

            for key, caster in updatable_fields:
                if key in data:
                    try:
                        value = data[key]
                        # Handle Enum conversion if caster is a lambda/func
                        if value is not None:
                            setattr(load, key, caster(value))
                        else:
                            setattr(load, key, None)
                    except ValueError:
                        pass  # Ignore invalid enum values or casts

            load.touch()
            repo.save_load(load)
            return JsonResponse(serialize_load(load))
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    def delete(self, request, load_id):
        success = repo.delete_load(load_id)
        if not success:
            return JsonResponse({"error": "Not found or could not delete"}, status=404)
        return JsonResponse({"status": "deleted"}, status=200)
