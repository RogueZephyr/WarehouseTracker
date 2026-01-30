# Testing WarehouseTracker

This document describes the local test workflow and infrastructure for the WarehouseTracker project.

## Local Test Workflow

### 1. Prerequisites
- Python 3.11+
- Virtual environment (recommended)

### 2. Setup
Create and activate a virtual environment, then install dependencies:
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

pip install -e .[all]
pip install -r requirements-dev.txt
```

### 3. Environment Variables
Before running tests, especially the Render smoke tests, set the following environment variables:

| Variable | Description |
| --- | --- |
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL connection string |
| `RENDER_API_KEY` | API key for Render smoke tests |
| `RUN_RENDER_COMMANDS` | Set to `1` to enable Render deployment tests |

You can also use a `.env` file (ensure it matches `.gitignore`).

### 4. Running Tests
Pytest is configured to use a local build directory for temporary files to avoid permission issues in CI environments.

```bash
# Set base temp for fixtures
$env:PYTEST_ADDOPTS="--basetemp=./build/pytest-tmp"
# Run all tests
pytest
```

### 5. Skipping Render Smoke Tests
If you don't have the necessary secrets or want to skip deployment-related tests:
- Ensure `RUN_RENDER_COMMANDS` is NOT set or set to `0`.
- The tests are designed to skip gracefully if environment variables are missing.

## CI/CD
The project uses GitHub Actions (`.github/workflows/ci.yml`) to run tests on every push. The CI environment uses the same `PYTEST_ADDOPTS` and dependency installation as the local workflow.

## Running the Application Locally

Since you've already run the deployment scripts, the frontend is built and Django is prepared to serve it.

### 1. Run Backend (and built Frontend)
This is the most "production-like" way to run the app. Django will serve both the API and the React frontend.
```bash
# From the project root with .venv active
python manage.py runserver
```
Visit **http://localhost:8000** in your browser.

### 2. Run Frontend for Development
If you want to edit the frontend code with Hot Module Replacement (HMR):
```bash
cd Warehouseloadingboardui-main
npm run dev
```
Visit **http://localhost:5173**. It will communicate with the Django API at `:8000` (CORS is already configured).
