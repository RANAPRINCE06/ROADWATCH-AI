/**
 * Central storage and synchronization utility for RoadWatch AI
 */

import { 
  getCollectionRef, 
  getDocRef, 
  subscribeToQuery, 
  addDocument, 
  setDocument, 
  updateDocument, 
  deleteDocument,
  buildQuery,
  queryWhere,
  queryOrderBy
} from './firebase';

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
  status?: 'Detected' | 'Verified' | 'Assigned' | 'Repairing' | 'Resolved';
  priorityScore?: number;
  estimatedRisk?: string;
  recommendedRepairTime?: string;
  assignedTeam?: string;
  repairDate?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  
  // Repair Tracking System
  assignedAt?: number;
  startedAt?: number;
  completedAt?: number;
  startDate?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  resolutionTime?: string;
  repairNotes?: string;

  // Citizen Verification System
  citizenVerified?: boolean;
  citizenRating?: number;
  citizenFeedback?: string;
  satisfactionScore?: number;
  resolutionQualityScore?: number;
  resolvedAt?: number;
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
    status: 'Verified',
    priorityScore: 92,
    estimatedRisk: 'High Accident Risk',
    recommendedRepairTime: 'Within 24 Hours',
    beforeImageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
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
    status: 'Verified',
    priorityScore: 89,
    estimatedRisk: 'Hydroplaning Hazard',
    recommendedRepairTime: 'Within 24 Hours',
    beforeImageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
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
    status: 'Assigned',
    priorityScore: 74,
    estimatedRisk: 'Traffic Bottleneck Risk',
    recommendedRepairTime: 'Within 3 Days',
    assignedTeam: 'Team Alpha (Asphalt Resurfacing)',
    beforeImageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80',
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
    status: 'Detected',
    priorityScore: 48,
    estimatedRisk: 'Pavement Deterioration',
    recommendedRepairTime: 'Within 7 Days',
    beforeImageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
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
    status: 'Verified',
    priorityScore: 78,
    estimatedRisk: 'Localized Flooding',
    recommendedRepairTime: 'Within 48 Hours',
    beforeImageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80',
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
  const severity = report.severity || 'Active';
  const priorityScore = report.priorityScore || (severity === 'Critical' ? 92 : severity === 'Active' ? 76 : severity === 'Scheduled' ? 60 : 45);
  const estimatedRisk = report.estimatedRisk || (severity === 'Critical' ? 'High Accident Risk' : severity === 'Active' ? 'Moderate Damage Risk' : 'Minor Road Decay');
  const recommendedRepairTime = report.recommendedRepairTime || (severity === 'Critical' ? 'Within 24 Hours' : severity === 'Active' ? 'Within 3 Days' : 'Within 7 Days');
  const status = report.status || (((report.source === 'AI Detected' || report.source?.includes('AI')) && !report.source?.includes('Citizen')) ? 'Verified' : 'Detected');

  const newReport: Report = {
    ...report,
    id: report.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: report.timestamp || new Date().toISOString(),
    status,
    priorityScore,
    estimatedRisk,
    recommendedRepairTime,
    beforeImageUrl: report.beforeImageUrl || report.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
  };
  
  // Save to Firestore
  setDocument(getDocRef('reports', newReport.id), newReport);
  addLog('Incident Reporter', `New hazard reported: ${newReport.title} at ${newReport.location}`, newReport.severity === 'Critical' ? 'WARN' : 'INFO');
  return newReport;
}

export function resolveReport(id: string): void {
  const reports = getReports();
  const report = reports.find(r => r.id === id);
  if (!report) return;

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const updatedFields = { 
    resolved: true, 
    status: 'Resolved' as const,
    assignedTeam: report.assignedTeam || 'City Hall Rapid Unit (Rapid Response)',
    startDate: report.startDate || yesterdayStr,
    estimatedCompletionDate: report.estimatedCompletionDate || todayStr,
    actualCompletionDate: report.actualCompletionDate || todayStr,
    resolutionTime: report.resolutionTime || '42 Mins',
    repairDate: report.repairDate || todayStr,
    afterImageUrl: report.afterImageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80',
    repairNotes: report.repairNotes || 'Completed paving and smoothing of asphalt layer. Structural load validation complete.',
    assignedAt: report.assignedAt || Date.now(),
    startedAt: report.startedAt || report.assignedAt || Date.now(),
    completedAt: Date.now(),
    resolvedAt: Date.now()
  };

  updateDocument(getDocRef('reports', id), updatedFields);

  // Dispatch native browser notification if permission is granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('RoadWatch AI Dispatch', {
      body: `✅ Task Completed: "${report.title}" at ${report.location} has been successfully resolved.`
    });
  }
  
  // Sync back to corresponding CitizenComplaint
  if (id.startsWith('rep-from-comp-')) {
    const complaintId = id.replace('rep-from-', '');
    updateComplaintStatus(complaintId, 'Resolved');
  }

  addLog('Maintenance Dispatch', `Hazard resolved: ${report.title} at ${report.location}`, 'SUCCESS');
}

export function verifyRepair(id: string, rating: number, feedback: string): void {
  const updatedFields = {
    citizenVerified: true,
    citizenRating: rating,
    citizenFeedback: feedback,
    satisfactionScore: rating * 20,
    resolutionQualityScore: Math.min(100, Math.round(88 + rating * 2.4))
  };

  updateDocument(getDocRef('reports', id), updatedFields);

  // Sync to complaint
  if (id.startsWith('rep-from-comp-')) {
    const complaintId = id.replace('rep-from-', '');
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint) {
      updateDocument(getDocRef('complaints', complaintId), {
        citizenVerified: true,
        citizenRating: rating,
        citizenFeedback: feedback,
        satisfactionScore: rating * 20,
        resolutionQualityScore: Math.min(100, Math.round(85 + rating * 3))
      });
    }
  }

  const reports = getReports();
  const report = reports.find(r => r.id === id);
  if (report) {
    addLog('Citizen Portal', `Citizen verified repair for "${report.title}": ${rating} Stars. Feedback: "${feedback}"`, 'SUCCESS');
  }
}

export function deleteReport(id: string): void {
  deleteDocument(getDocRef('reports', id));
}

export async function clearCompletedReports(): Promise<number> {
  const reports = getReports();
  const completedReports = reports.filter(r => r.resolved || r.status === 'Resolved');

  if (completedReports.length === 0) return 0;

  const activeReports = reports.filter(r => !(r.resolved || r.status === 'Resolved'));
  saveReports(activeReports);

  await Promise.all(completedReports.map(report => deleteDocument(getDocRef('reports', report.id))));
  addLog('Admin Panel', `Deleted ${completedReports.length} completed task history record(s).`, 'WARN');

  return completedReports.length;
}

export function updateReportStatus(id: string, updates: Partial<Report>): void {
  updateDocument(getDocRef('reports', id), updates);

  // Sync status changes back to CitizenComplaint
  if (id.startsWith('rep-from-comp-') && updates.status) {
    const complaintId = id.replace('rep-from-', '');
    let compStatus: CitizenComplaint['status'] = 'Submitted';
    if (updates.status === 'Resolved') compStatus = 'Resolved';
    else if (updates.status === 'Repairing') compStatus = 'Repair In Progress';
    else if (updates.status === 'Assigned') compStatus = 'Assigned';
    else if (updates.status === 'Verified') compStatus = 'Verified';
    else if (updates.status === 'Detected') compStatus = 'Submitted';
    
    updateComplaintStatus(complaintId, compStatus);
  }

  const reports = getReports();
  const report = reports.find(r => r.id === id);
  if (report) {
    if (updates.acknowledged !== undefined) {
      addLog('Emergency Dispatch', `Hazard acknowledged: ${report.title} at ${report.location}`, 'INFO');
    }
    if (updates.status !== undefined) {
      addLog('System Workflow', `Hazard "${report.title}" status updated to ${updates.status}`, 'INFO');
    }
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

// ==========================================
// IOT SENSOR NETWORK & CITIZEN PORTAL MODELLING
// ==========================================

export interface SensorDevice {
  id: string;
  name: string;
  locationName: string;
  vibration: number; // in Hz or amplitude
  temperature: number; // in Celsius
  battery: number; // percentage
  status: 'Online' | 'Warning' | 'Offline';
  connectivity: 'WiFi' | 'Cellular' | 'LoRaWAN';
  roadHealthScore: number; // 0-100
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export interface CitizenComplaint {
  id: string;
  title: string;
  description: string;
  locationName: string;
  location?: string; // Compatibility with local mock db
  imageUrl: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  status: 'Submitted' | 'Verified' | 'Assigned' | 'Repairing' | 'Repair In Progress' | 'Resolved' | 'Closed';
  timestamp: string;
  createdAt?: string; // Compatibility with local mock db
  citizenId?: string;
  votes: number;
  upvotes?: number; // Compatibility with local mock db

  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityScore?: number;
  hazardType?: string;
  assignedTeam?: string;
  resolvedAt?: string;
  notes?: string;
  followUpImageUrl?: string;

  citizenVerified?: boolean;
  citizenRating?: number;
  citizenFeedback?: string;
  satisfactionScore?: number;
  resolutionQualityScore?: number;
  citizenRejected?: boolean;
}

const DEFAULT_SENSORS: SensorDevice[] = [
  { id: 'sns-01', name: 'ESP32-Node 1', locationName: 'Sector 4, Orchard Rd', vibration: 12, temperature: 31.2, battery: 88, status: 'Online', connectivity: 'WiFi', roadHealthScore: 85, lat: 1.3048, lng: 103.8318, x: 35, y: 50 },
  { id: 'sns-02', name: 'ESP32-Node 2', locationName: 'Bayfront Ave North', vibration: 14, temperature: 32.5, battery: 74, status: 'Online', connectivity: 'LoRaWAN', roadHealthScore: 70, lat: 1.2847, lng: 103.8590, x: 65, y: 30 },
  { id: 'sns-03', name: 'ESP32-Node 3', locationName: 'Cross St Junction', vibration: 48, temperature: 34.1, battery: 15, status: 'Warning', connectivity: 'Cellular', roadHealthScore: 48, lat: 1.2789, lng: 103.8485, x: 80, y: 75 },
  { id: 'sns-04', name: 'ESP32-Node 4', locationName: 'Marina Boulevard', vibration: 8, temperature: 30.8, battery: 92, status: 'Online', connectivity: 'WiFi', roadHealthScore: 94, lat: 1.2764, lng: 103.8545, x: 20, y: 25 },
  { id: 'sns-05', name: 'ESP32-Node 5', locationName: 'Geylang Rd Junction', vibration: 0, temperature: 0, battery: 0, status: 'Offline', connectivity: 'LoRaWAN', roadHealthScore: 60, lat: 1.3120, lng: 103.8760, x: 50, y: 60 }
];

const DEFAULT_COMPLAINTS: CitizenComplaint[] = [
  {
    id: 'comp-101',
    title: 'Debris blocking curbside lane',
    description: 'A large pile of construction aggregates and metal frames has blocked the left lane of Nicoll Highway near Stadium Rd. Cars are forced to switch lanes abruptly.',
    locationName: 'Nicoll Highway Westbound',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
    lat: 1.3025,
    lng: 103.8685,
    x: 45,
    y: 40,
    status: 'Verified',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    votes: 18
  },
  {
    id: 'comp-102',
    title: 'Severe road surface decay and aggregate loss',
    description: 'Asphalt is coming apart on Serangoon Road. Potholes are starting to merge, throwing loose gravel at windscreens.',
    locationName: 'Serangoon Road Section 2',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
    lat: 1.3180,
    lng: 103.8610,
    x: 38,
    y: 55,
    status: 'Repair In Progress',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    votes: 34
  },
  {
    id: 'comp-103',
    title: 'Pothole development at crosswalk',
    description: 'Small but deep pothole formed right in the middle of the pedestrian crossing. Tripping hazard for pedestrians.',
    locationName: 'Victoria St / Bras Basah Junction',
    imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
    lat: 1.2975,
    lng: 103.8525,
    x: 60,
    y: 65,
    status: 'Submitted',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    votes: 5
  }
];

export function getSensors(): SensorDevice[] {
  try {
    const saved = localStorage.getItem('roadwatch_sensors');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load sensors from localStorage', e);
  }
  saveSensors(DEFAULT_SENSORS);
  return DEFAULT_SENSORS;
}

export function saveSensors(sensors: SensorDevice[]): void {
  try {
    localStorage.setItem('roadwatch_sensors', JSON.stringify(sensors));
    window.dispatchEvent(new Event('roadwatch-sensors-updated'));
  } catch (e) {
    console.error('Failed to save sensors to localStorage', e);
  }
}

export function getComplaints(): CitizenComplaint[] {
  try {
    const saved = localStorage.getItem('roadwatch_complaints');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load complaints from localStorage', e);
  }
  saveComplaints(DEFAULT_COMPLAINTS);
  return DEFAULT_COMPLAINTS;
}

export function saveComplaints(complaints: CitizenComplaint[]): void {
  try {
    localStorage.setItem('roadwatch_complaints', JSON.stringify(complaints));
    window.dispatchEvent(new Event('roadwatch-complaints-updated'));
  } catch (e) {
    console.error('Failed to save complaints to localStorage', e);
  }
}

export async function addComplaint(complaint: Omit<CitizenComplaint, 'id' | 'timestamp' | 'votes' | 'status'> & { id?: string; timestamp?: string }): Promise<CitizenComplaint> {
  const id = complaint.id || `COMP-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = complaint.timestamp || new Date().toISOString();
  const priorityScore = complaint.priority === 'Critical' ? 95 : complaint.priority === 'High' ? 80 : complaint.priority === 'Medium' ? 55 : 30;
  
  const newComplaint: CitizenComplaint = {
    ...complaint,
    id,
    status: 'Submitted',
    timestamp,
    createdAt: complaint.createdAt || timestamp,
    location: complaint.location || complaint.locationName,
    citizenId: complaint.citizenId || 'citizen_demo',
    votes: 1,
    upvotes: 1,
    priorityScore,
    citizenVerified: false,
    citizenRating: 0,
    citizenFeedback: '',
    satisfactionScore: 0,
    resolutionQualityScore: 0
  };

  // Sync to Reports (create corresponding Report)
  const matchingReportId = `rep-from-${id}`;
  const newReport: Report = {
    id: matchingReportId,
    title: newComplaint.title,
    location: newComplaint.locationName,
    severity: (newComplaint.priority === 'Critical' ? 'Critical' : newComplaint.priority === 'High' ? 'Active' : newComplaint.priority === 'Medium' ? 'Pending' : 'Scheduled'),
    icon: (newComplaint.hazardType === 'Waterlogging' ? 'droplets' : newComplaint.hazardType === 'Road Blockage' ? 'hardhat' : 'alert'),
    source: 'Citizen Portal',
    timestamp,
    x: newComplaint.x,
    y: newComplaint.y,
    lat: newComplaint.lat,
    lng: newComplaint.lng,
    imageUrl: newComplaint.imageUrl,
    description: newComplaint.description,
    status: 'Detected',
    priorityScore,
    estimatedRisk: (newComplaint.priority === 'Critical' ? 'High Accident Risk' : newComplaint.priority === 'High' ? 'Moderate Damage Risk' : 'Minor Road Decay'),
    recommendedRepairTime: (newComplaint.priority === 'Critical' ? 'Within 24 Hours' : newComplaint.priority === 'High' ? 'Within 3 Days' : 'Within 7 Days'),
    beforeImageUrl: newComplaint.imageUrl
  };
  await Promise.all([
    setDocument(getDocRef('complaints', id), newComplaint),
    setDocument(getDocRef('reports', matchingReportId), newReport),
    addDocument(getCollectionRef('notifications'), {
      title: 'Complaint Submitted',
      message: `Your report "${newComplaint.title}" has been successfully submitted.`,
      timestamp,
      read: false,
      citizenId: 'citizen_demo'
    })
  ]);

  addLog('Citizen Portal', `New citizen complaint filed: ${newComplaint.title} at ${newComplaint.locationName}`, 'INFO');
  return newComplaint;
}

export function updateComplaintStatus(id: string, status: CitizenComplaint['status']): void {
  const complaints = getComplaints();
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return;

  updateDocument(getDocRef('complaints', id), { status });
  
  // Sync status back to corresponding Report
  const reportId = `rep-from-${id}`;
  let reportStatus: Report['status'] = 'Detected';
  if (status === 'Resolved') reportStatus = 'Resolved';
  else if (status === 'Repair In Progress') reportStatus = 'Repairing';
  else if (status === 'Assigned') reportStatus = 'Assigned';
  else if (status === 'Verified') reportStatus = 'Verified';
  else if (status === 'Submitted') reportStatus = 'Detected';
  
  const reports = getReports();
  const report = reports.find(r => r.id === reportId);
  if (report) {
    updateDocument(getDocRef('reports', reportId), { status: reportStatus });
  }

  // Generate notification if status changed
  if (complaint.status !== status) {
    let notifTitle = '';
    let notifMessage = '';
    if (status === 'Verified') {
      notifTitle = 'Complaint Verified';
      notifMessage = `AI and municipal engineers have verified your complaint "${complaint.title}".`;
    } else if (status === 'Assigned') {
      notifTitle = 'Team Assigned';
      notifMessage = `Municipal team has been assigned to fix "${complaint.title}".`;
    } else if (status === 'Repair In Progress') {
      notifTitle = 'Repair Started';
      notifMessage = `Crew has arrived on-site. Repairs are now active for "${complaint.title}".`;
    } else if (status === 'Resolved') {
      notifTitle = 'Repair Completed';
      notifMessage = `Repairs have been completed for "${complaint.title}". Please verify the work.`;
    }
    if (notifTitle) {
      addDocument(getCollectionRef('notifications'), {
        title: notifTitle,
        message: notifMessage,
        timestamp: new Date().toISOString(),
        read: false,
        citizenId: 'citizen_demo'
      });
    }
  }

  addLog('Citizen Portal', `Complaint "${complaint.title}" status updated to ${status}`, 'SUCCESS');
}

export function verifyComplaint(id: string, rating: number, feedback: string): void {
  const complaints = getComplaints();
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return;

  const updatedComplaint = {
    status: 'Resolved' as const,
    citizenVerified: true,
    citizenRating: rating,
    citizenFeedback: feedback,
    satisfactionScore: rating * 20,
    resolutionQualityScore: Math.min(100, Math.round(85 + rating * 3))
  };
  updateDocument(getDocRef('complaints', id), updatedComplaint);

  // Sync to Report
  const reportId = `rep-from-${id}`;
  updateDocument(getDocRef('reports', reportId), {
    citizenVerified: true,
    citizenRating: rating,
    citizenFeedback: feedback,
    satisfactionScore: rating * 20,
    resolutionQualityScore: Math.min(100, Math.round(85 + rating * 3))
  });

  addLog('Citizen Portal', `Citizen verified complaint resolution for "${complaint.title}": ${rating} Stars.`, 'SUCCESS');
}

export function upvoteComplaint(id: string): void {
  const complaints = getComplaints();
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return;
  
  updateDocument(getDocRef('complaints', id), { votes: (complaint.votes || 0) + 1 });
}

// ==========================================
// HACKATHON DEMO MODE SIMULATION BUS
// ==========================================

export function triggerDemoModeSimulation(): void {
  // 1. Simulate new Pothole / Hazard detection
  const demoHazards = [
    { title: 'Severe Road Collapse', location: 'Jurong East St 21', severity: 'Critical' as const, icon: 'alert' as const, desc: 'Large deep sinkhole crater forming, depth 25cm. Severe lane blockage.', lat: 1.3320, lng: 103.7420, x: 25, y: 70 },
    { title: 'Roadway Waterlogging', location: 'Dunearn Rd Eastbound', severity: 'Active' as const, icon: 'droplets' as const, desc: 'Heavy water pooling on right two lanes, height 20cm. Vehicles slowing to crawl.', lat: 1.3280, lng: 103.8110, x: 45, y: 35 },
    { title: 'Fallen Construction Scaffolding', location: 'Bras Basah Rd Junc', severity: 'Critical' as const, icon: 'hardhat' as const, desc: 'Metal frames fell onto bus lane. Emergency crews dispatched.', lat: 1.2985, lng: 103.8510, x: 62, y: 68 }
  ];
  
  const selectedDemo = demoHazards[Math.floor(Math.random() * demoHazards.length)];
  addReport({
    title: selectedDemo.title,
    location: selectedDemo.location,
    severity: selectedDemo.severity,
    icon: selectedDemo.icon,
    source: 'Edge AI Camera #14',
    x: selectedDemo.x,
    y: selectedDemo.y,
    lat: selectedDemo.lat,
    lng: selectedDemo.lng,
    imageUrl: selectedDemo.icon === 'droplets' 
      ? 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80'
      : 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
    description: selectedDemo.desc
  });

  // 2. Simulate new Citizen Complaint
  const complaintTemplates = [
    { title: 'Broken guardrail on bridge', desc: 'Metal railing is completely snapped off on Nicoll Highway flyover. Extreme hazard for vehicles losing control.', loc: 'Nicoll Highway Flyover' },
    { title: 'Asphalt splitting at bus stop', desc: 'Asphalt has shifted and cracked, forming a 15cm sharp ridge. Buses hitting it are tilting dangerously.', loc: 'Jalan Besar Bus Stop' }
  ];
  const selectedComp = complaintTemplates[Math.floor(Math.random() * complaintTemplates.length)];
  addComplaint({
    title: selectedComp.title,
    description: selectedComp.desc,
    locationName: selectedComp.loc,
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80',
    lat: 1.3050 + (Math.random() - 0.5) * 0.02,
    lng: 103.8500 + (Math.random() - 0.5) * 0.02,
    x: Math.floor(Math.random() * 60) + 20,
    y: Math.floor(Math.random() * 60) + 20
  });

  // 3. Trigger IoT Sensor Telemetry warnings
  const sensors = getSensors();
  const updatedSensors = sensors.map((sns, idx) => {
    // Alarms Node 1 or Node 2, or sets Node 4 to warning
    if (idx === 0) {
      return {
        ...sns,
        vibration: 72, // alarm threshold (>50)
        temperature: 37.8,
        status: 'Warning' as const,
        roadHealthScore: 54
      };
    }
    if (idx === 4) {
      // Offline node wakes up but reports high temp
      return {
        ...sns,
        vibration: 4,
        temperature: 42.1,
        battery: 12,
        status: 'Warning' as const,
        roadHealthScore: 58
      };
    }
    return sns;
  });
  saveSensors(updatedSensors);
  addLog('IoT Sensor Core', 'Sensor alarm triggered: high vibration amplitude on Node 1 (72Hz)', 'WARN');

  // 4. Generate AI Report Insight
  try {
    const aiReportsKey = 'roadwatch_ai_reports';
    const savedAi = localStorage.getItem(aiReportsKey);
    const aiReports = savedAi ? JSON.parse(savedAi) : [];
    
    const newAiReport = {
      id: `rep-${Date.now()}`,
      title: `Emergency Dynamic Audit: ${selectedDemo.location} Vulnerability`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      category: selectedDemo.icon === 'droplets' ? 'Drainage' as const : 'Infrastructure' as const,
      decayIndex: selectedDemo.severity === 'Critical' ? 9.2 : 7.6,
      safetyRating: selectedDemo.severity === 'Critical' ? 'Hazardous' as const : 'Warning' as const,
      summary: `Dynamic alert response audit. Automated laser sensors detected a sudden road shift at ${selectedDemo.location}. Structural deformation threshold exceeded by 180%.`,
      aiInsights: `Crews should proceed to ${selectedDemo.location} immediately. Recommend emergency detour routing and capping sector speeds at 30km/h.`
    };
    
    aiReports.unshift(newAiReport);
    localStorage.setItem(aiReportsKey, JSON.stringify(aiReports));
    window.dispatchEvent(new Event('roadwatch-reports-updated')); // triggers AIReports update
  } catch (e) {
    console.error(e);
  }
}

// Subscribe to Firestore updates and update LocalStorage to keep the entire app synced in real-time
let seededReports = false;
subscribeToQuery(buildQuery(getCollectionRef('reports')), (firebaseReports) => {
  if (firebaseReports.length === 0 && !seededReports) {
    seededReports = true;
    DEFAULT_REPORTS.forEach(r => {
      setDocument(getDocRef('reports', r.id), r);
    });
  } else {
    localStorage.setItem('roadwatch_reports', JSON.stringify(firebaseReports));
    window.dispatchEvent(new Event('roadwatch-reports-updated'));
  }
});

let seededComplaints = false;
subscribeToQuery(buildQuery(getCollectionRef('complaints')), (firebaseComplaints) => {
  if (firebaseComplaints.length === 0 && !seededComplaints) {
    seededComplaints = true;
    DEFAULT_COMPLAINTS.forEach(c => {
      setDocument(getDocRef('complaints', c.id), c);
    });
  } else {
    localStorage.setItem('roadwatch_complaints', JSON.stringify(firebaseComplaints));
    window.dispatchEvent(new Event('roadwatch-complaints-updated'));
  }
});

let seededSensors = false;
subscribeToQuery(buildQuery(getCollectionRef('sensors')), (firebaseSensors) => {
  if (firebaseSensors.length === 0 && !seededSensors) {
    seededSensors = true;
    DEFAULT_SENSORS.forEach(s => {
      setDocument(getDocRef('sensors', s.id), s);
    });
  } else {
    localStorage.setItem('roadwatch_sensors', JSON.stringify(firebaseSensors));
    window.dispatchEvent(new Event('roadwatch-sensors-updated'));
  }
});

