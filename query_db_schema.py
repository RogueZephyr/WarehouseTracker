import sqlite3
import os

db_path = "db.sqlite3"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("--- Tables ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(table[0])

    print("\n--- Columns in warehouse_ui_load ---")
    cursor.execute("PRAGMA table_info(warehouse_ui_load);")
    columns = cursor.fetchall()
    for col in columns:
        print(f"{col[1]} ({col[2]})")

    conn.close()
else:
    print("Database not found!")
