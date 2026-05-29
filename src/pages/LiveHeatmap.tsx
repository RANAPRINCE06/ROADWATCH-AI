import React from 'react';
import { Layers, Fullscreen, LocateFixed, Eye } from 'lucide-react';

export function LiveHeatmap() {
  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col relative overflow-hidden bg-surface-dim">
      
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJ6KTt19mA2ZnhVGznPknnIgyOEFjv-lR8N4EjxGL7VhmG7Wnuad6SeQnkglTAIdemYr9fWJ-B1Hf4GT35MDXsLwnKQug_p1sgclQLJXC6chqPrM018wG-zf_E2UKLDmr2kuCuTHudcZ89ID9WDkexE3bCX8X5mR8F6kmNLyaz2pedxhGlSO1zryhMjFchMSdDKF9bqbuYMT3YojXBbPRwYTjtLc_f8Wcjv5fwuoQt_bqVmMtutbSRBVsVBzCkCmRdFqnIPzPzG0U" 
          className="w-full h-full object-cover opacity-60 grayscale mix-blend-luminosity" 
          alt="Map Background"
        />
        <div className="absolute inset-0 pointer-events-none heatmap-overlay">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient cx="50%" cy="50%" id="gradRed" r="50%">
                <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.6"></stop>
                <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0"></stop>
              </radialGradient>
              <radialGradient cx="50%" cy="50%" id="gradYellow" r="50%">
                <stop offset="0%" stopColor="#FACC15" stopOpacity="0.5"></stop>
                <stop offset="100%" stopColor="#FACC15" stopOpacity="0"></stop>
              </radialGradient>
              <radialGradient cx="50%" cy="50%" id="gradGreen" r="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0"></stop>
              </radialGradient>
            </defs>
            <circle cx="40%" cy="30%" fill="url(#gradRed)" r="200"></circle>
            <circle cx="65%" cy="50%" fill="url(#gradYellow)" r="300"></circle>
            <circle cx="20%" cy="70%" fill="url(#gradRed)" r="150"></circle>
            <circle cx="80%" cy="20%" fill="url(#gradGreen)" r="180"></circle>
            <circle cx="50%" cy="80%" fill="url(#gradYellow)" r="250"></circle>
          </svg>
        </div>
      </div>

      {/* Top Left Controls */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
        <div className="glass-panel p-2 rounded-xl border border-white/20 shadow-lg flex flex-col gap-2 w-14 items-center">
          <button className="p-2.5 bg-primary text-white rounded-lg shadow-sm">
            <Layers className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors">
            <Eye className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors">
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-white/20 shadow-lg w-56">
          <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-4">Layers</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary" />
              <span className="text-sm font-medium group-hover:text-primary">Potholes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary" />
              <span className="text-sm font-medium group-hover:text-primary">Flooding</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded text-primary" />
              <span className="text-sm font-medium group-hover:text-primary">Obstacles</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary" />
              <span className="text-sm font-medium group-hover:text-primary">Live Traffic</span>
            </label>
          </div>
        </div>
      </div>

      {/* Top Right Live Feed & Stats */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-4 w-80">
        <div className="glass-panel p-5 rounded-xl border border-white/20 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-primary">Live Incident Feed</h3>
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse mt-2"></span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 items-start border-l-2 border-error pl-3">
              <div>
                <p className="text-sm font-bold text-primary">Severe Waterlogging</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">Sector 4, Orchard Rd</p>
              </div>
            </div>
            <div className="flex gap-3 items-start border-l-2 border-safety-yellow pl-3">
              <div>
                <p className="text-sm font-bold text-primary">Active Pothole</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">Bayfront Ave North</p>
              </div>
            </div>
            <div className="flex gap-3 items-start border-l-2 border-safety-yellow pl-3">
              <div>
                <p className="text-sm font-bold text-primary">Narrow Lane Risk</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">Cross St Junction</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-white/20 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Hazards</p>
              <p className="text-4xl font-bold text-primary mt-1">42</p>
              <p className="text-xs text-error font-bold mt-1">+12% vs last hr</p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Risk Index</p>
              <p className="text-3xl font-bold text-safety-yellow mt-1">High</p>
              <p className="text-xs text-text-secondary mt-1 tracking-tight">Zone Alpha</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
