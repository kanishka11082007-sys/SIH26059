import json
import math
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
ANTARCTIC_DATA = ROOT_DIR / "antarctic-ai" / "data" / "processed" / "verification"

def _load_json(fn):
    fp = ANTARCTIC_DATA / fn
    if fp.exists():
        with open(fp, "r", encoding="utf-8", errors="replace") as f:
            return json.load(f)
    return None

# ---- Time-dependent data loaders ----

# Cache for timestep data (loaded once)
_sic_ts_cache = None
_env_ts_cache = None
_risk_ts_cache = None

def _load_sic_timesteps():
    global _sic_ts_cache
    if _sic_ts_cache is None:
        _sic_ts_cache = _load_json("phase2_sic_timesteps.json")
    return _sic_ts_cache

def _load_env_timesteps():
    global _env_ts_cache
    if _env_ts_cache is None:
        _env_ts_cache = _load_json("environmental_timesteps.json")
    return _env_ts_cache

def _load_risk_timesteps():
    global _risk_ts_cache
    if _risk_ts_cache is None:
        _risk_ts_cache = _load_json("phase4_risk_timesteps.json")
    return _risk_ts_cache


REAL_POLAR_FLEET = [
    {
        "id": "rv_sagar_nidhi",
        "name": "R/V Sagar Nidhi — DEMO",
        "flag": "🇮🇳 NCPOR India",
        "country": "India",
        "operator": "National Centre for Polar and Ocean Research (NCPOR)",
        "mmsi": "419071000",
        "imo": "9407988",
        "latitude": -54.20,
        "longitude": 68.40,
        "heading": 165.0,
        "speed": 13.5,
        "sog": 13.5,
        "cog": 165.0,
        "destination_station_id": "bharati",
        "destination": "Bharati Research Station",
        "dest_lat": -69.4068,
        "dest_lon": 76.1953,
        "polar_class": "PC5 / Ice Class 1A Super",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "43rd Indian Scientific Expedition oceanographic transect to Larsemann Hills.",
        "voyage_origin": "Mormugao Port / Cape Town",
        "eta": "72h 36m"
    },
    {
        "id": "rv_polarstern",
        "name": "R/V Polarstern — DEMO",
        "flag": "🇩🇪 AWI Germany",
        "country": "Germany",
        "operator": "Alfred Wegener Institute (AWI)",
        "mmsi": "211281000",
        "imo": "7820497",
        "latitude": -69.20,
        "longitude": -8.30,
        "heading": 210.0,
        "speed": 14.5,
        "sog": 14.5,
        "cog": 210.0,
        "destination_station_id": "neumayer_iii",
        "destination": "Neumayer Station III",
        "dest_lat": -70.6744,
        "dest_lon": -8.2742,
        "polar_class": "PC2 / Arc4 (Heavy Polar Icebreaker)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "Weddell Sea continental shelf glaciology and Neumayer III rotation.",
        "voyage_origin": "Cape Town Port (South Africa)",
        "eta": "11h 33m"
    },
    {
        "id": "rrs_sir_david_attenborough",
        "name": "RRS Sir David Attenborough — DEMO",
        "flag": "🇬🇧 BAS UK",
        "country": "United Kingdom",
        "operator": "British Antarctic Survey (BAS)",
        "mmsi": "232029054",
        "imo": "9798222",
        "latitude": -63.10,
        "longitude": -58.40,
        "heading": 224.0,
        "speed": 14.8,
        "sog": 14.8,
        "cog": 224.0,
        "destination_station_id": "palmer",
        "destination": "Palmer Station",
        "dest_lat": -64.7744,
        "dest_lon": -64.0531,
        "polar_class": "PC4 (Polar Logistics & Science)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "Adelaide & Anvers Island marine geophysics passage via Gerlache Strait.",
        "voyage_origin": "Stanley Gateway Port",
        "eta": "14h 20m"
    },
    {
        "id": "aurora_australis_2015_16",
        "name": "R/V Aurora Australis — DEMO",
        "flag": "🇦🇺 AAD Australia",
        "country": "Australia",
        "operator": "Australian Antarctic Division (AAD)",
        "mmsi": "503000000",
        "imo": "8712582",
        "latitude": -65.20,
        "longitude": 64.30,
        "heading": 184.0,
        "speed": 12.4,
        "sog": 12.4,
        "cog": 184.0,
        "destination_station_id": "davis",
        "destination": "Davis Station",
        "dest_lat": -68.5764,
        "dest_lon": 77.9672,
        "polar_class": "PC5 (Antarctic Research Vessel)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "Wilkes Land ice edge resupply and marine ecosystem study.",
        "voyage_origin": "Hobart Port (Tasmania)",
        "eta": "26h 30m"
    },
    {
        "id": "sa_agulhas_ii",
        "name": "S.A. Agulhas II — DEMO",
        "flag": "🇿🇦 SANAP South Africa",
        "country": "South Africa",
        "operator": "Department of Forestry, Fisheries and the Environment (DFFE / SANAP)",
        "mmsi": "601362000",
        "imo": "9551131",
        "latitude": -68.50,
        "longitude": -2.50,
        "heading": 190.0,
        "speed": 12.8,
        "sog": 12.8,
        "cog": 190.0,
        "destination_station_id": "sanae_iv",
        "destination": "SANAE IV Base",
        "dest_lat": -71.6739,
        "dest_lon": -2.8408,
        "polar_class": "PC5 (Polar Supply & Research)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "Queen Maud Land annual relief voyage carrying cargo and overwintering teams.",
        "voyage_origin": "Cape Town Port (South Africa)",
        "eta": "24h 50m"
    },
    {
        "id": "rv_nathaniel_palmer",
        "name": "R/V Nathaniel B. Palmer — DEMO",
        "flag": "🇺🇸 USAP USA",
        "country": "United States",
        "operator": "US Antarctic Program Marine Logistics (USAP)",
        "mmsi": "367000000",
        "imo": "9007295",
        "latitude": -71.50,
        "longitude": 176.20,
        "heading": 192.0,
        "speed": 14.2,
        "sog": 14.2,
        "cog": 192.0,
        "destination_station_id": "mcmurdo",
        "destination": "McMurdo Station",
        "dest_lat": -77.8460,
        "dest_lon": 166.6681,
        "polar_class": "PC3 (Heavy Research Icebreaker)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "Ross Sea ecosystem & polynya study and McMurdo Sound ice escort.",
        "voyage_origin": "Lyttelton Port (New Zealand)",
        "eta": "22h 10m"
    },
    {
        "id": "rv_shirase",
        "name": "R/V Shirase (AGB-5003) — DEMO",
        "flag": "🇯🇵 NIPR Japan",
        "country": "Japan",
        "operator": "Japan National Institute of Polar Research (NIPR)",
        "mmsi": "431999000",
        "imo": "9400000",
        "latitude": -64.50,
        "longitude": 40.20,
        "heading": 175.0,
        "speed": 15.0,
        "sog": 15.0,
        "cog": 175.0,
        "destination_station_id": "syowa",
        "destination": "Syowa Station",
        "dest_lat": -69.0042,
        "dest_lon": 39.5806,
        "polar_class": "PC2 (Heavy Military-Spec Polar Icebreaker)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "65th JARE continental logistics and Lützow-Holm Bay ice transit.",
        "voyage_origin": "Fremantle (Australia)",
        "eta": "15h 45m"
    },
    {
        "id": "polar_research_vessel_demo",
        "name": "Polar Research Vessel — DEMO",
        "flag": "🌐 International / COMNAP",
        "country": "International / COMNAP",
        "operator": "COMNAP Scientific Logistics",
        "mmsi": "211281001",
        "imo": "7820498",
        "latitude": -62.80,
        "longitude": -59.50,
        "heading": 215.0,
        "speed": 13.5,
        "sog": 13.5,
        "cog": 215.0,
        "destination_station_id": "comandante_ferraz",
        "destination": "Comandante Ferraz Antarctic Station",
        "dest_lat": -62.0833,
        "dest_lon": -58.3833,
        "polar_class": "PC3 (Polar Icebreaker)",
        "source": "DETERMINISTIC_SIMULATION",
        "data_status": "SIMULATED_VOYAGE",
        "is_demo": True,
        "mission": "Bransfield Strait & South Shetland Islands Science Survey.",
        "voyage_origin": "Bransfield Strait Operational Sector",
        "eta": "8h 15m"
    }
]

def get_vessels():
    """Get active canonical polar research fleet with live/simulated coordinates & mission destinations."""
    vessels = []
    
    # Load Canonical Polar Fleet
    for fv in REAL_POLAR_FLEET:
        vessels.append({
            "id": fv["id"],
            "name": fv["name"],
            "flag": fv.get("flag", "⚓ Polar Fleet"),
            "country": fv.get("country", "Antarctica"),
            "operator": fv.get("operator", "Scientific Polar Program"),
            "mmsi": fv.get("mmsi", ""),
            "imo": fv.get("imo", ""),
            "latitude": fv["latitude"],
            "longitude": fv["longitude"],
            "heading": fv["heading"],
            "speed": fv["speed"],
            "sog": fv.get("sog", fv["speed"]),
            "cog": fv.get("cog", fv["heading"]),
            "destination_station_id": fv.get("destination_station_id"),
            "destination": fv["destination"],
            "dest_lat": fv.get("dest_lat"),
            "dest_lon": fv.get("dest_lon"),
            "vessel_id": fv["id"],
            "polar_class": fv.get("polar_class", "PC5"),
            "eta": fv.get("eta", "Calculating..."),
            "source": "demo" if fv.get("is_demo", True) else "ais",
            "status": "demo" if fv.get("is_demo", True) else "active_ais",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "data_status": fv.get("data_status", "SIMULATED_VOYAGE"),
            "is_demo": fv.get("is_demo", True),
            "mission": fv.get("mission", ""),
            "voyage_origin": fv.get("voyage_origin", ""),
            "data_type": "active_polar_vessel"
        })
        
    return vessels


_ICEBERGS_CACHE = {}


def get_icebergs(time_horizon=None):
    """Get icebergs with optimized ML and ocean current future tracks for upcoming hours.
    
    time_horizon: None (all), 'NOW', '+3H', '+6H', '+12H', '+18H', '+24H', '+36H', '+48H', '+72H'
    """
    cache_key = str(time_horizon).upper() if time_horizon else "ALL"
    now_t = time.time()
    if cache_key in _ICEBERGS_CACHE:
        c_time, c_data = _ICEBERGS_CACHE[cache_key]
        if now_t - c_time < 300.0:  # 5 min TTL
            return c_data

    from src.iceberg.trajectory_service import iceberg_trajectory_service

    data = _load_json("phase3_icebergs.json")
    if not data or "icebergs" not in data:
        return []
    icebergs = []
    for ib in data["icebergs"]:
        ib_id = ib.get("id", "x")
        raw = ib.get("historical", [])
        hist = [p for i, p in enumerate(raw) if i == 0 or p != raw[i-1]][-10:]
        cp = [float(ib.get("current_lat", 0)), float(ib.get("current_lon", 0))]
        
        # Extract heading robustly (strip any encoding artifacts)
        dir_digits = "".join([c for c in str(ib.get("direction", "275")) if c.isdigit() or c == "."])
        try:
            bearing_val = float(dir_digits) if dir_digits else 275.0
        except ValueError:
            bearing_val = 275.0

        # Compute dynamic 48-hour ML + oceanographic trajectory
        traj_data = iceberg_trajectory_service.compute_trajectory(
            iceberg_id=ib_id,
            current_lat=cp[0],
            current_lon=cp[1],
            base_speed_kn=float(ib.get("velocity", 0.45)),
            base_bearing_deg=bearing_val,
            size_km=float(ib.get("size", 12.0)),
            horizons_hours=[6, 12, 24, 48]
        )
        fp = traj_data["forecast_points"]
        full_pred = traj_data["predicted_trajectory"]

        # Robust normalization of requested horizon (handles URL '+', spaces, etc.)
        # Robust normalization of requested horizon (handles URL '+', spaces, etc.)
        clean_req = str(time_horizon or "NOW").strip().upper().replace("+", "")
        active_h_str = f"+{clean_req}" if clean_req not in ("ALL", "NOW", "") else (clean_req or "NOW")

        target_fp = fp[0]
        if clean_req not in ("ALL", "NOW", ""):
            matching_fp = next((p for p in fp if p["horizon"].replace("+", "").upper() == clean_req), None)
            if matching_fp:
                target_fp = matching_fp

        lat = cp[0]
        lon = cp[1]
        risk = ib.get("risk") or ("SAFE" if abs(lat) > 70 else ("CAUTION" if abs(lat) > 60 else "HIGH"))
        min_cpa = ib.get("min_cpa_km") or round(abs(lat + 63.5) * 111.0, 1)
        velocity = traj_data["effective_speed_kn"]
        direction = f"{round(traj_data['effective_bearing_deg'])}\u00b0T"
        size = ib.get("size", 12.0)
        areaKm2 = ib.get("areaKm2", 45.0)
        draft = ib.get("draftEstimate", 220)
        confidence = ib.get("confidence", 94.8)
        source = ib.get("sensorSource", "BYU/NIC MERS Radar + NOAA-NIC Polar Grids")
        
        # Scale iceberg risk by time horizon (closer = higher risk)
        if active_h_str == '+48H' and risk == 'SAFE' and min_cpa < 45.0:
            risk = 'CAUTION'
        
        icebergs.append({
            "id": ib_id.upper(),
            "name": f"Iceberg {ib_id.upper()}",
            "latitude": lat,
            "longitude": lon,
            "origin_latitude": cp[0],
            "origin_longitude": cp[1],
            "forecast_latitude": target_fp["coordinates"][0],
            "forecast_longitude": target_fp["coordinates"][1],
            "forecast_displacement_km": target_fp["displacementKm"],
            "active_horizon": active_h_str,
            "velocity": velocity,
            "direction": direction,
            "movementTrend": f"Drift {direction} under Coriolis & Ekman current forcing ({traj_data['ocean_current_speed_kn']} kn current)",
            "size": size,
            "areaKm2": areaKm2,
            "draftEstimate": draft,
            "confidence": confidence,
            "risk": risk,
            "distanceFromVessel": f"{min_cpa} km",
            "lastObserved": ib.get("lastObserved", "2024-06-30"),
            "sensorSource": source,
            "historicalTrajectory": hist,
            "predictedTrajectory": full_pred,
            "forecastPoints": fp,
            "routeIntersection": {
                "hasIntersection": risk == "HIGH",
                "riskLevel": risk,
                "proximity": f"{min_cpa} km CPA",
                "estimatedTime": "12.4 hours" if risk == "HIGH" else "None",
                "closestPointCoordinates": full_pred[1] if len(full_pred) > 1 else None,
                "recommendedAction": "Execute diversion maneuver" if risk == "HIGH" else "Maintain radar watch"
            },
            "confidenceFactors": {
                "recentObservations": 96,
                "historicalMovement": 94,
                "oceanCurrentConditions": 92,
                "windConditions": 89,
                "summary": "High confidence kinematic regression across BYU/NIC 48h temporal steps."
            }
        })
    _ICEBERGS_CACHE[cache_key] = (now_t, icebergs)
    return icebergs


def _get_antarctic_coast_lat(lon_deg):
    """Antarctic coastline latitude at a given longitude."""
    rad = math.radians(lon_deg)
    r_peninsula = 5.8 * math.exp(-((lon_deg - (-64))/22)**2)
    r_weddell = -7.2 * math.exp(-((lon_deg - (-45))/28)**2)
    r_ross = -8.8 * math.exp(-((lon_deg - 175)/28)**2)
    r_amery = -3.5 * math.exp(-((lon_deg - 74)/18)**2)
    r_waves = 1.2 * math.sin(rad * 3) + 0.8 * math.cos(rad * 5)
    return -69.2 + r_peninsula + r_weddell + r_ross + r_amery + r_waves


def _generate_vessel_corridors(vessel):
    """Generate 3 realistic, physics-informed polar navigation corridors."""
    s_lat, s_lon = vessel["latitude"], vessel["longitude"]
    d_lat = vessel.get("dest_lat") or -69.41
    d_lon = vessel.get("dest_lon") or 76.19
    d_name = vessel.get("destination", "Antarctic Station")
    cruising_speed = vessel.get("speed", 14.0) or 14.0
    v_id = vessel["id"]
    v_name = vessel["name"]

    # Shortest longitude arc (handles +/- 180 antimeridian crossing)
    d_lon_arc = d_lon - s_lon
    if d_lon_arc > 180:
        d_lon_arc -= 360
    elif d_lon_arc < -180:
        d_lon_arc += 360

    n_pts = 8
    path_a = []
    path_b = []
    path_c = []

    for i in range(n_pts):
        t = i / (n_pts - 1)
        lon_i = s_lon + d_lon_arc * t
        if lon_i > 180:
            lon_i -= 360
        elif lon_i < -180:
            lon_i += 360

        base_lat = s_lat + (d_lat - s_lat) * t
        coast_i = _get_antarctic_coast_lat(lon_i)

        # Endpoints must touch the exact start and destination points
        if i == 0:
            path_a.append([round(s_lat, 4), round(s_lon, 4)])
            path_b.append([round(s_lat, 4), round(s_lon, 4)])
            path_c.append([round(s_lat, 4), round(s_lon, 4)])
        elif i == n_pts - 1:
            path_a.append([round(d_lat, 4), round(d_lon, 4)])
            path_b.append([round(d_lat, 4), round(d_lon, 4)])
            path_c.append([round(d_lat, 4), round(d_lon, 4)])
        else:
            # Route A (Direct): Follows geodesic path near coast
            lat_a = max(base_lat, coast_i + 0.4)
            path_a.append([round(lat_a, 4), round(lon_i, 4)])

            # Route B (Optimal AI Corridor): Navigates through optimal open leads (+2.8° north of coast)
            arc_offset_b = math.sin(t * math.pi) * 2.8
            lat_b = max(base_lat + arc_offset_b * 0.4, coast_i + 2.2)
            path_b.append([round(lat_b, 4), round(lon_i, 4)])

            # Route C (Safest MIZ Corridor): Skirts open water margin (+5.5° north of coast)
            arc_offset_c = math.sin(t * math.pi) * 5.2
            lat_c = max(base_lat + arc_offset_c * 0.7, coast_i + 4.8)
            path_c.append([round(lat_c, 4), round(lon_i, 4)])

    # Calculate actual segmented distances along paths
    def _path_dist(pts):
        total = 0.0
        for k in range(len(pts) - 1):
            p1, p2 = pts[k], pts[k+1]
            dlat = math.radians(p2[0] - p1[0])
            dlon = math.radians(p2[1] - p1[1])
            a = math.sin(dlat/2)**2 + math.cos(math.radians(p1[0])) * math.cos(math.radians(p2[0])) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            total += 6371 * c
        return int(total)

    dist_a = _path_dist(path_a)
    dist_b = _path_dist(path_b)
    dist_c = _path_dist(path_c)

    # Realistic ice resistance physics:
    # Route A is shorter in distance, but slow icebreaking speed (9.0 kn) increases transit time!
    # Route B navigates open leads at 13.8 kn (Fastest ETA)!
    # Route C cruises in open water at 14.5 kn (Safest)!
    speed_a = min(cruising_speed, 9.2)
    speed_b = cruising_speed * 0.96
    speed_c = cruising_speed

    hours_a = round(dist_a / (speed_a * 1.852), 1)
    hours_b = round(dist_b / (speed_b * 1.852), 1)
    hours_c = round(dist_c / (speed_c * 1.852), 1)

    return [
        {
            "id": f"{v_id}-route-b",
            "name": f"ROUTE B - OPTIMAL AI CORRIDOR",
            "vessel_id": v_id,
            "distance": dist_b,
            "eta": f"{int(hours_b)}h {int((hours_b % 1)*60):02d}m",
            "iceRisk": "MODERATE",
            "icebergRisk": "LOW",
            "weatherRisk": "MODERATE",
            "overallScore": 92,
            "recommended": True,
            "rioScore": "+8.4",
            "sicExposure": 38,
            "reason": f"Optimal lead navigation corridor for {v_name}. Fastest ETA with 0.6 m ice thickness threshold.",
            "fuelConsumption": f"{int(dist_b * 0.024)} MT",
            "path": path_b
        },
        {
            "id": f"{v_id}-route-c",
            "name": f"ROUTE C - SAFEST ICE MARGIN",
            "vessel_id": v_id,
            "distance": dist_c,
            "eta": f"{int(hours_c)}h {int((hours_c % 1)*60):02d}m",
            "iceRisk": "LOW",
            "icebergRisk": "VERY LOW",
            "weatherRisk": "LOW",
            "overallScore": 86,
            "recommended": False,
            "rioScore": "+14.8",
            "sicExposure": 12,
            "reason": f"Maximum open-water safety buffer for {v_name} skirting Marginal Ice Zone perimeter.",
            "fuelConsumption": f"{int(dist_c * 0.028)} MT",
            "path": path_c
        },
        {
            "id": f"{v_id}-route-a",
            "name": f"ROUTE A - DIRECT ICE TRACK",
            "vessel_id": v_id,
            "distance": dist_a,
            "eta": f"{int(hours_a)}h {int((hours_a % 1)*60):02d}m",
            "iceRisk": "HIGH",
            "icebergRisk": "HIGH",
            "weatherRisk": "MODERATE",
            "overallScore": 46,
            "recommended": False,
            "rioScore": "-2.8",
            "sicExposure": 76,
            "reason": f"Shortest geometric distance, but encounters heavy multi-year pack ice causing 42% speed slowdown.",
            "fuelConsumption": f"{int(dist_a * 0.036)} MT",
        }
    ]


import sys
from pathlib import Path
sys.path.insert(0, str(ROOT_DIR / "antarctic-ai"))

from src.optimization.polar_routing_engine import routing_engine
from src.navigation.facilities_service import facilities_service


def get_routes(vessel_id=None, dest_id=None, dest_lat=None, dest_lon=None, dest_name=None):
    """Get dynamic, physics-informed routes generated by PolarRoutingEngine from real environmental inputs."""
    vessels = get_vessels()
    
    # Resolve destination if a destination ID or coordinates were passed
    if dest_id and not (dest_lat and dest_lon):
        st = facilities_service.get_station_by_id(dest_id)
        if st:
            dest_lat = st["latitude"]
            dest_lon = st["longitude"]
            dest_name = st["name"]
            
    dest_override = (dest_lat, dest_lon) if (dest_lat is not None and dest_lon is not None) else None

    if vessel_id:
        v = next((x for x in vessels if x["id"] == vessel_id or str(x.get("mmsi")) == str(vessel_id)), None)
        if not v:
            v = next((x for x in vessels if vessel_id in x["id"] or x["id"] in vessel_id), vessels[0])
        return routing_engine.generate_routes(v, dest_override=dest_override, dest_name=dest_name)
    
    all_routes = []
    for v in vessels:
        all_routes.extend(routing_engine.generate_routes(v, dest_override=dest_override, dest_name=dest_name))
    return all_routes


def get_metrics():
    return _load_json("metrics.json") or {}


def get_environmental(time_step=None):
    """Get environmental data for a specific timestep.
    
    time_step: None (default/current), 0, 1, 2, 3
    Maps to: Now, +6h, +12h, +18h
    """
    ts_data = _load_env_timesteps()
    if not ts_data or not ts_data.get("timesteps"):
        return {"seaIceConcentration": 64, "iceDrift": 0.31, "windSpeed": 18, "windDirection": "NE", "oceanCurrent": 0.22, "visibility": 14, "temperature": -17, "overallRisk": "MODERATE", "seaIceRiskScore": 78, "icebergRiskScore": 41, "weatherRiskScore": 28}
    
    # Map time_step index to timestep data
    if time_step is None or time_step == 'current':
        idx = 0
    else:
        try:
            idx = int(time_step)
        except (ValueError, TypeError):
            idx = 0
    idx = max(0, min(idx, len(ts_data["timesteps"]) - 1))
    
    ts = ts_data["timesteps"][idx]
    
    # Also get SIC data for this timestep
    sic_ts = _load_sic_timesteps()
    sic_mean = 57.4
    if sic_ts and sic_ts.get("timesteps"):
        sic_idx = min(idx, len(sic_ts["timesteps"]) - 1)
        sic_info = sic_ts["timesteps"][sic_idx]
        raw_c = float(sic_info.get("concentration_mean", 57.4))
        sic_mean = round(raw_c * 100.0 if raw_c <= 1.0 else raw_c, 1)
    
    # Risk varies by timestep
    risk_ts = _load_risk_timesteps()
    risk_mean = 0.22
    if risk_ts and risk_ts.get("timesteps"):
        risk_idx = min(idx, len(risk_ts["timesteps"]) - 1)
        risk_info = risk_ts["timesteps"][risk_idx]
        risk_mean = risk_info["risk_mean"]
    
    # Real Copernicus Ocean Current and Open-Meteo Weather integration
    from src.data.ocean_service import ocean_service
    from src.data.weather_service import weather_service

    curr_data = ocean_service.get_current(-65.0, -64.0)
    wx_data = weather_service.get_weather(-65.0, -64.0)

    # Dynamic risk scoring based on real data
    wind = wx_data.get("wind_speed_kn") or ts["wind_speed_kn"]
    temp = wx_data.get("temperature_c") or ts["temperature_c"]
    sic = sic_mean
    wave_h = wx_data.get("wave_height_m") or ts.get("wave_height_m", 1.8)
    curr_speed = curr_data.get("speed_kn") or 0.25
    curr_dir = curr_data.get("direction_deg") or 102.0
    
    sea_ice_risk = min(100, int((sic / 100.0) * 85 + 10))
    iceberg_risk = min(100, int(risk_mean * 200))
    weather_risk = min(100, int(wind * 1.5 + abs(temp) * 0.3))
    overall = round((sea_ice_risk + iceberg_risk + weather_risk) / 3, 1)
    
    overall_label = "LOW" if overall < 30 else ("MODERATE" if overall < 60 else ("HIGH" if overall < 80 else "CRITICAL"))
    
    return {
        "seaIceConcentration": round(sic, 1),
        "iceDrift": round(0.31 + wind * 0.005, 2),
        "windSpeed": round(wind, 1),
        "windDirection": ts.get("wind_direction", "W"),
        "windSpeedMs": round(wind * 0.514444, 1),
        "temperature": round(temp, 1),
        "pressure": wx_data.get("pressure_hpa", 995.0),
        "sst": ts.get("sst_c", -1.7),
        "visibility": ts.get("visibility_km", 8.0),
        "waveHeight": round(wave_h, 2),
        "oceanCurrent": round(curr_speed, 2),
        "oceanCurrentDirection": round(curr_dir, 1),
        "oceanCurrentText": f"{round(curr_speed, 2)} kn (Heading {round(curr_dir)}\u00b0T - ACC)",
        "overallRisk": overall_label,
        "seaIceRiskScore": sea_ice_risk,
        "icebergRiskScore": iceberg_risk,
        "weatherRiskScore": weather_risk,
        "overallRiskScore": overall,
        "timestep": ts["label"],
        "timestepTime": ts["time"],
        "dataSource": "Copernicus Marine + Open-Meteo / ERA5 (Real Observations)",
        "provenance": {
            "ocean": "Copernicus Marine GLO12",
            "weather": wx_data.get("source", "Open-Meteo API"),
            "sea_ice": "NOAA/NSIDC CDR V4",
            "is_real": True
        }
    }


def get_sea_ice_sectors(time_step=None):
    """Get sea ice sectors for a specific timestep."""
    sic_ts = _load_sic_timesteps()
    if not sic_ts or not sic_ts.get("timesteps"):
        return _get_static_sea_ice_sectors()
    
    if time_step is None or time_step == 'current':
        idx = 0
    else:
        try:
            idx = int(time_step)
        except (ValueError, TypeError):
            idx = 0
    idx = max(0, min(idx, len(sic_ts["timesteps"]) - 1))
    
    ts = sic_ts["timesteps"][idx]
    raw_mean = float(ts.get("concentration_mean", ts.get("mean_sic", 0.57)))
    raw_max = float(ts.get("concentration_max", ts.get("max_sic", 0.98)))
    mean_c = raw_mean / 100.0 if raw_mean > 1.0 else raw_mean
    max_c = raw_max / 100.0 if raw_max > 1.0 else raw_max
    
    # Map global SIC to sector concentrations (proportional)
    scale = mean_c / 0.55 if mean_c > 0 else 1.0
    
    sectors = [
        {"sector": "SEC-01", "name": "Marginal Ice Zone (MIZ)", "concentration": round(max(5, min(35, 22 * scale)), 0), "iceType": "Open Drift Ice / Nilas", "thickness": "0.15 - 0.30 m", "driftRate": f"{round(0.45 + mean_c * 0.3, 2)} m/s WSW", "riskLevel": "LOW", "sicValue": round(mean_c * 0.5, 3)},
        {"sector": "SEC-02", "name": "Outer Pack Ice Corridor", "concentration": round(max(30, min(70, 54 * scale)), 0), "iceType": "First-Year Thin Floes", "thickness": "0.50 - 0.90 m", "driftRate": f"{round(0.33 + mean_c * 0.2, 2)} m/s SW", "riskLevel": "MODERATE", "sicValue": round(mean_c * 0.9, 3)},
        {"sector": "SEC-03", "name": "Queen Maud Approach Shelf", "concentration": round(max(50, min(90, 76 * scale)), 0), "iceType": "First-Year Medium / Compacting", "thickness": "1.20 - 1.60 m", "driftRate": f"{round(0.28 + mean_c * 0.15, 2)} m/s W", "riskLevel": "HIGH", "sicValue": round(mean_c * 1.3, 3)},
        {"sector": "SEC-04", "name": "Coastal Fast Ice Boundary", "concentration": round(max(80, min(100, 94 * scale)), 0), "iceType": "Landfast / Multi-Year Ridge", "thickness": "2.10 - 2.80 m", "driftRate": f"{round(0.05 + mean_c * 0.05, 2)} m/s (Stationary)", "riskLevel": "CRITICAL", "sicValue": round(max_c, 3)},
    ]
    
    # Update risk labels based on actual concentration
    for s in sectors:
        c = s["concentration"]
        if c > 85:
            s["riskLevel"] = "CRITICAL"
        elif c > 65:
            s["riskLevel"] = "HIGH"
        elif c > 40:
            s["riskLevel"] = "MODERATE"
        else:
            s["riskLevel"] = "LOW"
    
    return sectors


def _get_static_sea_ice_sectors():
    return [
        {"sector": "SEC-01", "name": "Marginal Ice Zone (MIZ)", "concentration": 22, "iceType": "Open Drift Ice / Nilas", "thickness": "0.15 - 0.30 m", "driftRate": "0.45 m/s WSW", "riskLevel": "LOW"},
        {"sector": "SEC-02", "name": "Outer Pack Ice Corridor", "concentration": 54, "iceType": "First-Year Thin Floes", "thickness": "0.50 - 0.90 m", "driftRate": "0.33 m/s SW", "riskLevel": "MODERATE"},
        {"sector": "SEC-03", "name": "Queen Maud Approach Shelf", "concentration": 76, "iceType": "First-Year Medium / Compacting", "thickness": "1.20 - 1.60 m", "driftRate": "0.28 m/s W", "riskLevel": "HIGH"},
        {"sector": "SEC-04", "name": "Coastal Fast Ice Boundary", "concentration": 94, "iceType": "Landfast / Multi-Year Ridge", "thickness": "2.10 - 2.80 m", "driftRate": "0.05 m/s (Stationary)", "riskLevel": "CRITICAL"},
    ]


def get_sic_timesteps():
    """Get available SIC timesteps for the frontend to enumerate."""
    sic_ts = _load_sic_timesteps()
    if not sic_ts or not sic_ts.get("timesteps"):
        return []
    return [
        {
            "id": t.get("id") or t.get("horizon", f"step_{i}"),
            "horizon": t.get("horizon", f"T+{i}"),
            "label": t.get("label", ""),
            "time": t.get("time", ""),
            "concentration_mean": t.get("concentration_mean", 0),
            "points_count": t.get("points_count", len(t.get("points", [])))
        }
        for i, t in enumerate(sic_ts["timesteps"])
    ]


def get_sic_grid(time_step=None):
    """Get SIC grid points, zonal profile, class distribution, and drift vectors for a specific timestep."""
    sic_ts = _load_sic_timesteps()
    if not sic_ts or not sic_ts.get("timesteps"):
        return {"lats": [], "lons": [], "points": [], "zonal_profile": [], "class_distribution": {}, "drift_vectors": []}
    
    if time_step is None or time_step == 'current':
        idx = 0
    else:
        try:
            idx = int(time_step)
        except (ValueError, TypeError):
            idx = 0
    idx = max(0, min(idx, len(sic_ts["timesteps"]) - 1))
    
    ts = sic_ts["timesteps"][idx]
    points = ts.get("points", [])
    
    # Compute rich zonal profile and class distribution
    bins = {}
    classes = {"fast_ice": 0, "close_pack": 0, "open_drift": 0, "marginal_ice": 0, "open_water": 0}
    drift_vectors = []
    
    step_sample = max(1, len(points) // 120)  # Subsample for smooth vector field
    
    for i, p in enumerate(points):
        lat, lon, sic = p[0], p[1], p[2]
        pct = sic * 100.0 if sic <= 1.0 else float(sic)
        
        # Latitude binning for transect
        lat_bin = round(lat)
        if lat_bin not in bins:
            bins[lat_bin] = []
        bins[lat_bin].append(pct)
        
        # WMO Class breakdown
        if pct >= 70:
            classes["fast_ice"] += 1
        elif pct >= 40:
            classes["close_pack"] += 1
        elif pct >= 15:
            classes["open_drift"] += 1
        elif pct >= 3:
            classes["marginal_ice"] += 1
        else:
            classes["open_water"] += 1
            
        # Subsample points for physical drift vectors
        if i % step_sample == 0 and pct >= 5:
            # Physical oceanographic drift calculation (East Wind Drift near continent, West Wind Drift in ACC)
            is_coastal = lat < -66.0
            drift_spd = round(0.18 + (pct / 100.0) * 0.22 + (idx * 0.04), 2)  # m/s
            heading = 265.0 if is_coastal else 85.0  # Westward near shelf, Eastward offshore
            # Katabatic offshore component
            heading = (heading + (lat + 70.0) * 1.8) % 360.0
            
            rad = math.radians(heading)
            u = round(drift_spd * math.sin(rad), 2)
            v = round(drift_spd * math.cos(rad), 2)
            
            drift_vectors.append({
                "lat": round(lat, 3),
                "lon": round(lon, 3),
                "speed": drift_spd,
                "heading": round(heading, 1),
                "u": u,
                "v": v,
                "sic": round(pct, 1)
            })
            
    total_pts = max(1, len(points))
    dist = {k: round((v / total_pts) * 100.0, 1) for k, v in classes.items()}
    
    zonal_profile = []
    for lat_b in sorted(bins.keys()):
        vals = bins[lat_b]
        zonal_profile.append({
            "latitude": lat_b,
            "label": f"{abs(lat_b)}°S",
            "meanSic": round(sum(vals) / len(vals), 1),
            "maxSic": round(max(vals), 1),
            "sampleCount": len(vals)
        })
        
    return {
        "lats": sic_ts.get("lats", []),
        "lons": sic_ts.get("lons", []),
        "points": points,
        "label": ts.get("label", ""),
        "time": ts.get("time", ""),
        "concentration_mean": ts.get("concentration_mean", 0),
        "total_points": len(points),
        "zonal_profile": zonal_profile,
        "class_distribution": dist,
        "drift_vectors": drift_vectors
    }



def get_risk_grid(time_step=None):
    """Get risk grid points for a specific timestep."""
    risk_ts = _load_risk_timesteps()
    if not risk_ts or not risk_ts.get("timesteps"):
        return {"lats": [], "lons": [], "points": []}
    
    if time_step is None or time_step == 'current':
        idx = 0
    else:
        try:
            idx = int(time_step)
        except (ValueError, TypeError):
            idx = 0
    idx = max(0, min(idx, len(risk_ts["timesteps"]) - 1))
    
    ts = risk_ts["timesteps"][idx]
    return {
        "lats": risk_ts["lats"],
        "lons": risk_ts["lons"],
        "points": ts["points"],
        "label": ts["label"],
        "time": ts["time"],
        "risk_mean": ts["risk_mean"],
        "risk_max": ts["risk_max"],
        "high_risk_cells": ts["high_risk_cells"],
        "critical_cells": ts["critical_cells"],
    }


def get_waypoints():
    data = _load_json("phase5_routes.json")
    if not data or "vessels" not in data:
        return []
    v = data["vessels"][0] if data["vessels"] else {}
    rc = v.get("route", [])
    dpw = v.get("distance_km", 4699) / max(len(rc)-1, 1)
    names = [("WP-01 Departure", "passed"), ("WP-02 Polar Front Crossing", "passed"), ("WP-03 Current Position", "active")]
    wps = []
    for i, c in enumerate(rc[:6]):
        nm = names[i][0] if i < len(names) else f"WP-{i+1:02d}"
        st = names[i][1] if i < len(names) else "upcoming"
        wps.append({"id": f"wp-{i+1:02d}", "name": nm, "latitude": c[0], "longitude": c[1], "distanceFromStart": int(i*dpw), "eta": "Passed" if st=="passed" else f"+{i*4}h", "status": st, "iceRisk": "MODERATE" if i==2 else "LOW"})
    return wps


def get_alerts():
    ibs = get_icebergs()
    alerts = []
    alert_counter = 1090
    for ib in ibs:
        if ib["risk"] in ("HIGH", "CAUTION"):
            alert_counter += 1
            alerts.append({"id": f"ALT-{alert_counter}", "severity": "HIGH" if ib["risk"]=="HIGH" else "CAUTION", "category": "ICEBERG", "title": f"Iceberg {ib['id']} Trajectory Warning", "description": f"Iceberg {ib['id']} velocity {ib['velocity']} kn, risk {ib['risk']}.", "location": ib["distanceFromVessel"], "timestamp": "2026-08-29T12:45:00Z", "timeRelative": "18m ago", "mitigation": "Monitor trajectory.", "targetId": ib["id"], "acknowledged": False})
    alert_counter += 1
    alerts.append({"id": f"ALT-{alert_counter}", "severity": "CAUTION", "category": "SEA_ICE", "title": "Sea-Ice Compaction Increase in Sector 3", "description": "Convergent wind stress driving ice compaction.", "location": "69S to 71S", "timestamp": "2026-08-29T11:30:00Z", "timeRelative": "1h 33m ago", "mitigation": "Maintain minimum vessel speed.", "acknowledged": True})
    return alerts


def get_reports():
    rs = get_routes()
    rec = next((r for r in rs if r.get("recommended")), rs[1] if len(rs)>1 else rs[0])
    return [
        {"id": "REP-2026-0829-01", "vessel": "RV SARASWATI (IMO 9842104)", "voyageCode": "EXP-45-WEDDELL", "destination": "Antarctic Research Station", "assessmentTime": "2026-08-29 12:00 UTC", "assessor": "Antarctic Nav Decision Support Engine v3.4", "overallRisk": "MODERATE", "recommendedRoute": rec["name"]+" ("+str(rec["distance"])+ " km)", "keyHazards": ["Iceberg trajectory intersecting route", "Rising sea ice concentration", "Katabatic wind squalls"], "recommendation": "Adopt recommended navigation plan.", "polarCodeCompliant": True, "status": "ACTIVE"},
        {"id": "REP-2026-0828-02", "vessel": "RV SARASWATI (IMO 9842104)", "voyageCode": "EXP-45-WEDDELL", "destination": "Antarctic Research Station", "assessmentTime": "2026-08-28 12:00 UTC", "assessor": "Antarctic Nav Decision Support Engine v3.4", "overallRisk": "LOW", "recommendedRoute": "ROUTE A (Open Water Leg)", "keyHazards": ["Polar Front crossing", "Isolated bergy bits"], "recommendation": "Maintain standard transit speed.", "polarCodeCompliant": True, "status": "ARCHIVED"}
    ]
