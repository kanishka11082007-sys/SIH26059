import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Ship, MapPin, Sparkles, ShieldAlert, Zap,
  PanelLeftClose, PanelLeftOpen, Navigation, Loader2
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import { useFleet } from '../../context/FleetContext';
import PolarMap from '../../components/map/PolarMap';
import { GeminiCopilotDrawer } from '../../components/GeminiCopilotDrawer';
import { TacticalHazardBanner } from '../../components/TacticalHazardBanner';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

interface RouteOption {
  id: string;
  name: string;
  optimization_mode?: string;
  distance: number;
  eta: string;
  path?: [number, number][];
  recommended?: boolean;
  iceRisk?: string;
  icebergRisk?: string;
  weatherRisk?: string;
  overallScore?: number;
  fuelConsumption?: string | number;
  sicExposure?: number;
  sic_actual?: number;
  sic_cost_contribution?: number;
  rioScore?: number | string;
  reason?: string;
  costs?: Record<string, number>;
  cost_breakdown?: Record<string, number>;
}

export const RouteOptimizationPage: React.FC = () => {
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
    activeRoute,
    emergencyRerouteActive,
    triggerEmergencyHazard,
    whatIfScenario,
    setWhatIfScenario,
    setCustomDestination,
    isComputingRoutes
  } = useFleet();

  const [bharatiValidation, setBharatiValidation] = useState<any>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customLat, setCustomLat] = useState<string>('');
  const [customLon, setCustomLon] = useState<string>('');

  useEffect(() => {
    async function loadValidation() {
      try {
        const valRes = await api.validateBharati();
        if (valRes) {
          setBharatiValidation(valRes);
        }
      } catch (e) {
        console.error('Failed to validate Bharati:', e);
      }
    }
    loadValidation();
  }, []);

  const activeVessel = selectedVessel;
  const activeDestination = selectedDestination;

  const handleSetActiveRoute = (routeId: string) => {
    setActiveRouteId(routeId);
  };

  const getRiskDetails = (route: RouteOption) => {
    const rIce = (route.iceRisk || '').toUpperCase();
    if (route.optimization_mode === 'FASTEST' || route.id?.includes('route-a') || rIce === 'HIGH') {
      return { label: 'HIGH RISK', color: 'text-signature-coral', bg: 'bg-signature-coral/10', border: 'border-signature-coral/40', bar: 'bg-signature-coral w-4/5' };
    }
    if (route.optimization_mode === 'BALANCED' || route.id?.includes('route-b') || rIce === 'MODERATE') {
      return { label: 'MODERATE RISK', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', bar: 'bg-amber-400 w-1/2' };
    }
    return { label: 'LOW RISK', color: 'text-risk-safe', bg: 'bg-risk-safe/10', border: 'border-risk-safe/40', bar: 'bg-risk-safe w-1/4' };
  };

  const selectedRoute = useMemo(() => {
    if (!routes || routes.length === 0) return activeRoute || null;
    return routes.find(r => r.id === activeRouteId) ||
           routes.find(r => r.id?.includes(activeRouteId)) ||
           activeRoute ||
           routes.find(r => r.recommended) ||
           routes[0] ||
           null;
  }, [routes, activeRouteId, activeRoute]);

  const selectedRisk = selectedRoute ? getRiskDetails(selectedRoute) : { label: 'MODERATE RISK', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40' };

  return (
    <AppShell
      title="Route Optimization"
      subtitle="Multi-objective polar navigation corridors"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-mono bg-polar-navy/40 border border-slate/20 px-3 py-1 rounded-sm">
            <span className="text-slate-400">ACTIVE:</span>
            <span className="text-risk-safe font-semibold">{routes.find(r => r.id === activeRouteId)?.name?.split(' - ')[0] || 'ROUTE B'}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-1.5 text-xs font-mono bg-polar-navy/60 hover:bg-polar-navy border border-slate/30 px-3 py-1 rounded-sm text-slate-200 hover:text-white font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-glacial-blue" />
            <span>Route Copilot</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-navy">
        {/* Left Side: Collapsible Control & Corridor Panel */}
        <div className={cn(
          "border-r border-slate/20 bg-navy/95 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out",
          isSidebarOpen 
            ? "w-full lg:w-96 xl:w-[410px] p-5 opacity-100" 
            : "w-0 p-0 border-none opacity-0 overflow-hidden"
        )}>
          
          <div className="space-y-4">
            {/* Mission Configuration */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-glacial-blue tracking-widest uppercase font-semibold">
                01 // Voyage Parameters
              </div>

              {/* Vessel Selector */}
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
                  {fleet.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.flag} {v.name} ({v.speed || v.sog || 14.0} kn)
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Selector */}
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
                    {stations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.country || 'Antarctica'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 bg-polar-navy/40 p-2.5 rounded-sm border border-slate/30">
                    <div>
                      <input
                        type="text"
                        placeholder="Location / Waypoint Name"
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

              {/* Tactical Emergency Diversion & What-If Controls */}
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
                  <span>{emergencyRerouteActive ? "TACTICAL DIVERSION ACTIVE" : "SIMULATE HAZARD / EMERGENCY"}</span>
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

              {/* Clean Telemetry Summary */}
              <div className="bg-polar-navy/20 p-2.5 rounded-sm border border-slate/20 text-[11px] font-mono space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Departure:</span>
                  <span className="text-ice-white">
                    {Math.abs(activeVessel.latitude || 0).toFixed(2)}°{(activeVessel.latitude || 0) >= 0 ? 'N' : 'S'}, {Math.abs(activeVessel.longitude || 0).toFixed(2)}°{(activeVessel.longitude || 0) >= 0 ? 'E' : 'W'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination:</span>
                  <span className="text-ice-white">
                    {Math.abs(activeDestination.latitude ?? (activeDestination as any).lat ?? 0).toFixed(2)}°{(activeDestination.latitude ?? (activeDestination as any).lat ?? 0) >= 0 ? 'N' : 'S'}, {Math.abs(activeDestination.longitude ?? (activeDestination as any).lon ?? 0).toFixed(2)}°{(activeDestination.longitude ?? (activeDestination as any).lon ?? 0) >= 0 ? 'E' : 'W'}
                  </span>
                </div>
                {selectedDestinationId === 'bharati' && bharatiValidation?.is_authoritative_match && (
                  <div className="flex items-center gap-1 text-[10px] text-risk-safe border-t border-slate/20 pt-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-risk-safe shrink-0" />
                    <span>NCPOR Verified (69°24.41′S, 76°11.72′E)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Segmented Route Selector */}
            <div className="space-y-3 pt-2 border-t border-slate/20">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span className="text-glacial-blue font-semibold">02 // Route Options</span>
                <span>{routes.length} Corridors</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-polar-navy/30 rounded-sm border border-slate/20">
                {routes.map((r) => {
                  const isSel = selectedRoute?.id === r.id;
                  const isAct = activeRoute?.id === r.id;
                  const label = r.optimization_mode === 'FASTEST' ? 'Fastest' :
                                r.optimization_mode === 'SAFEST' ? 'Safest' :
                                r.optimization_mode === 'BALANCED' ? 'Optimal' :
                                r.id?.includes('route-a') ? 'Fastest' :
                                r.id?.includes('route-c') ? 'Safest' : 'Optimal';

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSetActiveRoute(r.id)}
                      className={cn(
                        "py-2 px-1 text-center rounded-sm text-xs font-mono transition-all flex flex-col items-center justify-center relative",
                        isSel
                          ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/50 font-bold shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-polar-navy/50"
                      )}
                    >
                      <span className="text-[11px]">{label}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{r.distance?.toLocaleString() || r.distance} km</span>
                      {isAct && (
                        <span className="w-1.5 h-1.5 rounded-full bg-risk-safe absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Route Focused Details Card */}
              {selectedRoute && (
                <div className="bg-polar-navy/30 border border-slate/20 p-3.5 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ice-white text-xs">{selectedRoute.name}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {selectedRoute.distance?.toLocaleString() || selectedRoute.distance} km • ETA: {selectedRoute.eta}
                      </div>
                    </div>
                    <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold border", selectedRisk.bg, selectedRisk.color, selectedRisk.border)}>
                      {selectedRisk.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {selectedRoute.reason}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate/20 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px]">EST. FUEL</span>
                      <span className="text-ice-white font-semibold">{selectedRoute.fuelConsumption}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ACTUAL SIC</span>
                      <span className="text-glacial-blue font-semibold">{selectedRoute.sic_actual !== undefined ? `${selectedRoute.sic_actual}%` : `${selectedRoute.sicExposure}%`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">POLARIS RIO</span>
                      <span className={cn("font-semibold", (parseFloat(String(selectedRoute.rioScore || '0')) >= 0) ? "text-risk-safe" : "text-signature-coral")}>
                        {String(selectedRoute.rioScore || '').startsWith('+') || String(selectedRoute.rioScore || '').startsWith('-')
                          ? selectedRoute.rioScore
                          : `+${selectedRoute.rioScore}`}
                      </span>
                    </div>
                  </div>

                  {/* Real Multi-Objective Cost Breakdown Table */}
                  {selectedRoute.costs && selectedRoute.costs.total_cost !== undefined && (
                    <div className="pt-2 border-t border-slate/20 space-y-1.5 font-mono text-[10px]">
                      <div className="flex items-center justify-between font-bold text-glacial-blue uppercase">
                        <span>Environmental Cost Items</span>
                        <span>Score</span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Distance Cost:</span>
                          <span className="text-ice-white">{selectedRoute.costs.distance_cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sea-Ice Resistance:</span>
                          <span className="text-amber-400">{selectedRoute.costs.ice_cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Iceberg CPA Risk:</span>
                          <span className="text-ice-white">{selectedRoute.costs.iceberg_cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Ocean Current Drift:</span>
                          <span className="text-glacial-blue">{selectedRoute.costs.current_cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Weather Drag:</span>
                          <span className="text-ice-white">{selectedRoute.costs.weather_cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Bathymetry / Keel:</span>
                          <span className="text-emerald-400">{selectedRoute.costs.bathymetry_cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Fuel Penalty:</span>
                          <span className="text-ice-white">{selectedRoute.costs.fuel_cost}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate/20 font-bold">
                          <span className="text-glacial-blue">TOTAL ROUTE COST:</span>
                          <span className="text-risk-safe text-xs">{selectedRoute.costs.total_cost}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSetActiveRoute(selectedRoute.id)}
                    className={cn(
                      "w-full py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mt-2",
                      activeRouteId === selectedRoute.id
                        ? "bg-risk-safe text-navy"
                        : "bg-signature-coral hover:bg-soft-coral text-white"
                    )}
                  >
                    {activeRouteId === selectedRoute.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Navigation Plan</span>
                      </>
                    ) : (
                      <span>Engage This Corridor</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCopilotOpen(true)}
                    className="w-full py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mt-2 bg-polar-navy/60 hover:bg-polar-navy border border-slate/30 text-slate-200 hover:text-white cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-glacial-blue" />
                    <span>Inquire Copilot About Route</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Minimal Polar Standard Footer */}
          <div className="pt-3 border-t border-slate/20 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span className="text-glacial-blue">IMO POLARIS STANDARD</span>
            <span>CLASS: {activeVessel.polar_class || 'PC5'}</span>
          </div>
        </div>

        {/* Right Side: Polar Map Canvas */}
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
            showRoute={true}
            showVessel={true}
            showSeaIce={true}
            showIcebergs={true}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
            activeRouteId={selectedRoute?.id || activeRouteId}
            customRoutePath={selectedRoute?.path}
            onSelectRoute={(id) => handleSetActiveRoute(id)}
            destinationMarker={{
              latitude: activeDestination.latitude ?? (activeDestination as any).lat ?? -62.0833,
              longitude: activeDestination.longitude ?? (activeDestination as any).lon ?? -58.3833,
              name: activeDestination.name || 'Antarctic Station'
            }}
            vesselInfo={{
              name: activeVessel.name,
              latitude: activeVessel.latitude,
              longitude: activeVessel.longitude,
              speed: activeVessel.speed,
              heading: activeVessel.heading
            }}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={(id) => setSelectedIcebergId(id)}
            allRoutes={routes}
          />
        </div>
      </div>

      <GeminiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        decisionContext={{
          vessel: {
            name: activeVessel.name,
            polar_class: activeVessel.polar_class,
            destination: activeDestination.name,
            speed: activeVessel.speed
          },
          route: selectedRoute ? {
            id: selectedRoute.id,
            name: selectedRoute.name,
            distance: selectedRoute.distance,
            eta: selectedRoute.eta,
            fuelConsumption: selectedRoute.fuelConsumption,
            rioScore: selectedRoute.rioScore,
            sicExposure: selectedRoute.sicExposure,
            reason: selectedRoute.reason
          } : undefined
        }}
      />
    </AppShell>
  );
};

export default RouteOptimizationPage;
