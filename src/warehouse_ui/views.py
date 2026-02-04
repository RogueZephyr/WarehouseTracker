import json
import os
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

from django.conf import settings
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from dataclasses import asdict

from src.application.commands import CreateLoadCommand, AssignVehicleCommand
from src.application.services import LoadService
from src.domain.exceptions import DomainError
from src.domain.models import (
    LoadRecord,
    LoadGroup,
    LoadFormat,
    LoadStatus,
    VerificationStatus,
)
from src.domain.rules import validate_load
from src.infrastructure.json_repository import JsonRepository
from src.infrastructure.orm_repository import OrmRepository
from src.warehouse_ui.models import Shift, ShiftStatusChoices

# Initialize Repository
REPO_PATH = os.path.join("data", "loads.json")
USE_JSON_REPO = settings.REPOSITORY_BACKEND == "json" or (
    settings.REPOSITORY_BACKEND == "auto" and settings.DEBUG
)
repo = JsonRepository(REPO_PATH) if USE_JSON_REPO else OrmRepository()
service = LoadService(repo)


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
    if load.shift_id:
        d["shift_id"] = load.shift_id
    return d


def serialize_group(group: LoadGroup):
    d = asdict(group)
    d["status"] = group.status.value if hasattr(group.status, "value") else group.status
    if group.shift_id:
        d["shift_id"] = group.shift_id
    return d


def _ensure_completion_total(load: LoadRecord):
    if load.status == LoadStatus.COMPLETE:
        total = load.loaded_qty + load.missing_qty
        if total < load.expected_qty:
            load.missing_qty += load.expected_qty - total


def _normalize_format_value(value):
    if not isinstance(value, str):
        return value
    trimmed = value.strip()
    lowered = trimmed.lower()
    if lowered in (LoadFormat.SMALL.value, LoadFormat.LARGE.value):
        return lowered
    if "small" in lowered:
        return LoadFormat.SMALL.value
    if "large" in lowered:
        return LoadFormat.LARGE.value
    return trimmed


def _get_warehouse_tz():
    tz_name = getattr(settings, "WAREHOUSE_TIME_ZONE", settings.TIME_ZONE)
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return timezone.get_default_timezone()


def _parse_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        dt = parse_datetime(value)
        if dt is None:
            raise ValueError(f"Invalid datetime: {value}")
    else:
        raise ValueError("Invalid datetime value")

    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone=_get_warehouse_tz())
    return dt


def _shift_workday(shift: Shift):
    tz = _get_warehouse_tz()
    local_start = timezone.localtime(shift.start_at, tz)
    return local_start.date().isoformat()


def _shift_duration_hours(shift: Shift):
    tz = _get_warehouse_tz()
    end_at = shift.end_at or timezone.now()
    start_local = timezone.localtime(shift.start_at, tz)
    end_local = timezone.localtime(end_at, tz)
    duration = end_local - start_local
    return max(duration.total_seconds() / 3600, 0)


def _serialize_shift(shift: Shift):
    shift_id = str(shift.id)
    load_records = [l for l in repo.list_all() if l.shift_id == shift_id]

    if load_records:
        expected_small = sum(
            l.expected_qty for l in load_records if l.format == LoadFormat.SMALL
        )
        loaded_small = sum(
            l.loaded_qty for l in load_records if l.format == LoadFormat.SMALL
        )
        expected_large = sum(
            l.expected_qty for l in load_records if l.format == LoadFormat.LARGE
        )
        loaded_large = sum(
            l.loaded_qty for l in load_records if l.format == LoadFormat.LARGE
        )
    else:
        expected_small = shift.expected_small
        loaded_small = shift.loaded_small
        expected_large = shift.expected_large
        loaded_large = shift.loaded_large

    expected_total = expected_small + expected_large
    loaded_total = loaded_small + loaded_large
    fill_rate = 0
    if expected_total > 0:
        fill_rate = round((loaded_total / expected_total) * 100, 2)
    duration_hours = _shift_duration_hours(shift)

    return {
        "id": str(shift.id),
        "start_at": shift.start_at.isoformat(),
        "end_at": shift.end_at.isoformat() if shift.end_at else None,
        "status": shift.status,
        "expected_small": expected_small,
        "loaded_small": loaded_small,
        "expected_large": expected_large,
        "loaded_large": loaded_large,
        "expected_total": expected_total,
        "loaded_total": loaded_total,
        "fill_rate": fill_rate,
        "workday": _shift_workday(shift),
        "duration_hours": round(duration_hours, 2),
        "is_overdue": shift.status == ShiftStatusChoices.OPEN and duration_hours >= 12,
    }


class IndexView(TemplateView):
    template_name = "index.html"


@method_decorator(csrf_exempt, name="dispatch")
class LoadListCreateView(View):
    def get(self, request):
        loads = repo.list_all()
        shift_id = request.GET.get("shift_id")
        if shift_id:
            loads = [l for l in loads if l.shift_id == shift_id]
        data = [serialize_load(l) for l in loads]
        return JsonResponse(data, safe=False)

    def post(self, request):
        try:
            data = json.loads(request.body)
            shift_id = data.get("shift_id")
            if not shift_id:
                active_shift = (
                    Shift.objects.filter(status=ShiftStatusChoices.OPEN)
                    .order_by("-start_at")
                    .first()
                )
                shift_id = str(active_shift.id) if active_shift else None
            format_value = _normalize_format_value(data.get("format"))
            try:
                load_format = LoadFormat(format_value)
            except ValueError:
                return JsonResponse(
                    {"error": f"Invalid format: {format_value}"},
                    status=400,
                )

            route_code = data.get("route_code")
            if isinstance(route_code, str):
                route_code = route_code.strip() or None
            route_group_id = data.get("route_group_id")
            if isinstance(route_group_id, str):
                route_group_id = route_group_id.strip() or None

            command = CreateLoadCommand(
                client_name=data.get("client_name"),
                expected_qty=int(data.get("expected_qty")),
                format=load_format,
                load_order=data.get("load_order", "F"),
                shift_id=shift_id,
                route_code=route_code,
                route_group_id=route_group_id,
                pallet_count=int(data.get("pallet_count"))
                if data.get("pallet_count")
                else None,
            )

            load = service.create_load(command)

            if data.get("vehicle_id"):
                load = service.assign_vehicle(
                    AssignVehicleCommand(load.id, data.get("vehicle_id"))
                )

            if data.get("group_id"):
                load.group_id = data.get("group_id")

            if data.get("missing_refs") is not None:
                load.missing_refs = data.get("missing_refs") or []

            load.is_na = bool(data.get("is_na", load.is_na))
            load.is_fnd = bool(data.get("is_fnd", load.is_fnd))

            validate_load(load)
            repo.save_load(load)
            return JsonResponse(serialize_load(load), status=201)
        except DomainError as exc:
            return JsonResponse({"error": exc.message, "code": exc.code}, status=400)
        except Exception as exc:
            return JsonResponse({"error": str(exc)}, status=400)


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
                ("group_id", str),
                ("missing_refs", list),
                ("route_group_id", str),
                ("route_code", str),
                ("pallet_count", int),
                ("client_name", str),
                ("expected_qty", int),
                ("load_order", str),
                ("format", lambda v: LoadFormat(_normalize_format_value(v))),
                ("is_na", bool),
                ("is_fnd", bool),
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

            if load.format == LoadFormat.LARGE and load.verification_status is None:
                load.verification_status = VerificationStatus.UNVERIFIED

            load.touch()
            _ensure_completion_total(load)
            validate_load(load)
            repo.save_load(load)
            return JsonResponse(serialize_load(load))
        except DomainError as exc:
            return JsonResponse({"error": exc.message, "code": exc.code}, status=400)
        except Exception as exc:
            return JsonResponse({"error": str(exc)}, status=400)

    def delete(self, request, load_id):
        success = repo.delete_load(load_id)
        if not success:
            return JsonResponse({"error": "Not found or could not delete"}, status=404)
        return JsonResponse({"status": "deleted"}, status=200)


@method_decorator(csrf_exempt, name="dispatch")
class GroupListCreateView(View):
    def get(self, request):
        groups = repo.list_all_groups()
        shift_id = request.GET.get("shift_id")
        if shift_id:
            groups = [g for g in groups if g.shift_id == shift_id]
        data = [serialize_group(g) for g in groups]
        return JsonResponse(data, safe=False)

    def post(self, request):
        try:
            data = json.loads(request.body)
            shift_id = data.get("shift_id")
            if not shift_id:
                active_shift = (
                    Shift.objects.filter(status=ShiftStatusChoices.OPEN)
                    .order_by("-start_at")
                    .first()
                )
                shift_id = str(active_shift.id) if active_shift else None
            group = LoadGroup(
                vehicle_id=data.get("vehicle_id"),
                max_pallet_count=int(data.get("max_pallet_count")),
                shift_id=shift_id,
            )
            repo.save_group(group)
            return JsonResponse(serialize_group(group), status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class GroupDetailView(View):
    def get(self, request, group_id):
        group = repo.get_group(group_id)
        if not group:
            return JsonResponse({"error": "Not found"}, status=404)

        loads = repo.list_loads_by_group(group_id)
        data = serialize_group(group)
        data["loads"] = [serialize_load(l) for l in loads]
        return JsonResponse(data)

    def patch(self, request, group_id):
        group = repo.get_group(group_id)
        if not group:
            return JsonResponse({"error": "Not found"}, status=404)

        try:
            data = json.loads(request.body)
            if "vehicle_id" in data:
                group.vehicle_id = data["vehicle_id"]
            if "max_pallet_count" in data:
                group.max_pallet_count = int(data["max_pallet_count"])
            if "status" in data:
                group.status = LoadStatus(data["status"])

            group.touch()
            repo.save_group(group)
            return JsonResponse(serialize_group(group))
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    def delete(self, request, group_id):
        success = repo.delete_group(group_id)
        if not success:
            return JsonResponse({"error": "Not found or could not delete"}, status=404)
        return JsonResponse({"status": "deleted"}, status=200)


class ConfigView(View):
    def get(self, request):
        active_shift = (
            Shift.objects.filter(status=ShiftStatusChoices.OPEN)
            .order_by("-start_at")
            .first()
        )
        return JsonResponse(
            {
                "warehouse_time_zone": getattr(settings, "WAREHOUSE_TIME_ZONE", "UTC"),
                "active_shift_id": str(active_shift.id) if active_shift else None,
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class ShiftListCreateView(View):
    def get(self, request):
        status_param = request.GET.get("status")
        include_open = request.GET.get("include_open", "false").lower() == "true"

        shifts = Shift.objects.all()
        if status_param:
            status_param = status_param.strip().lower()
            shifts = shifts.filter(status=status_param)
        elif not include_open:
            shifts = shifts.filter(status=ShiftStatusChoices.CLOSED)

        start_param = request.GET.get("start")
        end_param = request.GET.get("end")
        if start_param and end_param:
            try:
                start_date = datetime.strptime(start_param, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_param, "%Y-%m-%d").date()
                tz = _get_warehouse_tz()
                start_dt = timezone.make_aware(
                    datetime.combine(start_date, time.min), timezone=tz
                )
                end_dt = timezone.make_aware(
                    datetime.combine(end_date, time.max), timezone=tz
                )
                shifts = shifts.filter(start_at__gte=start_dt, start_at__lte=end_dt)
            except ValueError:
                return JsonResponse({"error": "Invalid date range"}, status=400)

        data = [_serialize_shift(s) for s in shifts.order_by("start_at")]
        return JsonResponse(data, safe=False)

    def post(self, request):
        try:
            data = json.loads(request.body)
            start_at = _parse_datetime(data.get("start_at"))
            if not start_at:
                return JsonResponse({"error": "start_at is required"}, status=400)

            end_at = _parse_datetime(data.get("end_at")) if data.get("end_at") else None
            status = data.get("status") or (
                ShiftStatusChoices.CLOSED if end_at else ShiftStatusChoices.OPEN
            )
            if isinstance(status, str):
                status = status.strip().lower()
            if status not in [ShiftStatusChoices.OPEN, ShiftStatusChoices.CLOSED]:
                return JsonResponse({"error": "Invalid status"}, status=400)

            if end_at and status == ShiftStatusChoices.OPEN:
                status = ShiftStatusChoices.CLOSED

            if status == ShiftStatusChoices.CLOSED and end_at is None:
                end_at = timezone.now()

            shift = Shift.objects.create(
                start_at=start_at,
                end_at=end_at,
                status=status,
                expected_small=int(data.get("expected_small") or 0),
                loaded_small=int(data.get("loaded_small") or 0),
                expected_large=int(data.get("expected_large") or 0),
                loaded_large=int(data.get("loaded_large") or 0),
            )
            return JsonResponse(_serialize_shift(shift), status=201)
        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)
        except Exception as exc:
            return JsonResponse({"error": str(exc)}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class ShiftDetailView(View):
    def get(self, request, shift_id):
        shift = Shift.objects.filter(id=shift_id).first()
        if not shift:
            return JsonResponse({"error": "Not found"}, status=404)
        return JsonResponse(_serialize_shift(shift))

    def patch(self, request, shift_id):
        shift = Shift.objects.filter(id=shift_id).first()
        if not shift:
            return JsonResponse({"error": "Not found"}, status=404)

        try:
            data = json.loads(request.body)

            if "start_at" in data:
                shift.start_at = _parse_datetime(data.get("start_at"))
            if "end_at" in data:
                shift.end_at = (
                    _parse_datetime(data.get("end_at")) if data.get("end_at") else None
                )

            if "status" in data:
                status_value = data.get("status")
                if isinstance(status_value, str):
                    status_value = status_value.strip().lower()
                if status_value not in [
                    ShiftStatusChoices.OPEN,
                    ShiftStatusChoices.CLOSED,
                ]:
                    return JsonResponse({"error": "Invalid status"}, status=400)
                shift.status = status_value

            if "expected_small" in data:
                shift.expected_small = int(data.get("expected_small") or 0)
            if "loaded_small" in data:
                shift.loaded_small = int(data.get("loaded_small") or 0)
            if "expected_large" in data:
                shift.expected_large = int(data.get("expected_large") or 0)
            if "loaded_large" in data:
                shift.loaded_large = int(data.get("loaded_large") or 0)

            if shift.status == ShiftStatusChoices.OPEN:
                shift.end_at = None
            if shift.status == ShiftStatusChoices.CLOSED and shift.end_at is None:
                shift.end_at = timezone.now()
            if shift.end_at and shift.status == ShiftStatusChoices.OPEN:
                shift.status = ShiftStatusChoices.CLOSED

            shift.save()
            return JsonResponse(_serialize_shift(shift))
        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)
        except Exception as exc:
            return JsonResponse({"error": str(exc)}, status=400)

    def delete(self, request, shift_id):
        deleted, _ = Shift.objects.filter(id=shift_id).delete()
        if deleted == 0:
            return JsonResponse({"error": "Not found"}, status=404)
        return JsonResponse({"status": "deleted"}, status=200)
