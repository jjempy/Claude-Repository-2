# Deployment Guide

This guide deploys LeanShop RCA to the web for free using:
- **Railway** — backend API + PostgreSQL database
- **Vercel** — frontend Next.js app

Total setup time: ~10 minutes.

---

## Step 1 — Deploy Backend to Railway

Railway hosts the Node.js API and the PostgreSQL database.

### 1.1 Create a Railway account

Go to [railway.app](https://railway.app) and sign up with your GitHub account.

### 1.2 Create a new project

1. Click **New Project**
2. Choose **Deploy from GitHub repo**
3. Select **jjempy/Claude-Repository-2**
4. When asked for the root directory, type: `backend`
5. Click **Deploy Now**

Railway will detect the `nixpacks.toml` and build the Node.js app automatically.

### 1.3 Add a PostgreSQL database

1. In your Railway project, click **+ New**
2. Choose **Database → Add PostgreSQL**
3. Railway automatically sets the `DATABASE_URL` environment variable — no action needed.

### 1.4 Set environment variables

In your backend service settings, go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Any long random string (e.g. `my-super-secret-key-change-this-2024`) |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | `/tmp/uploads` |

### 1.5 Seed demo data (optional)

1. In your Railway backend service, click **Settings → Deploy**
2. Find the **Run Command** section and temporarily set it to:
   ```
   npm run db:seed && npx prisma migrate deploy && node dist/server.js
   ```
3. Redeploy once, then change it back to:
   ```
   npx prisma migrate deploy && node dist/server.js
   ```

Alternatively, use the Railway CLI:
```bash
railway run --service backend npm run db:seed
```

### 1.6 Copy your backend URL

Once deployed, Railway gives you a URL like:
```
https://claude-repository-2-backend-production.up.railway.app
```

Go to your backend service → **Settings** → copy the **Public Domain**. You'll need this in the next step.

---

## Step 2 — Deploy Frontend to Vercel

### 2.1 Create a Vercel account

Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.

### 2.2 Import the repository

1. Click **Add New → Project**
2. Find **jjempy/Claude-Repository-2** and click **Import**
3. In the **Configure Project** screen:
   - **Root Directory**: click Edit and set to `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)

### 2.3 Set environment variables

Before clicking Deploy, add this environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL from Step 1.6 (e.g. `https://your-app.up.railway.app`) |

### 2.4 Deploy

Click **Deploy**. Vercel will build and deploy the frontend. It takes about 2 minutes.

Your app will be live at a URL like:
```
https://claude-repository-2.vercel.app
```

---

## Step 3 — Test the Deployment

1. Open your Vercel URL
2. Click **Create Account** and register
3. Or use demo credentials (if you seeded):
   - `manager@demo.com` / `password123`
   - `engineer@demo.com` / `password123`
   - `operator@demo.com` / `password123`

---

## Connecting CORS (if needed)

If the browser shows CORS errors, add your Vercel URL to the Railway backend environment variables:

| Variable | Value |
|----------|-------|
| `ALLOWED_ORIGIN` | `https://your-app.vercel.app` |

---

## Updating the App

Both services auto-deploy when you push to the `main` (or configured) branch on GitHub.

To trigger a manual redeploy:
- **Railway**: Click **Redeploy** in the service dashboard
- **Vercel**: Click **Redeploy** in the deployment dashboard

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Railway | $5 free credit/month (enough for light usage), then pay-as-you-go |
| Vercel | Unlimited hobby deployments, 100GB bandwidth/month |

---

## Alternative: Run Locally with Docker

If you prefer to run locally:

```bash
git clone https://github.com/jjempy/Claude-Repository-2
cd Claude-Repository-2
cp .env.example .env
docker compose up -d
docker compose exec backend npm run db:seed
# Open http://localhost:3000
```

Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
