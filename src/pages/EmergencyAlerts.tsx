import React, { useState, useEffect } from 'react';
import { AlertOctagon, Flame, ShieldAlert, CheckCircle2, UserCheck, Trash2, Plus } from 'lucide-react';
import { 
  getAlerts,
  acknowledgeAlert,
  resolveReport as storageResolveReport, 
  addReport as storageAddReport, 
  addComplaint,
  deleteReport,
  Report,
  AlertItem as StorageAlertItem
} from '../utils/storage';

export function EmergencyAlerts() {
  const [alertsList, setAlertsList] = useState<StorageAlertItem[]>(() => getAlerts());

  useEffect(() => {
    const handleSync = () => {
      setAlertsList(getAlerts());
    };
    window.addEventListener('roadwatch-alerts-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-alerts-updated', handleSync);
    };
  }, []);

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const alerts = alertsList.map(a => ({
    ...a,
    time: a.timestamp ? formatTimeAgo(new Date(a.timestamp)) : 'Just now'
  }));

  const [activeTab, setActiveTab] = useState<'All' | 'Critical' | 'Major' | 'Minor'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Acknowledged' | 'Resolved'>('All');

  // Trigger simulated new alert
  const handleSimulateAlert = () => {
    const simulationTemplates = [
      {
        title: 'Waterlogging: East Coast Expressway',
        location: 'Bayfront Connector',
        severity: 'Critical' as const,
        icon: 'droplets' as const,
        description: 'Heavy precipitation causing roadside pooling on lanes 3 and 4. Speeds capped at 40km/h.'
      },
      {
        title: 'Subsidence: Bridge Support Settling',
        location: 'Downtown Expressway Pillar 4',
        severity: 'Critical' as const,
        icon: 'hardhat' as const,
        description: 'AI telemetry reports a 3cm settlement. Structural engineers dispatched for visual safety inspections.'
      }
    ];

    const template = simulationTemplates[Math.floor(Math.random() * simulationTemplates.length)];
    
    addComplaint({
      title: `${template.title} [DEMO DATA]`,
      description: `${template.description} [DEMO DATA]`,
      locationName: template.location,
      priority: template.severity === 'Critical' ? ('Critical' as const) : ('High' as const),
      hazardType: template.icon === 'droplets' ? 'Waterlogging' : 'Road Blockage',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
      lat: 1.2847 + (Math.random() - 0.5) * 0.02,
      lng: 103.8590 + (Math.random() - 0.5) * 0.02,
      x: Math.floor(Math.random() * 60) + 20,
      y: Math.floor(Math.random() * 60) + 20
    });
  };

  const handleUpdateStatus = (id: string, newStatus: 'Active' | 'Acknowledged' | 'Resolved') => {
    if (newStatus === 'Resolved') {
      const alert = alertsList.find(a => a.id === id);
      if (alert && alert.hazardId) {
        storageResolveReport(alert.hazardId);
      }
    } else if (newStatus === 'Acknowledged') {
      acknowledgeAlert(id);
    }
  };

  const handleDeleteAlert = (id: string) => {
    const alert = alertsList.find(a => a.id === id);
    if (alert && alert.hazardId) {
      deleteReport(alert.hazardId);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchTab = activeTab === 'All' || alert.severity === activeTab;
    const matchStatus = filterStatus === 'All' || alert.status === filterStatus;
    return matchTab && matchStatus;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'flood':
        return <ShieldAlert className="w-5 h-5 text-blue-500" />;
      case 'structural':
        return <AlertOctagon className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertOctagon className="w-5 h-5 text-safety-yellow" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Major':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-red-50 text-red-600 border border-red-200 animate-pulse';
      case 'Acknowledged':
        return 'bg-orange-50 text-orange-600 border border-orange-200';
      default:
        return 'bg-green-50 text-green-600 border border-green-200';
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Emergency Alerts Dispatch</h2>
          <p className="text-text-secondary mt-1">Real-time incident response management console.</p>
        </div>
        <button
          onClick={handleSimulateAlert}
          className="bg-error hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Simulate Emergency Trigger
        </button>
      </div>

      {/* Tabs and Filters Row */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border-subtle mb-6 shadow-sm">
        <div className="flex gap-2">
          {(['All', 'Critical', 'Major', 'Minor'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-primary text-white' 
                  : 'bg-surface-container-low text-text-secondary hover:bg-surface-container'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none"
          >
            <option value="All">All Incidents</option>
            <option value="Active">Active Only</option>
            <option value="Acknowledged">Acknowledged Only</option>
            <option value="Resolved">Resolved Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-white rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="p-2.5 bg-slate-50 border border-border-subtle rounded-lg">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-primary leading-tight">{alert.title}</h4>
                      <span className="text-[10px] text-text-secondary uppercase font-semibold mt-1 block">
                        📍 {alert.location}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityStyle(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-6">
                  {alert.description}
                </p>
              </div>

              <div className="flex justify-between items-center border-t border-border-subtle/50 pt-4 mt-auto">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{alert.time}</span>
                
                <div className="flex gap-2">
                  {alert.status === 'Active' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'Acknowledged')}
                      className="bg-safety-yellow hover:opacity-90 text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  )}
                  {alert.status !== 'Resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.id, 'Resolved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Incident
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1.5 hover:bg-red-50 text-text-secondary hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Remove alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-xl border border-border-subtle p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="font-bold text-sm text-primary">No Matching Alerts</h4>
            <p className="text-xs text-text-secondary mt-1">All municipal sensors and AI telemetry channels report clear transit routes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
