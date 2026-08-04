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
  status?: 'Detected' | 'Verified' | 'Queued' | 'Assigned' | 'Repairing' | 'In Progress' | 'Delayed' | 'Awaiting Resolution' | 'Resolved' | 'Completed';
  priorityScore?: number;
  startedAt?: number;
  queuedAt?: number;
  citizenReportsCount?: number;
  estimatedRisk?: string;
  recommendedRepairTime?: string;
  assignedTeam?: string;
  repairDate?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  
  // Repair Tracking System
  startDate?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  resolutionTime?: string;
  repairNotes?: string;

  // Repair ETA and Progress Tracking
  progress?: number;
  etaMinutes?: number;
  estimatedCompletionTime?: number;
  delayReason?: string;
  lastCrewUpdate?: string;
  lastCrewUpdateAt?: number;
  slaMinutes?: number;
  delayMinutes?: number;
  completedAt?: number;

  // Citizen Verification System
  citizenVerified?: boolean;
  citizenRating?: number;
  citizenFeedback?: string;
  satisfactionScore?: number;
  resolutionQualityScore?: number;
  resolvedAt?: number;
  citizenRejected?: boolean;
}

export interface AlertItem {
  id: string;
  type: 'fire' | 'flood' | 'structural' | 'traffic';
  title: string;
  location: string;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'Active' | 'Acknowledged' | 'Resolved';
  time?: string;
  timestamp: string; // ISO string
  description: string;
  hazardId?: string;
}

export interface RepairItem {
  id: string;
  hazardId: string;
  hazardTitle: string;
  location: string;
  assignedTeam: string;
  status: 'Assigned' | 'Repairing' | 'Resolved';
  startDate?: string;
  actualCompletionDate?: string | null;
  timestamp: string; // ISO string
  notes?: string;
}

export function getAlerts(): AlertItem[] {
  try {
    const saved = localStorage.getItem('roadwatch_alerts');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load alerts from localStorage', e);
  }
  return [];
}

export function saveAlerts(alerts: AlertItem[]): void {
  try {
    localStorage.setItem('roadwatch_alerts', JSON.stringify(alerts));
    window.dispatchEvent(new Event('roadwatch-alerts-updated'));
  } catch (e) {
    console.error('Failed to save alerts to localStorage', e);
  }
}

export function addAlert(alert: Omit<AlertItem, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): AlertItem {
  const newAlert: AlertItem = {
    ...alert,
    id: alert.id || `alt-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: alert.timestamp || new Date().toISOString(),
  };

  setDocument(getDocRef('alerts', newAlert.id), newAlert);
  saveAlerts([newAlert, ...getAlerts()]);
  return newAlert;
}

export function getRepairs(): RepairItem[] {
  try {
    const saved = localStorage.getItem('roadwatch_repairs');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load repairs from localStorage', e);
  }
  return [];
}

export function addRepairRecord(hazard: Report, status: 'Assigned' | 'Repairing' | 'Resolved' | 'Completed') {
  const repairId = `rep-log-${hazard.id}-${status.toLowerCase()}`;
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const record: RepairItem = {
    id: repairId,
    hazardId: hazard.id,
    hazardTitle: hazard.title,
    location: hazard.location,
    assignedTeam: hazard.assignedTeam || 'Team Gamma (Rapid Response)',
    status: status === 'Completed' ? 'Resolved' : status,
    startDate: hazard.startDate || todayStr,
    actualCompletionDate: (status === 'Resolved' || status === 'Completed') ? todayStr : null,
    timestamp: new Date().toISOString(),
    notes: hazard.repairNotes || ''
  };
  setDocument(getDocRef('repairs', repairId), record);
  
  const repairs = getRepairs();
  repairs.unshift(record);
  localStorage.setItem('roadwatch_repairs', JSON.stringify(repairs));
  window.dispatchEvent(new Event('roadwatch-repairs-updated'));
}

export function resolveAlertForHazard(hazardId: string) {
  const alerts = getAlerts();
  const matchingAlert = alerts.find(a => a.hazardId === hazardId);
  if (matchingAlert) {
    updateDocument(getDocRef('alerts', matchingAlert.id), { status: 'Resolved' });
    matchingAlert.status = 'Resolved';
    saveAlerts(alerts);
  }
}

export function acknowledgeAlert(alertId: string) {
  updateDocument(getDocRef('alerts', alertId), { status: 'Acknowledged' });
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = 'Acknowledged';
    saveAlerts(alerts);
    if (alert.hazardId) {
      updateDocument(getDocRef('hazards', alert.hazardId), { acknowledged: true });
      const reports = getReports();
      const report = reports.find(r => r.id === alert.hazardId);
      if (report) {
        report.acknowledged = true;
        saveReports(reports);
      }
    }
  }
}

export interface TelemetryLog {
  time: string;
  module: string;
  event: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

export interface UserProfile {
  uid?: string;
  email: string;
  role: 'admin' | 'citizen';
  name: string;
  title: string;
  avatarUrl: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface LoginLogEntry {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'citizen';
  title?: string;
  loginMethod: 'email' | 'google' | 'quick_access' | 'demo';
  timestamp: string; // ISO format
  avatarUrl?: string;
  status: 'Success' | 'Failed';
  ipAddress?: string;
  deviceInfo?: string;
}

export interface SystemSettings {
  refreshInterval: string;
  theme: string;
  threshold: string;
  desktopAlerts: boolean;
  soundAlerts: boolean;
  aiAnalysisDepth: boolean;
}

const DEFAULT_REPORTS: Report[] = [];

const DEFAULT_ALERTS: AlertItem[] = [
  {
    id: 'alt-101',
    type: 'flood',
    title: 'Waterlogging: East Coast Expressway',
    location: 'Bayfront Connector',
    severity: 'Critical',
    status: 'Active',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    description: 'Heavy precipitation causing roadside pooling on lanes 3 and 4. Speeds capped at 40km/h.',
    hazardId: 'rep-default-1'
  },
  {
    id: 'alt-102',
    type: 'structural',
    title: 'Subsidence: Bridge Support Settling',
    location: 'Downtown Expressway Pillar 4',
    severity: 'Critical',
    status: 'Active',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    description: 'AI telemetry reports a 3cm settlement. Structural engineers dispatched for visual safety inspections.',
    hazardId: 'rep-default-2'
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

const DEFAULT_LOGIN_LOGS: LoginLogEntry[] = [
  {
    id: 'log-101',
    email: 'authority@roadwatch.gov',
    name: 'Municipal Director',
    role: 'admin',
    title: 'Municipal Authority',
    loginMethod: 'email',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
    status: 'Success',
    ipAddress: '127.0.0.1 (Localhost)',
    deviceInfo: 'Chrome Browser / Windows'
  },
  {
    id: 'log-102',
    email: 'maintenance@roadwatch.gov',
    name: 'Maintenance Supervisor',
    role: 'admin',
    title: 'Maintenance Lead',
    loginMethod: 'quick_access',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    status: 'Success',
    ipAddress: '127.0.0.1 (Localhost)',
    deviceInfo: 'Edge Browser / Windows'
  },
  {
    id: 'log-103',
    email: 'citizen@gmail.com',
    name: 'Resident Citizen',
    role: 'citizen',
    title: 'Citizen Contributor',
    loginMethod: 'google',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    status: 'Success',
    ipAddress: '127.0.0.1 (Localhost)',
    deviceInfo: 'Safari Mobile / iOS'
  }
];

// HELPER FUNCTIONS FOR REPORTS
export function getReports(): Report[] {
  try {
    const version = localStorage.getItem('roadwatch_version');
    if (version !== 'v2') {
      localStorage.removeItem('roadwatch_reports');
      localStorage.setItem('roadwatch_version', 'v2');
    } else {
      const saved = localStorage.getItem('roadwatch_reports');
      if (saved) {
        const parsed = JSON.parse(saved) as Report[];
        return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
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
  const citizenReportsCount = report.citizenReportsCount || (report.source?.includes('Citizen') ? Math.floor(Math.random() * 12) + 3 : 1);

  const newReport: Report = {
    ...report,
    id: report.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: report.timestamp || new Date().toISOString(),
    status,
    priorityScore,
    estimatedRisk,
    recommendedRepairTime,
    citizenReportsCount,
    beforeImageUrl: report.beforeImageUrl || report.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
  };
  
  // Persist both local and Firestore reports so the app refreshes immediately
  const reports = getReports();
  reports.unshift(newReport);
  saveReports(reports);
  setDocument(getDocRef('hazards', newReport.id), newReport);
  addLog('Incident Reporter', `New hazard reported: ${newReport.title} at ${newReport.location}`, newReport.severity === 'Critical' ? 'WARN' : 'INFO');

  // Sync to Complaints for Municipal Operations if not already from a complaint
  if (!newReport.id.startsWith('rep-from-')) {
    const newComplaintId = `comp-from-${newReport.id}`;
    const newComplaint: CitizenComplaint = {
      id: newComplaintId,
      title: newReport.title,
      description: newReport.description || `Detected Hazard: ${newReport.title}`,
      locationName: newReport.location,
      imageUrl: newReport.beforeImageUrl || newReport.imageUrl || '',
      lat: newReport.lat || 1.2900,
      lng: newReport.lng || 103.8500,
      x: newReport.x || 50,
      y: newReport.y || 50,
      citizenId: newReport.source || 'System',
      status: newReport.status === 'Verified' ? 'Verified' : 'Submitted',
      priority: newReport.severity === 'Critical' ? 'Critical' : newReport.severity === 'Active' ? 'High' : 'Medium',
      hazardType: newReport.icon === 'droplets' ? 'Waterlogging' : newReport.icon === 'hardhat' ? 'Road Blockage' : 'Large Pothole',
      timestamp: newReport.timestamp,
      createdAt: newReport.timestamp,
      votes: 0,
      citizenVerified: false,
      citizenRating: 0,
      citizenFeedback: '',
      satisfactionScore: 0,
      resolutionQualityScore: 0,
      priorityScore: newReport.priorityScore,
      assignedTeam: newReport.assignedTeam
    };
    setDocument(getDocRef('complaints', newComplaintId), newComplaint);

    const complaints = getComplaints();
    complaints.unshift(newComplaint);
    saveComplaints(complaints);
  }

  const titleLower = newReport.title.toLowerCase();
  let alertType: 'fire' | 'flood' | 'structural' | 'traffic' = 'traffic';
  if (newReport.icon === 'droplets' || titleLower.includes('waterlogging') || titleLower.includes('flood')) {
    alertType = 'flood';
  } else if (newReport.icon === 'hardhat' || titleLower.includes('divider') || titleLower.includes('structure') || titleLower.includes('subsidence')) {
    alertType = 'structural';
  } else if (titleLower.includes('fire') || titleLower.includes('temperature') || titleLower.includes('thermal')) {
    alertType = 'fire';
  }

  const alertSeverity: AlertItem['severity'] = newReport.severity === 'Critical'
    ? 'Critical'
    : newReport.severity === 'Active'
      ? 'Major'
      : 'Minor';

  const newAlert = {
    title: newReport.title,
    location: newReport.location,
    severity: alertSeverity,
    status: 'Active' as const,
    timestamp: newReport.timestamp,
    description: newReport.description || `Reported hazard: ${newReport.title} at ${newReport.location}`,
    hazardId: newReport.id,
    type: alertType,
  };

  addAlert(newAlert);
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

  const start = report.startedAt || (report.timestamp ? new Date(report.timestamp).getTime() : Date.now() - 42 * 60 * 1000);
  const durationMins = Math.max(1, Math.round((Date.now() - start) / 60000));
  const resolutionTime = `${durationMins} Minutes`;

  const updatedFields = { 
    resolved: true, 
    status: 'Resolved' as const,
    resolvedAt: Date.now(),
    assignedTeam: report.assignedTeam || 'Team Gamma (Rapid Response)',
    startDate: report.startDate || yesterdayStr,
    estimatedCompletionDate: report.estimatedCompletionDate || todayStr,
    actualCompletionDate: report.actualCompletionDate || todayStr,
    resolutionTime,
    repairDate: report.repairDate || todayStr,
    afterImageUrl: report.afterImageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80',
    repairNotes: report.repairNotes || 'Completed paving and smoothing of asphalt layer. Structural load validation complete.'
  };

  updateDocument(getDocRef('hazards', id), updatedFields);
  
  const index = reports.findIndex(r => r.id === id);
  if (index !== -1) {
    reports[index] = { ...reports[index], ...updatedFields };
    saveReports(reports);

    // Trigger auto-dispatch
    const { updatedReports, dispatches } = triggerAutoDispatch(reports);
    if (dispatches.length > 0) {
      saveReports(updatedReports);
      dispatches.forEach(d => {
        addLog('System Dispatch', `Auto-assigned queued hazard to ${d.team}`, 'SUCCESS');
      });
    }
  }
  
  // Write repair record
  addRepairRecord({ ...report, ...updatedFields }, 'Resolved');

  // Resolve alert
  resolveAlertForHazard(id);

  // Sync back to corresponding CitizenComplaint
  const complaintId = id.startsWith('rep-from-') ? id.replace('rep-from-', '') : `comp-from-${id}`;
  updateComplaint(complaintId, { status: 'Resolved' });

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

  updateDocument(getDocRef('hazards', id), updatedFields);

  // Sync to complaint
  const complaintId = id.toLowerCase().startsWith('rep-from-') ? id.substring(9) : `comp-from-${id}`;
  updateComplaint(complaintId, {
    citizenVerified: true,
    citizenRating: rating,
    citizenFeedback: feedback,
    satisfactionScore: rating * 20,
    resolutionQualityScore: Math.min(100, Math.round(85 + rating * 3))
  });

  const reports = getReports();
  const report = reports.find(r => r.id === id);
  if (report) {
    addLog('Citizen Portal', `Citizen verified repair for "${report.title}": ${rating} Stars. Feedback: "${feedback}"`, 'SUCCESS');
  }
}

export function deleteReport(id: string): void {
  deleteDocument(getDocRef('hazards', id));
  const reports = getReports();
  saveReports(reports.filter(r => r.id !== id));

  // Also delete corresponding alert
  const alerts = getAlerts();
  const alertToDelete = alerts.find(a => a.hazardId === id);
  if (alertToDelete) {
    deleteDocument(getDocRef('alerts', alertToDelete.id));
    saveAlerts(alerts.filter(a => a.hazardId !== id));
  }
}

export function updateReportStatus(id: string, updates: Partial<Report>): void {
  const reports = getReports();
  const index = reports.findIndex(r => r.id === id);
  const report = index !== -1 ? reports[index] : undefined;

  if (updates.status === 'Assigned' && updates.assignedTeam) {
    const activeReps = reports.filter(r => r.id !== id);
    const teamWorkload = activeReps.filter(r => 
      r.assignedTeam === updates.assignedTeam && 
      !r.resolved && 
      r.status !== 'Resolved' && 
      r.status !== 'Completed' && 
      (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Repairing' || r.status === 'Delayed' || r.status === 'Awaiting Resolution')
    ).length;
    
    if (teamWorkload >= 2) {
      const teams = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta'];
      const workloads = teams.map(t => ({
        name: t,
        load: activeReps.filter(r => 
          r.assignedTeam === t && 
          !r.resolved && 
          r.status !== 'Resolved' && 
          r.status !== 'Completed' && 
          (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Repairing' || r.status === 'Delayed' || r.status === 'Awaiting Resolution')
        ).length
      })).sort((a, b) => a.load - b.load);

      if (workloads[0].load < 2) {
        updates.assignedTeam = workloads[0].name;
      } else {
        updates.status = 'Queued';
        updates.queuedAt = Date.now();
        updates.assignedTeam = undefined;
        updates.startDate = undefined;
        updates.estimatedCompletionDate = undefined;
      }
    }
  }

  if (updates.status === 'In Progress' && report && report.status !== 'In Progress') {
    updates.startedAt = Date.now();
    updates.progress = updates.progress !== undefined ? updates.progress : 0;
    const severity = updates.severity || report.severity || 'Active';
    updates.slaMinutes = severity === 'Critical' ? 2 : severity === 'Active' ? 5 : 10;
    updates.etaMinutes = updates.etaMinutes || (severity === 'Critical' ? 12 : severity === 'Active' ? 25 : 45);
    updates.estimatedCompletionTime = Date.now() + updates.etaMinutes * 60000;
    updates.lastCrewUpdate = 'Crew deployed. Resurfacing and repair work initiated.';
    updates.lastCrewUpdateAt = Date.now();
  }

  if (updates.status === 'Delayed' && report) {
    updates.lastCrewUpdate = `Repair delayed. Reason: ${updates.delayReason || 'Equipment/Crew reallocation'}`;
    updates.lastCrewUpdateAt = Date.now();
  }

  if (updates.status === 'Awaiting Resolution' && report) {
    updates.lastCrewUpdate = 'Repair complete. Awaiting final quality assurance approval.';
    updates.lastCrewUpdateAt = Date.now();
  }

  if (updates.progress !== undefined && report) {
    updates.lastCrewUpdateAt = Date.now();
    if (updates.progress === 100) {
      updates.status = 'Awaiting Resolution';
      updates.lastCrewUpdate = 'Repair operations reached 100%. Awaiting inspection.';
    } else {
      updates.lastCrewUpdate = `Repair progress updated to ${updates.progress}%.`;
    }
  }

  if (updates.etaMinutes !== undefined && report) {
    const prevEstTime = report.estimatedCompletionTime || (report.startedAt ? report.startedAt + (report.etaMinutes || 0) * 60000 : 0);
    const newEstTime = Date.now() + updates.etaMinutes * 60000;
    updates.estimatedCompletionTime = newEstTime;
    
    if (prevEstTime > 0 && newEstTime > prevEstTime + 10000) {
      const diffMins = Math.round((newEstTime - prevEstTime) / 60000);
      addLog('Maintenance Dispatch', `ETA for "${report.title}" increased by ${diffMins} minutes. Reason: ${updates.delayReason || 'Crew update'}`, 'WARN');
    }
  }

  if ((updates.status === 'Resolved' || updates.status === 'Completed') && report) {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    updates.resolved = true;
    updates.resolvedAt = Date.now();
    updates.completedAt = Date.now();
    updates.actualCompletionDate = report.actualCompletionDate || todayStr;
    updates.repairDate = report.repairDate || todayStr;
    
    const start = updates.startedAt || report.startedAt || (report.timestamp ? new Date(report.timestamp).getTime() : Date.now() - 42 * 60 * 1000);
    const durationMins = Math.max(1, Math.round((Date.now() - start) / 60000));
    updates.resolutionTime = `${durationMins} Minutes`;

    updates.afterImageUrl = report.afterImageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80';
    updates.repairNotes = report.repairNotes || 'Completed paving and smoothing of asphalt layer. Structural load validation complete.';
  }

  updateDocument(getDocRef('hazards', id), updates);

  if (index !== -1 && report) {
    const merged = { ...report, ...updates };
    reports[index] = merged;
    saveReports(reports); // Force local storage update and UI re-render

    if (updates.status === 'Assigned' || updates.status === 'Repairing' || updates.status === 'In Progress') {
      addRepairRecord(merged, (updates.status === 'In Progress' || updates.status === 'Repairing') ? 'Repairing' : updates.status as any);
    }
    if (updates.status === 'Resolved' || updates.status === 'Completed') {
      resolveAlertForHazard(id);
    }

    // Trigger auto-dispatch
    const { updatedReports, dispatches } = triggerAutoDispatch(reports);
    if (dispatches.length > 0) {
      saveReports(updatedReports);
      dispatches.forEach(d => {
        addLog('System Dispatch', `Auto-assigned queued hazard to ${d.team}`, 'SUCCESS');
      });
    }
  }

  // Sync status changes back to CitizenComplaint
  const complaintId = id.toLowerCase().startsWith('rep-from-') ? id.substring(9) : `comp-from-${id}`;
  if (updates.status) {
    let compStatus: CitizenComplaint['status'] = 'Submitted';
    if (updates.status === 'Resolved' || updates.status === 'Completed') compStatus = 'Resolved';
    else if (updates.status === 'Repairing' || updates.status === 'In Progress') compStatus = 'Repair In Progress';
    else if (updates.status === 'Assigned') compStatus = 'Assigned';
    else if (updates.status === 'Verified') compStatus = 'Verified';
    else if (updates.status === 'Detected') compStatus = 'Submitted';
    
    updateComplaint(complaintId, { status: compStatus });
  }

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
// USER SESSION & LOGIN AUDIT STORAGE SYSTEM
// ==========================================

export function getUserSession(): UserProfile | null {
  try {
    const stored = localStorage.getItem('roadwatch_user_profile');
    if (stored) {
      return JSON.parse(stored) as UserProfile;
    }
  } catch (e) {
    console.error('Failed to parse stored user profile', e);
  }
  return null;
}

export function saveUserSession(
  user: UserProfile, 
  loginMethod: 'email' | 'google' | 'quick_access' | 'demo' = 'email'
): void {
  try {
    const updatedUser: UserProfile = {
      ...user,
      lastLoginAt: new Date().toISOString()
    };
    
    // 1. Save profile and role into LocalStorage
    localStorage.setItem('roadwatch_user_profile', JSON.stringify(updatedUser));
    localStorage.setItem('user_role', user.role);
    window.dispatchEvent(new Event('roadwatch-user-updated'));

    // 2. Write/update user document in Firestore and MongoDB database
    const uid = user.uid || `user-${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    setDocument(getDocRef('users', uid), updatedUser);

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    }).catch(err => console.warn('MongoDB API sync notice:', err.message));

    // 3. Store login audit log entry
    addLoginLog({
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      loginMethod,
      avatarUrl: user.avatarUrl,
      status: 'Success',
      ipAddress: '127.0.0.1 (Localhost)',
      deviceInfo: typeof navigator !== 'undefined' && navigator.userAgent ? (navigator.userAgent.includes('Chrome') ? 'Chrome Web Browser' : 'Web Browser') : 'Desktop Client'
    });

    addLog('Auth Storage', `User session stored for ${user.email} (${user.role}) via ${loginMethod}`, 'SUCCESS');
  } catch (e) {
    console.error('Failed to save user session to storage', e);
  }
}

export function logoutUser(): void {
  try {
    const currentUser = getUserSession();
    if (currentUser) {
      addLog('Auth Storage', `User ${currentUser.email} logged out.`, 'INFO');
    }
    localStorage.removeItem('roadwatch_user_profile');
    localStorage.removeItem('user_role');
    window.dispatchEvent(new Event('roadwatch-user-updated'));
  } catch (e) {
    console.error('Failed to clear user session', e);
  }
}

export function getLoginLogs(): LoginLogEntry[] {
  try {
    const saved = localStorage.getItem('roadwatch_login_logs');
    if (saved) {
      const parsed = JSON.parse(saved) as LoginLogEntry[];
      return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (e) {
    console.error('Failed to load login logs from storage', e);
  }
  saveLoginLogs(DEFAULT_LOGIN_LOGS);
  return DEFAULT_LOGIN_LOGS;
}

export function saveLoginLogs(logs: LoginLogEntry[]): void {
  try {
    localStorage.setItem('roadwatch_login_logs', JSON.stringify(logs));
    window.dispatchEvent(new Event('roadwatch-login-logs-updated'));
  } catch (e) {
    console.error('Failed to save login logs to storage', e);
  }
}

export function addLoginLog(entry: Omit<LoginLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): LoginLogEntry {
  const id = entry.id || `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = entry.timestamp || new Date().toISOString();
  
  const newLog: LoginLogEntry = {
    ...entry,
    id,
    timestamp
  };

  const logs = getLoginLogs();
  logs.unshift(newLog);
  saveLoginLogs(logs);
  
  // Persist into Firestore and MongoDB database
  setDocument(getDocRef('login_logs', id), newLog);
  fetch('/api/login-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newLog)
  }).catch(err => console.warn('MongoDB log sync notice:', err.message));
  
  return newLog;
}

export function clearLoginLogs(): void {
  try {
    localStorage.removeItem('roadwatch_login_logs');
    window.dispatchEvent(new Event('roadwatch-login-logs-updated'));
    fetch('/api/login-logs/clear', { method: 'POST' }).catch(err => console.warn('MongoDB log clear notice:', err.message));
    addLog('Auth Storage', 'Login audit storage cleared.', 'INFO');
  } catch (e) {
    console.error('Failed to clear login logs', e);
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
  imageUrl: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  status: 'Submitted' | 'Verified' | 'Assigned' | 'Repairing' | 'Repair In Progress' | 'Resolved' | 'Closed';
  timestamp: string;
  votes: number;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  hazardType?: string;
  notes?: string;
  priorityScore?: number;
  assignedTeam?: string;

  citizenVerified?: boolean;
  citizenRating?: number;
  citizenFeedback?: string;
  satisfactionScore?: number;
  resolutionQualityScore?: number;
  resolvedAt?: string;
  createdAt?: string;
  citizenId?: string;
  upvotes?: number;
  followUpImageUrl?: string;
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

export function updateComplaint(id: string, updates: Partial<CitizenComplaint>): void {
  updateDocument(getDocRef('complaints', id), updates);
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  if (index !== -1) {
    complaints[index] = { ...complaints[index], ...updates };
    saveComplaints(complaints);
  }
}

export function saveComplaints(complaints: CitizenComplaint[]): void {
  try {
    localStorage.setItem('roadwatch_complaints', JSON.stringify(complaints));
    window.dispatchEvent(new Event('roadwatch-complaints-updated'));
  } catch (e) {
    console.error('Failed to save complaints to localStorage', e);
  }
}

export function addComplaint(complaint: Omit<CitizenComplaint, 'id' | 'timestamp' | 'votes' | 'status'> & { id?: string; timestamp?: string }): CitizenComplaint {
  const id = complaint.id || `comp-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = complaint.timestamp || new Date().toISOString();
  
  const newComplaint: CitizenComplaint = {
    ...complaint,
    id,
    status: 'Submitted',
    timestamp,
    votes: 1,
    citizenVerified: false,
    citizenRating: 0,
    citizenFeedback: '',
    satisfactionScore: 0,
    resolutionQualityScore: 0
  };

  // Write to Firestore complaints collection and local storage
  setDocument(getDocRef('complaints', id), newComplaint);
  const complaints = getComplaints();
  complaints.unshift(newComplaint);
  saveComplaints(complaints);

  // Sync to Reports (create corresponding Report) and alert the system
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
    priorityScore: (newComplaint.priority === 'Critical' ? 95 : newComplaint.priority === 'High' ? 80 : newComplaint.priority === 'Medium' ? 55 : 30),
    estimatedRisk: (newComplaint.priority === 'Critical' ? 'High Accident Risk' : newComplaint.priority === 'High' ? 'Moderate Damage Risk' : 'Minor Road Decay'),
    recommendedRepairTime: (newComplaint.priority === 'Critical' ? 'Within 24 Hours' : newComplaint.priority === 'High' ? 'Within 3 Days' : 'Within 7 Days'),
    beforeImageUrl: newComplaint.imageUrl
  };
  addReport(newReport);

  // Generate notification in Firestore
  addDocument(getCollectionRef('notifications'), {
    title: 'Complaint Submitted',
    message: `Your report "${newComplaint.title}" has been successfully submitted.`,
    timestamp,
    read: false,
    citizenId: 'citizen_demo'
  });

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
    updateDocument(getDocRef('hazards', reportId), { status: reportStatus });
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
  updateDocument(getDocRef('hazards', reportId), {
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

export function sortQueuedHazards(hazards: Report[]): Report[] {
  return [...hazards].sort((a, b) => {
    // 1. Severity (Critical = 4, Active/High = 3, Pending/Medium = 2, Scheduled/Low = 1)
    const getSeverityWeight = (sev?: string) => {
      switch (sev) {
        case 'Critical': return 4;
        case 'Active': return 3;
        case 'Pending': return 2;
        case 'Scheduled': return 1;
        default: return 1;
      }
    };
    const sevA = getSeverityWeight(a.severity);
    const sevB = getSeverityWeight(b.severity);
    if (sevB !== sevA) return sevB - sevA;

    // 2. AI Risk Score
    const scoreA = a.priorityScore || 0;
    const scoreB = b.priorityScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    // 3. Citizen reports count
    const reportsA = a.citizenReportsCount || 0;
    const reportsB = b.citizenReportsCount || 0;
    if (reportsB !== reportsA) return reportsB - reportsA;

    // 4. Waiting time (older queued first -> smaller queuedAt)
    const timeA = a.queuedAt || 0;
    const timeB = b.queuedAt || 0;
    return timeA - timeB;
  });
}

export function triggerAutoDispatch(reports: Report[]): { updatedReports: Report[]; dispatches: { reportId: string; team: string }[] } {
  const teams = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta'];
  const updatedReports = [...reports];
  const dispatches: { reportId: string; team: string }[] = [];

  let queued = updatedReports.filter(r => r.status === 'Queued');
  if (queued.length === 0) return { updatedReports, dispatches };

  let attempts = 0;
  const maxAttempts = 10;

  while (queued.length > 0 && attempts < maxAttempts) {
    attempts++;
    const workloads: Record<string, number> = {
      'Team Alpha': 0,
      'Team Bravo': 0,
      'Team Charlie': 0,
      'Team Delta': 0
    };

    updatedReports.forEach(r => {
      if (r.assignedTeam && !r.resolved && r.status !== 'Resolved' && r.status !== 'Completed' &&
          (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Repairing' || r.status === 'Delayed' || r.status === 'Awaiting Resolution')) {
        if (workloads[r.assignedTeam] !== undefined) {
          workloads[r.assignedTeam]++;
        }
      }
    });

    const availableTeams = teams.filter(t => workloads[t] < 2).sort((a, b) => workloads[a] - workloads[b]);
    if (availableTeams.length === 0) break;

    const sortedQueued = sortQueuedHazards(queued);
    const topHazard = sortedQueued[0];
    const assignedTeam = availableTeams[0];

    const hzIdx = updatedReports.findIndex(r => r.id === topHazard.id);
    if (hzIdx > -1) {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      updatedReports[hzIdx] = {
        ...updatedReports[hzIdx],
        status: 'Assigned',
        assignedTeam,
        startDate: todayStr,
        estimatedCompletionDate: todayStr,
        queuedAt: undefined
      };
      
      updateDocument(getDocRef('hazards', topHazard.id), {
        status: 'Assigned',
        assignedTeam,
        startDate: todayStr,
        estimatedCompletionDate: todayStr,
        queuedAt: null as any
      });

      addRepairRecord(updatedReports[hzIdx], 'Assigned');
      dispatches.push({ reportId: topHazard.id, team: assignedTeam });
    }

    queued = updatedReports.filter(r => r.status === 'Queued');
  }

  return { updatedReports, dispatches };
}

// Subscribe to Firestore updates and update LocalStorage to keep the entire app synced in real-time
let seededReports = false;
subscribeToQuery(buildQuery(getCollectionRef('hazards')), (firebaseReports) => {
  if (firebaseReports.length === 0 && !seededReports) {
    seededReports = true;
    DEFAULT_REPORTS.forEach(r => {
      setDocument(getDocRef('hazards', r.id), r);
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

// Subscribe to Alerts in real-time
let seededAlerts = false;
subscribeToQuery(buildQuery(getCollectionRef('alerts'), queryOrderBy('timestamp', 'desc')), (firebaseAlerts) => {
  if (firebaseAlerts.length === 0 && !seededAlerts) {
    seededAlerts = true;
    DEFAULT_ALERTS.forEach(a => {
      setDocument(getDocRef('alerts', a.id), a);
    });
  } else {
    localStorage.setItem('roadwatch_alerts', JSON.stringify(firebaseAlerts));
    window.dispatchEvent(new Event('roadwatch-alerts-updated'));
  }
});

// Subscribe to Repairs in real-time
subscribeToQuery(buildQuery(getCollectionRef('repairs'), queryOrderBy('timestamp', 'desc')), (firebaseRepairs) => {
  localStorage.setItem('roadwatch_repairs', JSON.stringify(firebaseRepairs));
  window.dispatchEvent(new Event('roadwatch-repairs-updated'));
});

// Subscribe to Users in real-time
subscribeToQuery(buildQuery(getCollectionRef('users')), (firebaseUsers) => {
  localStorage.setItem('roadwatch_users', JSON.stringify(firebaseUsers));
  window.dispatchEvent(new Event('roadwatch-users-updated'));
});

// Subscribe to Login Audit Logs in real-time
let seededLoginLogs = false;
subscribeToQuery(buildQuery(getCollectionRef('login_logs'), queryOrderBy('timestamp', 'desc')), (firebaseLoginLogs) => {
  if (firebaseLoginLogs.length === 0 && !seededLoginLogs) {
    seededLoginLogs = true;
    DEFAULT_LOGIN_LOGS.forEach(l => {
      setDocument(getDocRef('login_logs', l.id), l);
    });
  } else if (firebaseLoginLogs.length > 0) {
    localStorage.setItem('roadwatch_login_logs', JSON.stringify(firebaseLoginLogs));
    window.dispatchEvent(new Event('roadwatch-login-logs-updated'));
  }
});

