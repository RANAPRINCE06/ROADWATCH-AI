import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, Cpu, Terminal, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { getLogs, addLog, clearLogs, saveReports, getReports, TelemetryLog } from '../utils/storage';

export function AdminPanel() {
  const [logs, setLogs] = useState<TelemetryLog[]>(() => getLogs());
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setLogs(getLogs());
    };
    window.addEventListener('roadwatch-logs-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-logs-updated', handleSync);
    };
  }, []);

  const triggerAction = (actionName: string) => {
    setActionMessage(`Executing: ${actionName}...`);
    setTimeout(() => {
      if (actionName === 'Seed Mock Incidents') {
        const seedReports = [
          {
            id: 'rep-1',
            title: 'Severe Asphalt Pothole',
            location: 'Sector 4, Orchard Rd',
            severity: 'Critical' as const,
            icon: 'alert' as const,
            source: 'AI Detected',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            x: 35,
            y: 50,
            lat: 1.3048,
            lng: 103.8318,
            imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
            description: 'Large road crater, depth approx 10cm, causing lane diversions.'
          },
          {
            id: 'rep-2',
            title: 'Water Accumulation (15cm)',
            location: 'Bayfront Ave North',
            severity: 'Critical' as const,
            icon: 'droplets' as const,
            source: 'Sensor Report',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            x: 65,
            y: 30,
            lat: 1.2847,
            lng: 103.8590,
            imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
            description: 'Water pooling on left lane. Traffic speed reduced to 20 km/h.'
          },
          {
            id: 'rep-3',
            title: 'Road Construction Works',
            location: 'Cross St Junction',
            severity: 'Active' as const,
            icon: 'hardhat' as const,
            source: 'Admin Update',
            timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
            x: 80,
            y: 75,
            lat: 1.2789,
            lng: 103.8485,
            imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80',
            description: 'Lane narrowing due to utility maintenance. Ends in 2 days.'
          },
          {
            id: 'rep-4',
            title: 'Minor Road Surface Fissures',
            location: 'Marina Boulevard',
            severity: 'Pending' as const,
            icon: 'alert' as const,
            source: 'Citizen Report',
            timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
            x: 20,
            y: 25,
            lat: 1.2764,
            lng: 103.8545,
            imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
            description: 'Cracks widening on shoulder. Scheduled for maintenance next cycle.'
          },
          {
            id: 'rep-5',
            title: 'Drain Overflow Risk',
            location: 'Geylang Rd Junction',
            severity: 'Active' as const,
            icon: 'droplets' as const,
            source: 'Sensor Report',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            x: 50,
            y: 60,
            lat: 1.3120,
            lng: 103.8760,
            imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80',
            description: 'Drainage debris causing minor water buildup on curbside.'
          }
        ];
        saveReports(seedReports);
        addLog('Admin Command', 'Mock safety hazard data injected into live state', 'INFO');
        setActionMessage('Mock incidents successfully seeded!');
      } else if (actionName === 'Clear Live Cache') {
        saveReports([]);
        clearLogs();
        addLog('Admin Command', 'GIS database and cache cleared successfully', 'WARN');
        setActionMessage('GIS and map polyline cache cleared successfully.');
      } else {
        addLog('AI Model Controller', 'Inference sweep completed across 1,280 active edge nodes', 'SUCCESS');
        setActionMessage('AI Computer Vision model sweep completed.');
      }
      setTimeout(() => setActionMessage(null), 3000);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Admin Console Dashboard</h2>
        <p className="text-text-secondary mt-1">Manage system configurations, edge connection telemetry, and seed data.</p>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2 animate-fade-in-up">
          <Terminal className="w-4 h-4 text-safety-yellow animate-pulse" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Health Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">AI Mesh Server</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-bold text-primary">Active</span>
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Database Node</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-bold text-primary">Connected</span>
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Edge Sensors</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-bold text-primary">Online (1,280)</span>
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Transit API</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-bold text-primary">Authorized</span>
            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Telemetry Logs Panel */}
        <section className="lg:col-span-8 bg-white rounded-xl border border-border-subtle shadow-sm p-6">
          <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-4">
            <Terminal className="w-4 h-4" /> Telemetry Log History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-secondary pb-2">
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5">Module</th>
                  <th className="py-2.5">Event Description</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-medium">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 font-semibold text-primary">{log.time}</td>
                    <td className="py-3">{log.module}</td>
                    <td className="py-3 text-primary">{log.event}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'SUCCESS' 
                          ? 'bg-green-100 text-green-700' 
                          : log.status === 'WARN' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Operational Actions Panel */}
        <section className="lg:col-span-4 bg-white rounded-xl border border-border-subtle shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-6">
              <Database className="w-4 h-4" /> Admin Controls
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={() => triggerAction('Seed Mock Incidents')}
                className="w-full bg-primary hover:bg-neutral-800 text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4" /> Seed Demo Incidents
              </button>

              <button
                onClick={() => triggerAction('Clear Live Cache')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-primary text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-border-subtle cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Clear Live Cache
              </button>

              <button
                onClick={() => triggerAction('Trigger Model Sweep')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-primary text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-border-subtle cursor-pointer"
              >
                <Cpu className="w-4 h-4" /> Trigger Model Sweep
              </button>
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-6 flex gap-2.5 items-start">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Security Caution</span>
              <p className="text-[10px] text-red-600 leading-normal mt-0.5">
                Modifying edge parameters clears ongoing laser scans. Changes log directly to security auditing channels.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
