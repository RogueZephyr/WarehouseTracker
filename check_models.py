import os
import django
from django.conf import settings

# Setup django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from src.warehouse_ui.models import Load, LoadGroup, LoadStatusChoices

print("Successfully imported models!")
print(f"LoadGroup table: {LoadGroup._meta.db_table}")
print(f"Load table: {Load._meta.db_table}")

for field in LoadGroup._meta.fields:
    print(f"Group Field: {field.name}")

for field in Load._meta.fields:
    print(f"Load Field: {field.name}")
