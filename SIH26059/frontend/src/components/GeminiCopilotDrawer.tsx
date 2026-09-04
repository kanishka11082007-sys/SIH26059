import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Send, ShieldCheck, Cpu, CheckCircle2, 
  AlertTriangle, Compass, Fuel, Shield, Clock, Loader2 
} from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../utils/cn';

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decisionContext?: {
    vessel?: {
      name?: string;
      polar_class?: string;
      destination?: string;
      speed?: number;
    };
    route?: {
      id?: string;
      name?: string;
      distance?: number;
      eta?: string;
      fuelConsumption?: string | number;
      rioScore?: number | string;
      sicExposure?: number;
      cpa_km?: number;
      reason?: string;
    };
  };
}

const SAMPLE_QUESTIONS = [
  "Why was Route B selected over Route A?",
  "Explain the IMO POLARIS RIO score and safety margins.",
  "How does this corridor avoid moving icebergs?",
  "Analyze fuel efficiency and voyage endurance tradeoffs."
];

export const GeminiCopilotDrawer: React.FC<GeminiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  decisionContext
}) => {
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusInfo, setStatusInfo] = useState<{
    status: string;
    active_provider: string;
    gemini_authenticated: boolean;
    model: string;
  } | null>(null);
  const [copilotResponse, setCopilotResponse] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Copilot API Health on mount
  useEffect(() => {
    if (isOpen) {
      api.copilotStatus()
        .then(res => setStatusInfo(res))
        .catch(() => setStatusInfo(null));
      
      // Auto-fetch explanation for the currently selected route if empty
      if (!copilotResponse) {
        handleSendPrompt("Why was this route selected, how are ice risks mitigated, and what are the key operational tradeoffs?");
      }
    }
  }, [isOpen]);

  const handleSendPrompt = async (promptText?: string) => {
    const activePrompt = promptText || question;
    if (!activePrompt.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      vessel: {
        name: decisionContext?.vessel?.name || 'SA Agulhas II',
        polar_class: decisionContext?.vessel?.polar_class || 'PC5',
        destination: decisionContext?.vessel?.destination || 'Bharati Station (Larsemann Hills)'
      },
      recommended_route: {
        name: decisionContext?.route?.name || 'Route B (Optimal Corridor)',
        distance_km: decisionContext?.route?.distance || 1680,
        eta: decisionContext?.route?.eta || '32h 05m',
        fuel_estimate: decisionContext?.route?.fuelConsumption || '86 MT',
        rio_score: decisionContext?.route?.rioScore ?? '+8.4',
        sea_ice_exposure: decisionContext?.route?.sicExposure ?? 22,
        minimum_cpa_km: decisionContext?.route?.cpa_km ?? 24.5,
        reason: decisionContext?.route?.reason || ''
      }
    };

    try {
      const res = await api.copilot(payload, activePrompt);
      setCopilotResponse(res);
      setQuestion('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reach AI Navigation Copilot endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isGeminiLive = copilotResponse?.provider === 'gemini';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-[#050e18] border-l border-cyan-500/30 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] flex flex-col text-slate-100 font-sans backdrop-blur-xl animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700/60 bg-[#061424] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-ice-white font-mono uppercase">
                AI Navigation Copilot
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {statusInfo?.model || 'gemini-3.6-flash'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Zero-Leakage Backend Gateway • Grounded Maritime LLM</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Close Copilot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Decision Context Bar */}
      <div className="px-4 py-2.5 bg-[#08182d] border-b border-slate-800 text-xs font-mono grid grid-cols-3 gap-2">
        <div className="truncate">
          <span className="text-[9px] text-slate-400 block">VESSEL</span>
          <span className="text-cyan-300 font-semibold truncate block">
            {decisionContext?.vessel?.name || 'SA Agulhas II'} ({decisionContext?.vessel?.polar_class || 'PC5'})
          </span>
        </div>
        <div className="truncate">
          <span className="text-[9px] text-slate-400 block">CORRIDOR</span>
          <span className="text-emerald-400 font-semibold truncate block">
            {decisionContext?.route?.name?.split(' - ')[0] || 'Route B (Optimal)'}
          </span>
        </div>
        <div className="truncate text-right">
          <span className="text-[9px] text-slate-400 block">RIO / SIC</span>
          <span className="text-cyan-200 font-semibold block">
            {String(decisionContext?.route?.rioScore ?? '+8.4')} / {decisionContext?.route?.sicExposure ?? 22}%
          </span>
        </div>
      </div>

      {/* Main Conversation & Output Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        
        {/* Explanation Card */}
        {isLoading ? (
          <div className="p-6 rounded-lg bg-[#091e36]/60 border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-3 py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-xs font-mono text-cyan-200">
              Gemini 3.6 Flash synthesizing polar maritime decision...
            </div>
            <p className="text-[10px] text-slate-400 max-w-xs">
              Evaluating IMO POLARIS RIO boundaries, bathymetry clearance, and iceberg drift kinematic envelope.
            </p>
          </div>
        ) : copilotResponse ? (
          <div className="space-y-4">
            
            {/* Status & Mode Banner */}
            <div className={cn(
              "p-2.5 rounded border text-xs font-mono flex items-center justify-between",
              isGeminiLive
                ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                : "bg-amber-950/40 border-amber-500/40 text-amber-300"
            )}>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase">
                  {copilotResponse.explanation_mode || 'GEMINI_AI_GROUNDED'}
                </span>
                <span className="text-slate-400 text-[10px]">({copilotResponse.model})</span>
              </div>
              {copilotResponse.latency_ms && (
                <span className="text-[10px] text-slate-400">
                  {copilotResponse.latency_ms} ms
                </span>
              )}
            </div>

            {/* High Level Executive Summary */}
            <div className="p-4 rounded-lg bg-[#091b30] border border-slate-700/80 shadow-md">
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                <span>Executive Decision Summary</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {copilotResponse.summary}
              </p>
            </div>

            {/* Structured Factors / Reasoning */}
            {copilotResponse.key_factors?.length > 0 && (
              <div className="p-4 rounded-lg bg-[#091b30] border border-slate-700/80 shadow-md space-y-2.5">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Key Navigational &amp; Risk Mitigations</span>
                </div>
                <div className="space-y-2">
                  {copilotResponse.key_factors.map((factor: string, idx: number) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-[#061424]/80 p-2.5 rounded border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        {factor.replace(/\*\*/g, '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mathematical Decision Grounding */}
            {copilotResponse.decision_basis && (
              <div className="p-3 rounded-lg bg-[#061424] border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Grounding Metadata (No Hallucination)
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>Vessel: <span className="text-slate-200">{copilotResponse.decision_basis.vessel}</span></div>
                  <div>Polar Class: <span className="text-slate-200">{copilotResponse.decision_basis.polar_class}</span></div>
                  <div>Corridor: <span className="text-emerald-300">{copilotResponse.decision_basis.corridor}</span></div>
                  <div>POLARIS RIO: <span className="text-cyan-300">{copilotResponse.decision_basis.rio_score}</span></div>
                  <div>Iceberg CPA: <span className="text-cyan-300">{copilotResponse.decision_basis.iceberg_cpa_km} km</span></div>
                  <div>Fuel Est: <span className="text-slate-200">{copilotResponse.decision_basis.fuel_estimate}</span></div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {errorMsg && (
          <div className="p-3 rounded bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Sample Prompts */}
        <div className="pt-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Suggested Master Prompts:
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPrompt(q)}
                disabled={isLoading}
                className="text-left text-xs text-slate-300 bg-[#08182d] hover:bg-[#0c223d] hover:text-cyan-300 hover:border-cyan-500/40 p-2 rounded border border-slate-800 transition-colors disabled:opacity-50"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Input Box */}
      <div className="p-3 border-t border-slate-700/60 bg-[#061424]">
        <div className="relative flex items-center">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            placeholder="Ask Gemini Copilot anything about the route or polar risks..."
            rows={2}
            className="w-full bg-[#030910] border border-slate-700 rounded-md p-2.5 pr-12 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 resize-none"
          />
          <button
            type="button"
            onClick={() => handleSendPrompt()}
            disabled={isLoading || !question.trim()}
            className="absolute right-2 bottom-2.5 p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded transition-all shadow-md"
            title="Ask Gemini"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-1.5 px-1 text-[9px] font-mono text-slate-500">
          <span>Press Enter to send • 25s timeout</span>
          <span>Google Gemini API (Protected)</span>
        </div>
      </div>
    </div>
  );
};
