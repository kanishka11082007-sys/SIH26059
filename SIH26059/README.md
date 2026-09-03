# PolarNav — Intelligent Navigation & Safety for Antarctic Operations

**PolarNav** is an autonomous decision support platform designed for Antarctic maritime navigation. It delivers real-time polar situational awareness by combining sea-ice concentration tracking, iceberg trajectory and collision risk forecasting, POLARIS risk index assessment, and corridor routing optimization.

---

## 📁 Repository Architecture

```text
PolarNav/
├── frontend/             # Complete React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/   # Reusable UI components (PolarMap, telemetry HUDs, layout)
│   │   ├── pages/        # Application views (Overview, Navigation, Sea Ice, Route Optimization, Reports)
│   │   ├── services/     # External API services (Nominatim Geocoding API)
│   │   ├── data/         # Polar simulation datasets (vessels, waypoints, icebergs, sea-ice bands)
│   │   └── utils/        # Utility helpers and styling classes
│   ├── public/           # Static assets, SVG icons, and visual layers
│   ├── index.html        # Main HTML entry point
│   ├── package.json      # Frontend npm dependencies and scripts
│   ├── vite.config.ts    # Vite bundler and dev server configuration
│   ├── tsconfig*.json    # TypeScript configurations
│   ├── .env.example      # Example environment variables
│   └── .gitignore        # Frontend-specific ignore rules
│
├── backend/              # [RESERVED] Future Python / Node backend & maritime routing API layer
│   └── README.md
│
├── ml/                   # [RESERVED] Future ML models, PINN drift predictors & training pipelines
│   └── README.md
│
├── package.json          # Root workspace scripts
├── .gitignore            # Root git ignore rules
└── README.md             # Project documentation
```

---

## 🚢 Frontend Overview & Key Locations

The PolarNav frontend is fully implemented inside the `frontend/` directory.

| Component / Subsystem | Location | Description |
| :--- | :--- | :--- |
| **Interactive Polar Map** | `frontend/src/components/map/PolarMap.tsx` | Leaflet-based polar dark-matter map featuring custom vessel markers, heading vectors, iceberg radar hazard zones, and sea-ice concentration polygons. |
| **Navigation & Telemetry Page** | `frontend/src/pages/platform/NavigationPage.tsx` | Main vessel corridor view, live telemetry cards, waypoints list, met-ocean conditions, and real-time destination search. |
| **Location & Geocoding Service** | `frontend/src/services/geocodingService.ts` | OpenStreetMap Nominatim integration providing typed, debounced location searches and coordinate resolution. |
| **Route Optimization Page** | `frontend/src/pages/platform/RouteOptimizationPage.tsx` | Multi-corridor Pareto optimization comparing fuel burn, ice impact probability, and weather exposure. |
| **Iceberg Tracking Page** | `frontend/src/pages/platform/IcebergTrackingPage.tsx` | Tabular and geospatial tracking of tabular/bergy-bit targets with +6h to +48h drift horizon forecasting. |
| **Sea-Ice Intelligence Page** | `frontend/src/pages/platform/SeaIcePage.tsx` | Sea-ice concentration bands (0–100%), stage-of-development breakdown, and compression risk. |
| **Simulated Data & Scenarios** | `frontend/src/data/mock.ts` | Domain data models for polar vessels, waypoints, radar targets, environmental sensors, and ice conditions. |

---

## 🛠️ Major Frontend Technologies

- **Core Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite, PostCSS, Tailwind CSS
- **Mapping & Geospatial**: Leaflet 1.9, React-Leaflet 5.0, CartoDB Dark Matter tiles
- **Data Visualization**: Recharts (radar risk charts, environmental telemetry)
- **Icons & Styling**: Lucide Icons, Tailwind CSS, JetBrains Mono & Plus Jakarta Sans typography
- **External Integration**: OpenStreetMap Nominatim Search API (location geocoding)

---

## 🚀 Running the Frontend

### Prerequisites
- Node.js (v18 or higher)
- npm / yarn / pnpm

### Quick Start

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Run the linter**:
   ```bash
   npm run lint
   ```

---

## 🔮 Future Architecture (Backend & ML)

- **`backend/`**: Will host the backend service layer handling maritime graph routing engines, satellite SAR ingestion feeds, and live vessel AIS telemetry.
- **`ml/`**: Will host machine learning models including physics-informed iceberg drift predictors, SAR sea-ice segmentation CNNs, and POLARIS automated safety compliance rankers.
