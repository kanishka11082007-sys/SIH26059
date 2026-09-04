# PolarNav — Datasets, Coordinate Systems & Coverage

## 1. Authoritative Datasets
All data consumed by the PolarNav backend originates from validated scientific agencies without synthetic fabrication:

| Dataset Name | Source Agency | Resolution / Spatial Coverage | Format & CRS | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Antarctic Coastline & Ice Shelves** | Natural Earth 1:10m / SCAR ADD | Circumpolar South of 60°S | GeoJSON Polygon / WGS84 | Hard boundary land collision detection via `shapely.prepared` |
| **AMSR2 Sea Ice Concentration** | JAXA / Bremen / NSIDC | 6.25 km Circumpolar Grid | GeoTIFF / NetCDF / JSON Grid | Real SIC penalty surfaces & RIO ice classification |
| **Antarctic Iceberg Database** | US National Ice Center (USNIC) & BYU | Named giants (A23a, B15, D30) + calved clusters | GeoJSON Points with velocity vectors | Dynamic CPA calculations & exclusion zones |
| **NOAA ETOPO 2022** | NOAA NCEI | 15 arc-second Global Relief | GeoTIFF / KDTree depth cache | Under-keel clearance & shallow shoaling warnings |
| **Copernicus Marine Currents** | CMEMS (Global Ocean Physics) | 0.083° Southern Ocean | NetCDF / Vector components | Current assistance drift & fuel optimization |
| **Open-Meteo / ERA5 Marine Weather** | ECMWF / Open-Meteo | Hourly 0.1° Antarctic waters | REST API / Cached timesteps | Wind speed (knots) and significant wave height (m) |

## 2. Coordinate Systems & Transformations
- **EPSG:4326 (WGS 84)**: Standard geographic latitude and longitude used at API interfaces, GeoJSON generation, and frontend MapLibre layer rendering.
- **EPSG:3031 (WGS 84 / Antarctic Polar Stereographic)**: Conformal stereographic projection centered on the South Pole (-90°S, 0°E). Used exclusively for internal navigation mesh generation, spatial distance calculations, discrete 2D A* search, and obstacle avoidance.
- **Transformations**: Conducted symmetrically using `pyproj.Transformer.from_crs("EPSG:4326", "EPSG:3031", always_xy=True)` and `Transformer.from_crs("EPSG:3031", "EPSG:4326", always_xy=True)`.

## 3. Data Integrity Principles
- **No Scientific Fabrication**: Unknown values default to conservative maritime warnings rather than randomized synthetic numbers.
- **Labeling**: Data status clearly distinguishes between `OBSERVED`, `FORECAST`, `PREDICTED`, `SIMULATED`, and `DEMO`. Real research vessels and demonstration voyages are explicitly flagged.
