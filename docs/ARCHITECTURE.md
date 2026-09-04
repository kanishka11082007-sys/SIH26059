# PolarNav — System Architecture & Data Flow

## 1. Executive Overview
PolarNav (SIH PS 26059) is an operational, AI-enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System designed for polar research and resupply vessels transiting the Southern Ocean.

## 2. High-Level Architecture Diagram
```
                     +---------------------------------------+
                     |           Vercel Frontend             |
                     |  (React 18 + Vite + Tailwind + Lucide)|
                     +---------------------------------------+
                                        |
               +------------------------+------------------------+
               |                                                 |
      [State Synchronization]                           [MapLibre / deck.gl]
    - FleetContext (Mission Hub)                       - EPSG:3031 Polar Viewport
    - Unified missionId, vesselId, destId              - MultiLineString Antimeridian Paths
    - Emergency Diversion & What-If                    - Dynamic Iceberg CPA Circles
               |                                                 |
               +------------------------+------------------------+
                                        | HTTP REST / JSON
                                        v
                     +---------------------------------------+
                     |            Render Backend             |
                     |       (FastAPI + Python 3.11)         |
                     +---------------------------------------+
                                        |
        +-------------------------------+-------------------------------+
        |                               |                               |
 [Data & Geometry Services]    [Polar A* Routing Engine]      [AI Copilot Layer]
 - Natural Earth Coastlines     - Discrete 2D 50km Mesh        - Gemini Flash Lite
 - shapely.prepared Land Mask   - Antarctic Polar Stereo       - Grounded Prompting
 - NOAA ETOPO Bathymetry          (EPSG:3031)                  - Deterministic Fallback
 - Copernicus Ocean Currents    - Hard Continental Avoidance   - Zero Key Leakage
 - Real SIC & Iceberg Drift     - IMO POLARIS RIO Scoring
```

## 3. Core Modules & Single Source of Truth
- **`FleetContext.tsx`**: Authoritative frontend state storing `selectedVessel`, `selectedDestination`, `activeRoute`, `whatIfScenario`, `emergencyRerouteActive`, and `missionType`.
- **`polar_routing_engine.py`**: Authoritative pathfinding module calculating discrete 2D A* routes on EPSG:3031 stereographic coordinates, line-of-sight shortcutting string pulling, and antimeridian split segments.
- **`server.py`**: AUTHORITATIVE FastAPI layer serving `/api/routes`, `/api/simulation/what-if`, `/api/navigation/emergency`, `/api/copilot`, and telemetry grids.
- **`copilot_service.py`**: Low-latency maritime explanation layer using `gemini-flash-lite-latest` with strict JSON-grounded explainability.
