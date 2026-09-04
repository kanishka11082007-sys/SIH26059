# PolarNav — Machine Learning & Forecasting Pipeline

## 1. Scope & Offline Training Architecture
To ensure extreme reliability and sub-second API response times in production (Render), all heavy model training is strictly conducted offline. The Render backend performs fast, deterministic inference:

```
[Historical AMSR2 Satellite Data]
                 ↓
      [Feature Engineering]
  - Lagged SIC (T-24h, T-48h)
  - Seasonal Sine/Cosine DOY
  - Sea Surface Temperature & 10m Wind
                 ↓
 [Offline Training (LightGBM / XGBoost)]
                 ↓
     [Model Validation & Export]
                 ↓
     [Render Fast Inference API]
         GET /api/forecast/sea-ice
```

## 2. Sea-Ice Concentration Forecasting
- **Engine**: Gradient boosted regression ensemble (`LightGBM` / `RandomForestRegressor`) predicting 24-hour and 72-hour future SIC delta across 6.25 km grid cells.
- **Uncertainty Bounds**: Accompanied by standard deviation quantile intervals (10th and 90th percentile predictions), giving captains clear confidence metrics rather than false certainty.

## 3. Iceberg Trajectory Kinematics
- **Physical Forcing Model**:
  $$\vec{v}_{iceberg} = \alpha \vec{v}_{ocean} + \beta \vec{v}_{wind} + \vec{v}_{coriolis}$$
  Where $\alpha \approx 0.70$ (deep ocean draft coupling) and $\beta \approx 0.02$ (above-water sail windage).
- **Uncertainty Ellipses**:
  Forecast horizons (T+6h, T+12h, T+18h, T+24h) include growing Gaussian uncertainty corridors expanding radially at $1.2\text{ km/h}$, visualized as dynamic safety buffer zones in MapLibre.
