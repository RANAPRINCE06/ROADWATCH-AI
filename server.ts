import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

import { fileURLToPath } from 'url';

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

// Interface declarations
interface Report {
  id: string;
  title: string;
  location: string;
  severity: 'Critical' | 'Active' | 'Pending' | 'Scheduled';
  icon: 'alert' | 'lightbulb' | 'hardhat' | 'car' | 'droplets';
  source: string;
  timestamp: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
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
  assignedAt?: number;
  completedAt?: number;
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

  citizenVerified?: boolean;
  citizenRating?: number;
  citizenFeedback?: string;
  satisfactionScore?: number;
  resolutionQualityScore?: number;
  resolvedAt?: number;
}

interface SensorDevice {
  id: string;
  name: string;
  locationName: string;
  vibration: number;
  temperature: number;
  battery: number;
  status: 'Online' | 'Warning' | 'Offline';
  connectivity: 'WiFi' | 'Cellular' | 'LoRaWAN';
  roadHealthScore: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

interface CitizenComplaint {
  id: string;
  title: string;
  description: string;
  locationName: string;
  location?: string;
  imageUrl: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  status: 'Submitted' | 'Verified' | 'Assigned' | 'Repairing' | 'Repair In Progress' | 'Resolved' | 'Closed';
  timestamp: string;
  createdAt?: string;
  citizenId?: string;
  votes: number;
  upvotes?: number;
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

interface TelemetryLog {
  time: string;
  module: string;
  event: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

interface SystemSettings {
  refreshInterval: string;
  theme: string;
  threshold: string;
  desktopAlerts: boolean;
  soundAlerts: boolean;
  aiAnalysisDepth: boolean;
}

interface AIReport {
  id: string;
  title: string;
  date: string;
  category: 'Drainage' | 'Infrastructure' | 'Signal' | 'Pavement';
  decayIndex: number;
  safetyRating: 'Hazardous' | 'Warning' | 'Stable';
  summary: string;
  aiInsights: string;
}

interface DB {
  reports: Report[];
  complaints: CitizenComplaint[];
  sensors: SensorDevice[];
  notifications: any[];
  logs: TelemetryLog[];
  settings: SystemSettings;
  aiReports: AIReport[];
}

const DEFAULT_REPORTS: Report[] = [];

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

const DEFAULT_AI_REPORTS: AIReport[] = [
  {
    id: 'ai-rep-1',
    title: 'Orchard Link Structural Deformation Insight',
    date: new Date(Date.now() - 24 * 3600000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    category: 'Infrastructure',
    decayIndex: 8.4,
    safetyRating: 'Hazardous',
    summary: 'Automated laser sensors detected a sudden road shift at Sector 4, Orchard Rd. Structural deformation threshold exceeded by 180%.',
    aiInsights: 'Crews should proceed to Orchard Link immediately. Recommend emergency detour routing and capping sector speeds at 30km/h.'
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Complaint Submitted',
    message: 'Your report "Pothole development at crosswalk" has been successfully submitted.',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    read: false,
    citizenId: 'citizen_demo'
  },
  {
    id: 'notif-2',
    title: 'Complaint Verified',
    message: 'Your report "Debris blocking curbside lane" has been verified by municipal team.',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: true,
    citizenId: 'citizen_demo'
  }
];

function readDB(): DB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialDB: DB = {
        reports: DEFAULT_REPORTS,
        complaints: DEFAULT_COMPLAINTS,
        sensors: DEFAULT_SENSORS,
        notifications: DEFAULT_NOTIFICATIONS,
        logs: DEFAULT_LOGS,
        settings: DEFAULT_SETTINGS,
        aiReports: DEFAULT_AI_REPORTS
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read database', e);
    return {
      reports: DEFAULT_REPORTS,
      complaints: DEFAULT_COMPLAINTS,
      sensors: DEFAULT_SENSORS,
      notifications: DEFAULT_NOTIFICATIONS,
      logs: DEFAULT_LOGS,
      settings: DEFAULT_SETTINGS,
      aiReports: DEFAULT_AI_REPORTS
    };
  }
}

function writeDB(data: DB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write database', e);
  }
}

// Add system log
function addSystemLog(module: string, event: string, status: 'SUCCESS' | 'WARN' | 'INFO') {
  const db = readDB();
  const time = new Date().toTimeString().split(' ')[0];
  db.logs.unshift({ time, module, event, status });
  if (db.logs.length > 50) db.logs = db.logs.slice(0, 50);
  writeDB(db);
  io.emit('logs:updated', db.logs);
}

function sortQueuedHazards(hazards: Report[]): Report[] {
  return [...hazards].sort((a, b) => {
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

    const scoreA = a.priorityScore || 0;
    const scoreB = b.priorityScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const reportsA = a.citizenReportsCount || 0;
    const reportsB = b.citizenReportsCount || 0;
    if (reportsB !== reportsA) return reportsB - reportsA;

    const timeA = a.queuedAt || 0;
    const timeB = b.queuedAt || 0;
    return timeA - timeB;
  });
}

function triggerAutoDispatch(reports: Report[]): { updatedReports: Report[]; dispatches: { reportId: string; team: string }[] } {
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
      
      const record = {
        id: `rep-log-${topHazard.id}-assigned`,
        hazardId: topHazard.id,
        hazardTitle: topHazard.title,
        location: topHazard.location,
        assignedTeam,
        status: 'Assigned' as const,
        startDate: todayStr,
        actualCompletionDate: null,
        timestamp: new Date().toISOString(),
        notes: ''
      };
      
      dispatches.push({ reportId: topHazard.id, team: assignedTeam });
    }

    queued = updatedReports.filter(r => r.status === 'Queued');
  }

  return { updatedReports, dispatches };
}

// Routes
app.get('/api/reports', (req, res) => {
  const db = readDB();
  res.json(db.reports);
});

app.post('/api/reports', (req, res) => {
  const db = readDB();
  const r = req.body;
  const severity = r.severity || 'Active';
  const priorityScore = r.priorityScore || (severity === 'Critical' ? 92 : severity === 'Active' ? 76 : severity === 'Scheduled' ? 60 : 45);
  const estimatedRisk = r.estimatedRisk || (severity === 'Critical' ? 'High Accident Risk' : severity === 'Active' ? 'Moderate Damage Risk' : 'Minor Road Decay');
  const recommendedRepairTime = r.recommendedRepairTime || (severity === 'Critical' ? 'Within 24 Hours' : severity === 'Active' ? 'Within 3 Days' : 'Within 7 Days');
  const status = r.status || (((r.source === 'AI Detected' || r.source?.includes('AI')) && !r.source?.includes('Citizen')) ? 'Verified' : 'Detected');
  const citizenReportsCount = r.citizenReportsCount || (r.source?.includes('Citizen') ? Math.floor(Math.random() * 12) + 3 : 1);

  const newReport: Report = {
    ...r,
    id: r.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: r.timestamp || new Date().toISOString(),
    status,
    priorityScore,
    estimatedRisk,
    recommendedRepairTime,
    citizenReportsCount,
    beforeImageUrl: r.beforeImageUrl || r.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
  };

  db.reports.unshift(newReport);
  writeDB(db);
  io.emit('reports:updated', db.reports);
  addSystemLog('Incident Reporter', `New hazard reported: ${newReport.title} at ${newReport.location}`, newReport.severity === 'Critical' ? 'WARN' : 'INFO');
  res.status(201).json(newReport);
});

app.put('/api/reports/:id', (req, res) => {
  const db = readDB();
  const index = db.reports.findIndex(r => r.id === req.params.id);
  if (index > -1) {
    const updates = { ...req.body };

    if (updates.status === 'Assigned' && updates.assignedTeam) {
      const activeReps = db.reports.filter(r => r.id !== req.params.id);
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

    const prevReport = db.reports[index];
    if (updates.status === 'In Progress' && prevReport.status !== 'In Progress') {
      updates.startedAt = Date.now();
      updates.progress = updates.progress !== undefined ? updates.progress : 0;
      const severity = updates.severity || prevReport.severity || 'Active';
      updates.slaMinutes = severity === 'Critical' ? 2 : severity === 'Active' ? 5 : 10;
      updates.etaMinutes = updates.etaMinutes || (severity === 'Critical' ? 12 : severity === 'Active' ? 25 : 45);
      updates.estimatedCompletionTime = Date.now() + updates.etaMinutes * 60000;
      updates.lastCrewUpdate = 'Crew deployed. Resurfacing and repair work initiated.';
      updates.lastCrewUpdateAt = Date.now();
    }

    if (updates.status === 'Delayed' && prevReport) {
      updates.lastCrewUpdate = `Repair delayed. Reason: ${updates.delayReason || 'Equipment/Crew reallocation'}`;
      updates.lastCrewUpdateAt = Date.now();
    }

    if (updates.status === 'Awaiting Resolution' && prevReport) {
      updates.lastCrewUpdate = 'Repair complete. Awaiting final quality assurance approval.';
      updates.lastCrewUpdateAt = Date.now();
    }

    if (updates.progress !== undefined && prevReport) {
      updates.lastCrewUpdateAt = Date.now();
      if (updates.progress === 100) {
        updates.status = 'Awaiting Resolution';
        updates.lastCrewUpdate = 'Repair operations reached 100%. Awaiting inspection.';
      } else {
        updates.lastCrewUpdate = `Repair progress updated to ${updates.progress}%.`;
      }
    }

    if (updates.etaMinutes !== undefined && prevReport) {
      const prevEstTime = prevReport.estimatedCompletionTime || (prevReport.startedAt ? prevReport.startedAt + (prevReport.etaMinutes || 0) * 60000 : 0);
      const newEstTime = Date.now() + updates.etaMinutes * 60000;
      updates.estimatedCompletionTime = newEstTime;
      
      if (prevEstTime > 0 && newEstTime > prevEstTime + 10000) {
        const diffMins = Math.round((newEstTime - prevEstTime) / 60000);
        addSystemLog('Maintenance Dispatch', `ETA for "${prevReport.title}" increased by ${diffMins} minutes. Reason: ${updates.delayReason || 'Crew update'}`, 'WARN');
        
        // Add notifications
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: 'Repair ETA Increased',
          message: `ETA for "${prevReport.title}" at ${prevReport.location} was increased. Reason: ${updates.delayReason || 'Unspecified'}`,
          timestamp: new Date().toISOString(),
          read: false,
          citizenId: 'citizen_demo'
        };
        db.notifications = db.notifications || [];
        db.notifications.unshift(newNotif);
        io.emit('notifications:updated', db.notifications);
      }
    }
    if (updates.status === 'Resolved' || updates.status === 'Completed') {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      updates.resolved = true;
      updates.resolvedAt = Date.now();
      updates.completedAt = Date.now();
      updates.actualCompletionDate = updates.actualCompletionDate || db.reports[index].actualCompletionDate || todayStr;
      updates.repairDate = updates.repairDate || db.reports[index].repairDate || todayStr;
      
      const start = updates.startedAt || db.reports[index].startedAt || (db.reports[index].timestamp ? new Date(db.reports[index].timestamp).getTime() : Date.now() - 42 * 60 * 1000);
      const durationMins = Math.max(1, Math.round((Date.now() - start) / 60000));
      updates.resolutionTime = `${durationMins} Minutes`;
      
      updates.afterImageUrl = updates.afterImageUrl || db.reports[index].afterImageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80';
      updates.repairNotes = updates.repairNotes || db.reports[index].repairNotes || 'Completed paving and smoothing of asphalt layer. Structural load validation complete.';
    }
    db.reports[index] = { ...db.reports[index], ...updates };

    const autoResult = triggerAutoDispatch(db.reports);
    db.reports = autoResult.updatedReports;
    if (autoResult.dispatches.length > 0) {
      autoResult.dispatches.forEach(d => {
        addSystemLog('System Dispatch', `Auto-assigned queued hazard to ${d.team}`, 'SUCCESS');
      });
    }
    
    // Sync with citizen complaint if needed
    if (req.params.id.toLowerCase().startsWith('rep-from-comp-')) {
      const complaintId = req.params.id.toLowerCase().replace('rep-from-', '');
      const cIndex = db.complaints.findIndex(c => c.id.toLowerCase() === complaintId);
      if (cIndex > -1) {
        let compStatus = db.complaints[cIndex].status;
        const status = req.body.status;
        if (status === 'Resolved') compStatus = 'Resolved';
        else if (status === 'Repairing') compStatus = 'Repair In Progress';
        else if (status === 'Assigned') compStatus = 'Assigned';
        else if (status === 'Verified') compStatus = 'Verified';
        
        db.complaints[cIndex] = {
          ...db.complaints[cIndex],
          status: compStatus,
          ...(req.body.citizenVerified !== undefined ? {
            citizenVerified: req.body.citizenVerified,
            citizenRating: req.body.citizenRating,
            citizenFeedback: req.body.citizenFeedback,
            satisfactionScore: req.body.satisfactionScore,
            resolutionQualityScore: req.body.resolutionQualityScore
          } : {})
        };
        io.emit('complaints:updated', db.complaints);
      }
    }

    writeDB(db);
    io.emit('reports:updated', db.reports);
    res.json(db.reports[index]);
  } else {
    res.status(404).json({ error: 'Report not found' });
  }
});

app.delete('/api/reports/:id', (req, res) => {
  const db = readDB();
  const filtered = db.reports.filter(r => r.id !== req.params.id);
  db.reports = filtered;
  writeDB(db);
  io.emit('reports:updated', db.reports);
  res.status(204).end();
});

app.post('/api/reports/clear-completed', (req, res) => {
  const db = readDB();
  const completedReports = db.reports.filter(r => r.resolved || r.status === 'Resolved' || r.status === 'Completed');
  const totalDuration = completedReports.reduce((sum, r) => {
    return sum + parseInt(r.resolutionTime || '42');
  }, 0);
  const activeReports = db.reports.filter(r => !(r.resolved || r.status === 'Resolved' || r.status === 'Completed'));
  db.reports = activeReports;
  writeDB(db);
  io.emit('reports:updated', db.reports);
  addSystemLog('Admin Panel', `Deleted ${completedReports.length} completed task history record(s).`, 'WARN');
  res.json({ deletedCount: completedReports.length });
});

app.put('/api/reports', (req, res) => {
  const db = readDB();
  db.reports = req.body;
  writeDB(db);
  io.emit('reports:updated', db.reports);
  res.json(db.reports);
});

// Complaints
app.get('/api/complaints', (req, res) => {
  const db = readDB();
  res.json(db.complaints);
});

app.post('/api/complaints', (req, res) => {
  const db = readDB();
  const complaint = req.body;
  const id = complaint.id || `comp-${Math.floor(100000 + Math.random() * 900000)}`;
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

  db.complaints.unshift(newComplaint);

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

  db.reports.unshift(newReport);

  // Add Notification
  const newNotif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: 'Complaint Submitted',
    message: `Your report "${newComplaint.title}" has been successfully submitted.`,
    timestamp,
    read: false,
    citizenId: 'citizen_demo'
  };
  db.notifications.unshift(newNotif);

  writeDB(db);
  io.emit('complaints:updated', db.complaints);
  io.emit('reports:updated', db.reports);
  io.emit('notifications:updated', db.notifications);

  addSystemLog('Citizen Portal', `New citizen complaint filed: ${newComplaint.title} at ${newComplaint.locationName}`, 'INFO');
  res.status(201).json(newComplaint);
});

app.put('/api/complaints/:id', (req, res) => {
  const db = readDB();
  const index = db.complaints.findIndex(c => c.id === req.params.id);
  if (index > -1) {
    const oldStatus = db.complaints[index].status;
    db.complaints[index] = { ...db.complaints[index], ...req.body };

    // Sync to report
    const reportId = `rep-from-${req.params.id}`;
    const rIndex = db.reports.findIndex(r => r.id.toLowerCase() === reportId.toLowerCase());
    if (rIndex > -1) {
      let reportStatus = db.reports[rIndex].status;
      const status = req.body.status;
      if (status === 'Resolved') reportStatus = 'Resolved';
      else if (status === 'Repairing' || status === 'Repair In Progress') reportStatus = 'Repairing';
      else if (status === 'Assigned') reportStatus = 'Assigned';
      else if (status === 'Verified') reportStatus = 'Verified';
      else if (status === 'Submitted') reportStatus = 'Detected';
      else if (status === 'Closed') reportStatus = 'Resolved';

      db.reports[rIndex] = {
        ...db.reports[rIndex],
        status: reportStatus,
        assignedTeam: req.body.assignedTeam || db.reports[rIndex].assignedTeam,
        resolved: status === 'Closed' || status === 'Resolved',
        ...(req.body.citizenVerified !== undefined ? {
          citizenVerified: req.body.citizenVerified,
          citizenRating: req.body.citizenRating,
          citizenFeedback: req.body.citizenFeedback,
          satisfactionScore: req.body.satisfactionScore,
          resolutionQualityScore: req.body.resolutionQualityScore,
          afterImageUrl: req.body.followUpImageUrl || db.reports[rIndex].afterImageUrl
        } : {})
      };
      io.emit('reports:updated', db.reports);
    }

    // Trigger notification if status changed
    const status = req.body.status;
    if (oldStatus !== status && status) {
      let notifTitle = '';
      let notifMessage = '';
      if (status === 'Verified') {
        notifTitle = 'Complaint Verified';
        notifMessage = `AI and municipal engineers have verified your complaint "${db.complaints[index].title}".`;
      } else if (status === 'Assigned') {
        notifTitle = 'Team Assigned';
        notifMessage = `Municipal team has been assigned to fix "${db.complaints[index].title}".`;
      } else if (status === 'Repair In Progress' || status === 'Repairing') {
        notifTitle = 'Repair Started';
        notifMessage = `Crew has arrived on-site. Repairs are now active for "${db.complaints[index].title}".`;
      } else if (status === 'Resolved') {
        notifTitle = 'Repair Completed';
        notifMessage = `Repairs have been completed for "${db.complaints[index].title}". Please verify the work.`;
      } else if (status === 'Closed') {
        notifTitle = 'Complaint Closed';
        notifMessage = `Resolution has been verified by citizen. The incident is now officially closed.`;
      }

      if (notifTitle) {
        db.notifications.unshift({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: notifTitle,
          message: notifMessage,
          timestamp: new Date().toISOString(),
          read: false,
          citizenId: 'citizen_demo'
        });
        io.emit('notifications:updated', db.notifications);
      }
    }

    writeDB(db);
    io.emit('complaints:updated', db.complaints);
    res.json(db.complaints[index]);
  } else {
    res.status(404).json({ error: 'Complaint not found' });
  }
});

app.post('/api/complaints/:id/upvote', (req, res) => {
  const db = readDB();
  const index = db.complaints.findIndex(c => c.id === req.params.id);
  if (index > -1) {
    db.complaints[index].votes = (db.complaints[index].votes || 0) + 1;
    writeDB(db);
    io.emit('complaints:updated', db.complaints);
    res.json(db.complaints[index]);
  } else {
    res.status(404).json({ error: 'Complaint not found' });
  }
});

app.put('/api/complaints', (req, res) => {
  const db = readDB();
  db.complaints = req.body;
  writeDB(db);
  io.emit('complaints:updated', db.complaints);
  res.json(db.complaints);
});

// Sensors
app.get('/api/sensors', (req, res) => {
  const db = readDB();
  res.json(db.sensors);
});

app.put('/api/sensors', (req, res) => {
  const db = readDB();
  db.sensors = req.body;
  writeDB(db);
  io.emit('sensors:updated', db.sensors);
  res.json(db.sensors);
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  res.json(db.notifications);
});

app.put('/api/notifications/:id', (req, res) => {
  const db = readDB();
  const index = db.notifications.findIndex(n => n.id === req.params.id);
  if (index > -1) {
    db.notifications[index] = { ...db.notifications[index], ...req.body };
    writeDB(db);
    io.emit('notifications:updated', db.notifications);
    res.json(db.notifications[index]);
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const db = readDB();
  db.notifications.forEach(n => n.read = true);
  writeDB(db);
  io.emit('notifications:updated', db.notifications);
  res.json(db.notifications);
});

// Logs
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json(db.logs);
});

app.post('/api/logs/clear', (req, res) => {
  const db = readDB();
  db.logs = [];
  writeDB(db);
  io.emit('logs:updated', db.logs);
  res.status(204).end();
});

// Settings
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  io.emit('settings:updated', db.settings);
  res.json(db.settings);
});

app.put('/api/settings/:id', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  io.emit('settings:updated', db.settings);
  addSystemLog('System Config', 'System configurations updated', 'INFO');
  res.json(db.settings);
});

// Simulation playbook endpoints
app.post('/api/simulation/trigger', (req, res) => {
  const db = readDB();
  const { step, currentReportId } = req.body;
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  let nextReportId = currentReportId;

  const DEMO_TEMPLATES = [
    {
      title: 'Severe Pothole [DEMO DATA]',
      location: 'Stamford Road Crossing',
      severity: 'Critical',
      icon: 'alert',
      description: 'Deep pothole forming in the middle lane, depth approx 12cm. High risk of tire damage. [DEMO DATA]',
      imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
      lat: 1.2975,
      lng: 103.8525,
      x: 45,
      y: 40,
      priorityScore: 94,
      estimatedRisk: 'High Accident Risk [DEMO DATA]',
      recommendedRepairTime: 'Within 24 Hours'
    },
    {
      title: 'Debris on Roadway [DEMO DATA]',
      location: 'Nicoll Highway Westbound',
      severity: 'Active',
      icon: 'hardhat',
      description: 'Large construction debris and metal framing blocks the curbside lane. [DEMO DATA]',
      imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80',
      lat: 1.3025,
      lng: 103.8685,
      x: 45,
      y: 40,
      priorityScore: 78,
      estimatedRisk: 'Moderate Damage Risk [DEMO DATA]',
      recommendedRepairTime: 'Within 3 Days'
    },
    {
      title: 'Broken Traffic Signal [DEMO DATA]',
      location: 'Bras Basah Road Junction',
      severity: 'Critical',
      icon: 'alert',
      description: 'Intersection traffic lights are completely dark. Traffic flow is congested and dangerous. [DEMO DATA]',
      imageUrl: 'https://images.unsplash.com/photo-1510935579761-125207a902f4?auto=format&fit=crop&w=400&q=80',
      lat: 1.2985,
      lng: 103.8510,
      x: 62,
      y: 68,
      priorityScore: 92,
      estimatedRisk: 'High Accident Risk [DEMO DATA]',
      recommendedRepairTime: 'Within 24 Hours'
    },
    {
      title: 'Flooded Street [DEMO DATA]',
      location: 'Dunearn Road Eastbound',
      severity: 'Critical',
      icon: 'droplets',
      description: 'Heavy water accumulation on the roadway, water depth exceeds 15cm. Vehicles turning back. [DEMO DATA]',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
      lat: 1.3280,
      lng: 103.8110,
      x: 45,
      y: 35,
      priorityScore: 95,
      estimatedRisk: 'High Accident Risk [DEMO DATA]',
      recommendedRepairTime: 'Within 24 Hours'
    },
    {
      title: 'Fallen Tree Blocking Lane [DEMO DATA]',
      location: 'Orchard Link Southbound',
      severity: 'Active',
      icon: 'hardhat',
      description: 'Large tree branch snapped and blocking the left lane. Cars forcing a detour. [DEMO DATA]',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80',
      lat: 1.3048,
      lng: 103.8318,
      x: 35,
      y: 50,
      priorityScore: 75,
      estimatedRisk: 'Moderate Damage Risk [DEMO DATA]',
      recommendedRepairTime: 'Within 3 Days'
    },
    {
      title: 'Damaged Road Sign [DEMO DATA]',
      location: 'Jalan Besar Section 2',
      severity: 'Pending',
      icon: 'alert',
      description: 'Speed limit sign has been bent to the ground, invisible to oncoming traffic. [DEMO DATA]',
      imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
      lat: 1.3050,
      lng: 103.8500,
      x: 50,
      y: 50,
      priorityScore: 48,
      estimatedRisk: 'Minor Road Decay [DEMO DATA]',
      recommendedRepairTime: 'Within 7 Days'
    }
  ];

  if (step === 0) {
    const t = DEMO_TEMPLATES[Math.floor(Math.random() * DEMO_TEMPLATES.length)];
    const compId = `comp-${Math.floor(100000 + Math.random() * 900000)}`;
    const newComp: CitizenComplaint = {
      id: compId,
      title: t.title,
      description: t.description,
      locationName: t.location,
      imageUrl: t.imageUrl,
      lat: t.lat,
      lng: t.lng,
      x: t.x,
      y: t.y,
      status: 'Submitted',
      timestamp: new Date().toISOString(),
      votes: 1,
      priority: t.severity === 'Critical' ? 'Critical' : t.severity === 'Active' ? 'High' : 'Medium'
    };
    db.complaints.unshift(newComp);

    const matchingReportId = `rep-from-${compId}`;
    const newRep: Report = {
      id: matchingReportId,
      title: t.title,
      location: t.location,
      severity: t.severity as any,
      icon: t.icon as any,
      source: 'Citizen Portal',
      timestamp: newComp.timestamp,
      x: t.x,
      y: t.y,
      lat: t.lat,
      lng: t.lng,
      imageUrl: t.imageUrl,
      description: t.description,
      status: 'Detected',
      priorityScore: 0,
      estimatedRisk: 'Unassessed',
      recommendedRepairTime: 'Pending scan',
      beforeImageUrl: t.imageUrl
    };
    db.reports.unshift(newRep);
    nextReportId = matchingReportId;

    // Add Notification
    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Complaint Submitted',
      message: `Your report "${t.title}" has been successfully submitted.`,
      timestamp: newComp.timestamp,
      read: false,
      citizenId: 'citizen_demo'
    });

    addSystemLog('Citizen Portal', `Demo Mode: ${t.title} registered as Submitted via Citizen Portal`, 'INFO');
  } else if (step === 1 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) db.reports[rIndex].status = 'Verified';
    addSystemLog('AI Mesh Model', `Demo Mode: YOLOv8 processed evidence successfully`, 'SUCCESS');
  } else if (step === 2 && currentReportId) {
    // Map heatmap layer toggling happens client-side, just log it here
    addSystemLog('GIS Engine', `Demo Mode: Coordinates pinned to live heatmap`, 'SUCCESS');
  } else if (step === 3 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) {
      const rep = db.reports[rIndex];
      const severity = rep.severity || 'Active';
      db.reports[rIndex].priorityScore = severity === 'Critical' ? 94 : severity === 'Active' ? 78 : 48;
      db.reports[rIndex].estimatedRisk = severity === 'Critical' ? 'High Accident Risk [DEMO DATA]' : 'Moderate Pavement Decay [DEMO DATA]';
      db.reports[rIndex].recommendedRepairTime = severity === 'Critical' ? 'Within 24 Hours' : 'Within 3 Days';
    }
    addSystemLog('AI Mesh Model', `Demo Mode: Priority Score calculated successfully`, 'SUCCESS');
  } else if (step === 4 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) {
      db.reports[rIndex].status = 'Assigned';
      db.reports[rIndex].assignedTeam = 'City Hall Rapid Unit (Rapid Response)';
      db.reports[rIndex].startDate = todayStr;
      db.reports[rIndex].estimatedCompletionDate = todayStr;
    }
    addSystemLog('Maintenance Dispatch', `Demo Mode: City Hall Rapid Unit assigned to Stamford Rd`, 'INFO');
  } else if (step === 5 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) db.reports[rIndex].status = 'Repairing';
    addSystemLog('System Workflow', `Demo Mode: Crew arrived on-site. Resurfacing active`, 'INFO');
  } else if (step === 6 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) {
      db.reports[rIndex].status = 'Resolved';
      db.reports[rIndex].resolved = true;
      db.reports[rIndex].resolvedAt = Date.now();
      db.reports[rIndex].actualCompletionDate = todayStr;
      db.reports[rIndex].repairDate = todayStr;
      db.reports[rIndex].afterImageUrl = 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80';
      db.reports[rIndex].repairNotes = 'Completed paving and smoothing of asphalt layer. Structural load validation complete.';
      
      const autoResult = triggerAutoDispatch(db.reports);
      db.reports = autoResult.updatedReports;
    }
    addSystemLog('Maintenance Dispatch', `Demo Mode: Stamford Rd repair completed successfully`, 'SUCCESS');
  } else if (step === 7 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) {
      db.reports[rIndex].citizenVerified = true;
      db.reports[rIndex].citizenRating = 5;
      db.reports[rIndex].citizenFeedback = 'Resolution verified. Excellent smoothing work.';
      db.reports[rIndex].satisfactionScore = 100;
      db.reports[rIndex].resolutionQualityScore = 97;
    }
    addSystemLog('Citizen Portal', `Demo Mode: Citizen verified Stamford Rd repair: 5 Stars`, 'SUCCESS');
  } else if (step === 8 && currentReportId) {
    addSystemLog('System Workflow', `Demo Mode: Recalculated impact dashboard counters`, 'SUCCESS');
  }

  writeDB(db);
  io.emit('reports:updated', db.reports);
  res.json({ nextReportId });
});

// Periodic simulator loop (wiggles telemetry variables every 12 seconds)
setInterval(() => {
  try {
    const db = readDB();
    let changed = false;

    db.sensors = db.sensors.map(s => {
      if (s.status === 'Offline') return s;
      changed = true;
      const vibrationDelta = (Math.random() - 0.5) * 4;
      const tempDelta = (Math.random() - 0.5) * 1.5;
      const batDelta = Math.random() > 0.8 ? -1 : 0;
      
      const newVibe = Math.max(1, Math.round(s.vibration + vibrationDelta));
      const status = newVibe > 40 ? 'Warning' as const : 'Online' as const;

      return {
        ...s,
        vibration: newVibe,
        temperature: parseFloat((s.temperature + tempDelta).toFixed(1)),
        battery: Math.max(1, s.battery + batDelta),
        status
      };
    });

    if (changed) {
      writeDB(db);
      io.emit('sensors:updated', db.sensors);
      
      // Occasionally log warning if a sensor has Warning status
      const warningSensors = db.sensors.filter(s => s.status === 'Warning');
      if (warningSensors.length > 0 && Math.random() > 0.6) {
        addSystemLog('IoT Sensor Core', `Sensor alarm triggered: high vibration amplitude on ${warningSensors[0].name} (${warningSensors[0].vibration}Hz)`, 'WARN');
      }
    }
  } catch (e) {
    console.error('Error in periodic telemetry wiggler', e);
  }
}, 12000);

// SLA Watchdog and Auto-Progress loop (runs every 5 seconds)
setInterval(() => {
  try {
    const db = readDB();
    let changed = false;
    
    db.reports.forEach(r => {
      if (r.status && ['In Progress', 'Delayed', 'Awaiting Resolution', 'Repairing'].includes(r.status) && r.startedAt && !r.resolved && r.status !== 'Completed' && r.status !== 'Resolved') {
        const elapsedMins = (Date.now() - r.startedAt) / 60000;
        const originalETA = r.etaMinutes || 25;
        
        if (originalETA > 0) {
          const autoProgress = (elapsedMins / originalETA) * 100;
          let calculatedProgress = r.progress || 0;
          let calculatedStatus = r.status;
          let delayMinutes = r.delayMinutes || 0;
          
          if (elapsedMins > originalETA) {
            calculatedStatus = 'Delayed';
            calculatedProgress = Math.min(autoProgress, 95);
            delayMinutes = Math.round(elapsedMins - originalETA);
          } else {
            calculatedProgress = Math.min(autoProgress, 100);
          }
          
          const newProgRounded = Math.round(calculatedProgress);
          if (r.progress !== newProgRounded || r.status !== calculatedStatus || r.delayMinutes !== delayMinutes) {
            r.progress = newProgRounded;
            r.status = calculatedStatus as any;
            r.delayMinutes = delayMinutes;
            (r as any).updatedAt = Date.now();
            changed = true;
          }
        }
        
        // SLA Breach logic
        if (r.slaMinutes && elapsedMins >= r.slaMinutes && !(r as any).slaBreached) {
          (r as any).slaBreached = true;
          changed = true;
          
          addSystemLog('System SLA Watchdog', `SLA Breach: Hazard "${r.title}" at ${r.location} exceeded target resolution time of ${r.slaMinutes} minutes.`, 'WARN');
          
          const newNotif = {
            id: `notif-${Date.now()}`,
            title: '⚠️ SLA Breach Detected',
            message: `Hazard "${r.title}" has breached its SLA of ${r.slaMinutes} minutes. Current status is ${r.status}.`,
            timestamp: new Date().toISOString(),
            read: false,
            citizenId: 'citizen_demo'
          };
          db.notifications = db.notifications || [];
          db.notifications.unshift(newNotif);
        }
      }
    });
    
    if (changed) {
      writeDB(db);
      io.emit('reports:updated', db.reports);
      io.emit('notifications:updated', db.notifications);
    }
  } catch (e) {
    console.error('Error in SLA Watchdog loop:', e);
  }
}, 5000);

// Initialize DB on startup
readDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
