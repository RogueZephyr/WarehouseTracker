import logging
import os
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Literal
import datetime
import json
import argparse




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


@dataclass
class Load:
    shipment_id: str                                # Client Name
    vehicle_id: Optional[str] = None                # Vehicle num
    date: datetime.date = datetime.date.today()     # Date of departure
    expected_qty: int = 0
    loaded_qty: int = 0
    missing_qty: int = 0
    # store the status config (presentation + transitions). Use default_factory
    # to avoid the dataclasses "mutable default" error. We copy the loaded
    # configuration to avoid accidental mutation of the shared global.
    status: Dict = field(default_factory=lambda: STATUS_CONFIG.copy())

    def validate(self):
        if self.expected_qty < 0:
            raise ValueError("Expected quantity must be greater or equal to 0!")
        if not (0 <= self.loaded_qty <= self.expected_qty):
            raise ValueError("Loaded quantity must be between 0 and expected quantity")
        if self.missing_qty < 0 or self.loaded_qty + self.missing_qty > self.expected_qty:
            raise ValueError("Invalid missing quantity")
    

def main():
    pass


if __name__ == "__main__":
    pass
