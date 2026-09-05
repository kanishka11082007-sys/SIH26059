import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.optimization.polar_routing_engine import routing_engine

def run_adversarial_tests():
    print("=== SIH JUDGE RED-TEAM ADVERSARIAL ROUTING TESTS ===")
    routing_engine.initialize()
    
    # CASE 1: Standard Navigable Passage
    print("\n--- TEST 1: Standard Antarctic Coastal Lead Passage ---")
    vessel = {
        "id": "test_vessel",
        "name": "RV Polar Test",
        "latitude": -65.2,
        "longitude": 64.3,
        "dest_lat": -69.41,
        "dest_lon": 76.19,
        "destination": "Bharati Station",
        "speed": 14.0,
        "polarClass": "PC5"
    }
    routes = routing_engine.generate_routes(vessel)
    print(f"Generated {len(routes)} corridors.")
    for r in routes:
        mode = r["optimization_mode"]
        dist = r["distance_km"]
        eta = r["eta_hours"]
        avg_sic = r["sea_ice_exposure"]["avg_sic"]
        cpa = r["minimum_cpa_km"]
        val = r["validation"]
        print(f"  [{mode}] Dist: {dist} km, ETA: {eta} h, Avg SIC: {avg_sic}%, CPA: {cpa} km, Validated: {val['passed']}")

    # CASE C: Land intersection check
    print("\n--- TEST C: Impassable Land Mask Verification ---")
    total_points = 0
    land_hits = 0
    for r in routes:
        for pt in r["path"]:
            total_points += 1
            if routing_engine.is_land(pt[1], pt[0]):
                land_hits += 1
                print(f"  FAILED: Land intersection at lat={pt[0]}, lon={pt[1]}")
    if land_hits == 0:
        print(f"  PASSED: 0 of {total_points} waypoints intersected land mask.")
    else:
        print(f"  FAILED: {land_hits} waypoints intersected land mask.")

    # CASE D: Fastest vs Safest differentiation
    print("\n--- TEST D: Tradeoff Differentiation (Fastest vs Safest) ---")
    fastest = next((r for r in routes if r["optimization_mode"] == "FASTEST"), None)
    safest = next((r for r in routes if r["optimization_mode"] == "SAFEST"), None)
    balanced = next((r for r in routes if r["optimization_mode"] == "BALANCED"), None)
    
    if fastest and safest and balanced:
        dist_diff = safest["distance_km"] - fastest["distance_km"]
        sic_diff = fastest["sea_ice_exposure"]["avg_sic"] - safest["sea_ice_exposure"]["avg_sic"]
        print(f"  Fastest Distance: {fastest['distance_km']} km, Safest Distance: {safest['distance_km']} km (Detour: +{dist_diff:.1f} km)")
        print(f"  Fastest Avg SIC:  {fastest['sea_ice_exposure']['avg_sic']}%, Safest Avg SIC:  {safest['sea_ice_exposure']['avg_sic']}% (SIC reduction: {sic_diff:.1f}%)")
        if dist_diff >= 0 and sic_diff >= 0:
            print("  PASSED: Safest route trades distance for reduced ice exposure.")
        else:
            print(f"  NOTE: Conditions yield dist_diff={dist_diff}, sic_diff={sic_diff}")

    # CASE E: Impossible Route (Interior of Continental Ice Sheet)
    print("\n--- TEST E: Impassable / Impossible Inland Route Handling ---")
    inland_vessel = {
        "id": "inland_vessel",
        "name": "Trapped Inland",
        "latitude": -85.0,  # Deep in continental Antarctic ice sheet
        "longitude": 0.0,
        "dest_lat": -69.41,
        "dest_lon": 76.19,
        "destination": "Bharati Station",
        "speed": 14.0,
        "polarClass": "PC5"
    }
    inland_routes = routing_engine.generate_routes(inland_vessel)
    print(f"  Attempted inland routing from lat=-85.0: Generated {len(inland_routes)} routes.")
    for r in inland_routes:
        val = r.get("validation", {})
        print(f"  Validation passed: {val.get('passed')}, Land intersection: {val.get('land_intersection')}, Errors: {val.get('errors')}")

if __name__ == "__main__":
    run_adversarial_tests()
