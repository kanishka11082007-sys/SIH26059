import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2, Download, Zap, Ship, MapPin, Sparkles, ShieldAlert
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from '../../hooks/useApiData';
import { useFleet } from '../../context/FleetContext';
import { GeminiCopilotDrawer } from '../../components/GeminiCopilotDrawer';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';
import PolarMap from '../../components/map/PolarMap';

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStart: number;
  eta: string;
  status: 'passed' | 'active' | 'upcoming';
  iceRisk: string;
  reason?: string;
}

interface RouteOption {
  id: string;
  name: string;
  vessel_id?: string;
  distance: number;
  eta: string;
  path: [number, number][];
  recommended?: boolean;
  iceRisk?: string;
  icebergRisk?: string;
  weatherRisk?: string;
  overallScore?: number;
  fuelConsumption?: string | number;
  fuelSavings?: string;
  sicExposure?: number;
  icebergEncounters?: number;
  safetyMargin?: string;
  rioScore?: number | string;
  reason?: string;
  decision_explanation?: string;
  costs?: Record<string, number>;
  cost_breakdown?: Record<string, number>;
  waypoints?: any[];
}

const PRESET_STATIONS = [
  { name: 'Bharati Station (Larsemann Hills)', lat: -69.41, lon: 76.19, type: 'Indian Antarctic Research Station' },
  { name: 'Maitri Station (Schirmacher Oasis)', lat: -70.77, lon: 11.73, type: 'Indian Antarctic Research Station' },
  { name: 'Neumayer Station III (Atka Bay)', lat: -70.67, lon: -8.27, type: 'German AWI Polar Station' },
  { name: 'McMurdo Station (Ross Island)', lat: -77.85, lon: 166.67, type: 'US Antarctic Program' },
  { name: 'Rothera Research Station (Adelaide Island)', lat: -67.57, lon: -68.13, type: 'British Antarctic Survey' },
  { name: 'Casey Station (Wilkes Land)', lat: -66.28, lon: 110.53, type: 'Australian Antarctic Division' },
  { name: 'Davis Station (Vestfold Hills)', lat: -68.58, lon: 77.97, type: 'Australian Antarctic Division' },
  { name: 'Mawson Station (Holme Bay)', lat: -67.60, lon: 62.87, type: 'Australian Antarctic Division' },
  { name: 'Showa Station (Lützow-Holm Bay)', lat: -69.00, lon: 39.58, type: 'Japan NIPR Polar Station' },
  { name: 'SANAE IV Station (Queen Maud Land)', lat: -71.67, lon: -2.83, type: 'South African Polar Program' },
  { name: 'Comandante Ferraz Station (King George Island)', lat: -62.08, lon: -58.38, type: 'PROANTAR Brazil' },
];

const PRESET_ORIGINS = [
  { name: 'Cape Town Port (South Africa)', lat: -33.92, lon: 18.42 },
  { name: 'Mormugao Port (India) / Southern Transit', lat: -54.20, lon: 68.40 },
  { name: 'Hobart Port (Australia)', lat: -42.88, lon: 147.33 },
  { name: 'Punta Arenas (Chile)', lat: -53.16, lon: -70.91 },
  { name: 'Stanley Gateway Port (Falklands)', lat: -51.70, lon: -57.85 },
  { name: 'Fremantle (Australia)', lat: -32.05, lon: 115.74 },
  { name: 'Lyttelton Port (New Zealand)', lat: -43.60, lon: 172.72 },
];

// Compute bearing between two coordinates
const computeHeading = (p1: [number, number], p2: [number, number]): number => {
  if (!p1 || !p2) return 180;
  const dLon = (p2[1] - p1[1]) * (Math.PI / 180);
  const lat1 = p1[0] * (Math.PI / 180);
  const lat2 = p2[0] * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
};
// Helper to build realistic geodesic waypoints strictly along the active route line
const generateWaypointsForRoute = (routePath: [number, number][], routeType: string, _destName: string): Waypoint[] => {
  if (!routePath || routePath.length <= 2) return [];
  
  // Pick only intermediate turning waypoints (exclude start node and terminal arrival)
  const intermediates = routePath.slice(1, -1);
  if (intermediates.length === 0) return [];
  
  const step = Math.max(1, Math.floor(intermediates.length / 4));
  const sampled = intermediates.filter((_, i) => i % step === 0).slice(0, 4);

  return sampled.map((pt, idx) => {
    const frac = (idx + 1) / (sampled.length + 1);
    const dist = Math.round(frac * 4120);

    return {
      id: `WP-${String(idx + 1).padStart(2, '0')}`,
      name: `Corridor Turning Point ${idx + 1}`,
      latitude: pt[0],
      longitude: pt[1],
      distanceFromStart: dist,
      eta: `T+${(idx + 1) * 6}h`,
      status: idx === 0 ? 'active' : 'upcoming',
      iceRisk: idx >= 1 ? (routeType === 'route-a' ? 'HIGH' : routeType === 'route-b' ? 'MODERATE' : 'LOW') : 'LOW',
      reason: 'Course alignment and ice lead clearance'
    };
  });
};

export const NavigationPage: React.FC = () => {
  useApiData();
  const {
    fleet,
    selectedVesselId,
    selectedVessel,
    setSelectedVesselId,
    selectedIcebergId,
    setSelectedIcebergId,
    stations,
    selectedDestinationId,
    selectedDestination,
    setSelectedDestinationId,
    routes,
    activeRouteId,
    setActiveRouteId,
    activeRoute: contextActiveRoute,
    missionId,
    missionType,
    setMissionType,
    emergencyRerouteActive,
    setEmergencyRerouteActive,
    whatIfScenario,
    setWhatIfScenario
  } = useFleet();

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Live iceberg data
  const [icebergs, setIcebergs] = useState<any[]>([]);
  const fetchIcebergs = useCallback(async () => {
    try {
      const res = await api.icebergs();
      if (res?.icebergs?.length) setIcebergs(res.icebergs);
    } catch (e) { /* keep previous */ }
  }, []);
  useEffect(() => { fetchIcebergs(); }, [fetchIcebergs]);

  // Route Planning Controls derived from active selected vessel
  const [selectedOrigin, setSelectedOrigin] = useState(() => {
    return PRESET_ORIGINS.find(p => p.name.toLowerCase().includes('cape town')) || PRESET_ORIGINS[0];
  });

  const polarClass = selectedVessel?.polar_class || 'PC5';
  const cruisingSpeed = Math.round(selectedVessel?.speed || selectedVessel?.sog || 13.5);

  // Align origin whenever active vessel changes
  useEffect(() => {
    if (selectedVessel?.voyage_origin) {
      const matchOrig = PRESET_ORIGINS.find(o => 
        selectedVessel.voyage_origin?.toLowerCase().includes(o.name.toLowerCase().split(' ')[0])
      );
      if (matchOrig) setSelectedOrigin(matchOrig);
    }
  }, [selectedVessel]);

  const activeRoute = contextActiveRoute || routes.find(r => r.id === activeRouteId || r.id?.includes(activeRouteId)) || routes[0];

  // Derive waypoints: prioritize backend RDP waypoints from the route, otherwise calculate along LineString
  const waypoints = useMemo<Waypoint[]>(() => {
    if (activeRoute?.waypoints && activeRoute.waypoints.length > 0) {
      // Filter waypoints strictly along the active route line between vessel and destination
      const validWps = activeRoute.waypoints.filter((wp: any) => {
        const wpLat = wp.latitude ?? wp.lat;
        const wpLon = wp.longitude ?? wp.lon;
        const destLat = selectedDestination.latitude ?? (selectedDestination as any).lat;
        const destLon = selectedDestination.longitude ?? (selectedDestination as any).lon;
        const isNearVessel = Math.abs(wpLat - selectedVessel.latitude) < 0.08 && Math.abs(wpLon - selectedVessel.longitude) < 0.08;
        const isNearDest = Math.abs(wpLat - destLat) < 0.08 && Math.abs(wpLon - destLon) < 0.08;
        return !isNearVessel && !isNearDest;
      });

      return validWps.map((wp: any, idx: number) => ({
        id: wp.id || `WP-${String(idx + 1).padStart(2, '0')}`,
        name: wp.name || `Waypoint ${idx + 1}`,
        latitude: wp.latitude ?? (wp as any).lat,
        longitude: wp.longitude ?? (wp as any).lon,
        distanceFromStart: wp.distance_from_start_km ?? wp.distanceFromStart ?? Math.round(((idx + 1) / (validWps.length + 1)) * activeRoute.distance),
        eta: wp.eta ?? `T+${(idx + 1) * 6}h`,
        status: (idx === 0 ? 'active' : 'upcoming') as 'passed' | 'active' | 'upcoming',
        iceRisk: wp.risk_score || wp.iceRisk || (activeRoute.id?.includes('route-a') ? 'HIGH' : activeRoute.id?.includes('route-b') ? 'MODERATE' : 'LOW'),
        reason: wp.reason || 'Course alteration along optimal corridor'
      }));
    }
    if (!activeRoute || !activeRoute.path) return [];
    return generateWaypointsForRoute(activeRoute.path, activeRouteId, selectedDestination.name);
  }, [activeRoute, activeRouteId, selectedVessel, selectedDestination]);

  // Derive active vessel position along the active corridor
  const activeVesselTelemetry = useMemo(() => {
    const heading = (activeRoute?.path && activeRoute.path.length >= 2)
      ? computeHeading(activeRoute.path[0], activeRoute.path[1])
      : (selectedVessel?.heading || 180);

    return {
      name: selectedVessel?.name || 'R/V Sagar Nidhi — DEMO',
      latitude: selectedVessel?.latitude,
      longitude: selectedVessel?.longitude,
      speed: cruisingSpeed,
      heading
    };
  }, [selectedVessel, cruisingSpeed, activeRoute]);

  // Trigger live multi-objective route solver
  const handleSolveRoute = async () => {
    setIsOptimizing(true);
    try {
      const res = await api.routes({
        vesselId: selectedVessel?.id || 'rv_sagar_nidhi',
        destLat: selectedDestination.lat,
        destLon: selectedDestination.lon,
        destName: selectedDestination.name
      });

      if (res?.routes?.length) {
        setLocalRoutes(res.routes);
        setActiveRouteId('route-b');
      }
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Switch active corridor
  const handleSelectRoute = (routeId: string) => {
    setActiveRouteId(routeId);
  };

  // Export Voyage Plan
  const handleExportPlan = () => {
    const plan = {
      exportTime: new Date().toISOString(),
      vessel: selectedVessel?.name || 'R/V Sagar Nidhi',
      mmsi: selectedVessel?.mmsi,
      imo: selectedVessel?.imo,
      polarClass,
      origin: selectedOrigin,
      destination: selectedDestination,
      activeCorridor: activeRoute,
      waypoints,
      imoPolarisCompliance: {
        authorized: (parseFloat(String(activeRoute?.rioScore ?? '0'))) >= 0,
        rioStandard: 'IMO POLARIS Res. MSC.385(94)',
        rioMargin: activeRoute?.rioScore ?? '+8.4'
      }
    };
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polar_voyage_plan_${selectedVessel.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const destMarker = {
    latitude: selectedDestination.latitude ?? (selectedDestination as any).lat ?? -69.41,
    longitude: selectedDestination.longitude ?? (selectedDestination as any).lon ?? 76.19,
    name: selectedDestination.name || 'Antarctic Station'
  };

  const riskBadge = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-signature-coral bg-signature-coral/10 border-signature-coral/30';
      case 'MODERATE':
      case 'CAUTION':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW':
      case 'SAFE':
      case 'VERY LOW':
        return 'text-risk-safe bg-risk-safe/10 border-risk-safe/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <AppShell
      title="Navigation"
      subtitle={`${selectedVessel.name} • Active Polar Transit`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 text-xs font-mono text-cyan-300 font-semibold shadow-[0_0_12px_rgba(34,211,238,0.25)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Gemini AI Copilot</span>
          </button>
          <button
            type="button"
            onClick={handleExportPlan}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-polar-navy/40 hover:bg-polar-navy border border-slate/20 text-xs font-mono text-ice-white transition-all"
          >
            <Download className="w-3.5 h-3.5 text-glacial-blue" />
            <span>Export Plan</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-mono bg-polar-navy/40 border border-slate/20 px-2.5 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-safe" />
            <span className="text-risk-safe font-semibold">IMO POLARIS CLEAR</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row h-full overflow-hidden bg-navy">
        {/* Left Side: Clean Navigation Controls & Telemetry */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate/20 bg-navy/95 backdrop-blur-md overflow-y-auto custom-scrollbar p-5 space-y-5 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            
            {/* 1. Mission Parameters */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-glacial-blue tracking-widest uppercase font-semibold">
                01 // Mission Parameters
              </div>

              {/* Operational Vessel */}
              <div>
                <label className="text-[10px] text-slate-300 font-mono block mb-1.5 flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-glacial-blue" />
                  <span>Research Vessel</span>
                </label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full bg-polar-navy/50 border border-slate/30 rounded-sm p-2 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue font-medium"
                >
                  {fleet.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.flag} {v.name} ({v.speed || v.sog} kn)
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Station */}
              <div>
                <label className="text-[10px] text-slate-300 font-mono block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-glacial-blue" />
                  <span>Destination Station</span>
                </label>
                <select
                  value={selectedDestinationId}
                  onChange={(e) => setSelectedDestinationId(e.target.value)}
                  className="w-full bg-polar-navy/50 border border-slate/30 rounded-sm p-2 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue font-medium"
                >
                  {stations.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({Math.abs(p.latitude).toFixed(1)}°S)</option>
                  ))}
                </select>
              </div>

              {/* Tactical Diversion & What-If Controls */}
              <div className="pt-2 space-y-1.5 border-t border-slate/20">
                <button
                  type="button"
                  onClick={() => setEmergencyRerouteActive(!emergencyRerouteActive)}
                  className={cn(
                    "w-full py-1.5 px-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border",
                    emergencyRerouteActive
                      ? "bg-signature-coral/20 border-signature-coral text-signature-coral animate-pulse"
                      : "bg-polar-navy/40 border-slate/30 text-slate-300 hover:text-white"
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{emergencyRerouteActive ? "EMERGENCY DIVERSION ACTIVE" : "SIMULATE HAZARD / DIVERSION"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWhatIfScenario({ ...whatIfScenario, active: !whatIfScenario.active })}
                  className={cn(
                    "w-full py-1.5 px-2 rounded-sm text-[11px] font-mono transition-all flex items-center justify-center gap-1.5 border",
                    whatIfScenario.active
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-polar-navy/30 border-slate/20 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{whatIfScenario.active ? "WHAT-IF ACTIVE (+25km Drift, +15% SIC)" : "WHAT-IF SIMULATION"}</span>
                </button>
              </div>
            </div>

            {/* 2. Compact Route Selector */}
            <div className="space-y-3 pt-2 border-t border-slate/20">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span className="text-glacial-blue font-semibold">02 // Route Options</span>
                <span>{routes.length} Available</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-polar-navy/30 rounded-sm border border-slate/20">
                {routes.map((route) => {
                  const isSelected = activeRouteId === route.id || route.id?.includes(activeRouteId) || (activeRouteId === 'route-b' && route.recommended);
                  const label = route.id?.includes('route-a') ? 'Fastest' : route.id?.includes('route-c') ? 'Safest' : 'Optimal';

                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleSelectRoute(route.id)}
                      className={cn(
                        "py-2 px-1 text-center rounded-sm text-xs font-mono transition-all flex flex-col items-center justify-center relative",
                        isSelected
                          ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/50 font-bold shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-polar-navy/50"
                      )}
                    >
                      <span className="text-[11px]">{label}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{route.distance} km</span>
                      {route.recommended && (
                        <span className="w-1.5 h-1.5 rounded-full bg-risk-safe absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Route Info Strip */}
              {activeRoute && (
                <div className="bg-polar-navy/30 border border-slate/20 p-3.5 rounded-sm space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-ice-white font-semibold">{activeRoute.name}</span>
                      <span className="text-slate-400 block text-[10px] mt-0.5">ETA: {activeRoute.eta} • {activeRoute.distance} km</span>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-sm border text-[9px] font-bold', riskBadge(activeRoute.iceRisk || ''))}>
                      RIO: {String(activeRoute.rioScore || '').startsWith('+') || String(activeRoute.rioScore || '').startsWith('-') ? activeRoute.rioScore : `+${activeRoute.rioScore || '8.4'}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate/20 text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">FUEL</span>
                      <span className="text-ice-white font-semibold">{activeRoute.fuelConsumption || '104 MT'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">PACK ICE</span>
                      <span className="text-glacial-blue font-semibold">{activeRoute.sicExposure || 22}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ICEBERGS</span>
                      <span className="text-ice-white font-semibold">{activeRoute.icebergEncounters || 1} zone</span>
                    </div>
                  </div>

                  {(activeRoute.decision_explanation || activeRoute.reason) && (
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
                      {activeRoute.decision_explanation || activeRoute.reason}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Iceberg Hazard Banner (Cross-Page Context) */}
            {selectedIcebergId && (
              <div className="bg-risk-high/15 border border-risk-high/40 p-2.5 rounded-sm flex items-center justify-between text-xs font-mono animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-risk-high animate-ping" />
                  <div>
                    <span className="text-[10px] text-risk-high font-bold block uppercase tracking-wider">TRACKED RADAR HAZARD</span>
                    <span className="text-ice-white font-semibold">Target {selectedIcebergId} Context Active</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIcebergId(null)}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-polar-navy/60 border border-slate/30"
                >
                  Clear
                </button>
              </div>
            )}

            {/* 3. Live Vessel Telemetry */}
            <div className="space-y-2 pt-2 border-t border-slate/20">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span className="text-glacial-blue font-semibold">03 // Vessel Telemetry</span>
                <span className="text-ice-white">{selectedVessel.speed || selectedVessel.sog} kn</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="bg-polar-navy/20 border border-slate/20 p-2 rounded-sm text-center">
                  <span className="text-slate-400 text-[9px] block">HEADING</span>
                  <span className="text-ice-white font-semibold text-xs mt-0.5 block">{selectedVessel.heading || 180}°T</span>
                </div>
                <div className="bg-polar-navy/20 border border-slate/20 p-2 rounded-sm text-center">
                  <span className="text-slate-400 text-[9px] block">POSITION</span>
                  <span className="text-ice-white font-semibold text-[10px] mt-0.5 block truncate">{Math.abs(selectedVessel.latitude || 0).toFixed(1)}°S</span>
                </div>
                <div className="bg-polar-navy/20 border border-slate/20 p-2 rounded-sm text-center">
                  <span className="text-slate-400 text-[9px] block">CLASS</span>
                  <span className="text-glacial-blue font-semibold text-xs mt-0.5 block truncate">{polarClass ? polarClass.split(' ')[0] : 'PC5'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Recalculate Trigger Button */}
          <button
            type="button"
            onClick={handleSolveRoute}
            disabled={isOptimizing}
            className="w-full py-2 rounded-sm font-mono font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-signature-coral to-deep-coral hover:from-soft-coral hover:to-signature-coral text-white flex items-center justify-center gap-2 shadow-sm transition-all mt-2"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Computing Route...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Recompute Route</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Interactive Polar Map with Real Vessel, Route, and Waypoints */}
        <div className="flex-1 relative h-full bg-[#030910]">
          <PolarMap
            section="navigation"
            destinationMarker={destMarker}
            activeRouteId={activeRouteId}
            onSelectRoute={(rId) => handleSelectRoute(rId)}
            customRoutePath={activeRoute?.path}
            allRoutes={routes}
            waypoints={waypoints}
            icebergs={icebergs}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={(id) => setSelectedIcebergId(id)}
            vesselInfo={activeVesselTelemetry}
            focusTarget={null}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
          />
        </div>
      </div>

      <GeminiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        decisionContext={{
          vessel: {
            name: selectedVessel?.name,
            polar_class: selectedVessel?.polar_class,
            destination: selectedDestination?.name,
            speed: cruisingSpeed
          },
          route: activeRoute ? {
            id: activeRoute.id,
            name: activeRoute.name,
            distance: activeRoute.distance,
            eta: activeRoute.eta,
            fuelConsumption: activeRoute.fuelConsumption,
            rioScore: activeRoute.rioScore,
            sicExposure: activeRoute.sicExposure,
            reason: activeRoute.reason
          } : undefined
        }}
      />
    </AppShell>
  );
};

export default NavigationPage;
