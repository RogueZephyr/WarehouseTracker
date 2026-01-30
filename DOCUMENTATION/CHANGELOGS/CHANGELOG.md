# Changelog

## [Unreleased] - 2026-01-28

### Added
- **Django Integration**:
  - Initialized Django project structure (`manage.py`, `config/`).
  - Created `src/warehouse_ui` app to serve the frontend and provide API endpoints.
  - configured `settings.py` to serve Vite static assets from `Warehouseloadingboardui-main/dist`.
- **API**:
  - Implemented `LoadListCreateView` and `LoadDetailView` in `src/warehouse_ui/views.py`.
  - API endpoints `/api/loads/` connected to `JsonRepository`.
- **Frontend Integration**:
  - Refactored `Warehouseloadingboardui-main/src/app/App.tsx` to fetch data from the Django API.
  - Added data mappers to translate between backend snake_case and frontend camelCase.
- **Documentation**:
  - Added `README_DJANGO.md` with setup and running instructions.

### Changed
- **Configuration**:
  - Updated `config/settings.py` to correctly map `STATIC_URL` to `/assets/` for Vite compatibility.

### Removed
- **Cleanup**:
  - Removed temporary scripts `download_ui.py` and `test_python.py` used during setup.
