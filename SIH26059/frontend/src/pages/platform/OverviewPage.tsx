import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Ship, 
  CheckCircle2, 
  ArrowRight,
  MapPin
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import PolarMap from '../../components/map/PolarMap';
import { useFleet } from '../../context/FleetContext';
import { cn } from '../../utils/cn';

export const OverviewPage: React.FC = () => {
  const [layers] = useState({
    vessel: true,
    route: true,
    seaIce: true,
    icebergs: true,
    historicalVessels: true,
  });
  useApiData();

  const {
    fleet,
    selectedVesselId,
    selectedVessel,
    setSelectedVesselId,
    stations,
    selectedDestinationId,
    selectedDestination,
    setSelectedDestinationId,
    routes,
    activeRouteId,
    setActiveRouteId,
    activeRoute,
    selectedIcebergId,
    setSelectedIcebergId,
    selectedHorizon,
    setSelectedHorizon,
    activeHorizonLabel
  } = useFleet();

  const currentRoute = activeRoute || routes[0] || {
    id: 'route-b',
    name: 'ROUTE B (OPTIMAL)',
    distance: 4120,
    eta: '32h 05m',
    rioScore: '+8.4'
  };

  const horizonOptions: { hours: 0 | 6 | 12 | 24 | 48; label: 'NOW' | '+6H' | '+12H' | '+24H' | '+48H' }[] = [
    { hours: 0, label: 'NOW' },
    { hours: 6, label: '+6H' },
    { hours: 12, label: '+12H' },
    { hours: 24, label: '+24H' },
    { hours: 48, label: '+48H' },
  ];

  return (
    <AppShell
      title="Overview"
      subtitle="Antarctic Operational Monitoring & Situational Awareness"
      actions={
        <div className="flex items-center gap-2.5 font-mono text-xs">
          {/* Shared 48h Forecast Horizon Selector */}
          <div className="flex items-center bg-polar-navy/60 border border-slate/30 rounded-sm p-0.5">
            {horizonOptions.map((h) => (
              <button
                key={h.hours}
                type="button"
                onClick={() => setSelectedHorizon(h.hours)}
                className={cn(
                  "px-2 py-0.5 rounded-xs text-[10px] font-mono transition-all",
                  selectedHorizon === h.hours
                    ? "bg-glacial-blue text-navy font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {h.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <span className={cn("w-2 h-2 rounded-full animate-pulse", selectedVessel.data_status === 'LIVE' ? "bg-emerald-400" : "bg-amber-400")} />
            <span className="text-slate-400">TELEMETRY:</span>
            <span className="text-ice-white font-semibold">{selectedVessel.data_status === 'LIVE' ? 'LIVE AIS' : 'SIMULATED VOYAGE'}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">POLARIS:</span>
            <span className="text-emerald-400 font-semibold">{currentRoute.rioScore || '+8.4'} SAFE</span>
          </div>
          <Link
            to="/navigation"
            className="flex items-center gap-1.5 bg-gradient-to-r from-signature-coral to-deep-coral hover:from-soft-coral hover:to-signature-coral text-white px-3.5 py-1 rounded-sm text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm"
          >
            <span>Plan Voyage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-hidden bg-navy">
        {/* 1. CLEAN, DOMINANT POLAR MAP VIEWPORT */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          <PolarMap
            section="overview"
            activeHorizon={activeHorizonLabel}
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={(id) => setSelectedIcebergId(id)}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
            destinationMarker={{
              latitude: selectedDestination.latitude,
              longitude: selectedDestination.longitude,
              name: selectedDestination.name
            }}
            vesselInfo={
              selectedVessel.latitude !== undefined && selectedVessel.longitude !== undefined
                ? {
                    name: selectedVessel.name,
                    latitude: selectedVessel.latitude,
                    longitude: selectedVessel.longitude,
                    speed: selectedVessel.speed,
                    heading: selectedVessel.heading
                  }
                : null
            }
            allRoutes={routes}
            showVessel={layers.vessel}
            showRoute={layers.route}
            showSeaIce={layers.seaIce}
            showIcebergs={layers.icebergs}
            showRouteOptimization={true}
            activeRouteId={activeRouteId}
            onSelectRoute={(rId) => setActiveRouteId(rId)}
            showHistoricalVessels={layers.historicalVessels}
          />
        </div>

        {/* 2. HOME-PAGE STYLE BOTTOM TELEMETRY BAR */}
        <div className="w-full border-t border-slate/20 bg-navy/95 backdrop-blur-md shrink-0 font-mono z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-center">
            
            {/* 1. Active Vessel Selector */}
            <div>
              <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Ship className="w-3 h-3 text-glacial-blue" />
                ACTIVE FLEET VESSEL
              </p>
              <select
                value={selectedVesselId}
                onChange={(e) => setSelectedVesselId(e.target.value)}
                className="bg-polar-navy/50 border border-slate/30 rounded-sm px-2 py-1 text-xs text-ice-white font-semibold font-mono focus:outline-none focus:border-glacial-blue w-full truncate"
              >
                {fleet.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.flag} {v.name} ({v.speed || v.sog} kn)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Destination Station Selector */}
            <div>
              <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-glacial-blue" />
                MISSION DESTINATION
              </p>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="bg-polar-navy/50 border border-slate/30 rounded-sm px-2 py-1 text-xs text-ice-white font-semibold font-mono focus:outline-none focus:border-glacial-blue w-full truncate"
              >
                {stations.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({Math.abs(s.latitude).toFixed(1)}°S)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Position & Telemetry */}
            <div>
              <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1">COORDINATES &amp; HEADING</p>
              <p className="text-ice-white font-semibold text-xs md:text-sm truncate">
                {Math.abs(selectedVessel.latitude || 0).toFixed(2)}°S, {Math.abs(selectedVessel.longitude || 0).toFixed(2)}°{(selectedVessel.longitude || 0) >= 0 ? 'E' : 'W'} <span className="text-glacial-blue font-normal">· {selectedVessel.heading || 180}°T</span>
              </p>
            </div>

            {/* 3. Recommended Corridor & Switcher */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-400 text-[9px] uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-risk-safe" />
                  CORRIDOR
                </p>
                <span className="text-[9px] text-glacial-blue font-semibold">{currentRoute.distance} km</span>
              </div>
              <div className="flex items-center gap-1">
                {(routes && routes.length > 0 ? routes : [
                  { id: 'route-b', name: 'Optimal', optimization_mode: 'BALANCED' },
                  { id: 'route-c', name: 'Safest', optimization_mode: 'SAFEST' },
                  { id: 'route-a', name: 'Direct', optimization_mode: 'FASTEST' }
                ]).map((r: any) => {
                  const rId = r.id;
                  const label = rId.includes('route-b') || r.optimization_mode === 'BALANCED' ? 'Optimal' :
                                rId.includes('route-c') || r.optimization_mode === 'SAFEST' ? 'Safest' : 'Direct';
                  return (
                    <button
                      key={rId}
                      type="button"
                      onClick={() => setActiveRouteId(rId)}
                      className={cn(
                        "flex-1 py-1 rounded-sm text-[8.5px] font-semibold font-mono transition-all border truncate px-1",
                        activeRouteId === rId || (rId.includes('route-b') && !activeRouteId)
                          ? "bg-glacial-blue/20 text-ice-blue border-glacial-blue/50 font-bold"
                          : "bg-polar-navy/40 text-slate-400 border-slate/20 hover:text-white"
                      )}
                      title={r.name || label}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Safety Assessment */}
            <div>
              <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-risk-safe" />
                IMO POLARIS
              </p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold text-xs",
                  parseFloat(String(currentRoute.rioScore || '0')) >= 0 ? "text-risk-safe" : "text-signature-coral"
                )}>
                  RIO: {String(currentRoute.rioScore || '').startsWith('+') || String(currentRoute.rioScore || '').startsWith('-') ? currentRoute.rioScore : `+${currentRoute.rioScore || '8.4'}`}
                </span>
                <span className="text-slate-500 text-[10px]">·</span>
                <span className="text-slate-300 text-xs truncate">{selectedVessel.polar_class ? selectedVessel.polar_class.split(' ')[0] : 'PC5'} Standard</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default OverviewPage;
