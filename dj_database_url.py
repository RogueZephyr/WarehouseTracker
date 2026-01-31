from __future__ import annotations

from urllib.parse import urlparse, unquote


_SCHEME_TO_ENGINE = {
    "postgres": "django.db.backends.postgresql",
    "postgresql": "django.db.backends.postgresql",
    "postgresql_psycopg2": "django.db.backends.postgresql_psycopg2",
    "mysql": "django.db.backends.mysql",
    "redis": "django_redis.cache.RedisCache",
    "sqlite": "django.db.backends.sqlite3",
    "sqlite3": "django.db.backends.sqlite3",
}


def parse(uri: str, conn_max_age=0) -> dict:
    parsed = urlparse(uri)
    scheme = parsed.scheme
    engine = _SCHEME_TO_ENGINE.get(scheme)
    if not engine:
        raise ValueError(f"Unsupported database scheme: {scheme}")

    if scheme in ("sqlite", "sqlite3"):
        path = parsed.path or parsed.netloc
        if path.startswith("/"):
            path = path[1:]
        return {
            "ENGINE": engine,
            "NAME": unquote(path),
        }

    return {
        "ENGINE": engine,
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username or "",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or ""),
        "OPTIONS": {},
        "CONN_MAX_AGE": conn_max_age or 0,
    }
