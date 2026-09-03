# Module Integration Map

## Module 1 — Antarctic + Sea-Ice Science
Produces domain rules, physical variables, thresholds and interpretation guidance.

## Module 2 — Satellite + Antarctic Datasets
Produces normalized observations and geospatial data products.

## Module 3 — Sea-Ice Forecasting ML
Consumes historical observations and produces future sea-ice concentration maps plus uncertainty.

## Module 4 — Iceberg Trajectory ML
Consumes satellite detections, historical tracks and environmental forcing; produces predicted trajectories and uncertainty cones.

## Module 5 — Navigation
Consumes vessel constraints and hazard layers; generates candidate routes.

## Module 6 — Navigation Optimization
Ranks routes using safety, fuel and time objectives.

## Module 7 — Routing/API Orchestration
Exposes all capabilities through APIs and coordinates asynchronous jobs.

## Data Flow
```text
M1 Science
   ↓ rules/features
M2 Data
   ↓ observations
M3 Sea-Ice ML ──────┐
                    ├──> Hazard/Risk Layer ──> M5/M6 Routing
M4 Iceberg ML ──────┘
                           ↓
                      M7 Backend API
                           ↓
                      Frontend Dashboard
```

## Demo-Critical Path
For an SIH prototype, prioritize:
1. One reliable sea-ice dataset.
2. One iceberg detection/track source.
3. A baseline forecast model.
4. A working risk map.
5. A route optimizer.
6. A polished map dashboard.
7. Explainable route comparison.

Do not overbuild distributed infrastructure before the end-to-end pipeline works.
