import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Anchor, 
  LayoutGrid, 
  Compass, 
  Snowflake, 
  Target, 
  Activity, 
  Route as RouteIcon, 
  Bell, 
  FileText,
  ChevronDown,
  Menu,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { cn } from '../utils/cn';

const primaryNav = [
  { id: 'overview', path: '/overview', icon: LayoutGrid, label: 'Overview' },
  { id: 'navigation', path: '/navigation', icon: Compass, label: 'Navigation' },
  { id: 'sea-ice', path: '/sea-ice', icon: Snowflake, label: 'Sea-Ice' },
  { id: 'icebergs', path: '/icebergs', icon: Target, label: 'Icebergs' },
  { id: 'routes', path: '/routes', icon: RouteIcon, label: 'Routes' },
];

const secondaryNav = [
  { id: 'analysis', path: '/analysis', icon: Activity, label: 'Risk Analysis', desc: 'Hydro-Ice simulation & hazard index' },
  { id: 'alerts', path: '/alerts', icon: Bell, label: 'Active Alerts', desc: 'Emergency proximity & ice warnings' },
  { id: 'reports', path: '/reports', icon: FileText, label: 'IMO Reports', desc: 'Polar Code compliance documentation' },
];

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-navy text-ice-white font-sans selection:bg-glacial-blue selection:text-white">
      {/* Streamlined Navbar */}
      <nav
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 border-b",
          scrolled 
            ? "bg-navy/95 backdrop-blur-md border-slate/30 py-3 shadow-lg" 
            : "bg-navy/60 backdrop-blur-sm border-slate/20 py-3.5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-sm bg-polar-navy/80 border border-glacial-blue/40 flex items-center justify-center group-hover:border-glacial-blue transition-colors shadow-sm">
              <Anchor className="w-4 h-4 text-ice-blue group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold tracking-wider text-sm sm:text-base text-ice-white font-mono uppercase">
              POLAR<span className="text-glacial-blue">NAV</span>
            </span>
          </NavLink>

          {/* Desktop Streamlined Capsule Nav */}
          <div className="hidden md:flex items-center gap-1 bg-polar-navy/40 p-1 rounded-md border border-slate/20">
            {primaryNav.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium tracking-wide transition-all",
                    isActive
                      ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/40 shadow-[0_0_10px_rgba(58,166,200,0.15)] font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-polar-navy/60"
                  )
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Dropdown for Secondary Tools */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium tracking-wide transition-all",
                  toolsDropdownOpen 
                    ? "bg-glacial-blue/20 text-ice-blue border border-glacial-blue/40" 
                    : "text-slate-300 hover:text-white hover:bg-polar-navy/60"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Intelligence & Logs</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform opacity-70", toolsDropdownOpen && "rotate-180")} />
              </button>

              {toolsDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-navy/95 border border-slate/30 rounded-md shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in"
                  onMouseLeave={() => setToolsDropdownOpen(false)}
                >
                  <div className="px-3 pb-2 mb-1 border-b border-slate/20 text-[10px] font-mono tracking-wider text-glacial-blue uppercase font-semibold">
                    Analytical & Safety Modules
                  </div>
                  {secondaryNav.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-start gap-3 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-polar-navy/60 transition-colors group"
                    >
                      <div className="p-1.5 rounded bg-polar-navy/60 border border-slate/20 mt-0.5 group-hover:border-glacial-blue/40">
                        <item.icon className="w-3.5 h-3.5 text-ice-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-ice-white">{item.label}</span>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">{item.desc}</p>
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Button */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/overview"
              className="flex items-center gap-2 bg-gradient-to-r from-signature-coral to-deep-coral hover:from-soft-coral hover:to-signature-coral text-white px-3.5 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(255,107,94,0.3)] active:scale-95"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-sm text-slate-300 hover:text-white hover:bg-polar-navy/60 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate/20 bg-navy/95 backdrop-blur-xl px-4 py-4 mt-3">
            <div className="text-[10px] font-mono tracking-wider text-glacial-blue uppercase font-semibold mb-2">
              Navigation Modules
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...primaryNav, ...secondaryNav].map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium text-slate-200 hover:text-white hover:bg-glacial-blue/20 border border-slate/10 transition-colors"
                >
                  <item.icon className="w-3.5 h-3.5 text-ice-blue shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-between pt-24">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-antarctic-vessel.jpg"
            alt="Antarctic Research Vessel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-hero-gradient" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full my-auto py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-6 text-glacial-blue font-mono text-xs tracking-widest">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-risk-safe animate-pulse" /> DATA STREAM ACTIVE</span>
              <span>•</span>
              <span>68°18'S 12°28'E</span>
              <span>•</span>
              <span>{new Date().toISOString().split('T')[1].substring(0, 5)} UTC</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-[1.1]">
              POLAR<span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-white via-slate-100 to-slate">NAV</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl font-light text-slate mb-6 tracking-wide max-w-2xl">
              INTELLIGENT NAVIGATION & SAFETY
            </p>
            
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              AI-powered sea-ice monitoring, iceberg trajectory forecasting, environmental risk assessment, and navigation decision support for Antarctic operations.
            </p>
          </div>
        </div>

        {/* Hero Metrics */}
        <div className="relative z-10 w-full border-t border-slate/20 bg-navy/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <p className="text-slate text-xs font-mono mb-1 tracking-widest">SEA-ICE MONITORING</p>
              <p className="text-ice-white font-semibold text-sm md:text-base">Continuous</p>
            </div>
            <div>
              <p className="text-slate text-xs font-mono mb-1 tracking-widest">ICEBERG FORECAST</p>
              <p className="text-ice-white font-semibold text-sm md:text-base">24–48 H</p>
            </div>
            <div>
              <p className="text-slate text-xs font-mono mb-1 tracking-widest">RISK ANALYSIS</p>
              <p className="text-ice-white font-semibold text-sm md:text-base">Multi-layer</p>
            </div>
            <div>
              <p className="text-slate text-xs font-mono mb-1 tracking-widest">ROUTE OPTIMIZATION</p>
              <p className="text-ice-white font-semibold text-sm md:text-base">AI-assisted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Sections */}
      <section id="overview" className="py-32 border-b border-slate/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-xs font-mono text-glacial-blue tracking-widest mb-4">01 // OBSERVE</h2>
              <h3 className="text-4xl font-bold mb-6">OBSERVE THE ENVIRONMENT</h3>
              <p className="text-slate text-lg leading-relaxed mb-8">
                The system brings sea ice, iceberg, weather and ocean information into a unified view. Real-time satellite imagery combined with telemetry from the field forms a complete geospatial picture.
              </p>
              <div className="space-y-4">
                {['Sea ice concentration', 'Iceberg locations', 'Wind and ocean current vectors', 'Temperature profiles'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-ice-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-ice-blue" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square md:aspect-[4/3] bg-polar-navy rounded-sm overflow-hidden border border-slate/20">
               <img
                 src="/images/observe-antarctica.jpg"
                 alt="Antarctic Sea Ice Observation"
                 className="w-full h-full object-cover"
               />
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-32 border-b border-slate/10 bg-polar-navy/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center flex-row-reverse">
             <div className="order-2 md:order-1 relative aspect-square md:aspect-[4/3] bg-navy rounded-sm overflow-hidden border border-slate/20 p-6 sm:p-8 flex flex-col justify-end group">
                <div className="absolute inset-0 z-0">
                  <img
                    src="/images/icebreaker-channel.jpg"
                    alt="Antarctic Sea Ice and Vessel Channel"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-hero-gradient" />
                </div>
                <div className="bg-polar-navy/90 border border-slate/30 p-6 rounded-sm w-full sm:w-5/6 shadow-2xl backdrop-blur-md z-10 relative">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-mono text-xs text-glacial-blue font-semibold tracking-wider">ICEBERG A-17</h4>
                    <span className="text-[10px] font-mono bg-risk-high/20 text-risk-high border border-risk-high/40 px-2 py-0.5 rounded">
                      CPA THREAT
                    </span>
                  </div>
                  <div className="space-y-3 font-mono text-sm text-ice-white">
                    <div className="flex justify-between border-b border-slate/20 pb-2">
                      <span className="text-slate-300">Velocity</span>
                      <span>0.42 knots</span>
                    </div>
                    <div className="flex justify-between border-b border-slate/20 pb-2">
                      <span className="text-slate-300">Direction</span>
                      <span>NE</span>
                    </div>
                    <div className="flex justify-between border-b border-slate/20 pb-2">
                      <span className="text-slate-300">24H Forecast</span>
                      <span className="text-signature-coral font-semibold">+18.4 km</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-300">Confidence</span>
                      <span className="text-glacial-blue font-semibold">87%</span>
                    </div>
                  </div>
                </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-xs font-mono text-signature-coral tracking-widest mb-4">02 // PREDICT</h2>
              <h3 className="text-4xl font-bold mb-6">PREDICT WHERE THE ICE IS GOING</h3>
              <p className="text-slate text-lg leading-relaxed mb-6">
                Understand the trajectory. Our AI models analyze historical drift, current ocean conditions, and wind parameters to forecast the movement of hazardous icebergs over a 48-hour horizon.
              </p>
              <p className="text-slate text-lg leading-relaxed">
                The prediction uncertainty corridor transparently represents the AI's confidence, ensuring operational safety without assuming perfect accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="py-32">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-xs font-mono text-glacial-blue tracking-widest mb-4">03 // ASSESS & NAVIGATE</h2>
            <h3 className="text-4xl font-bold mb-6">FROM OBSERVATION TO DECISION</h3>
            <p className="text-slate text-lg leading-relaxed mb-16">
              The system does not simply visualize environmental data; it converts it into actionable navigation intelligence. Route recommendations balance minimal transit time with critical safety considerations.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-left">
               <div className="bg-polar-navy/30 border border-slate/20 p-6 rounded-sm">
                  <h4 className="font-semibold mb-2">ROUTE A — Shortest</h4>
                  <p className="text-3xl font-light mb-4">842 km</p>
                  <p className="text-risk-high text-xs font-mono mb-2">HIGH RISK</p>
                  <div className="w-full h-1 bg-slate/20 rounded-full overflow-hidden"><div className="w-4/5 h-full bg-risk-high" /></div>
               </div>
               <div className="bg-signature-coral/10 border border-signature-coral/30 p-6 rounded-sm shadow-[0_0_30px_rgba(255,107,94,0.05)] transform md:-translate-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">ROUTE B</h4>
                    <span className="text-[10px] font-mono bg-signature-coral text-white px-2 py-0.5 rounded-sm">RECOMMENDED</span>
                  </div>
                  <p className="text-3xl font-light mb-4">879 km</p>
                  <p className="text-risk-safe text-xs font-mono mb-2">LOW RISK</p>
                  <div className="w-full h-1 bg-slate/20 rounded-full overflow-hidden"><div className="w-1/4 h-full bg-risk-safe" /></div>
                  <p className="text-xs text-slate mt-4 border-t border-slate/20 pt-4">+4.4% distance → 52% lower ice-related risk.</p>
               </div>
               <div className="bg-polar-navy/30 border border-slate/20 p-6 rounded-sm">
                  <h4 className="font-semibold mb-2">ROUTE C — Conservative</h4>
                  <p className="text-3xl font-light mb-4">925 km</p>
                  <p className="text-risk-safe text-xs font-mono mb-2">VERY LOW RISK</p>
                  <div className="w-full h-1 bg-slate/20 rounded-full overflow-hidden"><div className="w-1/6 h-full bg-risk-safe" /></div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer info section */}
      <footer className="py-20 border-t border-slate/10 bg-gradient-to-b from-navy to-[#030910] text-center">
        <div className="max-w-3xl mx-auto px-6">
           <h2 className="text-2xl md:text-3xl font-bold mb-4">KNOW WHAT LIES AHEAD.</h2>
           <p className="text-base text-slate">Continuous environmental intelligence and autonomous decision support for polar mariners.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
