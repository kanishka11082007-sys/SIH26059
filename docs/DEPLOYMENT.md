# PolarNav — Production Deployment Guide (Vercel + Render)

## 1. Environment Architecture
- **Frontend**: Deployed on **Vercel**
- **Backend**: Deployed on **Render** (Web Service, Python 3.11)

## 2. Environment Variables

### Backend (Render)
Configure in Render Dashboard -> Environment:
```ini
PYTHON_VERSION=3.11.9
PORT=8000
GEMINI_API_KEY=AIzaSy...your_gemini_key
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-lite-latest
CORS_ORIGINS=*
```

### Frontend (Vercel)
Configure in Vercel Project Settings -> Environment Variables:
```ini
VITE_API_URL=https://your-render-backend.onrender.com
```

## 3. Build & Run Commands

### Render (Backend)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.app.server:app --host 0.0.0.0 --port 8000`

### Vercel (Frontend)
- **Framework Preset**: Vite
- **Root Directory**: `SIH26059/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
