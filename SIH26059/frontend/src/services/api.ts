const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const url = API_BASE + endpoint;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  health: () => apiFetch<{status: string}>("/health"),
  vessels: () => apiFetch<{vessels: any[]}>("/vessels"),
  vessel: (id: string) => apiFetch<any>(`/vessels/${id}`),
  icebergs: (timeHorizon?: string) => {
    const qs = timeHorizon ? `?time_horizon=${timeHorizon}` : "";
    return apiFetch<{icebergs: any[]}>(`/icebergs${qs}`);
  },
  routes: (params?: { vesselId?: string; destId?: string; destLat?: number; destLon?: number; destName?: string } | string) => {
    if (typeof params === 'string') {
      return apiFetch<{routes: any[]}>(`/routes?vessel_id=${params}`);
    }
    const q = new URLSearchParams();
    if (params?.vesselId) q.append("vessel_id", params.vesselId);
    if (params?.destId) q.append("dest_id", params.destId);
    if (params?.destLat !== undefined) q.append("dest_lat", String(params.destLat));
    if (params?.destLon !== undefined) q.append("dest_lon", String(params.destLon));
    if (params?.destName) q.append("dest_name", params.destName);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<{routes: any[]}>(`/routes${qs}`);
  },
  metrics: () => apiFetch<Record<string, any>>("/metrics"),
  environmental: (timeStep?: string) => {
    const qs = timeStep ? `?time_step=${timeStep}` : "";
    return apiFetch<Record<string, any>>(`/environmental${qs}`);
  },
  seaIceSectors: (timeStep?: string) => {
    const qs = timeStep ? `?time_step=${timeStep}` : "";
    return apiFetch<{sectors: any[]}>(`/sea-ice-sectors${qs}`);
  },
  sicTimesteps: () => apiFetch<{timesteps: any[]}>("/sic/timesteps"),
  sicGrid: (timeStep?: string) => {
    const qs = timeStep ? `?time_step=${timeStep}` : "";
    return apiFetch<Record<string, any>>(`/sic/grid${qs}`);
  },
  riskGrid: (timeStep?: string) => {
    const qs = timeStep ? `?time_step=${timeStep}` : "";
    return apiFetch<Record<string, any>>(`/risk/grid${qs}`);
  },
  waypoints: () => apiFetch<{waypoints: any[]}>("/waypoints"),
  alerts: () => apiFetch<{alerts: any[]}>("/alerts"),
  reports: () => apiFetch<{reports: any[]}>("/reports"),
  optimize: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Record<string, any>>("/optimize" + qs);
  },
  stations: (params?: {region?: string; coastal_only?: boolean; query?: string}) => {
    const q = new URLSearchParams();
    if (params?.region) q.append("region", params.region);
    if (params?.coastal_only) q.append("coastal_only", "true");
    if (params?.query) q.append("query", params.query);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<{source: string; total_stations: number; stations: any[]}>(`/antarctic/stations${qs}`);
  },
  station: (id: string) => apiFetch<any>(`/antarctic/stations/${id}`),
  stationGeojson: () => apiFetch<any>("/antarctic/stations/geojson"),
  validateBharati: () => apiFetch<any>("/antarctic/stations/validate/bharati"),
  landMask: () => apiFetch<any>("/antarctic/land-mask"),
  fleet: (preferLive: boolean = true) => apiFetch<{data_status: string; source: string; badge: string; total_vessels: number; vessels: any[]}>(`/antarctic/vessels?prefer_live=${preferLive}`),
  antarcticVessels: (preferLive: boolean = true) => apiFetch<{data_status: string; source: string; badge: string; total_vessels: number; vessels: any[]}>(`/antarctic/vessels?prefer_live=${preferLive}`),
  antarcticVessel: (mmsi: string) => apiFetch<any>(`/antarctic/vessels/${mmsi}`),
  navigationScenario: () => apiFetch<{vessel: any; destination: any; mode: string; source: string; primary_region: string}>("/navigation/scenario"),
  sentinelScenes: () => apiFetch<{scenes: any[]; total_scenes: number}>("/sentinel/scenes"),
  sentinelDetections: (sceneIdx: number = 0) => apiFetch<any>(`/sentinel/detections?scene_idx=${sceneIdx}`),
  sentinelMetrics: () => apiFetch<any>("/sentinel/metrics"),
  environmentStatus: () => apiFetch<any>("/environment/status"),
  seaIce: (lat: number = -65.0, lon: number = -64.0) => apiFetch<any>(`/sea-ice?lat=${lat}&lon=${lon}`),
  seaIceForecast: (lat: number = -65.0, lon: number = -64.0) => apiFetch<any>(`/sea-ice/forecast?lat=${lat}&lon=${lon}`),
  oceanCurrents: (lat: number = -65.0, lon: number = -64.0) => apiFetch<any>(`/ocean-currents?lat=${lat}&lon=${lon}`),
  oceanCurrentsGrid: () => apiFetch<any>("/ocean-currents/grid"),
  weather: (lat: number = -65.0, lon: number = -64.0) => apiFetch<any>(`/weather?lat=${lat}&lon=${lon}`),
  bathymetry: (lat: number = -65.0, lon: number = -64.0) => apiFetch<any>(`/bathymetry?lat=${lat}&lon=${lon}`),
  intelligenceModels: () => apiFetch<any>("/intelligence/models"),
  dbStatus: () => apiFetch<any>("/db/status"),
};

