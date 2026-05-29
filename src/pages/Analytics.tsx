import React, { useState } from 'react';
import { BarChart3, TrendingUp, Cpu, Server, Activity, Timer, ChevronDown } from 'lucide-react';

export function Analytics() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const weeklyData = [
    { day: 'Mon', count: 18, details: '10 Potholes, 5 Floods, 3 Obstacles' },
    { day: 'Tue', count: 24, details: '12 Potholes, 8 Floods, 4 Obstacles' },
    { day: 'Wed', count: 32, details: '18 Potholes, 10 Floods, 4 Obstacles' },
    { day: 'Thu', count: 20, details: '11 Potholes, 6 Floods, 3 Obstacles' },
    { day: 'Fri', count: 42, details: '25 Potholes, 12 Floods, 5 Obstacles' },
    { day: 'Sat', count: 15, details: '8 Potholes, 4 Floods, 3 Obstacles' },
    { day: 'Sun', count: 11, details: '5 Potholes, 3 Floods, 3 Obstacles' }
  ];

  const distributionData = [
    { type: 'Pothole', percentage: 55, color: '#FACC15', details: '68 Detections' },
    { type: 'Flooding', percentage: 30, color: '#3B82F6', details: '37 Detections' },
    { type: 'Obstacle', percentage: 15, color: '#F97316', details: '19 Detections' }
  ];

  const maxVal = Math.max(...weeklyData.map(d => d.count));

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Infrastructure Analytics</h2>
        <p className="text-text-secondary mt-1">AI-assisted road safety and telemetry metrics dashboard.</p>
      </div>

      {/* KPI Tickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Active Edge Nodes</span>
            <h3 className="text-2xl font-bold text-primary mt-1">1,280</h3>
            <p className="text-[10px] text-green-600 font-semibold mt-1">● 99.8% Online</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">AI Inference Rate</span>
            <h3 className="text-2xl font-bold text-primary mt-1">98.5%</h3>
            <p className="text-[10px] text-text-secondary mt-1">Mesh model v2.4</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Mean Resolve Time</span>
            <h3 className="text-2xl font-bold text-primary mt-1">42m</h3>
            <p className="text-[10px] text-green-600 font-semibold mt-1">▼ 12% vs last week</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Timer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">System Health</span>
            <h3 className="text-2xl font-bold text-primary mt-1">Stable</h3>
            <p className="text-[10px] text-text-secondary mt-1">Telemetry healthy</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Bar Chart (SVG-based) */}
        <section className="lg:col-span-8 bg-white p-6 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm text-primary">Weekly Incident Frequency</h3>
              <p className="text-xs text-text-secondary">Distribution of detected municipal anomalies by weekday.</p>
            </div>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-text-secondary uppercase tracking-wider flex items-center gap-1">
              Last 7 Days <ChevronDown className="w-3 h-3" />
            </span>
          </div>

          {/* SVG graph */}
          <div className="relative pt-6">
            <div className="h-64 w-full flex items-end gap-4 relative border-b border-border-subtle pb-2">
              {weeklyData.map((d, idx) => {
                const percent = (d.count / maxVal) * 100;
                const isHovered = hoveredBar === idx;
                
                return (
                  <div 
                    key={d.day}
                    className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isHovered ? 'bg-primary' : 'bg-safety-yellow'
                      }`}
                      style={{ height: `${percent}%` }}
                    />
                    
                    {/* Day label */}
                    <span className="text-[10px] font-bold text-text-secondary mt-2">{d.day}</span>
                    
                    {/* Count overlay */}
                    <span className="absolute bottom-full mb-1.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hover details box */}
            <div className="mt-4 h-10 border border-dashed border-border-subtle rounded-lg bg-slate-50 flex items-center px-4 justify-between transition-all">
              <span className="text-[11px] font-semibold text-text-secondary">
                {hoveredBar !== null ? `anomalies on ${weeklyData[hoveredBar].day}:` : 'Hover over a bar to view detail breakdown'}
              </span>
              <span className="text-[11px] font-bold text-primary">
                {hoveredBar !== null ? weeklyData[hoveredBar].details : ''}
              </span>
            </div>
          </div>
        </section>

        {/* Hazard Distribution Pie/Donut (SVG-based) */}
        <section className="lg:col-span-4 bg-white p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary mb-1">Hazard Distribution</h3>
            <p className="text-xs text-text-secondary mb-6">Percentage makeup of active incident reports.</p>
          </div>

          <div className="flex justify-center items-center relative h-48">
            {/* Simple SVG Donut Chart */}
            <svg width="180" height="180" viewBox="0 0 40 40" className="rotate-[-90deg]">
              {/* Pothole slice: 55% -> dasharray="22 18" (circumference is 2*pi*r, r=15.915, circ=100) */}
              <circle
                cx="20"
                cy="20"
                r="15.915"
                fill="transparent"
                stroke="#FACC15"
                strokeWidth="5"
                strokeDasharray="55 45"
                strokeDashoffset="0"
                className="cursor-pointer hover:stroke-[6] transition-all"
                onMouseEnter={() => setHoveredSlice('Pothole')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
              {/* Flooding slice: 30% -> dasharray="30 70" */}
              <circle
                cx="20"
                cy="20"
                r="15.915"
                fill="transparent"
                stroke="#3B82F6"
                strokeWidth="5"
                strokeDasharray="30 70"
                strokeDashoffset="-55"
                className="cursor-pointer hover:stroke-[6] transition-all"
                onMouseEnter={() => setHoveredSlice('Flooding')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
              {/* Obstacle slice: 15% -> dasharray="15 85" */}
              <circle
                cx="20"
                cy="20"
                r="15.915"
                fill="transparent"
                stroke="#F97316"
                strokeWidth="5"
                strokeDasharray="15 85"
                strokeDashoffset="-85"
                className="cursor-pointer hover:stroke-[6] transition-all"
                onMouseEnter={() => setHoveredSlice('Obstacle')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {hoveredSlice || 'Total'}
              </span>
              <span className="text-xl font-bold text-primary">
                {hoveredSlice 
                  ? `${distributionData.find(d => d.type === hoveredSlice)?.percentage}%`
                  : '124'
                }
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-4">
            {distributionData.map((d) => (
              <div key={d.type} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="font-semibold text-text-secondary">{d.type}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary mr-2">{d.percentage}%</span>
                  <span className="text-[10px] text-text-secondary">{d.details}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
