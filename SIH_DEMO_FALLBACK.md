# SIH 2026 — Live Demo Emergency Failure & Fallback Plan

**Problem Statement:** SIH26059 — *Antarctic Navigation Decision Support System*  
**Golden Rule:** **NEVER FABRICATE DATA DURING LIVE JUDGING.** If a live service fails, use pre-cached authentic local archives and explain the architectural fallback mechanism honestly to the judges. Judges reward graceful degradation and resilience.

---

## Failure Matrix & Mitigation Protocol

| Failure Event | Root Cause | Immediate Action | Presenter Spoken Explanation |
|---|---|---|---|
| **1. Internet Disconnects** | Convention WiFi / venue hotspot drops | Continue demonstration normally. The entire system is built to run 100% locally on `localhost:8000` (FastAPI) and `localhost:5173` (Vite) using local NetCDF and JSON archives. | *"Notice that our decision support system requires zero cloud dependencies. It is specifically designed to run entirely on a shipboard edge server in the Southern Ocean where internet connectivity is non-existent."* |
| **2. MapLibre / Basemap Tiles Fail to Load** | External raster/vector tile server blocked or rate-limited | The map automatically falls back to local vector GeoJSON land polygons (`antarctica_land_mask.geojson`) and polar grid circles rendered via deck.gl layers. | *"When external web basemaps are unreachable, our polar renderer displays local vector bathymetry contours and the SCAR Antarctic land boundary directly from local memory."* |
| **3. Live AIS API Fails / Returns HTTP 500** | Open Waters AIS API unreachable or rate-limited | The backend automatically activates `DETERMINISTIC_SIMULATION` mode with `badge: "● DETERMINISTIC DEMO VOYAGE"` for canonical expedition vessels (*R/V Sagar Nidhi*, *R/V Polarstern*). | *"As shown by our data status badge, terrestrial AIS is unavailable, so our system automatically engages our verified COMNAP voyage simulation pipeline with full provenance disclosure."* |
| **4. Weather / Ocean API Unavailable** | Copernicus Marine or GFS live download timeout | The system falls back to regional climatological baseline wind vectors (15 kn) and wave heights (1.5 m) with a `FALLBACK_CLIMATOLOGY` provenance tag. | *"In high latitudes when atmospheric forecast feeds drop, our risk engine falls back to seasonal climatological baselines rather than failing the passage calculation."* |
| **5. Model Joblib File Fails to Load** | Corrupted artifact or missing dependency | Run `python backend/final_system_validation.py` before presenting. If still failing, the engine falls back to the KDTree spatial interpolation index. | *"The system utilizes a dual-tier prediction layer: primary inference via Random Forest regressions, with an observational KDTree fallback ensuring pathfinding never blocks."* |
| **6. Dynamic Route Optimization Returns No Route** | Start coordinate snapped to inland ice sheet | Select standard research station destinations: **Bharati Station** (-69.41, 76.19) or **Neumayer III** (-70.67, -8.27). | *"Notice that if an impossible inland location is chosen, the engine strictly rejects the route with `FAILED_NO_NAVIGABLE_ROUTE`, refusing to generate dangerous artificial corridors across land."* |
| **7. Frontend Browser Tab Freezes / Crashes** | WebGL context lost or browser tab crash | Refresh `localhost:5173`. The application reloads within 1.5 seconds from Vite development server, preserving active vessel state in `FleetContext`. | *"We have refreshed the client interface. The state immediately reconnects to the local FastAPI backend with full session recovery."* |

---

## Pre-Presentation 60-Second Sanity Checklist

Before stepping onto the presentation stage or screen share, execute these three commands in terminal:

```bash
# 1. Verify all 17 backend APIs, ML models, and routing logic
cd d:\SIH\backend
python final_system_validation.py

# Expected Output:
# >>> ALL RED-TEAM SYSTEM VALIDATION CHECKS PASSED (5.71s) <<<

# 2. Verify frontend compilation
cd d:\SIH\SIH26059\frontend
npm run build

# Expected Output:
# ✓ built in ~2.3s (0 errors)

# 3. Start local development servers
# Terminal 1:
python -m uvicorn app.server:app --host 127.0.0.1 --port 8000

# Terminal 2:
npm run dev
```

---

## Quick Hotkey Navigation Reference

- **Overview / Circumpolar Map:** `http://localhost:5173/`
- **Navigation & Corridor Optimization:** `http://localhost:5173/navigation`
- **Iceberg Multi-Horizon Forecasts:** `http://localhost:5173/icebergs`
- **Sea-Ice Satellite Analysis:** `http://localhost:5173/sea-ice`
- **Decision Intelligence & Logs:** `http://localhost:5173/intelligence`

*Never apologize for technical limitations that reflect real polar maritime conditions. Frame them as authentic domain realities.*
