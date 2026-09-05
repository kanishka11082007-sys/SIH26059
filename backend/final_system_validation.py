import os
import sys
import time
import json
from pathlib import Path

# Add backend and src to path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR / "src"))

from fastapi.testclient import TestClient
from app.server import app

def run_final_validation():
    print("=================================================================")
    print("      SIH 2026 FINAL ENGINEERING & RED-TEAM VALIDATION SUITE     ")
    print("=================================================================")
    start_all = time.time()
    results = {}

    client = TestClient(app)

    # 1. ML Model Loading & Artifact Integrity
    print("\n[1/5] Testing ML Model Loading & Metrics Integrity...")
    t0 = time.time()
    try:
        from src.sea_ice.train import load_saved_model as load_sic_model
        from src.iceberg.trajectory_service import iceberg_trajectory_service
        import joblib

        sic_model = load_sic_model()
        assert sic_model is not None, "SIC model failed to load"
        
        sar_path = BACKEND_DIR / "models" / "sentinel_sar_detector.joblib"
        sar_model = joblib.load(sar_path)
        assert sar_model is not None, "SAR model failed to load"

        assert iceberg_trajectory_service._model is not None, "Iceberg model failed to load"

        # Check metrics files
        with open(BACKEND_DIR / "models" / "sea_ice_metrics.json") as f:
            sic_m = json.load(f)
            assert sic_m["test_mae"] == 0.0401
            assert sic_m["test_r2"] == 0.8861

        with open(BACKEND_DIR / "models" / "iceberg_metrics.json") as f:
            ib_m = json.load(f)
            assert ib_m["mean_position_error_km"] == 1.7

        with open(BACKEND_DIR / "models" / "sentinel_feature_config.json") as f:
            s1_m = json.load(f)
            assert round(s1_m["metrics"]["test_accuracy"], 4) == 0.9847

        results["ml_integrity"] = {"status": "PASSED", "duration_ms": round((time.time() - t0) * 1000, 2)}
        print(f"  --> PASSED: 3 models loaded, verified test metrics (SIC MAE: {sic_m['test_mae']}, Iceberg error: {ib_m['mean_position_error_km']} km, SAR Acc: {round(s1_m['metrics']['test_accuracy']*100, 2)}%) [{results['ml_integrity']['duration_ms']} ms]")
    except Exception as e:
        results["ml_integrity"] = {"status": "FAILED", "error": str(e)}
        print(f"  --> FAILED: {e}")

    # 2. PolarRoutingEngine & Adversarial Routing Cases
    print("\n[2/5] Testing PolarRoutingEngine & Adversarial Routing Cases...")
    t0 = time.time()
    try:
        from src.optimization.polar_routing_engine import routing_engine
        routing_engine.initialize()

        # Case A & D: Coastal Passage & Fastest vs Safest
        vessel = {
            "id": "rv_sagar_nidhi",
            "name": "R/V Sagar Nidhi",
            "latitude": -65.2,
            "longitude": 64.3,
            "dest_lat": -69.41,
            "dest_lon": 76.19,
            "destination": "Bharati Research Station",
            "speed": 14.0,
            "polarClass": "PC5"
        }
        routes = routing_engine.generate_routes(vessel)
        assert len(routes) == 3, f"Expected 3 corridors, got {len(routes)}"

        # Case C: Zero land intersection
        land_hits = 0
        for r in routes:
            assert r["validation"]["passed"] is True, f"Route {r['id']} failed validation"
            for pt in r["path"]:
                if routing_engine.is_land(pt[1], pt[0]):
                    land_hits += 1
        assert land_hits == 0, f"Detected {land_hits} land intersections!"

        # Differentiation
        fastest = next(r for r in routes if r["optimization_mode"] == "FASTEST")
        safest = next(r for r in routes if r["optimization_mode"] == "SAFEST")
        assert fastest["distance_km"] <= safest["distance_km"], "Fastest route should be shorter in distance than Safest"
        assert fastest["sea_ice_exposure"]["avg_sic"] >= safest["sea_ice_exposure"]["avg_sic"], "Safest route should have lower or equal ice exposure"

        # Case E: Inland impossible route
        inland_v = {
            "id": "inland_test",
            "name": "Trapped",
            "latitude": -85.0,
            "longitude": 0.0,
            "dest_lat": -69.41,
            "dest_lon": 76.19,
            "destination": "Bharati",
            "speed": 14.0,
            "polarClass": "PC5"
        }
        inland_routes = routing_engine.generate_routes(inland_v)
        assert all(not r["validation"]["passed"] for r in inland_routes), "Inland routes should fail validation"

        results["routing_engine"] = {"status": "PASSED", "duration_ms": round((time.time() - t0) * 1000, 2)}
        print(f"  --> PASSED: Routing validated (Cases A, C, D, E verified) [{results['routing_engine']['duration_ms']} ms]")
    except Exception as e:
        results["routing_engine"] = {"status": "FAILED", "error": str(e)}
        print(f"  --> FAILED: {e}")

    # 3. Decision Intelligence & What-If Analysis
    print("\n[3/5] Testing Decision Intelligence & What-If Endpoint...")
    t0 = time.time()
    try:
        payload = {
            "vessel_id": "rv_sagar_nidhi",
            "dest_id": "bharati",
            "iceberg_drift_km": 30.0,
            "sic_delta_pct": 20.0,
            "wind_gust_kn": 25.0
        }
        res = client.post("/api/simulation/what-if", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        body = res.json()
        assert body["status"] == "SCENARIO_EVALUATED"
        assert "decision_summary" in body
        assert "dominant_threat" in body["decision_summary"]
        assert "recommended_action" in body["decision_summary"]
        assert "difference" in body
        assert "distance_delta_km" in body["difference"]

        results["decision_intelligence"] = {"status": "PASSED", "duration_ms": round((time.time() - t0) * 1000, 2)}
        print(f"  --> PASSED: Decision intelligence verified ({body['decision_summary']['recommended_action']}) [{results['decision_intelligence']['duration_ms']} ms]")
    except Exception as e:
        results["decision_intelligence"] = {"status": "FAILED", "error": str(e)}
        print(f"  --> FAILED: {e}")

    # 4. API Endpoints Regression & Security Suite
    print("\n[4/5] Testing API Endpoints Regression & Security Suite...")
    t0 = time.time()
    endpoints = [
        ("GET", "/api/vessels", 200),
        ("GET", "/api/vessels/rv_sagar_nidhi", 200),
        ("GET", "/api/navigation/scenario", 200),
        ("GET", "/api/antarctic/stations", 200),
        ("GET", "/api/antarctic/stations/validate/bharati", 200),
        ("GET", "/api/icebergs", 200),
        ("GET", "/api/icebergs?time_horizon=+24H", 200),
        ("GET", "/api/icebergs/A23A/trajectory?hours=48", 200),
        ("GET", "/api/routes", 200),
        ("GET", "/api/sea-ice-sectors", 200),
        ("GET", "/api/environmental", 200),
        ("GET", "/api/fleet", 200),
        ("GET", "/api/antarctic/vessels", 200),
        ("POST_JSON_200", "/api/navigation/emergency", {"vessel_id": "rv_sagar_nidhi", "force_simulation": True}),
        ("GET", "/api/sic/timesteps", 200),
        # Security test: out of bounds coords returns 400
        ("POST_JSON_400", "/api/routes/optimize", {"start_lat": 999.0, "start_lon": 0.0, "dest_lat": -70.0, "dest_lon": 10.0}),
        # Security test: inland impossible route returns FAILED_NO_NAVIGABLE_ROUTE
        ("POST_JSON_INLAND", "/api/routes/optimize", {"start_lat": -85.0, "start_lon": 0.0, "dest_lat": -69.41, "dest_lon": 76.19})
    ]

    api_failures = []
    for method, path, expected in endpoints:
        try:
            if method == "GET":
                r = client.get(path)
                assert r.status_code == expected, f"Expected {expected}, got {r.status_code}"
            elif method == "POST_JSON_200":
                r = client.post(path, json=expected)
                assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            elif method == "POST_JSON_400":
                r = client.post(path, json=expected)
                assert r.status_code == 400, f"Expected 400 for out-of-bounds, got {r.status_code}"
            elif method == "POST_JSON_INLAND":
                r = client.post(path, json=expected)
                assert r.status_code == 200
                assert r.json().get("status") == "FAILED_NO_NAVIGABLE_ROUTE"
        except Exception as ex:
            api_failures.append(f"{method} {path}: {ex}")

    if not api_failures:
        results["api_regression"] = {"status": "PASSED", "endpoints_tested": len(endpoints), "duration_ms": round((time.time() - t0) * 1000, 2)}
        print(f"  --> PASSED: All {len(endpoints)} API regression & security contracts verified [{results['api_regression']['duration_ms']} ms]")
    else:
        results["api_regression"] = {"status": "FAILED", "failures": api_failures}
        print(f"  --> FAILED: {len(api_failures)} endpoint failures: {api_failures}")

    # 5. Summary
    total_time = round(time.time() - start_all, 2)
    print("\n=================================================================")
    all_passed = all(v.get("status") == "PASSED" for v in results.values())
    if all_passed:
        print(f"   >>> ALL RED-TEAM SYSTEM VALIDATION CHECKS PASSED ({total_time}s) <<<")
    else:
        print(f"   >>> WARNING: SOME CHECKS FAILED ({total_time}s) <<<")
    print("=================================================================\n")
    return results

if __name__ == "__main__":
    res = run_final_validation()
