import { useState } from 'react';
import { 
  Map as MapIcon, Navigation2, ThermometerSnowflake, 
  Target, Route as RouteIcon, CloudRainWind, 
  History, AlertTriangle, FileText, Settings
} from 'lucide-react';
import PolarMap from '../components/map/PolarMap';
import IntelligencePanel from '../components/IntelligencePanel';
import RouteOptimization from '../components/RouteOptimization';
import { cn } from '../utils/cn';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIcebergId, setSelectedIcebergId] = useState<string | null>(null);
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  
  const navItems = [
    { id: 'overview', icon: MapIcon, label: 'Overview' },
    { id: 'navigation', icon: Navigation2, label: 'Navigation' },
    { id: 'sea-ice', icon: ThermometerSnowflake, label: 'Sea-Ice Analysis' },
    { id: 'icebergs', icon: Target, label: 'Iceberg Tracking' },
    { id: 'routes', icon: RouteIcon, label: 'Route Optimization' },
    { id: 'weather', icon: CloudRainWind, label: 'Weather & Ocean' },
    { id: 'history', icon: History, label: 'Historical Data' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (id === 'routes') setShowRouteOptimization(true);
    else setShowRouteOptimization(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#030910] text-ice-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate/20 bg-navy flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-semibold tracking-wide text-sm flex items-center gap-2 font-mono">
             <div className="w-2 h-2 rounded-full bg-signature-coral" />
             POLARNAV
          </div>
          <div className="hidden md:flex text-xs text-slate font-mono border-l border-slate/30 pl-4">
            Sea-Ice · Iceberg · Ocean · Navigation Decision Support
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono text-slate">
           <div className="hidden lg:block">{new Date().toISOString().split('T')[1].substring(0, 5)} UTC</div>
           <div className="hidden lg:block">DATA STATUS: <span className="text-risk-safe">LIVE</span></div>
           <div className="flex items-center gap-2 text-ice-white">
              <span className="w-2 h-2 rounded-full bg-risk-safe animate-pulse" />
              SYSTEM OPERATIONAL
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 md:w-56 border-r border-slate/20 bg-navy flex flex-col z-20 shrink-0">
          <div className="flex-1 py-4 flex flex-col gap-1 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all group",
                  activeTab === item.id 
                    ? "bg-polar-navy text-ice-white border-l-2 border-glacial-blue" 
                    : "text-slate hover:text-ice-white hover:bg-polar-navy/50 border-l-2 border-transparent"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-glacial-blue" : "")} />
                <span className="hidden md:block text-sm font-medium text-left">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate/20">
             <button className="flex items-center gap-3 text-slate hover:text-ice-white transition-colors w-full">
                <Settings className="w-5 h-5" />
                <span className="hidden md:block text-sm font-medium">Settings</span>
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col lg:flex-row">
          
          {/* Map Container */}
          <div className="flex-1 relative h-full">
            <PolarMap 
              section="overview"
              selectedIcebergId={selectedIcebergId} 
              onSelectIceberg={setSelectedIcebergId}
              showRouteOptimization={showRouteOptimization}
            />
            


            {/* Time Machine / Timeline */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-navy/90 backdrop-blur-md border border-slate/30 px-6 py-3 rounded-full flex items-center gap-4 shadow-xl">
               <span className="text-xs font-mono text-slate">24H AGO</span>
               <div className="w-48 h-1 bg-slate/20 rounded-full relative">
                  <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 rounded-full bg-signature-coral shadow-[0_0_10px_#FF6B5E]" />
                  <div className="absolute top-0 left-0 h-full w-1/3 bg-signature-coral/30 rounded-l-full" />
               </div>
               <span className="text-xs font-mono text-ice-white font-bold">NOW</span>
               <div className="w-48 h-1 bg-slate/20 rounded-full relative">
                  <div className="absolute top-0 left-1/3 w-0.5 h-2 -translate-y-0.5 bg-slate/50" />
                  <div className="absolute top-0 left-2/3 w-0.5 h-2 -translate-y-0.5 bg-slate/50" />
               </div>
               <span className="text-xs font-mono text-slate">+48H</span>
            </div>
          </div>

          {/* Right Panel or Drawer */}
          <div className={cn(
            "w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate/20 bg-navy/95 backdrop-blur-sm z-[500] flex flex-col shrink-0 transition-transform duration-300",
            "h-1/3 lg:h-full lg:static absolute bottom-0", // Mobile drawer behavior
            showRouteOptimization ? "hidden" : "flex"
          )}>
            <IntelligencePanel selectedIcebergId={selectedIcebergId} />
          </div>
          
          {/* Route Optimization Drawer */}
          {showRouteOptimization && (
            <div className="absolute inset-y-0 right-0 w-full lg:w-[450px] bg-navy/95 backdrop-blur-md border-l border-slate/20 z-[500] shadow-2xl animate-in slide-in-from-right">
              <RouteOptimization onClose={() => setShowRouteOptimization(false)} />
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;
