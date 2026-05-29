import React, { useState } from 'react';
import { Save, Bell, Eye, Database, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export function Settings() {
  const [theme, setTheme] = useState('Light Theme');
  const [threshold, setThreshold] = useState('High & Critical Only');
  const [refreshInterval, setRefreshInterval] = useState('30 Seconds');
  
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [aiAnalysisDepth, setAiAnalysisDepth] = useState(true);

  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-green-500 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">System configurations successfully saved!</span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">System Settings</h2>
        <p className="text-text-secondary mt-1">Configure telemetry, threshold controls, and operational parameters.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configurations column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: GIS & Map Telemetry */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
              <Database className="w-4 h-4" /> GIS & Telemetry settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                  GIS Feed Refresh Rate
                </label>
                <select 
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="w-full bg-surface-bright border border-border-subtle rounded-lg p-2.5 text-xs text-primary font-semibold outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>10 Seconds</option>
                  <option>30 Seconds</option>
                  <option>1 Minute</option>
                  <option>5 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                  Display Mode
                </label>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-surface-bright border border-border-subtle rounded-lg p-2.5 text-xs text-primary font-semibold outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>Light Theme</option>
                  <option>Dark Theme</option>
                  <option>Slate/Immersive Mode</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Dispatch Alerts & Notifications */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
              <Bell className="w-4 h-4" /> Dispatch Alerts & Notifications
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                  Notification Threshold
                </label>
                <select 
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-surface-bright border border-border-subtle rounded-lg p-2.5 text-xs text-primary font-semibold outline-none focus:ring-1 focus:ring-primary"
                >
                  <option>All Alerts</option>
                  <option>High & Critical Only</option>
                  <option>Critical Security Only</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-xs font-bold text-primary">Desktop Push Alerts</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">Show notifications when critical potholes are mapped.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={desktopAlerts}
                    onChange={() => setDesktopAlerts(!desktopAlerts)}
                    className="w-8 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-xs font-bold text-primary">Audio Dispatch Indicators</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">Play alert sounds inside dispatch rooms.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={() => setSoundAlerts(!soundAlerts)}
                    className="w-8 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section: AI Analysis depth */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
              <Sparkles className="w-4 h-4" /> AI Computer Vision Config
            </h3>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="text-xs font-bold text-primary">AI Depth Fissure Analysis</span>
                <p className="text-[10px] text-text-secondary mt-0.5">Enable neural mesh calculations to predict sub-surface pothole erosion.</p>
              </div>
              <input 
                type="checkbox"
                checked={aiAnalysisDepth}
                onChange={() => setAiAnalysisDepth(!aiAnalysisDepth)}
                className="w-8 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
              />
            </label>
          </section>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-primary hover:bg-neutral-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Configuration Changes
            </button>
          </div>
        </div>

        {/* Right side info column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 text-safety-yellow">
              <ShieldAlert className="w-4 h-4" /> System Credentials
            </h3>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Your edge node configuration and GIS credentials are managed by municipal operations. Changing keys here requires supervisor permissions.
            </p>
            <div className="border-t border-white/10 pt-3 space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-white/60">GIS Node ID</span>
                <span className="font-bold text-safety-yellow">Edge-SGP-7G</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Active Mesh Profile</span>
                <span className="font-bold">Resurfacing v2.4</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
