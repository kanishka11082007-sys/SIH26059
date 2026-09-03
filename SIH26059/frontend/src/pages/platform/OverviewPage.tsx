import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Layers, 
  Ship, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import PolarMap from '../../components/map/PolarMap';
import { useFleet } from '../../context/FleetContext';
import { cn } from '../../utils/cn';

export const OverviewPage: React.FC = () => {
  const [layers, setLayers] = useState({
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
    routes,
    activeRouteId,
    setActiveRouteId,
    activeRoute,
    selectedIcebergId,
    setSelectedIcebergId
  } = useFleet();

  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  const currentRoute = activeRoute || routes[0] || {
    id: 'route-b',
    name: 'ROUTE B (OPTIMAL)',
    distance: 4120,
    eta: '32h 05m',
    rioScore: '+8.4'
  };

  return (
    <AppShell
      title="Overview"
      subtitle="Antarctic Operational Monitoring & Situational Awareness"
      actions={
        <div className="flex items-center gap-2">
          {/* Layer toggle dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center gap-1.5 px-3 py-1 bg-polar-navy/40 hover:bg-polar-navy border border-slate/20 text-xs font-mono rounded-sm text-slate-300 hover:text-white transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-glacial-blue" />
              <span>Layers</span>
            </button>
            {showLayerMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-navy/95 border border-slate/30 rounded-sm shadow-2xl p-2 z-50 backdrop-blur-xl font-mono text-xs space-y-1"
                onMouseLeave={() => setShowLayerMenu(false)}
              >
                <div className="text-[10px] text-glacial-blue font-semibold px-2 py-1 uppercase border-b border-slate/20">Map Overlays</div>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-polar-navy/50 rounded-sm cursor-pointer">
                  <input type="checkbox" checked={layers.seaIce} onChange={() => toggleLayer('seaIce')} className="rounded border-slate/40 text-glacial-blue focus:ring-0" />
                  <span>Sea Ice Bands</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-polar-navy/50 rounded-sm cursor-pointer">
                  <input type="checkbox" checked={layers.icebergs} onChange={() => toggleLayer('icebergs')} className="rounded border-slate/40 text-glacial-blue focus:ring-0" />
                  <span>Icebergs</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-polar-navy/50 rounded-sm cursor-pointer">
                  <input type="checkbox" checked={layers.route} onChange={() => toggleLayer('route')} className="rounded border-slate/40 text-glacial-blue focus:ring-0" />
                  <span>Navigation Route</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-polar-navy/50 rounded-sm cursor-pointer">
                  <input type="checkbox" checked={layers.vessel} onChange={() => toggleLayer('vessel')} className="rounded border-slate/40 text-glacial-blue focus:ring-0" />
                  <span>Fleet Vessels</span>
                </label>
              </div>
            )}
          </div>

          <Link
            to="/navigation"
            className="flex items-center gap-1.5 bg-gradient-to-r from-signature-coral to-deep-coral hover:from-soft-coral hover:to-signature-coral text-white px-3 py-1 rounded-sm text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm"
          >
            <span>Navigation</span>
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
            selectedIcebergId={selectedIcebergId}
            onSelectIceberg={(id) => setSelectedIcebergId(id)}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
            destinationMarker={
              selectedVessel.dest_lat !== undefined && selectedVessel.dest_lon !== undefined
                ? {
                    latitude: selectedVessel.dest_lat,
                    longitude: selectedVessel.dest_lon,
                    name: selectedVessel.destination || 'Antarctic Station'
                  }
                : null
            }
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center">
            
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
                {(['route-b', 'route-c', 'route-a'] as const).map((rId) => (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => setActiveRouteId(rId)}
                    className={cn(
                      "flex-1 py-1 rounded-sm text-[8.5px] font-semibold font-mono transition-all border",
                      activeRouteId === rId || (rId === 'route-b' && !activeRouteId)
                        ? "bg-glacial-blue/20 text-ice-blue border-glacial-blue/50 font-bold"
                        : "bg-polar-navy/40 text-slate-400 border-slate/20 hover:text-white"
                    )}
                  >
                    {rId === 'route-b' ? 'Optimal' : rId === 'route-c' ? 'Safest' : 'Direct'}
                  </button>
                ))}
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
