# PolarNav — Authoritative API Reference

## Base URLs
- **Local Dev**: `http://localhost:8000`
- **Render Production**: Configured via `VITE_API_URL` environment variable

## 1. Route Optimization & Retrieval
### `GET /api/routes`
Returns 3 physics-informed Pareto corridors (**Route B Optimal**, **Route C Safest**, **Route A Direct/Baseline**) computed on EPSG:3031 with zero land crossings and antimeridian splitting.
- **Query Parameters**:
  - `vessel_id` (string): Vessel identifier (e.g. `rv_sagar_nidhi`, `rv_polarstern`)
  - `dest_id` (string, optional): COMNAP Antarctic Station ID (e.g. `bharati`, `maitri`, `neumayer_iii`)
  - `dest_lat` (float, optional): Destination latitude override
  - `dest_lon` (float, optional): Destination longitude override
  - `dest_name` (string, optional): Destination station name
- **Response Format**:
  ```json
  {
    "routes": [
      {
        "id": "rv_sagar_nidhi-route-b",
        "name": "ROUTE B - OPTIMAL / FASTEST ARRIVAL",
        "vessel_id": "rv_sagar_nidhi",
        "optimization_mode": "BALANCED",
        "recommended": true,
        "distance_km": 1736,
        "eta": "87h 45m",
        "fuel_estimate": "43 MT",
        "rio_score": "+8.4",
        "path": [[lat, lon], ...],
        "multi_path": [[[lat, lon], ...], ...],
        "crosses_antimeridian": false,
        "waypoints": [...]
      }
    ]
  }
  ```

### `POST /api/routes/optimize`
Execute ad-hoc route optimization with custom starting coordinates, vessel speed, and polar class.

## 2. Tactical Diversion & Simulation
### `POST /api/simulation/what-if`
Evaluates environmental shift impact (iceberg displacement, sea ice surge, gale force winds) on routing risk and fuel consumption.
- **Request Body**:
  ```json
  {
    "vessel_id": "rv_sagar_nidhi",
    "dest_id": "bharati",
    "iceberg_drift_km": 25.0,
    "sic_delta_pct": 15.0,
    "wind_gust_kn": 20.0
  }
  ```
- **Response**:
  ```json
  {
    "status": "SIMULATED",
    "simulation": true,
    "parameters": { ... },
    "baseline": { ... },
    "scenario": { ... },
    "difference": {
      "distance_delta_km": 12.0,
      "eta_delta_hours": 1.2,
      "fuel_delta_mt": 0.8,
      "risk_impact": "ELEVATED_DRIFT_HAZARD"
    },
    "explanation": "Simulated 25.0 km iceberg displacement..."
  }
  ```

### `POST /api/navigation/emergency`
Triggers immediate tactical diversion around unexpected calving events or besetments.
- **Request Body**:
  ```json
  {
    "vessel_id": "rv_sagar_nidhi",
    "dest_id": "bharati",
    "hazard_type": "DYNAMIC_ICEBERG_CALVING"
  }
  ```
- **Response**:
  ```json
  {
    "emergency": true,
    "status": "REROUTED",
    "hazard_type": "DYNAMIC_ICEBERG_CALVING",
    "reason": "Hazard detected in active transit corridor. Autonomous tactical diversion engaged.",
    "old_route": { ... },
    "new_route": { ... },
    "old_risk": "MODERATE",
    "new_risk": "VERY LOW (DIVERTED)",
    "fuel_difference_mt": 3.2,
    "eta_difference_hours": 2.4,
    "distance_difference_km": 48.0
  }
  ```

## 3. Gemini AI Navigation Copilot
### `POST /api/copilot`
Grounds a user prompt with authoritative telemetry and explains the algorithmic decisions of the Polar Routing Engine.
- **Request Body**:
  ```json
  {
    "message": "Why is Route B recommended over Route A?",
    "routeContext": {
      "vessel": { "name": "R/V Sagar Nidhi", "polar_class": "PC5" },
      "route": { "name": "ROUTE B - OPTIMAL / FASTEST ARRIVAL", "rioScore": "+8.4", "sicExposure": 22 }
    }
  }
  ```
- **Response**:
  ```json
  {
    "reply": "Route B is recommended because it skirts heavy pack ice through open leads, keeping average SIC at 22%...",
    "model": "gemini-flash-lite-latest",
    "confidence": 0.95
  }
  ```
