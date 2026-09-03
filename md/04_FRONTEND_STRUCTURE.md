# Frontend Structure

## 1. Stack
Next.js + React + TypeScript + Tailwind CSS + shadcn/ui + MapLibre GL JS + ECharts.

## 2. Folder Structure
```text
frontend/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── forecast/
│   ├── iceberg/
│   ├── navigation/
│   ├── routes/
│   └── reports/
├── components/
│   ├── map/
│   ├── forecast/
│   ├── iceberg/
│   ├── navigation/
│   ├── charts/
│   ├── panels/
│   └── ui/
├── features/
│   ├── seaIce/
│   ├── iceberg/
│   ├── routing/
│   ├── weather/
│   └── vessel/
├── lib/
│   ├── api.ts
│   ├── map.ts
│   ├── formatting.ts
│   └── validation.ts
├── hooks/
├── types/
├── store/
└── public/
```

## 3. Main Screens
### Dashboard
- Current Antarctic conditions
- Active hazards
- Forecast summary
- Vessel status
- Latest recommended route

### Sea-Ice Forecast
- Interactive concentration layer
- Time slider
- Forecast horizon selector
- Uncertainty/confidence
- Region comparison

### Iceberg Monitor
- Detected iceberg markers
- Track history
- Predicted trajectory
- Uncertainty cone
- Closest approach estimate

### Navigation
- Origin/destination
- Vessel profile
- Departure time
- Safety constraints
- Optimization weights
- Route alternatives

### Route Result
- Map polyline
- Risk heatmap
- ETA
- Fuel estimate
- Hazard crossings
- Route confidence
- Alternative route comparison

## 4. State Management
Use lightweight client state for UI controls and server-state caching for API data. Keep large raster data out of global React state.

## 5. Performance
- Vector tiles for vector hazards.
- Raster tiles/COGs for large raster layers.
- Lazy-load heavy charts.
- Web workers for client-side geometry calculations when needed.
- Debounce map/filter changes.
- Cache immutable forecast layers.

## 6. UX Safety
Every recommendation should show:
- Why it was recommended
- Main hazards
- Forecast time
- Data timestamp
- Model version
- Confidence/uncertainty
