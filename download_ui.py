import urllib.request
import zipfile
import os
import shutil
import sys

log_file = "download_log.txt"


def log(msg):
    with open(log_file, "a") as f:
        f.write(msg + "\n")
    print(msg)


url = (
    "https://github.com/RogueZephyr/Warehouseloadingboardui/archive/refs/heads/main.zip"
)
zip_path = "ui.zip"
extract_path = "ui_extracted"
target_path = "ui"

log(f"Starting download script...")
log(f"URL: {url}")

try:
    log("Downloading...")
    urllib.request.urlretrieve(url, zip_path)
    log("Download complete.")
except Exception as e:
    log(f"Download failed: {e}")
    sys.exit(1)

log("Extracting...")
try:
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_path)
    log("Extraction complete.")
except Exception as e:
    log(f"Extraction failed: {e}")
    sys.exit(1)

# Move the inner folder to target
try:
    inner_folder = os.path.join(extract_path, "Warehouseloadingboardui-main")
    if os.path.exists(target_path):
        log(f"Removing existing {target_path}...")
        shutil.rmtree(target_path)

    log(f"Moving {inner_folder} to {target_path}...")
    shutil.move(inner_folder, target_path)

    # Cleanup
    if os.path.exists(zip_path):
        os.remove(zip_path)
    if os.path.exists(extract_path):
        shutil.rmtree(extract_path)
    log("Done!")
except Exception as e:
    log(f"File operation failed: {e}")
    sys.exit(1)
