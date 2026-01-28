import sys
import os

# Add root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.infrastructure.json_repository import JsonRepository
from src.application.services import LoadService
from src.application.commands import (
    CreateLoadCommand,
    IncrementLoadedCommand,
    ChangeStatusCommand,
)
from src.domain.models import LoadFormat
from src.domain.exceptions import (
    RouteConflictError,
    InvariantViolationError,
    DomainError,
)


def main():
    repo_path = "data/test_db.json"
    # Clean up previous run
    if os.path.exists(repo_path):
        os.remove(repo_path)

    repo = JsonRepository(repo_path)
    service = LoadService(repo)

    print("--- 1. Testing Happy Path (Small Format) ---")
    cmd1 = CreateLoadCommand(
        client_name="Test Client",
        expected_qty=100,
        format=LoadFormat.SMALL,
        load_order="F",
        route_code="2601",
    )
    load1 = service.create_load(cmd1)
    print(f"Created Load {load1.id} with route {load1.route_code}")

    load1 = service.increment_loaded(IncrementLoadedCommand(load1.id, 10))
    print(f"Incremented loaded: {load1.loaded_qty}, Status: {load1.status}")

    try:
        service.change_status(ChangeStatusCommand(load1.id, "complete"))
    except InvariantViolationError as e:
        print(f"Caught expected complete error: {e}")

    print("\n--- 2. Testing Route Concurrency (g26) ---")
    # load1 is active on 2601.
    try:
        print("Attempting to create load on 2602 (conflict)...")
        service.create_load(
            CreateLoadCommand(
                client_name="Conflict Client",
                expected_qty=50,
                format=LoadFormat.SMALL,
                load_order="F",
                route_code="2602",  # Different route, same prefix 26
            )
        )
        print("ERROR: Should have failed with RouteConflictError")
    except RouteConflictError as e:
        print(f"Success: Caught expected conflict: {e}")

    print("\n--- 3. Testing Same-Route (g26) ---")
    # Should work if route code is same
    load3 = service.create_load(
        CreateLoadCommand(
            client_name="Same Route Client",
            expected_qty=50,
            format=LoadFormat.SMALL,
            load_order="F",
            route_code="2601",  # Same route
        )
    )
    print(f"Created concurrent load on same route: {load3.id}")

    print("\n--- 4. Testing Walgreens (g23) Group Rules ---")
    # Create first g23 load
    g23_load1 = service.create_load(
        CreateLoadCommand(
            client_name="Walgreens 1",
            expected_qty=10,
            format=LoadFormat.SMALL,
            load_order="F",
            route_code="2301",
            route_group_id="GroupA",
        )
    )
    print(f"Created g23 load 1 in GroupA: {g23_load1.id}")

    # Try different group
    try:
        print("Attempting to create g23 load in GroupB (conflict)...")
        service.create_load(
            CreateLoadCommand(
                client_name="Walgreens 2",
                expected_qty=10,
                format=LoadFormat.SMALL,
                load_order="F",
                route_code="2302",  # Route code can differ
                route_group_id="GroupB",  # Group must match
            )
        )
        print("ERROR: Should have failed with RouteConflictError for g23")
    except RouteConflictError as e:
        print(f"Success: Caught expected g23 conflict: {e}")

    print("\n--- 5. Testing Invariants ---")
    try:
        service.increment_loaded(IncrementLoadedCommand(load1.id, 1000))
    except InvariantViolationError as e:
        print(f"Success: Caught quantity overflow: {e}")


if __name__ == "__main__":
    main()
