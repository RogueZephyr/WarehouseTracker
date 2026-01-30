import requests
import json

BASE_URL = "http://localhost:8000/api"


def test_group_detail(group_id):
    url = f"{BASE_URL}/groups/{group_id}/"
    print(f"Fetching {url}...")
    try:
        res = requests.get(url)
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("Response Data:")
            print(json.dumps(data, indent=2))
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Exception: {e}")


if __name__ == "__main__":
    # From loads.json
    group_id = "33a87748-dfb1-4f07-81ae-552b05133fd6"
    test_group_detail(group_id)
