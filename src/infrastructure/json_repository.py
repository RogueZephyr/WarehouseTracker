import json
import os
from typing import List, Optional, Dict, Any
from dataclasses import asdict
from src.domain.models import (
    LoadRecord,
    LoadGroup,
    LoadFormat,
    LoadStatus,
    VerificationStatus,
)
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
                json.dump({"loads": [], "groups": []}, f)
        else:
            # Migration check: if file is just a list, convert to dict
            try:
                with open(self.filepath, "r") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    with open(self.filepath, "w") as f:
                        json.dump({"loads": data, "groups": []}, f, indent=2)
            except (json.JSONDecodeError, FileNotFoundError):
                pass

    def _load_data(self) -> Dict[str, List[Dict[str, Any]]]:
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {"loads": [], "groups": []}

    def _save_data(self, data: Dict[str, List[Dict[str, Any]]]):
        with open(self.filepath, "w") as f:
            json.dump(data, f, indent=2)

    def _load_all_records(self) -> List[LoadRecord]:
        data = self._load_data()
        return [self._from_dict(d) for d in data.get("loads", [])]

    def list_all(self) -> List[LoadRecord]:
        return self._load_all_records()

    def _save_all_records(self, loads: List[LoadRecord]):
        data = self._load_data()
        data["loads"] = [self._to_dict(load) for load in loads]
        self._save_data(data)

    def get_load(self, load_id: str) -> Optional[LoadRecord]:
        loads = self._load_all_records()
        for load in loads:
            if load.id == load_id:
                return load
        return None

    def save_load(self, load: LoadRecord) -> None:
        loads = self._load_all_records()
        existing_idx = next(
            (i for i, existing_load in enumerate(loads) if existing_load.id == load.id),
            -1,
        )

        if existing_idx >= 0:
            loads[existing_idx] = load
        else:
            loads.append(load)

        self._save_all_records(loads)
        # If this load belongs to a group, update group status
        if load.group_id:
            self._sync_group_status(load.group_id)

    def delete_load(self, load_id: str) -> bool:
        loads = self._load_all_records()
        initial_len = len(loads)
        load_to_delete = next((l for l in loads if l.id == load_id), None)
        loads = [load for load in loads if load.id != load_id]
        if len(loads) < initial_len:
            self._save_all_records(loads)
            if load_to_delete and load_to_delete.group_id:
                self._sync_group_status(load_to_delete.group_id)
            return True
        return False

    def list_active_loads_by_group(
        self, format_type: str, route_prefix: str, shift_id: Optional[str] = None
    ) -> List[LoadRecord]:
        loads = self._load_all_records()
        active_loads = []
        for load in loads:
            if load.status == LoadStatus.COMPLETE:
                continue

            if shift_id is None:
                if load.shift_id is not None:
                    continue
            elif load.shift_id != shift_id:
                continue

            # Filter by format (loose string match or enum)
            if load.format != format_type:
                continue

            # Filter by route prefix (small only check)
            if load.format == LoadFormat.SMALL and load.route_code:
                if load.route_code.startswith(route_prefix):
                    active_loads.append(load)

        return active_loads

    def get_group(self, group_id: str) -> Optional[LoadGroup]:
        groups = self.list_all_groups()
        for g in groups:
            if g.id == group_id:
                return g
        return None

    def save_group(self, group: LoadGroup) -> None:
        groups = self.list_all_groups()
        existing_idx = next(
            (
                i
                for i, existing_group in enumerate(groups)
                if existing_group.id == group.id
            ),
            -1,
        )

        if existing_idx >= 0:
            groups[existing_idx] = group
        else:
            groups.append(group)

        data = self._load_data()
        data["groups"] = [self._group_to_dict(g) for g in groups]
        self._save_data(data)

    def list_all_groups(self) -> List[LoadGroup]:
        data = self._load_data()
        return [self._group_from_dict(d) for d in data.get("groups", [])]

    def delete_group(self, group_id: str) -> bool:
        data = self._load_data()
        initial_len = len(data.get("groups", []))
        data["groups"] = [g for g in data.get("groups", []) if g["id"] != group_id]

        # Also clean up loads that belonged to this group
        loads = self._load_all_records()
        for load in loads:
            if load.group_id == group_id:
                load.group_id = None
        data["loads"] = [self._to_dict(l) for l in loads]

        if len(data["groups"]) < initial_len:
            self._save_data(data)
            return True
        return False

    def list_loads_by_group(self, group_id: str) -> List[LoadRecord]:
        loads = self._load_all_records()
        return [l for l in loads if l.group_id == group_id]

    def _sync_group_status(self, group_id: str):
        group = self.get_group(group_id)
        if not group:
            return

        child_loads = self.list_loads_by_group(group_id)
        if not child_loads:
            return

        all_complete = all(l.status == LoadStatus.COMPLETE for l in child_loads)
        any_in_process = any(l.status == LoadStatus.IN_PROCESS for l in child_loads)

        new_status = LoadStatus.PENDING
        if all_complete:
            new_status = LoadStatus.COMPLETE
        elif any_in_process:
            new_status = LoadStatus.IN_PROCESS

        if group.status != new_status:
            group.status = new_status
            group.touch()
            self.save_group(group)

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

    def _group_to_dict(self, group: LoadGroup) -> Dict[str, Any]:
        d = asdict(group)
        d["status"] = group.status.value
        return d

    def _group_from_dict(self, d: Dict[str, Any]) -> LoadGroup:
        if "status" in d:
            d["status"] = LoadStatus(d["status"])
        return LoadGroup(**d)
