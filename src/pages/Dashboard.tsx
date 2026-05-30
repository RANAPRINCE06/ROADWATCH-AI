import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Crosshair, 
  Droplets, 
  LightbulbOff, 
  HardHat, 
  Car, 
  Check, 
  Plus,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { getReports, resolveReport as storageResolveReport, addReport as storageAddReport } from '../utils/storage';

interface Report {
  id: string;
  title: string;
  location: string;
  severity: 'Critical' | 'Active' | 'Pending' | 'Scheduled';
  icon: 'alert' | 'lightbulb' | 'hardhat' | 'car' | 'droplets';
  source: string;
  timestamp: Date;
  x: number;
  y: number;
  imageUrl: string;
  resolved?: boolean;
}

const INITIAL_REPORTS: Report[] = [];

const HAZARD_TEMPLATES = [
  // Pothole
  { title: 'Pothole', location: 'Oak St. Intersection', severity: 'Critical', icon: 'alert', source: 'AI Detected', imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },
  { title: 'Pothole', location: 'Expressway Exit 5', severity: 'Critical', icon: 'alert', source: 'AI Detected', imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },

  // Waterlogging
  { title: 'Waterlogging', location: 'Underpass 9', severity: 'Critical', icon: 'droplets', source: 'Sensor Report', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80' },
  { title: 'Waterlogging', location: '7th Avenue South', severity: 'Critical', icon: 'droplets', source: 'Sensor Report', imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80' },

  // Missing Divider
  { title: 'Missing Divider', location: 'Downtown Bypass', severity: 'Active', icon: 'hardhat', source: 'Admin Update', imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80' },
  { title: 'Missing Divider', location: 'West Expressway', severity: 'Active', icon: 'hardhat', source: 'Citizen Report', imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80' },

  // Traffic Signal
  { title: 'Traffic Signal', location: 'Broadway Blvd', severity: 'Critical', icon: 'alert', source: 'AI Detected', imageUrl: 'https://images.unsplash.com/photo-1510935579761-125207a902f4?auto=format&fit=crop&w=400&q=80' },
  { title: 'Traffic Signal', location: 'Pine & 12th St', severity: 'Pending', icon: 'alert', source: 'Citizen Report', imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80' },

  // Spillage
  { title: 'Spillage', location: 'Interstate 90', severity: 'Active', icon: 'droplets', source: 'Camera #10', imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80' },
  { title: 'Spillage', location: 'North Circular Rd', severity: 'Active', icon: 'droplets', source: 'Camera #42', imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80' },

  // Other
  { title: 'Other', location: 'Pine & 12th St', severity: 'Pending', icon: 'alert', source: 'Citizen Report', imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80' },
  { title: 'Other', location: 'Oak & Elm St', severity: 'Pending', icon: 'alert', source: 'Citizen Report', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' }
] as const;

export function Dashboard() {
  const loadReportsFromStorage = (): Report[] => {
    return getReports().map(r => {
      // Normalize and safeguard all properties to prevent undefined crash bugs
      const title = r.title || 'Road Hazard';
      const location = r.location || 'Reported Area';
      
      let severity = r.severity;
      if (typeof severity !== 'string' || !['Critical', 'Active', 'Pending', 'Scheduled'].includes(severity)) {
        severity = 'Active';
      }
      
      const icon = r.icon || 'alert';
      const source = r.source || 'Citizen Report';
      
      let timestamp = new Date();
      if (r.timestamp) {
        const d = new Date(r.timestamp);
        if (!isNaN(d.getTime())) {
          timestamp = d;
        }
      }
      
      return {
        ...r,
        title,
        location,
        severity,
        icon,
        source,
        timestamp,
        x: typeof r.x === 'number' ? r.x : Math.floor(Math.random() * 50) + 25,
        y: typeof r.y === 'number' ? r.y : Math.floor(Math.random() * 50) + 25,
        imageUrl: r.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
        resolved: !!r.resolved
      };
    });
  };

  const [reports, setReports] = useState<Report[]>(loadReportsFromStorage);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null);
  const [aiAccuracy, setAiAccuracy] = useState<number>(98.5);
  const [now, setNow] = useState<Date>(new Date());
  const [justNotification, setJustNotification] = useState<{
    message: string;
    type: 'alert' | 'success';
  } | null>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'color' | 'heatmap'>('satellite');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync state with shared localStorage event in real time
  useEffect(() => {
    const handleSync = () => {
      setReports(loadReportsFromStorage());
    };
    window.addEventListener('roadwatch-reports-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
    };
  }, []);

  // Reset panning on zoom out to 1x
  useEffect(() => {
    if (zoomLevel === 1) {
      setMapPan({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setMapPan(prev => {
      // Expanded boundaries to allow panning across the full image area when zoomed
      const maxPanX = (zoomLevel - 1) * 450;
      const maxPanY = (zoomLevel - 1) * 450;
      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, prev.x + dx)),
        y: Math.min(maxPanY, Math.max(-maxPanY, prev.y + dy))
      };
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleMapLayer = () => {
    setMapLayer(prev => {
      if (prev === 'satellite') return 'color';
      if (prev === 'color') return 'heatmap';
      return 'satellite';
    });
  };

  const activeReportsCount = reports.filter(r => !r.resolved).length;
  const emergencyAlertsCount = reports.filter(r => !r.resolved && r.severity === 'Critical').length;
  
  // Calculate Safety Score dynamically based on active reports.
  const calculateSafetyScore = () => {
    let score = 94;
    reports.forEach(r => {
      if (!r.resolved) {
        if (r.severity === 'Critical') score -= 3.5;
        else if (r.severity === 'Active') score -= 2;
        else if (r.severity === 'Pending') score -= 1;
      }
    });
    return Math.round(Math.min(100, Math.max(40, score)));
  };

  const safetyScore = calculateSafetyScore();
  const scoreDiff = parseFloat((safetyScore - 81.2).toFixed(1));
  const isScoreImproving = scoreDiff >= 0;

  // Auto-updating timer & accuracy wiggling
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setAiAccuracy(prev => {
        const delta = (Math.random() - 0.5) * 0.08;
        const next = prev + delta;
        return parseFloat(Math.min(99.4, Math.max(97.8, next)).toFixed(2));
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);





  const simulateNewHazard = () => {
    const template = HAZARD_TEMPLATES[Math.floor(Math.random() * HAZARD_TEMPLATES.length)];
    const x = Math.floor(Math.random() * 60) + 20;
    const y = Math.floor(Math.random() * 60) + 20;
    
    let lat = 1.2950;
    let lng = 103.8500;
    if (template.title.toLowerCase().includes('pothole')) {
      lat = 1.3048 + (Math.random() - 0.5) * 0.01;
      lng = 103.8318 + (Math.random() - 0.5) * 0.01;
    } else if (template.title.toLowerCase().includes('water')) {
      lat = 1.2847 + (Math.random() - 0.5) * 0.01;
      lng = 103.8590 + (Math.random() - 0.5) * 0.01;
    } else if (template.title.toLowerCase().includes('divider')) {
      lat = 1.2789 + (Math.random() - 0.5) * 0.01;
      lng = 103.8485 + (Math.random() - 0.5) * 0.01;
    } else {
      lat = 1.3120 + (Math.random() - 0.5) * 0.01;
      lng = 103.8760 + (Math.random() - 0.5) * 0.01;
    }

    storageAddReport({
      title: template.title,
      location: template.location,
      severity: template.severity,
      icon: template.icon,
      source: template.source,
      x,
      y,
      lat,
      lng,
      imageUrl: template.imageUrl,
      description: `Simulated live hazard detection of ${template.title}.`,
    });
    
    // Toast notification
    setJustNotification({
      message: `${template.severity} Alert: ${template.title} reported at ${template.location}`,
      type: 'alert'
    });
    setTimeout(() => {
      setJustNotification(null);
    }, 4500);
  };

  const resolveReport = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const reportToResolve = reports.find(r => r.id === id);
    storageResolveReport(id);

    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
    if (hoveredReportId === id) {
      setHoveredReportId(null);
    }

    if (reportToResolve) {
      setJustNotification({
        message: `Resolved: ${reportToResolve.title} at ${reportToResolve.location} has been resolved.`,
        type: 'success'
      });
      setTimeout(() => {
        setJustNotification(null);
      }, 4500);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'lightbulb':
        return <LightbulbOff className="w-5 h-5" />;
      case 'hardhat':
        return <HardHat className="w-5 h-5" />;
      case 'car':
        return <Car className="w-5 h-5" />;
      case 'droplets':
        return <Droplets className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const renderIconContainerClass = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-error/15 text-error border border-error/20';
      case 'Active':
        return 'bg-red-500/10 text-red-500 border border-red-500/10';
      case 'Pending':
        return 'bg-amber-500/15 text-amber-600 border border-amber-500/20';
      case 'Scheduled':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/15';
      default:
        return 'bg-surface-container text-text-secondary';
    }
  };

  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <span className="text-[10px] bg-error/15 text-error px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Critical</span>;
      case 'Active':
        return <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>;
      case 'Pending':
        return <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending</span>;
      case 'Scheduled':
        return <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Scheduled</span>;
      default:
        return <span className="text-[10px] bg-surface-container text-text-secondary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{severity}</span>;
    }
  };

  const activeReports = reports.filter(r => !r.resolved);
  const selectedReport = reports.find(r => r.id === selectedReportId);

  // SVG Gauge calculations (circumference ≈ 175)
  const strokeDashoffset = 175 * (1 - safetyScore / 100);

  const activeCritical = reports.filter(r => !r.resolved && r.severity === 'Critical');
  const infrastructureAlert = activeCritical.length > 0 
    ? `${activeCritical[0].title} (${activeCritical[0].location})` 
    : 'All Zones Clear';

  // Derive Traffic Density based on active reports state (e.g. Collisions cause Heavy traffic, multiple reports cause Moderate)
  const getTrafficDensity = () => {
    const active = reports.filter(r => !r.resolved);
    const hasCollision = active.some(r => r.title.toLowerCase().includes('collision'));
    if (hasCollision) return 'Heavy';
    if (active.length > 2) return 'Moderate';
    return 'Low';
  };
  const trafficDensity = getTrafficDensity();

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-24">
      {/* Toast Notification */}
      {justNotification && (
        <div className={`fixed bottom-6 right-6 z-[100] bg-deep-slate text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in-up border max-w-sm transition-all duration-300 ${
          justNotification.type === 'success' ? 'border-green-500/30' : 'border-white/10'
        }`}>
          {justNotification.type === 'success' ? (
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-green-400" />
            </div>
          ) : (
            <div className="relative w-3 h-3 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-safety-yellow animate-ping"></div>
              <div className="absolute inset-0.5 rounded-full bg-safety-yellow"></div>
            </div>
          )}
          <div className="flex-1 text-xs font-semibold tracking-wide">
            {justNotification.type === 'success' ? '✅ ' : '🚨 '}
            {justNotification.message}
          </div>
          <button 
            onClick={() => setJustNotification(null)}
            className="text-white/60 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Safety Score Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-border-subtle flex items-center justify-between transition-all duration-300 hover:shadow-md">
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Area Safety Score</p>
            <h3 className="text-3xl font-bold text-primary transition-all duration-500">
              {safetyScore}
              <span className="text-lg opacity-40">/100</span>
            </h3>
            <p className={`text-[11px] font-bold flex items-center gap-1 mt-1 transition-colors duration-300 ${isScoreImproving ? 'text-green-600' : 'text-error'}`}>
              {isScoreImproving ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isScoreImproving ? '+' : ''}{scoreDiff}% compared to base
            </p>
          </div>
          <div className="relative w-16 h-16 transition-transform duration-500 hover:scale-105">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-surface-container" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6" />
              <circle 
                className={`${safetyScore >= 80 ? 'text-green-500' : safetyScore >= 70 ? 'text-safety-yellow' : 'text-error'}`} 
                cx="32" 
                cy="32" 
                fill="transparent" 
                r="28" 
                stroke="currentColor" 
                strokeDasharray="175" 
                strokeDashoffset={strokeDashoffset} 
                strokeWidth="6"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className={`w-5 h-5 ${safetyScore >= 80 ? 'text-green-500' : safetyScore >= 70 ? 'text-safety-yellow' : 'text-error'}`} />
            </div>
          </div>
        </div>

        {/* Hazard Reports Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-border-subtle transition-all duration-300 hover:shadow-md">
          <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Hazard Reports</p>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-bold text-primary transition-all duration-500">{activeReportsCount}</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">Active road hazards</p>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              <div className={`w-2 bg-outline-variant rounded-t-sm transition-all duration-500 ${activeReportsCount > 4 ? 'h-8' : 'h-4'}`}></div>
              <div className={`w-2 bg-outline-variant rounded-t-sm transition-all duration-500 ${activeReportsCount > 5 ? 'h-10' : 'h-6'}`}></div>
              <div className={`w-2 bg-outline-variant rounded-t-sm transition-all duration-500 ${activeReportsCount > 6 ? 'h-7' : 'h-5'}`}></div>
              <div className={`w-2 bg-primary rounded-t-sm transition-all duration-500 ${activeReportsCount > 2 ? 'h-11' : 'h-6'}`}></div>
              <div className={`w-2 bg-primary rounded-t-sm transition-all duration-500 ${activeReportsCount > 0 ? 'h-12' : 'h-2'}`}></div>
            </div>
          </div>
        </div>

        {/* AI Detection Accuracy Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-border-subtle transition-all duration-300 hover:shadow-md">
          <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">AI Detection Accuracy</p>
          <h3 className="text-3xl font-bold text-primary tabular-nums">
            {aiAccuracy.toFixed(1)}<span className="text-lg opacity-40">%</span>
          </h3>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500" 
              style={{ width: `${aiAccuracy}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2 font-medium">Enhanced by neural mesh v2.4</p>
        </div>

        {/* Emergency Alerts Card */}
        <div className={`p-5 rounded-xl shadow-sm text-white relative overflow-hidden transition-all duration-500 hover:shadow-md ${emergencyAlertsCount > 0 ? 'bg-error animate-pulse' : 'bg-deep-slate'}`}>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-white/70 mb-1 uppercase tracking-wider">Emergency Alerts</p>
            <h3 className="text-3xl font-bold tabular-nums">
              {emergencyAlertsCount < 10 ? `0${emergencyAlertsCount}` : emergencyAlertsCount}
            </h3>
            <p className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${emergencyAlertsCount > 0 ? 'text-white' : 'text-safety-yellow'}`}>
              <AlertTriangle className="w-3 h-3" />
              {emergencyAlertsCount > 0 ? 'Immediate action required' : 'No critical emergencies'}
            </p>
          </div>
          <AlertTriangle className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Center Map Widget (Always visible) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden relative group h-[400px] lg:h-[520px] transition-all duration-300 hover:shadow-md">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="glass-card px-4 py-2 rounded-lg flex items-center gap-3 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-safety-yellow animate-ping"></span>
              <p className="text-xs font-bold text-primary tracking-wide">Live Grid: Sector 7G</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={toggleMapLayer}
                className={`bg-white/95 backdrop-blur shadow-sm hover:bg-white transition-all border border-border-subtle flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer ${
                  mapLayer !== 'satellite' ? 'text-primary border-primary bg-yellow-50/50' : 'text-text-secondary'
                }`}
                title={`Map Mode: ${mapLayer.toUpperCase()} (Click to toggle)`}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.25))}
                className="bg-white/95 backdrop-blur shadow-sm hover:bg-white transition-all border border-border-subtle flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-text-secondary hover:text-primary active:scale-95 duration-100"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(1.0, prev - 0.25))}
                className="bg-white/95 backdrop-blur shadow-sm hover:bg-white transition-all border border-border-subtle flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-text-secondary hover:text-primary active:scale-95 duration-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            className="w-full h-full bg-surface-dim relative overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div 
              className={`w-full h-full relative origin-center ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
              style={{ transform: `scale(${zoomLevel}) translate(${mapPan.x / zoomLevel}px, ${mapPan.y / zoomLevel}px)` }}
            >
              <img 
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-102 ${
                  mapLayer === 'satellite' ? 'grayscale opacity-40' : 
                  mapLayer === 'color' ? 'opacity-85' : 
                  'grayscale opacity-35'
                }`} 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuHFT25LrIudFzN9hASHnRgcA8BFks14OkKHmCUQHsIgxP3_efPdHHmYslWisBVEx-kYPAL-txAPhVyEdBWysgahj1JzAnfyT5ZDTy2s0D9OlsRCR4Ptdllch1EeRvlylM3nqORXTkFaZrifD2-giS6p6l0A1aYfo-GaksLZgNQ4RGx2i2L8P3hRQddcA-WQqfF6xLKPU35tm4cCYL8xEECIOHkl-TNtw2HmoENL3JBWVs9vbh25GB2z1RhXII3CXQ_qhCdGJn7lo" 
                alt="Map"
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
              />

            {/* Heatmap Layer blobs */}
            {mapLayer === 'heatmap' && (
              <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-80 animate-pulse bg-gradient-to-tr from-red-500/10 via-yellow-500/5 to-transparent">
                {activeReports.map(r => (
                  <div 
                    key={`heat-${r.id}`}
                    className="absolute rounded-full filter blur-xl"
                    style={{
                      top: `${r.y}%`,
                      left: `${r.x}%`,
                      width: r.severity === 'Critical' ? '130px' : '90px',
                      height: r.severity === 'Critical' ? '130px' : '90px',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: r.severity === 'Critical' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.35)',
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Realtime Live Markers */}
            {activeReports.map((report) => {
              const isSelected = selectedReportId === report.id;
              const isHovered = hoveredReportId === report.id;
              const isCritical = report.severity === 'Critical';
              const colorClass = isCritical ? 'bg-error border-white' : 'bg-safety-yellow border-primary';
              const rippleClass = isCritical ? 'bg-error/30' : 'bg-safety-yellow/30';
              
              return (
                <div 
                  key={report.id}
                  className={`absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 ${
                    isSelected ? 'scale-130 z-30' : 'hover:scale-110'
                  }`}
                  style={{ top: `${report.y}%`, left: `${report.x}%` }}
                  onClick={() => setSelectedReportId(report.id)}
                  onMouseEnter={() => setHoveredReportId(report.id)}
                  onMouseLeave={() => setHoveredReportId(null)}
                >
                  <div className={`absolute inset-0 rounded-full animate-ping ${rippleClass}`}></div>
                  <div className={`absolute inset-1.5 rounded-full border-2 shadow-md flex items-center justify-center text-xs font-bold text-primary ${colorClass}`}>
                    <span className={isCritical ? 'text-white' : 'text-primary'}>
                      {isCritical ? '!' : '•'}
                    </span>
                  </div>

                  {/* Hover Tooltip - Showing image and problem */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 z-[100] w-56 bg-white rounded-xl shadow-2xl border border-border-subtle p-2.5 pointer-events-none animate-fade-in-up">
                      <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2 bg-surface-container border border-border-subtle">
                        <img 
                          src={report.imageUrl} 
                          alt={report.title} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-1.5 right-1.5 shadow-sm">
                          {renderSeverityBadge(report.severity)}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-primary truncate tracking-tight">{report.title}</p>
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">{report.location}</p>
                      
                      {/* Arrow tail */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-6 border-transparent border-t-white"></div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Selected Report Map Dialog */}
          {selectedReport && (
            <div className="absolute top-4 right-4 z-20 glass-card p-4 rounded-xl max-w-[260px] shadow-lg animate-fade-in-up border border-border-subtle bg-white/95">
              <div className="flex justify-between items-start mb-1.5">
                <h4 className="font-bold text-primary text-sm tracking-tight">{selectedReport.title}</h4>
                <button 
                  onClick={() => setSelectedReportId(null)}
                  className="text-xs text-text-secondary hover:text-primary font-bold ml-2 p-0.5 hover:bg-surface-container rounded transition-colors flex items-center justify-center w-5 h-5 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mb-2 font-medium">{selectedReport.location}</p>
              <div className="flex gap-2 items-center my-2">
                {renderSeverityBadge(selectedReport.severity)}
                <span className="text-[10px] text-text-secondary font-semibold bg-surface-container px-1.5 py-0.5 rounded">{selectedReport.source}</span>
              </div>
              <p className="text-[10px] text-text-secondary mb-3">Detected {formatTimeAgo(selectedReport.timestamp)}</p>
              <button 
                onClick={(e) => resolveReport(selectedReport.id, e)}
                className="w-full bg-green-600 text-white hover:bg-green-700 transition-colors h-8 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark Resolved
              </button>
            </div>
          )}

          {/* Map Overlay Zone Status Panel */}
          <div className="absolute bottom-4 right-4 z-10 glass-card p-3 rounded-xl border border-border-subtle bg-white/95 shadow-lg transition-all duration-300 ease-in-out w-[128px] h-[38px] hover:w-[280px] hover:h-[104px] overflow-hidden group cursor-pointer">
            <div className="flex items-center gap-2 h-[14px]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest truncate">Zone Status</p>
            </div>
            <div className="mt-3.5 space-y-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out delay-75">
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="opacity-75 font-semibold text-text-secondary">Traffic Density</span>
                <span className={`font-bold transition-all duration-300 ${
                  trafficDensity === 'Heavy' ? 'text-error' : trafficDensity === 'Moderate' ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {trafficDensity}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="opacity-75 font-semibold text-text-secondary">Infrastructure Alert</span>
                <span className={`font-bold truncate text-right ${
                  infrastructureAlert !== 'All Zones Clear' ? 'text-error animate-pulse' : 'text-green-600'
                }`} title={infrastructureAlert}>
                  {infrastructureAlert}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Reports Feed (Standard size next to the Map) */}
        <div className="bg-white rounded-xl shadow-sm border border-border-subtle flex flex-col overflow-hidden transition-all duration-500 hover:shadow-md col-span-1 h-[400px] lg:h-[520px]">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-bright/50">
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                Recent Reports
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 animate-pulse tracking-wide uppercase border border-green-200">
                  ● LIVE FEED
                </span>
              </h3>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={simulateNewHazard}
                className="text-xs bg-safety-yellow text-primary hover:bg-secondary-container transition-colors px-3 h-8 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Simulate Alert
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {activeReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-text-secondary opacity-60">
                <ShieldCheck className="w-12 h-12 text-green-500 mb-2 animate-bounce" />
                <p className="font-bold text-sm text-primary">All Clear</p>
                <p className="text-xs mt-0.5">No active hazards detected in this sector.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeReports.map((report) => {
                  const isSelected = selectedReportId === report.id;
                  return (
                    <div 
                      key={report.id}
                      onClick={() => setSelectedReportId(isSelected ? null : report.id)}
                      onMouseEnter={() => setHoveredReportId(report.id)}
                      onMouseLeave={() => setHoveredReportId(null)}
                      className={`p-3.5 transition-all duration-300 rounded-xl flex flex-col cursor-pointer border relative group ${
                        isSelected 
                          ? 'bg-yellow-50/40 border-safety-yellow shadow-md scale-[1.01]' 
                          : 'bg-white hover:bg-surface-container-low border-border-subtle/50 hover:border-border-subtle'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                          isSelected ? 'scale-105 shadow-sm' : ''
                        } ${renderIconContainerClass(report.severity)}`}>
                          {renderIcon(report.icon)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-sm font-bold text-primary truncate pr-2">{report.title}</p>
                            {renderSeverityBadge(report.severity)}
                          </div>
                          <p className="text-xs text-on-surface-variant truncate font-medium">{report.location} — {report.source}</p>
                          
                          <div className="flex justify-between items-center mt-1.5">
                            <p className="text-[10px] text-text-secondary/70 font-semibold tabular-nums">
                              {formatTimeAgo(report.timestamp)}
                            </p>
                            
                            {/* Inline Resolve Trigger on Hover (Hidden when card is expanded) */}
                            {!isSelected && (
                              <button
                                onClick={(e) => resolveReport(report.id, e)}
                                className="text-[10px] text-white bg-green-600 hover:bg-green-700 h-6 px-2.5 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section inside the selected report card */}
                      {isSelected && (
                        <div className="mt-3.5 pt-3.5 border-t border-border-subtle/70 animate-fade-in-up space-y-3 w-full">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border-subtle bg-surface-container shadow-inner">
                            <img 
                              src={report.imageUrl} 
                              alt={report.title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium px-0.5">
                            <span>Reporting Device: <strong className="text-primary font-bold">{report.source}</strong></span>
                            <span>Grid Loc: {report.x}%, {report.y}%</span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={(e) => resolveReport(report.id, e)}
                              className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold h-8 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors duration-150 active:scale-97 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Resolve Issue
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReportId(null);
                              }}
                              className="px-3 h-8 bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-primary font-bold rounded-lg text-xs transition-colors duration-150 border border-border-subtle flex items-center justify-center active:scale-97 cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
