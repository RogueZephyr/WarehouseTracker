from .models import LoadRecord, LoadFormat, LoadStatus
from .exceptions import InvariantViolationError


def validate_load(load: LoadRecord):
    """
    Enforces all domain invariants on a LoadRecord.
    Raises InvariantViolationError if any rule is broken.
    """
    _validate_quantities(load)
    _validate_completion_rule(load)
    _validate_format_rules(load)


def _validate_quantities(load: LoadRecord):
    if load.expected_qty < 0:
        raise InvariantViolationError("expected_qty must be >= 0")
    if load.loaded_qty < 0:
        raise InvariantViolationError("loaded_qty must be >= 0")
    if load.missing_qty < 0:
        raise InvariantViolationError("missing_qty must be >= 0")

    total_processed = load.loaded_qty + load.missing_qty
    if total_processed > load.expected_qty:
        raise InvariantViolationError(
            f"loaded ({load.loaded_qty}) + missing ({load.missing_qty}) "
            f"exceeds expected ({load.expected_qty})"
        )


def _validate_completion_rule(load: LoadRecord):
    """
    A load may enter complete only if loaded_qty + missing_qty == expected_qty.
    """
    if load.status == LoadStatus.COMPLETE:
        total = load.loaded_qty + load.missing_qty
        if total != load.expected_qty:
            raise InvariantViolationError(
                f"Cannot be COMPLETE if total processed ({total}) "
                f"!= expected_qty ({load.expected_qty})"
            )


def _validate_format_rules(load: LoadRecord):
    """
    Format-specific required fields.
    """
    if load.format == LoadFormat.SMALL:
        if not load.route_code:
            raise InvariantViolationError("Small format requires route_code")

        # Note: route_group_id is not strictly required by the *shape*
        # but required by logic for g23. We enforce strict shape requirements here,
        # logic requirements might be pushed to command handlers or refined here.
        # Spec says: "route_group_id string small + 23-group Supervisor-assigned"
        # Since it's Supervisor-assigned, it might be null initially?
        # Spec says "Required: yes" in table for some, but specific to g23.
        # Let's keep it loose in invariant unless strictly required by all smalls.

    elif load.format == LoadFormat.LARGE:
        if load.pallet_count is None:
            raise InvariantViolationError("Large format requires pallet_count")

        # Spec: verification_status required for large
        if load.verification_status is None:
            # We default it to unverified in factory/command, but record must have it.
            raise InvariantViolationError("Large format requires verification_status")
