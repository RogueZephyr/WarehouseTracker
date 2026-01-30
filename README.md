# =====================================
# WAREHOUSE LOADING TRACKER
# =====================================

A modern warehouse management dashboard designed to coordinate loading 
operations between dock crews and supervisors. This application provides a 
real-time, shared view of shipment statuses to minimize loading errors and 
streamline vehicle departures.

--------------------------------------------------------------------------------
-- CURRENT FEATURES                                                           --
--------------------------------------------------------------------------------

1. REAL-TIME BOARD
   - Three-column Kanban-style layout: Pending, In Process, and Complete.
   - Live updates to shipment quantities and status transitions.
   - Quick-increment buttons for rapid loading entry.

2. DUAL-FORMAT SUPPORT
   - SMALL FORMAT: Optimized for route-based loading with route groups.
   - LARGE FORMAT: Optimized for bulk loading with pallet counts and 
     verification statuses.

3. ROBUST BACKEND ENGINE
   - Django implementation providing a RESTful API for all CRUD operations.
   - Hybrid data persistence: Supports both lightweight JSON storage for 
     prototyping and PostgreSQL/SQLite ORM for production stability.

4. AUTOMATED DEPLOYMENT & CI
   - Cross-platform PowerShell deployment scripts (5.1 and Core supported).
   - GitHub Actions CI/CD pipeline for automated testing and validation.
   - Render-ready configuration (render.yaml) for cloud orchestration.

--------------------------------------------------------------------------------
-- SYSTEM REQUIREMENTS                                                        --
--------------------------------------------------------------------------------

- Python: 3.11 or higher
- Node.js: 18.x or higher
- PowerShell: 5.1 or Core (for automated setup)

--------------------------------------------------------------------------------
-- QUICK START (AUTOMATED)                                                    --
--------------------------------------------------------------------------------

The easiest way to get started on Windows is to run the deployment scripts 
located in the scripts/ directory.

1. Prepare the Backend:
   $ .\scripts\deploy_backend.ps1

2. Prepare the Frontend:
   $ .\scripts\deploy_frontend.ps1

--------------------------------------------------------------------------------
-- MANUAL SETUP                                                               --
--------------------------------------------------------------------------------

IF YOU PREFER MANUAL INSTALLATION, FOLLOW THESE STEPS:

1. VIRTUAL ENVIRONMENT & BACKEND DEPS:
   $ python -m venv .venv
   $ .\.venv\Scripts\activate
   $ pip install -e .[all]
   $ pip install -r requirements-dev.txt

2. DATABASE INITIALIZATION:
   $ python manage.py migrate

3. FRONTEND INSTALLATION:
   $ cd Warehouseloadingboardui-main
   $ npm install
   $ npm run build

--------------------------------------------------------------------------------
-- RUNNING LOCALLY                                                            --
--------------------------------------------------------------------------------

1. PRODUCTION MODE (Django serves both API and Frontend)
   $ python manage.py runserver
   => Open: http://localhost:8000

2. DEVELOPMENT MODE (HMR enabled for Frontend)
   $ # Terminal 1:
   $ python manage.py runserver
   $ # Terminal 2:
   $ cd Warehouseloadingboardui-main
   $ npm run dev
   => Open: http://localhost:5173

--------------------------------------------------------------------------------
-- REPOSITORY STRUCTURE                                                        --
--------------------------------------------------------------------------------

- /config        : Django project settings and URL configuration.
- /data          : Default storage for JSON persistence (loads.json).
- /scripts       : PowerShell automation for deployment and maintenance.
- /src           : Core application logic (Domain, Application, Infrastructure).
- /tests         : Automation and QA test suites.
- /Warehouseloadingboardui-main : React source code and Vite configuration.

--------------------------------------------------------------------------------
-- DOCUMENTATION                                                              --
--------------------------------------------------------------------------------

Detailed technical documentation and guides can be found in the 
DOCUMENTATION/ directory.
- DOCUMENTATION/CHANGELOGS : Historical record of all significant updates.
- DOCUMENTATION/Markdown   : Technical guides and testing instructions.

==============================================================================
