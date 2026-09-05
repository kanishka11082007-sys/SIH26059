# SIH Technical Architecture: AI-Enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System

**Project:** SIH 2026 (Problem Statement: SIH26059)  
**System Name:** PolarNav Antarctic Decision Support System  
**Canonical Architecture Version:** Phase 3 Hardened  

---

## 1. Executive System Architecture

```
                                 DATA INGESTION
      ┌─────────────────────────────────┬─────────────────────────────────┐
      ↓                                 ↓                                 ↓
 NOAA/NSIDC CDR V4             BYU/NIC Iceberg Database          Copernicus Marine + ERA5
 (Passive Microwave)          (Radar Tracking 1976–2024)       (Ocean uo/vo + Surface Wind)
      │                                 │                                 │
      ▼                                 ▼                                 ▼
PREPROCESSING (KDTree/CRS)      PREPROCESSING (Physics Drift)      PREPROCESSING (Spatial Interp)
  EPSG:3412 → WGS84               EKMAN / Coriolis Coupling         1/12° Grid + 10m Wind Fields
      │                                 │                                 │
      ▼                                 ▼                                 ▼
 SEA-ICE ML MODEL             ICEBERG TRAJECTORY ML/PHYSICS          ENVIRONMENTAL RISK
 (RandomForest Regressor)      (Kinematic ML + Current Coupled)    (Multi-Layer Cost Matrix)
  Inputs: Spatiotemporal Lags   Inputs: Velocity, Keel, Coriolis    SIC, CPA, Weather, SFOC
      │                                 │                                 │
      └─────────────────────────────────┼─────────────────────────────────┘
                                        ↓
                         CANONICAL ROUTING ENGINE
                         (PolarRoutingEngine)
                 Circumpolar Geodesic A* in EPSG:3031
                 Multi-Objective Pareto Candidate Corridors:
                 • Route A: Direct / Fastest (Ice-Constrained)
                 • Route B: Optimal / Balanced AI Lead Navigation
                 • Route C: Safest / Marginal Ice Zone Clearance
                                        ↓
                       DECISION INTELLIGENCE LAYER
                 • Dominant Hazard Identification
                 • IMO POLARIS RIO Regulatory Verification
                 • Fuel Oil Consumption (SFOC Admiralty Model)
                 • What-If Scenario Stress Testing
                                        ↓
                       OPERATIONAL UI (MapLibre / deck.gl)
                 NOW / +6H / +12H / +24H / +48H Horizon States
```

---

## 2. Dataset Pipeline & Provenance Matrix

| Dataset Name | Source / Provider | Parameters & Coverage | Resolution | System Role | Operational Provenance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NOAA/NSIDC CDR V4** | National Snow & Ice Data Center (G02202) | Sea-Ice Concentration (SIC, 0.0–1.0) Circumpolar Antarctica | 25 km grid (subsampled factor 3 in KDTree) | Real ground-truth ice concentrations & ML feature training | **OBSERVED** (Microwave Radiometer SSMIS/AMSR2) |
| **BYU/NIC Iceberg Database** | Brigham Young University / National Ice Center | 180+ Tracked Iceberg Coordinates, Velocity, Dimensions | 1976–present Antarctic tabular tracks | Iceberg trajectory model training & active radar target registry | **OBSERVED** (Scatterometer / SAR) |
| **Copernicus Marine (GLO12)** | CMEMS GLOBAL_ANALYSISFORECAST_PHY_001_024 | Surface Ocean Currents ($u_o, v_o$ velocities in m/s) | 0.083° (1/12°) daily analysis | Iceberg hydrodynamic drift coupling (70% current coupled) | **MODEL FORECAST** (Numerical Ocean Circulation) |
| **ECMWF ERA5 / Open-Meteo** | European Centre for Medium-Range Weather Forecasts | 10m Wind speed, direction, 2m temp, surface pressure | 0.25° reanalysis / forecast | Aerodynamic drag & wind stress in A* routing and fuel model | **MODEL FORECAST** (Atmospheric Physics) |
| **NOAA NGDC ETOPO 2022** | NOAA National Geophysical Data Center | Seabed Bathymetry / Relief (meters below sea level) | 1 arc-minute global grid | Grounding avoidance & shallow water draft penalties ($< 20\text{m}$) | **OBSERVED** (Bathymetric Survey) |
| **Sentinel-1A SAR EW/IW** | European Space Agency (ESA) Copernicus | Calibrated $\sigma^0$ radar backscatter (HH polarization) | 10–20m pixel resolution | Real-time CFAR target detection & ice/water segmentation | **OBSERVED** (Synthetic Aperture Radar) |
| **Polar Fleet AIS** | Real AIS / COMNAP Expedition Registry | Vessel GPS, MMSI, SOG, COG, Polar Class, destination | Real-time / Deterministic expedition schedules | Vessel tracking & navigation mission assignment | **LIVE AIS** or **SIMULATED VOYAGE** |

---

## 3. AI / Machine Learning Models

### A. Sea-Ice Concentration (SIC) Spatiotemporal Predictor
- **Architecture:** `RandomForestRegressor` (Scikit-Learn, serialized to `models/sea_ice_model.joblib`).
- **Feature Inputs:** `lat`, `lon`, `month`, `day_of_year`, `sic_lag_1`, `sic_lag_2`, `sic_lag_3`, `sic_mean_3month`.
- **Target:** Sea Ice Concentration ($0.0 \to 1.0$ normalized scale).
- **Evaluation Metrics (Held-out Test Set):**
  - Samples Total: 28,280 | Training Samples: 19,796 | Test Samples: 4,242
  - Baseline MAE: 0.0575
  - **Test MAE:** 0.0401 (4.01% error margin)
  - **Test RMSE:** 0.1218
  - **Test $R^2$:** 0.8861
- **Operational Usage:** Offline trained; pre-computes monthly/daily forward spatial fields and feeds into `PolarRoutingEngine` static KDTree.

### B. Iceberg Kinematic Drift Predictor
- **Architecture:** Composite Hydrodynamic Kinematic Coupler + `RandomForestRegressor` (`models/iceberg_trajectory_model.joblib`).
- **Feature Inputs:** `latitude`, `longitude`, `speed_kmh`, `bearing_deg`, `dt_hours`, `major_axis_km`, `minor_axis_km`, `month`, `day_of_year`.
- **Target:** Displacement vector $(\Delta \text{lat}, \Delta \text{lon})$.
- **Hydrodynamic Physics Coupling:**
  - $v_x = 0.70 \cdot v_{\text{ocean}, x} + 0.30 \cdot v_{\text{inertial}, x}$
  - $v_y = 0.70 \cdot v_{\text{ocean}, y} + 0.30 \cdot v_{\text{inertial}, y}$
  - Southern Hemisphere Coriolis Deflection: $-0.10^\circ/\text{hour}$ counter-clockwise turn rate.
- **Evaluation Metrics:**
  - Historical Trajectory Steps: 95,696
  - **Mean Position Error:** $1.70\text{ km}$ at 24h
  - **Median Position Error:** $0.12\text{ km}$
  - Test MAE Lat: $0.0023^\circ$, Test MAE Lon: $0.0602^\circ$
- **Operational Usage:** Generates 5 discrete forecast milestones (`NOW`, `+6H`, `+12H`, `+24H`, `+48H`) for all 85 tracked targets.

### C. Sentinel-1 SAR Classifier & Target Detector
- **Architecture:** `RegularizedRandomForestClassifier` (`models/sentinel_sar_detector.joblib`).
- **Features:** $\sigma^0_{\text{dB}}$, filtered $\sigma^0$, local mean, local std, gradient magnitude, CFAR ratio, NDSI.
- **Classes:** 0: Open Water, 1: Marginal Ice Zone, 2: Close Pack Ice, 3: Iceberg Target / Multi-Year.
- **Validation:** Spatial GroupKFold across unseen radar scenes.
- **Test Accuracy:** 98.47% | **Weighted F1 Score:** 0.9848.

---

## 4. Routing Engine & Multi-Objective Evaluation

### Canonical Engine: `PolarRoutingEngine`
- **Internal Coordinate Reference System:** `EPSG:3031` (Antarctic Polar Stereographic, conformal metric projection).
- **Search Algorithm:** Time-dependent Circumpolar Geodesic $A^*$.
- **Heuristic:** Circumpolar-aware geodesic distance preventing path collapse into the continental interior.
- **Multi-Factor Cell Cost Formula:**
  $$\text{Cost} = \text{Distance} \cdot \left[ 1.0 + \left(\frac{\text{SIC}}{100}\right)^2 \cdot w_{\text{sic}} \cdot 2.5 \right] \cdot \text{Penalty}_{\text{iceberg}} \cdot \text{Penalty}_{\text{bathy}} \cdot \text{Penalty}_{\text{weather}}$$
- **Generated Corridors:**
  1. **Route B (Optimal / Balanced):** Navigates open leads; balances ETA, fuel burn, and iceberg CPA clearance.
  2. **Route C (Safest):** Maximizes margin around the Marginal Ice Zone perimeter; minimizes hull stress and eliminates besetting risk.
  3. **Route A (Fastest / Direct):** Direct geodesic ice track for icebreakers, with higher ice drag and engine fuel load.

---

## 5. Decision Support Layer

Every route output contains a structured `decision_support` payload:
```json
{
  "route_profile": "BALANCED",
  "risk_level": "MODERATE",
  "risk_score": 92,
  "eta": "32h 05m",
  "distance": "1,965 km",
  "distance_km": 1965,
  "fuel_estimate": "47 MT",
  "dominant_hazard": "NOMINAL_OPEN_LEAD",
  "hazard_summary": "Navigating verified open water / low-concentration lead with favorable passage safety.",
  "recommendation": "Balanced corridor recommended for optimal risk-time tradeoff along navigable open leads.",
  "is_recommended": true,
  "provenance": "DETERMINISTIC_POLAR_ROUTING_ENGINE"
}
```

### IMO POLARIS Regulatory Assessment
- Computes Risk Index Outcome (RIO) according to IMO Polar Code guidelines based on vessel Polar Class (PC1–PC7) and local Sea Ice Concentrations.
- Values $\ge 0.0$ indicate safe operational authorization; values $< 0.0$ require convoy escort or evasion.

### What-If Decision Intelligence (`POST /api/simulation/what-if`)
- Compares baseline optimal routing against stressed environmental scenarios (e.g. $+15\%$ SIC surge, $+25\text{ km}$ iceberg drift).
- Returns concrete deltas ($\Delta\text{distance}$, $\Delta\text{ETA}$, $\Delta\text{fuel}$, $\Delta\text{RIO}$) and automated decision recommendation (`DIVERT_TO_SAFEST` vs `MAINTAIN_BALANCED_WATCH`).

---

## 6. Truthful System Limitations for SIH Presentation

1. **Non-Continuous Iceberg Resolution:** Iceberg forecasts are evaluated at discrete operational horizons (`NOW`, `+6H`, `+12H`, `+24H`, `+48H`) rather than continuous millisecond physics loops.
2. **Offline Trained ML Models:** Neural networks and Random Forests are trained offline on historical satellite data and loaded into memory for zero-latency inference ($<50\text{ms}$). Retraining is not executed per HTTP request.
3. **LIVE AIS Vessels Lack Predictive Pathing:** Real AIS vessels are displayed strictly at their latest verified broadcast coordinate. To maintain absolute data integrity, future paths are never fabricated for live targets.
4. **Weighted Multi-Objective Optimization:** The routing engine computes Pareto candidate corridors across distinct weighting profiles (Fastest, Balanced, Safest) rather than generating an infinite continuous Pareto frontier curve.
