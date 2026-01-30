# Changelog - 2026-01-30

## Summary of Changes

### Python Tooling & Environment
- **Environment Setup**: Configured `pyproject.toml` with an `all` extra for easy installation of all required development and QA tools (`pip install -e .[all]`).
- **Git Ignoring**: Standardized `.gitignore` to exclude `build/`, `.venv`, and `staticfiles` across all subdirectories.

### CI/CD Infrastructure
- **CI Definition**: Added a GitHub Actions workflow (`.github/workflows/ci.yml`) to automate dependency installation and testing on every push.
- **Pytest Configuration**: Configured pytest to use a local `build/` directory for temporary files, ensuring compatibility with restricted CI environments.
- **Render Sync**: Updated `render.yaml` to ensure build and start commands are consistent between local, CI, and production environments.

### Deployment Scripts
- **Compatibility**: Added PowerShell 5.1 compatibility to `deploy_backend.ps1` and `deploy_frontend.ps1` (handling the absence of `$IsWindows` in older PowerShell versions).
- **Bug Fixes**: Resolved an issue in `deploy_backend.ps1` where the `$Args` automatic variable was shadowing the `Invoke-Pip` function parameters.

### Local Development Experience
- **Vite Proxy**: Configured a proxy server in `vite.config.ts` to allow the frontend dev server (`npm run dev`) to seamlessly communicate with the Django backend.
- **Sample Data**: Seeded `data/loads.json` with initial mock loads to provide immediate functionality for testing.
- **Documentation**: Created and organized local testing and development documentation.
