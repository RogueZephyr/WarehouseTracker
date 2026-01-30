import requests
import json
import time

BASE_URL = "http://localhost:8000/api"


def test_groups():
    print("--- Testing Group Creation ---")
    group_data = {"vehicle_id": "V101", "max_pallet_count": 10}
    res = requests.post(f"{BASE_URL}/groups/", json=group_data)
    if res.status_code != 201:
        print(f"Failed to create group: {res.text}")
        return
    group = res.json()
    group_id = group["id"]
    print(
        f"Created Group {group_id} for Vehicle {group['vehicle_id']} with max pallets {group['max_pallet_count']}"
    )

    print("\n--- Testing Adding Client Load to Group ---")
    load1_data = {
        "client_name": "Client A",
        "expected_qty": 50,
        "format": "large",
        "load_order": "F",
        "pallet_count": 6,
        "group_id": group_id,
    }
    res = requests.post(f"{BASE_URL}/loads/", json=load1_data)
    load1 = res.json()
    print(
        f"Added Client A to Group. Pallets: {load1['pallet_count']}, Status: {load1['status']}"
    )

    print("\n--- Testing Status Sync (Pending -> Complete) ---")
    # Update load to complete
    res = requests.patch(
        f"{BASE_URL}/loads/{load1['id']}/", json={"status": "complete"}
    )
    load1 = res.json()
    print(f"Updated Load 1 Status: {load1['status']}")

    # Check Group Status
    res = requests.get(f"{BASE_URL}/groups/{group_id}/")
    group = res.json()
    print(f"Group Status after Load 1 Complete: {group['status']}")

    if group["status"] == "complete":
        print("SUCCESS: Group status synced to COMPLETE correctly.")
    else:
        print(f"FAILURE: Group status is {group['status']}, expected complete.")

    print("\n--- Testing Group Detail with Loads ---")
    print(f"Group loads count: {len(group['loads'])}")
    for l in group["loads"]:
        print(f"  - {l['client_name']}: {l['status']}")


if __name__ == "__main__":
    test_groups()
