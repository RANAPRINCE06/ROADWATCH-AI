import React, { useState } from 'react';
import { Database, ShieldAlert, Cpu, Terminal, Play, RotateCcw, AlertTriangle } from 'lucide-react';

interface TelemetryLog {
  time: string;
  module: string;
  event: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

export function AdminPanel() {
  const [logs, setLogs] = useState<TelemetryLog[]>([
    { time: '22:48:10', module: 'GIS Engine', event: 'Google Maps API authorized successfully', status: 'SUCCESS' },
    { time: '22:45:32', module: 'Routing Controller', event: 'Alternative detour route calculated for Bayfront Ave', status: 'INFO' },
    { time: '22:40:05', module: 'Edge Node 7G', event: 'High temperature warning in ventilation duct', status: 'WARN' },
    { time: '22:38:12', module: 'AI Mesh Model', event: 'Image inference request resolved in 12ms', status: 'SUCCESS' },
    { time: '22:30:45', module: 'Database Core', event: 'Pothole boundary logs successfully synced with municipal GIS', status: 'SUCCESS' }
  ]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const triggerAction = (actionName: string) => {
    setActionMessage(`Executing: ${actionName}...`);
    setTimeout(() => {
      if (actionName === 'Seed Mock Incidents') {
        const newLog: TelemetryLog = {
          time: new Date().toTimeString().split(' ')[0],
          module: 'Admin Command',
          event: 'Mock safety hazard data injected into live state',
          status: 'INFO'
        };
        setLogs(prev => [newLog, ...prev]);
        setActionMessage('Mock incidents successfully seeded!');
      } else if (actionName === 'Clear Live Cache') {
        setActionMessage('GIS and map polyline cache cleared successfully.');
      } else {
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
