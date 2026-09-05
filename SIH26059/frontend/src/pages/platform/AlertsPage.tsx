import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Route as RouteIcon,
  CheckCircle2,
  Ship
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useApiData } from "../../hooks/useApiData";
import { useFleet } from "../../context/FleetContext";
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

interface AlertItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'CAUTION' | 'RESOLVED' | 'INFO';
  timestamp: string;
  location: string;
  source: string;
  acknowledged: boolean;
  recommendedAction: string;
}

const FALLBACK_ALERTS: AlertItem[] = [
  {
    id: 'ALT-2026-001',
    type: 'ICEBERG_CPA_VIOLATION',
    title: 'Iceberg A-17 Within 15km CPA Threshold',
    description: 'Drift trajectory intersects planned route at WP-03 in 8.4 hours. Current separation: 14.2 km.',
    severity: 'HIGH',
    timestamp: '14:23 UTC',
    location: '67.8°S, 54.2°W',
    source: 'Radar & NIC Satellite Tracking',
    acknowledged: false,
    recommendedAction: 'Execute Route B deviation (+4.4% distance) to maintain 28km safe perimeter.'
  },
  {
    id: 'ALT-2026-002',
    type: 'SEA_ICE_COMPRESSION',
    title: 'Rapid Pack Ice Compaction in Sector SEC-03',
    description: 'Sustained 24 kn NE winds driving first-year floes against coastal fast ice boundary.',
    severity: 'CAUTION',
    timestamp: '12:05 UTC',
    location: '69.5°S, 14.0°E',
    source: 'Sentinel-1 SAR + ERA5 Wind Stress',
    acknowledged: false,
    recommendedAction: 'Reduce vessel transit speed to 8.5 kn. Engage Polar Class PC5 power boost.'
  }
];

export const AlertsPage: React.FC = () => {
  const { selectedVessel } = useFleet();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [alerts, setAlerts] = useState<AlertItem[]>(FALLBACK_ALERTS);
  useApiData();

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await api.alerts();
        if (res?.alerts?.length) {
          const normalized = res.alerts.map((a: any) => ({
            id: a.id || 'ALT-001',
            type: a.type || a.category || 'HAZARD',
            title: a.title || 'Navigation Alert',
            description: a.description || '',
            severity: a.severity || 'CAUTION',
            timestamp: a.timeRelative || (a.timestamp ? a.timestamp.slice(11, 16) + ' UTC' : 'Recent'),
            location: a.location || 'Current Sector',
            source: a.source || 'Polar Radar & Satellite Sensor Fusion',
            acknowledged: Boolean(a.acknowledged),
            recommendedAction: a.recommendedAction || a.mitigation || 'Maintain active radar watch and adjust heading as necessary.'
          }));
          setAlerts(normalized);
        }
      } catch (e) {
        console.error('Failed to load alerts:', e);
      }
    }
    loadAlerts();
  }, []);

  const toggleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: !a.acknowledged } : a));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'ACTIVE') return !a.acknowledged && a.severity !== 'RESOLVED';
    return a.severity === filterSeverity;
  });

  const activeCriticalCount = alerts.filter(a => !a.acknowledged && (a.severity === 'HIGH' || a.severity === 'CAUTION')).length;

  return (
    <AppShell
      title="Active Alerts"
      subtitle={`Real-Time Proximity Warnings & Incident Mitigation • Fleet Context: ${selectedVessel.name}`}
      actions={
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-polar-navy/40 border border-slate/20 rounded-sm text-slate-300">
            <Ship className="w-3.5 h-3.5 text-glacial-blue" />
            <span className="text-slate-400">VESSEL:</span>
            <span className="text-ice-white font-semibold">{selectedVessel.name.split(' ')[0]}</span>
          </div>
          <span className="text-slate-400">STATUS:</span>
          <span className={cn("font-semibold", activeCriticalCount > 0 ? "text-signature-coral" : "text-risk-safe")}>
            {activeCriticalCount > 0 ? `${activeCriticalCount} ACTIVE THREATS` : "ALL HAZARDS MITIGATED"}
          </span>
        </div>
      }
    >
      <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 max-w-5xl mx-auto space-y-6 bg-navy">
        
        {/* Top Header & Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate/20 pb-4">
          <div>
            <div className="text-[10px] font-mono text-glacial-blue tracking-widest uppercase font-semibold">
              01 // Safety Protocols
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ice-white font-sans mt-0.5">Active Navigation Hazards</h3>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs bg-polar-navy/30 p-1 rounded-sm border border-slate/20">
            {(['ALL', 'ACTIVE', 'HIGH', 'CAUTION', 'RESOLVED'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={cn(
                  "px-2.5 py-1 rounded-sm text-xs transition-all uppercase",
                  filterSeverity === sev
                    ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/50 font-bold"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Cards */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isHigh = alert.severity === 'HIGH';
            const isCaution = alert.severity === 'CAUTION';

            return (
              <div
                key={alert.id}
                className={cn(
                  "border rounded-sm p-4 space-y-3 transition-all",
                  alert.acknowledged
                    ? "bg-polar-navy/20 border-slate/20 opacity-60"
                    : isHigh
                    ? "bg-signature-coral/5 border-signature-coral/30"
                    : isCaution
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-polar-navy/30 border-slate/20"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-sm mt-0.5 border",
                      isHigh ? "bg-signature-coral/10 text-signature-coral border-signature-coral/30" : isCaution ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-glacial-blue/10 text-glacial-blue border-glacial-blue/30"
                    )}>
                      {isHigh ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{alert.id}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-sm text-[9px] font-mono font-bold border",
                          isHigh ? "text-signature-coral border-signature-coral/30" : isCaution ? "text-amber-400 border-amber-500/30" : "text-risk-safe border-risk-safe/30"
                        )}>
                          {alert.severity}
                        </span>
                        {alert.acknowledged && (
                          <span className="text-[9px] font-mono text-risk-safe flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-ice-white mt-1">{alert.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.description}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400 shrink-0">{alert.timestamp}</span>
                </div>

                <div className="bg-navy/70 p-3 rounded-sm border border-slate/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">RECOMMENDED MITIGATION:</div>
                    <div className="text-glacial-blue font-sans text-xs">{alert.recommendedAction}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleAcknowledge(alert.id)}
                      className="px-2.5 py-1 rounded-sm border border-slate/30 text-slate-300 hover:text-white hover:bg-polar-navy/60 transition-colors text-xs font-mono"
                    >
                      {alert.acknowledged ? "Unmark" : "Acknowledge"}
                    </button>
                    <Link
                      to="/navigation"
                      className="flex items-center gap-1.5 bg-signature-coral hover:bg-soft-coral text-white font-bold px-3 py-1 rounded-sm text-xs font-mono transition-colors"
                    >
                      <RouteIcon className="w-3.5 h-3.5" />
                      <span>Mitigate Route</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </AppShell>
  );
};

export default AlertsPage;
