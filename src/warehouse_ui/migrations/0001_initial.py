import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Load",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("client_name", models.CharField(max_length=255)),
                ("expected_qty", models.PositiveIntegerField()),
                (
                    "format",
                    models.CharField(
                        choices=[("small", "Small"), ("large", "Large")],
                        default="small",
                        max_length=10,
                    ),
                ),
                ("load_order", models.CharField(default="F", max_length=4)),
                ("route_code", models.CharField(blank=True, max_length=32, null=True)),
                ("route_group_id", models.CharField(blank=True, max_length=32, null=True)),
                ("pallet_count", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "verification_status",
                    models.CharField(
                        blank=True,
                        choices=[("unverified", "Unverified"), ("verified", "Verified")],
                        max_length=16,
                        null=True,
                    ),
                ),
                ("vehicle_id", models.CharField(blank=True, max_length=64, null=True)),
                ("missing_refs", models.JSONField(default=list)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("in_process", "In Process"),
                            ("complete", "Complete"),
                            ("hold", "Hold"),
                        ],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("loaded_qty", models.PositiveIntegerField(default=0)),
                ("missing_qty", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "warehouse_ui_load"},
        ),
    ]
