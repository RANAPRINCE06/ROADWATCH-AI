/**
 * Central storage and synchronization utility for RoadWatch AI
 */

export interface Report {
  id: string;
  title: string;
  location: string;
  severity: 'Critical' | 'Active' | 'Pending' | 'Scheduled';
  icon: 'alert' | 'lightbulb' | 'hardhat' | 'car' | 'droplets';
  source: string;
  timestamp: string; // ISO string
  x: number; // percentage coordinate for flat map
  y: number; // percentage coordinate for flat map
  lat: number; // latitude for Google Map
  lng: number; // longitude for Google Map
  imageUrl: string;
  resolved?: boolean;
  description?: string;
  acknowledged?: boolean;
}

export interface TelemetryLog {
  time: string;
  module: string;
  event: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

export interface SystemSettings {
  refreshInterval: string;
  theme: string;
  threshold: string;
  desktopAlerts: boolean;
  soundAlerts: boolean;
  aiAnalysisDepth: boolean;
}

const DEFAULT_REPORTS: Report[] = [
  {
    id: 'rep-1',
    title: 'Severe Pothole',
    location: 'Sector 4, Orchard Rd',
    severity: 'Critical',
    icon: 'alert',
    source: 'AI Detected',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    x: 35,
    y: 50,
    lat: 1.3048,
    lng: 103.8318,
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
    description: 'Large road crater, depth approx 10cm, causing lane diversions.',
  },
  {
    id: 'rep-2',
    title: 'Waterlogging (15cm)',
    location: 'Bayfront Ave North',
    severity: 'Critical',
    icon: 'droplets',
    source: 'Sensor Report',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    x: 65,
    y: 30,
    lat: 1.2847,
    lng: 103.8590,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
    description: 'Water pooling on left lane. Traffic speed reduced to 20 km/h.',
  },
  {
    id: 'rep-3',
    title: 'Missing Divider & Work',
    location: 'Cross St Junction',
    severity: 'Active',
    icon: 'hardhat',
    source: 'Admin Update',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    x: 80,
    y: 75,
    lat: 1.2789,
    lng: 103.8485,
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80',
    description: 'Lane narrowing due to utility maintenance. Ends in 2 days.',
  },
  {
    id: 'rep-4',
    title: 'Minor Surface Fissures',
    location: 'Marina Boulevard',
    severity: 'Pending',
    icon: 'alert',
    source: 'Citizen Report',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    x: 20,
    y: 25,
    lat: 1.2764,
    lng: 103.8545,
    imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
    description: 'Cracks widening on shoulder. Scheduled for maintenance next cycle.',
  },
  {
    id: 'rep-5',
    title: 'Drain Overflow Risk',
    location: 'Geylang Rd Junction',
    severity: 'Active',
    icon: 'droplets',
    source: 'Sensor Report',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    x: 50,
    y: 60,
    lat: 1.3120,
    lng: 103.8760,
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80',
    description: 'Drainage debris causing minor water buildup on curbside.',
  }
];

const DEFAULT_LOGS: TelemetryLog[] = [
  { time: '22:48:10', module: 'GIS Engine', event: 'Google Maps API authorized successfully', status: 'SUCCESS' },
  { time: '22:45:32', module: 'Routing Controller', event: 'Alternative detour route calculated for Bayfront Ave', status: 'INFO' },
  { time: '22:40:05', module: 'Edge Node 7G', event: 'High temperature warning in ventilation duct', status: 'WARN' },
  { time: '22:38:12', module: 'AI Mesh Model', event: 'Image inference request resolved in 12ms', status: 'SUCCESS' },
  { time: '22:30:45', module: 'Database Core', event: 'Pothole boundary logs successfully synced with municipal GIS', status: 'SUCCESS' }
];

const DEFAULT_SETTINGS: SystemSettings = {
  refreshInterval: '30 Seconds',
  theme: 'Light Theme',
  threshold: 'High & Critical Only',
  desktopAlerts: true,
  soundAlerts: false,
  aiAnalysisDepth: true,
};

// HELPER FUNCTIONS FOR REPORTS
export function getReports(): Report[] {
  try {
    const saved = localStorage.getItem('roadwatch_reports');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
  }
  // If not present, save and return default reports
  saveReports(DEFAULT_REPORTS);
  return DEFAULT_REPORTS;
}

export function saveReports(reports: Report[]): void {
  try {
    localStorage.setItem('roadwatch_reports', JSON.stringify(reports));
    window.dispatchEvent(new Event('roadwatch-reports-updated'));
  } catch (e) {
    console.error('Failed to save reports to localStorage', e);
  }
}

export function addReport(report: Omit<Report, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Report {
  const reports = getReports();
  const newReport: Report = {
    ...report,
    id: report.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: report.timestamp || new Date().toISOString(),
  };
  reports.unshift(newReport);
  saveReports(reports);
  addLog('Incident Reporter', `New hazard reported: ${newReport.title} at ${newReport.location}`, newReport.severity === 'Critical' ? 'WARN' : 'INFO');
  return newReport;
}

export function resolveReport(id: string): void {
  const reports = getReports();
  const updated = reports.map(r => r.id === id ? { ...r, resolved: true } : r);
  saveReports(updated);
  
  const report = reports.find(r => r.id === id);
  if (report) {
    addLog('Maintenance Dispatch', `Hazard resolved: ${report.title} at ${report.location}`, 'SUCCESS');
  }
}

export function deleteReport(id: string): void {
  const reports = getReports();
  const filtered = reports.filter(r => r.id !== id);
  saveReports(filtered);
}

export function updateReportStatus(id: string, updates: Partial<Report>): void {
  const reports = getReports();
  const updated = reports.map(r => r.id === id ? { ...r, ...updates } : r);
  saveReports(updated);

  const report = reports.find(r => r.id === id);
  if (report && updates.acknowledged !== undefined) {
    addLog('Emergency Dispatch', `Hazard acknowledged: ${report.title} at ${report.location}`, 'INFO');
  }
}

// HELPER FUNCTIONS FOR TELEMETRY LOGS
export function getLogs(): TelemetryLog[] {
  try {
    const saved = localStorage.getItem('roadwatch_logs');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
  }
  localStorage.setItem('roadwatch_logs', JSON.stringify(DEFAULT_LOGS));
  return DEFAULT_LOGS;
}

export function addLog(module: string, event: string, status: 'SUCCESS' | 'WARN' | 'INFO'): void {
  try {
    const logs = getLogs();
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: TelemetryLog = { time: timeStr, module, event, status };
    logs.unshift(newLog);
    // Keep max 50 logs
    const capped = logs.slice(0, 50);
    localStorage.setItem('roadwatch_logs', JSON.stringify(capped));
    window.dispatchEvent(new Event('roadwatch-logs-updated'));
  } catch (e) {
    console.error('Failed to save log', e);
  }
}

export function clearLogs(): void {
  localStorage.setItem('roadwatch_logs', JSON.stringify([]));
  window.dispatchEvent(new Event('roadwatch-logs-updated'));
}

// HELPER FUNCTIONS FOR SETTINGS
export function getSettings(): SystemSettings {
  try {
    const saved = localStorage.getItem('roadwatch_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  localStorage.setItem('roadwatch_settings', JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem('roadwatch_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('roadwatch-settings-updated'));
    addLog('System Config', 'System configurations updated', 'INFO');
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}
