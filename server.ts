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
  status?: 'Detected' | 'Verified' | 'Assigned' | 'Repairing' | 'Resolved';
  priorityScore?: number;
  estimatedRisk?: string;
  recommendedRepairTime?: string;
  assignedTeam?: string;
  repairDate?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  assignedAt?: number;
  startedAt?: number;
  completedAt?: number;
  startDate?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  resolutionTime?: string;
  repairNotes?: string;
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

const DEFAULT_REPORTS: Report[] = [
  {
    id: 'rep-1',
    title: 'Severe Pothole',
    location: 'Sector 4, Orchard Rd',
    severity: 'Critical',
    icon: 'alert',
    source: 'AI Detected',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
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
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
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

  const newReport: Report = {
    ...r,
    id: r.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: r.timestamp || new Date().toISOString(),
    status,
    priorityScore,
    estimatedRisk,
    recommendedRepairTime,
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
    db.reports[index] = { ...db.reports[index], ...req.body };
    
    // Sync with citizen complaint if needed
    if (req.params.id.startsWith('rep-from-comp-')) {
      const complaintId = req.params.id.replace('rep-from-', '');
      const cIndex = db.complaints.findIndex(c => c.id === complaintId);
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
  const completedReports = db.reports.filter(r => r.resolved || r.status === 'Resolved');
  if (completedReports.length === 0) {
    return res.json({ deletedCount: 0 });
  }
  const activeReports = db.reports.filter(r => !(r.resolved || r.status === 'Resolved'));
  db.reports = activeReports;
  writeDB(db);
  io.emit('reports:updated', db.reports);
  addSystemLog('Admin Panel', `Deleted ${completedReports.length} completed task history record(s).`, 'WARN');
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
    const rIndex = db.reports.findIndex(r => r.id === reportId);
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

  if (step === 0) {
    const newRep: Report = {
      id: `rep-${Date.now()}`,
      title: 'Critical Asphalt Sinkhole',
      location: 'Stamford Road Crossing',
      severity: 'Critical',
      icon: 'alert',
      source: 'Citizen Portal',
      timestamp: new Date().toISOString(),
      x: 45,
      y: 40,
      lat: 1.2975,
      lng: 103.8525,
      imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
      description: 'Large surface crack widening, depth 18cm. Poses collision risk.',
      status: 'Detected',
      priorityScore: 0,
      estimatedRisk: 'Unassessed',
      recommendedRepairTime: 'Pending scan'
    };
    db.reports.unshift(newRep);
    nextReportId = newRep.id;
    addSystemLog('System Workflow', `Demo Mode: Stamford Rd pothole photo registered as Detected`, 'INFO');
  } else if (step === 1 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) db.reports[rIndex].status = 'Verified';
    addSystemLog('AI Mesh Model', `Demo Mode: YOLOv8 processed Stamford Rd evidence successfully`, 'SUCCESS');
  } else if (step === 2 && currentReportId) {
    // Map heatmap layer toggling happens client-side, just log it here
    addSystemLog('GIS Engine', `Demo Mode: Coordinates pinned to live heatmap`, 'SUCCESS');
  } else if (step === 3 && currentReportId) {
    const rIndex = db.reports.findIndex(r => r.id === currentReportId);
    if (rIndex > -1) {
      db.reports[rIndex].priorityScore = 94;
      db.reports[rIndex].estimatedRisk = 'High Accident Risk';
      db.reports[rIndex].recommendedRepairTime = 'Within 24 Hours';
    }
    addSystemLog('AI Mesh Model', `Demo Mode: Priority Score calculated at 94/100`, 'SUCCESS');
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
      db.reports[rIndex].actualCompletionDate = todayStr;
      db.reports[rIndex].repairDate = todayStr;
      db.reports[rIndex].afterImageUrl = 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80';
      db.reports[rIndex].repairNotes = 'Completed paving and smoothing of asphalt layer. Structural load validation complete.';
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

// Initialize DB on startup
readDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
