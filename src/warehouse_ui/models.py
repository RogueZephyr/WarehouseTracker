import uuid

from django.db import models


class Load(models.Model):
    class Format(models.TextChoices):
        SMALL = "small", "Small"
        LARGE = "large", "Large"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROCESS = "in_process", "In Process"
        COMPLETE = "complete", "Complete"
        HOLD = "hold", "Hold"

    class Verification(models.TextChoices):
        UNVERIFIED = "unverified", "Unverified"
        VERIFIED = "verified", "Verified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_name = models.CharField(max_length=255)
    expected_qty = models.PositiveIntegerField()
    format = models.CharField(max_length=10, choices=Format.choices, default=Format.SMALL)
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

    missing_refs = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    loaded_qty = models.PositiveIntegerField(default=0)
    missing_qty = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouse_ui_load"

    def __str__(self):
        return f"{self.client_name} ({self.route_code or 'unspecified'})"
