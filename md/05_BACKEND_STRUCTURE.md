# Backend Structure

## 1. Architecture
FastAPI provides REST APIs. Background workers handle ingestion, preprocessing, ML inference and expensive route calculations.

## 2. Folder Structure
```text
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── auth.py
│   │   ├── forecasts.py
│   │   ├── icebergs.py
│   │   ├── navigation.py
│   │   ├── routes.py
│   │   └── reports.py
│   ├── services/
│   │   ├── sea_ice_service.py
│   │   ├── iceberg_service.py
│   │   ├── routing_service.py
│   │   ├── weather_service.py
│   │   └── risk_service.py
│   ├── models/
│   │   ├── database/
│   │   └── schemas/
│   ├── repositories/
│   ├── workers/
│   │   ├── ingestion.py
│   │   ├── preprocessing.py
│   │   ├── inference.py
│   │   └── routing.py
│   ├── ml/
│   │   ├── sea_ice/
│   │   ├── iceberg/
│   │   └── common/
│   ├── geo/
│   │   ├── raster.py
│   │   ├── vector.py
│   │   └── projections.py
│   └── routing/
│       ├── graph.py
│       ├── cost.py
│       ├── constraints.py
│       └── optimizer.py
├── tests/
├── migrations/
├── scripts/
└── Dockerfile
```

## 3. API Design
Suggested endpoints:
```text
GET  /api/v1/forecasts/sea-ice
GET  /api/v1/icebergs
GET  /api/v1/icebergs/{id}/trajectory
POST /api/v1/routes/optimize
GET  /api/v1/routes/{id}
GET  /api/v1/hazards
GET  /api/v1/weather
GET  /api/v1/vessels
POST /api/v1/jobs
GET  /api/v1/jobs/{id}
```

## 4. Route Optimization Service
Pipeline:
```text
Request validation
 -> fetch forecast layers
 -> construct cost surface
 -> apply hard constraints
 -> graph/path search
 -> risk/fuel/time calculation
 -> rank alternatives
 -> persist route
 -> return GeoJSON
```

Return:
- Route geometry
- ETA
- distance
- estimated fuel
- total risk score
- sea-ice exposure
- iceberg exposure
- weather exposure
- confidence
- model/data timestamps

## 5. Data Model
Core entities:
- User
- Vessel
- Voyage
- Observation
- Forecast
- Iceberg
- IcebergTrack
- HazardLayer
- RouteRequest
- Route
- ModelVersion
- DatasetVersion

Use PostGIS geometry/geography fields for spatial objects.

## 6. Background Processing
Use queues for:
- Dataset downloads
- Raster preprocessing
- ML inference
- Route optimization
- Report generation

API requests should not block on long-running jobs. Return a job ID for heavy operations.

## 7. Error Handling
Use consistent error responses:
```json
{
  "error": {
    "code": "FORECAST_UNAVAILABLE",
    "message": "No valid forecast is available for the requested time.",
    "request_id": "..."
  }
}
```

## 8. Observability
Track:
- request latency
- worker queue length
- failed jobs
- data freshness
- model inference latency
- route generation latency
- forecast metrics
