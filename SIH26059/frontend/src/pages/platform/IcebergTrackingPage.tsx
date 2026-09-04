import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Mountain, Clock, Ship,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import { useFleet } from '../../context/FleetContext';
import PolarMap from '../../components/map/PolarMap';
import { TacticalHazardBanner } from '../../components/TacticalHazardBanner';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

interface IcebergForecastPoint {
  horizon: 'NOW' | '+6H' | '+12H' | '+24H' | '+48H';
  timeLabel: string;
  coordinates: [number, number];
  displacementKm: number;
  speedKn: number;
}

interface Iceberg {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  velocity: number;
  direction: string;
  movementTrend: string;
  size: number;
  areaKm2: number;
  draftEstimate: number;
  confidence: number;
  risk: string;
  distanceFromVessel: string;
  lastObserved: string;
  sensorSource: string;
  historicalTrajectory: [number, number][];
  predictedTrajectory: [number, number][];
  forecastPoints: IcebergForecastPoint[];
  routeIntersection: any;
  confidenceFactors: any;
}

export const IcebergTrackingPage: React.FC = () => {
  const { 
    fleet, 
    selectedVesselId, 
    selectedVessel, 
    setSelectedVesselId,
    selectedIcebergId,
    setSelectedIcebergId,
    selectedDestination,
    routes,
    activeRouteId,
    setActiveRouteId
  } = useFleet();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeHorizon, setActiveHorizon] = useState<'NOW' | '+6H' | '+12H' | '+24H' | '+48H'>('NOW');
  const [icebergs, setIcebergs] = useState<Iceberg[]>([]);
  useApiData();

  // Re-fetch icebergs when horizon changes
  const fetchIcebergs = useCallback(async () => {
    try {
      const res = await api.icebergs(activeHorizon);
      if (res?.icebergs?.length) {
        setIcebergs(res.icebergs);
      }
    } catch (e) {
      console.error('[IcebergPage] fetch error:', e);
    }
  }, [activeHorizon]);

  useEffect(() => {
    fetchIcebergs();
  }, [fetchIcebergs]);


  // Compute live vessel-to-iceberg separation relative to active vessel
  const enrichedIcebergs = useMemo(() => {
    const vLat = selectedVessel.latitude || -54.2;
    const vLon = selectedVessel.longitude || 68.4;
    return icebergs.map(ib => {
      const dLat = (ib.latitude - vLat) * 111.0;
      const dLon = (ib.longitude - vLon) * 111.0 * Math.cos((vLat * Math.PI) / 180);
      const dist = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));
      return {
        ...ib,
        liveSeparation: `${dist} km to ${selectedVessel.name.split(' ')[0]}`
      };
    });
  }, [icebergs, selectedVessel]);

  const selectedIceberg: any = selectedIcebergId 
    ? enrichedIcebergs.find(i => i.id === selectedIcebergId) 
    : undefined;

  const activeForecastPoint = selectedIceberg?.forecastPoints?.find(
    (fp: any) => fp.horizon === activeHorizon
  );

  return (
    <AppShell
      title="Icebergs"
      subtitle={`48-Hour Hydrodynamic Drift Modeling & Collision Avoidance • Active: ${selectedVessel.name}`}
      actions={
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <Ship className="w-3.5 h-3.5 text-glacial-blue" />
            <span className="text-slate-400">REFERENCE:</span>
            <span className="text-ice-white font-semibold">{selectedVessel.name.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <Mountain className="w-3.5 h-3.5 text-signature-coral" />
            <span className="text-slate-400">TRACKED:</span>
            <span className="text-ice-white font-semibold">{icebergs.length} Targets</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row h-full overflow-hidden bg-navy relative">
        {/* Left Side: Target Inspector */}
        <div className={cn(
          "border-r border-slate/20 bg-navy/95 backdrop-blur-md overflow-y-auto custom-scrollbar flex flex-col justify-between shrink-0 transition-all duration-300 z-20",
          isSidebarOpen ? "w-full md:w-80 lg:w-96 p-5 opacity-100" : "w-0 p-0 overflow-hidden opacity-0 border-r-0 pointer-events-none"
        )}>
          <div className="space-y-4">
            
            {/* Active Vessel Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-300 font-mono block flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-glacial-blue" />
                <span>Reference Fleet Vessel</span>
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

            {/* Target Card or Prompt */}
            {selectedIceberg ? (
              <div className="p-3.5 rounded-sm border border-slate/20 bg-polar-navy/30 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-signature-coral" />
                    <div>
                      <h4 className="font-bold text-ice-white text-xs">{selectedIceberg.id} — {selectedIceberg.name}</h4>
                      <span className="text-[10px] text-slate-400">Trend: {selectedIceberg.movementTrend}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.2 rounded-sm font-bold border",
                      selectedIceberg.risk === 'HIGH'
                        ? "bg-signature-coral/10 text-signature-coral border-signature-coral/30"
                        : selectedIceberg.risk === 'CAUTION'
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-risk-safe/10 text-risk-safe border-risk-safe/30"
                    )}>
                      {selectedIceberg.risk} RISK
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedIcebergId(null)}
                      className="text-xs text-slate-400 hover:text-white px-1 py-0.2 rounded-sm bg-polar-navy/60 border border-slate/20"
                      title="Clear Selection"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-navy/70 p-2 rounded-sm border border-slate/20">
                    <span className="text-slate-400 text-[9px] block">SPEED</span>
                    <span className="text-glacial-blue font-semibold">{selectedIceberg.velocity} kn</span>
                  </div>
                  <div className="bg-navy/70 p-2 rounded-sm border border-slate/20">
                    <span className="text-slate-400 text-[9px] block">HEADING</span>
                    <span className="text-ice-white font-semibold">{selectedIceberg.direction}</span>
                  </div>
                  <div className="bg-navy/70 p-2 rounded-sm border border-slate/20">
                    <span className="text-slate-400 text-[9px] block">EST. DRAFT</span>
                    <span className="text-signature-coral font-semibold">{selectedIceberg.draftEstimate} m</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPA Separation:</span>
                    <span className="text-ice-white">{selectedIceberg.distanceFromVessel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Surface Area:</span>
                    <span className="text-ice-white">{selectedIceberg.areaKm2} km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sensor Source:</span>
                    <span className="text-glacial-blue">{selectedIceberg.sensorSource}</span>
                  </div>
                </div>

                {/* 48h Horizon Buttons */}
                <div className="pt-2 border-t border-slate/20">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1 text-glacial-blue font-semibold">
                      <Clock className="w-3 h-3 text-glacial-blue" /> FORECAST
                    </span>
                    {activeForecastPoint && (
                      <span className="text-ice-white">
                        +{activeForecastPoint.displacementKm} km @ {activeHorizon}
                        {activeForecastPoint.uncertaintyRadiusKm ? ` (±${activeForecastPoint.uncertaintyRadiusKm}km)` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-polar-navy/40 p-1 rounded-sm border border-slate/20">
                    {(['NOW', '+6H', '+12H', '+24H', '+48H'] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setActiveHorizon(h)}
                        className={cn(
                          "flex-1 py-1 rounded-sm text-[10px] font-mono transition-all",
                          activeHorizon === h
                            ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/50 font-bold"
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-sm border border-slate/20 bg-polar-navy/20 text-center space-y-1.5 font-mono">
                <Mountain className="w-6 h-6 text-glacial-blue/70 mx-auto" />
                <h4 className="text-xs font-semibold text-ice-white uppercase tracking-wider">Radar Target Explorer</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Select any iceberg on the map or from the list below to inspect drift vectors and CPA clearance.
                </p>
              </div>
            )}

            {/* Target List */}
            <div className="space-y-2 pt-2 border-t border-slate/20">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <span className="text-glacial-blue font-semibold">Tracked Icebergs</span>
                <span>{icebergs.length} Contacts</span>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                {enrichedIcebergs.map((ib) => {
                  const isSelected = selectedIcebergId === ib.id;
                  return (
                    <div
                      key={ib.id}
                      onClick={() => setSelectedIcebergId(ib.id)}
                      className={cn(
                        "p-2.5 rounded-sm border transition-all cursor-pointer font-mono text-xs",
                        isSelected
                          ? "bg-glacial-blue/10 border-glacial-blue text-ice-white"
                          : "bg-polar-navy/20 border-slate/20 hover:border-slate/40 text-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ib.risk === 'HIGH' ? '#FF6B5E' : '#3AA6C8' }} />
                          <span className="font-semibold text-ice-white">{ib.id}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{ib.name}</span>
                        </div>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded-sm border font-bold",
                          ib.risk === 'HIGH' ? "text-signature-coral border-signature-coral/30" : "text-glacial-blue border-glacial-blue/30"
                        )}>
                          {ib.distanceFromVessel}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate/10">
                        <span>{ib.velocity} kn {ib.direction}</span>
                        <span>{ib.areaKm2} km²</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="flex-1 relative h-full bg-navy">
          {/* Floating Collapsible Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-3 left-3 z-40 px-2.5 py-1.5 rounded-sm bg-polar-navy/90 hover:bg-polar-navy border border-slate/40 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:border-glacial-blue/50"
            title={isSidebarOpen ? "Hide Left Panel for clean full-screen map" : "Show Targets Panel"}
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-glacial-blue" />
                <span className="hidden sm:inline text-[11px]">Hide Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-glacial-blue" />
                <span className="text-[11px] text-glacial-blue font-semibold">Targets</span>
              </>
            )}
          </button>

          <TacticalHazardBanner className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-3 pointer-events-auto" />
          <PolarMap
            section="icebergs"
            showRoute={true}
            selectedIcebergId={selectedIceberg?.id || null}
            onSelectIceberg={(id) => setSelectedIcebergId(id)}
            activeHorizon={activeHorizon}
            icebergs={icebergs}
            selectedVesselId={selectedVesselId}
            onSelectVessel={(id) => setSelectedVesselId(id)}
            destinationMarker={selectedDestination ? {
              latitude: selectedDestination.latitude,
              longitude: selectedDestination.longitude,
              name: selectedDestination.name
            } : undefined}
            allRoutes={routes}
            activeRouteId={activeRouteId}
            onSelectRoute={(rId) => setActiveRouteId(rId)}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default IcebergTrackingPage;
