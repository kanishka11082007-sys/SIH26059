import sys, os
from pathlib import Path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR / "src"))
import xarray as xr
import pandas as pd
import numpy as np

print('=== 1. TEST SEA-ICE PREDICTION ===')
from src.sea_ice.predict import load_model as load_sic_m, predict_grid, compute_risk_layer
model_sic, cfg_sic = load_sic_m()
ds_sic = xr.open_dataset(str(BACKEND_DIR / 'data' / 'raw' / 'sea_ice' / 'spatial_sic_monthly.nc'))
pred_grid = predict_grid(model_sic, ds_sic, time_idx=-1)
print('Single Grid Predict: Shape =', pred_grid['sic_forecast'].shape, 'Min =', float(pred_grid['sic_forecast'].min()), 'Max =', float(pred_grid['sic_forecast'].max()))
risk_ds = compute_risk_layer(pred_grid)
print('Risk layer categories generated:', np.unique(risk_ds['risk'].values))

print('\n=== 2. TEST ICEBERG PREDICTION ===')
from src.iceberg.predict import load_model as load_ib_m, predict_trajectory
model_ib, cfg_ib = load_ib_m()
init_df = pd.DataFrame([{
    'timestamp': '2026-08-29 00:00:00',
    'latitude': -68.0, 'longitude': -55.0, 'speed_kmh': 0.8,
    'bearing_deg': 45.0, 'major_axis_km': 2.0, 'minor_axis_km': 1.0
}])
traj = predict_trajectory(model_ib, init_df, n_steps=4, dt_hours=6)
print('Predicted Iceberg Trajectory (4 steps):')
for _, row in traj.iterrows():
    st = row['step']
    ts = row['timestamp']
    lat = row['latitude']
    lon = row['longitude']
    print(f"  Step {st} ({ts}): lat={lat:.4f}, lon={lon:.4f}")

print('\n=== 3. TEST DECISION ENGINE ROUTING ===')
from src.optimization.decision_engine import execute_navigation_decision, NavigationRequest
risk_grid_ds = xr.open_dataset(str(BACKEND_DIR / 'data' / 'processed' / 'navigation_risk_grid.nc'))
req = NavigationRequest(
    vessel_id='AAD-2015-16', vessel_name='Aurora Australis',
    start_lat=-65.0, start_lon=-64.0, dest_lat=-68.0, dest_lon=-70.0,
    cruising_speed_kn=12.0, risk_tolerance=0.7
)
res = execute_navigation_decision(req, risk_grid_ds)
print('Decision Engine Output Status:', res.get('status'))
if res.get('status') == 'success':
    rec = res['recommended_route']
    print(f"  Recommended Route: ID={rec['route_id']}, Dist={rec['distance_km']} km, Time={rec['travel_time_hours']}h, AvgRisk={rec['average_risk']}, Quality={rec['quality_score']}")
    print(f"  Alternatives: {len(res['alternatives'])}")
    for alt in res['alternatives']:
        print(f"    Alt ID={alt['route_id']}, Profile={alt['profile']}, Dist={alt['distance_km']} km, Risk={alt['average_risk']}")
    print('  Computation time:', res.get('computation_time_ms'), 'ms')

print('\n=== 4. TEST SEA-ICE MODEL EVALUATION METRICS ===')
from src.sea_ice.evaluate import compute_metrics
from src.sea_ice.features import create_features_from_xarray
df_sic_features = create_features_from_xarray(ds_sic)
feature_cols = ['lat', 'lon', 'month', 'day_of_year', 'sic_lag_1', 'sic_lag_2', 'sic_lag_3', 'sic_mean_3month']
X_sic = df_sic_features[feature_cols].values
y_sic = df_sic_features['target_sic'].values
y_sic_pred = model_sic.predict(X_sic)
metrics_sic = compute_metrics(y_sic, y_sic_pred)
print('Sea Ice Random Forest Metrics on Dataset (N={:,}):'.format(len(y_sic)), metrics_sic)

print('\n=== 5. TEST ICEBERG MODEL EVALUATION METRICS ===')
from src.iceberg.load import load_all_tracks, prepare_trajectory_features
df_ib_raw = load_all_tracks()
df_ib_feats = prepare_trajectory_features(df_ib_raw)
print(f'Total Raw Iceberg Points: {len(df_ib_raw):,}, Valid Trajectory Steps: {len(df_ib_feats):,}')
from src.iceberg.train import prepare_features, prepare_targets
X_ib = prepare_features(df_ib_feats).values
y_ib = prepare_targets(df_ib_feats).values
y_ib_pred = model_ib.predict(X_ib)
mae_lat = float(np.mean(np.abs(y_ib[:, 0] - y_ib_pred[:, 0])))
mae_lon = float(np.mean(np.abs(y_ib[:, 1] - y_ib_pred[:, 1])))
rmse_lat = float(np.sqrt(np.mean((y_ib[:, 0] - y_ib_pred[:, 0])**2)))
rmse_lon = float(np.sqrt(np.mean((y_ib[:, 1] - y_ib_pred[:, 1])**2)))
print(f'Iceberg Random Forest Metrics (N={len(y_ib):,}):')
print(f'  MAE Lat: {mae_lat:.4f} deg, MAE Lon: {mae_lon:.4f} deg')
print(f'  RMSE Lat: {rmse_lat:.4f} deg, RMSE Lon: {rmse_lon:.4f} deg')

print('Probe completed successfully.')
