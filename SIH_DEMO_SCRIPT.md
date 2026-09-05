# SIH 2026 — Official 3-Minute Live Demonstration Script

**Problem Statement:** SIH26059 — *AI-Enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System*  
**Vessel:** *R/V Sagar Nidhi* (India / NCPOR • Polar Class PC5)  
**Passage:** Southern Ocean Approach $\longrightarrow$ Bharati Research Station (Larsemann Hills, East Antarctica)  
**Total Running Time:** 3 minutes (180 seconds)  

---

### Phase 1: The Polar Problem (00:00 – 00:20)
**UI State:** Navigate to **Overview Page** (`/`). Antarctic circumpolar map is centered.  
**Action:** Point to the Antarctic landmass and surrounding white/cyan sea-ice field.  

> **Spoken Script (Presenter):**  
> "Good morning, respected judges. Navigating the Southern Ocean to supply India's Antarctic research stations—Bharati and Maitri—is one of the most hazardous maritime operations in the world. Research vessels like the *R/V Sagar Nidhi* face shifting pack ice, drifting multi-billion-ton tabular icebergs, and zero local salvage infrastructure. Traditional marine routing systems treat ice as a static boundary. Today, we present an **AI-Enabled Antarctic Navigation Decision Support System** that couples multi-horizon satellite AI forecasting with metric polar pathfinding and IMO Polar Code compliance."

---

### Phase 2: Ingestion, Provenance & AI Models (00:20 – 00:50)
**UI State:** Click **Sea Ice Page** (`/sea-ice`), then point to the data badge.  
**Action:** Toggle between the Satellite SIC overlay and the Station directory.  

> **Spoken Script (Presenter):**  
> "Our pipeline ingests six authoritative data streams: NOAA/NSIDC Climate Data Records, BYU/NIC tracked iceberg positions, Copernicus Marine surface currents and wave states, GEBCO polar bathymetry, and COMNAP station coordinates.  
> 
> Notice our provenance discipline: we distinguish between **LIVE AIS** and **SIMULATED VOYAGES**, because terrestrial AIS does not reach polar pack ice.  
> 
> Rather than using black-box deep learning that overfits on sparse data, we employ two specialized Random Forest models: one forecasting monthly sea-ice concentration changes with an MAE of 0.04 and R² of 0.88, and a second predicting iceberg displacement vectors with a 24-hour mean position error of just 1.7 kilometers."

---

### Phase 3: Forecast Horizons in Action (00:50 – 01:20)
**UI State:** Click **Iceberg Tracking Page** (`/icebergs`).  
**Action:** Click the horizon pill buttons in the header: click **NOW**, then click **+24H**, then click **+48H**.  

> **Spoken Script (Presenter):**  
> "Polar voyages take days, not minutes. A route safe today can freeze over tomorrow.  
> 
> Watch as we switch our forecast horizon from **NOW** to **+24H** and **+48H**. Notice there is **no play button and no animation clock**—these are discrete, deterministic operational forecast horizons.  
> 
> As we step forward in time, the icebergs drift under 70% ocean current drag and Southern Hemisphere Coriolis deflection, while our sea-ice model advances the pack ice concentration. The system plans against the future state of the ocean, not yesterday's snapshot."

---

### Phase 4: PolarRoutingEngine & Corridor Profiles (01:20 – 02:00)
**UI State:** Navigate to **Navigation Page** (`/navigation`).  
**Action:** Select vessel **R/V Sagar Nidhi**, destination **Bharati Station**. Click the three route tabs: **FASTEST (Route A)**, **BALANCED (Route B)**, and **SAFEST (Route C)**.  

> **Spoken Script (Presenter):**  
> "Now let us enter the core engine: the **PolarRoutingEngine**.  
> 
> All pathfinding operates in **EPSG:3031 Antarctic Polar Stereographic projection**, eliminating the extreme coordinate distortion of standard latitude and longitude. Using an A* graph search over an impassable land polygon mask, the engine generates three distinct operational corridors:  
> 
> 1. **Route A (Fastest):** Direct route through the ice—690 km, but forces 91% ice concentration and 55 hours transit time due to severe ice resistance.  
> 2. **Route C (Safest):** Detours into open leads—706 km, cutting ice exposure down to 21% and lowering transit time to 31 hours!  
> 3. **Route B (Balanced):** The optimal compromise balancing fuel, speed, and safety margins."

---

### Phase 5: Decision Intelligence & What-If Stress Testing (02:00 – 02:30)
**UI State:** Stay on **Navigation Page**.  
**Action:** Point to the **DECISION INTELLIGENCE** strip showing dominant hazard and recommendation. Then click the **WHAT-IF SCENARIO** toggle.  

> **Spoken Script (Presenter):**  
> "The heart of our decision support is the **Decision Intelligence Layer**. It translates complex cost graphs into maritime operational intelligence: showing IMO POLARIS RIO scores (+14.8), dominant hazard identification, and fuel consumption estimates derived from the Admiralty cubic law and Lindqvist ice resistance.  
> 
> What if the weather turns? We click **What-If Analysis**. Instantly, the engine recalculates the corridor under a +15% sea-ice surge and 25 km iceberg drift, giving the captain concrete metric deltas and recommending whether to maintain watch or divert to the perimeter corridor."

---

### Phase 6: Mission Lifecycle & Arrival (02:30 – 03:00)
**UI State:** In NavigationPage or FleetContext, demonstrate horizon advancement to arrival, then click **Assign Mission** modal.  
**Action:** Show that the vessel is marked **ARRIVED** at Bharati Station, and selecting a new mission starts strictly from Bharati's coordinates.  

> **Spoken Script (Presenter):**  
> "Finally, let us demonstrate complete **Mission Lifecycle Management**.  
> 
> When our forecast horizon passes the vessel's arrival time, the vessel marker reaches Bharati Station and status locks to **ARRIVED**—no random coordinate drift and no phantom movement.  
> 
> When the operator assigns a new expedition mission—such as a science transect to Maitri Station—the new route generates dynamically starting strictly from the vessel's actual arrival location.  
> 
> In summary: **Real Datasets $\to$ Validated ML Forecasting $\to$ Conformal Polar Routing $\to$ Explainable Decision Support**. Thank you, and we look forward to your questions."

---

*End of 3-Minute Demonstration.*
