import React, { useState, useEffect } from 'react';
import { X, Network, Cpu, Clock, Navigation } from 'lucide-react';
import { getData, subscribeData } from '../data/dataService';
import { cn } from '../utils/cn';

interface RouteOptimizationProps {
  onClose: () => void;
}

const RouteOptimization: React.FC<RouteOptimizationProps> = ({ onClose }) => {
  const [data, setData] = useState(getData());
  const [selectedRouteId, setSelectedRouteId] = useState<string>(data.routes[0]?.id || 'route-b');

  useEffect(() => {
    return subscribeData(() => {
      const d = getData();
      setData({ ...d });
      if (d.routes.length > 0 && !d.routes.some(r => r.id === selectedRouteId)) {
        setSelectedRouteId(d.routes[0].id);
      }
    });
  }, [selectedRouteId]);

  return (
    <div className="flex flex-col h-full bg-navy/95 text-ice-white shadow-2xl relative">
      <div className="p-4 border-b border-slate/20 flex justify-between items-center bg-navy">
        <h2 className="font-semibold tracking-wide flex items-center gap-2">
          <Network className="w-5 h-5 text-glacial-blue" />
          ROUTE OPTIMIZATION
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate/20 rounded-sm transition-colors text-slate hover:text-ice-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 bg-polar-navy/20 border-b border-slate/20">
         <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-slate">ORIGIN</span>
            <span className="text-xs font-mono">{data.vessels[0]?.name || 'Active Polar Vessel'}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate">DESTINATION</span>
            <span className="text-xs font-mono">{data.vessels[0]?.destination || 'Antarctic Station'}</span>
         </div>
         
         <div className="mt-4 pt-4 border-t border-slate/20 flex items-center gap-3">
            <Cpu className="w-4 h-4 text-signature-coral animate-pulse" />
            <span className="text-xs font-mono text-signature-coral">AI ANALYSIS COMPLETE</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {data.routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          
          return (
            <div 
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={cn(
                "p-4 border rounded-sm cursor-pointer transition-all",
                isSelected 
                  ? route.recommended 
                    ? "border-risk-safe bg-risk-safe/5 shadow-[0_0_15px_rgba(56,185,138,0.1)]" 
                    : "border-ice-blue bg-ice-blue/5"
                  : "border-slate/20 bg-navy/50 hover:border-slate/50"
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className={cn(
                  "font-semibold flex items-center gap-2",
                  route.recommended ? "text-risk-safe" : "text-ice-white"
                )}>
                  {route.name}
                  {route.recommended && (
                    <span className="text-[10px] font-mono bg-risk-safe/20 text-risk-safe px-1.5 py-0.5 rounded-sm border border-risk-safe/30">
                      RECOMMENDED
                    </span>
                  )}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3 bg-polar-navy/40 p-2.5 rounded-sm">
                <div>
                  <span className="text-slate block text-[10px]">DISTANCE</span>
                  <span>{route.distance} km</span>
                </div>
                <div>
                  <span className="text-slate block text-[10px]">ESTIMATED TIME</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate" />
                    {route.eta}
                  </span>
                </div>
              </div>

              {route.reason && (
                <div className="text-xs text-slate-300 font-sans mb-3 border-t border-slate/10 pt-2">
                  {route.reason}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-slate/20 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate">Sea Ice Risk</span>
                  <span className={cn(
                    route.iceRisk === 'LOW' ? "text-risk-safe" :
                    route.iceRisk === 'MODERATE' ? "text-risk-caution" : "text-risk-high"
                  )}>{route.iceRisk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Iceberg Risk</span>
                  <span className={cn(
                    route.icebergRisk === 'LOW' || route.icebergRisk === 'VERY LOW' ? "text-risk-safe" :
                    route.icebergRisk === 'MODERATE' ? "text-risk-caution" : "text-risk-high"
                  )}>{route.icebergRisk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Weather Risk</span>
                  <span className={cn(
                    route.weatherRisk === 'LOW' ? "text-risk-safe" :
                    route.weatherRisk === 'MODERATE' ? "text-risk-caution" : "text-risk-high"
                  )}>{route.weatherRisk}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate/20 bg-navy flex gap-3">
         <button className="flex-1 py-2.5 px-4 bg-glacial-blue text-polar-navy font-semibold text-xs tracking-wider rounded-sm hover:bg-ice-white transition-colors flex items-center justify-center gap-2">
           <Navigation className="w-4 h-4" />
           EXECUTE ROUTE
         </button>
      </div>
    </div>
  );
};

export default RouteOptimization;
