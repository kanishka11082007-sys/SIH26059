# PolarNav (SIH26059)
### Antarctic AI Navigation Decision Support & Risk Mitigation System

[![SIH](https://img.shields.io/badge/SIH-2024%20%2F%202025-blue.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2F%20Uvicorn-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2F%20TypeScript-61DAFB.svg)](https://react.dev)
[![MapLibre](https://img.shields.io/badge/GIS-MapLibre%20GL%20%2B%20deck.gl-blueviolet.svg)](https://maplibre.org)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase%20%2F%20PostgreSQL-336791.svg)](https://supabase.com)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%26%20Compose-2496ED.svg)](https://docker.com)

**PolarNav** is an autonomous maritime decision support system engineered for polar research vessels navigating Antarctic waters. It delivers real-time ice-aware voyage planning, dynamic multi-objective routing across 7 environmental cost surfaces, kinematic iceberg drift forecasting, and automated IMO POLARIS Risk Index Outcome (RIO) compliance reporting.

---

## Key Capabilities

1. **Conformal Antarctic Routing (EPSG:3031)**
   - Dynamic time-dependent multi-objective A* pathfinding.
   - Pareto frontier optimization balancing distance, fuel consumption, sea-ice resistance, and iceberg collision margins.
   - 3 operational corridors: **Route B (Optimal)**, **Route C (Safest Ice Margin)**, and **Route A (Direct Track)**.

2. **Empirical Machine Learning Models**
   - **Sea Ice Concentration Predictor**: Random Forest trained on NOAA/NSIDC CDR V4 satellite data ($R^2 = 0.8861$, $\text{MAE} = 0.0401$).
   - **Iceberg Kinematic Drift Predictor**: 0–48h dead-reckoning trajectory model trained on BYU/NIC Antarctic Iceberg Database ($1.7\text{ km}$ mean position error across 95,696 steps).
   - **Sentinel-1A SAR Ice/Water Classifier**: Regularized Random Forest with CFAR target detector ($98.47\%$ accuracy via Spatial GroupKFold validation).

3. **Authoritative Earth Observation Data Pipeline**
   - **Sea Ice Concentration**: NOAA/NSIDC Passive Microwave CDR (25km grid).
   - **Icebergs**: BYU/NIC MERS + ESA Sentinel-1A SAR radar (85 active targets).
   - **Ocean Currents**: E.U. Copernicus Marine Service (MERCATOR GLO12).
   - **Meteorology**: Open-Meteo API + ECMWF ERA5 Reanalysis.
   - **Bathymetry**: NOAA NGDC ETOPO 2022 global relief ($<20\text{m}$ keel collision hazard threshold).

4. **PostgreSQL / Supabase Persistence Layer**
   - Relational persistence with SQLAlchemy 2.0 and psycopg 3.
   - Transparent zero-downtime fallback to local file pipeline when offline.

---

## Quickstart

### Option 1: Docker Compose (Recommended)
Clone the repository and launch the full stack with one command:
```bash
# 1. Clone repo
git clone https://github.com/your-org/polarnav.git
cd polarnav

# 2. Configure environment
cp .env.example .env

# 3. Launch with Docker Compose
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

---

### Option 2: Local Development Setup

#### Prerequisites
- Python 3.11+
- Node.js 20+

#### 1. Backend Setup
```powershell
# Set Python path
$env:PYTHONPATH="D:\SIH\SIH26059;D:\SIH\antarctic-ai"

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed Supabase / PostgreSQL database
python -m backend.app.seed_db

# Run FastAPI server
python -m uvicorn backend.app.server:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```powershell
cd SIH26059\frontend
npm install
npm run dev
```

---

## Cloud Deployment Guide

### Single-Container Deployment (Render / Railway / Fly.io / AWS App Runner)
The unified [Dockerfile](file:///D:/SIH/Dockerfile) uses a multi-stage build that compiles the React frontend and serves both the API and the SPA from FastAPI on port `8000`:
1. Connect your GitHub repository to your cloud provider.
2. Select **Docker** deployment mode.
3. Set the build context to root (`.`) and Dockerfile path to `Dockerfile`.
4. Add your `DATABASE_URL` environment variable.
5. Deploy!

### Database Setup (Supabase)
1. Create a free project on [Supabase](https://supabase.com).
2. Copy your connection URI from **Project Settings $\to$ Database $\to$ Connection string (URI)**.
3. Paste it into your `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
   ```
4. Run the seed command:
   ```bash
   python -m backend.app.seed_db
   ```

---

## Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL / Supabase connection URI | Local file fallback |
| `OPEN_WATERS_API_KEY` | Commercial live AIS API key | Demo polar fleet |
| `OPEN_METEO_API_KEY` | Commercial Open-Meteo weather key | Free tier |
| `PORT` | Backend listening port | `8000` |
| `HOST` | Backend bind interface | `0.0.0.0` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `*` |
| `VITE_API_BASE_URL` | Frontend target API base URL | `/api` |

---

## License & Compliance
Engineered for Smart India Hackathon (SIH Problem Statement SIH26059). Compliant with **IMO Polar Code (Resolution MSC.385(94))** and **POLARIS (MSC.1/Circ.1519)**.
