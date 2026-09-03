"""
Audit Iceberg spatial coverage, demo region filtering, and track prediction.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from src.iceberg.load import load_iceberg_track, DATA_DIR
from src.iceberg.predict import load_model, predict_trajectory

# Define the SIH Antarctic Demo Region
DEMO_REGION = {
    "name": "Antarctic Peninsula + Bransfield Strait + South Shetland Islands",
    "min_lat": -68.0,
    "max_lat": -58.0,
    "min_lon": -70.0,
    "max_lon": -50.0
}

def audit_demo_region_icebergs():
    csv_files = sorted(DATA_DIR.glob("*.csv"))
    print(f"Total available BYU/NIC icebergs: {len(csv_files)}")
    
    peninsula_icebergs = []
    total_obs = 0
    
    for f in csv_files:
        ib = f.stem
        try:
            df = load_iceberg_track(ib)
            total_obs += len(df)
            
            # Check if any observation is inside the Antarctic Peninsula demo region
            in_region = df[
                (df["latitude"] >= DEMO_REGION["min_lat"]) &
                (df["latitude"] <= DEMO_REGION["max_lat"]) &
                (df["longitude"] >= DEMO_REGION["min_lon"]) &
                (df["longitude"] <= DEMO_REGION["max_lon"])
            ]
            if len(in_region) > 0:
                peninsula_icebergs.append({
                    "id": ib,
                    "total_pts": len(df),
                    "pts_in_region": len(in_region),
                    "lat_range": [float(df["latitude"].min()), float(df["latitude"].max())],
                    "lon_range": [float(df["longitude"].min()), float(df["longitude"].max())],
                    "last_lat": float(df["latitude"].iloc[-1]),
                    "last_lon": float(df["longitude"].iloc[-1]),
                    "last_time": str(df["timestamp"].iloc[-1])
                })
        except Exception as e:
            continue
            
    print(f"Total Iceberg Observations across all files: {total_obs:,}")
    print(f"Icebergs passing through Antarctic Peninsula Demo Region: {len(peninsula_icebergs)}")
    print("\nTop 10 Demo Region Icebergs:")
    for item in peninsula_icebergs[:10]:
        print(f" - {item['id'].upper()}: {item['pts_in_region']} pts in region, last pos: ({item['last_lat']:.2f}, {item['last_lon']:.2f}) on {item['last_time']}")
        
    return peninsula_icebergs

def test_single_iceberg_prediction(iceberg_id="b14"):
    print(f"\n=== Testing Real End-to-End Trajectory Forecast for Iceberg '{iceberg_id.upper()}' ===")
    df = load_iceberg_track(iceberg_id)
    print(f"Loaded {len(df)} historical observations for {iceberg_id}.")
    print(f"Start: {df['timestamp'].iloc[0]} @ ({df['latitude'].iloc[0]:.2f}, {df['longitude'].iloc[0]:.2f})")
    print(f"Latest: {df['timestamp'].iloc[-1]} @ ({df['latitude'].iloc[-1]:.2f}, {df['longitude'].iloc[-1]:.2f})")
    
    model, cfg = load_model()
    print(f"Loaded Random Forest model with config: {cfg}")
    
    # Predict multi-step (+6h, +12h, +24h, +36h, +48h)
    pred_df = predict_trajectory(model, df, n_steps=5, dt_hours=6)
    print("\nPredicted Trajectory Output:")
    print(pred_df[["step", "timestamp", "latitude", "longitude"]])

if __name__ == "__main__":
    pen_ibs = audit_demo_region_icebergs()
    test_single_iceberg_prediction("b14")
