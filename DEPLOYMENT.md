# PolarNav Production Deployment Guide

PolarNav (SIH26059) is fully production-ready and supports three deployment architectures:
1. **Single-Container Full-Stack** (*Recommended for Render, Railway, Fly.io, AWS App Runner*): Builds both React frontend and FastAPI backend into a single image.
2. **Dedicated Backend Container** (*For Docker Hub, AWS ECS, GCP Cloud Run, Kubernetes*): Self-contained backend service in `./backend`.
3. **Multi-Container Compose** (*For local staging or dedicated Linux VMs*): FastAPI backend + Nginx frontend reverse proxy.

---

## 🚀 Option 1: Render (1-Click Blueprint)

PolarNav includes a [`render.yaml`](file:///d:/SIH/render.yaml) configuration:

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** $\to$ **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and configure:
   - **Environment**: Docker
   - **Dockerfile**: `Dockerfile`
   - **Health Check**: `/api/health`
4. Add your environment variables (e.g. `DATABASE_URL`).
5. Click **Apply**. Both your UI and API will be live on `https://your-app.onrender.com`!

---

## 🚂 Option 2: Railway (1-Click)

PolarNav includes a [`railway.json`](file:///d:/SIH/railway.json) configuration:

1. Push your repository to GitHub.
2. In [Railway Dashboard](https://railway.app), click **New Project** $\to$ **Deploy from GitHub repo**.
3. Railway automatically detects `Dockerfile` and `railway.json`.
4. Add any custom variables in the **Variables** tab (`DATABASE_URL`, etc.).
5. Railway assigns a public domain with HTTPS automatically.

---

## ✈️ Option 3: Fly.io

PolarNav includes a [`fly.toml`](file:///d:/SIH/fly.toml) configuration:

```bash
# 1. Install Fly CLI and authenticate
fly auth login

# 2. Launch or deploy
fly launch --no-deploy
fly deploy
```

---

## 🐳 Option 4: Docker Hub / Container Registry

### Build & Push the Full-Stack Image:
```bash
# Build full-stack image (React UI + FastAPI Backend)
docker build -t yourusername/polarnav:latest .

# Push to Docker Hub
docker push yourusername/polarnav:latest

# Run anywhere:
docker run -d -p 8000:8000 yourusername/polarnav:latest
```

### Build & Push Dedicated Backend Only:
```bash
# Build backend image directly using the unified backend directory
docker build -t yourusername/polarnav-backend:latest ./backend

# Push to Docker Hub
docker push yourusername/polarnav-backend:latest

# Run backend:
docker run -d -p 8000:8000 yourusername/polarnav-backend:latest
```

---

## 🛠️ Option 5: Multi-Container Docker Compose

For deploying on a Linux VM (Ubuntu/Debian, EC2, DigitalOcean Droplet):

```bash
# 1. Clone repository
git clone https://github.com/your-org/polarnav.git
cd polarnav

# 2. Create environment file
cp .env.example .env

# 3. Build and launch services
docker compose up -d --build

# Status check:
docker compose ps
```
- **Frontend**: `http://<your-server-ip>:3000`
- **Backend API**: `http://<your-server-ip>:8000`
- **API Docs**: `http://<your-server-ip>:8000/docs`

---

## ▲ Option 6: Decoupled Deployment (Vercel Frontend + Render Backend)

If you prefer hosting the React frontend on Vercel:

1. **Backend**: Deploy `./backend` to Render or Railway using `backend/Dockerfile`. Copy your backend URL (e.g., `https://polarnav-api.onrender.com`).
2. **Frontend**: In [Vercel Dashboard](https://vercel.com):
   - **Root Directory**: `SIH26059/frontend`
   - **Framework Preset**: Vite
   - **Environment Variable**: `VITE_API_BASE_URL=https://polarnav-api.onrender.com/api`
3. Click **Deploy**. Vercel's `vercel.json` and `_redirects` will automatically handle SPA routing and API proxies.

---

## 🔑 Production Environment Variables Reference

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Port the container listens on (Render/Railway/Fly pass this automatically) | `8000` |
| `HOST` | Optional | Host interface binding | `0.0.0.0` |
| `DATABASE_URL` | Optional | Supabase / PostgreSQL URI for real-time DB persistence | Local verified files fallback |
| `OPEN_WATERS_API_KEY` | Optional | Commercial live AIS telemetry API key | Canonical 8-vessel polar fleet |
| `OPEN_METEO_API_KEY` | Optional | Open-Meteo commercial key | Free public tier |
| `CORS_ORIGINS` | Optional | Allowed CORS origins (comma-separated) | `*` |
