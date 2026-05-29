import React from 'react';

export function EmergencyAlerts() {
  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-24">
      <h2 className="text-3xl font-bold text-primary tracking-tight mb-8">System emergency alerts</h2>
      <div className="bg-white rounded-xl shadow-sm border border-border-subtle h-[600px] flex items-center justify-center">
        <p className="text-on-surface-variant font-bold">Alert feed loading...</p>
      </div>
    </div>
  );
}
