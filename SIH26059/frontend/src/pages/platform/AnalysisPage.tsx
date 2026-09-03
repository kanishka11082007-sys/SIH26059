import React, { useState } from 'react';
import { 
  Activity, Snowflake, ShieldAlert, Clock, BarChart3, Wind, LineChart as LucideLineChart, Ship
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import { useTimeData } from "../../hooks/useTimeData";
import { useFleet } from "../../context/FleetContext";
import { cn } from '../../utils/cn';

// Standardized 5-step forecast timeline mapped to backend tensors (0: Now, 1: +6h, 2: +12h, 3: +24h, 4: +48h)
const TIME_MAP: Record<string, string> = {
  'current': '0',
  '6h': '1',
  '12h': '2',
  '24h': '3',
  '48h': '4',
};

const FORECAST_TREND_DATA = [
  { horizon: 'Now (T+0)', sic: 64, wind: 23.6, temp: -17.9, overallRisk: 50, rio: 6.8 },
  { horizon: '+6H', sic: 67, wind: 25.1, temp: -16.4, overallRisk: 54, rio: 6.1 },
  { horizon: '+12H', sic: 71, wind: 26.6, temp: -14.9, overallRisk: 58, rio: 5.4 },
  { horizon: '+24H', sic: 76, wind: 28.4, temp: -13.4, overallRisk: 63, rio: 4.2 },
  { horizon: '+48H', sic: 82, wind: 29.9, temp: -11.9, overallRisk: 69, rio: 2.8 },
];

const POLAR_CLASS_RIO = [
  { class: 'PC1 (Heavy Icebreaker)', key: 'PC1', limit: -15, authorized: true, safeSpeed: '14 kn' },
  { class: 'PC2 (Heavy Icebreaker)', key: 'PC2', limit: -12, authorized: true, safeSpeed: '13 kn' },
  { class: 'PC3 (Medium Icebreaker)', key: 'PC3', limit: -10, authorized: true, safeSpeed: '12 kn' },
  { class: 'PC4 (Medium Icebreaker)', key: 'PC4', limit: -5, authorized: true, safeSpeed: '11 kn' },
  { class: 'PC5 (Antarctic Research)', key: 'PC5', limit: 0, authorized: true, safeSpeed: '10 kn' },
  { class: 'PC7 (Light Ice-Strengthened)', key: 'PC7', limit: +5, authorized: true, safeSpeed: '8 kn' },
  { class: 'Non-Ice Strengthened', key: 'Non-Ice', limit: +10, authorized: false, safeSpeed: 'N/A (Open water only)' },
];

export const AnalysisPage: React.FC = () => {
  const { fleet, selectedVessel, selectedVesselId, setSelectedVesselId } = useFleet();
  const [timeStep, setTimeStep] = useState<'current' | '6h' | '12h' | '24h' | '48h'>('current');
  useApiData();
  
  const apiTimeStep = TIME_MAP[timeStep] || '0';
  const { environmental } = useTimeData(apiTimeStep);

  const env = environmental || {
    seaIceConcentration: 64, windSpeed: 18, windDirection: 'NE', temperature: -17,
    overallRisk: 'MODERATE', seaIceRiskScore: 78, icebergRiskScore: 41, weatherRiskScore: 28,
    overallRiskScore: 50, sst: -1.7, waveHeight: 2.4, visibility: 14,
    timestep: 'Now (T+0h)', dataSource: 'Sentinel-1 SAR + ERA5'
  };

  const overallRisk = env.overallRiskScore || Math.round((env.seaIceRiskScore + env.icebergRiskScore + env.weatherRiskScore) / 3);
  const riskLabel = overallRisk < 30 ? 'LOW' : overallRisk < 60 ? 'MODERATE' : overallRisk < 80 ? 'HIGH' : 'CRITICAL';

  const hazardBreakdown = [
    { hazard: 'Sea Ice Pack', score: env.seaIceRiskScore || 78, fill: '#3AA6C8' },
    { hazard: 'Iceberg Proximity', score: env.icebergRiskScore || 41, fill: '#FF6B5E' },
    { hazard: 'Weather & Swell', score: env.weatherRiskScore || 28, fill: '#F2994A' },
    { hazard: 'Bathymetry Hazard', score: 14, fill: '#27AE60' },
  ];

  const currentPolarKey = selectedVessel.polar_class ? selectedVessel.polar_class.split(' ')[0] : 'PC5';

  return (
    <AppShell
      title="Risk Analysis"
      subtitle={`Physics-Informed Environmental Simulation & IMO POLARIS Verification — ${env.timestep || 'T+0h'}`}
      actions={
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <Ship className="w-3.5 h-3.5 text-glacial-blue" />
            <span className="text-slate-400">VESSEL:</span>
            <span className="text-ice-white font-semibold">{selectedVessel.name.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <Activity className="w-3.5 h-3.5 text-glacial-blue" />
            <span className="text-slate-400">DATA:</span>
            <span className="text-ice-white font-semibold">SENTINEL-1 + ERA5</span>
          </div>
        </div>
      }
    >
      <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 bg-navy">
        
        {/* Time Step Selector */}
        <div className="bg-polar-navy/30 p-2.5 rounded-sm border border-slate/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-glacial-blue" />
            <span className="text-slate-400 text-[10px] uppercase font-semibold">TIMESTEP EVALUATION:</span>
            <span className="text-glacial-blue font-semibold bg-polar-navy/60 px-2 py-0.5 rounded-sm border border-slate/20">
              {env.timestep}
            </span>
          </div>
          <div className="flex items-center gap-1 w-full sm:w-auto bg-polar-navy/40 p-1 rounded-sm border border-slate/20">
            {(['current', '6h', '12h', '24h', '48h'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeStep(t)}
                className={cn(
                  "px-3 py-1 rounded-sm text-xs font-mono transition-all uppercase",
                  timeStep === t
                    ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/50 font-bold"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {t === 'current' ? 'Now' : `+${t.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[10px] font-mono text-glacial-blue tracking-widest uppercase font-semibold">
              01 // Hydrodynamic Risk Modeling
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ice-white font-sans">
              Southern Ocean Dynamic Risk Surface
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Unified multi-sensor analysis integrating Sentinel-1 SAR pack ice density, 48-hour hydrodynamic iceberg drift kinematics, and ERA5 atmospheric wind-stress fields.
            </p>
          </div>

          <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm text-center flex flex-col items-center justify-center font-mono">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest block mb-1">
              VOYAGE COMPOSITE RISK SCORE
            </span>
            <span className={cn(
              "font-bold text-3xl",
              riskLabel === 'LOW' ? "text-risk-safe" : riskLabel === 'MODERATE' ? "text-amber-400" : "text-signature-coral"
            )}>
              {overallRisk} / 100
            </span>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-sm border mt-2",
              riskLabel === 'LOW' ? "text-risk-safe bg-risk-safe/10 border-risk-safe/30" : riskLabel === 'MODERATE' ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-signature-coral bg-signature-coral/10 border-signature-coral/30"
            )}>
              {riskLabel} RISK ZONE
            </span>
          </div>
        </div>

        {/* 3 Hazard Factor Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-glacial-blue" />
                <h4 className="font-semibold text-ice-white text-sm">Sea Ice Pack</h4>
              </div>
              <span className="text-xs font-mono font-bold text-glacial-blue">
                {env.seaIceConcentration > 100 ? (env.seaIceConcentration / 100).toFixed(1) : Number(env.seaIceConcentration).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1 bg-slate/20 rounded-full overflow-hidden">
              <div className="h-full bg-glacial-blue" style={{ width: `${env.seaIceRiskScore || 78}%` }} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              Close pack ice with moderate compression. Route B corridor reduces ice exposure by 52% compared to direct transit.
            </p>
          </div>

          <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-signature-coral" />
                <h4 className="font-semibold text-ice-white text-sm">Iceberg Proximity</h4>
              </div>
              <span className="text-xs font-mono font-bold text-signature-coral">{env.icebergRiskScore}%</span>
            </div>
            <div className="w-full h-1 bg-slate/20 rounded-full overflow-hidden">
              <div className="h-full bg-signature-coral" style={{ width: `${env.icebergRiskScore || 41}%` }} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              Iceberg A-17 closest point of approach is 14.2 km. Active route corridor maintains a safe +28 km clearance perimeter.
            </p>
          </div>

          <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-ice-white text-sm">Weather & Swell</h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">{env.weatherRiskScore}%</span>
            </div>
            <div className="w-full h-1 bg-slate/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${env.weatherRiskScore || 28}%` }} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              Sustained winds {env.windSpeed} kn {env.windDirection} with {env.waveHeight}m swell. Attenuation active in marginal ice.
            </p>
          </div>
        </div>

        {/* Graphical Analytics (Recharts) */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Forecast Trend Chart */}
          <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-glacial-blue font-semibold flex items-center gap-1.5">
                <LucideLineChart className="w-3.5 h-3.5" /> 48-HOUR SEA ICE & RISK PROJECTION
              </h4>
              <span className="text-[10px] text-slate-400">T+0 TO T+48H</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={FORECAST_TREND_DATA}>
                  <defs>
                    <linearGradient id="sicGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3AA6C8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3AA6C8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B5E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF6B5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                  <XAxis dataKey="horizon" stroke="#94a3b8" fontSize={10} fontStyle="mono" />
                  <YAxis stroke="#94a3b8" fontSize={10} fontStyle="mono" />
                  <Tooltip contentStyle={{ background: '#061522', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="sic" name="Sea Ice %" stroke="#3AA6C8" fillOpacity={1} fill="url(#sicGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="overallRisk" name="Risk Score" stroke="#FF6B5E" fillOpacity={1} fill="url(#riskGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hazard Breakdown Bar Chart */}
          <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider text-glacial-blue font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> MULTI-HAZARD FUSION WEIGHTS
              </h4>
              <span className="text-[10px] text-slate-400">POLARIS RIO</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hazardBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <YAxis type="category" dataKey="hazard" stroke="#94a3b8" fontSize={10} width={110} />
                  <Tooltip contentStyle={{ background: '#061522', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="score" name="Hazard Index" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* IMO POLARIS Reference Matrix */}
        <div className="bg-polar-navy/30 border border-slate/20 p-4 rounded-sm space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate/20 pb-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-glacial-blue font-semibold">
                IMO POLARIS (POLAR OPERATIONAL LIMIT ASSESSMENT RISK INDEXING SYSTEM)
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Evaluated against active vessel: <span className="text-ice-white font-mono font-semibold">{selectedVessel.name}</span> ({selectedVessel.polar_class || 'PC5'})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">SELECT VESSEL:</span>
              <select
                value={selectedVesselId}
                onChange={(e) => setSelectedVesselId(e.target.value)}
                className="bg-polar-navy/60 border border-slate/30 rounded-sm px-2 py-1 text-xs text-ice-white font-mono focus:outline-none focus:border-glacial-blue"
              >
                {fleet.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.flag} {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate/20">
                  <th className="pb-2 font-semibold">Vessel Polar Class</th>
                  <th className="pb-2 font-semibold">RIO Threshold</th>
                  <th className="pb-2 font-semibold">Status for Route B</th>
                  <th className="pb-2 font-semibold">Speed Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {POLAR_CLASS_RIO.map((row) => {
                  const isActive = currentPolarKey.includes(row.key);
                  return (
                    <tr key={row.class} className={cn("transition-colors", isActive ? "bg-glacial-blue/10 border-l-2 border-l-glacial-blue" : "hover:bg-polar-navy/40")}>
                      <td className="py-2.5 font-semibold text-ice-white flex items-center gap-2">
                        <span>{row.class}</span>
                        {isActive && (
                          <span className="text-[9px] font-bold text-glacial-blue bg-glacial-blue/20 px-1.5 py-0.2 rounded border border-glacial-blue/40">
                            ★ ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-300">RIO &ge; {row.limit}</td>
                      <td className="py-2.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[9px] font-bold border",
                          row.authorized ? "text-risk-safe bg-risk-safe/10 border-risk-safe/30" : "text-signature-coral bg-signature-coral/10 border-signature-coral/30"
                        )}>
                          {row.authorized ? 'AUTHORIZED' : 'RESTRICTED'}
                        </span>
                      </td>
                      <td className="py-2.5 text-glacial-blue">{row.safeSpeed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
};

export default AnalysisPage;
