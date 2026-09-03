# Optimal Technology Stack

## 1. Recommended Stack
| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Fast, maintainable dashboard |
| UI | Tailwind CSS + shadcn/ui | Consistent engineering-friendly UI |
| Maps | MapLibre GL JS | Flexible interactive geospatial maps |
| Charts | Apache ECharts | Rich scientific/time-series visualization |
| Backend API | FastAPI + Python | Excellent for ML/geospatial workloads |
| Async jobs | Celery + Redis | Mature background processing |
| ML | PyTorch + scikit-learn + XGBoost | Deep learning + strong baselines |
| Geospatial | GeoPandas, Shapely, Rasterio, xarray, rioxarray | Vector/raster/scientific processing |
| Routing | NetworkX + custom A*/Dijkstra; OR-Tools for constrained optimization | Flexible routing and optimization |
| Database | PostgreSQL + PostGIS | Strong spatial querying |
| Cache | Redis | Low-latency API/job cache |
| Object storage | S3-compatible storage | Large raster/model/archive storage |
| Analytical format | Parquet + Zarr | Efficient multidimensional/columnar data |
| Experiment tracking | MLflow | Model/experiment registry |
| Workflow orchestration | Prefect | Clear data/ML pipeline orchestration |
| Testing | Pytest + Playwright | Backend + end-to-end UI |
| Containers | Docker | Reproducible deployment |
| Observability | Prometheus + Grafana + OpenTelemetry | Metrics/tracing |
| CI/CD | GitHub Actions | Simple automated delivery |

## 2. Architecture Choice
For SIH, use a **modular monolith + worker architecture** rather than many microservices.

```text
Next.js
   |
FastAPI
 |   |   |
DB Redis ML/Route Workers
       |
 Object Storage
```

This is easier to build, debug and demonstrate while preserving clean module boundaries.

## 3. ML Strategy
### Sea ice
- Baseline: persistence + climatology
- Tabular baseline: XGBoost
- Main candidate: ConvLSTM / 3D CNN / spatiotemporal transformer
- Output: forecast map + uncertainty

### Icebergs
- Detection: segmentation/detection model such as U-Net/YOLO-family model
- Tracking: nearest-neighbor/Kalman or learned association
- Trajectory: physics-informed ML or sequence model using ocean/wind/ice features
- Output: predicted track + uncertainty cone

### Route scoring
Example:
`Cost = w1 * travel_time + w2 * fuel + w3 * ice_risk + w4 * iceberg_risk + w5 * weather_risk`

Hard constraints such as forbidden zones, vessel draft limits and minimum safety margins must be applied before optimization.

## 4. Evaluation
Sea ice:
- MAE, RMSE, SSIM, spatial correlation
- Compare against persistence/climatology

Iceberg:
- Detection precision/recall/mAP
- Track error
- ADE/FDE for trajectories

Routing:
- Travel time
- Estimated fuel
- Hazard exposure
- Minimum clearance
- Route computation time

## 5. Security
- JWT/OAuth2 authentication
- Role-based access
- Input validation with Pydantic
- Rate limiting
- Secrets in environment/secret manager
- Audit logs for route requests and model versions
