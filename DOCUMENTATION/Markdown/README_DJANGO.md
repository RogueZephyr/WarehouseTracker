# Warehouse Loading Board - Django Integration

This project integrates the React frontend with a Django backend.

## Prerequisites
- Python 3.10+
- Node.js 18+

## Setup Instructions

### 1. Backend Setup
The Django project is configured in the root directory.
Install dependencies (ensure django is installed):
```bash
pip install django
```

Initialize the database (optional for this prototype as we use JSON, but good for session/auth):
```bash
python manage.py migrate
```

### 2. Frontend Build
The Django view serves the built frontend files. You must build the React app first.

Navigate to the UI directory:
```bash
cd Warehouseloadingboardui-main
npm install
npm run build
```
This will create a `dist` folder.

### 3. Run the Server
Return to the root directory and start Django:
```bash
python manage.py runserver
```

Visit `http://localhost:8000` to see the board.
The API is available at `http://localhost:8000/api/loads/`.

## Development Note
To edit the frontend, run `npm run dev` in the UI folder, but note that it won't be connected to the Django API unless you configure a proxy in `vite.config.ts`.
For this prototype, we assume the "Build & Serve" workflow.
