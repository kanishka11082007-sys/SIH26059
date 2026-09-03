import React, { useState, useEffect } from 'react';
import { Ship, Wind, Waves, Thermometer, Eye, Target } from 'lucide-react';
import { getData, subscribeData } from '../data/dataService';

interface IntelligencePanelProps {
  selectedIcebergId: string | null;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ selectedIcebergId }) => {
  const [data, setData] = useState(getData());

  useEffect(() => {
    return subscribeData(() => setData({ ...getData() }));
  }, []);

  const activeVessel = data.vessels[0] || {
    name: 'R/V Polarstern',
    latitude: -69.2,
    longitude: -8.3,
    heading: 210,
    speed: 14.5,
    eta: '18h 40m'
  };

  const selectedIceberg = selectedIcebergId 
    ? data.icebergs.find(i => i.id === selectedIcebergId) 
    : null;

  const env = data.environmental || {
    seaIceConcentration: 64,
    windSpeed: 18,
    windDirection: 'NE',
    oceanCurrent: 0.22,
    visibility: 14,
    seaIceRiskScore: 78,
    icebergRiskScore: 41,
    weatherRiskScore: 28
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Vessel Header */}
      <div className="p-4 border-b border-slate/20">
         <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-sm bg-polar-navy border border-slate/30 flex items-center justify-center">
              <Ship className="w-5 h-5 text-glacial-blue" />
            </div>
            <div>
              <div className="text-xs font-mono tracking-widest text-slate mb-0.5">ACTIVE POLAR VESSEL</div>
              <div className="font-semibold">{activeVessel.name}</div>
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4 text-sm font-mono">
           <div>
             <span className="text-slate block text-[10px]">POSITION</span>
             <span>{Math.abs(activeVessel.latitude).toFixed(2)}° {activeVessel.latitude < 0 ? 'S' : 'N'}</span><br/>
             <span>{Math.abs(activeVessel.longitude).toFixed(2)}° {activeVessel.longitude < 0 ? 'W' : 'E'}</span>
           </div>
           <div>
             <span className="text-slate block text-[10px]">HEADING &amp; SPEED</span>
             <span>{(activeVessel.heading || 0).toString().padStart(3, '0')}° / {activeVessel.speed} kn</span>
             <span className="block mt-1 text-slate text-[10px]">ETA: {activeVessel.eta || '18h 40m'}</span>
           </div>
         </div>
      </div>

      {/* Selected Iceberg Context (if any) */}
      {selectedIceberg && (
        <div className="p-4 border-b border-slate/20 bg-polar-navy/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-ice-white flex items-center gap-2">
              <Target className="w-4 h-4 text-signature-coral" />
              ICEBERG {selectedIceberg.id}
            </h3>
            <span className="text-[10px] font-mono bg-risk-high/20 text-risk-high px-2 py-0.5 rounded-sm border border-risk-high/30">
              {selectedIceberg.risk} RISK
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate/20 pb-2">
              <span className="text-slate">Velocity / Dir</span>
              <span>{selectedIceberg.velocity} kn / {selectedIceberg.direction}</span>
            </div>
            <div className="flex justify-between border-b border-slate/20 pb-2">
              <span className="text-slate">Est. Size</span>
              <span>{selectedIceberg.size} km</span>
            </div>
            <div className="flex justify-between border-b border-slate/20 pb-2">
              <span className="text-slate">48H Forecast Disp.</span>
              <span className="text-signature-coral">+37.1 km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate flex items-center gap-1">Prediction Conf.</span>
              <span className="text-glacial-blue">{selectedIceberg.confidence}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Environmental Conditions */}
      <div className="p-4 border-b border-slate/20">
         <h3 className="text-xs font-mono tracking-widest text-slate mb-4">ENVIRONMENTAL CONDITIONS</h3>
         
         <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div className="bg-navy/50 border border-slate/10 p-3 rounded-sm">
               <div className="flex items-center gap-2 text-slate text-[10px] font-mono mb-1">
                 <Thermometer className="w-3 h-3" /> SEA ICE
               </div>
               <div className="text-lg font-light">
                  {env.seaIceConcentration > 100 ? (env.seaIceConcentration / 100).toFixed(1) : Number(env.seaIceConcentration).toFixed(1)}%
                </div>
            </div>
            <div className="bg-navy/50 border border-slate/10 p-3 rounded-sm">
               <div className="flex items-center gap-2 text-slate text-[10px] font-mono mb-1">
                 <Wind className="w-3 h-3" /> WIND
               </div>
               <div className="text-lg font-light">{env.windSpeed} <span className="text-sm">kn {env.windDirection}</span></div>
            </div>
            <div className="bg-navy/50 border border-slate/10 p-3 rounded-sm">
               <div className="flex items-center gap-2 text-slate text-[10px] font-mono mb-1">
                 <Waves className="w-3 h-3" /> CURRENT
               </div>
               <div className="text-lg font-light">{env.oceanCurrent} <span className="text-sm">m/s</span></div>
            </div>
            <div className="bg-navy/50 border border-slate/10 p-3 rounded-sm">
               <div className="flex items-center gap-2 text-slate text-[10px] font-mono mb-1">
                 <Eye className="w-3 h-3" /> VISIBILITY
               </div>
               <div className="text-lg font-light">{env.visibility} <span className="text-sm">km</span></div>
            </div>
         </div>
      </div>

      {/* Navigation Risk Analysis */}
      <div className="p-4 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-mono tracking-widest text-slate">NAVIGATION RISK</h3>
          <span className="text-xs font-mono text-risk-caution font-bold border border-risk-caution/30 px-2 py-0.5 rounded-sm">
            MODERATE
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ice-white">Sea Ice</span>
              <span className="text-slate">{env.seaIceRiskScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate/20 rounded-full overflow-hidden">
               <div className="h-full bg-risk-high" style={{ width: `${env.seaIceRiskScore}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ice-white">Iceberg</span>
              <span className="text-slate">{env.icebergRiskScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate/20 rounded-full overflow-hidden">
               <div className="h-full bg-risk-caution" style={{ width: `${env.icebergRiskScore}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ice-white">Weather</span>
              <span className="text-slate">{env.weatherRiskScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate/20 rounded-full overflow-hidden">
               <div className="h-full bg-risk-safe" style={{ width: `${env.weatherRiskScore}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligencePanel;
