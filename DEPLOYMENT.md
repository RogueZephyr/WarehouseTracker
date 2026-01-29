# Deployment Guide

This guide explains how to deploy the **Warehouse Tracker Frontend** to **Vercel** or **Netlify**.

> [!NOTE]
> This guide focuses on deploying the **React/Vite Frontend** (`Warehouseloadingboardui-main`).
> The Django Backend must be deployed separately (e.g., on Railway, Render, Heroku, or a VPS).
>
> **Crucial**: Since the frontend is separate from the backend, we must configure **Rewrites** so that API calls to `/api/...` are redirected to your live backend URL.

## Prerequisites

1.  **GitHub Repository**: Ensure your project is pushed to GitHub.
2.  **Live Backend**: You should have your Django backend deployed and accessible via a public URL (e.g., `https://my-django-app.railway.app`).
    *   Ensure your Django backend allows CORS from your frontend domain.

## Option 1: Deploy to Vercel

Vercel is optimized for Next.js and Vite apps.

### 1. Prepare your Project
Create a `vercel.json` file in the `Warehouseloadingboardui-main` directory to handle API redirects.

**File:** `Warehouseloadingboardui-main/vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://<YOUR_BACKEND_URL>/api/$1"
    }
  ]
}
```
*Replace `<YOUR_BACKEND_URL>` with your actual backend URL (no trailing slash).*

### 2. Connect to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2.  Import your GitHub repository.

### 3. Configure Project Settings
*   **Framework Preset**: Select **Vite**.
*   **Root Directory**: Click "Edit" and select `Warehouseloadingboardui-main`.
*   **Build & Output Settings**: Vercel should auto-detect these (`vite build`, `dist`), but verify them.
*   **Environment Variables**: If you added any environment variables in your code, add them here.

### 4. Deploy
Click **Deploy**. Vercel will build your app. Once done, test the application. API calls should work if the rewrite is configured correctly.

---

## Option 2: Deploy to Netlify

Netlify is another excellent choice for static sites and SPAs.

### 1. Prepare your Project
Create a `netlify.toml` file in the `Warehouseloadingboardui-main` directory to handle API proxying.

**File:** `Warehouseloadingboardui-main/netlify.toml`
```toml
[build]
  base = "Warehouseloadingboardui-main"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://<YOUR_BACKEND_URL>/api/:splat"
  status = 200
  force = true
```
*Replace `<YOUR_BACKEND_URL>` with your actual backend URL (no trailing slash).*

### 2. Connect to Netlify
1.  Go to [Netlify](https://app.netlify.com/) and click **"Add new site"** -> **"Import from Git"**.
2.  Choose GitHub and select your repository.

### 3. Configure Build Settings
Netlify might detect the settings from `netlify.toml` automatically. If not:
*   **Base directory**: `Warehouseloadingboardui-main`
*   **Build command**: `npm run build`
*   **Publish directory**: `dist`

### 4. Deploy
Click **Deploy Site**.

---

## Option 3: Backend Deployment on Render

Render is a great free alternative for deploying Django applications.

### 1. Link your Repository
1.  Log in to [Render](https://dashboard.render.com/).
2.  Click **"New +"** -> **"Blueprint"**.
3.  Connect your GitHub repository.
4.  Render will find the `render.yaml` file and automatically configure your service.

### 2. Environment Variables
Render will prompt you for variables defined in `render.yaml`.
*   **DEBUG**: Set to `False`.
*   **ALLOWED_HOSTS**: Your backend URL (e.g., `warehouse-tracker.onrender.com`).
*   **CSRF_TRUSTED_ORIGINS**: Your frontend URL (e.g., `https://my-app.vercel.app`).
*   **CORS_ALLOWED_ORIGINS**: Your frontend URL (e.g., `https://my-app.vercel.app`).

### 3. Database (Optional)
If you want a persistent PostgreSQL database instead of the prototype SQLite:
1.  Create a **PostgreSQL** instance on Render (Free Tier available).
2.  Add a `DATABASE_URL` environment variable to your Web Service.
3.  Ensure your code uses `dj-database-url` to parse it (not included in this prototype setup).

## Option 4: Composable Stack (Render Backend + Supabase Postgres + Vercel Frontend)

This repository now supports running all load logic via Django's ORM, so you can pair a **Supabase Postgres** database (free tier) with Render (Python web service) and Vercel (Vite UI). The build/deploy steps are:

1. **Supabase:** provision the Postgres database.
2. **Render:** host the Django API and point it at Supabase via `DATABASE_URL`.
3. **Vercel:** build and rewrite `/api` to the Render service.

### 1. Provision Supabase
* Sign in to [Supabase](https://supabase.com/) and create a new project.
* Grab the **Connection string** (starts with `postgres://`) from **Settings -> Database -> Connection string**.
* Use this string for Render's `DATABASE_URL` and, when you test locally, for your shell (e.g., `set DATABASE_URL=postgres://...` before running `python manage.py migrate`).
* Supabase already enforces SSL (`sslmode=require`), so no extra client config is needed.
* Optional: save the Supabase service-role key if you want to access the database outside of Django (exports, analytics, etc.). The Django app only needs `DATABASE_URL`.

### 2. Deploy backend to Render
* Render already reads `render.yaml`. Update the service to keep installing dependencies, run migrations, and start Gunicorn:

  ```yaml
  services:
    - type: web
      name: warehouse-tracker-backend
      runtime: python
      buildCommand: "pip install . && pip install gunicorn django-cors-headers"
      startCommand: "python manage.py migrate --noinput && gunicorn config.wsgi:application"
      envVars:
        - key: DATABASE_URL
          value: "<YOUR_SUPABASE_CONNECTION_STRING>"
        - key: SECRET_KEY
          generateValue: true
        - key: DEBUG
          value: "False"
        - key: ALLOWED_HOSTS
          value: "warehouse-tracker-backend.onrender.com,<your-vercel-domain>"
        - key: CSRF_TRUSTED_ORIGINS
          value: "https://<your-vercel-domain>"
        - key: CORS_ALLOWED_ORIGINS
          value: "https://<your-vercel-domain>"
        - key: REPOSITORY_BACKEND
          value: "db"
  ```

  > With this start command, Render will automatically apply the migrations before launching Gunicorn, and `REPOSITORY_BACKEND=db` forces the new ORM-backed repository instead of the JSON fallback.

* Add the Vercel domain to `ALLOWED_HOSTS` and both `CSRF_TRUSTED_ORIGINS`/`CORS_ALLOWED_ORIGINS` so the frontend can talk to the API.
* During local development, run `scripts/deploy_frontend.ps1` to rebuild the Vite bundle and `scripts/deploy_backend.ps1` (or `python manage.py migrate` + `collectstatic`) before running the server.

### 3. Point Vercel at Render
* Keep the `Warehouseloadingboardui-main/vercel.json` rewrite in place so `/api/*` requests hit the Render service.
* Configure any Vercel environment variables the UI needs (e.g., `VITE_API_BASE_URL` if you add one later).
* Deploy the frontend so the Django template can serve `dist/index.html` and `dist/assets`.

### 4. Local development notes
* The JSON repository still exists for quick local runs, so set `REPOSITORY_BACKEND=json` if you prefer not to depend on Supabase.
* To test against Supabase locally, `export DATABASE_URL` and `export REPOSITORY_BACKEND=db` before hitting `python manage.py runserver`.
* Supabase migrations are handled by `python manage.py migrate`; your Render service (or the `startCommand` above) runs it automatically, but you can also execute migrations manually on Render via the shell.

This composable approach keeps the stack within the free tiers - Supabase for storage, Render for the Python API, and Vercel for the UX - while leaving the old file-backed repo active until you explicitly switch to Postgres for testing.

---

## Backend CORS Configuration (Django)

I have pre-configured `config/settings.py` with `django-cors-headers`. You just need to ensure the following environment variable is set on your host:

*   **CORS_ALLOWED_ORIGINS**: Set this to your frontend domain (e.g., `https://your-site.vercel.app`).

For local development, it defaults to `http://localhost:5173`.

