# PolarNav — Antarctic Polar Navigation & Routing Engine

## 1. The Polar Stereographic A* Mesh
Standard lat/lon equirectangular grids break down near the South Pole due to extreme meridian convergence and antimeridian wrap discontinuities. 

PolarNav solves this by projecting the Southern Ocean into **EPSG:3031 (Antarctic Polar Stereographic)**:
- **Grid Mesh**: 50 km resolution isotropic Cartesian grid spanning the operating envelope.
- **Search Algorithm**: Discrete 2D A* Pathfinding with Euclidean heuristic and 8-directional neighbor exploration.

## 2. Navigability & Cost Surface Formulation
Every cell $(x, y)$ evaluates a composite environmental penalty:
$$\text{Cost}(x, y) = \text{StepDist} \times \left[ 1.0 + \left(\frac{\text{SIC}}{100}\right)^2 \times w_{\text{sic}} + \text{Penalty}_{\text{iceberg}} + \text{Penalty}_{\text{current}} + \text{Penalty}_{\text{weather}} + \text{Penalty}_{\text{bathy}} \right]$$

- **Land as Hard Obstacle**: Continental Antarctica and ice shelves are indexed via `shapely.prepared.prep(land_multipolygon)`. Point-in-polygon queries complete in $0.01\text{ ms}$. If a cell or shortcut intersects land, cost is $\infty$, making land collisions mathematically impossible.
- **Seaward Snap**: Coastal moorings and stations on nearshore boundaries are snapped radially outward from $(0, 0)$ away from the South Pole into open navigable water.

## 3. Antimeridian Handling ($\pm 180^\circ$ Continuity)
When a voyage passes between the Western and Eastern Hemispheres (e.g. McMurdo Sound at $166^\circ\text{E}$ to the Antarctic Peninsula at $68^\circ\text{W}$ across the Ross Sea):
1. Internally, pathfinding operates in continuous $(x, y)$ space in EPSG:3031 where the antimeridian is just a normal Cartesian line without discontinuities.
2. At the API rendering boundary, `split_antimeridian_segments` detects longitude delta exceeding $180^\circ$, calculates the exact fractional latitude at the seam, and splits the path into clean `MultiLineString` segments (`multi_path`).
3. This completely prevents horizontal lines from cutting across the globe in MapLibre.

## 4. Multi-Objective Corridor Profiles
The engine computes three distinct routes:
1. **Route B — Optimal / Fastest Arrival (Balanced)**: Pareto-optimal corridor using open leads to minimize total clock transit time with safe iceberg clearance and optimal fuel burn.
2. **Route C — Safest Ice Margin**: Maximum safety buffer skirting the Marginal Ice Zone, lowest ice exposure, and highest POLARIS RIO score.
3. **Route A — Direct Baseline (Ice-Constrained)**: Geometrically shortest track through pack ice, serving as a realistic comparative baseline demonstrating why direct routes are often slower due to ice resistance.
