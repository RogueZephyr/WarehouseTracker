from dataclasses import dataclass
from typing import Optional, List
from src.domain.models import LoadFormat


@dataclass
class CreateLoadCommand:
    client_name: str
    expected_qty: int
    format: LoadFormat
    load_order: str
    # Small specific
    route_code: Optional[str] = None
    route_group_id: Optional[str] = None
    # Large specific
    pallet_count: Optional[int] = None


@dataclass
class AssignVehicleCommand:
    load_id: str
    vehicle_id: str


@dataclass
class IncrementLoadedCommand:
    load_id: str
    delta: int


@dataclass
class SetMissingCommand:
    load_id: str
    missing_qty: int
    missing_refs: List[str]


@dataclass
class ChangeStatusCommand:
    load_id: str
    new_status: str


@dataclass
class SetVerificationStatusCommand:
    load_id: str
    verified: bool
