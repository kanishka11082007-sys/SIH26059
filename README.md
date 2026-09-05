# PolarNav (SIH26059)
### Antarctic AI Navigation Decision Support & Risk Mitigation System

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-pearl-nine-74.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)](https://sih-2026-059.onrender.com)
[![Interactive Docs](https://img.shields.io/badge/Swagger%20Docs-FastAPI-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://sih-2026-059.onrender.com/docs)
[![Database](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

[![SIH](https://img.shields.io/badge/Smart%20India%20Hackathon-PS%20SIH26059-blue.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2F%20Uvicorn-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2F%20TypeScript-61DAFB.svg)](https://react.dev)
[![MapLibre](https://img.shields.io/badge/GIS-MapLibre%20GL%20%2B%20deck.gl-blueviolet.svg)](https://maplibre.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg)](https://python.org)
[![License](https://img.shields.io/badge/Standard-IMO%20Polar%20Code-orange.svg)](https://www.imo.org)

</div>

---

**PolarNav** is an autonomous maritime decision support system engineered for polar research vessels navigating Antarctic waters. It delivers real-time ice-aware voyage planning, dynamic multi-objective routing across 7 environmental cost surfaces, kinematic iceberg drift forecasting, and automated IMO POLARIS Risk Index Outcome (RIO) compliance reporting.

---

## 🌐 Live Deployments & Cloud Endpoints

| Service | Platform | Endpoint / URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web Application** | **Vercel** | [frontend-pearl-nine-74.vercel.app](https://frontend-pearl-nine-74.vercel.app/) | Production React 19 + MapLibre/Deck.gl polar HUD & tactical routing dashboard |
| **Backend REST API** | **Render** | [sih-2026-059.onrender.com](https://sih-2026-059.onrender.com) | FastAPI high-performance Antarctic routing engine & ML inference service |
| **Interactive API Documentation** | **Swagger UI** | [sih-2026-059.onrender.com/docs](https://sih-2026-059.onrender.com/docs) | Interactive OpenAPI testing console for routes, iceberg forecasts & telemetry |
| **Database Persistence** | **Supabase** | Cloud PostgreSQL / PostGIS | Relational persistence with fallback resilience for offline vessel operations |

---

## 📁 Repository Structure

```text
SIH/
├── backend/                      # High-performance FastAPI routing & ML services
│   ├── app/                      # Server entrypoint, REST routers, database schema & seeder
│   ├── data/raw/                 # Satellite & ocean observation datasets (NOAA, NSIDC, Copernicus)
│   ├── models/                   # Pre-trained ML models (.joblib) and feature configs
│   ├── services/                 # AIS live simulation & Gemini AI Copilot orchestration
│   └── src/                      # Core geospatial routing, ocean, bathymetry & iceberg engines
│       ├── data/                 # Copernicus Marine, NSIDC, NOAA & Open-Meteo pipelines
│       ├── iceberg/              # BYU/NIC drift prediction & kinematic trajectory service
│       ├── navigation/           # Conformal Antarctic EPSG:3031 polar A* pathfinding
│       ├── optimization/         # Multi-objective Pareto routing & POLARIS safety engine
│       ├── risk/                 # 7-factor environmental risk indexing (RIO MSC.1/Circ.1519)
│       └── sentinel/             # Sentinel-1A SAR radar sea ice classifier
│
├── SIH26059/
│   └── frontend/                 # Production React 19 + TypeScript + Vite web app
│       ├── src/                  # PolarMap, Deck.gl layers, tactical HUDs, & Copilot drawer
│       ├── vercel.json           # Production Vercel reverse-proxy config
│       └── package.json          # Frontend npm dependencies and build scripts
│
├── docs/                         # Technical documentation & architectural specifications
│   ├── ARCHITECTURE.md           # End-to-end architecture & data pipeline design
│   ├── API.md                    # REST API endpoints & schemas
│   ├── AI_COPILOT.md             # Low-latency Gemini AI navigation copilot design
│   ├── DEPLOYMENT.md             # Production Vercel + Render deployment guide
│   ├── ML.md                     # Empirical ML models, metrics & training methodologies
│   ├── NAVIGATION.md             # EPSG:3031 conformal polar routing mathematics
│   └── SIH_DEMO.md               # Step-by-step judge demonstration script
│
├── start.bat                     # Quick-launch script for Windows
├── start.sh                      # Quick-launch script for Linux/macOS
├── requirements.txt              # Backend Python dependencies
└── README.md                     # System documentation & quickstart guide
```

---

## 🚀 Key Capabilities

### 1. Conformal Antarctic Routing (EPSG:3031)
- Dynamic time-dependent multi-objective A* pathfinding avoiding pole distortion through South Polar Stereographic projection.
- Pareto frontier optimization balancing distance, fuel consumption, sea-ice resistance, and iceberg collision margins.
- 3 operational corridors generated per mission:
  - **Route B (Optimal)**: Balanced speed, fuel efficiency, and risk margin.
  - **Route C (Safest Ice Margin)**: Maximum standoff distance from heavy pack ice and icebergs.
  - **Route A (Direct Track)**: Minimal distance reference trajectory.

### 2. Empirical Machine Learning Models
- **Sea Ice Concentration Predictor**: Random Forest trained on NOAA/NSIDC CDR V4 satellite data ($R^2 = 0.8861$, $\text{MAE} = 0.0401$).
- **Iceberg Kinematic Drift Predictor**: 0–48h dead-reckoning trajectory model trained on BYU/NIC Antarctic Iceberg Database ($1.7\text{ km}$ mean position error across 95,696 steps).
- **Sentinel-1A SAR Ice/Water Classifier**: Regularized Random Forest with CFAR target detector ($98.47\%$ accuracy via Spatial GroupKFold validation).

### 3. Authoritative Earth Observation Data Pipeline
- **Sea Ice Concentration**: NOAA/NSIDC Passive Microwave CDR (25km grid).
- **Icebergs**: BYU/NIC MERS + ESA Sentinel-1A SAR radar (active tracking targets).
- **Ocean Currents**: E.U. Copernicus Marine Service (MERCATOR GLO12).
- **Meteorology**: Open-Meteo API + ECMWF ERA5 Reanalysis.
- **Bathymetry**: NOAA NGDC ETOPO 2022 global relief ($<20\text{m}$ keel collision hazard threshold).

### 4. Interactive Gemini AI Polar Navigation Copilot
- Real-time LLM copilot grounded in live vessel telemetry, route waypoints, and localized ice concentrations.
- Provides immediate natural-language risk explanations and contingency recommendations.
- Sub-2-second response latency with transparent offline fallbacks.

### 5. PostgreSQL / Supabase Persistence Layer
- Relational persistence with SQLAlchemy 2.0 and psycopg 3.
- Automatic zero-downtime fallback to local file pipeline when offline or in remote field environments.

---

## 🛠️ Quickstart & Local Setup

### Quick Launch
- **Windows**: Double-click [start.bat](file:///d:/SIH/start.bat)
- **Linux/macOS**: Run `./start.sh`

### Manual Step-by-Step

#### Prerequisites
- Python 3.11+
- Node.js 20+

#### 1. Backend Setup
```powershell
# Set Python path
$env:PYTHONPATH="D:\SIH;D:\SIH\backend;D:\SIH\backend\src"

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

- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

---

## 🔒 Environment Configuration

Copy [.env.example](file:///d:/SIH/.env.example) to `.env` in the project root:

```env
# Supabase PostgreSQL Database (Optional - falls back to local data if omitted)
DATABASE_URL=postgresql+psycopg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require

# Server Configuration
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=*

# AI Navigation Copilot
GEMINI_API_KEY=your_gemini_api_key_here
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-lite-latest
```

For cloud deployments:
- **Render Backend**: Refer to [render.env.example](file:///d:/SIH/render.env.example) and [docs/DEPLOYMENT.md](file:///d:/SIH/docs/DEPLOYMENT.md).
- **Vercel Frontend**: Refer to [vercel.env.example](file:///d:/SIH/vercel.env.example).

---

## 📜 Standards & Compliance
Engineered for Smart India Hackathon (SIH Problem Statement SIH26059). Compliant with:
- **IMO Polar Code (Resolution MSC.385(94))**
- **POLARIS Risk Index Outcome System (MSC.1/Circ.1519)**
- **WMO Sea Ice Nomenclature & Observation Standards**
