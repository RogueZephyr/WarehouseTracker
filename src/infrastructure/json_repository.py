import json
import os
from typing import List, Optional, Dict, Any
from dataclasses import asdict
from src.domain.models import LoadRecord, LoadFormat, LoadStatus, VerificationStatus
from src.application.interfaces import Repository


class JsonRepository(Repository):
    def __init__(self, filepath: str):
        self.filepath = filepath
        self._ensure_file()

    def _ensure_file(self):
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)

        if not os.path.exists(self.filepath):
            with open(self.filepath, "w") as f:
                json.dump([], f)

    def _load_all(self) -> List[LoadRecord]:
        try:
            with open(self.filepath, "r") as f:
                data = json.load(f)
                return [self._from_dict(d) for d in data]
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def list_all(self) -> List[LoadRecord]:
        return self._load_all()

    def _save_all(self, loads: List[LoadRecord]):
        data = [self._to_dict(load) for load in loads]
        with open(self.filepath, "w") as f:
            json.dump(data, f, indent=2)

    def get_load(self, load_id: str) -> Optional[LoadRecord]:
        loads = self._load_all()
        for load in loads:
            if load.id == load_id:
                return load
        return None

    def save_load(self, load: LoadRecord) -> None:
        loads = self._load_all()
        existing_idx = next(
            (i for i, existing_load in enumerate(loads) if existing_load.id == load.id),
            -1,
        )

        if existing_idx >= 0:
            loads[existing_idx] = load
        else:
            loads.append(load)

        self._save_all(loads)

    def list_active_loads_by_group(
        self, format_type: str, route_prefix: str
    ) -> List[LoadRecord]:
        loads = self._load_all()
        active_loads = []
        for load in loads:
            if load.status == LoadStatus.COMPLETE:
                continue

            # Filter by format (loose string match or enum)
            if load.format != format_type:
                continue

            # Filter by route prefix (small only check)
            if load.format == LoadFormat.SMALL and load.route_code:
                if load.route_code.startswith(route_prefix):
                    active_loads.append(load)

        return active_loads

    def _to_dict(self, load: LoadRecord) -> Dict[str, Any]:
        d = asdict(load)
        # Convert enums to strings
        d["format"] = load.format.value
        d["status"] = load.status.value
        if load.verification_status:
            d["verification_status"] = load.verification_status.value
        return d

    def _from_dict(self, d: Dict[str, Any]) -> LoadRecord:
        # Convert strings back to enums
        if "format" in d:
            d["format"] = LoadFormat(d["format"])
        if "status" in d:
            d["status"] = LoadStatus(d["status"])
        if "verification_status" in d and d["verification_status"]:
            d["verification_status"] = VerificationStatus(d["verification_status"])

        return LoadRecord(**d)
