from typing import List, Optional
from uuid import UUID

from django.utils import timezone

from src.application.interfaces import Repository
from src.domain.models import (
    LoadFormat,
    LoadRecord,
    LoadStatus,
    VerificationStatus,
)
from src.warehouse_ui.models import Load as LoadModel


class OrmRepository(Repository):
    def __init__(self):
        self._model = LoadModel

    def get_load(self, load_id: str) -> Optional[LoadRecord]:
        try:
            instance = self._model.objects.get(id=UUID(load_id))
        except (self._model.DoesNotExist, ValueError):
            return None
        return self._to_record(instance)

    def save_load(self, load: LoadRecord) -> None:
        """Persist the dataclass into the Django ORM."""
        try:
            load_uuid = UUID(load.id)
        except ValueError:
            load_uuid = UUID(str(load.id))

        obj = self._model.objects.filter(id=load_uuid).first()
        if not obj:
            obj = self._model(id=load_uuid)

        obj.client_name = load.client_name
        obj.expected_qty = load.expected_qty
        obj.format = load.format.value if hasattr(load.format, "value") else load.format
        obj.load_order = load.load_order
        obj.route_code = load.route_code
        obj.route_group_id = load.route_group_id
        obj.pallet_count = load.pallet_count
        obj.verification_status = (
            load.verification_status.value
            if hasattr(load.verification_status, "value")
            else load.verification_status
        )
        obj.vehicle_id = load.vehicle_id
        obj.missing_refs = load.missing_refs or []
        obj.status = load.status.value if hasattr(load.status, "value") else load.status
        obj.loaded_qty = load.loaded_qty
        obj.missing_qty = load.missing_qty
        obj.updated_at = timezone.now()
        obj.save()

    def delete_load(self, load_id: str) -> bool:
        try:
            load_uuid = UUID(load_id)
            deleted_count, _ = self._model.objects.filter(id=load_uuid).delete()
            return deleted_count > 0
        except (ValueError, Exception):
            return False

    def list_active_loads_by_group(
        self, format_type: str, route_prefix: str
    ) -> List[LoadRecord]:
        qs = self._model.objects.exclude(status=LoadModel.Status.COMPLETE)
        if format_type:
            qs = qs.filter(format=format_type)

        if route_prefix:
            qs = qs.filter(route_code__startswith=route_prefix)

        return [self._to_record(instance) for instance in qs]

    def list_all(self) -> List[LoadRecord]:
        return [self._to_record(instance) for instance in self._model.objects.all()]

    def _to_record(self, instance: LoadModel) -> LoadRecord:
        verification_value = (
            instance.verification_status if instance.verification_status else None
        )

        return LoadRecord(
            client_name=instance.client_name,
            expected_qty=instance.expected_qty,
            format=LoadFormat(instance.format),
            load_order=instance.load_order,
            route_code=instance.route_code,
            route_group_id=instance.route_group_id,
            pallet_count=instance.pallet_count,
            verification_status=VerificationStatus(verification_value)
            if verification_value
            else None,
            vehicle_id=instance.vehicle_id,
            missing_refs=instance.missing_refs or [],
            status=LoadStatus(instance.status),
            loaded_qty=instance.loaded_qty,
            missing_qty=instance.missing_qty,
            id=str(instance.id),
            created_at=instance.created_at.isoformat(),
            updated_at=instance.updated_at.isoformat(),
        )
