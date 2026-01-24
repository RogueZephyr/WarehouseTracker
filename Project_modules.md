
# Project Modules & Development Stack

This document lists the planned programming stack, modules, frameworks, and tools for design and development, with concise reasons for each choice and brief comparisons to common alternatives.

## Core

- **Language & Runtime:** Python 3.11+ — modern typing, performance improvements, and long-term support. Chosen over older 3.x versions for newer stdlib features and typing enhancements.

## Backend

- **Framework:** FastAPI — asynchronous-first, excellent developer DX, automatic OpenAPI docs, and tight integration with Pydantic. Chosen instead of Flask for built-in async and type-driven validation; chosen when an API-first, async service is preferred.
- **Data Validation / Schemas:** Pydantic (v2) — clear, fast data parsing and validation. Preferred over Marshmallow for better type integration and performance.

- **Framework (MVP):** Django — batteries-included web framework optimized for CRUD apps with strong defaults (ORM, migrations, auth, admin, forms). Chosen for fastest MVP delivery with the lowest realistic difficulty while remaining professionally relevant.
- **Rendering (MVP):** Server-rendered HTML using Django Templates — avoids the complexity of a separate frontend app while the product remains MVP-scale.
- **Optional UI enhancement (later):** HTMX — enables partial page updates and inline edits without converting to a full SPA.

## Persistence

- **ORM:** SQLAlchemy Core + ORM — full-featured, widely used, flexible for both high-level ORM and low-level SQL. Chosen when finer control or framework independence is required.
- **Database:** PostgreSQL — robust SQL features, concurrency, reliability, and extension ecosystem. Chosen over SQLite for production readiness; SQLite remains useful for quick local dev/test.
- **Migrations:** Alembic — standard companion to SQLAlchemy for schema migrations. Chosen for compatibility and maturity compared to ad-hoc migration tools.

- **ORM (MVP):** Django ORM — integrated with Django models and validation patterns; reduces configuration and boilerplate for MVP development.
- **Database (MVP):** SQLite — simplest local development option for quick setup and demos.
- **Database (deployment / shared use):** PostgreSQL — robust concurrency and reliability for multi-user usage.
- **Migrations (MVP):** Django migrations — first-class schema migrations integrated with Django models.

## Authentication & Security

- **Auth patterns:** OAuth2 / JWT (as needed) and secure password hashing with `passlib`. Lightweight, standard approaches that integrate easily with FastAPI.

- **Auth (MVP+):** Django built-in authentication (sessions) — simplest path to users and permissions when needed.
- **API auth (only if an API is added later):** Token/JWT patterns as needed; defer until requirements demand it.

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

- **Internal web UI (MVP):** Django Templates (server-rendered) — simple, fast to implement for CRUD workflows.
- **Internal web UI (if SPA is needed later):** React + Vite — fast dev server and modern tooling. Chosen over Create React App for speed.

## Why these choices (summary)

- Prefer modern, well-supported libraries that minimize boilerplate while providing clear upgrade paths.
- Prefer a batteries-included framework for the MVP (Django) to minimize decisions and boilerplate while preserving a professional upgrade path.
- Use tools that speed development while keeping production reliability (Poetry, Docker, GitHub Actions).
- Opt for lightweight, fast developer tools (Ruff, Black, pytest) to reduce friction.
