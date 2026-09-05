import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.server import app

client = TestClient(app)

def test_api_security():
    print("=== SIH JUDGE RED-TEAM API SECURITY & ROBUSTNESS AUDIT ===")
    
    # 1. Invalid Vessel ID
    print("\n--- 1. Testing Invalid Vessel ID ---")
    r = client.get("/api/vessels/UNKNOWN_VESSEL_999")
    print(f"GET /api/vessels/UNKNOWN_VESSEL_999: HTTP {r.status_code}, Body: {r.json()}")
    assert r.status_code == 200
    assert "error" in r.json() or r.json().get("id") == "UNKNOWN_VESSEL_999"

    # 2. Malformed / Extreme Iceberg Horizons
    print("\n--- 2. Testing Malformed / Extreme Iceberg Horizons ---")
    for h in ["INVALID_HORIZON", "+9999H", "-500", "NaN", "null"]:
        r = client.get(f"/api/icebergs?time_horizon={h}")
        print(f"GET /api/icebergs?time_horizon={h}: HTTP {r.status_code}, Returned {len(r.json().get('icebergs', []))} icebergs")
        assert r.status_code == 200

    # 3. Invalid Iceberg ID & Trajectory
    print("\n--- 3. Testing Invalid Iceberg ID & Trajectory ---")
    r = client.get("/api/icebergs/NONEXISTENT_BERG_XYZ/trajectory?hours=-50")
    print(f"GET /api/icebergs/NONEXISTENT_BERG_XYZ/trajectory: HTTP {r.status_code}, Body: {r.json()}")
    assert r.status_code == 200
    assert "error" in r.json()

    # 4. Malformed Routes Optimize Payloads
    print("\n--- 4. Testing POST /api/routes/optimize with Malformed Inputs ---")
    # Empty payload
    r = client.post("/api/routes/optimize", json={})
    print(f"POST /api/routes/optimize with {{}}: HTTP {r.status_code}")
    
    # Coordinates out of bounds
    r = client.post("/api/routes/optimize", json={
        "start_lat": 999.0,
        "start_lon": -999.0,
        "dest_lat": 888.0,
        "dest_lon": 777.0
    })
    print(f"POST /api/routes/optimize with out-of-bounds coords: HTTP {r.status_code}, Body: {r.json()}")

    # Inland impossible route
    r = client.post("/api/routes/optimize", json={
        "start_lat": -85.0,
        "start_lon": 0.0,
        "dest_lat": -69.41,
        "dest_lon": 76.19
    })
    print(f"POST /api/routes/optimize with inland start (-85, 0): HTTP {r.status_code}, Status: {r.json().get('status')}")

    # 5. What-If Simulation Endpoint Robustness
    print("\n--- 5. Testing POST /api/simulation/what-if with Extreme / Malformed Inputs ---")
    # Empty payload
    r = client.post("/api/simulation/what-if", json={})
    print(f"POST /api/simulation/what-if with {{}}: HTTP {r.status_code}, Has baseline & scenario: {'baseline' in r.json() and 'scenario' in r.json()}")
    assert r.status_code == 200
    
    # Extreme delta values
    r = client.post("/api/simulation/what-if", json={
        "vessel_id": "rv_sagar_nidhi",
        "sea_ice_delta": 999.0,
        "iceberg_risk_multiplier": 50.0,
        "speed_delta_kn": -100.0,
        "selected_profile": "SAFEST"
    })
    print(f"POST /api/simulation/what-if with extreme deltas: HTTP {r.status_code}")
    res = r.json()
    print(f"  Recommended Action: {res.get('decision_summary', {}).get('recommended_action')}")
    print(f"  Dominant Threat: {res.get('decision_summary', {}).get('dominant_threat')}")
    print(f"  Recommendation: {res.get('decision_summary', {}).get('recommendation')}")
    assert r.status_code == 200

    # 6. Station directory invalid lookup
    print("\n--- 6. Testing Invalid Station Directory Lookup ---")
    r = client.get("/api/antarctic/stations/NON_EXISTENT_STATION_123")
    print(f"GET /api/antarctic/stations/NON_EXISTENT_STATION_123: HTTP {r.status_code}, Body: {r.json()}")
    assert r.status_code == 200
    assert "error" in r.json()

    print("\n>>> ALL API SECURITY & ROBUSTNESS TESTS COMPLETED SUCCESSFULLY <<<")

if __name__ == "__main__":
    test_api_security()
