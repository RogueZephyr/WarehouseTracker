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

---

## Backend CORS Configuration (Django)

I have pre-configured `config/settings.py` with `django-cors-headers`. You just need to ensure the following environment variable is set on your host:

*   **CORS_ALLOWED_ORIGINS**: Set this to your frontend domain (e.g., `https://your-site.vercel.app`).

For local development, it defaults to `http://localhost:5173`.

