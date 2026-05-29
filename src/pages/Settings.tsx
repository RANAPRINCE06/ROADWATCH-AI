import React from 'react';

export function Settings() {
  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-24">
      <h2 className="text-3xl font-bold text-primary tracking-tight mb-8">System Settings</h2>
      <div className="bg-white rounded-xl shadow-sm border border-border-subtle p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Display Mode</label>
            <select className="w-full bg-surface-bright border border-border-subtle rounded-lg p-3">
              <option>Light Theme</option>
              <option>Dark Theme</option>
              <option>High Contrast</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Notification Threshold</label>
            <select className="w-full bg-surface-bright border border-border-subtle rounded-lg p-3">
              <option>All Alerts</option>
              <option>High & Critical Only</option>
              <option>Critical Security Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
