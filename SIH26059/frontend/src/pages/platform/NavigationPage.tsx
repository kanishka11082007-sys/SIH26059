import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2, Download, Zap, Ship, MapPin, Sparkles, ShieldAlert,
  PanelLeftClose, PanelLeftOpen, Navigation, Clock, X, CheckCircle2
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from '../../hooks/useApiData';
import { useFleet } from '../../context/FleetContext';
import type { MissionType, OptimizationPriority } from '../../context/FleetContext';
import { GeminiCopilotDrawer } from '../../components/GeminiCopilotDrawer';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';
import PolarMap from '../../components/map/PolarMap';
import { TacticalHazardBanner } from '../../components/TacticalHazardBanner';

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
  
  const step = Math.max(1, Math.floor(routePath.length / 6));
  const selectedIdx = [0];
  for (let i = step; i < routePath.length - 1; i += step) {
    selectedIdx.push(i);
  }
  selectedIdx.push(routePath.length - 1);

  let cumDist = 0;
  return selectedIdx.map((idx, i) => {
    const pt = routePath[idx];
    if (i > 0) {
      const prev = routePath[selectedIdx[i - 1]];
      const dlat = (pt[0] - prev[0]) * Math.PI / 180;
      const dlon = (pt[1] - prev[1]) * Math.PI / 180;
      const a = Math.sin(dlat / 2) ** 2 + Math.cos(prev[0] * Math.PI / 180) * Math.cos(pt[0] * Math.PI / 180) * Math.sin(dlon / 2) ** 2;
      cumDist += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    }
    const isFirst = i === 0;
    const isLast = i === selectedIdx.length - 1;
    const wpNum = i;

    return {
      id: isFirst ? 'WP-ORIGIN' : isLast ? 'WP-BERTH' : `WP-${String(wpNum).padStart(2, '0')}`,
      name: isFirst ? 'VOYAGE DEPARTURE' : isLast ? 'STATION MOORING' : `TRANSIT CORRIDOR ${wpNum}`,
      latitude: pt[0],
      longitude: pt[1],
      distanceFromStart: Math.round(cumDist),
      eta: isFirst ? '00:00' : `+${Math.round(cumDist / (14.0 * 1.852))}h`,
      status: isFirst ? 'passed' : i === 1 ? 'active' : 'upcoming',
      iceRisk: isFirst || isLast ? 'LOW' : routeType.includes('route-a') ? 'HIGH' : routeType.includes('route-c') ? 'LOW' : 'MODERATE',
      reason: isFirst ? 'Convoy departure point' : isLast ? 'Mooring berth approach' : 'Navigation corridor waypoint'
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
    selectedHorizon,
    setSelectedHorizon,
    activeHorizonLabel,
    assignMission,
    resetVesselToAvailable,
    routes,
    activeRouteId,
    setActiveRouteId,
    activeRoute: contextActiveRoute,
    emergencyRerouteActive,
    triggerEmergencyHazard,
    whatIfScenario,
    setWhatIfScenario,
    recomputeRoutes,
    tacticalAlert,
    setCustomDestination,
    isComputingRoutes
  } = useFleet();

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');

  // Compact Mission Assignment Modal State
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [modalDestinationId, setModalDestinationId] = useState('');
  const [modalMissionType, setModalMissionType] = useState<MissionType>('RESEARCH');
  const [modalRouteProfile, setModalRouteProfile] = useState<OptimizationPriority>('BALANCED');
  const [isAssigningMission, setIsAssigningMission] = useState(false);

  // Initialize modal destination when opening
  useEffect(() => {
    if (isMissionModalOpen && stations.length > 0) {
      const other = stations.find(s => s.id !== selectedDestinationId && s.name !== selectedVessel.destination);
      if (other) setModalDestinationId(other.id);
      else setModalDestinationId(stations[0].id);
    }
  }, [isMissionModalOpen, stations, selectedDestinationId, selectedVessel.destination]);

  const handleAssignMissionSubmit = async () => {
    if (!modalDestinationId) return;
    setIsAssigningMission(true);
    try {
      await assignMission(selectedVessel.id, modalDestinationId, modalMissionType, modalRouteProfile);
      setIsMissionModalOpen(false);
    } catch (e) {
      console.error('Mission assignment error:', e);
    } finally {
      setIsAssigningMission(false);
    }
  };

  // Live iceberg data
  const [icebergs, setIcebergs] = useState<any[]>([]);
  const fetchIcebergs = useCallback(async () => {
    try {
      const res = await api.icebergs();
      if (res?.icebergs?.length) setIcebergs(res.icebergs);
    } catch (e) { /* keep previous */ }
  }, []);
  useEffect(() => { fetchIcebergs(); }, [fetchIcebergs]);

  // Merge dynamic hazard iceberg into map icebergs if active
  const displayIcebergs = useMemo(() => {
    if (!tacticalAlert.active || !tacticalAlert.hazardIceberg) {
      return icebergs;
    }
    const haz = tacticalAlert.hazardIceberg;
    const exists = icebergs.some(ib => ib.id === haz.id);
    if (exists) return icebergs;
    return [haz, ...icebergs];
  }, [icebergs, tacticalAlert.active, tacticalAlert.hazardIceberg]);

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

  const activeRoute = useMemo(() => {
    if (!routes || routes.length === 0) return contextActiveRoute || null;
    return routes.find(r => r.id === activeRouteId) ||
           routes.find(r => r.id?.includes(activeRouteId)) ||
           contextActiveRoute ||
           routes.find(r => r.recommended) ||
           routes[0] ||
           null;
  }, [routes, activeRouteId, contextActiveRoute]);

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
        distanceFromStart: wp.distance_from_start_km ?? wp.distanceFromStart ?? Math.round(((idx + 1) / (validWps.length + 1)) * (activeRoute.distance || 3800)),
        eta: wp.eta ?? `T+${(idx + 1) * 6}h`,
        status: (idx === 0 ? 'active' : 'upcoming') as 'passed' | 'active' | 'upcoming',
        iceRisk: wp.risk_score || wp.iceRisk || activeRoute.iceRisk || 'MODERATE',
        reason: wp.reason || 'Course alteration along optimal corridor'
      }));
    }
    if (!activeRoute || !activeRoute.path) return [];
    return generateWaypointsForRoute(activeRoute.path, activeRoute.id || activeRouteId, selectedDestination.name);
  }, [activeRoute, activeRouteId, selectedVessel, selectedDestination]);

  // Derive active vessel position along the active corridor
  const activeVesselTelemetry = useMemo(() => {
    const heading = (activeRoute?.path && activeRoute.path.length >= 2)
      ? computeHeading(activeRoute.path[0], activeRoute.path[1])
      : (selectedVessel?.heading || 180);

    return {
      name: selectedVessel?.name || 'Vessel Telemetry',
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
      if (recomputeRoutes) {
        await recomputeRoutes();
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
          {/* Shared Forecast Horizon Selector (NOW / +6H / +12H / +24H / +48H) */}
          <div className="flex items-center gap-1 bg-polar-navy/60 border border-slate/30 p-1 rounded-sm">
            <Clock className="w-3.5 h-3.5 text-glacial-blue ml-1 mr-0.5" />
            <span className="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline">HORIZON:</span>
            {([
              { h: 0, label: 'NOW' },
              { h: 6, label: '+6H' },
              { h: 12, label: '+12H' },
              { h: 24, label: '+24H' },
              { h: 48, label: '+48H' },
            ] as const).map(({ h, label }) => (
              <button
                key={h}
                type="button"
                onClick={() => setSelectedHorizon(h)}
                className={cn(
                  "px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold transition-all cursor-pointer",
                  selectedHorizon === h
                    ? "bg-glacial-blue text-navy font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-polar-navy/60 hover:bg-polar-navy border border-slate/30 text-xs font-mono text-slate-200 hover:text-white font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-glacial-blue" />
            <span>Navigation Copilot</span>
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
        {/* Left Side: Collapsible Navigation Controls & Telemetry */}
        <div className={cn(
          "border-r border-slate/20 bg-navy/95 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out",
          isSidebarOpen 
            ? "w-full md:w-80 lg:w-96 p-5 opacity-100" 
            : "w-0 p-0 border-none opacity-0 overflow-hidden"
        )}>
          <div className="space-y-4">
            
            {/* 1. Mission Parameters & Lifecycle State */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-glacial-blue tracking-widest uppercase font-semibold">
                01 // Mission Parameters
              </div>

              {/* Mission Lifecycle Card */}
              {selectedVessel.mission_status === 'ARRIVED' ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-sm font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ARRIVED AT BERTH
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      COMPLETED
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Moored at: <strong className="text-ice-white">{selectedVessel.destination}</strong>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsMissionModalOpen(true)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>New Mission</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resetVesselToAvailable(selectedVessel.id)}
                      className="py-1.5 px-2 bg-polar-navy/60 hover:bg-polar-navy text-slate-300 rounded-sm text-[11px] font-mono border border-slate/30"
                    >
                      Mark Available
                    </button>
                  </div>
                </div>
              ) : selectedVessel.mission_status === 'AVAILABLE' ? (
                <div className="bg-polar-navy/30 border border-slate/30 p-3 rounded-sm font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-glacial-blue font-bold flex items-center gap-1.5 text-[11px]">
                      <Ship className="w-3.5 h-3.5 text-glacial-blue" />
                      VESSEL AVAILABLE
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-glacial-blue/10 text-ice-blue border border-glacial-blue/30">
                      READY
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px]">Moored and ready for scientific tasking in Antarctic sector.</p>
                  <button
                    type="button"
                    onClick={() => setIsMissionModalOpen(true)}
                    className="w-full py-1.5 px-2 bg-glacial-blue hover:bg-ice-blue text-navy rounded-sm text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Assign Mission</span>
                  </button>
                </div>
              ) : (
                <div className="bg-polar-navy/30 border border-slate/20 p-2.5 rounded-sm font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-glacial-blue font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-glacial-blue" />
                      UNDERWAY &bull; {selectedVessel.destination.split(' ')[0]}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {selectedVessel.data_status === 'LIVE' ? 'LIVE AIS' : 'SIMULATED VOYAGE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>ETA: <strong className="text-ice-white">{selectedVessel.eta || '32h'}</strong></span>
                    <span>State @ <strong className="text-cyan-300">{activeHorizonLabel}</strong></span>
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsMissionModalOpen(true)}
                      className="text-[10px] text-glacial-blue hover:text-white transition-colors cursor-pointer"
                    >
                      + Reassign Mission Leg &rarr;
                    </button>
                  </div>
                </div>
              )}

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-glacial-blue" />
                    <span>Destination Target</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-[10px] text-glacial-blue hover:text-white font-mono transition-colors cursor-pointer"
                  >
                    {isCustomMode ? '← Pick Station' : '+ Custom Location'}
                  </button>
                </div>

                {!isCustomMode ? (
                  <select
                    value={selectedDestinationId}
                    onChange={(e) => setSelectedDestinationId(e.target.value)}
                    className="w-full bg-polar-navy/50 border border-slate/30 rounded-sm p-2 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue font-medium"
                  >
                    {stations.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({Math.abs(p.latitude).toFixed(1)}°S)</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 bg-polar-navy/40 p-2.5 rounded-sm border border-slate/30">
                    <div>
                      <input
                        type="text"
                        placeholder="Target / Waypoint Name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-navy/80 border border-slate/30 rounded-sm p-1.5 text-xs text-ice-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-glacial-blue"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono block mb-0.5">Latitude (°S)</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="-69.40"
                          value={customLat}
                          onChange={(e) => setCustomLat(e.target.value)}
                          className="w-full bg-navy/80 border border-slate/30 rounded-sm p-1.5 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-mono block mb-0.5">Longitude (°E/W)</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="76.19"
                          value={customLon}
                          onChange={(e) => setCustomLon(e.target.value)}
                          className="w-full bg-navy/80 border border-slate/30 rounded-sm p-1.5 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[9px] text-slate-400 font-mono w-full">Presets:</span>
                      {[
                        { label: 'Weddell Sea', lat: -71.5, lon: -40.2 },
                        { label: 'Ross Shelf', lat: -78.2, lon: 175.0 },
                        { label: 'Prydz Bay', lat: -68.2, lon: 74.5 },
                        { label: 'Amundsen', lat: -72.0, lon: -110.0 }
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setCustomName(p.label);
                            setCustomLat(String(p.lat));
                            setCustomLon(String(p.lon));
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-polar-navy/60 hover:bg-glacial-blue/20 hover:text-ice-white border border-slate/30 rounded-xs text-slate-300 transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={isComputingRoutes || !customLat || !customLon}
                      onClick={() => {
                        const lat = parseFloat(customLat);
                        const lon = parseFloat(customLon);
                        if (!isNaN(lat) && !isNaN(lon)) {
                          setCustomDestination(customName || 'Custom Target', lat, lon);
                          setIsCustomMode(false);
                        }
                      }}
                      className="w-full py-1.5 px-3 bg-glacial-blue/20 hover:bg-glacial-blue/30 border border-glacial-blue text-ice-white rounded-sm text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isComputingRoutes ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-glacial-blue" />
                          <span>Computing Corridors...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5 text-glacial-blue" />
                          <span>Compute Route to Location</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isComputingRoutes && (
                  <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-glacial-blue/10 border border-glacial-blue/30 rounded-sm text-[11px] font-mono text-glacial-blue animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Calculating multi-objective polar corridors...</span>
                  </div>
                )}
              </div>

              {/* Tactical Diversion & What-If Controls */}
              <div className="pt-2 space-y-1.5 border-t border-slate/20">
                <button
                  type="button"
                  onClick={triggerEmergencyHazard}
                  className={cn(
                    "w-full py-1.5 px-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer",
                    emergencyRerouteActive
                      ? "bg-signature-coral/20 border-signature-coral text-signature-coral font-bold"
                      : "bg-polar-navy/40 border-slate/30 text-slate-300 hover:text-white hover:border-glacial-blue"
                  )}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{emergencyRerouteActive ? "TACTICAL DIVERSION ACTIVE" : "SIMULATE HAZARD / DIVERSION"}</span>
                </button>

                {/* What-If Decision Analysis */}
                <button
                  type="button"
                  onClick={() => setWhatIfScenario({ ...whatIfScenario, active: !whatIfScenario.active })}
                  className={cn(
                    "w-full py-1.5 px-2 rounded-sm text-[11px] font-mono transition-all flex items-center justify-center gap-1.5 border cursor-pointer",
                    whatIfScenario.active
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                      : "bg-polar-navy/30 border-slate/20 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{whatIfScenario.active ? "WHAT-IF ACTIVE: +15% SIC & +25KM DRIFT" : "WHAT-IF DECISION ANALYSIS"}</span>
                </button>

                {/* What-If Scenario Result Strip */}
                {whatIfScenario.active && (
                  <div className="p-2.5 bg-amber-950/30 border border-amber-500/40 rounded-xs space-y-1.5 font-mono text-[10px] animate-in fade-in">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        SCENARIO COMPARISON
                      </span>
                      <span className="px-1 rounded bg-amber-500/20 text-amber-200 text-[9px]">EVALUATED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-300 pt-0.5">
                      <div className="bg-navy/60 p-1.5 rounded-2xs border border-slate/20">
                        <span className="text-slate-400 text-[9px] block">BASELINE OPTIMAL</span>
                        <span className="text-ice-white font-semibold">POLARIS +8.4 (RIO)</span>
                        <span className="text-slate-400 text-[8.5px] block mt-0.5">Lead corridor nominal</span>
                      </div>
                      <div className="bg-navy/60 p-1.5 rounded-2xs border border-amber-500/30">
                        <span className="text-amber-400 text-[9px] block">STRESSED (+15% SIC)</span>
                        <span className="text-emerald-400 font-semibold">SAFEST (+14.8 RIO)</span>
                        <span className="text-slate-300 text-[8.5px] block mt-0.5">+229 km perimeter detour</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans leading-tight pt-1 border-t border-amber-500/20">
                      Recommendation: Under +15% sea ice surge and 25 km drift,Safest corridor is recommended to maintain safe hull stress clearance.
                    </p>
                  </div>
                )}
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
                  const isSelected = activeRoute?.id === route.id;
                  const label = route.optimization_mode === 'FASTEST' ? 'Fastest' :
                                route.optimization_mode === 'SAFEST' ? 'Safest' :
                                route.optimization_mode === 'BALANCED' ? 'Optimal' :
                                route.id?.includes('route-a') ? 'Fastest' :
                                route.id?.includes('route-c') ? 'Safest' : 'Optimal';

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
                    {(() => {
                      const rioVal = typeof activeRoute.rioScore === 'number' ? activeRoute.rioScore : parseFloat(String(activeRoute.rioScore || '0')) || 0;
                      const formattedRio = rioVal > 0 ? `+${rioVal.toFixed(1)}` : rioVal.toFixed(1);
                      return (
                        <span className={cn('px-2 py-0.5 rounded-sm border text-[9px] font-bold', riskBadge(activeRoute.iceRisk || ''))}>
                          RIO: {formattedRio}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate/20 text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">FUEL</span>
                      <span className="text-ice-white font-semibold">{activeRoute.fuelConsumption}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ACTUAL SIC</span>
                      <span className="text-glacial-blue font-semibold">{activeRoute.sic_actual !== undefined ? `${activeRoute.sic_actual}%` : `${activeRoute.sicExposure ?? 0}%`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ICEBERGS</span>
                      <span className="text-ice-white font-semibold">
                        {activeRoute.minimum_cpa_km !== undefined
                          ? `${activeRoute.minimum_cpa_km} km CPA`
                          : activeRoute.has_iceberg_hazard || activeRoute.icebergEncounters
                          ? '1 zone'
                          : '0 zones'}
                      </span>
                    </div>
                  </div>

                  {/* Decision Support & Hazard Intelligence */}
                  {activeRoute.decision_support && (
                    <div className="p-2 bg-navy/60 border border-glacial-blue/30 rounded-xs space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-glacial-blue font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-glacial-blue" />
                          DECISION INTELLIGENCE
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-2xs text-[9px] font-bold border",
                          activeRoute.decision_support.dominant_hazard.includes("NOMINAL") 
                            ? "bg-risk-safe/20 text-risk-safe border-risk-safe/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        )}>
                          {activeRoute.decision_support.dominant_hazard.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans leading-tight">
                        {activeRoute.decision_support.recommendation}
                      </p>
                      <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between pt-0.5 border-t border-slate/10">
                        <span>Hazard: {activeRoute.decision_support.hazard_summary}</span>
                      </div>
                    </div>
                  )}

                  {(activeRoute.decision_explanation || activeRoute.reason) && !activeRoute.decision_support && (
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
                      {activeRoute.decision_explanation || activeRoute.reason}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Iceberg Hazard Banner (Cross-Page Context) */}
            {selectedIcebergId && (
              <div className="bg-risk-high/15 border border-risk-high/40 p-2.5 rounded-sm flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-risk-high" />
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
            className="w-full py-2 rounded-sm font-mono font-bold text-xs uppercase tracking-wider bg-signature-coral hover:bg-soft-coral text-white flex items-center justify-center gap-2 transition-all mt-2"
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
        <div className="flex-1 relative h-full bg-[#030910] overflow-hidden">
          {/* Floating Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-3 left-3 z-40 px-2.5 py-1.5 rounded-sm bg-navy/90 hover:bg-polar-navy border border-slate/30 text-ice-white hover:text-glacial-blue text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
            title={isSidebarOpen ? "Hide sidebar (full map view)" : "Show route controls"}
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-glacial-blue" />
                <span className="text-[11px] hidden sm:inline">Hide Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-glacial-blue" />
                <span className="text-[11px] font-semibold text-glacial-blue">Route Controls</span>
              </>
            )}
          </button>

          {/* Compact Floating HUD Tactical Hazard Alert */}
          <TacticalHazardBanner className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-3 pointer-events-auto" />

          <PolarMap
            section="navigation"
            activeHorizon={activeHorizonLabel}
            destinationMarker={destMarker}
            activeRouteId={activeRoute?.id || activeRouteId}
            onSelectRoute={(rId) => handleSelectRoute(rId)}
            customRoutePath={activeRoute?.path}
            allRoutes={routes}
            waypoints={waypoints}
            icebergs={displayIcebergs}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={(id) => setSelectedIcebergId(id)}
            vesselInfo={activeVesselTelemetry}
            focusTarget={null}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
          />
        </div>
      </div>

      {/* Compact Mission Assignment Modal (Step 13) */}
      {isMissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-navy border border-slate/30 rounded-sm shadow-xl max-w-sm w-full p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate/20">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-glacial-blue" />
                <span className="font-bold text-ice-white text-sm">Assign Mission</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMissionModalOpen(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vessel Info */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Vessel</span>
              <div className="p-2 bg-polar-navy/60 border border-slate/30 rounded-xs text-ice-white flex items-center justify-between">
                <span className="font-bold">{selectedVessel.name}</span>
                <span className="text-[10px] text-glacial-blue">{selectedVessel.mission_status || 'AVAILABLE'}</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Current Berth / Origin: <strong className="text-slate-200">{selectedVessel.destination || selectedVessel.voyage_origin || 'Station Berth'}</strong>
              </span>
            </div>

            {/* Destination Selector */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Destination</span>
              <select
                value={modalDestinationId}
                onChange={(e) => setModalDestinationId(e.target.value)}
                className="w-full bg-polar-navy/90 border border-slate/40 rounded-xs p-2 text-ice-white font-mono focus:border-glacial-blue focus:outline-none"
              >
                {stations.map(st => (
                  <option key={st.id} value={st.id} className="bg-polar-navy text-ice-white">
                    {st.name} ({st.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Mission Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Mission Type</span>
                <select
                  value={modalMissionType}
                  onChange={(e) => setModalMissionType(e.target.value as MissionType)}
                  className="w-full bg-polar-navy/90 border border-slate/40 rounded-xs p-1.5 text-xs text-ice-white font-mono focus:border-glacial-blue focus:outline-none"
                >
                  <option value="RESEARCH">Research</option>
                  <option value="RESUPPLY">Resupply</option>
                  <option value="SURVEY">Hydrographic Survey</option>
                  <option value="ESCORT">Ice Escort</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Route Profile</span>
                <select
                  value={modalRouteProfile}
                  onChange={(e) => setModalRouteProfile(e.target.value as OptimizationPriority)}
                  className="w-full bg-polar-navy/90 border border-slate/40 rounded-xs p-1.5 text-xs text-ice-white font-mono focus:border-glacial-blue focus:outline-none"
                >
                  <option value="BALANCED">Balanced</option>
                  <option value="SAFEST">Safest (Min Ice)</option>
                  <option value="FASTEST">Fastest (Min Time)</option>
                  <option value="FUEL">Eco (Min Fuel)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate/20">
              <button
                type="button"
                onClick={() => setIsMissionModalOpen(false)}
                className="flex-1 py-1.5 px-3 bg-polar-navy/40 hover:bg-polar-navy text-slate-300 rounded-xs font-mono text-xs border border-slate/30 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigningMission || !modalDestinationId}
                onClick={handleAssignMissionSubmit}
                className="flex-1 py-1.5 px-3 bg-glacial-blue hover:bg-ice-blue text-navy rounded-xs font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAssigningMission ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Routing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Generate Route</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
