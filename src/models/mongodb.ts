import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. HAZARD / REPORT SCHEMA
// ==========================================
export interface IReport extends Document {
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

const ReportSchema = new Schema<IReport>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  location: { type: String, required: true },
  severity: { type: String, required: true, enum: ['Critical', 'Active', 'Pending', 'Scheduled'] },
  icon: { type: String, required: true, enum: ['alert', 'lightbulb', 'hardhat', 'car', 'droplets'] },
  source: { type: String, required: true },
  timestamp: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  imageUrl: { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  description: { type: String, default: '' },
  acknowledged: { type: Boolean, default: false },
  status: { type: String, default: 'Detected' },
  priorityScore: { type: Number, default: 50 },
  startedAt: Number,
  queuedAt: Number,
  citizenReportsCount: { type: Number, default: 1 },
  estimatedRisk: String,
  recommendedRepairTime: String,
  assignedTeam: String,
  repairDate: String,
  beforeImageUrl: String,
  afterImageUrl: String,
  assignedAt: Number,
  completedAt: Number,
  startDate: String,
  estimatedCompletionDate: String,
  actualCompletionDate: String,
  resolutionTime: String,
  repairNotes: String,
  progress: Number,
  etaMinutes: Number,
  estimatedCompletionTime: Number,
  delayReason: String,
  lastCrewUpdate: String,
  lastCrewUpdateAt: Number,
  slaMinutes: Number,
  delayMinutes: Number,
  citizenVerified: Boolean,
  citizenRating: Number,
  citizenFeedback: String,
  satisfactionScore: Number,
  resolutionQualityScore: Number,
  resolvedAt: Number
}, { timestamps: true });

// ==========================================
// 2. CITIZEN COMPLAINT SCHEMA
// ==========================================
export interface ICitizenComplaint extends Document {
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

const CitizenComplaintSchema = new Schema<ICitizenComplaint>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  locationName: { type: String, required: true },
  location: String,
  imageUrl: { type: String, default: '' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  status: { type: String, default: 'Submitted' },
  timestamp: { type: String, required: true },
  createdAt: String,
  citizenId: String,
  votes: { type: Number, default: 0 },
  upvotes: Number,
  priority: String,
  priorityScore: Number,
  hazardType: String,
  assignedTeam: String,
  resolvedAt: String,
  notes: String,
  followUpImageUrl: String,
  citizenVerified: Boolean,
  citizenRating: Number,
  citizenFeedback: String,
  satisfactionScore: Number,
  resolutionQualityScore: Number,
  citizenRejected: Boolean
}, { timestamps: true });

// ==========================================
// 3. IOT SENSOR DEVICE SCHEMA
// ==========================================
export interface ISensorDevice extends Document {
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

const SensorDeviceSchema = new Schema<ISensorDevice>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  locationName: { type: String, required: true },
  vibration: { type: Number, default: 0 },
  temperature: { type: Number, default: 25 },
  battery: { type: Number, default: 100 },
  status: { type: String, enum: ['Online', 'Warning', 'Offline'], default: 'Online' },
  connectivity: { type: String, enum: ['WiFi', 'Cellular', 'LoRaWAN'], default: 'WiFi' },
  roadHealthScore: { type: Number, default: 100 },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { timestamps: true });

// ==========================================
// 4. TELEMETRY LOG SCHEMA
// ==========================================
export interface ITelemetryLog extends Document {
  id?: string;
  time: string;
  module: string;
  event: string;
  status: 'SUCCESS' | 'WARN' | 'INFO';
}

const TelemetryLogSchema = new Schema<ITelemetryLog>({
  time: { type: String, required: true },
  module: { type: String, required: true },
  event: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'WARN', 'INFO'], default: 'INFO' }
}, { timestamps: true });

// ==========================================
// 5. USER PROFILE & LOGIN LOG SCHEMAS
// ==========================================
export interface IUserProfile extends Document {
  uid: string;
  email: string;
  role: 'admin' | 'citizen';
  name: string;
  title: string;
  avatarUrl: string;
  lastLoginAt?: string;
}

const UserProfileSchema = new Schema<IUserProfile>({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'citizen'] },
  name: { type: String, required: true },
  title: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  lastLoginAt: String
}, { timestamps: true });

export interface ILoginLog extends Document {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'citizen';
  title?: string;
  loginMethod: string;
  timestamp: string;
  avatarUrl?: string;
  status: string;
  ipAddress?: string;
  deviceInfo?: string;
}

const LoginLogSchema = new Schema<ILoginLog>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  title: String,
  loginMethod: { type: String, default: 'email' },
  timestamp: { type: String, required: true },
  avatarUrl: String,
  status: { type: String, default: 'Success' },
  ipAddress: String,
  deviceInfo: String
}, { timestamps: true });

// ==========================================
// EXPORT MONGOOSE MODELS
// ==========================================
export const ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export const CitizenComplaintModel = mongoose.models.CitizenComplaint || mongoose.model<ICitizenComplaint>('CitizenComplaint', CitizenComplaintSchema);
export const SensorDeviceModel = mongoose.models.SensorDevice || mongoose.model<ISensorDevice>('SensorDevice', SensorDeviceSchema);
export const TelemetryLogModel = mongoose.models.TelemetryLog || mongoose.model<ITelemetryLog>('TelemetryLog', TelemetryLogSchema);
export const UserProfileModel = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
export const LoginLogModel = mongoose.models.LoginLog || mongoose.model<ILoginLog>('LoginLog', LoginLogSchema);
