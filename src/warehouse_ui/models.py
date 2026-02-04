import uuid

from django.db import models


class LoadStatusChoices(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROCESS = "in_process", "In Process"
    COMPLETE = "complete", "Complete"
    HOLD = "hold", "Hold"


class LoadGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle_id = models.CharField(max_length=64)
    max_pallet_count = models.PositiveIntegerField()
    shift = models.ForeignKey(
        "Shift",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="groups",
    )
    status = models.CharField(
        max_length=16,
        choices=LoadStatusChoices.choices,
        default=LoadStatusChoices.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouse_ui_loadgroup"

    def __str__(self):
        return f"Group {self.vehicle_id} ({self.status})"

    def touch(self):
        self.save()  # auto_now=True handles updated_at


class Load(models.Model):
    class Format(models.TextChoices):
        SMALL = "small", "Small"
        LARGE = "large", "Large"

    class Verification(models.TextChoices):
        UNVERIFIED = "unverified", "Unverified"
        VERIFIED = "verified", "Verified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_name = models.CharField(max_length=255)
    expected_qty = models.PositiveIntegerField()
    format = models.CharField(
        max_length=10, choices=Format.choices, default=Format.SMALL
    )
    load_order = models.CharField(max_length=4, default="F")

    route_code = models.CharField(max_length=32, null=True, blank=True)
    route_group_id = models.CharField(max_length=32, null=True, blank=True)
    pallet_count = models.PositiveIntegerField(null=True, blank=True)

    verification_status = models.CharField(
        max_length=16,
        choices=Verification.choices,
        null=True,
        blank=True,
    )

    vehicle_id = models.CharField(max_length=64, null=True, blank=True)
    group = models.ForeignKey(
        LoadGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loads",
    )
    shift = models.ForeignKey(
        "Shift",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loads",
    )

    missing_refs = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=16,
        choices=LoadStatusChoices.choices,
        default=LoadStatusChoices.PENDING,
    )
    loaded_qty = models.PositiveIntegerField(default=0)
    missing_qty = models.PositiveIntegerField(default=0)
    is_na = models.BooleanField(default=False)
    is_fnd = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouse_ui_load"

    def __str__(self):
        return f"{self.client_name} ({self.route_code or 'unspecified'})"


class ShiftStatusChoices(models.TextChoices):
    OPEN = "open", "Open"
    CLOSED = "closed", "Closed"


class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=16,
        choices=ShiftStatusChoices.choices,
        default=ShiftStatusChoices.OPEN,
    )

    expected_small = models.PositiveIntegerField(default=0)
    loaded_small = models.PositiveIntegerField(default=0)
    expected_large = models.PositiveIntegerField(default=0)
    loaded_large = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouse_ui_shift"

    def __str__(self):
        return f"Shift {self.start_at.isoformat()} ({self.status})"
