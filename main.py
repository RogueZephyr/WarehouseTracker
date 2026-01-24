from dataclasses import dataclass, field, asdict
from typing import Optional, Mapping, Any
from datetime import datetime
import os
import json
try:
    from tabulate import tabulate
except Exception:
    tabulate = None

def readConfig(config_Path):
    if not os.path.exists(config_Path):
        raise FileNotFoundError(f"Could not find {config_Path}")
    try:
        with open(config_Path, "r", encoding="utf-8") as file:
            config = json.load(file)
            print(f"Succesfully read data from '{config_Path}'")
            return config
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from '{config_Path}': {e}")
    except IOError as e:
        print(f"Error reading file '{config_Path}': {e}") 
 
# Load the status configuration once at import time. Use a safe fallback
# so the module can still import if the file is missing or invalid.
CONFIG_PATH = "status_config.json"
try:
    STATUS_CONFIG = readConfig(CONFIG_PATH) or {}
except FileNotFoundError:
    STATUS_CONFIG = {}
except Exception:
    STATUS_CONFIG = {}


class Status(dict):
    """A tiny dict subclass that prints only the current status value.

    Behaves like a dict for storage but `print(status)` or `repr(status)` will
    show only the `current` key.
    """
    def __repr__(self) -> str:
        cur = self.get("current")
        return repr(cur)

    def __str__(self) -> str:
        cur = self.get("current")
        return str(cur)


# Define the loading order from top -> bottom
ORDER_SEQUENCE = [
    "Fondo",
    "Medio Fondo",
    "Medio",
    "Medio Puerto",
    "Puerta",
]

def _now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %I:%M%p")

@dataclass
class load():
    expected_qty: int
    current_qty: int
    pallet_count: int
    client_name: str
    missing_item_num: int
    missing_item_id: str
    status: Status = field(
        default_factory=lambda: Status(
            {
                "current": next(iter(STATUS_CONFIG.get("statuses", {})), None),
                "meta": None,
                "config": STATUS_CONFIG.copy(),
            }
        )
    )
    # order position where the load must be placed when loading (top->bottom)
    order: str = field(default=ORDER_SEQUENCE[0])
    id: Optional[int] = None
    created_at: Optional[str] = field(default_factory=_now_str)
    updated_at: Optional[str] = field(default_factory=_now_str)

    def to_record(self) -> dict:
        """Serialize to a DB-friendly dict (status/order stored as strings)."""
        return {
            "id": self.id,
            "expected_qty": self.expected_qty,
            "current_qty": self.current_qty,
            "pallet_count": self.pallet_count,
            "client_name": self.client_name,
            "missing_item_num": self.missing_item_num,
            "missing_item_id": self.missing_item_id,
            "status": self.status.get("current"),
            "order": self.order,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @staticmethod
    def _get_record_value(record: Mapping[str, Any], key: str, default: Any = None) -> Any:
        if hasattr(record, "get"):
            return record.get(key, default)
        try:
            return record[key]
        except Exception:
            return default

    @classmethod
    def from_record(cls, record: Mapping[str, Any]) -> "load":
        """Create a load from a DB row (rehydrate status/order)."""
        status_key = cls._get_record_value(record, "status")
        statuses = STATUS_CONFIG.get("statuses", {})
        status = Status(
            {
                "current": status_key,
                "meta": statuses.get(status_key),
                "config": STATUS_CONFIG.copy(),
            }
        )
        order_value = cls._get_record_value(record, "order", ORDER_SEQUENCE[0])
        if order_value not in ORDER_SEQUENCE:
            order_value = ORDER_SEQUENCE[0]
        return cls(
            expected_qty=cls._get_record_value(record, "expected_qty", 0),
            current_qty=cls._get_record_value(record, "current_qty", 0),
            pallet_count=cls._get_record_value(record, "pallet_count", 0),
            client_name=cls._get_record_value(record, "client_name", ""),
            missing_item_num=cls._get_record_value(record, "missing_item_num", 0),
            missing_item_id=cls._get_record_value(record, "missing_item_id", ""),
            status=status,
            order=order_value,
            id=cls._get_record_value(record, "id"),
            created_at=cls._get_record_value(record, "created_at"),
            updated_at=cls._get_record_value(record, "updated_at"),
        )

    def printTable(self) -> None:
        data = asdict(self)
        if tabulate:
            print(tabulate([list(data.values())], headers=list(data.keys()), tablefmt="grid"))
        else:
            # fallback simple print when `tabulate` is not installed
            headers = list(data.keys())
            values = list(data.values())
            print(" | ".join(headers))
            print("-" * 40)
            print(" | ".join(map(str, values)))

    def set_status(self, key: str) -> bool:
        """Set the load's status by key (must exist in `status_config.json`).

        Returns True if updated, False if the key is invalid.
        """
        statuses = STATUS_CONFIG.get("statuses", {})
        if key not in statuses:
            print(f"Invalid status: '{key}'. Valid: {list(statuses.keys())}")
            return False
        self.status["current"] = key
        self.status["meta"] = statuses[key]
        self.updated_at = _now_str()
        print(f"Status set to '{key}'")
        return True

    def get_status(self) -> Optional[str]:
        return self.status.get("current")

    def set_order(self, pos: str) -> bool:
        """Set the load's order position. Returns True if valid, False otherwise."""
        if pos not in ORDER_SEQUENCE:
            print(f"Invalid order: '{pos}'. Valid sequence: {ORDER_SEQUENCE}")
            return False
        self.order = pos
        self.updated_at = _now_str()
        print(f"Order set to '{pos}' (index {ORDER_SEQUENCE.index(pos)})")
        return True

    def get_order_index(self) -> int:
        """Return the numeric index (0-based) in the loading sequence."""
        try:
            return ORDER_SEQUENCE.index(self.order)
        except ValueError:
            return -1
        



class route():
    vehicle_id: str
    vehicle_type: str
    load: load

    
def demo():
    inst = load(1, 1, 1, "wmt Bayamon", 2, "2-89")
    inst.set_status("pending")
    inst.printTable()
    inst.set_order("Medio")
    print("Order index:", inst.get_order_index())
    inst.printTable()

def main():
    demo()

if __name__ == "__main__":
    main()
