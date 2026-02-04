from typing import List, Optional
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from src.application.interfaces import Repository
from src.domain.models import (
    LoadFormat,
    LoadGroup,
    LoadRecord,
    LoadStatus,
    VerificationStatus,
)
from src.warehouse_ui.models import (
    Load as LoadModel,
    LoadGroup as LoadGroupModel,
    LoadStatusChoices,
)


class OrmRepository(Repository):
    def __init__(self):
        self._model = LoadModel
        self._group_model = LoadGroupModel

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
        obj.is_na = load.is_na
        obj.is_fnd = load.is_fnd
        if load.shift_id:
            try:
                obj.shift_id = UUID(load.shift_id)
            except ValueError:
                obj.shift_id = load.shift_id
        else:
            obj.shift_id = None
        if load.group_id:
            try:
                obj.group_id = UUID(load.group_id)
            except ValueError:
                obj.group_id = load.group_id
        else:
            obj.group = None
        obj.loaded_qty = load.loaded_qty
        obj.missing_qty = load.missing_qty
        obj.updated_at = timezone.now()
        obj.save()
        self._sync_group_status(load.group_id)

    def delete_load(self, load_id: str) -> bool:
        try:
            load_uuid = UUID(load_id)
            obj = self._model.objects.filter(id=load_uuid).first()
            group_id = str(obj.group_id) if obj and obj.group_id else None
            deleted_count, _ = self._model.objects.filter(id=load_uuid).delete()
            if deleted_count > 0:
                self._sync_group_status(group_id)
            return deleted_count > 0
        except (ValueError, Exception):
            return False

    def list_active_loads_by_group(
        self, format_type: str, route_prefix: str, shift_id: Optional[str] = None
    ) -> List[LoadRecord]:
        qs = self._model.objects.exclude(status=LoadModel.Status.COMPLETE)
        if format_type:
            qs = qs.filter(format=format_type)

        if shift_id is None:
            qs = qs.filter(shift__isnull=True)
        elif shift_id:
            try:
                qs = qs.filter(shift_id=UUID(shift_id))
            except ValueError:
                qs = qs.filter(shift_id=shift_id)

        if route_prefix:
            qs = qs.filter(route_code__startswith=route_prefix)

        return [self._to_record(instance) for instance in qs]

    def list_all(self) -> List[LoadRecord]:
        return [self._to_record(instance) for instance in self._model.objects.all()]

    def get_group(self, group_id: str) -> Optional[LoadGroup]:
        try:
            instance = self._group_model.objects.get(id=UUID(group_id))
        except (self._group_model.DoesNotExist, ValueError):
            return None
        return self._group_to_record(instance)

    def save_group(self, group: LoadGroup) -> None:
        try:
            group_uuid = UUID(group.id)
        except ValueError:
            group_uuid = UUID(str(group.id))

        obj = self._group_model.objects.filter(id=group_uuid).first()
        if not obj:
            obj = self._group_model(id=group_uuid)

        obj.vehicle_id = group.vehicle_id
        obj.max_pallet_count = group.max_pallet_count
        obj.status = (
            group.status.value if hasattr(group.status, "value") else group.status
        )
        if group.shift_id:
            try:
                obj.shift_id = UUID(group.shift_id)
            except ValueError:
                obj.shift_id = group.shift_id
        else:
            obj.shift_id = None
        obj.updated_at = timezone.now()
        obj.save()

        # Sync dataclass timestamps
        group.updated_at = obj.updated_at.isoformat()
        if not group.created_at or getattr(group, "created_at", None) is None:
            group.created_at = obj.created_at.isoformat()

    def list_all_groups(self) -> List[LoadGroup]:
        instances = self._group_model.objects.all()
        return [self._group_to_record(instance) for instance in instances]

    def delete_group(self, group_id: str) -> bool:
        try:
            group_uuid = UUID(group_id)
        except ValueError:
            return False

        with transaction.atomic():
            loads_updated = self._model.objects.filter(group_id=group_uuid).update(
                group=None
            )
            deleted, _ = self._group_model.objects.filter(id=group_uuid).delete()
        return deleted > 0

    def list_loads_by_group(self, group_id: str) -> List[LoadRecord]:
        try:
            group_uuid = UUID(group_id)
        except ValueError:
            return []
        instances = self._model.objects.filter(group_id=group_uuid)
        return [self._to_record(instance) for instance in instances]

    def _sync_group_status(self, group_id: Optional[str]):
        if not group_id:
            return
        try:
            group_uuid = UUID(group_id)
        except ValueError:
            return

        group = self._group_model.objects.filter(id=group_uuid).first()
        if not group:
            return

        loads = list(self._model.objects.filter(group_id=group_uuid))
        if not loads:
            return

        if all(load.status == LoadStatusChoices.COMPLETE for load in loads):
            new_status = LoadStatusChoices.COMPLETE
        elif any(load.status == LoadStatusChoices.IN_PROCESS for load in loads):
            new_status = LoadStatusChoices.IN_PROCESS
        else:
            new_status = LoadStatusChoices.PENDING

        if group.status != new_status:
            group.status = new_status
            group.save(update_fields=["status", "updated_at"])

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
            group_id=str(instance.group_id) if instance.group_id else None,
            shift_id=str(instance.shift_id) if instance.shift_id else None,
            missing_refs=instance.missing_refs or [],
            status=LoadStatus(instance.status),
            loaded_qty=instance.loaded_qty,
            missing_qty=instance.missing_qty,
            is_na=instance.is_na,
            is_fnd=instance.is_fnd,
            id=str(instance.id),
            created_at=instance.created_at.isoformat(),
            updated_at=instance.updated_at.isoformat(),
        )

    def _group_to_record(self, instance: LoadGroupModel) -> LoadGroup:
        return LoadGroup(
            vehicle_id=instance.vehicle_id,
            max_pallet_count=instance.max_pallet_count,
            id=str(instance.id),
            status=LoadStatus(instance.status),
            shift_id=str(instance.shift_id) if instance.shift_id else None,
            created_at=instance.created_at.isoformat(),
            updated_at=instance.updated_at.isoformat(),
        )
