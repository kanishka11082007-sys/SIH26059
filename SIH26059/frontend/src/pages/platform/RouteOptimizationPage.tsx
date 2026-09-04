import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Ship, MapPin, Sparkles
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import { useFleet } from '../../context/FleetContext';
import PolarMap from '../../components/map/PolarMap';
import { GeminiCopilotDrawer } from '../../components/GeminiCopilotDrawer';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

interface RouteOption {
  id: string;
  name: string;
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
    activeRouteId,
    setActiveRouteId
  } = useFleet();

  const [stations, setStations] = useState<any[]>([]);
  const [selectedDestId, setSelectedDestId] = useState<string>('bharati');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-b');
  const [bharatiValidation, setBharatiValidation] = useState<any>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Load Real COMNAP Antarctic Research Stations from API
  useEffect(() => {
    async function loadStations() {
      try {
        const [stRes, valRes] = await Promise.all([
          api.stations({ coastal_only: false }),
          api.validateBharati()
        ]);
        if (stRes?.stations?.length) {
          setStations(stRes.stations);
        }
        if (valRes) {
          setBharatiValidation(valRes);
        }
      } catch (e) {
        console.error('Failed to fetch COMNAP stations:', e);
      }
    }
    loadStations();
  }, []);

  // Synchronize destination station with active vessel default
  useEffect(() => {
    if (selectedVessel?.destination_station_id) {
      setSelectedDestId(selectedVessel.destination_station_id);
    }
  }, [selectedVessel?.id, selectedVessel?.destination_station_id]);

  const activeVessel = selectedVessel;

  const activeDestination = useMemo(() => {
    return stations.find(d => d.id === selectedDestId) || stations[0] || {
      id: 'bharati',
      name: 'Bharati Research Station',
      latitude: -69.4068,
      longitude: 76.1953,
      region: 'Larsemann Hills (East Antarctica)',
      operator: 'NCPOR (India)'
    };
  }, [stations, selectedDestId]);

  // Load and compute dynamic real routes for current vessel & destination
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const destLat = activeDestination.latitude ?? (activeDestination as any).lat;
        const destLon = activeDestination.longitude ?? (activeDestination as any).lon;
        const res = await api.routes({
          vesselId: selectedVesselId,
          destId: selectedDestId,
          destLat: destLat,
          destLon: destLon,
          destName: activeDestination.name
        });
        if (res?.routes?.length) {
          const formatted = res.routes.map((r: any, idx: number) => ({
            id: r.id || `route-${idx}`,
            name: r.name || (idx === 1 ? 'ROUTE B (OPTIMAL)' : idx === 2 ? 'ROUTE C (SAFEST)' : 'ROUTE A (FASTEST)'),
            distance: r.distance || r.distance_km || 1680,
            eta: r.eta || '32h 05m',
            recommended: r.recommended ?? (idx === 0 || r.id?.includes('route-b')),
            iceRisk: r.iceRisk || r.ice_risk || (r.id?.includes('route-a') ? 'HIGH' : r.id?.includes('route-b') ? 'MODERATE' : 'LOW'),
            fuelConsumption: r.fuelConsumption || r.fuel_estimate || '86 MT',
            sicExposure: r.sicExposure ?? r.sic_exposure ?? (r.id?.includes('route-a') ? 64 : r.id?.includes('route-b') ? 22 : 6),
            rioScore: r.rioScore ?? r.rio_score ?? (r.id?.includes('route-a') ? '-2.8' : r.id?.includes('route-b') ? '+8.4' : '+14.8'),
            reason: r.reason || `Calculated corridor for ${activeVessel.name} towards ${activeDestination.name}.`,
            path: r.path,
            costs: r.costs || r.cost_breakdown || {},
            cost_breakdown: r.cost_breakdown || r.costs || {}
          }));
          setRoutes(formatted);
          const rec = formatted.find(r => r.recommended) || formatted[0];
          if (rec) {
            setSelectedRouteId(rec.id);
            setActiveRouteId(rec.id);
          }
        }
      } catch (e) {
        console.error('Failed to fetch routes:', e);
      }
    }
    fetchRoutes();
  }, [selectedVesselId, selectedDestId, activeVessel.latitude, activeVessel.longitude, activeDestination.latitude, activeDestination.longitude]);

  const handleSetActiveRoute = (routeId: string) => {
    setActiveRouteId(routeId);
    setSelectedRouteId(routeId);
  };

  const getRiskDetails = (route: RouteOption) => {
    const rIce = (route.iceRisk || '').toUpperCase();
    if (route.id?.includes('route-a') || rIce === 'HIGH') {
      return { label: 'HIGH RISK', color: 'text-signature-coral', bg: 'bg-signature-coral/10', border: 'border-signature-coral/40', bar: 'bg-signature-coral w-4/5' };
    }
    if (route.id?.includes('route-b') || rIce === 'MODERATE') {
      return { label: 'MODERATE RISK', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', bar: 'bg-amber-400 w-1/2' };
    }
    return { label: 'LOW RISK', color: 'text-risk-safe', bg: 'bg-risk-safe/10', border: 'border-risk-safe/40', bar: 'bg-risk-safe w-1/4' };
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
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
            className="flex items-center gap-1.5 text-xs font-mono bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 px-3 py-1 rounded-sm text-cyan-300 font-semibold shadow-[0_0_12px_rgba(34,211,238,0.25)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Gemini AI Copilot</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-navy">
        {/* Left Side: Clean Control & Corridor Panel */}
        <div className="w-full lg:w-96 xl:w-[410px] border-r border-slate/20 bg-navy/95 backdrop-blur-md overflow-y-auto custom-scrollbar p-5 space-y-5 flex flex-col justify-between shrink-0">
          
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
                <label className="text-[10px] text-slate-300 font-mono block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-glacial-blue" />
                  <span>Destination Station</span>
                </label>
                <select
                  value={selectedDestId}
                  onChange={(e) => setSelectedDestId(e.target.value)}
                  className="w-full bg-polar-navy/50 border border-slate/30 rounded-sm p-2 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue font-medium"
                >
                  {stations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.country || 'Antarctica'})
                    </option>
                  ))}
                </select>
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
                {selectedDestId === 'bharati' && bharatiValidation?.is_authoritative_match && (
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
                  const isSel = selectedRouteId === r.id;
                  const isAct = activeRouteId === r.id;
                  const label = r.id?.includes('route-a') ? 'Fastest' : r.id?.includes('route-c') ? 'Safest' : 'Optimal';

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRouteId(r.id)}
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
                      <span className="text-slate-400 block text-[9px]">SIC EXPOSURE</span>
                      <span className="text-glacial-blue font-semibold">{selectedRoute.sicExposure}%</span>
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
                        : "bg-gradient-to-r from-signature-coral to-deep-coral hover:from-soft-coral hover:to-signature-coral text-white shadow-sm"
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
                    className="w-full py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mt-2 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.15)] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask Gemini Copilot About Route</span>
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
        <div className="flex-1 relative h-full bg-[#030910]">
          <PolarMap
            section="navigation"
            showRoute={true}
            showVessel={true}
            showSeaIce={true}
            showIcebergs={true}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
            activeRouteId={activeRouteId}
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
