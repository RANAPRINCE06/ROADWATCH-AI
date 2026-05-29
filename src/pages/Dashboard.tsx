import React from 'react';
import { TrendingUp, ShieldCheck, AlertTriangle, Layers, Crosshair, Droplets, LightbulbOff, HardHat, Car } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-24">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Area Safety Score</p>
            <h3 className="text-3xl font-bold text-primary">84<span className="text-lg opacity-40">/100</span></h3>
            <p className="text-[11px] text-green-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +4.2% from last week
            </p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-surface-container" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6" />
              <circle className="text-safety-yellow" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175" strokeDashoffset="28" strokeWidth="6" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="text-safety-yellow w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-border-subtle">
          <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Hazard Reports</p>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold text-primary">12</h3>
              <p className="text-[11px] text-on-surface-variant">Active road hazards</p>
            </div>
            <div className="flex items-end gap-1 h-12">
              <div className="w-2 bg-outline-variant h-4 rounded-t-sm"></div>
              <div className="w-2 bg-outline-variant h-8 rounded-t-sm"></div>
              <div className="w-2 bg-outline-variant h-6 rounded-t-sm"></div>
              <div className="w-2 bg-primary h-10 rounded-t-sm"></div>
              <div className="w-2 bg-primary h-12 rounded-t-sm"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-border-subtle">
          <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">AI Detection Accuracy</p>
          <h3 className="text-3xl font-bold text-primary">98.5<span className="text-lg opacity-40">%</span></h3>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full w-[98.5%]"></div>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">Enhanced by neural mesh v2.4</p>
        </div>

        <div className="bg-deep-slate p-5 rounded-xl shadow-sm text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-white/60 mb-1 uppercase tracking-wider">Emergency Alerts</p>
            <h3 className="text-3xl font-bold">03</h3>
            <p className="text-[11px] text-safety-yellow font-bold mt-2 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Immediate action required
            </p>
          </div>
          <AlertTriangle className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Center Map Widget */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden relative group h-[400px] lg:h-[500px]">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="glass-card px-4 py-2 rounded-lg flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-safety-yellow animate-ping"></span>
              <p className="text-sm font-bold">Live Grid: Sector 7G</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-white/90 backdrop-blur shadow-sm p-2 rounded-lg hover:bg-white transition-all">
                <Layers className="w-5 h-5" />
              </button>
              <button className="bg-white/90 backdrop-blur shadow-sm p-2 rounded-lg hover:bg-white transition-all">
                <Crosshair className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="w-full h-full bg-surface-dim relative">
            <img 
              className="w-full h-full object-cover grayscale opacity-50" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuHFT25LrIudFzN9hASHnRgcA8BFks14OkKHmCUQHsIgxP3_efPdHHmYslWisBVEx-kYPAL-txAPhVyEdBWysgahj1JzAnfyT5ZDTy2s0D9OlsRCR4Ptdllch1EeRvlylM3nqORXTkFaZrifD2-giS6p6l0A1aYfo-GaksLZgNQ4RGx2i2L8P3hRQddcA-WQqfF6xLKPU35tm4cCYL8xEECIOHkl-TNtw2HmoENL3JBWVs9vbh25GB2z1RhXII3CXQ_qhCdGJn7lo" 
              alt="Map"
            />
            {/* Marker */}
            <div className="absolute top-1/2 left-1/3 w-12 h-12 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0 bg-safety-yellow/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-safety-yellow rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-primary font-bold text-xs">!</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 z-10 glass-card p-3 rounded-xl max-w-xs">
            <p className="text-[11px] font-bold text-on-surface-variant mb-2 uppercase">Zone Status</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-70">Traffic Density</span>
                <span className="font-bold">Moderate</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-70">Infrastructure Alert</span>
                <span className="font-bold text-error">Bridge I-95</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-border-subtle flex flex-col h-[400px] lg:h-[500px]">
          <div className="p-5 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-lg font-bold text-primary">Recent Reports</h3>
            <button className="text-sm text-on-surface-variant hover:text-primary underline">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            
            <div className="p-3 hover:bg-surface-container-low transition-colors rounded-lg flex gap-4 cursor-pointer border border-transparent hover:border-border-subtle group">
              <div className="w-12 h-12 bg-error/10 text-error rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-bold text-primary">Severe Pothole</p>
                  <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold uppercase">Critical</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">Oak St. Intersection — AI Detected</p>
                <p className="text-[10px] text-on-surface-variant opacity-60">2 minutes ago</p>
              </div>
            </div>

            <div className="p-3 hover:bg-surface-container-low transition-colors rounded-lg flex gap-4 cursor-pointer border border-transparent hover:border-border-subtle group">
              <div className="w-12 h-12 bg-safety-yellow/10 text-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <LightbulbOff className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-bold text-primary">Streetlight Failure</p>
                  <span className="text-[10px] bg-safety-yellow/20 text-on-secondary-container px-2 py-0.5 rounded-full font-bold uppercase">Pending</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">4th Avenue East — Sensor Report</p>
                <p className="text-[10px] text-on-surface-variant opacity-60">14 minutes ago</p>
              </div>
            </div>

            <div className="p-3 hover:bg-surface-container-low transition-colors rounded-lg flex gap-4 cursor-pointer border border-transparent hover:border-border-subtle group">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-bold text-primary">Road Work Started</p>
                  <span className="text-[10px] bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full font-bold uppercase">Scheduled</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">Downtown Bypass — Admin Update</p>
                <p className="text-[10px] text-on-surface-variant opacity-60">1 hour ago</p>
              </div>
            </div>

            <div className="p-3 hover:bg-surface-container-low transition-colors rounded-lg flex gap-4 cursor-pointer border border-transparent hover:border-border-subtle group">
              <div className="w-12 h-12 bg-error/10 text-error rounded-lg flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-bold text-primary">Minor Collision</p>
                  <span className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">North Circular Rd — Camera #42</p>
                <p className="text-[10px] text-on-surface-variant opacity-60">2 hours ago</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
