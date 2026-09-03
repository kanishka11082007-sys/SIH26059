# Authoritative Data Sources & Provenance Architecture
## Antarctic Sea-Ice, Iceberg Trajectory & Navigation Decision Support System (SIH PS 59)

This document provides a comprehensive technical audit and provenance record for all real-world datasets integrated into the PolarNav Antarctic platform. Every variable, data format, temporal coverage, spatial resolution, provider citation, and consuming backend module is documented below.

---

## 1. System Data Architecture & Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REAL DATA INGESTION                             │
├────────────────────────────────────────────────────────────────────────┤
│  1. NOAA/NSIDC CDR V4 Sea-Ice Concentration (Microwave Satellite)      │
│  2. BYU / National Ice Center (NIC) Antarctic Iceberg Database         │
│  3. ESA Sentinel-1A SAR Level-1 GRD Radar Imagery (15 GeoTIFF Scenes)  │
│  4. E.U. Copernicus Marine Service (MERCATOR GLO12 Surface Currents)   │
│  5. Open-Meteo Antarctic Atmospheric & Marine APIs + ECMWF ERA5        │
│  6. NOAA NGDC ETOPO 2022 Global Relief Bathymetry (1 arc-min)          │
│  7. COMNAP & British Antarctic Survey (BAS) Research Facilities        │
│  8. SCAR / Antarctic Digital Database (ADD) Coastline Land Mask         │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FEATURE EXTRACTION & RISK ENGINES                    │
├────────────────────────────────────────────────────────────────────────┤
│  - pyproj Coordinate Projection (EPSG:4326 <-> EPSG:3031 / EPSG:3412)  │
│  - SciPy Spatial KDTree (O(log N) SIC & CPA queries)                   │
│  - CFAR (Constant False Alarm Rate) Radar Target Detection             │
│  - Kinematic Random Forest 0-48h Iceberg Drift Predictor               │
│  - IMO POLARIS Risk Index Outcome (RIO) Calculator                    │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 POLAR MULTI-OBJECTIVE ROUTING ENGINE                   │
├────────────────────────────────────────────────────────────────────────┤
│  - Transparent Cost Model: Distance + Ice + Iceberg + Weather +        │
│    Current Assistance + Bathymetric Clearance + Fuel Penalty           │
│  - 3 Distinct Corridors: Route A (Direct), Route B (AI Optimal),       │
│    Route C (Safest Ice Margin)                                         │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND & REST APIS                         │
├────────────────────────────────────────────────────────────────────────┤
│  - /api/environment/status (Provenance transparency audit endpoint)    │
│  - /api/routes & /api/routes/{id}/metrics (Transparent cost breakdown) │
│  - /api/sea-ice, /api/ocean-currents, /api/weather, /api/bathymetry    │
│  - /api/sentinel/scenes & /api/sentinel/detections (CFAR radar UI)     │
│  - /api/vessels (Explicit DEMO / AIS provenance tags)                  │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       MAPLIBRE FRONTEND UI                             │
├────────────────────────────────────────────────────────────────────────┤
│  - Interactive Circumpolar Polar Stereographic Map                     │
│  - Live Data Stream Pill with Provenance Audit Modal                   │
│  - Sentinel-1 SAR Radar Detection Inspector Card                       │
│  - Route Optimization Cost Breakdown Table                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dataset Specifications

### Dataset 1: Sea-Ice Concentration (SIC)
* **Dataset Name**: NOAA/NSIDC Climate Data Record of Passive Microwave Sea Ice Concentration, Version 4
* **Dataset ID**: `nsidcG02202v4shmday` / `G02202`
* **Provider / Agency**: National Oceanic and Atmospheric Administration (NOAA) / National Snow and Ice Data Center (NSIDC)
* **Access Protocol**: CoastWatch ERDDAP Griddap
* **Spatial Coverage**: Southern Hemisphere Polar Stereographic grid (EPSG:3412 / EPSG:3031)
* **Spatial Resolution**: 25 km nominal grid spacing
* **Variables Extracted**: `cdr_seaice_conc_monthly` (fraction $0.0$ to $1.0$, converted to percentage $0$–$100\%$)
* **Storage Location**: `antarctic-ai/data/raw/sea_ice/real_cdr_sic.nc`
* **Consuming Modules**:
  - `src/data/real_sic_service.py` (KDTree spatial queries)
  - `src/optimization/polar_routing_engine.py` (Ice resistance calculation)
  - `backend/app/server.py` (`/api/sea-ice`, `/api/environment/status`)
* **Scientific Citation**: Meier, W. N., et al. (2021). NOAA/NSIDC Climate Data Record of Passive Microwave Sea Ice Concentration, Version 4. Boulder, Colorado USA. NSIDC.

---

### Dataset 2: Antarctic Iceberg Tracking Database
* **Dataset Name**: Brigham Young University (BYU) / National Ice Center (NIC) Antarctic Iceberg Database
* **Provider / Agency**: BYU Center for Remote Sensing (MERS) & U.S. National Ice Center (USNIC)
* **Temporal Coverage**: 1978 – Present (180+ authoritative CSV tracking trajectories)
* **Spatial Coverage**: All Antarctic Quadrants (Weddell Sea, Ross Sea, Amery, Bellingshausen/Amundsen)
* **Variables Extracted**: `Iceberg_ID`, `Latitude`, `Longitude`, `Date`, `Length_km`, `Width_km`, `Size_Class`
* **Storage Location**: `antarctic-ai/data/raw/iceberg/consolidated/*.csv`
* **Consuming Modules**:
  - `src/models/iceberg_trajectory_model.joblib` (Random Forest trajectory forecasting)
  - `src/optimization/polar_routing_engine.py` (Closest Point of Approach CPA & collision avoidance)
  - `backend/app/data_transformer.py` (`get_icebergs()`)
* **Scientific Citation**: Budge, J. S., & Long, D. G. (2018). A revised Antarctic iceberg tracking database. *IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing*, 11(7), 2235-2242.

---

### Dataset 3: Synthetic Aperture Radar (SAR) Satellite Imagery
* **Dataset Name**: Copernicus Sentinel-1A C-SAR Level-1 Ground Range Detected (GRD)
* **Provider / Agency**: European Space Agency (ESA) Copernicus Programme
* **Sensor / Mode**: C-band SAR (5.405 GHz), Extra Wide (EW) / Interferometric Wide (IW), HH Polarization
* **Spatial Resolution**: 10 m – 40 m pixel resolution
* **Scenes Available**: 15 calibrated GeoTIFF scenes over Antarctic coastal operational zones
* **Storage Location**: `antarctic-ai/data/raw/sentinel/real_s1_scenes/*.tif`
* **Consuming Modules**:
  - `src/sentinel/train.py` (Radar feature extraction: Lee filter despeckling, mean, variance, GLCM texture)
  - `src/sentinel/predict.py` (Adaptive CFAR detection producing target bounding boxes and peak $\sigma^0$ dB)
  - `backend/app/server.py` (`/api/sentinel/scenes`, `/api/sentinel/detections`)
  - `frontend/src/pages/platform/SeaIcePage.tsx` (Interactive SAR Inspector)

---

### Dataset 4: Ocean Surface Currents
* **Dataset Name**: Copernicus Global Ocean Physics Analysis and Forecast (GLO12)
* **Dataset ID**: `GLOBAL_ANALYSISFORECAST_PHY_001_024`
* **Provider / Agency**: European Union Copernicus Marine Service / Mercator Ocean International
* **Spatial Resolution**: 1/12° (~8 km), 50 vertical depth levels
* **Variables Extracted**:
  - $u_o$: Eastward sea water velocity (m/s)
  - $v_o$: Northward sea water velocity (m/s)
  - Surface current speed ($V = \sqrt{u^2 + v^2}$ in knots)
  - Current flow bearing ($\theta = \text{atan2}(u, v)$ in degrees True)
* **Storage Location**: `antarctic-ai/data/raw/ocean/copernicus_currents_real.nc`
* **Consuming Modules**:
  - `src/data/ocean_service.py` (Vector interpolation and vessel current assistance calculation)
  - `src/optimization/polar_routing_engine.py` (Advective drift and fuel optimization)
  - `backend/app/server.py` (`/api/ocean-currents`, `/api/environment/status`)

---

### Dataset 5: Atmospheric & Marine Swell Telemetry
* **Dataset Name**: Open-Meteo Global Atmospheric & Marine Weather API + ECMWF ERA5 Reanalysis
* **Provider / Agency**: Open-Meteo (DWD ICON / ECMWF models) & European Centre for Medium-Range Weather Forecasts (ECMWF)
* **Variables Extracted**:
  - `temperature_2m` (°C)
  - `wind_speed_10m` (knots & m/s)
  - `wind_direction_10m` (degrees True)
  - `surface_pressure` (hPa)
  - `wave_height` (meters significant wave height)
* **Caching & Fallback Strategy**:
  - Local disk cache (`data/processed/weather_cache.json`) with 6-hour TTL
  - In-memory dictionary memoization for sub-millisecond route evaluations
  - Offline fallback to local ERA5 Reanalysis NetCDF (`antarctic-ai/data/raw/weather/era5_antarctic_real.nc`)
* **Consuming Modules**:
  - `src/data/weather_service.py`
  - `src/optimization/polar_routing_engine.py` (Aerodynamic drag and wave resistance)
  - `backend/app/server.py` (`/api/weather`, `/api/environment/status`)

---

### Dataset 6: Bathymetric Seabed Topography
* **Dataset Name**: NOAA ETOPO 2022 Global Relief Model
* **Provider / Agency**: National Oceanic and Atmospheric Administration (NOAA) National Centers for Environmental Information (NCEI)
* **Access Protocol**: CoastWatch ERDDAP Griddap (`etopo180.nc`)
* **Spatial Coverage**: Antarctic Peninsula and Weddell/Bransfield operational sectors ($60^\circ\text{S} - 75^\circ\text{S}$, $50^\circ\text{W} - 75^\circ\text{W}$)
* **Spatial Resolution**: 1 arc-minute (~1.8 km)
* **Variables Extracted**: `altitude` (positive = meters above sea level; negative = ocean depth in meters)
* **Storage Location**: `antarctic-ai/data/raw/bathymetry/etopo_antarctic.nc`
* **Consuming Modules**:
  - `src/data/bathymetry_service.py` (Depth lookups, shallow water hazard classification $< 20\text{m}$)
  - `src/optimization/polar_routing_engine.py` (Keel clearance penalties)
  - `backend/app/server.py` (`/api/bathymetry`, `/api/environment/status`)

---

### Dataset 7: Antarctic Research Facilities & Ports
* **Dataset Name**: Council of Managers of National Antarctic Programs (COMNAP) Station Directory & British Antarctic Survey (BAS)
* **Provider / Agency**: COMNAP Secretariat & BAS Mapping and Geographic Information Centre (MAGIC)
* **Facilities Documented**: 45 authoritative stations (e.g. Bharati, Maitri, Palmer, McMurdo, Rothera, Halley VI)
* **Variables Extracted**: `id`, `name`, `operator_country`, `latitude`, `longitude`, `elevation_m`, `status_season`, `is_ship_accessible`
* **Storage Location**: `antarctic-ai/data/raw/comnap_antarctic_facilities.json`
* **Consuming Modules**:
  - `src/navigation/facilities_service.py`
  - `backend/app/data_transformer.py` (`get_stations()`)
  - `frontend/src/pages/platform/RouteOptimizationPage.tsx` (Destination selection)

---

### Dataset 8: High-Resolution Antarctic Coastline & Land Mask
* **Dataset Name**: Scientific Committee on Antarctic Research (SCAR) Antarctic Digital Database (ADD) Coastline
* **Provider / Agency**: SCAR / British Antarctic Survey
* **Format**: High-precision GeoJSON MultiPolygon (ice shelf front and grounding line)
* **Storage Location**: `antarctic-ai/data/raw/antarctica_land_mask.geojson`
* **Consuming Modules**:
  - `src/optimization/polar_routing_engine.py` (Shapely `Point.within()` collision rejection)
  - `frontend/src/components/map/PolarMap.tsx` (Vector land boundary rendering)

---

### Dataset 9: Active Polar Research Vessel Fleet (AIS)
* **Operating Modes**:
  1. **Deterministic Demo Simulation Mode** (`source: "demo"`):
     - 8 canonical polar vessels (e.g., R/V Sagar Nidhi, R/V Nathaniel B. Palmer, R/V Polarstern, R/V Sir David Attenborough, R/V S.A. Agulhas II).
     - Deterministic coordinates, headings, Polar Classes (PC3, PC5), and destinations.
     - Provenance is explicitly labeled as `DEMO` across all APIs and UI badges.
  2. **Live AIS Mode** (`source: "ais"`):
     - Activated when an external AIS provider key (such as OpenWaters) is supplied in environment variables.

---

## 3. Multi-Corridor Transparent Cost Function

The route optimization engine does not use black-box synthetic numbers. Every corridor evaluates cost via:

$$\text{Total Cost} = \sum_{k} w_k \cdot C_k$$

Where the default weights defined in `polar_routing_engine.py` are:

```python
ROUTING_WEIGHTS = {
    "distance": 1.0,      # Geodesic segment length
    "sea_ice": 2.5,       # NOAA/NSIDC CDR satellite concentration
    "iceberg": 3.5,       # Closest Point of Approach (CPA) from 0-48h forecasts
    "weather": 1.2,       # Open-Meteo wind speed + wave height drag
    "current": 1.0,       # Copernicus Marine surface current assist/drag
    "bathymetry": 4.0,    # NOAA ETOPO keel clearance penalty
    "fuel": 1.5,          # MT fuel consumption based on ice resistance
}
```

Every corridor returned by `/api/routes` exposes this breakdown explicitly:
- `distance_cost`
- `ice_cost`
- `iceberg_cost`
- `current_cost`
- `weather_cost`
- `bathymetry_cost`
- `fuel_cost`
- `total_cost`

---

## 4. Verification and Audit Compliance

Run the automated integration test script to verify live connectivity and data integrity:

```bash
python tests/test_real_pipeline.py
```

All 8 real data subsystems pass validation with zero synthetic fallbacks.
