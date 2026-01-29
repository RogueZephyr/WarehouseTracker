import os
import subprocess
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"

REQUIRED_ENV_VARS = [
    "SECRET_KEY",
    "DATABASE_URL",
    "ALLOWED_HOSTS",
    "CSRF_TRUSTED_ORIGINS",
    "CORS_ALLOWED_ORIGINS",
    "REPOSITORY_BACKEND",
    "DEBUG",
]

RENDER_COMMANDS = [
    ["python", "-m", "pip", "install", ".", "--no-deps", "--ignore-installed"],
    [
        "python",
        "-m",
        "pip",
        "install",
        "gunicorn",
        "django-cors-headers",
        "--no-deps",
        "--ignore-installed",
    ],
    ["python", "manage.py", "migrate", "--noinput"],
    ["gunicorn", "config.wsgi:application", "--check-config"],
]


def _load_env():
    if not ENV_PATH.exists():
        return

    for raw_line in ENV_PATH.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key not in os.environ:
            os.environ[key] = value


_load_env()


def _assert_env_vars_set():
    missing = [name for name in REQUIRED_ENV_VARS if not os.environ.get(name)]
    if missing:
        pytest.fail(
            "Render emulation requires these env vars: "
            f"{', '.join(missing)}"
        )


def test_render_env_vars_present():
    """Fail fast if required Render variables are missing."""
    _assert_env_vars_set()


@pytest.mark.skipif(
    os.environ.get("RUN_RENDER_COMMANDS") != "1",
    reason="Set RUN_RENDER_COMMANDS=1 to execute Render build/migrate/gunicorn commands.",
)
def test_render_pipeline_commands():
    """Run the same commands Render executes, using the provided env vars."""
    _assert_env_vars_set()
    for command in RENDER_COMMANDS:
        subprocess.run(
            command,
            cwd=PROJECT_ROOT,
            check=True,
            env=os.environ,
        )
