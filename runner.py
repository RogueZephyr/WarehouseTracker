import subprocess
import sys
import os


def run_command(command, out_file):
    print(f"Running {command}...")
    with open(out_file, "w") as f:
        try:
            # shell=True to handle string commands easily (e.g. git status)
            result = subprocess.run(command, stdout=f, stderr=f, shell=True, text=True)
            f.write(f"\nReturn Code: {result.returncode}\n")
        except Exception as e:
            f.write(f"\nEXECUTION ERROR: {e}\n")


if __name__ == "__main__":
    run_command("git status", "git_result.txt")
    run_command(
        f"{sys.executable} tests/verification_script.py", "verification_result.txt"
    )
    run_command(f"{sys.executable} test_python.py", "test_python_result.txt")
    print("Done.")
