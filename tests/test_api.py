import httpx
import json

BASE_URL = "http://localhost:8000/api"
TEST_GROUP_ID = "33a87748-dfb1-4f07-81ae-552b05133fd6"


def test_group_detail():
    url = f"{BASE_URL}/groups/{TEST_GROUP_ID}/"
    print(f"Fetching {url}...")
    try:
        res = httpx.get(url, timeout=10.0)
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
    test_group_detail()
