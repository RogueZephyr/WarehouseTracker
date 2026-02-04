from src.domain.models import LoadRecord, LoadStatus, LoadFormat, VerificationStatus
from src.domain.rules import validate_load
from src.domain.exceptions import DomainError, RouteConflictError
from .interfaces import Repository
from .commands import (
    CreateLoadCommand,
    AssignVehicleCommand,
    IncrementLoadedCommand,
    SetMissingCommand,
    ChangeStatusCommand,
    SetVerificationStatusCommand,
)


class LoadService:
    def __init__(self, repository: Repository):
        self.repo = repository

    def create_load(self, cmd: CreateLoadCommand) -> LoadRecord:
        # Pre-validation (concurrency rules)
        if cmd.format == LoadFormat.SMALL:
            self._validate_small_format_concurrency(cmd)

        # Construct
        load = LoadRecord(
            client_name=cmd.client_name,
            expected_qty=cmd.expected_qty,
            format=cmd.format,
            load_order=cmd.load_order,
            route_code=cmd.route_code,
            route_group_id=cmd.route_group_id,
            pallet_count=cmd.pallet_count,
            shift_id=cmd.shift_id,
            verification_status=VerificationStatus.UNVERIFIED
            if cmd.format == LoadFormat.LARGE
            else None,
        )

        # Domain validation
        validate_load(load)

        # Persist
        self.repo.save_load(load)
        return load

    def assign_vehicle(self, cmd: AssignVehicleCommand) -> LoadRecord:
        load = self._get_load_or_raise(cmd.load_id)
        if load.status == LoadStatus.COMPLETE:
            raise DomainError("Cannot assign vehicle to completed load")

        load.vehicle_id = cmd.vehicle_id
        load.touch()
        self.repo.save_load(load)
        return load

    def increment_loaded(self, cmd: IncrementLoadedCommand) -> LoadRecord:
        load = self._get_load_or_raise(cmd.load_id)

        if cmd.delta <= 0:
            raise DomainError("Delta must be positive")

        load.loaded_qty += cmd.delta

        # Auto-transition: pending -> in_process
        if load.status == LoadStatus.PENDING and load.loaded_qty > 0:
            load.status = LoadStatus.IN_PROCESS

        load.touch()
        validate_load(load)  # Check invariants
        self.repo.save_load(load)
        return load

    def set_missing(self, cmd: SetMissingCommand) -> LoadRecord:
        load = self._get_load_or_raise(cmd.load_id)

        load.missing_qty = cmd.missing_qty
        load.missing_refs = cmd.missing_refs  # Naive replacement as per MVP

        load.touch()
        validate_load(load)
        self.repo.save_load(load)
        return load

    def change_status(self, cmd: ChangeStatusCommand) -> LoadRecord:
        load = self._get_load_or_raise(cmd.load_id)

        # Validate status enum
        try:
            new_status = LoadStatus(cmd.new_status)
        except ValueError:
            raise DomainError(f"Invalid status: {cmd.new_status}")

        load.status = new_status
        load.touch()
        validate_load(load)  # will check compilation rule
        self.repo.save_load(load)
        return load

    def set_verification(self, cmd: SetVerificationStatusCommand) -> LoadRecord:
        load = self._get_load_or_raise(cmd.load_id)
        if load.format != LoadFormat.LARGE:
            raise DomainError("Verification only applies to LARGE format")

        load.verification_status = (
            VerificationStatus.VERIFIED
            if cmd.verified
            else VerificationStatus.UNVERIFIED
        )
        load.touch()
        validate_load(load)
        self.repo.save_load(load)
        return load

    def _get_load_or_raise(self, load_id: str) -> LoadRecord:
        load = self.repo.get_load(load_id)
        if not load:
            raise DomainError(f"Load {load_id} not found", code="NOT_FOUND")
        return load

    def _validate_small_format_concurrency(self, cmd: CreateLoadCommand):
        # Implementation of g26/g28/g23 rules
        if not cmd.route_code:
            return  # Let domain validation catch this missing field

        group_prefix = cmd.route_code[:2]  # "26", "23", etc.

        # Get active loads for this group
        # Note: We query by prefix.
        active_loads = self.repo.list_active_loads_by_group(
            "small", group_prefix, shift_id=cmd.shift_id
        )

        if group_prefix in ["26", "28"]:
            # Rule: Only one active route_code at a time per group.
            for active in active_loads:
                if active.route_code != cmd.route_code:
                    raise RouteConflictError(
                        f"Group g{group_prefix} is already running route {active.route_code}. "
                        f"Cannot start {cmd.route_code}."
                    )

        elif group_prefix == "23":
            # Rule: Multiple route_codes allowed, but MUST share strictly one route_group_id.

            # Find the active group ID if any
            current_group_id = None
            for active in active_loads:
                if active.route_group_id:
                    current_group_id = active.route_group_id
                    break

            # If there is an active group, new load must match it
            if current_group_id:
                if cmd.route_group_id != current_group_id:
                    raise RouteConflictError(
                        f"Walgreens (g23) is currently assigned to group {current_group_id}. "
                        f"Cannot start load with group {cmd.route_group_id}."
                    )
            else:
                # No active group? Then this new load starts a new group context
                # (or is just one loose load if checking logic permits).
                pass
