# SIH 2026 — Comprehensive Spoken Judge Q&A Defense Guide

**Problem Statement:** SIH26059 — *AI-Enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System*  
**Audience:** Technical Judging Panel (AI/ML, Maritime Navigation, Geospatial/GIS, Backend Systems)  
**Format:** Concise Spoken Answer (20–40s) • Technical Code Detail • Disclosed Limitation  

---

## Part 1: AI / Machine Learning

### Q1: Where exactly is AI used?
- **20–40s Answer:** "AI is used strictly for environmental hazard forecasting, not for geometric pathfinding. Specifically: (1) A Random Forest Regressor predicts 30-day sea-ice concentration changes across the Southern Ocean; (2) A second Random Forest Regressor predicts iceberg drift displacement vectors; and (3) A Regularized Random Forest Classifier identifies sea-ice and iceberg texture from Sentinel-1 SAR and optical satellite bands."
- **Technical Detail:** Implemented in `backend/src/sea_ice/train.py`, `backend/src/iceberg/train.py`, and `backend/src/sentinel/train.py`. Models serialize to `.joblib` artifacts in `backend/models/`.
- **Limitation:** The pathfinding algorithm itself (A*) is a deterministic graph search optimizer, not an AI neural network.

### Q2: Why Random Forest?
- **20–40s Answer:** "Random Forest was chosen because polar observational datasets are sparse, noisy, and subject to cloud obscuration and radar shadow. Tree ensembles do not suffer from gradient explosion, naturally enforce bounded outputs between 0.0 and 1.0 for ice concentration, and execute inference in under 2 milliseconds on standard shipboard CPU hardware."
- **Technical Detail:** `n_estimators=60, max_depth=12, random_state=42`. Bounded with `np.clip(y_pred, 0, 1)`.
- **Limitation:** Random Forests cannot extrapolate beyond the minimum and maximum target bounds seen in historical training data.

### Q3: Why not Deep Learning / Transformers?
- **20–40s Answer:** "Deep learning architectures like ConvLSTM or Vision Transformers require hundreds of thousands of dense, cloud-free images and dedicated GPU hardware. With roughly 28,000 monthly Antarctic grid samples, deep networks severely overfit, hallucinate ice leads over land, and introduce prohibitive inference latency into dynamic route-planning loops."
- **Technical Detail:** Evaluated offline in baseline audits; XGBoost and Random Forest outperformed deep backbones on tabular monthly NetCDF grids with zero GPU dependencies.
- **Limitation:** Deep ConvNets could capture finer spatial textures if high-frequency daily SAR imagery covered the entire continent continuously.

### Q4: What dataset did you use?
- **20–40s Answer:** "For sea ice, we use the authoritative NOAA/NSIDC Climate Data Record Version 4 (G02202). For icebergs, we use the BYU/National Ice Center Antarctic Iceberg Database containing over 95,000 tracked trajectory steps across 180+ named targets. For satellite validation, we ingest calibrated Copernicus Sentinel-1 SAR scenes."
- **Technical Detail:** Files located at `data/raw/sea_ice/real_cdr_series_18m.nc` and `data/raw/iceberg/` in standard NetCDF4 and CSV formats.
- **Limitation:** NOAA CDR NetCDF is monthly; BYU iceberg logs have irregular reporting intervals (12h to 72h).

### Q5: How much data?
- **20–40s Answer:** "The sea-ice model is trained on 28,280 oceanic grid observations across the Southern Ocean. The iceberg model trains on 95,696 trajectory displacement steps. The Sentinel SAR classifier trains on 75,000 pixel patches extracted across 15 polar scenes."
- **Technical Detail:** Recorded in `sea_ice_metrics.json` (19,796 train, 4,242 test) and `iceberg_metrics.json` (66,987 train, 14,355 test).
- **Limitation:** Samples are restricted to latitudes south of -50°S to preserve Antarctic polar relevance.

### Q6: What are your input features?
- **20–40s Answer:** "For sea ice: spatial coordinates (latitude, longitude), seasonal cycles (month, day of year), historical lag concentrations at t, t-1, and t-2, plus a 3-month rolling mean. For icebergs: current coordinates, ground speed, bearing, forecast horizon hours, iceberg major/minor axes, and local ocean current velocities."
- **Technical Detail:** `backend/src/sea_ice/features.py` (lines 35–75) and `backend/src/iceberg/train.py` (lines 27–39).
- **Limitation:** Does not yet ingest atmospheric air temperature as an explicit thermodynamic feature.

### Q7: What is the target variable?
- **20–40s Answer:** "For sea ice, the target is the continuous sea-ice concentration (0.0 to 1.0) at that same grid cell one month ahead. For icebergs, the target is the 2D coordinate displacement vector: delta latitude and delta longitude over the forecast horizon."
- **Technical Detail:** Evaluated with Mean Absolute Error and Root Mean Squared Error against true satellite observations.
- **Limitation:** Multi-step iceberg trajectories accumulate uncertainty over 48 hours (~1.7 km at 24h, growing with sqrt(t)).

### Q8: How did you prevent data leakage?
- **20–40s Answer:** "We strictly enforce chronological splitting rather than random k-fold shuffling. The training set takes the first 70% of chronological time, validation the next 15%, and testing the final 15% unseen future observations. Lag features only look backwards (t, t-1, t-2)."
- **Technical Detail:** `chronological_split()` in `backend/src/sea_ice/train.py:L32` and `backend/src/iceberg/train.py:L46`.
- **Limitation:** Spatial autocorrelation between adjacent grid cells within the same month is partially mitigated by spatial subsampling.

### Q9: What are your model metrics?
- **20–40s Answer:** "On the unseen test set, our sea-ice model achieves an MAE of 0.0401 (4% concentration error), an RMSE of 0.1218, and an R² of 0.8861, beating persistence baseline by 30%. The iceberg model achieves a mean 24-hour position error of 1.70 km and a median error of 0.12 km."
- **Technical Detail:** Verified in `backend/models/sea_ice_metrics.json` and `backend/models/iceberg_metrics.json`.
- **Limitation:** Metrics reflect regional Southern Ocean test sets and do not guarantee zero error during extreme anomalous breakup events.

### Q10: What happens when new data arrives?
- **20–40s Answer:** "New satellite rasters or iceberg positions are ingested into the backend data cache. The offline-trained models generate updated multi-horizon forecast fields (NOW, +6H, +12H, +24H, +48H), which immediately update the spatial KDTree indices used by the routing engine."
- **Technical Detail:** Cached with 10-minute TTL in `data_transformer.py` to prevent redundant computations.
- **Limitation:** Live model retraining does not occur inside the API request thread; retraining is handled via scheduled background jobs.

### Q11: How do you retrain the models?
- **20–40s Answer:** "Retraining is an automated offline batch script. It ingests new monthly NSIDC NetCDF granules or BYU CSV updates, rebuilds the chronological feature matrix, runs regression validation against recent holdout data, and atomically saves the updated `.joblib` model artifact."
- **Technical Detail:** Executed via `python -m src.sea_ice.train` and `python -m src.iceberg.train`.
- **Limitation:** Requires downloading multi-gigabyte NetCDF files from NSIDC/NASA Earthdata servers.

---

## Part 2: Sea-Ice Concentration (SIC)

### Q12: What is SIC?
- **20–40s Answer:** "Sea Ice Concentration is the percentage or fraction of an ocean surface area covered by sea ice. 0.0 represents open ocean water, while 1.0 represents complete, solid consolidated pack ice. IMO Polar Code guidelines classify ice navigation limits based on SIC categories."
- **Technical Detail:** Implemented in `src/optimization/polar_routing_engine.py:L257`.
- **Limitation:** SIC measures surface areal coverage, not ice thickness or floe compressive ridge strength.

### Q13: How is SIC normalized in your system?
- **20–40s Answer:** "Internally across the entire backend—from preprocessing to ML features, risk engine, and A* edge costs—SIC is strictly normalized as a float between 0.0 and 1.0. When displayed to ship navigators in the UI, it is formatted as a human-readable percentage (0% to 100%)."
- **Technical Detail:** Guarded by assertions in `backend/final_system_validation.py`.
- **Limitation:** Conversion to 0–100% is restricted strictly to presentation layers.

### Q14: How does SIC affect route optimization?
- **20–40s Answer:** "SIC applies an exponential quadratic cost multiplier to grid traversal in A*: Penalty = 1.0 + (SIC²) × w_sic × 2.5. In open water (SIC < 15%), the multiplier is 1.0. In heavy pack (SIC > 70%), transit cost escalates dramatically, compelling the engine to route along natural navigable open leads."
- **Technical Detail:** `eval_cell_cost()` in `polar_routing_engine.py:L570`.
- **Limitation:** Grid cell resolution is 50 km; narrow leads under 10 km wide cannot be resolved without tactical ice radar.

### Q15: What happens at >80% SIC?
- **20–40s Answer:** "At concentrations above 80%, the traversal penalty exceeds 15.0 for standard vessels. For lower ice classes (e.g. PC5/PC6), the cell is treated as impassable, forcing a perimeter detour. For heavy icebreakers (PC2), transit is permitted but incurs heavy engine load and low transit speed."
- **Technical Detail:** Controlled by `max_sic_allowed` parameter per Polar Class in `polar_routing_engine.py:L1233`.
- **Limitation:** Vessel speed through 80% pack is modeled via Lindqvist formulas to drop to 3–5 knots.

### Q16: What happens when SIC satellite data is missing?
- **20–40s Answer:** "If a NetCDF granule or spatial cell is missing, the system gracefully falls back to a physics-based latitudinal climatology model and logs a provenance tag of FALLBACK_CLIMATOLOGY. It never silently converts missing data into 0% ice or fake low risk."
- **Technical Detail:** Handled in `polar_routing_engine.py:L270`: `return max(0.0, min(100.0, (-lat - 60.0) * 8.5))`.
- **Limitation:** Climatological fallbacks lack daily lead-opening fidelity and require wider safety margins.

---

## Part 3: Iceberg Forecasting

### Q17: How do you predict iceberg movement?
- **20–40s Answer:** "We use a hybrid hydrodynamic-kinematic plus ML residual approach: 70% ocean surface current drag from Copernicus Marine physics, 30% vessel inertial drift, an empirical Southern Hemisphere Coriolis deflection of -0.10°/hour counter-clockwise, blended with BYU/NIC Random Forest displacement predictions."
- **Technical Detail:** `backend/src/iceberg/trajectory_service.py:L81-L150`.
- **Limitation:** Iceberg keel draft and sail area are approximated from surface dimensions rather than 3D sonar scans.

### Q18: Why combine physics and ML for icebergs?
- **20–40s Answer:** "Pure physics models require exact underwater keel geometry, water column density profiles, and wind drag coefficients that are rarely available in Antarctica. Pure ML models ignore basic oceanographic conservation laws. Blending 75% ocean-coupled kinematics with 25% ML residuals yields physically grounded drift with empirical error correction."
- **Technical Detail:** Blending formula in `trajectory_service.py:L148-L150`.
- **Limitation:** Rapid iceberg calving or roll-over events cannot be predicted in advance.

### Q19: What role do ocean currents play?
- **20–40s Answer:** "Icebergs have deep underwater keels extending 100 to 300 meters into the ocean. Surface and subsurface currents are the dominant physical forcing mechanism driving Antarctic iceberg drift, far exceeding instantaneous wind gusts."
- **Technical Detail:** Queried via `ocean_service.get_current(lat, lon)` using Copernicus Marine zonal (u_o) and meridional (v_o) velocity grids.
- **Limitation:** Ocean current grids have ~9 km horizontal resolution and daily temporal cadence.

### Q20: What is the Coriolis effect doing here?
- **20–40s Answer:** "In the Southern Hemisphere, the Earth's rotation deflects moving bodies to the left of their velocity vector. For drifting Antarctic icebergs, this creates a sustained counter-clockwise turning rate, modeled empirically as -0.10 degrees per hour, deflecting drift offshore into the Antarctic Circumpolar Current."
- **Technical Detail:** Implemented as `coriolis_turn_rate = -0.10` in `trajectory_service.py:L88`.
- **Limitation:** Near-coastal grounding can arrest Coriolis deflection entirely.

### Q21: How accurate is your trajectory model?
- **20–40s Answer:** "On the BYU/NIC benchmark of 180+ tracked Antarctic icebergs, our model achieves a mean position error of 1.70 km at 24 hours, and a median error of 0.12 km. Uncertainty circles scale with the square root of forecast time."
- **Technical Detail:** `backend/models/iceberg_metrics.json` and uncertainty formula in `trajectory_service.py:L161`.
- **Limitation:** Over 72-hour horizons, cumulative drift uncertainty grows to 8–15 km.

### Q22: What happens if a new iceberg suddenly appears?
- **20–40s Answer:** "The navigator or automated radar contact calls `register_dynamic_iceberg()`. The obstacle is instantly injected into the active KDTree spatial index. Closest Point of Approach (CPA) is recalculated, and if the iceberg violates safety margins, dynamic tactical rerouting is triggered immediately."
- **Technical Detail:** `app/data_transformer.py:L401` and `server.py:POST /api/navigation/emergency`.
- **Limitation:** Shipboard marine radar typically detects medium tabular icebergs at 12–18 NM, and bergy bits at 3–5 NM.

---

## Part 4: Polar Routing & Pathfinding

### Q23: Why A*?
- **20–40s Answer:** "A* is mathematically complete and optimal on discrete grids, deterministic, and fully auditable by maritime authorities. Unlike genetic algorithms or neural reinforcement learning, A* will never randomly explore dangerous paths or generate non-reproducible corridors across consecutive queries."
- **Technical Detail:** `_find_polar_astar_path()` in `backend/src/optimization/polar_routing_engine.py:L387`.
- **Limitation:** A* scales with grid cell count; our 50 km mesh balances continental reach with 15–50 ms runtimes.

### Q24: Why EPSG:3031 instead of standard Web Mercator?
- **20–40s Answer:** "Web Mercator (EPSG:3857) has infinite distortion at the poles and cannot map Antarctica. EPSG:3031 is the official Antarctic Polar Stereographic conformal metric projection with true scale at -71°S. It preserves isotropic meter distances and allows uniform 2D metric grid operations across the entire continent."
- **Technical Detail:** PyProj transformers configured in `polar_routing_engine.py:L84-L85`.
- **Limitation:** Distortion increases north of -60°S; routes are projected to EPSG:4326 for Leaflet/MapLibre display.

### Q25: Why not use latitude and longitude directly?
- **20–40s Answer:** "Lines of longitude converge to zero at the South Pole. At -70°S, one degree of longitude is only 38 km wide, compared to 111 km at the equator. Calculating Euclidean distances on raw lat/lon produces severe diagonal distortion and pulls routes across the continental land mass."
- **Technical Detail:** Demonstrated in our Phase 1 coordinate standardization audit.
- **Limitation:** Requires forward and inverse PyProj transforms at input and output boundaries.

### Q26: How does your cost function work?
- **20–40s Answer:** "Cost = Distance × (SIC Penalty) × (Iceberg Penalty) × (Weather/Wave Drag) × (Bathymetry Penalty). Impassable land is assigned infinite cost (float('inf')). Each corridor profile (Fastest, Balanced, Safest) adjusts weight exponents to prioritize transit time, open leads, or maximum clearance margins."
- **Technical Detail:** `eval_cell_cost()` in `polar_routing_engine.py:L523-L582`.
- **Limitation:** Weather weights currently use regional 10m wind speed and significant wave height grids.

### Q27: How does the system avoid land?
- **20–40s Answer:** "We load the official Antarctic Digital Database vector polygon and build a Shapely Prepared Geometry spatial index. In A*, every cell evaluated against the land mask returns infinite cost if it intersects land, making continental crossings mathematically impossible."
- **Technical Detail:** Verified in our red-team suite: 0 of 75 waypoints intersected land across all corridors.
- **Limitation:** Charted coastline accuracy depends on the 1:10M Antarctic Digital Database resolution.

### Q28: How does it avoid icebergs?
- **20–40s Answer:** "Every active and forecasted iceberg position is indexed into an EPSG:3031 metric KDTree. When candidate paths pass within the vessel's safety clearance radius (e.g. 15 km), an exponential Gaussian penalty cost is added: 25.0 × exp(-0.5 × (dist / sigma)²), deflecting the path into open water."
- **Technical Detail:** `get_iceberg_cpa_and_risk()` in `polar_routing_engine.py:L273-L355`.
- **Limitation:** Avoidance guarantees are bounded by the spatial accuracy of the forecasted iceberg track.

### Q29: How do Fastest, Balanced, and Safest corridors differ?
- **20–40s Answer:** "They represent calibrated multi-objective operational profiles: Fastest takes the most direct navigable route, tolerating higher ice resistance (e.g. 690 km, 91% SIC, 54.9h ETA). Safest detours into verified open leads (706 km, 21% SIC, 31.0h ETA, cutting ice exposure by 70%). Balanced optimizes transit speed against fuel burn."
- **Technical Detail:** Profile weight dictionaries defined in `polar_routing_engine.py:L1190-L1235`.
- **Limitation:** Generated via distinct objective weight vectors rather than continuous Pareto frontier sampling.

### Q30: Is this actually Pareto optimization?
- **20–40s Answer:** "To be completely transparent: this is a weighted multi-objective optimization generating three discrete operational corridors (Fastest, Balanced, Safest) using distinct cost weight vectors. We do not compute a continuous mathematical Pareto frontier, and we strictly avoid claiming 'Pareto optimal' in our documentation."
- **Technical Detail:** Standardized in Phase 5 terminology audit across backend and frontend.
- **Limitation:** Navigators choose between 3 discrete operational corridors rather than an infinite tradeoff curve.

---

## Part 5: Maritime & Operational Realism

### Q31: What is AIS?
- **20–40s Answer:** "Automatic Identification System is an automated VHF transponder system mandated by the IMO for collision avoidance, broadcasting vessel position, speed over ground, course over ground, and navigational status."
- **Technical Detail:** Integrated via `backend/services/ais_service.py`.
- **Limitation:** Standard VHF AIS has a line-of-sight range of ~20 nautical miles.

### Q32: Is your AIS feed live?
- **20–40s Answer:** "Our system connects to the Open Waters AIS API to query live sub-polar vessel traffic where reachable. However, in high-latitude Antarctic pack ice, terrestrial AIS coverage is virtually absent. For expedition vessels in pack ice, we run deterministic COMNAP voyage simulations with explicit UI badging."
- **Technical Detail:** Clear separation between `LIVE AIS` and `SIMULATED VOYAGE` tags.
- **Limitation:** Live commercial satellite AIS feeds require expensive paid subscriptions (Spire/MarineTraffic).

### Q33: What happens in Antarctic pack ice where AIS is unavailable?
- **20–40s Answer:** "When live terrestrial AIS is unreachable, our backend automatically switches to deterministic mission simulation based on official COMNAP station routes and displays a clear 'SIMULATED VOYAGE' badge. We never fake live transponder pings."
- **Technical Detail:** Handled in `ais_service.py:L317-L338`.
- **Limitation:** Real vessels in pack ice communicate via Iridium satellite telemetry every 1–4 hours.

### Q34: How do you estimate fuel consumption?
- **20–40s Answer:** "We use established naval architecture formulas: the Admiralty cubic propeller law for calm-water power (displacement^(2/3) × speed³), combined with Lindqvist and Riska empirical ice-breaking resistance scaled by Polar Class (PC1–PC7), wind drag, and wave height, multiplied by standard marine diesel SFOC (185 g/kWh)."
- **Technical Detail:** `compute_segment_fuel()` in `backend/src/optimization/fuel_model.py:L39-L95`.
- **Limitation:** It is an engineering estimate, not calibrated onboard dynamometer telemetry.

### Q35: Can your system guarantee safety?
- **20–40s Answer:** "No navigation system can mathematically guarantee 100% safety in Antarctica due to submerged growlers, sudden blizzard whiteouts, and dynamic pressure ridges. Our system provides 'lower modeled risk' and 'decision support'. Operational command authority remains strictly with the ship's Master."
- **Technical Detail:** Stated clearly in our architecture documentation and UI disclaimer.
- **Limitation:** We explicitly disclaim '100% safe' or 'collision-proof' claims.

### Q36: Is this ECDIS certified?
- **20–40s Answer:** "No, this is an advanced Decision Support System (DSS) prototype designed to operate alongside ECDIS (Electronic Chart Display and Information System), not replace Type-Approved ECDIS hardware. In commercial operation, routes would be exported as RTZ format into onboard ECDIS."
- **Technical Detail:** Waypoints export to standard GeoJSON and IEC 61174 RTZ schemas.
- **Limitation:** Formal ECDIS certification requires rigorous IEC 61174 and IMO MSC type-approval testing.

---

## Part 6: System Robustness & Architecture

### Q37: What happens if the weather API fails?
- **20–40s Answer:** "The system degrades gracefully: it falls back to regional climatological baseline wind and wave values (15 knots wind, 1.5 m wave height) and records a FALLBACK provenance tag. Route optimization continues without crashing."
- **Technical Detail:** Implemented in `backend/src/data/weather_service.py`.
- **Limitation:** Climatological fallbacks do not capture severe unpredicted katabatic storm fronts.

### Q38: What happens if satellite data is unavailable?
- **20–40s Answer:** "If fresh satellite NetCDF rasters fail to load, the engine falls back to pre-indexed KDTree observational archives and latitudinal climatology gradients. It never reports 0% ice or fabricates false 'Low Risk' corridors."
- **Technical Detail:** `polar_routing_engine.py:L266-L271`.
- **Limitation:** Safety margins must be widened when relying on historical archives.

### Q39: What happens if the requested route is impossible?
- **20–40s Answer:** "If an origin or destination is situated deep within the continental ice sheet with no navigable access, or if coordinates are out of bounds, the API returns a clean failure: HTTP 200, status FAILED_NO_NAVIGABLE_ROUTE with an explainable message, rather than drawing a fake line across land."
- **Technical Detail:** Verified in `test_judge_api_security.py` with starting point (-85°S, 0°E).
- **Limitation:** Snapping searches for coastal water within a 12-cell radius (~360 km); beyond that, route fails cleanly.

### Q40: How fast is route generation?
- **20–40s Answer:** "Because ML models are pre-trained offline and spatial lookups use pre-built KDTree and PreparedGeometry indices, generating all three 700 km polar corridors takes between 15 and 60 milliseconds on a standard CPU."
- **Technical Detail:** Verified across multiple test runs in `backend/final_system_validation.py`.
- **Limitation:** Runtimes scale to ~300 ms for 3,000 km trans-Antarctic circumpolar voyages.

### Q41: Can this scale to real Antarctic vessels?
- **20–40s Answer:** "Yes. The backend has zero GPU requirements, consumes under 150 MB of RAM, and runs entirely in Python/FastAPI. It can be deployed on a ruggedized $500 fanless marine PC onboard an icebreaker, receiving daily compressed NetCDF/GRIB2 update patches via low-bandwidth Iridium satellite links."
- **Technical Detail:** Dependencies limited to `scikit-learn`, `numpy`, `scipy`, `shapely`, `pyproj`, `fastapi`.
- **Limitation:** Requires automated satellite raster compression pipelines on shore.

### Q42: How would you deploy this operationally?
- **20–40s Answer:** "In a dual-tier architecture: Shore-side operations (e.g. NCPOR Goa or AWI Bremerhaven) run continuous high-bandwidth satellite ingestion and model retraining, transmitting daily 50 KB compressed GRIB2/NetCDF packages via satellite. Shipboard nodes run the local PolarRoutingEngine independently of internet connectivity."
- **Technical Detail:** Documented in `SIH_TECHNICAL_ARCHITECTURE.md`.
- **Limitation:** Full operational deployment requires integration with shipboard NMEA navigation sensors.

---

## Part 7: Innovation & Value Proposition

### Q43: What is genuinely innovative here?
- **20–40s Answer:** "Most marine routing tools treat ice as static exclusion polygons. Our system couples dynamic AI/physics hazard forecasts (predicting where sea ice will freeze and where icebergs will drift over 48 hours) directly into an EPSG:3031 metric A* pathfinding engine with IMO POLARIS RIO decision intelligence."
- **Technical Detail:** Multi-horizon time-dependent spatial querying in `polar_routing_engine.py:L306-L355`.
- **Limitation:** Does not yet perform sub-meter structural hull stress finite element modeling.

### Q44: How is this different from Google Maps or commercial marine planners?
- **20–40s Answer:** "Google Maps uses road networks in Web Mercator. Commercial marine planners like SPOS or ECDIS focus on open-ocean Great Circle routes and weather storms, treating Antarctic sea ice as a binary 'no-go' zone. Our system actively navigates dynamic polar sea-ice leads, iceberg CPA cones, and Polar Code ice classes."
- **Technical Detail:** Integrates IMO POLARIS Risk Index Outcome (RIO) compliance directly into corridor evaluation.
- **Limitation:** Commercial systems have 30 years of ECDIS hardware certification; our system is an advisory decision support layer.

### Q45: Why does the vessel operator need this system?
- **20–40s Answer:** "In Antarctica, making the wrong route choice can result in a $150,000,000 research vessel becoming beset in pack ice for months or colliding with a drifting tabular iceberg. Our system gives polar captains clear, explainable decision support balancing transit time, fuel burn, and IMO Polar Code safety margins."
- **Technical Detail:** Provides dominant hazard badges, hazard summaries, and metric tradeoff deltas.
- **Limitation:** The captain retains legal command and must cross-reference onboard radar and visual ice watch.

### Q46: What decision does the system make?
- **20–40s Answer:** "The system generates an explainable Decision Intelligence summary recommending either Balanced, Safest, or Fastest corridors, identifying the dominant hazard (e.g. Heavy Pack Ice or Iceberg Proximity), computing RIO scores, and predicting metric deltas under changing weather."
- **Technical Detail:** Returned in `decision_support` schema on every corridor option.
- **Limitation:** The system provides recommendations; it does not automatically engage autopilot rudder controls.

### Q47: What happens if environmental conditions change?
- **20–40s Answer:** "The operator uses our What-If Decision Analysis tool to stress-test the route: 'What happens if ice concentration surges +15% or icebergs drift 25 km off course?' The system recomputes the corridors and issues an immediate operational advisory (e.g. Maintain Balanced Watch or Divert to Safest Corridor)."
- **Technical Detail:** `POST /api/simulation/what-if` returning comparative baseline vs scenario deltas.
- **Limitation:** Scenarios are evaluated against predefined environmental perturbations.

### Q48: Why is this system useful specifically for Antarctica?
- **20–40s Answer:** "Antarctica is the most isolated, dangerous maritime environment on Earth, with zero salvage tugs, no permanent drydocks, and extreme coordinate distortion. Resupply missions to stations like Bharati and Maitri require specialized polar decision intelligence that standard maritime navigation tools simply do not provide."
- **Technical Detail:** Calibrated specifically for Indian and international Antarctic scientific expedition routes.
- **Limitation:** Focuses on the Southern Ocean south of 60°S latitude.

---

*Verified against active repository codebase `ghildiyalnitin067-a11y/SIH-2026`.*
