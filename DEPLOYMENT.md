# Vercel Deployment Guide

This repository contains two parts: a **Backend** (Express/Node.js) and a **Frontend** (React/Vite). You will deploy them as two separate projects on Vercel.

## 1. Backend Deployment

### Steps:

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2.  Import your repository.
3.  **Root Directory**: Click "Edit" and select \`backend\`.
4.  **Framework Preset**: Select "Other" (or leave as default if Vercel detects it, but ensure it uses the settings below).
5.  **Build Command**: \`npm run build\` (or default).
6.  **Output Directory**: \`dist\` (or verify based on your \`tsconfig.json\` outDir).
7.  **Install Command**: \`npm install\`.

### Environment Variables (Backend)

Add these in the **Settings > Environment Variables** section of your Vercel project:

| Variable | Description | Example Value |
| (:---) | (:---) | (:---) |
| \`NODE_ENV\` | Environment mode | \`production\` |
| \`MONGODB_URI\` | MongoDB Connection String | \`mongodb+srv://user:pass@cluster.mongodb.net/db\` |
| \`JWT_ACCESS_SECRET\` | Secret for Access Token | \`your-secure-access-secret\` |
| \`JWT_REFRESH_SECRET\` | Secret for Refresh Token | \`your-secure-refresh-secret\` |
| \`CORS_ORIGIN\` | URL of your deployed Frontend | \`https://your-frontend-project.vercel.app\` |
| \`PORT\` | (Optional) Port number | \`5000\` (Vercel assigns its own, but good to have) |

> **Important**: You must redeploy the backend after setting \`CORS_ORIGIN\` if you set it after the initial deploy.

### Verification

Once deployed, visit the provided Vercel URL (e.g., \`https://project-backend.vercel.app/api/v1/health\`). You should see a success message.

---

## 2. Frontend Deployment

### Steps:

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2.  Import **the same repository**.
3.  **Root Directory**: Click "Edit" and select \`frontend\`.
4.  **Framework Preset**: Select **Vite**.
5.  **Build Command**: \`npm run build\` (default).
6.  **Output Directory**: \`dist\` (default).

### Environment Variables (Frontend)

Add these in the **Settings > Environment Variables** section:

| Variable | Description | Example Value |
| (:---) | (:---) | (:---) |
| \`VITE_API_URL\` | URL of your deployed Backend | \`https://project-backend.vercel.app/api/v1\` |

> **Note**: Ensure \`VITE_API_URL\` includes \`/api/v1\` at the end if that is your API prefix.

### Verification

1.  Visit your frontend URL.
2.  Open Developer Tools (F12) -> Network tab.
3.  Try to log in or fetch data.
4.  Ensure requests go to your backend URL, not \`localhost\`.

## 3. Post-Deployment Checklist

- [ ] **CORS**: Ensure the backend \`CORS_ORIGIN\` matches the frontend URL exactly (no trailing slash usually recommended, but check your code logic).
- [ ] **MongoDB**: Ensure your MongoDB Atlas Network Access whitelist includes `0.0.0.0/0` (Allow Access from Anywhere) because Vercel IPs are dynamic.
- [ ] **Re-deploy**: If you change env vars, you must redeploy for changes to take effect.
