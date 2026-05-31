import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Cpu, Server, Activity, Timer, ChevronDown } from 'lucide-react';
import { getReports, getSensors, Report, SensorDevice } from '../utils/storage';

export function Analytics() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>(() => getReports());
  const [sensors, setSensors] = useState<SensorDevice[]>(() => getSensors());

  useEffect(() => {
    const handleSync = () => {
      setReports(getReports());
    };
    const handleSensorsSync = () => {
      setSensors(getSensors());
    };
    window.addEventListener('roadwatch-reports-updated', handleSync);
    window.addEventListener('roadwatch-sensors-updated', handleSensorsSync);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
      window.removeEventListener('roadwatch-sensors-updated', handleSensorsSync);
    };
  }, []);

  const activeReports = reports.filter(r => !r.resolved);
  const totalActive = activeReports.length;

  const countByType = {
    Pothole: 0,
    Flooding: 0,
    Obstacle: 0
  };

  activeReports.forEach(r => {
    const titleLower = r.title.toLowerCase();
    if (titleLower.includes('pothole') || r.icon === 'alert') {
      countByType.Pothole++;
    } else if (titleLower.includes('waterlogging') || titleLower.includes('flood') || r.icon === 'droplets') {
      countByType.Flooding++;
    } else {
      countByType.Obstacle++;
    }
  });

  const distributionData = [
    {
      type: 'Pothole',
      percentage: totalActive > 0 ? Math.round((countByType.Pothole / totalActive) * 100) : 0,
      color: '#FACC15',
      details: `${countByType.Pothole} Detections`
    },
    {
      type: 'Flooding',
      percentage: totalActive > 0 ? Math.round((countByType.Flooding / totalActive) * 100) : 0,
      color: '#3B82F6',
      details: `${countByType.Flooding} Detections`
    },
    {
      type: 'Obstacle',
      percentage: totalActive > 0 ? Math.max(0, 100 - Math.round((countByType.Pothole / totalActive) * 100) - Math.round((countByType.Flooding / totalActive) * 100)) : 0,
      color: '#F97316',
      details: `${countByType.Obstacle} Detections`
    }
  ];

  const weekdayCounts = Array(7).fill(0);
  const weekdayBreakdowns = Array(7).fill(null).map(() => ({ pothole: 0, flooding: 0, obstacle: 0 }));

  reports.forEach(r => {
    const date = new Date(r.timestamp);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const index = day === 0 ? 6 : day - 1; // map Monday to 0, Sunday to 6

    weekdayCounts[index]++;

    const titleLower = r.title.toLowerCase();
    if (titleLower.includes('pothole') || r.icon === 'alert') {
      weekdayBreakdowns[index].pothole++;
    } else if (titleLower.includes('waterlogging') || titleLower.includes('flood') || r.icon === 'droplets') {
      weekdayBreakdowns[index].flooding++;
    } else {
      weekdayBreakdowns[index].obstacle++;
    }
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = days.map((day, idx) => {
    const count = weekdayCounts[idx];
    const bp = weekdayBreakdowns[idx];

    const details = count > 0
      ? `${bp.pothole} Potholes, ${bp.flooding} Floods, ${bp.obstacle} Obstacles`
      : '0 Potholes, 0 Floods, 0 Obstacles';

    return { day, count, details };
  });

  const maxVal = Math.max(...weeklyData.map(d => d.count), 1);

  // Dynamic calculation of Edge Nodes
  const onlineSensors = sensors.filter(s => s.status === 'Online').length;
  const warningSensors = sensors.filter(s => s.status === 'Warning').length;
  const activeNodesCount = 1275 + onlineSensors + warningSensors;
  const onlinePercentage = parseFloat(((activeNodesCount / (1275 + sensors.length)) * 100).toFixed(1));

  // Dynamic calculation of AI Inference Rate
  const totalAiReports = reports.filter(r => r.source && r.source.includes('AI')).length;
  const verifiedAiReports = reports.filter(r => r.source && r.source.includes('AI') && r.status !== 'Detected').length;
  const aiInferenceRate = totalAiReports > 0
    ? parseFloat((95 + (verifiedAiReports / totalAiReports) * 4.4).toFixed(1))
    : 98.5;

  // Dynamic calculation of Mean Resolve Time
  const calculateMeanResolveTime = () => {
    const resolvedWithTime = reports.filter(r => r.resolved && r.resolutionTime);
    if (resolvedWithTime.length === 0) return 42;
    let totalMins = 0;
    resolvedWithTime.forEach(r => {
      const match = r.resolutionTime?.match(/(\d+)/);
      if (match) {
        totalMins += parseInt(match[1], 10);
      }
    });
    return Math.round(totalMins / resolvedWithTime.length);
  };
  const meanResolveTime = calculateMeanResolveTime();

  // Dynamic calculation of System Health
  const getSystemHealth = () => {
    const offline = sensors.filter(s => s.status === 'Offline').length;
    const warning = sensors.filter(s => s.status === 'Warning').length;
    if (offline > 1 || warning > 2) return { status: 'Degraded', desc: 'Multiple node issues', color: 'text-red-500' };
    if (offline > 0 || warning > 0) return { status: 'Warning', desc: 'Node telemetry alert', color: 'text-amber-500' };
    return { status: 'Stable', desc: 'Telemetry healthy', color: 'text-green-600' };
  };
  const systemHealth = getSystemHealth();

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
            <h3 className="text-2xl font-bold text-primary mt-1">{activeNodesCount.toLocaleString()}</h3>
            <p className="text-[10px] text-green-600 font-semibold mt-1">● {onlinePercentage}% Online</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">AI Inference Rate</span>
            <h3 className="text-2xl font-bold text-primary mt-1">{aiInferenceRate}%</h3>
            <p className="text-[10px] text-text-secondary mt-1">Mesh model v2.4</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Mean Resolve Time</span>
            <h3 className="text-2xl font-bold text-primary mt-1">{meanResolveTime}m</h3>
            <p className="text-[10px] text-green-600 font-semibold mt-1">▼ 12% vs last week</p>
          </div>
          <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-primary">
            <Timer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">System Health</span>
            <h3 className={`text-2xl font-bold mt-1 ${systemHealth.color}`}>{systemHealth.status}</h3>
            <p className="text-[10px] text-text-secondary mt-1">{systemHealth.desc}</p>
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
              {/* Pothole slice */}
              <circle
                cx="20"
                cy="20"
                r="15.915"
                fill="transparent"
                stroke="#FACC15"
                strokeWidth="5"
                strokeDasharray={`${distributionData[0].percentage} ${100 - distributionData[0].percentage}`}
                strokeDashoffset="0"
                className="cursor-pointer hover:stroke-[6] transition-all"
                onMouseEnter={() => setHoveredSlice('Pothole')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
              {/* Flooding slice */}
              <circle
                cx="20"
                cy="20"
                r="15.915"
                fill="transparent"
                stroke="#3B82F6"
                strokeWidth="5"
                strokeDasharray={`${distributionData[1].percentage} ${100 - distributionData[1].percentage}`}
                strokeDashoffset={`-${distributionData[0].percentage}`}
                className="cursor-pointer hover:stroke-[6] transition-all"
                onMouseEnter={() => setHoveredSlice('Flooding')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
              {/* Obstacle slice */}
              <circle
                cx="20"
                cy="20"
                r="15.915"
                fill="transparent"
                stroke="#F97316"
                strokeWidth="5"
                strokeDasharray={`${distributionData[2].percentage} ${100 - distributionData[2].percentage}`}
                strokeDashoffset={`-${distributionData[0].percentage + distributionData[1].percentage}`}
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
                  : totalActive
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
