import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("warehouse_ui", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LoadGroup",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("vehicle_id", models.CharField(max_length=64)),
                ("max_pallet_count", models.PositiveIntegerField()),
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "warehouse_ui_loadgroup",
            },
        ),
        migrations.AddField(
            model_name="load",
            name="group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="loads",
                to="warehouse_ui.loadgroup",
            ),
        ),
        migrations.AlterField(
            model_name="load",
            name="status",
            field=models.CharField(
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
    ]
