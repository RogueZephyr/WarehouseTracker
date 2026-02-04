from typing import Protocol, List, Optional
from src.domain.models import LoadRecord


class Repository(Protocol):
    def get_load(self, load_id: str) -> Optional[LoadRecord]: ...

    def save_load(self, load: LoadRecord) -> None: ...

    def list_active_loads_by_group(
        self, format_type: str, route_prefix: str, shift_id: Optional[str] = None
    ) -> List[LoadRecord]:
        """
        Returns all active loads (not COMPLETE) that match the criteria.
        Used for concurrency checks (e.g. g26, g23).
        """
        ...

    def list_all(self) -> List[LoadRecord]: ...
    def delete_load(self, load_id: str) -> bool: ...
