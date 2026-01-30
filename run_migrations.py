import os
import sys
import subprocess


def run_cmd(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)
    return result.returncode


if __name__ == "__main__":
    venv_python = os.path.join(".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = "python"  # fallback

    print(f"Using python: {venv_python}")

    print("\n--- Makemigrations ---")
    run_cmd([venv_python, "manage.py", "makemigrations"])

    print("\n--- Migrate ---")
    run_cmd([venv_python, "manage.py", "migrate"])
