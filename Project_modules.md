
# Project Modules & Development Stack

This document lists the planned programming stack, modules, frameworks, and tools for design and development, with concise reasons for each choice and brief comparisons to common alternatives.

## Core

- **Language & Runtime:** Python 3.11+ — modern typing, performance improvements, and long-term support. Chosen over older 3.x versions for newer stdlib features and typing enhancements.

## Backend

- **Framework:** FastAPI — asynchronous-first, excellent developer DX, automatic OpenAPI docs, and tight integration with `pydantic`. Chosen instead of Flask for built-in async and type-driven validation; chosen over Django when a lightweight, API-first service is preferred.
- **Data Validation / Schemas:** Pydantic (v2) — clear, fast data parsing and validation. Preferred over Marshmallow for better type integration and performance.

## Persistence

- **ORM:** SQLAlchemy Core + ORM — full-featured, widely used, flexible for both high-level ORM and low-level SQL. Chosen over Django ORM for finer control and framework independence.
- **Database:** PostgreSQL — robust SQL features, concurrency, reliability, and extension ecosystem. Chosen over SQLite for production readiness; SQLite remains useful for quick local dev/test.
- **Migrations:** Alembic — standard companion to SQLAlchemy for schema migrations. Chosen for compatibility and maturity compared to ad-hoc migration tools.

## Authentication & Security

- **Auth patterns:** OAuth2 / JWT (as needed) and secure password hashing with `passlib`. Lightweight, standard approaches that integrate easily with FastAPI.

## Dev Tooling & Dependency Management

- **Dependency manager:** Poetry — reproducible dependency resolution, virtualenv management, and packaging. Chosen over pipenv for reliability and better dependency resolution; pip-tools is an alternative for minimalism.
- **Containerization:** Docker + Docker Compose — consistent local/dev and CI environments, easy DB and service orchestration. Chosen over raw host installs for reproducibility.
- **Linting / Formatting:** Ruff (fast linter), Black (formatter), isort — enforce code quality and consistent style. Chosen for speed (Ruff) and ecosystem support.
- **Pre-commit:** `pre-commit` hooks to run linters/formatters and basic checks before commits.

## Testing & Quality

- **Testing:** pytest + pytest-cov — flexible, rich ecosystem, fixtures, and good plugin support. Chosen over unittest for conciseness and ecosystem.
- **Factories / Fixtures:** factory_boy or pytest fixtures for test data creation.

## CI / CD

- **CI Provider:** GitHub Actions — integrates with GitHub, free tiers for OSS/private usage, easy workflow-as-code. Alternatives: GitLab CI, CircleCI.
- **Container registry / deployments:** Docker Hub, GitHub Packages, or a cloud provider registry depending on infra needs.

## Observability & Ops (optional)

- **Error tracking:** Sentry — quick setup, good Python support.
- **Metrics & dashboards:** Prometheus + Grafana for metrics collection and visualization if service-level monitoring is required.

## Frontend / UI (optional)

- **Internal web UI:** React + Vite (if a full SPA is needed) — fast dev server and modern tooling. Chosen over Create React App for speed. For very small internal dashboards consider Streamlit or plain server-rendered Jinja templates.

## Why these choices (summary)

- Prefer modern, well-supported libraries that minimize boilerplate (FastAPI + Pydantic) and give clear upgrade paths (SQLAlchemy + Alembic, PostgreSQL).
- Use tools that speed development while keeping production reliability (Poetry, Docker, GitHub Actions).
- Opt for lightweight, fast developer tools (Ruff, Black, pytest) to reduce friction.
