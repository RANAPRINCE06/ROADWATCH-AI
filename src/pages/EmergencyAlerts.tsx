import React, { useState } from 'react';
import { AlertOctagon, Flame, ShieldAlert, CheckCircle2, UserCheck, Trash2, Send, Plus } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'fire' | 'flood' | 'structural' | 'traffic';
  title: string;
  location: string;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'Active' | 'Acknowledged' | 'Resolved';
  time: string;
  description: string;
}

export function EmergencyAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alert-1',
      type: 'flood',
      title: 'Flash Flood: Sector 4 Underpass',
      location: 'Orchard Rd Southbound',
      severity: 'Critical',
      status: 'Active',
      time: '2m ago',
      description: 'Water depth exceeded 25cm. Road impassable for standard passenger vehicles. Drainage pumps fully active.'
    },
    {
      id: 'alert-2',
      type: 'structural',
      title: 'Subsidence: Bridge I-95 Support',
      location: 'Downtown Expressway Pillar 4',
      severity: 'Critical',
      status: 'Acknowledged',
      time: '18m ago',
      description: 'AI telemetry reports a 3cm settlement. Structural engineers dispatched for visual safety inspections.'
    },
    {
      id: 'alert-3',
      type: 'traffic',
      title: 'Multi-Vehicle Collision: Exit 12',
      location: 'Pan Island Expressway Westbound',
      severity: 'Major',
      status: 'Active',
      time: '10m ago',
      description: 'Three vehicles collided on middle lanes. Transit delays estimated at 25 minutes. Ambulance deployed.'
    },
    {
      id: 'alert-4',
      type: 'fire',
      title: 'High-Temperature Spike: Cable Duct',
      location: 'Marina Coastal Expressway Tunnel',
      severity: 'Minor',
      status: 'Resolved',
      time: '1h ago',
      description: 'Ventilation sensors triggered thermal alert. Resolved automatically by system backup cooling loops.'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'All' | 'Critical' | 'Major' | 'Minor'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Acknowledged' | 'Resolved'>('All');

  // Trigger simulated new alert
  const handleSimulateAlert = () => {
    const simulationTemplates: AlertItem[] = [
      {
        id: `alert-${Date.now()}`,
        type: 'flood',
        title: 'Waterlogging: East Coast Expressway',
        location: 'Bayfront Connector',
        severity: 'Major',
        status: 'Active',
        time: 'Just now',
        description: 'Heavy precipitation causing roadside pooling on lanes 3 and 4. Speeds capped at 40km/h.'
      },
      {
        id: `alert-${Date.now()}`,
        type: 'structural',
        title: 'Fallen Tree: Boulevard Lane Block',
        location: 'Sector 7, Napier Road',
        severity: 'Minor',
        status: 'Active',
        time: 'Just now',
        description: 'Heavy canopy collapse blocking sidewalk and bus bay. Maintenance crews en route.'
      }
    ];
    const newAlert = simulationTemplates[Math.floor(Math.random() * simulationTemplates.length)];
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Active' | 'Acknowledged' | 'Resolved') => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, status: newStatus } : alert))
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
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
