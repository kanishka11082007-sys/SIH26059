import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, 
  RotateCcw, X, Mountain, ExternalLink
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { cn } from '../utils/cn';

export const TacticalHazardBanner: React.FC<{ className?: string }> = ({ className }) => {
  const { 
    tacticalAlert, 
    dismissTacticalAlert, 
    setSelectedIcebergId
  } = useFleet();

  if (!tacticalAlert.active) return null;

  const isDetecting = tacticalAlert.phase === 'detecting';
  const hazId = tacticalAlert.icebergId || 'IB-A84';

  const handleInspect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hazId) {
      setSelectedIcebergId(hazId);
    }
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissTacticalAlert();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissTacticalAlert();
  };

  return (
    <div 
      role="alert"
      aria-label="Tactical Iceberg Alert"
      className={cn(
        "z-50 pointer-events-auto transition-all duration-300",
        className
      )}
    >
      <div
        className={cn(
          "backdrop-blur-md rounded-lg border px-3.5 py-2 shadow-2xl transition-all font-mono text-xs flex flex-wrap items-center justify-between gap-2.5",
          isDetecting
            ? "bg-[#05111e]/95 border-signature-coral/80 text-ice-white shadow-[0_0_20px_rgba(255,107,94,0.3)] animate-pulse"
            : "bg-[#05111e]/95 border-emerald-500/70 text-ice-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        )}
      >
        {/* Left: Status Badge & Concise Telemetry */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
              isDetecting
                ? "bg-signature-coral/20 border-signature-coral text-signature-coral animate-spin"
                : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
            )}
          >
            {isDetecting ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                isDetecting
                  ? "bg-signature-coral/20 border-signature-coral text-signature-coral"
                  : "bg-emerald-500/20 border-emerald-500 text-emerald-300"
              )}
            >
              {isDetecting ? "DETECTING HAZARD" : "TACTICAL BYPASS"}
            </span>

            <span className="text-ice-white font-semibold truncate">
              {hazId}
            </span>

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              •
            </span>

            <span className="text-glacial-blue text-[11px] font-medium">
              {tacticalAlert.headingChange || "+12° Starboard"} ({tacticalAlert.clearanceKm || 26.4} km CPA)
            </span>

            {tacticalAlert.extraDistKm && (
              <span className="text-amber-400 text-[10px] hidden md:inline">
                (+{tacticalAlert.extraDistKm} km)
              </span>
            )}
          </div>
        </div>

        {/* Right: Functional Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Inspect Iceberg on map */}
          <button
            type="button"
            onClick={handleInspect}
            className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:shadow-sm"
            title="Focus and inspect this iceberg on the polar map"
          >
            <Mountain className="w-3 h-3 text-cyan-400" />
            <span>Inspect</span>
          </button>

          {/* View in Alerts Section */}
          <Link
            to="/alerts"
            className="px-2 py-1 rounded bg-signature-coral/20 hover:bg-signature-coral/30 border border-signature-coral/50 text-signature-coral text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Open incident registry in Alerts page"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Alerts</span>
            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
          </Link>

          {/* Restore Nominal Route */}
          <button
            type="button"
            onClick={handleRestore}
            className="px-2 py-1 rounded bg-polar-navy/60 hover:bg-polar-navy border border-slate/30 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition-all"
            title="Revert diversion and restore nominal transit corridor"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Restore</span>
          </button>

          {/* Close / Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-polar-navy/60 cursor-pointer transition-colors ml-0.5"
            title="Dismiss Alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
