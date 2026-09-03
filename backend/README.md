# Antarctic AI - Phase 1 + Phase 2 + Phase 3 + Phase 4

## SIH PS 59 - Antarctic Sea-Ice Navigation Decision Support System

### Overview

AI-Enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System for research vessels operating in Antarctic waters.

### Phases Completed

**Phase 1: Data Foundation**
- Real NSIDC G02135 data (extent/area, 1978-2026)
- Antarctic base map
- Python data pipeline (download, load, validate, preprocess)

**Phase 2: Sea-Ice Concentration Forecasting**
- Spatial SIC data (monthly, 30x60 grid)
- Random Forest + XGBoost models
- 1-month ahead forecasting
- Navigation risk layer
- Forecast visualization

**Phase 3: Iceberg Trajectory Prediction**
- Real BYU/NIC iceberg tracking data (180 icebergs, 101K+ observations)
- Track construction with velocity/bearing
- Random Forest trajectory prediction
- Multi-step future trajectory generation
- Antarctic iceberg trajectory map

**Phase 4: Dynamic Navigation Risk Engine**
- Common spatial grid alignment (30x60 Antarctic)
- Sea-ice risk layer (SIC-based monotonic transformation)
- Iceberg risk layer (haversine distance + trajectory corridor)
- Weather/Ocean/Bathymetry risk layers (documented as unavailable in MVP)
- Configurable weighted risk combination
- Risk classification (LOW/MODERATE/HIGH/VERY_HIGH)
- Location risk query with explainability
- Antarctic navigation risk map

### Datasets

**Phase 1 (G02135):**
- Sea-Ice Extent and Area (aggregate scalars, million km^2)
- Source: https://noaadata.apps.nsidc.org/NOAA/G02135/
- Coverage: 1978-2026
- NOT spatial Sea-Ice Concentration

**Phase 2 (Synthetic MVP):**
- Spatial SIC fraction (0-1)
- Based on NSIDC seasonal patterns
- Replace with real CDR G02202 for production

**Phase 3 (BYU/NIC):**
- Iceberg positions (lat, lon, date)
- Source: https://www.scp.byu.edu/iceberg/
- 522 iceberg tracks available

### Quick Start

```
pip install -r requirements.txt
python src/data/download.py
pytest tests/ -v
jupyter notebook notebooks/phase2_sea_ice_ml.ipynb
jupyter notebook notebooks/phase3_iceberg_trajectory.ipynb
```

### Project Structure

```
antarctic-ai/
  configs/risk_config.json       Risk weights and thresholds
  data/raw/sea_ice/              NSIDC CSVs + spatial SIC NetCDF
  data/raw/iceberg/              BYU/NIC iceberg tracking CSVs
  data/processed/                Processed data + risk grid + maps
  notebooks/                     Phase 1, 2, 3 notebooks
  src/data/                      Data pipeline (download, load, validate, preprocess, geo)
  src/sea_ice/                   ML pipeline (features, train, predict, evaluate)
  src/iceberg/                   Iceberg pipeline (load, tracks, train, predict)
  src/risk/                      Risk engine (grid, layers, engine, query, visualize)
  models/                        Trained model artifacts
  tests/                         78 automated tests
```

### Risk Engine (Phase 4)

**Architecture:**
```
Phase 2 SIC forecast  -->  Sea-ice risk layer
Phase 3 iceberg pred  -->  Iceberg risk layer (+ trajectory corridor)
Weather data          -->  Weather risk layer (optional)
Ocean current data    -->  Ocean risk layer (optional)
Bathymetry data       -->  Bathymetry risk layer (optional)
                    |
                    v
          Weighted Combination
          (configurable weights)
                    |
                    v
           Total Risk Grid (0-1)
                    |
                    v
         Risk Classification
         LOW | MODERATE | HIGH | VERY HIGH
```

**Default Weights:**
- Sea-ice: 0.35
- Iceberg: 0.30
- Weather: 0.15 (unavailable in MVP)
- Ocean: 0.10 (unavailable in MVP)
- Bathymetry: 0.10 (unavailable in MVP)

**Risk Classes:**
- LOW: 0.00 - 0.25
- MODERATE: 0.25 - 0.50
- HIGH: 0.50 - 0.75
- VERY HIGH: 0.75 - 1.00

All thresholds are PROTOTYPE for SIH demonstration. NOT official maritime safety standards.

### Model Performance

**Sea-Ice Forecasting (Phase 2):**
- Baseline MAE: 0.177
- Random Forest MAE: 0.024 (7x better)
- R2: 0.97

**Iceberg Trajectory (Phase 3):**
- Median position error: ~0.6 km
- Model: RandomForestRegressor

### Testing

```
pytest tests/test_phase1.py -v          # 22 tests
pytest tests/test_phase2_sea_ice.py -v  # 18 tests
pytest tests/test_phase3_iceberg.py -v  # 13 tests
pytest tests/test_phase4_risk.py -v     # 25 tests
pytest tests/ -v                        # 78 tests total
```

### Known Limitations

- G02135 provides extent/area, not gridded SIC
- Phase 2 uses synthetic spatial SIC (replace with CDR G02202 for production)
- Cartopy not installed (requires MSVC build tools on Windows)
- Weather, ocean current, bathymetry data not integrated in MVP
- Risk thresholds are prototype values, not official maritime standards
- Iceberg trajectory model is baseline RF (LSTM/Transformer optional for future)
