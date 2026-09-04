# PolarNav — SIH PS 26059 Final Demo Walkthrough

Follow this scripted operational walkthrough during the Smart India Hackathon final presentation:

## Step 1: Mission Hub (Overview Page)
1. Open `http://localhost:3000/overview` (or production Vercel URL).
2. Point out the **PolarMap** showing circumpolar sea ice and real tracked icebergs.
3. In the bottom telemetry bar, select **R/V Sagar Nidhi** (or **R/V Polarstern**).
4. Notice how the coordinates and heading immediately update.
5. In the **Mission Destination** dropdown, select **Bharati Research Station**.
6. Show how the map focuses and the IMO POLARIS score displays `+8.4 SAFE`.

## Step 2: Multi-Objective Route Optimization (`/routes`)
1. Click **Plan Voyage** (or navigate to `/routes`).
2. Show that the vessel and destination were seamlessly preserved from the Overview page.
3. Observe the three distinct corridors:
   - **Route B — Optimal / Fastest Arrival**: Balances open leads and iceberg buffer, minimizing overall transit clock hours.
   - **Route C — Safest Ice Margin**: Maximum safety buffer with 0% heavy pack ice exposure.
   - **Route A — Direct Baseline (Ice-Constrained)**: Direct route showing high SIC drag and fuel consumption.
4. Highlight that **zero corridors cut across Antarctic land** due to our prepared geometry land mask in EPSG:3031.
5. Highlight that across the Ross Sea or Antarctic Peninsula, **no horizontal streaks cut across the screen** due to continuous antimeridian segment splitting.

## Step 3: Low-Latency Grounded Gemini AI Copilot
1. Click the glowing **Ask Gemini Copilot About Route** button.
2. The AI Navigation Copilot drawer slides out.
3. Show the fast response (~2 seconds via `gemini-flash-lite-latest`).
4. Click or ask: *"Why is Route B faster than Route A even though Route A is shorter in distance?"*
5. Demonstrate that Gemini accurately cites the backend numbers: Route A gets delayed by high Sea Ice Concentration (SIC) requiring slower speeds, whereas Route B navigates open leads.

## Step 4: What-If Scenario Simulation
1. Click the **WHAT-IF SIMULATION** button in the left panel.
2. Observe the scenario activation: simulates +25 km iceberg drift and +15% sea ice surge.
3. Point out how the route adapts into a wider safety corridor to maintain the minimum CPA buffer.

## Step 5: Emergency Tactical Rerouting
1. Click **SIMULATE HAZARD / EMERGENCY**.
2. An emergency alert triggers: a newly calved tabular iceberg obstructs the baseline path.
3. Watch the autonomous re-routing engine immediately divert the vessel into a verified safe bypass corridor with zero collision risk.

## Step 6: Navigation Execution (`/navigation`)
1. Navigate to `/navigation`.
2. Show the active voyage plan with operational waypoints, distances, and ETAs.
3. Click **Export Plan** to download the validated IMO POLARIS JSON voyage plan for bridge records.
