# End-to-End Project Workflow

## A. Offline Data/ML Workflow
```text
Acquire -> Validate -> Normalize -> Reproject/Align
       -> Feature Engineering -> Dataset Versioning
       -> Train -> Evaluate -> Register Model
       -> Deploy Candidate -> Monitor -> Promote
```

### Data ingestion
- Satellite: sea-ice concentration, SAR/optical imagery, altimetry where applicable.
- Ocean: currents, SST, salinity, waves.
- Atmosphere: wind, pressure, temperature, precipitation.
- Navigation: vessel position, speed, heading, draft/operational constraints.
- Iceberg observations: detected/known iceberg positions and tracks.

### Preprocessing
- Spatially align datasets to a common grid/reference system.
- Synchronize timestamps.
- Handle missing values and quality flags.
- Remove obvious outliers.
- Generate derived variables such as gradients, drift vectors and distance-to-hazard.

## B. Sea-Ice Forecasting
```text
Historical gridded observations
        -> temporal/spatial features
        -> baseline model
        -> deep spatiotemporal model
        -> probabilistic forecast
        -> uncertainty + metrics
```
Recommended progression:
1. Persistence baseline
2. Random Forest/XGBoost baseline
3. ConvLSTM/3D CNN or temporal transformer
4. Compare against persistence and seasonal climatology

## C. Iceberg Workflow
```text
Satellite image
 -> preprocessing
 -> iceberg detection/segmentation
 -> geolocation
 -> track association
 -> trajectory model
 -> uncertainty cone
```

Trajectory features can include previous positions, ocean currents, wind, wave state, sea-ice drift and iceberg characteristics.

## D. Navigation Workflow
```text
User selects origin/destination
        -> load latest forecast layers
        -> generate navigable graph/grid
        -> assign edge cost
        -> apply hard constraints
        -> optimize route
        -> calculate risk/fuel/time
        -> return alternatives
```

## E. Online Decision Loop
1. User selects vessel and voyage window.
2. Backend loads current observations and forecasts.
3. Hazard engine builds sea-ice and iceberg risk surfaces.
4. Router computes candidate paths.
5. Scoring engine ranks paths by safety, fuel and ETA.
6. UI displays route, hazards, confidence and trade-offs.
7. User can change constraints and recalculate.

## F. Monitoring
Monitor:
- Data freshness
- API latency
- Forecast error
- Route calculation time
- Model drift
- Missing observations
- Failed ingestion jobs
