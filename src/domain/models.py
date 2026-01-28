from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime
import uuid


class LoadFormat(str, Enum):
    SMALL = "small"
    LARGE = "large"


class LoadStatus(str, Enum):
    PENDING = "pending"
    IN_PROCESS = "in_process"
    COMPLETE = "complete"
    HOLD = "hold"


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"


@dataclass
class LoadRecord:
    """
    Canonical data model for a Load.
    Serialized directly to JSON or ORM.
    """

    client_name: str
    expected_qty: int
    format: LoadFormat

    # Identity & Meta
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    # State
    status: LoadStatus = LoadStatus.PENDING
    load_order: str = "F"  # F, MF, M, MP, P

    # Counters
    loaded_qty: int = 0
    missing_qty: int = 0
    missing_refs: List[str] = field(default_factory=list)

    # Constraints / Assignments
    vehicle_id: Optional[str] = None

    # Small Format Specific
    route_code: Optional[str] = None
    route_group_id: Optional[str] = None  # For g23/Walgreens or sometimes generic

    # Large Format Specific
    pallet_count: Optional[int] = None
    verification_status: Optional[VerificationStatus] = None

    def touch(self):
        """Update updated_at timestamp."""
        self.updated_at = datetime.now().isoformat()
