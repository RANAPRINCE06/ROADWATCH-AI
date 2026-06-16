import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Navigation, 
  Globe, 
  ThumbsUp, 
  Clock, 
  ListChecks,
  Star,
  MessageSquare,
  Search,
  Bell,
  X,
  RotateCcw,
  ThumbsDown,
  Camera,
  Play,
  Plus
} from 'lucide-react';
import { 
  getComplaints, 
  addComplaint, 
  upvoteComplaint, 
  verifyComplaint, 
  updateComplaint,
  updateReportStatus,
  CitizenComplaint,
  Report,
  getReports,
  updateComplaintStatus
} from '../utils/storage';
import {
  getCollectionRef,
  getDocRef,
  subscribeToQuery,
  addDocument,
  setDocument,
  updateDocument,
  buildQuery,
  queryWhere,
  queryOrderBy,
  uploadFile
} from '../utils/firebase';

const LOCALIZATION = {
  en: {
    title: 'Citizen Road Safety Portal',
    subtitle: 'Report street damage, track resolving dispatches, and verify paving quality.',
    formHeader: 'Submit New Complaint',
    complaintTitle: 'Complaint Title',
    description: 'Detailed Description',
    location: 'Location Name',
    submit: 'File Official Report',
    stats: 'Resolution Performance',
    track: 'Complaint Tracker',
    votes: 'Upvotes',
    status: 'Status',
    upload: 'Upload Visual Evidence'
  },
  zh: {
    title: '市民路况监督门户',
    subtitle: '直接向市政工程部门报告街道损坏。',
    formHeader: '提交新投诉',
    complaintTitle: '投诉投诉',
    description: '详细说明',
    location: '位置名称',
    submit: '提交正式报告',
    stats: '修复解决率',
    track: '投诉处理进度',
    votes: '支持数',
    status: '状态',
    upload: '上传现场图像'
  },
  ms: {
    title: 'Portal Aduan Jalan Raya',
    subtitle: 'Laporkan kerosakan jalan terus kepada bahagian kejuruteraan perbandaran.',
    formHeader: 'Hantar Aduan Baru',
    complaintTitle: 'Tajuk Aduan',
    description: 'Butiran Terperinci',
    location: 'Nama Lokasi',
    submit: 'Failkan Laporan Rasmi',
    stats: 'Prestasi Penyelesaian',
    track: 'Penjejak Aduan',
    votes: 'Sokongan',
    status: 'Status',
    upload: 'Muat Naik Bukti Visual'
  },
  ta: {
    title: 'குடிமக்கள் சாலை கண்காணிப்பு போர்டல்',
    subtitle: 'தெரு சேதங்களை நேரடியாக நகராட்சி பொறியியல் பிரிவுகளுக்கு புகாரளிக்கவும்.',
    formHeader: 'புதிய புகாரை சமர்ப்பிக்கவும்',
    complaintTitle: 'புகார் தலைப்பு',
    description: 'விரிவான விளக்கம்',
    location: 'இருப்பிடப் பெயர்',
    submit: 'அதிகாரப்பூர்வ புகாரை பதிவு செய்',
    stats: 'தீர்வு செயல்திறன்',
    track: 'புகார் கண்காணிப்பு',
    votes: 'ஆதரவு வாக்குகள்',
    status: 'நிலை',
    upload: 'காட்சி ஆதாரத்தை பதிவேற்றவும்'
  }
};

// Automatic Priority Scoring Function
function calculatePriority(title: string, description: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('sinkhole') || text.includes('collapse') || text.includes('large pothole') || text.includes('major blockage') || text.includes('severe pothole') || text.includes('pounding')) {
    return 'Critical';
  }
  if (text.includes('crack') || text.includes('waterlogging') || text.includes('flooding') || text.includes('leakage') || text.includes('water leak') || text.includes('water leakage')) {
    return 'High';
  }
  if (text.includes('minor') || text.includes('fissure') || text.includes('uneven') || text.includes('pothole') || text.includes('damage')) {
    return 'Medium';
  }
  return 'Low';
}

// Automatic Hazard Type Determination Function
function determineHazardType(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('water') || text.includes('leak') || text.includes('flood') || text.includes('drain') || text.includes('water leakage')) return 'Waterlogging';
  if (text.includes('block') || text.includes('debris') || text.includes('rail') || text.includes('scaffolding')) return 'Road Blockage';
  if (text.includes('crack') || text.includes('fissure') || text.includes('decay')) return 'Road Crack';
  return 'Large Pothole';
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Submitted':
      return { text: 'Submitted', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔵' };
    case 'Verified':
      return { text: 'Verified', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🟡' };
    case 'Assigned':
      return { text: 'Assigned', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '🟠' };
    case 'Repairing':
    case 'Repair In Progress':
      return { text: 'Repairing', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🟣' };
    case 'Resolved':
      return { text: 'Resolved', color: 'bg-green-50 text-green-700 border-green-200', icon: '🟢' };
    case 'Closed':
      return { text: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '⚪' };
    default:
      return { text: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '⚪' };
  }
};

const getTimeSince = (dateStr: string) => {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};

export function MunicipalOperations() {
  const [lang, setLang] = useState<'en' | 'zh' | 'ms' | 'ta'>('en');
  const [complaints, setComplaints] = useState<CitizenComplaint[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [locName, setLocName] = useState('');
  
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected team for each report card during assignment overrides
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});

  // Crew Progress Update Modal States
  const [updatingReport, setUpdatingReport] = useState<Report | null>(null);
  const [updateProgressVal, setUpdateProgressVal] = useState<number>(0);
  const [updateEtaVal, setUpdateEtaVal] = useState<number>(0);
  const [updateStatusVal, setUpdateStatusVal] = useState<'In Progress' | 'Delayed' | 'Awaiting Resolution'>('In Progress');
  const [updateDelayReason, setUpdateDelayReason] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');

  const location = useLocation();

  // User role state
  const isAdmin = true;

  // Feedback/Verification fields
  const [citizenRating, setCitizenRating] = useState<number>(5);
  const [citizenFeedback, setCitizenFeedback] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(true);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Notifications states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Main file upload states
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Follow-up file upload states
  const [followUpFile, setFollowUpFile] = useState<File | null>(null);
  const [followUpProgress, setFollowUpProgress] = useState(0);
  const [followUpImageUrl, setFollowUpImageUrl] = useState('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [isFollowUpDragging, setIsFollowUpDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const followUpInputRef = useRef<HTMLInputElement>(null);

  // Listen to complaints in real-time
  useEffect(() => {
    const handleSync = () => {
      const data = getComplaints().sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());
      setComplaints(data);
      setSelectedCompId(prev => (!prev && data.length > 0) ? data[0].id : prev);
    };
    handleSync();
    window.addEventListener('roadwatch-complaints-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-complaints-updated', handleSync);
    };
  }, []);

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (updatingReport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [updatingReport]);

  // Listen to hazards (reports) in real-time
  useEffect(() => {
    const handleSync = () => {
      const data = getReports();
      setReports(data);
      setSelectedReportId(prev => (!prev && data.length > 0) ? data[0].id : prev);
    };
    handleSync();
    window.addEventListener('roadwatch-reports-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
    };
  }, []);

  // Listen to notifications in real-time
  useEffect(() => {
    const colRef = getCollectionRef('notifications');
    const q = buildQuery(colRef, queryOrderBy('timestamp', 'desc'));
    const unsubscribe = subscribeToQuery(q, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        updateDocument(getDocRef('notifications', n.id), { read: true });
      }
    });
  };

  // Main Image Upload Handler
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    
    // Type/Extension validation
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isValidType = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type) || 
                        ['png', 'jpg', 'jpeg'].includes(fileExt || '');
    if (!isValidType) {
      setUploadError("Unsupported format. Please upload PNG, JPG, or JPEG.");
      return;
    }
    
    // Size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds the 10MB limit.");
      return;
    }
    
    setUploadError(null);
    setUploadingFile(file);
    setUploadProgress(0);

    const path = `complaints/${Date.now()}_${file.name}`;
    uploadFile(path, file, (progress) => {
      setUploadProgress(progress);
    })
    .then((url) => {
      setUploadedImageUrl(url);
      setUploadingFile(null);
    })
    .catch((err) => {
      console.error(err);
      setUploadError("Failed to upload image. Please try again.");
      setUploadingFile(null);
    });
  };

  // Follow-Up Image Upload Handler
  const handleFollowUpFile = (file: File | undefined) => {
    if (!file) return;
    
    // Type/Extension validation
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isValidType = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type) || 
                        ['png', 'jpg', 'jpeg'].includes(fileExt || '');
    if (!isValidType) {
      setFollowUpError("Unsupported format. Please upload PNG, JPG, or JPEG.");
      return;
    }
    
    // Size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setFollowUpError("File size exceeds the 10MB limit.");
      return;
    }
    
    setFollowUpError(null);
    setFollowUpFile(file);
    setFollowUpProgress(0);

    const path = `followups/${Date.now()}_${file.name}`;
    uploadFile(path, file, (progress) => {
      setFollowUpProgress(progress);
    })
    .then((url) => {
      setFollowUpImageUrl(url);
      setFollowUpFile(null);
    })
    .catch((err) => {
      console.error(err);
      setFollowUpError("Failed to upload image. Please try again.");
      setFollowUpFile(null);
    });
  };

  const t = LOCALIZATION[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locName.trim()) return;

    if (!uploadedImageUrl) {
      setUploadError("Please upload an image of the road damage.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const priority = calculatePriority(title, desc);
      const hazardType = determineHazardType(title, desc);

      addComplaint({
        title,
        description: desc,
        locationName: locName,
        imageUrl: uploadedImageUrl,
        lat: 1.2900 + (Math.random() - 0.5) * 0.03,
        lng: 103.8500 + (Math.random() - 0.5) * 0.03,
        x: Math.floor(Math.random() * 50) + 25,
        y: Math.floor(Math.random() * 50) + 25,
        citizenId: 'citizen_demo',
        priority,
        hazardType
      } as any);
      
      setTitle('');
      setDesc('');
      setLocName('');
      setUploadedImageUrl('');
      setIsSubmitting(false);

      setSuccessMsg('Complaint registered successfully in the municipal ledger!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1200);
  };

  const handleVote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    upvoteComplaint(id);
  };

  const handleVerify = (id: string) => {
    const reportId = id.startsWith('comp-from-') ? id.replace('comp-from-', '') : `rep-from-${id}`;
    if (isConfirmed) {
      verifyComplaint(id, citizenRating, citizenFeedback || 'Verified by citizen. Excellent smoothing work.');
      updateComplaint(id, { status: 'Closed', citizenVerified: true });
      updateReportStatus(reportId, { resolved: true, status: 'Resolved' });
      if (followUpImageUrl) {
        updateComplaint(id, { followUpImageUrl });
        updateReportStatus(reportId, { afterImageUrl: followUpImageUrl });
      }
      addDocument(getCollectionRef('notifications'), {
        title: 'Repair Verified & Closed',
        message: `You verified and closed the complaint for "${selectedComplaint.title}".`,
        timestamp: new Date().toISOString(),
        read: false,
        citizenId: 'citizen_demo'
      });
      setSuccessMsg('Citizen verification submitted successfully! Paving certified & Closed.');
    } else {
      updateDocument(getDocRef('complaints', id), { 
        status: 'Repairing',
        citizenVerified: false,
        citizenRejected: true,
        citizenFeedback: citizenFeedback || 'Repair rejected by citizen. Pavement is still uneven.'
      });
      updateReportStatus(reportId, {
        status: 'Repairing',
        resolved: false,
        citizenVerified: false,
        citizenRejected: true,
        citizenFeedback: citizenFeedback || 'Repair rejected by citizen. Pavement is still uneven.'
      });
      addDocument(getCollectionRef('notifications'), {
        title: 'Repair Rejected',
        message: `You rejected the repair for "${selectedComplaint.title}". Status reverted to Repairing.`,
        timestamp: new Date().toISOString(),
        read: false,
        citizenId: 'citizen_demo'
      });
      setSuccessMsg('Complaint reopened. Re-dispatch request sent to maintenance teams.');
    }
    setCitizenFeedback('');
    setFollowUpImageUrl('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Admin Actions
  const handleUpdatePriority = (reportId: string, newPriority: 'Critical' | 'High' | 'Medium' | 'Low') => {
    const weights = { 'Critical': 95, 'High': 80, 'Medium': 55, 'Low': 30 };
    const score = weights[newPriority];
    const severity = newPriority === 'Critical' ? 'Critical' : newPriority === 'High' ? 'Active' : newPriority === 'Medium' ? 'Pending' : 'Scheduled';
    updateReportStatus(reportId, { severity, priorityScore: score });

    // Sync to complaint if applicable
    const complaintId = reportId.toLowerCase().startsWith('rep-from-') ? reportId.substring(9) : `comp-from-${reportId}`;
    updateComplaint(complaintId, { priority: newPriority, priorityScore: score });
    setSuccessMsg(`Incident priority updated to ${newPriority}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddNotes = (reportId: string, noteText: string) => {
    if (!noteText.trim()) return;
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const currentNotes = report.repairNotes || '';
    const newNotes = currentNotes ? `${currentNotes}\n[Admin Note]: ${noteText}` : `[Admin Note]: ${noteText}`;
    
    updateReportStatus(reportId, { repairNotes: newNotes });

    // Sync to complaint if applicable
    const complaintId = reportId.toLowerCase().startsWith('rep-from-') ? reportId.substring(9) : `comp-from-${reportId}`;
    updateComplaint(complaintId, { notes: newNotes });
    setSuccessMsg("Admin note appended successfully.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAdminStatusChange = (reportId: string, status: Report['status'], teamName?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const updates: Partial<Report> = { status };
    if (teamName) updates.assignedTeam = teamName;
    if (status === 'Resolved' || status === 'Completed') {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      updates.resolved = true;
      updates.actualCompletionDate = todayStr;
      updates.repairDate = todayStr;
    }

    updateReportStatus(reportId, updates);

    // Sync back to corresponding CitizenComplaint
    const complaintId = reportId.toLowerCase().startsWith('rep-from-') ? reportId.substring(9) : `comp-from-${reportId}`;
    let compStatus: CitizenComplaint['status'] = 'Submitted';
    if (status === 'Resolved' || status === 'Completed') compStatus = 'Resolved';
    else if (status === 'Repairing' || status === 'In Progress') compStatus = 'Repair In Progress';
    else if (status === 'Assigned') compStatus = 'Assigned';
    else if (status === 'Verified') compStatus = 'Verified';
    else if (status === 'Detected') compStatus = 'Submitted';
    else if ((status as any) === 'Closed') compStatus = 'Closed';

    const compUpdates: Partial<CitizenComplaint> = { status: compStatus };
    if (teamName) compUpdates.assignedTeam = teamName;
    updateComplaint(complaintId, compUpdates);

    // Generate notifications
    let notifTitle = '';
    let notifMessage = '';
    if (status === 'Verified') {
      notifTitle = 'Complaint Verified';
      notifMessage = `AI and municipal engineers have verified your complaint "${report.title}".`;
    } else if (status === 'Assigned') {
      notifTitle = 'Team Assigned';
      notifMessage = `Municipal team has been assigned to fix "${report.title}".`;
    } else if (status === 'Repairing' || status === 'In Progress') {
      notifTitle = 'Repair Started';
      notifMessage = `Crew has arrived on-site. Repairs are now active for "${report.title}".`;
    } else if (status === 'Resolved' || status === 'Completed') {
      notifTitle = 'Repair Completed';
      notifMessage = `Repairs have been completed for "${report.title}". Please verify the work.`;
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

    setSuccessMsg(`Incident updated successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];
  const selectedComplaint = complaints.find(c => c.id === selectedCompId || (selectedReport && selectedReport.id.startsWith('rep-from-comp-') && c.id === selectedReport.id.replace('rep-from-', ''))) || complaints[0];

  const getTeamDispatchesCount = (reportsList: Report[], teamName: string) => {
    return reportsList.filter(r => 
      r.assignedTeam === teamName && 
      !r.resolved && 
      r.status !== 'Resolved' && 
      r.status !== 'Completed' && 
      (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Repairing' || r.status === 'Delayed' || r.status === 'Awaiting Resolution')
    ).length;
  };

  const getAiRecommendation = (reportsList: Report[]) => {
    const teams = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta'];
    const activeDispatches = {
      'Team Alpha': getTeamDispatchesCount(reportsList, 'Team Alpha'),
      'Team Bravo': getTeamDispatchesCount(reportsList, 'Team Bravo'),
      'Team Charlie': getTeamDispatchesCount(reportsList, 'Team Charlie'),
      'Team Delta': getTeamDispatchesCount(reportsList, 'Team Delta'),
    };
    const sortedTeams = [...teams].sort(
      (a, b) => activeDispatches[a as keyof typeof activeDispatches] - activeDispatches[b as keyof typeof activeDispatches]
    );
    return sortedTeams[0];
  };

  // Resolution stats
  const totalFiled = reports.length;
  const verifiedCount = reports.filter(r => r.status !== 'Detected').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved' || r.status === 'Completed' || r.resolved).length;
  const activeCount = reports.filter(r => r.status !== 'Resolved' && r.status !== 'Completed' && !r.resolved).length;

  let avgTime = '35m';
  const resolvedList = reports.filter(r => r.status === 'Resolved' || r.status === 'Completed' || r.resolved);
  if (resolvedList.length > 0) {
    let totalMs = 0;
    let count = 0;
    resolvedList.forEach(r => {
      if (r.timestamp) {
        const start = new Date(r.timestamp).getTime();
        const end = r.resolvedAt ? new Date(r.resolvedAt).getTime() : (start + 42 * 60 * 1000);
        totalMs += (end - start);
        count++;
      }
    });
    if (count > 0) {
      const avgMins = Math.round(totalMs / (1000 * 60 * count));
      avgTime = avgMins > 60 ? `${Math.round(avgMins / 60)}h` : `${avgMins}m`;
    }
  }

  const getWorkflowStepClass = (currentStatus: string, step: string) => {
    const order = ['Submitted', 'Verified', 'Assigned', 'Repairing', 'Resolved', 'Closed'];
    let normStatus = 'Submitted';
    if (currentStatus === 'Verified') normStatus = 'Verified';
    else if (currentStatus === 'Assigned') normStatus = 'Assigned';
    else if (['Repairing', 'Repair In Progress', 'In Progress', 'Delayed', 'Awaiting Resolution'].includes(currentStatus)) normStatus = 'Repairing';
    else if (currentStatus === 'Resolved' || currentStatus === 'Completed') normStatus = 'Resolved';
    else if (currentStatus === 'Closed') normStatus = 'Closed';

    const currentIndex = order.indexOf(normStatus);
    const stepIndex = order.indexOf(step);

    if (currentIndex >= stepIndex) {
      if (currentStatus === 'Closed') return 'bg-slate-700 border-slate-800 text-white';
      if (currentStatus === 'Resolved' || currentStatus === 'Completed') return 'bg-green-600 border-green-500 text-white';
      if (step === 'Repairing') return 'bg-purple-600 border-purple-500 text-white';
      return 'bg-primary border-primary text-white';
    }
    return 'bg-slate-100 border-slate-200 text-slate-400';
  };

  // Search & Filters logic for citizen complaints (remains for compatibility)
  const filteredComplaints = complaints.filter(comp => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesTitle = comp.title?.toLowerCase().includes(q);
      const matchesLoc = comp.locationName?.toLowerCase().includes(q) || comp.location?.toLowerCase().includes(q);
      const matchesId = comp.id?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesLoc && !matchesId) return false;
    }
    if (statusFilter !== 'All') {
      if (statusFilter === 'Repairing' && (comp.status === 'Repairing' || comp.status === 'Repair In Progress')) return true;
      if (comp.status !== statusFilter) return false;
    }
    return true;
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const weights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return (weights[b.priority || 'Medium'] || 0) - (weights[a.priority || 'Medium'] || 0);
    }
    return 0;
  });

  // Search & Filters logic for reports (hazards)
  const filteredReports = reports.filter(r => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesTitle = r.title?.toLowerCase().includes(q);
      const matchesLoc = r.location?.toLowerCase().includes(q);
      const matchesId = r.id?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesLoc && !matchesId) return false;
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Repairing' && (r.status === 'Repairing' || r.status === 'In Progress' || r.status === 'Repair In Progress')) return true;
      if (r.status !== statusFilter) return false;
    }

    return true;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    if (sortBy === 'priority') {
      const weights = { 'Critical': 4, 'Active': 3, 'Pending': 2, 'Scheduled': 1 };
      const weightA = weights[a.severity || 'Pending'] || 0;
      const weightB = weights[b.severity || 'Pending'] || 0;
      return weightB - weightA;
    }
    return 0;
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      {/* Header Banner with Language Select, Role Select & Notifications */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border-subtle/50 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">
            {isAdmin ? "Municipal Operations Manager" : t.title}
          </h2>
          <p className="text-text-secondary mt-1">
            {isAdmin ? "Central dispatch board. Verify, assign, and resolve active road incidents." : t.subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown) markAllAsRead();
              }}
              className="relative bg-white hover:bg-slate-50 p-2.5 rounded-lg border border-border-subtle shadow-sm cursor-pointer transition-colors flex items-center justify-center h-10 w-10"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border-subtle z-50 p-4 animate-fade-in-up">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2 mb-2.5">
                  <h4 className="text-xs font-black text-primary tracking-wide uppercase flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-600" /> Notifications ({notifications.length})
                  </h4>
                  <button onClick={() => setShowNotifDropdown(false)} className="text-[10px] text-text-secondary hover:text-primary font-bold">✕</button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="text-[10px] text-text-secondary text-center py-6 font-semibold">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg border flex gap-2.5 items-start ${
                          n.read ? 'bg-slate-50/50 border-slate-100' : 'bg-purple-50/20 border-purple-100/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[8px] font-black ${
                          n.read ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-purple-100 text-purple-600 border border-purple-200'
                        }`}>
                          ✓
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-primary leading-tight">{n.title}</p>
                          <p className="text-[9px] text-text-secondary mt-0.5 leading-normal">{n.message}</p>
                          <p className="text-[7.5px] text-text-secondary/60 mt-1 italic">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border-subtle shadow-sm h-10">
            <Globe className="w-4 h-4 text-text-secondary" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="text-xs text-primary font-bold outline-none border-none bg-transparent cursor-pointer"
            >
              <option value="en">English</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="ms">Bahasa Melayu</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-2 animate-fade-in-up animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Citizen form OR Admin active incident tracker cards */}
        <section className="lg:col-span-6 bg-white rounded-xl border border-border-subtle shadow-sm p-6">
          {!isAdmin ? (
            <>
              {/* CITIZEN SUBMISSION FORM */}
              <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-6">
                <ListChecks className="w-4.5 h-4.5" /> {t.formHeader}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">{t.complaintTitle}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Large sinkhole forming"
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-xs text-primary focus:ring-1 focus:ring-primary outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">{t.description}</label>
                  <textarea
                    required
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe details: width, depth, immediate danger..."
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-xs text-primary focus:ring-1 focus:ring-primary outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">{t.location}</label>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="E.g. Orchard Road near exit B"
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-xs text-primary focus:ring-1 focus:ring-primary outline-none font-semibold"
                  />
                </div>

                {/* Interactive Drag & Drop / Click Image Upload */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-primary bg-slate-100/50' : 'border-border-subtle bg-slate-50 hover:bg-slate-100/50'
                  }`}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />

                  {uploadedImageUrl ? (
                    <div className="relative group w-full flex flex-col items-center justify-center">
                      <img 
                        src={uploadedImageUrl} 
                        alt="Pothole preview" 
                        className="max-h-36 rounded-lg object-cover border border-border-subtle shadow-md"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUploadedImageUrl(''); }}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-text-secondary mt-2 font-semibold">Image verified and compressed</span>
                    </div>
                  ) : uploadingFile ? (
                    <div className="w-full flex flex-col items-center py-2">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-2"></div>
                      <span className="text-xs font-bold text-primary">Uploading Visual Evidence... {Math.round(uploadProgress)}%</span>
                      <div className="w-48 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-text-secondary mb-2" />
                      <span className="text-xs font-bold text-primary">{t.upload}</span>
                      <span className="text-[10px] text-text-secondary mt-1">PNG, JPG or JPEG up to 10MB</span>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !!uploadingFile}
                  className="w-full bg-primary hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm font-semibold"
                >
                  <Navigation className="w-3.5 h-3.5 rotate-45" /> {isSubmitting ? 'Filing Report...' : t.submit}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* ADMIN MODE: ACTIVE INCIDENT TRACKER MODULE */}
              <h3 className="font-bold text-sm text-primary flex items-center justify-between border-b border-border-subtle/50 pb-3 mb-6">
                <span className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-primary" /> Operations Center - Active Incidents
                </span>
                <span className="bg-red-50 text-red-600 border border-red-200 text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {reports.filter(r => r.status !== 'Resolved' && r.status !== 'Completed' && !r.resolved).length} Active
                </span>
              </h3>

              {/* Active Incident Tracker Cards */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {sortedReports.length === 0 ? (
                  <div className="text-[10px] text-text-secondary text-center py-12 font-semibold bg-slate-50 rounded-lg border border-dashed border-border-subtle">
                    No active dispatches on grid.
                  </div>
                ) : (
                  sortedReports.map(report => {
                    const badge = getStatusBadge(report.status || 'Detected');
                    const isSelected = selectedReportId === report.id;
                    const aiRec = getAiRecommendation(reports);

                    return (
                      <div 
                        key={report.id} 
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected ? 'bg-slate-50 border-primary shadow-md scale-[1.01]' : 'bg-white border-border-subtle hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest block">{report.id}</span>
                            <h4 className="font-bold text-xs text-primary mt-0.5 leading-snug truncate">{report.title}</h4>
                            <span className="text-[9px] text-text-secondary block mt-0.5 truncate">📍 {report.location}</span>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border shrink-0 ${badge.color}`}>
                            {badge.icon} {badge.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-b border-border-subtle/50 py-2.5 my-2.5 text-[9px] font-semibold text-text-secondary">
                          <div>
                            <span className="text-[8px] block font-medium opacity-70">Severity & Score:</span>
                            <span className="text-primary font-bold">
                              {report.severity || 'Pending'} ({report.priorityScore || 50}/100)
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] block font-medium opacity-70">Assigned Team:</span>
                            <span className="text-primary font-bold">{report.assignedTeam || 'None Assigned'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] block font-medium opacity-70">Time Since Reported:</span>
                            <span className="text-primary font-bold">{getTimeSince(report.timestamp)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] block font-medium opacity-70">Est. Completion:</span>
                            <span className="text-primary font-bold">
                              {new Date(new Date(report.timestamp).getTime() + (report.severity === 'Critical' ? 1 : report.severity === 'Active' ? 3 : 7) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex gap-1.5 flex-wrap items-center mt-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportId(report.id);
                              if (report.id.startsWith('rep-from-comp-')) {
                                setSelectedCompId(report.id.replace('rep-from-', ''));
                              } else {
                                setSelectedCompId('');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-primary rounded text-[9px] font-bold cursor-pointer transition-colors"
                          >
                            View Details
                          </button>

                          {(report.status === 'Detected' || report.status === 'Submitted') && (
                            <button
                              type="button"
                              onClick={() => handleAdminStatusChange(report.id, 'Verified')}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded text-[9px] font-bold cursor-pointer transition-colors ml-auto shadow-sm"
                            >
                              Verify Incident
                            </button>
                          )}

                          {report.status === 'Verified' && (
                            <button
                              type="button"
                              onClick={() => handleAdminStatusChange(report.id, 'Assigned', aiRec)}
                              className="px-2.5 py-1.5 bg-safety-yellow text-primary hover:opacity-90 rounded text-[9px] font-black cursor-pointer transition-colors ml-auto shadow-sm"
                            >
                              Assign Team
                            </button>
                          )}

                          {report.status === 'Assigned' && (
                            <button
                              type="button"
                              onClick={() => handleAdminStatusChange(report.id, 'Repairing')}
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[9px] font-bold cursor-pointer transition-colors ml-auto shadow-sm"
                            >
                              Start Repair
                            </button>
                          )}

                          {['Repairing', 'Repair In Progress', 'In Progress', 'Delayed', 'Awaiting Resolution'].includes(report.status || '') && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setUpdatingReport(report);
                                  setUpdateProgressVal(report.progress || 0);
                                  setUpdateEtaVal(report.etaMinutes || 0);
                                  setUpdateStatusVal((report.status === 'Repairing' || report.status === 'Repair In Progress') ? 'In Progress' : (report.status === 'Delayed' ? 'Delayed' : 'Awaiting Resolution') as any);
                                  setUpdateDelayReason(report.delayReason || '');
                                  setUpdateNotes(report.repairNotes || '');
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded text-[9px] font-bold cursor-pointer transition-colors ml-auto shadow-sm"
                              >
                                Update Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminStatusChange(report.id, 'Resolved')}
                                className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-[9px] font-bold cursor-pointer transition-colors shadow-sm"
                              >
                                Resolve
                              </button>
                            </>
                          )}

                          {(report.status === 'Resolved' || report.status === 'Completed') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAdminStatusChange(report.id, 'Repairing')}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[9px] font-bold cursor-pointer transition-colors ml-auto border border-red-200 shadow-sm"
                              >
                                Reopen
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminStatusChange(comp.id, 'Closed')}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded text-[9px] font-bold cursor-pointer transition-colors border border-slate-900 shadow-sm"
                              >
                                Close
                              </button>
                            </>
>>>>>>> 449bb5636fa3da31d0d5d17aa5d8c388a7d5cc2d
                          )}
                        </div>

                        {/* Interactive Assign Team Selection Panel */}
                        {(report.status === 'Verified' || report.status === 'Queued') && (
                          <div className="flex flex-col gap-1.5 w-full mt-2.5 pt-2.5 border-t border-slate-100/50">
                            <div className="flex justify-between items-center text-[8.5px] text-text-secondary">
                              <span>Workload Dist. (AI Rec: <strong className="text-purple-600">{aiRec}</strong>)</span>
                              <span>Capacity Limit: 2 Tasks</span>
                            </div>
                            <div className="flex gap-1.5 items-center">
                              <select
                                value={selectedTeams[report.id] || ''}
                                onChange={(e) => setSelectedTeams(prev => ({ ...prev, [report.id]: e.target.value }))}
                                className="bg-slate-50 border border-slate-200/60 rounded px-1.5 py-1 text-[8.5px] font-bold text-text-secondary outline-none min-w-0 flex-1 cursor-pointer"
                              >
                                <option value="">AI Rec ({aiRec})</option>
                                <option value="Team Alpha">Team Alpha (Active: {getTeamDispatchesCount(reports, 'Team Alpha')}/2)</option>
                                <option value="Team Bravo">Team Bravo (Active: {getTeamDispatchesCount(reports, 'Team Bravo')}/2)</option>
                                <option value="Team Charlie">Team Charlie (Active: {getTeamDispatchesCount(reports, 'Team Charlie')}/2)</option>
                                <option value="Team Delta">Team Delta (Active: {getTeamDispatchesCount(reports, 'Team Delta')}/2)</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAdminStatusChange(report.id, 'Assigned', selectedTeams[report.id] || aiRec)}
                                className="px-2.5 py-1 bg-slate-900 text-white hover:bg-black font-bold rounded text-[8.5px] cursor-pointer transition-all shadow-sm"
                              >
                                Dispatch
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>

        {/* Right Side: Resolution Stats & Workflow Tracker */}
        <section className="lg:col-span-6 space-y-8">
          {/* Resolution Stats */}
          <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">{t.stats}</h3>
            
            <div className="grid grid-cols-5 gap-2 text-center divide-x divide-border-subtle/50">
              <div className="px-1">
                <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Total Filed</span>
                <span className="text-lg font-black text-primary mt-1 block">{totalFiled}</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Verified</span>
                <span className="text-lg font-black text-amber-600 mt-1 block">{verifiedCount}</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Resolved</span>
                <span className="text-lg font-black text-green-600 mt-1 block">{resolvedCount}</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Active</span>
                <span className="text-lg font-black text-red-500 mt-1 block">{activeCount}</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Avg Resolve</span>
                <span className="text-lg font-black text-purple-600 mt-1 block">{avgTime}</span>
              </div>
            </div>
          </div>

          {/* Workflow progress timeline */}
          {selectedReport && (
            <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-sm space-y-5 animate-fade-in-up">
              <div className="border-b border-border-subtle/50 pb-3 flex justify-between items-start gap-4">
                <div>
                  <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Incident Detailed Tracking</span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[9px] font-bold text-text-secondary bg-slate-100 px-1.5 py-0.5 rounded border">{selectedReport.id}</span>
                    <h4 className="font-bold text-sm text-primary leading-snug">{selectedReport.title}</h4>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                      selectedReport.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      selectedReport.severity === 'Active' ? 'bg-orange-100 text-orange-700' :
                      selectedReport.severity === 'Pending' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedReport.severity || 'Pending'}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">📍 {selectedReport.location}</p>
                </div>
                {selectedReport.imageUrl && (
                  <img 
                    src={selectedReport.imageUrl} 
                    alt="Complaint thumbnail" 
                    className="w-12 h-12 rounded object-cover border border-border-subtle"
                  />
                )}
              </div>

              {/* Progress Stepper Timeline - 6 Stages */}
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedReport.status || 'Detected', 'Submitted')}`}>
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 1: Submitted</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">Complaint received by municipal central database.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedReport.status || 'Detected', 'Verified')}`}>
                    {['Verified', 'Assigned', 'Repairing', 'Repair In Progress', 'In Progress', 'Delayed', 'Awaiting Resolution', 'Resolved', 'Completed', 'Closed'].includes(selectedReport.status || '') ? '✓' : '2'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 2: Verified</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">AI Computer Vision matches citizen upload logs.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedReport.status || 'Detected', 'Assigned')}`}>
                    {['Assigned', 'Repairing', 'Repair In Progress', 'In Progress', 'Delayed', 'Awaiting Resolution', 'Resolved', 'Completed', 'Closed'].includes(selectedReport.status || '') ? '✓' : '3'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 3: Assigned</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">Assigned to Sector Maintenance Crew: <span className="text-blue-600 font-bold">{selectedReport.assignedTeam || 'None Assigned'}</span></p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedReport.status || 'Detected', 'Repairing')}`}>
                    {['Repairing', 'Repair In Progress', 'In Progress', 'Delayed', 'Awaiting Resolution', 'Resolved', 'Completed', 'Closed'].includes(selectedReport.status || '') ? '✓' : '4'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 4: Repair In Progress</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">
                      Crew deployed on field. Paving works active. 
                      {selectedReport.progress !== undefined && ` Progress: ${selectedReport.progress}%`}
                      {selectedReport.etaMinutes !== undefined && ` (ETA: ${selectedReport.etaMinutes}m)`}
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedReport.status || 'Detected', 'Resolved')}`}>
                    {['Resolved', 'Completed', 'Closed'].includes(selectedReport.status || '') ? '✓' : '5'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 5: Resolved</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-semibold font-semibold">Safety clearance verified. Post-patch telemetry complete.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedReport.status || 'Detected', 'Closed')}`}>
                    {selectedReport.status === 'Closed' ? '✓' : '6'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 6: Closed</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5 font-semibold font-semibold">Resolution verified by citizen. Case officially closed.</p>
                  </div>
                </div>
              </div>

              {/* CITIZEN VERIFICATION SYSTEM PANEL */}
              {selectedComplaint && selectedComplaint.status === 'Resolved' && !isAdmin && (
                <div className="mt-6 pt-6 border-t border-border-subtle/80 space-y-4 animate-fade-in-up">
                  <h4 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-purple-600" /> Citizen Verification System
                  </h4>

                  {selectedComplaint.citizenVerified ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-700">✓ Resolution Verified by Citizen</span>
                        <span className="flex text-amber-500 font-bold">
                          {Array(selectedComplaint.citizenRating || 5).fill('★').join('')}
                        </span>
                      </div>
                      <p className="text-green-600 font-medium italic">"{selectedComplaint.citizenFeedback}"</p>
                      {selectedComplaint.followUpImageUrl && (
                        <div className="mt-2">
                          <span className="text-[9px] text-text-secondary block mb-1 font-semibold">Citizen Follow-Up Photo:</span>
                          <img 
                            src={selectedComplaint.followUpImageUrl} 
                            alt="Follow up preview" 
                            className="max-h-24 rounded border border-green-200"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-border-subtle">
                      <p className="text-[10px] text-text-secondary leading-normal">
                        This road hazard has been repaired. Verify visual quality, rate paving smoothness, and confirm resolution.
                      </p>

                      {/* Confirm vs Reject repair option */}
                      <div className="flex gap-4 items-center border-b border-border-subtle pb-2.5">
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Decision:</span>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-primary cursor-pointer">
                          <input 
                            type="radio" 
                            checked={isConfirmed}
                            onChange={() => setIsConfirmed(true)} 
                            className="accent-purple-600"
                          />
                          <span>Confirm Repair</span>
                        </label>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-red-600 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={!isConfirmed}
                            onChange={() => setIsConfirmed(false)}
                            className="accent-red-600"
                          />
                          <span>Reject Repair</span>
                        </label>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className="text-[9px] font-bold text-text-secondary uppercase">Rate Repair Quality:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              type="button"
                              key={star} 
                              onClick={() => setCitizenRating(star)} 
                              className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star className={`w-4.5 h-4.5 ${star <= citizenRating ? 'fill-amber-500' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold text-text-secondary uppercase mb-1">Feedback Comments</label>
                        <textarea 
                          value={citizenFeedback}
                          onChange={(e) => setCitizenFeedback(e.target.value)}
                          placeholder={isConfirmed ? "E.g. Asphalt is smooth, safety divider returned..." : "E.g. Road surface is still bumpy, potholes remain..."} 
                          className="w-full text-xs p-2 bg-white border border-border-subtle rounded-lg outline-none font-semibold"
                          rows={2}
                        />
                      </div>

                      {/* Interactive Follow-Up Image Upload */}
                      <div 
                        onClick={() => followUpInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsFollowUpDragging(true); }}
                        onDragLeave={() => setIsFollowUpDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsFollowUpDragging(false); handleFollowUpFile(e.dataTransfer.files?.[0]); }}
                        className={`border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-colors ${
                          isFollowUpDragging ? 'border-purple-600 bg-purple-50/20' : 'border-border-subtle bg-white/80 hover:bg-white'
                        }`}
                      >
                        <input 
                          type="file"
                          ref={followUpInputRef}
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => handleFollowUpFile(e.target.files?.[0])}
                          style={{ display: 'none' }}
                        />

                        {followUpImageUrl ? (
                          <div className="relative group w-full flex items-center justify-center gap-2">
                            <img 
                              src={followUpImageUrl} 
                              alt="Follow up preview" 
                              className="w-12 h-12 rounded object-cover"
                            />
                            <span className="text-[9px] font-bold text-purple-600">Image Uploaded Successfully!</span>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFollowUpImageUrl(''); }}
                              className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer ml-auto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : followUpFile ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-purple-600">Uploading Follow-Up Photo... {Math.round(followUpProgress)}%</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-text-secondary">Upload Follow-Up Inspection Image</span>
                        )}
                      </div>

                      {followUpError && (
                        <div className="text-[8px] text-red-600 font-semibold">{followUpError}</div>
                      )}

                      <button 
                        type="button"
                        onClick={() => handleVerify(selectedComplaint.id)}
                        className={`w-full text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isConfirmed ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {isConfirmed ? 'Verify Repair & Submit Rating' : 'Reject Repair & Re-open Complaint'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Additional Controls Panel */}
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-border-subtle/80 space-y-4 animate-fade-in-up">
                  <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Admin Dispatch Controls</h5>
                  
                  {/* Reassign Team option for active repairs */}
                  {['Assigned', 'Repairing', 'In Progress', 'Delayed', 'Awaiting Resolution'].includes(selectedReport.status || '') && (
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-border-subtle">
                      <span className="text-[9px] font-bold text-text-secondary uppercase">Reassign Team:</span>
                      <select
                        value={selectedReport.assignedTeam || ''}
                        onChange={(e) => {
                          const newTeam = e.target.value;
                          if (newTeam) {
                            handleAdminStatusChange(selectedReport.id, selectedReport.status || 'Assigned', newTeam);
                          }
                        }}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-text-secondary outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="" disabled>Select Team</option>
                        <option value="Team Alpha">Team Alpha (Active: {getTeamDispatchesCount(reports, 'Team Alpha')}/2)</option>
                        <option value="Team Bravo">Team Bravo (Active: {getTeamDispatchesCount(reports, 'Team Bravo')}/2)</option>
                        <option value="Team Charlie">Team Charlie (Active: {getTeamDispatchesCount(reports, 'Team Charlie')}/2)</option>
                        <option value="Team Delta">Team Delta (Active: {getTeamDispatchesCount(reports, 'Team Delta')}/2)</option>
                      </select>
                    </div>
                  )}

                  {/* Update Priority */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-border-subtle">
                    <span className="text-[9px] font-bold text-text-secondary uppercase">Update Priority:</span>
                    <div className="flex gap-1.5">
                      {(['Low', 'Medium', 'High', 'Critical'] as const).map(prio => {
                        const isCurrent = (prio === 'Low' && selectedReport.severity === 'Scheduled') ||
                                          (prio === 'Medium' && selectedReport.severity === 'Pending') ||
                                          (prio === 'High' && selectedReport.severity === 'Active') ||
                                          (prio === 'Critical' && selectedReport.severity === 'Critical');
                        return (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => handleUpdatePriority(selectedReport.id, prio)}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-primary text-white'
                                : 'bg-white hover:bg-slate-100 text-text-secondary border border-border-subtle'
                            }`}
                          >
                            {prio}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes input */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-bold text-text-secondary uppercase mb-1">Add Operational/Dispatch Notes</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="admin-note-input"
                        placeholder="E.g. Dispatched Team Gamma for paving works..." 
                        className="flex-1 text-[10px] px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg outline-none font-semibold"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const val = (document.getElementById('admin-note-input') as HTMLInputElement)?.value;
                          if (val) {
                            handleAddNotes(selectedReport.id, val);
                            (document.getElementById('admin-note-input') as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-primary hover:bg-neutral-800 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] transition-colors cursor-pointer"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Historical logs for this incident */}
                  {selectedReport.repairNotes && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-border-subtle text-[9px] space-y-1">
                      <span className="font-bold text-text-secondary uppercase">Incident Log History:</span>
                      <pre className="whitespace-pre-wrap font-sans font-semibold text-primary">{selectedReport.repairNotes}</pre>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* User complaints history list (Submissions Feed) */}
          <div className="space-y-3 mt-8 pt-6 border-t border-border-subtle/50">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Recent Citizen Submissions</h3>
            
            {/* Search, Filter & Sort Controls */}
            <div className="grid grid-cols-3 gap-2 pb-1 text-[10px]">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2 py-1 bg-surface border border-border-subtle rounded-lg text-[10px] text-primary focus:ring-1 focus:ring-primary outline-none font-semibold"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-1.5 py-1 bg-surface border border-border-subtle rounded-lg text-[10px] text-primary outline-none font-semibold cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Verified">Verified</option>
                <option value="Assigned">Assigned</option>
                <option value="Repairing">Repairing</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-1.5 py-1 bg-surface border border-border-subtle rounded-lg text-[10px] text-primary outline-none font-semibold cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {sortedComplaints.length === 0 ? (
                <div className="text-[10px] text-text-secondary text-center py-6 font-semibold bg-slate-50 rounded-lg border border-dashed border-border-subtle">
                  No submissions found matching filters
                </div>
              ) : (
                sortedComplaints.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedCompId(comp.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                      selectedCompId === comp.id ? 'bg-slate-100 border-primary' : 'bg-white border-border-subtle hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-4 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-xs text-primary truncate max-w-[200px] leading-tight">{comp.title}</h5>
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                          comp.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          comp.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          comp.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {comp.priority || 'Medium'}
                        </span>
                      </div>
                      <span className="text-[9px] text-text-secondary font-medium block leading-none">
                        📍 {comp.locationName || comp.location}
                      </span>
                      <div className="flex gap-2 items-center text-[8px] text-text-secondary/70">
                        <span>Status: <strong className="text-primary font-semibold">{comp.status}</strong></span>
                        <span>•</span>
                        <span>Filed: {new Date(comp.timestamp || comp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleVote(comp.id, e)}
                      className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-border-subtle rounded-lg px-2.5 py-1 text-[9px] font-bold text-primary active:scale-95 transition-all flex-shrink-0 cursor-pointer h-7"
                    >
                      <ThumbsUp className="w-3 h-3 text-primary" /> {comp.votes || 0}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Crew Progress Update Modal */}
      {updatingReport && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50">
          <div 
            className="bg-white rounded-xl shadow-xl border border-slate-200/80 max-w-md w-full flex flex-col"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b p-6 pb-3 sticky top-0 bg-white z-10">
              <div>
                <h4 className="text-sm font-black text-primary uppercase tracking-wide flex items-center gap-1.5">
                  👷 Crew Progress Report
                </h4>
                <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">
                  Updating: {updatingReport.title}
                </p>
              </div>
              <button 
                onClick={() => setUpdatingReport(null)}
                className="text-text-secondary hover:text-primary font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 py-4 space-y-4 text-xs font-semibold text-text-secondary flex-1">
              {/* Progress Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="uppercase tracking-wider">Progress %</span>
                  <span className="text-primary font-black bg-slate-100 px-2 py-0.5 rounded">{updateProgressVal}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={updateProgressVal}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setUpdateProgressVal(val);
                    if (val === 100) {
                      setUpdateStatusVal('Awaiting Resolution');
                    } else if (updateStatusVal === 'Awaiting Resolution') {
                      setUpdateStatusVal('In Progress');
                    }
                  }}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
              </div>

              {/* Status Dropdown */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider block">Operational Status</span>
                <select
                  value={updateStatusVal}
                  onChange={(e) => {
                    const status = e.target.value as any;
                    setUpdateStatusVal(status);
                    if (status === 'Awaiting Resolution') {
                      setUpdateProgressVal(100);
                    } else if (updateProgressVal === 100) {
                      setUpdateProgressVal(95);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-bold text-primary outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="In Progress">In Progress (Active Repairing)</option>
                  <option value="Delayed">Delayed (Issues / Blocked)</option>
                  <option value="Awaiting Resolution">Awaiting Resolution (100% Complete)</option>
                </select>
              </div>

              {/* ETA Input */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider block">Estimated Completion Time (ETA minutes remaining)</span>
                <input 
                  type="number"
                  min="0"
                  max="300"
                  value={updateEtaVal}
                  onChange={(e) => setUpdateEtaVal(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-bold text-primary outline-none focus:border-primary transition-all"
                  placeholder="Minutes remaining..."
                />
              </div>

              {/* Delay Reason (Conditional) */}
              {(updateStatusVal === 'Delayed') && (
                <div className="space-y-1 animate-fade-in-up">
                  <span className="text-[10px] uppercase tracking-wider block text-red-600">Delay Reason</span>
                  <input 
                    type="text"
                    value={updateDelayReason}
                    onChange={(e) => setUpdateDelayReason(e.target.value)}
                    className="w-full bg-red-50/20 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold text-red-700 outline-none focus:border-red-500 transition-all placeholder:text-red-300"
                    placeholder="e.g. Bad weather, equipment breakdown..."
                    required
                  />
                </div>
              )}

              {/* Repair Notes */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider block">Repair Logs / Notes</span>
                <textarea 
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-semibold text-primary outline-none focus:border-primary transition-all placeholder:text-slate-400"
                  placeholder="Describe material status, compaction results, etc."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end text-xs font-bold p-6 pt-3 border-t border-slate-100 sticky bottom-0 bg-white z-10">
              <button
                onClick={() => setUpdatingReport(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updates: Partial<Report> = {
                    progress: updateProgressVal,
                    etaMinutes: updateEtaVal,
                    status: updateStatusVal,
                    delayReason: updateStatusVal === 'Delayed' ? updateDelayReason : undefined,
                    repairNotes: updateNotes
                  };

                  updateReportStatus(updatingReport.id, updates);
                  setSuccessMsg(`Crew report updated for: ${updatingReport.title}`);
                  setTimeout(() => setSuccessMsg(null), 3000);
                  setUpdatingReport(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
              >
                Submit Updates
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
