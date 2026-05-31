import React, { useState, useEffect, useRef } from 'react';
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
  updateComplaintStatus,
  CitizenComplaint 
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
    complaintTitle: '投诉标题',
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

export function CitizenPortal() {
  const [lang, setLang] = useState<'en' | 'zh' | 'ms' | 'ta'>('en');
  const [complaints, setComplaints] = useState<CitizenComplaint[]>([]);
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [locName, setLocName] = useState('');
  
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    const colRef = getCollectionRef('complaints');
    const q = buildQuery(colRef, queryOrderBy('createdAt', 'desc'));
    const unsubscribe = subscribeToQuery(q, (data) => {
      setComplaints(data);
      if (data.length > 0 && !selectedCompId) {
        setSelectedCompId(data[0].id);
      }
    });
    return () => unsubscribe();
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
    
    // Type validation
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
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
    
    // Type validation
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
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
    if (isConfirmed) {
      verifyComplaint(id, citizenRating, citizenFeedback || 'Verified by citizen. Excellent smoothing work.');
      if (followUpImageUrl) {
        updateDocument(getDocRef('complaints', id), { followUpImageUrl });
        updateDocument(getDocRef('reports', `rep-from-${id}`), { afterImageUrl: followUpImageUrl });
      }
      setSuccessMsg('Citizen verification submitted successfully! Paving certified.');
    } else {
      updateDocument(getDocRef('complaints', id), { 
        status: 'Repair In Progress',
        citizenVerified: false,
        citizenRejected: true,
        citizenFeedback: citizenFeedback || 'Repair rejected by citizen. Pavement is still uneven.'
      });
      updateDocument(getDocRef('reports', `rep-from-${id}`), {
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

  const selectedComplaint = complaints.find(c => c.id === selectedCompId) || complaints[0];

  // Resolution stats
  const totalFiled = complaints.length;
  const verifiedCount = complaints.filter(c => c.status !== 'Submitted').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const activeCount = complaints.filter(c => c.status !== 'Resolved').length;

  let avgTime = '35m';
  const resolvedList = complaints.filter(c => c.status === 'Resolved');
  if (resolvedList.length > 0) {
    let totalMs = 0;
    let count = 0;
    resolvedList.forEach(c => {
      if (c.timestamp) {
        const start = new Date(c.timestamp).getTime();
        const end = c.resolvedAt ? new Date(c.resolvedAt).getTime() : (start + 42 * 60 * 1000);
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
    const order = ['Submitted', 'Verified', 'Assigned', 'Repair In Progress', 'Resolved'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(step);

    if (currentIndex >= stepIndex) {
      if (currentStatus === 'Resolved') return 'bg-green-600 border-green-500 text-white';
      if (step === 'Repair In Progress') return 'bg-orange-500 border-orange-400 text-white';
      return 'bg-primary border-primary text-white';
    }
    return 'bg-slate-100 border-slate-200 text-slate-400';
  };

  // Search & Filters logic
  const filteredComplaints = complaints.filter(comp => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesTitle = comp.title?.toLowerCase().includes(q);
      const matchesLoc = comp.locationName?.toLowerCase().includes(q) || comp.location?.toLowerCase().includes(q);
      const matchesId = comp.id?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesLoc && !matchesId) return false;
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Repair In Progress' && comp.status === 'Repair In Progress') return true;
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
      const weightA = weights[a.priority || 'Medium'] || 0;
      const weightB = weights[b.priority || 'Medium'] || 0;
      return weightB - weightA;
    }
    return 0;
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      {/* Header Banner with Language Select & Notifications */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">{t.title}</h2>
          <p className="text-text-secondary mt-1">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-green-600 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Submission form */}
        <section className="lg:col-span-6 bg-white rounded-xl border border-border-subtle shadow-sm p-6">
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
          {selectedComplaint && (
            <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-sm space-y-5">
              <div className="border-b border-border-subtle/50 pb-3 flex justify-between items-start gap-4">
                <div>
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Active Incident Tracker</span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <h4 className="font-bold text-sm text-primary leading-snug">{selectedComplaint.title}</h4>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                      selectedComplaint.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                      selectedComplaint.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      selectedComplaint.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedComplaint.priority || 'Medium'}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">📍 {selectedComplaint.locationName || selectedComplaint.location}</p>
                </div>
                {selectedComplaint.imageUrl && (
                  <img 
                    src={selectedComplaint.imageUrl} 
                    alt="Complaint thumbnail" 
                    className="w-12 h-12 rounded object-cover border border-border-subtle"
                  />
                )}
              </div>

              {/* Progress Stepper Timeline */}
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                <div className="relative flex gap-3.5 items-start animate-fade-in-up">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedComplaint.status, 'Submitted')}`}>
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 1: Submitted</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5">Complaint received by municipal central database.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedComplaint.status, 'Verified')}`}>
                    {['Verified', 'Assigned', 'Repair In Progress', 'Resolved'].includes(selectedComplaint.status) ? '✓' : '2'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 2: Verified</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5">AI Computer Vision matches citizen upload logs.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedComplaint.status, 'Assigned')}`}>
                    {['Assigned', 'Repair In Progress', 'Resolved'].includes(selectedComplaint.status) ? '✓' : '3'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 3: Assigned</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5">Assigned to Sector Maintenance Crew Team Gamma.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedComplaint.status, 'Repair In Progress')}`}>
                    {['Repair In Progress', 'Resolved'].includes(selectedComplaint.status) ? '✓' : '4'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 4: Repair In Progress</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5">Crew deployed on field. Paving works active.</p>
                  </div>
                </div>

                <div className="relative flex gap-3.5 items-start">
                  <div className={`absolute -left-[23px] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${getWorkflowStepClass(selectedComplaint.status, 'Resolved')}`}>
                    {selectedComplaint.status === 'Resolved' ? '✓' : '5'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Stage 5: Resolved</h5>
                    <p className="text-[10px] text-text-secondary mt-0.5">Safety clearance verified. Post-patch telemetry complete.</p>
                  </div>
                </div>
              </div>

              {/* CITIZEN VERIFICATION SYSTEM PANEL */}
              {selectedComplaint.status === 'Resolved' && (
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
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-green-200/50 pt-2.5 mt-2 font-bold text-[10px] text-center">
                        <div>
                          <span className="text-text-secondary block font-semibold">Satisfaction:</span>
                          <span className="text-primary text-xs">{selectedComplaint.satisfactionScore}%</span>
                        </div>
                        <div>
                          <span className="text-text-secondary block font-semibold">Resolution Quality Score:</span>
                          <span className="text-primary text-xs">{selectedComplaint.resolutionQualityScore}%</span>
                        </div>
                      </div>
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

              {/* Municipal Dispatch Simulation Controls */}
              <div className="mt-4 pt-4 border-t border-border-subtle/50 space-y-2">
                <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">Municipal Dispatch Simulator</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'Verified')}
                    disabled={selectedComplaint.status === 'Verified'}
                    className="px-2 py-1 bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white rounded text-[8px] font-bold cursor-pointer transition-colors"
                  >
                    Verify (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'Assigned')}
                    disabled={selectedComplaint.status === 'Assigned'}
                    className="px-2 py-1 bg-safety-yellow text-primary hover:opacity-90 disabled:bg-slate-100 disabled:text-slate-400 rounded text-[8px] font-black cursor-pointer transition-colors"
                  >
                    Assign Crew
                  </button>
                  <button
                    type="button"
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'Repair In Progress')}
                    disabled={selectedComplaint.status === 'Repair In Progress'}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded text-[8px] font-bold cursor-pointer transition-colors"
                  >
                    Start Repair
                  </button>
                  <button
                    type="button"
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'Resolved')}
                    disabled={selectedComplaint.status === 'Resolved'}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded text-[8px] font-bold cursor-pointer transition-colors"
                  >
                    Resolve Repair
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* User complaints history list */}
          <div className="space-y-3">
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
                <option value="Repair In Progress">Repairing</option>
                <option value="Resolved">Resolved</option>
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
    </div>
  );
}
