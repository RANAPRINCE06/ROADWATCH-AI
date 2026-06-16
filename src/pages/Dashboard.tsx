import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
declare const google: any;
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Droplets, 
  HardHat, 
  Car, 
  Check, 
  Plus,
  ZoomIn,
  ZoomOut,
  Play,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  Users,
  Star,
  MessageSquare,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getReports, 
  getRepairs,
  resolveReport as storageResolveReport, 
  addReport as storageAddReport, 
  addComplaint,
  updateReportStatus, 
  verifyRepair,
  getSettings,
  deleteReport,
  sortQueuedHazards,
  Report 
} from '../utils/storage';
import { reportsApi } from '../services/api';
import { useIncidentProgress, getDisplayProgress, isDelayed } from '../hooks/useIncidentProgress';

const calculateDynamicPriorityScore = (report: Report): number => {
  // 1. Severity points (Max 30)
  let severityPoints = 10;
  if (report.severity === 'Critical') severityPoints = 30;
  else if (report.severity === 'Active') severityPoints = 22;
  else if (report.severity === 'Pending') severityPoints = 15;

  // 2. Traffic Impact points (Max 30)
  const hash = (report.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isHighTrafficLocation = report.location.toLowerCase().includes('expressway') || 
                               report.location.toLowerCase().includes('highway') || 
                               report.location.toLowerCase().includes('rd') || 
                               report.location.toLowerCase().includes('ave');
  const trafficImpact = isHighTrafficLocation
    ? (hash % 2 === 0 ? 'Severe' : 'High')
    : (hash % 2 === 0 ? 'Moderate' : 'Low');
  
  const trafficPoints = trafficImpact === 'Severe' ? 30 : trafficImpact === 'High' ? 22 : trafficImpact === 'Moderate' ? 15 : 8;

  // 3. Number of Citizen Reports points (Max 20)
  const reportsCount = report.citizenReportsCount || 1;
  const reportsPoints = Math.min(20, reportsCount + 2);

  // 4. AI Risk Score points (Max 20)
  const aiRiskScore = report.priorityScore || (report.severity === 'Critical' ? 92 : report.severity === 'Active' ? 76 : 50);
  const aiPoints = Math.min(20, Math.round(aiRiskScore * 0.2));

  return Math.min(100, severityPoints + trafficPoints + reportsPoints + aiPoints);
};

const HAZARD_TEMPLATES = [
  { title: 'Severe Pothole', location: 'Orchard Rd Lane 2', severity: 'Critical', icon: 'alert', source: 'Citizen Portal', imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },
  { title: 'Deep Pothole', location: 'Stamford Road Crossing', severity: 'Critical', icon: 'alert', source: 'AI Camera #4', imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },
  { title: 'Waterlogging (10cm)', location: 'Bayfront Ave Slip Rd', severity: 'Active', icon: 'droplets', source: 'AI Detected', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80' },
  { title: 'Debris on Roadway', location: 'Nicoll Highway West', severity: 'Active', icon: 'hardhat', source: 'Citizen Portal', imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80' }
] as const;



// React Portal wrapper to render React components natively inside Google Maps overlays
interface PortalOverlayProps {
  map: any;
  position: { lat: number; lng: number };
  children: React.ReactNode;
}

const GoogleMapPortalOverlay: React.FC<PortalOverlayProps> = ({ map, position, children }) => {
  const [container] = useState(() => document.createElement('div'));

  useEffect(() => {
    if (!map || !(window as any).google?.maps) return;

    const overlay = new google.maps.OverlayView();

    overlay.onAdd = () => {
      container.style.position = 'absolute';
      container.style.zIndex = '50';
      overlay.getPanes()?.overlayMouseTarget.appendChild(container);
    };

    overlay.draw = () => {
      const projection = overlay.getProjection();
      if (!projection) return;
      const latLng = new google.maps.LatLng(position.lat, position.lng);
      const pos = projection.fromLatLngToDivPixel(latLng);
      if (pos) {
        container.style.left = `${pos.x}px`;
        container.style.top = `${pos.y}px`;
        container.style.transform = 'translate(-50%, -50%)';
      }
    };

    overlay.onRemove = () => {
      if (container.parentNode && container.parentNode.contains(container)) {
        container.parentNode.removeChild(container);
      }
    };

    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
    };
  }, [map, position, container]);

  return ReactDOM.createPortal(children, container);
};

export function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [updatingReport, setUpdatingReport] = useState<Report | null>(null);
  const [updateProgressVal, setUpdateProgressVal] = useState<number>(0);
  const [updateEtaVal, setUpdateEtaVal] = useState<number>(0);
  const [updateStatusVal, setUpdateStatusVal] = useState<'In Progress' | 'Delayed' | 'Awaiting Resolution'>('In Progress');
  const [updateDelayReason, setUpdateDelayReason] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null);
  const [aiAccuracy, setAiAccuracy] = useState<number>(98.5);
  const [meanResolveTime, setMeanResolveTime] = useState<number>(42);
  const [now, setNow] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [settings, setSettings] = useState(() => getSettings());
  const [feedSeverityFilter, setFeedSeverityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [simTemplate, setSimTemplate] = useState<any>(null);

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

  // ── Automated progress engine (runs every 60s) ──────────────────────────
  useIncidentProgress(60_000);

  const getElapsedDuration = (startedAt?: number) => {
    if (!startedAt) return '0 Minutes';
    const elapsedMs = now.getTime() - startedAt;
    const elapsedMins = Math.max(0, Math.floor(elapsedMs / 60000));
    return `${elapsedMins} Minutes`;
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'Detected':
        return 'bg-slate-100 text-slate-700 border-slate-200/80';
      case 'Verified':
        return 'bg-blue-100 text-blue-700 border-blue-200/80';
      case 'Queued':
        return 'bg-amber-100 text-amber-700 border-amber-200/80';
      case 'Assigned':
        return 'bg-purple-100 text-purple-700 border-purple-200/80';
      case 'In Progress':
      case 'Repairing':
        return 'bg-orange-100 text-orange-700 border-orange-200/80';
      case 'Delayed':
        return 'bg-rose-100 text-rose-700 border-rose-200/80';
      case 'Awaiting Resolution':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200/80';
      case 'Resolved':
        return 'bg-green-100 text-green-700 border-green-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/80';
    }
  };

  const getTeamDispatchesCount = (teamName: string) => {
    return reports.filter(r => 
      r.assignedTeam === teamName && 
      !r.resolved && 
      r.status !== 'Resolved' && 
      r.status !== 'Completed' && 
      (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Repairing' || r.status === 'Delayed' || r.status === 'Awaiting Resolution')
    ).length;
  };

  const getTeamAvailability = (teamName: string) => {
    const count = getTeamDispatchesCount(teamName);
    return count === 0 ? 'Available' : `Busy (${count} active)`;
  };

  const getAiRecommendation = (report: Report) => {
    const teams = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta'];
    const activeDispatches = {
      'Team Alpha': getTeamDispatchesCount('Team Alpha'),
      'Team Bravo': getTeamDispatchesCount('Team Bravo'),
      'Team Charlie': getTeamDispatchesCount('Team Charlie'),
      'Team Delta': getTeamDispatchesCount('Team Delta'),
    };

    const sortedTeams = [...teams].sort(
      (a, b) => activeDispatches[a as keyof typeof activeDispatches] - activeDispatches[b as keyof typeof activeDispatches]
    );

    return sortedTeams[0];
  };

  const formatTimeAgo = (timestampStr: string) => {
    if (!timestampStr) return 'Just now';
    const date = new Date(timestampStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };
  
  // Feedback System Inputs
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);

  const [justNotification, setJustNotification] = useState<{
    message: string;
    type: 'alert' | 'success' | 'info';
  } | null>(null);

  // Map settings
  const [mapLayer, setMapLayer] = useState<'satellite' | 'color' | 'heatmap'>('satellite');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real Google Maps States
  const [apiLoaded, setApiLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic script loader for Google Maps in Dashboard
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    const loadScript = () => {
      if ((window as any).google && (window as any).google.maps) {
        setApiLoaded(true);
        return;
      }

      (window as any).initGoogleMapCallbackDashboard = () => {
        setApiLoaded(true);
      };

      (window as any).gm_authFailure = () => {
        console.warn("Google Maps API Authentication failed. Falling back to Sandbox Mode.");
        setIsSandboxMode(true);
      };

      const existing = document.getElementById('google-maps-api-script') as HTMLScriptElement;
      if (existing) {
        if ((window as any).google && (window as any).google.maps) {
          setApiLoaded(true);
        } else {
          existing.addEventListener('load', () => {
            if ((window as any).google && (window as any).google.maps) {
              setApiLoaded(true);
            }
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-api-script';
      const keyQuery = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' ? `key=${apiKey}&` : '';
      if (!keyQuery) {
        setIsSandboxMode(true);
      }
      script.src = `https://maps.googleapis.com/maps/api/js?${keyQuery}loading=async&callback=initGoogleMapCallbackDashboard&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.addEventListener('load', () => {
        if ((window as any).google && (window as any).google.maps) {
          setApiLoaded(true);
        }
      });
      script.addEventListener('error', () => {
        console.error("Google Maps API script load failed. Switching to Sandbox Mode.");
        setIsSandboxMode(true);
      });
      
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  // Map instantiation
  useEffect(() => {
    if (!apiLoaded || !mapContainerRef.current || map || isSandboxMode) return;

    try {
      const silverMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
        { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
        { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#e0e0e0" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
        { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#dadada" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
      ];

      const googleMap = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 1.2950, lng: 103.8500 }, // Central Singapore focus
        zoom: 13,
        styles: silverMapStyles,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
      });

      setMap(googleMap);
    } catch (e) {
      console.error("Google Maps initialization failed: ", e);
      setIsSandboxMode(true);
    }
  }, [apiLoaded, map, isSandboxMode]);

  // Synchronize map layer (satellite vs color roadmap)
  useEffect(() => {
    if (!map || !(window as any).google?.maps) return;
    if (mapLayer === 'satellite') {
      map.setMapTypeId(google.maps.MapTypeId.HYBRID);
    } else {
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }
  }, [mapLayer, map]);

  // Synchronize selection centering
  useEffect(() => {
    if (!map || isSandboxMode || !selectedReportId) return;
    const found = reports.find(r => r.id === selectedReportId);
    if (found && found.lat && found.lng) {
      map.panTo({ lat: found.lat, lng: found.lng });
      map.setZoom(15);
    }
  }, [selectedReportId, map, reports, isSandboxMode]);

  // Real Zoom handlers
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    } else {
      setZoomLevel(prev => Math.min(2.0, prev + 0.25));
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    } else {
      setZoomLevel(prev => Math.max(1.0, prev - 0.25));
    }
  };

  // Simulator State (9-stage workflow)
  const [simActive, setSimActive] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(-1);
  const [simReportId, setSimReportId] = useState<string | null>(null);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  const SIM_STEPS = [
    { label: 'Citizen Uploads Image', desc: 'Citizen snaps and uploads pothole photo via mobile portal.' },
    { label: 'AI Detects Hazard', desc: 'Computer vision runs YOLO scan to validate surface decay.' },
    { label: 'Hazard Appears on Map', desc: 'Coordinates are plotted and pinned to operations heatmap.' },
    { label: 'Priority Score Generated', desc: 'AI scores severity, estimated risk index, and target repair window.' },
    { label: 'Authority Assigns Team', desc: 'Municipal controller schedules repair and dispatches crew.' },
    { label: 'Repair Starts', desc: 'Team Gamma arrives on-site, installs traffic safety markers, and begins work.' },
    { label: 'Repair Completes', desc: 'Asphalt cured, final inspections approved, resolved images generated.' },
    { label: 'Citizen Verifies Repair', desc: 'Citizen inspects repaving, submits rating & confirms satisfaction.' },
    { label: 'Impact Dashboard Updates', desc: 'Live road safety metrics and resolution statistics update.' }
  ];

  // Load and normalize reports from storage
  const loadReportsFromStorage = (): Report[] => {
    return getReports().map(r => {
      const severity = r.severity || 'Active';
      const status = r.resolved 
        ? 'Resolved' 
        : (r.status || (((r.source === 'AI Detected' || r.source?.includes('AI')) && !r.source?.includes('Citizen')) ? 'Verified' : 'Detected'));
      
      const priorityScore = r.priorityScore || (severity === 'Critical' ? 92 : severity === 'Active' ? 76 : 48);
      const estimatedRisk = r.estimatedRisk || (severity === 'Critical' ? 'High Accident Risk' : 'Moderate Pavement Decay');
      const recommendedRepairTime = r.recommendedRepairTime || (severity === 'Critical' ? 'Within 24 Hours' : 'Within 3 Days');

      // Seed tracking details
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return {
        ...r,
        status,
        priorityScore,
        estimatedRisk,
        recommendedRepairTime,
        beforeImageUrl: r.beforeImageUrl || r.imageUrl,
        startDate: r.startDate || (status !== 'Detected' && status !== 'Verified' ? yesterdayStr : undefined),
        estimatedCompletionDate: r.estimatedCompletionDate || (status !== 'Detected' && status !== 'Verified' ? todayStr : undefined),
        actualCompletionDate: r.actualCompletionDate || (status === 'Resolved' ? todayStr : undefined),
        resolutionTime: r.resolutionTime || (status === 'Resolved' ? '42 Mins' : undefined),
        timestamp: r.timestamp || new Date().toISOString()
      };
    });
  };

  const recalculateMeanResolveTime = () => {
    const reps = getRepairs();
    const resolvedReps = reps.filter(r => r.status === 'Resolved');
    if (resolvedReps.length === 0) {
      setMeanResolveTime(42);
      return;
    }
    
    let totalMinutes = 0;
    let count = 0;
    const allReports = getReports();
    
    resolvedReps.forEach(rep => {
      const hazard = allReports.find(h => h.id === rep.hazardId);
      if (hazard && hazard.timestamp && rep.timestamp) {
        const start = new Date(hazard.timestamp).getTime();
        const end = new Date(rep.timestamp).getTime();
        const diffMin = (end - start) / (60 * 1000);
        if (diffMin > 0) {
          totalMinutes += diffMin;
          count++;
        }
      }
    });
    
    if (count > 0) {
      setMeanResolveTime(Math.round(totalMinutes / count));
    } else {
      setMeanResolveTime(42);
    }
  };

  useEffect(() => {
    setReports(loadReportsFromStorage());
    recalculateMeanResolveTime();
    
    const handleSync = () => {
      setReports(loadReportsFromStorage());
      recalculateMeanResolveTime();
    };
    const handleStartSim = () => {
      startSimulation();
    };
    const handleSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSearchQuery(detail || '');
    };
    const handleSelectReport = (e: Event) => {
      const reportId = (e as CustomEvent).detail;
      setSelectedReportId(reportId || null);
      if (reportId) {
        const found = getReports().find(r => r.id === reportId);
        if (found) {
          const dx = (50 - found.x) * 6;
          const dy = (50 - found.y) * 6;
          setMapPan({ x: dx, y: dy });
          setZoomLevel(1.5);
        }
      }
    };
    const handleResetMap = () => {
      setZoomLevel(1);
      setMapPan({ x: 0, y: 0 });
      setSelectedReportId(null);
      setMapLayer('satellite');
    };

    const handleSettingsUpdate = () => {
      setSettings(getSettings());
    };

    window.addEventListener('roadwatch-reports-updated', handleSync);
    window.addEventListener('roadwatch-repairs-updated', handleSync);
    window.addEventListener('roadwatch-start-simulation', handleStartSim);
    window.addEventListener('roadwatch-search', handleSearch);
    window.addEventListener('roadwatch-select-report', handleSelectReport);
    window.addEventListener('roadwatch-reset-map', handleResetMap);
    window.addEventListener('roadwatch-settings-updated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
      window.removeEventListener('roadwatch-repairs-updated', handleSync);
      window.removeEventListener('roadwatch-start-simulation', handleStartSim);
      window.removeEventListener('roadwatch-search', handleSearch);
      window.removeEventListener('roadwatch-select-report', handleSelectReport);
      window.removeEventListener('roadwatch-reset-map', handleResetMap);
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // Update clock & wiggling telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setAiAccuracy(prev => {
        const delta = (Math.random() - 0.5) * 0.1;
        const next = prev + delta;
        return parseFloat(Math.min(99.4, Math.max(97.8, next)).toFixed(2));
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Map drag handlers
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
      const maxPanX = (zoomLevel - 1) * 350;
      const maxPanY = (zoomLevel - 1) * 350;
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

  const showToast = (message: string, type: 'alert' | 'success' | 'info' = 'info') => {
    setJustNotification({ message, type });
    setTimeout(() => setJustNotification(null), 4000);
  };

  // Authority Action Panel operations
  const handleVerify = (id: string) => {
    updateReportStatus(id, { status: 'Verified' });
    showToast('Hazard Verified Successfully', 'success');
  };

  const handleAssign = (id: string, team: string) => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    updateReportStatus(id, { 
      status: 'Assigned',
      assignedTeam: team,
      startDate: todayStr,
      estimatedCompletionDate: todayStr
    });
    showToast(`Assigned ${team} for dispatch.`, 'success');
  };

  const handleStartRepair = (id: string) => {
    updateReportStatus(id, { status: 'In Progress' });
    showToast('Crew deployed on site. Repairs active.', 'success');
  };

  const handleResolve = (id: string) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;
    storageResolveReport(id);
    const start = report.startedAt || (report.timestamp ? new Date(report.timestamp).getTime() : Date.now() - 42 * 60 * 1000);
    const durationMins = Math.max(1, Math.round((Date.now() - start) / 60000));
    const durationStr = `${durationMins} Minutes`;

    showToast(`✅ Hazard Resolved\n${report.title}\nResolved by ${report.assignedTeam || 'Team Gamma'}\nDuration: ${durationStr}`, 'success');
  };

  const handleClearAllResolved = async () => {
    try {
      await reportsApi.clearCompleted();
    } catch (err) {
      console.warn("Backend clear completed reports failed, falling back to local deletion:", err);
    }
    
    const resolved = reports.filter(r => r.resolved || r.status === 'Resolved');
    resolved.forEach(r => {
      deleteReport(r.id);
    });

    showToast('All resolved hazards have been cleared.', 'success');
    setShowClearConfirmation(false);
  };

  const handleCitizenVerify = (id: string, rating: number, feedback: string) => {
    verifyRepair(id, rating, feedback);
    showToast('Citizen feedback registered. Satisfaction score updated!', 'success');
    setFeedbackText('');
  };

  // Generate isolated citizen report
  const simulateNewHazard = () => {
    const template = DEMO_TEMPLATES[Math.floor(Math.random() * DEMO_TEMPLATES.length)];
    
    const newComp = addComplaint({
      title: template.title,
      locationName: template.location,
      priority: template.severity === 'Critical' ? 'Critical' : template.severity === 'Active' ? 'High' : 'Medium',
      hazardType: template.icon === 'alert' ? 'Pothole' : template.icon === 'droplets' ? 'Waterlogging' : 'Road Blockage',
      description: template.description,
      imageUrl: template.imageUrl,
      lat: template.lat,
      lng: template.lng,
      x: template.x,
      y: template.y
    });

    const reportId = `rep-from-${newComp.id}`;
    setSelectedReportId(reportId);
    showToast(`🚨 New Complaint: ${template.title} at ${template.location}`, 'alert');
  };

  // Reset simulator
  const resetDemoState = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setSimActive(false);
    setSimStep(-1);
    setSimReportId(null);
    setSimLogs([]);
    setSimTemplate(null);
    setReports(loadReportsFromStorage());
  };

  // 9-Stage playthrough playbook
  const runDemoStep = (stepIndex: number, currentReportId: string | null, activeTemplate?: any) => {
    let nextReportId = currentReportId;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const currentTemplate = activeTemplate || simTemplate;

    switch (stepIndex) {
      case 0: { // 1. Citizen Uploads Image
        const t = currentTemplate || DEMO_TEMPLATES[0];
        const newComp = addComplaint({
          title: t.title,
          locationName: t.location,
          priority: t.severity === 'Critical' ? 'Critical' : t.severity === 'Active' ? 'High' : 'Medium',
          hazardType: t.icon === 'alert' ? 'Pothole' : t.icon === 'droplets' ? 'Waterlogging' : 'Road Blockage',
          description: t.description,
          imageUrl: t.imageUrl,
          lat: t.lat,
          lng: t.lng,
          x: t.x,
          y: t.y
        });
        nextReportId = `rep-from-${newComp.id}`;
        setSelectedReportId(nextReportId);
        setSimReportId(nextReportId);
        setMapPan({ x: (50 - t.x) * 6, y: (50 - t.y) * 6 });
        setZoomLevel(1.5);
        setSimLogs(prev => [...prev, `✓ Step 1: Citizen uploaded visual evidence for "${t.title}".`]);
        showToast(`Step 1: Citizen reported ${t.title}.`, 'alert');
        break;
      }
      case 1: { // 2. AI Detects Hazard
        if (currentReportId) {
          updateReportStatus(currentReportId, { status: 'Verified' });
          setSimLogs(prev => [...prev, '✓ Step 2: YOLOv8 Computer Vision processed evidence, matching details.']);
          showToast('Step 2: AI validated hazard boundary logs.', 'info');
        }
        break;
      }
      case 2: { // 3. Hazard Appears on Map
        setMapLayer('heatmap');
        setSimLogs(prev => [...prev, '✓ Step 3: Coordinates pinned onto operational GIS heatmap.']);
        showToast('Step 3: Hazard pinned on live heatmap.', 'info');
        break;
      }
      case 3: { // 4. Priority Score Generated
        if (currentReportId && currentTemplate) {
          updateReportStatus(currentReportId, {
            status: 'Verified',
            priorityScore: currentTemplate.priorityScore,
            estimatedRisk: currentTemplate.estimatedRisk,
            recommendedRepairTime: currentTemplate.recommendedRepairTime
          });
          setSimLogs(prev => [...prev, `✓ Step 4: AI Priority algorithm scored severity at ${currentTemplate.priorityScore}/100.`]);
          showToast(`Step 4: Priority Score (${currentTemplate.priorityScore}/100) generated.`, 'info');
        }
        break;
      }
      case 4: { // 5. Authority Assigns Team
        if (currentReportId) {
          updateReportStatus(currentReportId, { 
            status: 'Assigned',
            assignedTeam: 'Team Gamma (Rapid Response)',
            startDate: todayStr,
            estimatedCompletionDate: todayStr
          });
          setSimLogs(prev => [...prev, '✓ Step 5: Authority approved dispatch. Crew Team Gamma assigned.']);
          showToast('Step 5: Team Gamma crew assigned.', 'info');
        }
        break;
      }
      case 5: { // 6. Repair Starts
        if (currentReportId) {
          updateReportStatus(currentReportId, { status: 'Repairing' });
          setSimLogs(prev => [...prev, '✓ Step 6: Team Gamma arrived on-site. Resurfacing active.']);
          showToast('Step 6: Resurfacing in progress.', 'info');
        }
        break;
      }
      case 6: { // 7. Repair Completes (Before/After Images Generated)
        if (currentReportId) {
          storageResolveReport(currentReportId);
          setSimLogs(prev => [...prev, '✓ Step 7: Asphalt paving complete. Before/After overlay loaded.']);
          showToast('Step 7: Repair completed successfully.', 'success');
        }
        break;
      }
      case 7: { // 8. Citizen Verifies Repair
        if (currentReportId) {
          verifyRepair(currentReportId, 5, 'Resolution verified. Excellent smoothing work.');
          setSimLogs(prev => [...prev, '✓ Step 8: Citizen verified repaving quality: 5 Stars.']);
          showToast('Step 8: Citizen verified clean road.', 'success');
        }
        break;
      }
      case 8: { // 9. Impact Dashboard Updates
        setSimLogs(prev => [...prev, '✓ Step 9: Safety scores recalculated. Playthrough successfully completed.']);
        showToast('Step 9: Impact dashboard counters recalculated!', 'success');
        setSimActive(false);
        break;
      }
      default:
        break;
    }

    setReports(loadReportsFromStorage());
    return nextReportId;
  };

  const startSimulation = () => {
    resetDemoState();
    setSimActive(true);
    setSimStep(0);
    
    const chosenTemplate = DEMO_TEMPLATES[Math.floor(Math.random() * DEMO_TEMPLATES.length)];
    setSimTemplate(chosenTemplate);
    
    let step = 0;
    let repId: string | null = null;
    
    repId = runDemoStep(0, null, chosenTemplate);

    simTimerRef.current = setInterval(() => {
      step += 1;
      if (step < 9) {
        setSimStep(step);
        repId = runDemoStep(step, repId);
      } else {
        resetDemoState();
      }
    }, 12000);
  };

  // Metrics for Impact Dashboard
  const activeReports = reports.filter(r => !r.resolved);
  const filteredActiveReports = activeReports.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.severity.toLowerCase().includes(q) ||
      (r.source && r.source.toLowerCase().includes(q))
    );
  });

  const filteredFeedReports = reports
    .filter(r => !r.resolved && r.status !== 'Resolved')
    .filter(r => {
      // 1. Filter by allowed sources
      const isCitizenPortal = r.source === 'Citizen Portal';
      const isReportForm = r.source === 'Citizen Report' || r.source === 'AI Detected (Citizen)';
      
      const sourceLower = (r.source || '').toLowerCase();
      const isAiPipeline = (sourceLower.includes('ai') || sourceLower.includes('edge') || sourceLower.includes('camera') || sourceLower.includes('sensor')) && 
                           sourceLower !== 'ai detected (citizen)' && 
                           sourceLower !== 'citizen report' &&
                           sourceLower !== 'citizen portal';

      const isValidSource = isCitizenPortal || isReportForm || (isAiPipeline && settings.aiAnalysisDepth);
      if (!isValidSource) return false;

      // 2. Filter by severity
      if (feedSeverityFilter !== 'All') {
        const severityMap = {
          'Critical': 'Critical',
          'High': 'Active',
          'Medium': 'Pending',
          'Low': 'Scheduled'
        };
        if (r.severity !== severityMap[feedSeverityFilter]) return false;
      }

      // 3. Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.severity.toLowerCase().includes(q) ||
          (r.source && r.source.toLowerCase().includes(q))
        );
      }

      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const resolvedReports = reports
    .filter(r => r.resolved || r.status === 'Resolved')
    .sort((a, b) => {
      const timeA = a.resolvedAt || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const timeB = b.resolvedAt || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return timeB - timeA;
    });

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const resolvedTodayCount = resolvedReports.filter(r => r.actualCompletionDate === todayStr).length;

  const parsedTimes = resolvedReports.map(r => parseInt(r.resolutionTime || '42')).filter(t => !isNaN(t));
  const avgResolutionTime = parsedTimes.length > 0 
    ? Math.round(parsedTimes.reduce((sum, t) => sum + t, 0) / parsedTimes.length) 
    : 42;

  const successRate = reports.length > 0 
    ? Math.round((resolvedReports.length / reports.length) * 100) 
    : 100;

  const totalDetectedCount = reports.length;
  const totalRepairedCount = resolvedReports.length;
  const activeCount = activeReports.length;
  
  const calculateSafetyScore = () => {
    let score = 96;
    activeReports.forEach(r => {
      if (r.severity === 'Critical') score -= 3.5;
      else if (r.severity === 'Active') score -= 1.8;
      else score -= 0.8;
    });
    return Math.round(Math.min(100, Math.max(45, score)));
  };
  
  const roadSafetyScore = calculateSafetyScore();
  const estimatedAccidentReduction = totalRepairedCount > 0 
    ? Math.min(88, Math.round(totalRepairedCount * 2.4 + 28)) 
    : 24;

  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Authority Action columns
  const reviewAndVerifyReports = activeReports
    .filter(r => r.status === 'Detected' || r.status === 'Verified')
    .sort((a, b) => {
      const severityOrder: Record<string, number> = {
        'Critical': 1,
        'Active': 2,
        'Pending': 3,
        'Scheduled': 4
      };
      const orderA = severityOrder[a.severity] || 5;
      const orderB = severityOrder[b.severity] || 5;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

  const dispatchQueueReports = activeReports.filter(r => r.status === 'Assigned');
  const waitingQueueReports = sortQueuedHazards(activeReports.filter(r => r.status === 'Queued'));
  
  const activeRepairsReports = activeReports.filter(r => 
    r.status === 'In Progress' || r.status === 'Delayed' || r.status === 'Awaiting Resolution' || r.status === 'Repairing'
  );

  return (
    <div className="p-6 max-w-[1440px] mx-auto pb-24 animate-fade-in-up space-y-6">
      
      {/* Toast */}
      {justNotification && (
        <div className={`fixed bottom-6 right-6 z-[100] bg-deep-slate text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in-up border max-w-sm transition-all duration-300 ${
          justNotification.type === 'success' ? 'border-green-500/30' : justNotification.type === 'alert' ? 'border-red-500/30' : 'border-white/10'
        }`}>
          <div className="relative w-3.5 h-3.5 flex-shrink-0">
            {justNotification.type === 'success' ? (
              <span className="text-green-400">✓</span>
            ) : justNotification.type === 'alert' ? (
              <span className="text-red-500 font-bold">!</span>
            ) : (
              <span className="text-blue-400">ℹ</span>
            )}
          </div>
          <div className="flex-1 text-xs font-semibold tracking-wide whitespace-pre-line">
            {justNotification.message}
          </div>
        </div>
      )}

      {/* 0. OPERATIONS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            City Operations Overview
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 font-medium">
            Real-time monitoring, AI risk auditing, and decision support console.
          </p>
        </div>
        <Link 
          to="/municipal" 
          className="flex items-center justify-center gap-2 bg-safety-yellow hover:bg-yellow-400 text-primary font-black px-6 py-3 rounded-xl transition-all shadow-md text-xs tracking-wider uppercase cursor-pointer"
        >
          Open Operations Center <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 1. IMPACT DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Road Safety Score</span>
            <div className="text-2xl font-black text-primary flex items-baseline">
              {roadSafetyScore}<span className="text-xs opacity-50 font-normal">/100</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${roadSafetyScore >= 80 ? 'bg-green-500' : roadSafetyScore >= 70 ? 'bg-safety-yellow' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-text-secondary">
              {roadSafetyScore >= 80 ? 'Good Standing' : roadSafetyScore >= 70 ? 'Warning' : 'Critical Hazard'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Total Detected</span>
            <div className="text-2xl font-black text-primary">{totalDetectedCount}</div>
          </div>
          <span className="text-[10px] text-text-secondary font-semibold mt-2">Incidents filed to date</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Resolved Hazards</span>
            <div className="text-2xl font-black text-green-600 flex items-center gap-1.5">
              {totalRepairedCount}
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <span className="text-[10px] text-green-600 font-bold mt-2">100% Quality Audited</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Active Hazards</span>
            <div className="text-2xl font-black text-red-500">{activeCount}</div>
          </div>
          <span className="text-[10px] text-red-500 font-bold mt-2">Awaiting crew dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Mean Resolve Time</span>
            <div className="text-2xl font-black text-primary flex items-baseline">
              {meanResolveTime}<span className="text-xs font-semibold ml-0.5 text-text-secondary">Mins</span>
            </div>
          </div>
          <span className="text-[10px] text-green-600 font-bold mt-2">⚡ Peak dispatch speed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Accident Reduction</span>
            <div className="text-2xl font-black text-primary">
              -{estimatedAccidentReduction}%
            </div>
          </div>
          <span className="text-[10px] text-text-secondary font-semibold mt-2">Est. risk mitigation</span>
        </div>
      </div>

      {/* 2. LIVE SIMULATION TRACKER BANNER */}
      {simActive && (
        <div className="bg-gradient-to-r from-deep-slate to-slate-900 text-white rounded-xl p-5 shadow-lg border border-orange-500/30 flex flex-col md:flex-row gap-5 justify-between items-center animate-fade-in-up">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
              <span className="text-xs font-black tracking-widest text-orange-400 uppercase">Interactive Show Playthrough</span>
              <span className="bg-orange-500/20 text-orange-300 text-[10px] font-black px-2 py-0.5 rounded border border-orange-500/25">Step {simStep + 1} of 9</span>
            </div>
            <h4 className="text-lg font-bold">{SIM_STEPS[simStep]?.label}</h4>
            <p className="text-xs text-slate-300">{SIM_STEPS[simStep]?.desc}</p>
            
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3 max-w-lg">
              <div 
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${((simStep + 1) / 9) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-full md:w-80 bg-black/45 border border-white/5 rounded-lg p-3 max-h-32 overflow-y-auto text-[10px] font-mono text-slate-300 custom-scrollbar space-y-1">
            <div className="text-[9px] text-slate-400 border-b border-white/10 pb-1 mb-1 font-bold">SIMULATOR ACTION LOGS</div>
            {simLogs.map((log, idx) => (
              <div key={idx} className={idx === simLogs.length - 1 ? "text-orange-400 font-bold" : "text-green-400"}>
                {log}
              </div>
            ))}
          </div>

          <button 
            onClick={resetDemoState}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Stop Demo
          </button>
        </div>
      )}

      {/* 3. SPLIT MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_436px] gap-6">
        
        {/* Left Columns (Map, KanBan, Before/After) */}
        <div className="space-y-6">
          
          {/* Map Card */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden relative group h-[350px] transition-all hover:shadow-md">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              <div className="glass-card px-3 py-1.5 rounded-lg flex items-center gap-2.5 shadow-sm bg-white/95">
                <span className="w-2 h-2 rounded-full bg-safety-yellow animate-ping"></span>
                <span className="text-xs font-bold text-primary">Heatmap View: Central District</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={toggleMapLayer}
                  className={`bg-white/95 backdrop-blur shadow-sm hover:bg-white transition-all border border-border-subtle flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer ${
                    mapLayer !== 'satellite' ? 'text-primary border-primary bg-yellow-50/50' : 'text-text-secondary'
                  }`}
                  title="Toggle map layer"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button onClick={handleZoomIn} className="bg-white/95 backdrop-blur shadow-sm w-8 h-8 rounded-lg text-text-secondary flex items-center justify-center cursor-pointer">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={handleZoomOut} className="bg-white/95 backdrop-blur shadow-sm w-8 h-8 rounded-lg text-text-secondary flex items-center justify-center cursor-pointer">
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* REAL GOOGLE MAP CONTAINER */}
            {apiLoaded && !isSandboxMode ? (
              <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100" />
            ) : (
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
                    alt="City Grid"
                    draggable="false"
                  />

                  {mapLayer === 'heatmap' && (
                    <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-80 animate-pulse bg-gradient-to-tr from-red-500/10 via-yellow-500/5 to-transparent">
                      {filteredActiveReports.map(r => (
                        <div 
                          key={`heat-${r.id}`}
                          className="absolute rounded-full filter blur-xl"
                          style={{
                            top: `${r.y}%`,
                            left: `${r.x}%`,
                            width: r.severity === 'Critical' ? '120px' : '80px',
                            height: r.severity === 'Critical' ? '120px' : '80px',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: r.severity === 'Critical' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.35)',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {filteredActiveReports.map((report) => {
                    const isSelected = selectedReportId === report.id;
                    const isCritical = report.severity === 'Critical';
                    const colorClass = isCritical ? 'bg-red-600 border-white text-white' : 'bg-safety-yellow border-black text-primary';
                    
                    return (
                      <div 
                        key={report.id}
                        className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 ${
                          isSelected ? 'scale-130 z-30' : 'hover:scale-115'
                        }`}
                        style={{ top: `${report.y}%`, left: `${report.x}%` }}
                        onClick={() => setSelectedReportId(report.id)}
                        onMouseEnter={() => setHoveredReportId(report.id)}
                        onMouseLeave={() => setHoveredReportId(null)}
                      >
                        <div className={`absolute inset-0 rounded-full animate-ping ${isCritical ? 'bg-red-600/30' : 'bg-safety-yellow/30'}`}></div>
                        <div className={`absolute inset-1 rounded-full border-2 shadow flex items-center justify-center text-xs font-bold ${colorClass}`}>
                          <span>{isCritical ? '!' : '•'}</span>
                        </div>

                        {(hoveredReportId === report.id || isSelected) && !selectedReport && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-44 bg-white rounded-lg shadow-xl border border-border-subtle p-2 pointer-events-none animate-fade-in-up">
                            <p className="text-[10px] font-black text-primary truncate leading-tight">{report.title}</p>
                            <p className="text-[8px] text-text-secondary mt-0.5 truncate">{report.location}</p>
                          </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REAL GOOGLE MAP CUSTOM MARKERS */}
          {apiLoaded && !isSandboxMode && map && filteredActiveReports.map((report) => {
            const isSelected = selectedReportId === report.id;
            const isCritical = report.severity === 'Critical';
            const colorClass = isCritical ? 'bg-red-600 border-white text-white' : 'bg-safety-yellow border-black text-primary';
            
            return (
              <GoogleMapPortalOverlay
                key={`map-overlay-${report.id}`}
                map={map}
                position={{ lat: report.lat || 1.2950, lng: report.lng || 103.8500 }}
              >
                <div 
                  className={`relative w-8 h-8 cursor-pointer transition-all duration-300 z-20 ${
                    isSelected ? 'scale-130 z-30' : 'hover:scale-115'
                  }`}
                  onClick={() => setSelectedReportId(report.id)}
                  onMouseEnter={() => setHoveredReportId(report.id)}
                  onMouseLeave={() => setHoveredReportId(null)}
                >
                  <div className={`absolute inset-0 rounded-full animate-ping ${isCritical ? 'bg-red-600/30' : 'bg-safety-yellow/30'}`}></div>
                  <div className={`absolute inset-1 rounded-full border-2 shadow flex items-center justify-center text-xs font-bold ${colorClass}`}>
                    <span>{isCritical ? '!' : '•'}</span>
                  </div>

                  {(hoveredReportId === report.id || isSelected) && !selectedReport && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-44 bg-white rounded-lg shadow-xl border border-border-subtle p-2 pointer-events-none animate-fade-in-up">
                      <p className="text-[10px] font-black text-primary truncate leading-tight">{report.title}</p>
                      <p className="text-[8px] text-text-secondary mt-0.5 truncate">{report.location}</p>
                    </div>
                  )}
                </div>
              </GoogleMapPortalOverlay>
            );
          })}

          {selectedReport && (
              <div className="absolute top-4 right-4 z-20 glass-card p-3 rounded-xl max-w-[240px] shadow-lg animate-fade-in-up border border-border-subtle bg-white/95">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-primary text-xs tracking-tight truncate flex-1">{selectedReport.title}</h4>
                  <button onClick={() => setSelectedReportId(null)} className="text-[10px] text-text-secondary hover:text-primary font-bold ml-2">✕</button>
                </div>
                <p className="text-[10px] text-text-secondary truncate mb-2">{selectedReport.location}</p>
                <div className="flex gap-1.5 items-center mb-2.5">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedReport.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedReport.severity}
                  </span>
                  <span className="text-[8px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-medium">{selectedReport.status}</span>
                </div>
                
                {selectedReport.status !== 'Resolved' && (
                  <Link 
                    to="/municipal"
                    className="w-full bg-slate-900 hover:bg-black text-white h-7 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    Open in Operations Center →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 4. OPERATIONS QUEUE MONITORING */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4 !mt-2">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-4">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-primary" /> Operations Queue Monitoring
              </h3>
              <span className="text-[9px] text-text-secondary font-semibold">Real-Time Queue Health & Distribution</span>
            </div>
            {/* ── 3-column Kanban grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

              {/* ── Column 1: Review & Verify ────────────────────────────────── */}
              <div className="min-w-0 flex flex-col bg-slate-50/50 rounded-xl border border-dashed border-border-subtle overflow-hidden" style={{ height: '460px' }}>
                {/* Lane header */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary px-3 py-2 border-b border-border-subtle bg-white/60 flex-shrink-0">
                  <span>Review & Verify</span>
                  <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-black">{reviewAndVerifyReports.length}</span>
                </div>

                {/* Scrollable card list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {reviewAndVerifyReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-8">No issues to review</div>
                  ) : (
                    reviewAndVerifyReports.map(r => (
                      <div key={r.id} className="w-full bg-white p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between h-[230px] hover:shadow-md transition-all duration-300 animate-fade-in-up box-border">
                        <div className="space-y-1.5 flex-1 flex flex-col justify-start min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[10px] font-bold text-primary truncate flex-1 min-w-0">{r.title}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${getStatusBadgeClass(r.status)}`}>
                              {r.status}
                            </span>
                          </div>
                          <div className="text-[9px] text-text-secondary truncate">📍 {r.location}</div>
                          <div className="flex justify-between items-center text-[8.5px] font-semibold text-text-secondary/70 pt-1 border-t border-slate-100/50">
                            <span className="truncate flex-1 min-w-0">Src: <strong className="text-primary font-bold">{r.source}</strong></span>
                            <span className="flex-shrink-0 ml-1">{formatTimeAgo(r.timestamp)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100/50 mt-auto flex-shrink-0">
                          <div className="flex justify-between items-center text-[8px] text-text-secondary gap-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                              r.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                              r.severity === 'Active' ? 'bg-orange-100 text-orange-700' :
                              r.severity === 'Pending' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {r.severity === 'Active' ? 'High' : r.severity === 'Pending' ? 'Medium' : r.severity === 'Scheduled' ? 'Low' : r.severity}
                            </span>
                            {r.status === 'Verified' && (
                              <div className="text-right min-w-0 overflow-hidden leading-tight">
                                <span className="text-[7.5px] block text-purple-600 font-bold uppercase tracking-wider truncate">AI Rec: {getAiRecommendation(r)}</span>
                                <span className="text-[7.5px] text-slate-500 block truncate">({getTeamAvailability(getAiRecommendation(r))})</span>
                              </div>
                            )}
                          </div>

                          <Link 
                            to="/municipal" 
                            className="w-full bg-slate-900 hover:bg-black text-white text-[9.5px] font-bold py-2 rounded transition-all text-center block cursor-pointer"
                          >
                            Manage in Operations Center →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Column 2: Dispatch Queue ─────────────────────────────────── */}
              <div className="min-w-0 flex flex-col bg-slate-50/50 rounded-xl border border-dashed border-border-subtle overflow-hidden" style={{ height: '460px' }}>
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary px-3 py-2 border-b border-border-subtle bg-white/60 flex-shrink-0">
                  <span>Dispatch Queue</span>
                  <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-black">{dispatchQueueReports.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {dispatchQueueReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-8">No scheduled dispatches</div>
                  ) : (
                    dispatchQueueReports.map(r => (
                      <div key={r.id} className="w-full bg-white p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between h-[230px] hover:shadow-md transition-all duration-300 animate-fade-in-up box-border">
                        <div className="space-y-1.5 flex-1 flex flex-col justify-start min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[10px] font-bold text-primary truncate flex-1 min-w-0">{r.title}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${getStatusBadgeClass(r.status)}`}>
                              {r.status}
                            </span>
                          </div>
                          <div className="text-[9px] text-text-secondary truncate">📍 {r.location}</div>

                          <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-100/50">
                            <span className="text-[8.5px] text-text-secondary truncate">Team: <strong className="text-primary font-bold">{r.assignedTeam || 'Crew Assigned'}</strong></span>
                            <span className="text-[8.5px] text-text-secondary">Est. Arrival: <strong className="text-primary font-bold">{r.severity === 'Critical' ? '12 Mins' : r.severity === 'Active' ? '25 Mins' : '45 Mins'}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1.5 border-t border-slate-100/50 mt-auto flex-shrink-0">
                          <div className="flex justify-between items-center text-[8px] text-text-secondary gap-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                              r.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                              r.severity === 'Active' ? 'bg-orange-100 text-orange-700' :
                              r.severity === 'Pending' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {r.severity === 'Active' ? 'High' : r.severity === 'Pending' ? 'Medium' : r.severity === 'Scheduled' ? 'Low' : r.severity}
                            </span>
                          </div>
                          <Link 
                            to="/municipal" 
                            className="w-full bg-slate-900 hover:bg-black text-white text-[9.5px] font-bold py-1.5 rounded transition-all text-center block whitespace-nowrap cursor-pointer"
                          >
                            Manage Dispatch →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Column 3: Waiting Queue ──────────────────────────────────── */}
              <div className="min-w-0 flex flex-col bg-slate-50/50 rounded-xl border border-dashed border-border-subtle overflow-hidden" style={{ height: '460px' }}>
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary px-3 py-2 border-b border-border-subtle bg-white/60 flex-shrink-0">
                  <span>Waiting Queue</span>
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] font-black animate-pulse">{waitingQueueReports.length}</span>
                </div>

                {waitingQueueReports.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 px-3 pt-3 flex-shrink-0">
                    <div className="bg-white p-1 rounded border border-border-subtle/50 text-center">
                      <span className="block text-[6.5px] uppercase tracking-wider text-text-secondary/60">Waiting</span>
                      <span className="text-primary font-black block text-[9px]">{waitingQueueReports.length}</span>
                    </div>
                    <div className="bg-white p-1 rounded border border-border-subtle/50 text-center">
                      <span className="block text-[6.5px] uppercase tracking-wider text-text-secondary/60">Avg Wait</span>
                      <span className="text-primary font-black block text-[9px]">
                        {Math.round(waitingQueueReports.reduce((sum, r) => sum + (now.getTime() - (r.queuedAt || now.getTime())), 0) / (waitingQueueReports.length * 60000))}m
                      </span>
                    </div>
                    <div className="bg-white p-1 rounded border border-border-subtle/50 text-center">
                      <span className="block text-[6.5px] uppercase tracking-wider text-text-secondary/60">Longest</span>
                      <span className="text-red-600 font-black block text-[9px]">
                        {Math.round((now.getTime() - Math.min(...waitingQueueReports.map(r => r.queuedAt || now.getTime()))) / 60000)}m
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {waitingQueueReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-8">Queue is empty</div>
                  ) : (
                    waitingQueueReports.map((r, qIndex) => {
                      const waitTimeMs = now.getTime() - (r.queuedAt || Date.now());
                      const waitTimeMins = Math.max(1, Math.round(waitTimeMs / 60000));
                      const isSlaBreached = r.severity === 'Critical' && waitTimeMins >= 2;

                      return (
                        <div key={r.id} className="w-full bg-white p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between h-[230px] hover:shadow-md transition-all duration-300 animate-fade-in-up box-border">
                          <div className="space-y-1.5 flex-1 flex flex-col justify-start min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] font-bold text-primary truncate flex-1 min-w-0">{r.title}</span>
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                                #{qIndex + 1}
                              </span>
                            </div>

                            <div className="text-[9px] text-text-secondary truncate">📍 {r.location}</div>

                            <div className="flex justify-between items-center text-[8.5px] font-semibold text-text-secondary/70 pt-1 border-t border-slate-100/50">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                                r.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                r.severity === 'Active' ? 'bg-orange-100 text-orange-700' :
                                r.severity === 'Pending' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {r.severity === 'Active' ? 'High' : r.severity === 'Pending' ? 'Medium' : r.severity === 'Scheduled' ? 'Low' : r.severity}
                              </span>
                              <span className="text-purple-600 font-bold">Risk: {r.priorityScore || 50}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100/50 mt-auto flex-shrink-0">
                            <div className="flex items-center justify-between text-[8.5px] font-semibold">
                              <span className="text-text-secondary">Reports: {r.citizenReportsCount || 1}</span>
                              <span className="text-orange-600 font-black animate-pulse">{waitTimeMins}m waiting</span>
                            </div>

                            {isSlaBreached && (
                              <div className="bg-red-50 border border-red-200 rounded p-1 text-[8px] text-red-700 font-black text-center animate-pulse">
                                ⚠️ SLA Breach: Delayed Dispatch!
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* 4.5. ACTIVE REPAIRS */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <HardHat className="w-4 h-4 text-primary animate-pulse" /> Active Repairs
              </h3>
              <span className="text-[9px] text-text-secondary font-semibold">Track & Manage Ongoing Operations</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {activeRepairsReports.length === 0 ? (
                <div className="col-span-full text-center text-xs text-text-secondary py-8 bg-slate-50/50 rounded-xl border border-dashed border-border-subtle">
                  No active repairs in progress.
                </div>
              ) : (
                activeRepairsReports.map(r => {
                  const nowMs = now.getTime();
                  const elapsedMs = nowMs - (r.startedAt || nowMs);
                  const elapsedMins = Math.floor(elapsedMs / 60000);
                  const isSlaBreached = r.status !== 'Resolved' && r.startedAt && r.slaMinutes && elapsedMins >= r.slaMinutes;

                  const autoProgress = getDisplayProgress(r, nowMs);
                  const progressVal = autoProgress;
                  const isAutoDelayed = isDelayed(r, nowMs);
                  const remainingEta = Math.max(0, (r.etaMinutes || 0) - elapsedMins);

                  const barColor =
                    progressVal >= 100
                      ? 'bg-green-500'
                      : (r.status === 'Delayed' || isAutoDelayed)
                      ? 'bg-red-500'
                      : progressVal >= 80
                      ? 'bg-amber-500'
                      : 'bg-orange-500';

                  const canComplete =
                    progressVal >= 100 ||
                    ((r.status === 'Delayed' || isAutoDelayed) && progressVal >= 95);

                  return (
                    <div
                      key={r.id}
                      className={`w-full p-4 rounded-xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between h-[235px] box-border ${
                        isSlaBreached
                          ? 'border-red-500 bg-red-50/40 shadow-sm shadow-red-100/50'
                          : (r.status === 'Delayed' || isAutoDelayed)
                          ? 'border-orange-300 bg-orange-50/20'
                          : 'bg-white border-border-subtle'
                      }`}
                    >
                      <div className="space-y-2 flex-1 flex flex-col justify-start min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-primary truncate flex-1 min-w-0">{r.title}</span>
                          <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${getStatusBadgeClass(r.status)}`}>
                            {r.status === 'Repairing' ? 'In Progress' : r.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-text-secondary flex justify-between items-center gap-1">
                          <span className="truncate flex-1 min-w-0">📍 {r.location}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                            r.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            r.severity === 'Active' ? 'bg-orange-100 text-orange-700' :
                            r.severity === 'Pending' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {r.severity === 'Active' ? 'High' : r.severity === 'Pending' ? 'Medium' : r.severity === 'Scheduled' ? 'Low' : r.severity}
                          </span>
                        </div>

                        {(r.status === 'Delayed' || isAutoDelayed) && r.delayReason && (
                          <span className="text-[8px] bg-red-50 border border-red-200/50 text-red-600 px-2 py-0.5 rounded font-black block truncate" title={r.delayReason}>
                            ⚠️ {r.delayReason}
                          </span>
                        )}

                        {isAutoDelayed && r.status !== 'Delayed' && (
                          <div className="bg-orange-100 border border-orange-300 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded text-center animate-pulse truncate">
                            Overdue
                          </div>
                        )}

                        {isSlaBreached && (
                          <div className="bg-red-600 text-white font-black text-[8px] px-2 py-0.5 rounded text-center animate-pulse truncate">
                            SLA BREACH: {elapsedMins}m / {r.slaMinutes}m
                          </div>
                        )}

                        {/* Auto-progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                            <span>Progress</span>
                            <span className={progressVal >= 100 ? 'text-green-600 font-black' : progressVal >= 80 ? 'text-amber-600 font-black' : ''}>{progressVal}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-700 ease-out ${barColor}`}
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-auto flex-shrink-0 pt-2 border-t border-slate-100/50">
                        <div className="text-[10px] text-text-secondary flex justify-between items-center">
                          <span className="truncate flex-1 min-w-0">Team: <strong className="text-primary font-bold">{r.assignedTeam || 'Crew'}</strong></span>
                          <span className="flex-shrink-0 ml-1"><strong className={remainingEta === 0 ? 'text-red-600 animate-pulse' : 'text-primary'}>{remainingEta > 0 ? `${remainingEta}m left` : 'Overdue'}</strong></span>
                        </div>

                        <div className="pt-1">
                          <Link
                            to="/municipal"
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold h-8 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            View in Operations Center →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* 4.5. FIELD CREW STATUS PANEL */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <HardHat className="w-4 h-4 text-primary animate-pulse" /> Field Crew Status
              </h3>
              <span className="text-[9px] text-text-secondary font-semibold">Real-Time Dispatch Tracking</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
              {['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta'].map((team) => {
                const teamReports = reports.filter(r => 
                  r.assignedTeam === team && 
                  !r.resolved && 
                  r.status !== 'Resolved' && 
                  r.status !== 'Completed' &&
                  (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Repairing' || r.status === 'Delayed' || r.status === 'Awaiting Resolution')
                );
                const activeCount = teamReports.length;
                const isExpanded = !!expandedTeams[team];

                let statusText = 'Available';
                let dotColorClass = 'bg-green-500';
                let pingColorClass = 'bg-green-400';
                let badgeColorClass = 'bg-green-50 text-green-700 border-green-200';

                if (activeCount > 0) {
                  const hasInProgress = teamReports.some(r => r.status === 'In Progress' || r.status === 'Repairing');
                  const hasCritical = teamReports.some(r => r.severity === 'Critical');
                  const hasDelayed = teamReports.some(r => r.status === 'Delayed');
                  const hasAwaiting = teamReports.some(r => r.status === 'Awaiting Resolution');

                  if (hasCritical) {
                    statusText = 'Emergency Response';
                    dotColorClass = 'bg-red-500';
                    pingColorClass = 'bg-red-400';
                    badgeColorClass = 'bg-red-50 text-red-700 border-red-200';
                  } else if (hasDelayed) {
                    statusText = 'Delayed';
                    dotColorClass = 'bg-rose-500';
                    pingColorClass = 'bg-rose-400';
                    badgeColorClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (hasInProgress) {
                    statusText = 'Repairing';
                    dotColorClass = 'bg-orange-500';
                    pingColorClass = 'bg-orange-400';
                    badgeColorClass = 'bg-orange-50 text-orange-700 border-orange-200';
                  } else if (hasAwaiting) {
                    statusText = 'Awaiting QA';
                    dotColorClass = 'bg-cyan-500';
                    pingColorClass = 'bg-cyan-400';
                    badgeColorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                  } else {
                    statusText = 'Traveling';
                    dotColorClass = 'bg-yellow-500';
                    pingColorClass = 'bg-yellow-400';
                    badgeColorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                  }
                }

                const toggleTeamExpand = () => {
                  if (activeCount > 1) {
                    setExpandedTeams(prev => ({ ...prev, [team]: !prev[team] }));
                  }
                };

                const renderTaskItem = (r: Report) => {
                  const elapsedMs = now.getTime() - (r.startedAt || now.getTime());
                  const elapsedMins = Math.floor(elapsedMs / 60000);
                  const remainingEta = Math.max(0, (r.etaMinutes || 0) - elapsedMins);
                  const progressVal = getDisplayProgress(r, now.getTime());
                  const isAutoDelayed = isDelayed(r, now.getTime());

                  let etaText = 'Pending';
                  if (r.status === 'Assigned') {
                    etaText = r.severity === 'Critical' ? '12m ETA' : r.severity === 'Active' ? '25m ETA' : '45m ETA';
                  } else if (remainingEta > 0) {
                    etaText = `${remainingEta}m left`;
                  } else {
                    etaText = 'Overdue';
                  }

                  return (
                    <div key={r.id} className="pt-2 border-t border-slate-100 first:border-0 first:pt-0 space-y-1 text-xs text-left">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold text-primary truncate flex-1 min-w-0" title={r.title}>{r.title}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 leading-none ${getStatusBadgeClass(r.status)}`}>
                          {r.status === 'Repairing' ? 'In Progress' : r.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-text-secondary gap-1">
                        <span className="truncate flex-1 min-w-0">📍 {r.location}</span>
                        <span className={`font-bold flex-shrink-0 ${remainingEta === 0 && r.status !== 'Assigned' ? 'text-red-600 animate-pulse font-black' : 'text-primary'}`}>{etaText}</span>
                      </div>

                      {r.status !== 'Assigned' && (
                        <div className="space-y-0.5 pt-0.5">
                          <div className="flex justify-between items-center text-[8px] text-text-secondary font-bold">
                            <span>Progress</span>
                            <span className={progressVal >= 100 ? 'text-green-600 font-black' : ''}>{progressVal}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                progressVal >= 100 ? 'bg-green-500' : (r.status === 'Delayed' || isAutoDelayed) ? 'bg-red-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div 
                    key={team} 
                    onClick={toggleTeamExpand}
                    className={`bg-slate-50/50 p-3.5 rounded-xl border border-border-subtle hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between space-y-3 select-none ${
                      activeCount > 1 ? 'cursor-pointer hover:border-purple-300 shadow-sm bg-white/40' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black text-primary">{team}</span>
                        <span className="text-[8px] text-text-secondary/70 font-semibold mt-0.5">Capacity: {activeCount}/2</span>
                        {activeCount > 0 && (
                          <span className="text-[8px] text-purple-600 font-bold">Active Tasks: {activeCount}</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${badgeColorClass}`}>
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColorClass}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClass}`}></span>
                        </span>
                        <span>{statusText}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-2.5">
                      {activeCount === 0 ? (
                        <div className="text-center py-4 text-text-secondary/50 italic text-[10px]">
                          Available (On Standby)
                        </div>
                      ) : isExpanded ? (
                        <div className="space-y-3">
                          {teamReports.map(r => renderTaskItem(r))}
                          <div className="pt-2 border-t border-slate-100 flex justify-end items-center text-[8.5px] font-black text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-wider">
                            <div className="flex items-center gap-0.5">
                              <span>Collapse</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {renderTaskItem(teamReports[0])}
                          {activeCount > 1 && (
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[8.5px] font-black text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-wider">
                              <span>+ {activeCount - 1} more active task{activeCount - 1 > 1 ? 's' : ''}</span>
                              <div className="flex items-center gap-0.5">
                                <span>Expand</span>
                                <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>



        </div>

        {/* Right Column (Demo control, Live feed, Risk insights) */}
        <div className="space-y-6">
          
          {/* A. HACKATHON DEMO MODE SIMULATOR */}
          <div className="bg-gradient-to-tr from-red-500/10 via-orange-500/5 to-transparent border border-orange-500/20 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-primary flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4.5 h-4.5 text-orange-600 animate-pulse" /> 9-Stage Demo Playthrough
              </h3>
              <p className="text-[10px] text-text-secondary mt-0.5 leading-normal">
                Click below to start the automatic simulation detailing the entire citizen-to-authority safety loop in 2 minutes.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={startSimulation}
                className="flex-grow flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black py-2.5 rounded-lg text-xs shadow hover:shadow-lg hover:scale-102 transition-all duration-200 active:scale-97 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Activate Simulation
              </button>
              
              <button 
                onClick={simulateNewHazard}
                className="bg-white hover:bg-slate-50 text-text-secondary hover:text-primary px-3 rounded-lg border border-border-subtle transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                title="Simulate isolated citizen upload"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. LIVE REPORTS FEED */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-sm flex flex-col h-[400px] overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-bright/50">
              <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                Live Reports Feed
                <span className="bg-green-100 text-green-800 text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">LIVE</span>
              </h3>
            </div>

            {/* Severity Filter Row */}
            <div className="flex gap-1.5 p-2 bg-slate-50 border-b border-border-subtle overflow-x-auto custom-scrollbar">
              {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFeedSeverityFilter(sev)}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    feedSeverityFilter === sev
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-text-secondary hover:bg-slate-100 border border-border-subtle/60'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {filteredFeedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary opacity-60">
                  <ShieldCheck className="w-8 h-8 text-green-500 mb-1" />
                  <p className="font-bold text-xs text-primary">No hazards have been reported yet.</p>
                </div>
              ) : (
                filteredFeedReports.map((report) => {
                  const isSelected = selectedReportId === report.id;
                  const isCritical = report.severity === 'Critical';
                  
                  return (
                    <div 
                      key={report.id}
                      onClick={() => setSelectedReportId(isSelected ? null : report.id)}
                      className={`p-3 transition-all rounded-xl border flex flex-col cursor-pointer ${
                        isSelected 
                          ? 'bg-yellow-50/40 border-safety-yellow shadow-md scale-[1.01]' 
                          : 'bg-white hover:bg-slate-50 border-border-subtle/50'
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          isCritical ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {report.icon === 'droplets' ? <Droplets className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-xs font-bold text-primary truncate leading-none">{report.title}</p>
                            <span className={`text-[8px] font-black px-1.5 rounded-full ${
                              report.severity === 'Critical' ? 'bg-red-100 text-red-700' : 
                              report.severity === 'Active' ? 'bg-orange-100 text-orange-700' : 
                              report.severity === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {report.severity === 'Active' ? 'High' : 
                               report.severity === 'Pending' ? 'Medium' : 
                               report.severity === 'Scheduled' ? 'Low' : 
                               report.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary truncate">📍 {report.location}</p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[8px] text-text-secondary/60 italic">Reported: {formatTimeAgo(report.timestamp)}</span>
                            <span className="text-[8px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">Status: {report.status || 'Detected'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Panel */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-border-subtle/70 animate-fade-in-up space-y-3">
                          
                          {/* 1. ROAD STATUS TRACKER */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-border-subtle">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-text-secondary">Road Status Tracker</span>
                            <div className="flex justify-between items-center relative pt-1 px-1">
                              <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                              {(['Detected', 'Verified', 'Assigned', 'Repairing', 'Resolved'] as const).map((step, idx) => {
                                const statuses = ['Detected', 'Verified', 'Assigned', 'Repairing', 'Resolved'];
                                const currentIdx = statuses.indexOf(report.status || 'Detected');
                                const isPassed = idx <= currentIdx;
                                const isCurrent = idx === currentIdx;
                                
                                return (
                                  <div key={step} className="flex flex-col items-center relative z-10">
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold transition-all ${
                                      isPassed 
                                        ? 'bg-green-600 text-white shadow-sm' 
                                        : 'bg-white text-slate-400 border border-slate-200'
                                    } ${isCurrent ? 'ring-2 ring-green-600/30' : ''}`}>
                                      {isPassed ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-[7.5px] font-bold mt-1 tracking-tighter ${
                                      isCurrent ? 'text-primary font-black' : 'text-text-secondary/70'
                                    }`}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. REPAIR TRACKING DETAILS GRID */}
                          {report.status !== 'Detected' && report.status !== 'Verified' && (
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-border-subtle space-y-2">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-text-secondary block">Repair Tracking Details</span>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px]">
                                <div>
                                  <span className="text-text-secondary block">Assigned Team:</span>
                                  <strong className="text-primary font-semibold">{report.assignedTeam || 'Pending dispatch'}</strong>
                                </div>
                                <div>
                                  <span className="text-text-secondary block">Repair Status:</span>
                                  <strong className="text-primary font-semibold">{report.status}</strong>
                                </div>
                                <div>
                                  <span className="text-text-secondary block">Start Date:</span>
                                  <strong className="text-primary font-semibold">{report.startDate || 'N/A'}</strong>
                                </div>
                                <div>
                                  <span className="text-text-secondary block">Est. Completion:</span>
                                  <strong className="text-primary font-semibold">{report.estimatedCompletionDate || 'N/A'}</strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. SMART PRIORITY CARD */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-900 text-white p-3 rounded-lg relative overflow-hidden">
                            <div className="z-10">
                              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Risk Assessment</span>
                              <div className="text-xs font-bold mt-0.5 text-orange-400 truncate">{report.estimatedRisk}</div>
                              <span className="text-[7px] text-slate-400 mt-2 block uppercase tracking-wider">Recommended window</span>
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <Clock className="w-3 h-3 text-safety-yellow" />
                                {report.recommendedRepairTime}
                              </div>
                            </div>

                            <div className="text-right flex flex-col justify-between items-end z-10 border-l border-white/10 pl-2">
                              <div>
                                <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Priority Score</span>
                                <div className="text-xl font-black text-safety-yellow leading-none">{report.priorityScore}<span className="text-[9px] font-bold text-white/50">/100</span></div>
                              </div>
                              <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded tracking-wide leading-none">{report.severity}</span>
                            </div>
                            
                            <Sparkles className="absolute -right-3 -bottom-3 w-12 h-12 text-white/5 pointer-events-none" />
                          </div>

                          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border-subtle bg-slate-50">
                            <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
                          </div>
                          
                          {report.status === 'Repairing' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(report.id);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-7.5 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Complete Repair
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PRIORITY QUEUE SECTION */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-sm flex flex-col h-[380px] overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-bright/50">
              <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
                Priority Queue
                <span className="bg-red-100 text-red-800 text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">URGENT</span>
              </h3>
              <span className="text-[9px] text-text-secondary font-semibold">Active Hazards Ranked by Urgency</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {activeReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary opacity-60">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-1" />
                  <p className="font-bold text-xs text-primary">No active hazards found.</p>
                </div>
              ) : (
                [...activeReports]
                  .sort((a, b) => calculateDynamicPriorityScore(b) - calculateDynamicPriorityScore(a))
                  .map((r) => {
                    const score = calculateDynamicPriorityScore(r);
                    let colorClass = '';
                    let scoreBadgeColor = '';
                    if (score >= 90) {
                      colorClass = 'border-red-200 bg-red-50/20 hover:bg-red-50/40 shadow-sm shadow-red-100/30';
                      scoreBadgeColor = 'bg-red-100 text-red-700 border-red-200/60';
                    } else if (score >= 70) {
                      colorClass = 'border-orange-200 bg-orange-50/20 hover:bg-orange-50/40 shadow-sm shadow-orange-100/30';
                      scoreBadgeColor = 'bg-orange-100 text-orange-700 border-orange-200/60';
                    } else if (score >= 40) {
                      colorClass = 'border-amber-200 bg-amber-50/20 hover:bg-amber-50/40 shadow-sm shadow-amber-100/30';
                      scoreBadgeColor = 'bg-amber-100 text-amber-700 border-amber-200/60';
                    } else {
                      colorClass = 'border-slate-200 bg-slate-50/20 hover:bg-slate-50/40';
                      scoreBadgeColor = 'bg-slate-100 text-slate-500 border-slate-200/60';
                    }

                    return (
                      <div 
                        key={r.id}
                        className={`p-3 border rounded-xl flex flex-col transition-all cursor-pointer ${colorClass}`}
                        onClick={() => setSelectedReportId(r.id)}
                      >
                        <div className="flex gap-2.5">
                          <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center border font-black ${scoreBadgeColor}`}>
                            <span className="text-[12px] leading-none">{score}</span>
                            <span className="text-[6.5px] uppercase tracking-tighter font-extrabold mt-0.5">Score</span>
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className="text-xs font-bold text-primary truncate leading-none">{r.title}</p>
                              <span className={`text-[8px] font-black px-1.5 rounded-full ${
                                r.severity === 'Critical' ? 'bg-red-100 text-red-700' : 
                                r.severity === 'Active' ? 'bg-orange-100 text-orange-700' : 
                                r.severity === 'Pending' ? 'bg-blue-100 text-blue-700' : 
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {r.severity === 'Active' ? 'High' : 
                                 r.severity === 'Pending' ? 'Medium' : 
                                 r.severity === 'Scheduled' ? 'Low' : 
                                 r.severity}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-secondary truncate mt-0.5">📍 {r.location}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* RECENTLY RESOLVED HAZARDS PANEL */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-sm flex flex-col h-[380px] overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-bright/50">
              <h3 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                Recently Resolved Hazards
                <span className="bg-green-100 text-green-800 text-[8px] px-1.5 py-0.5 rounded-full font-black">COMPLETED</span>
              </h3>
              {resolvedReports.length > 0 && (
                <button
                  onClick={() => setShowClearConfirmation(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer bg-red-50 hover:bg-red-100/70 px-2.5 py-1 rounded"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>

            {/* Summary Metrics Row */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border-b border-border-subtle text-center">
              <div className="bg-white p-2 rounded-lg border border-border-subtle/60">
                <span className="text-[8.5px] font-bold text-text-secondary uppercase tracking-wider block">Resolved Today</span>
                <span className="text-sm font-black text-green-600 block mt-0.5">{resolvedTodayCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-border-subtle/60">
                <span className="text-[8.5px] font-bold text-text-secondary uppercase tracking-wider block">Avg Duration</span>
                <span className="text-sm font-black text-primary block mt-0.5">{avgResolutionTime}m</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-border-subtle/60">
                <span className="text-[8.5px] font-bold text-text-secondary uppercase tracking-wider block">Success Rate</span>
                <span className="text-sm font-black text-primary block mt-0.5">{successRate}%</span>
              </div>
            </div>

            {/* Resolved Feed list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {resolvedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary opacity-60">
                  <ShieldCheck className="w-8 h-8 text-green-500 mb-1" />
                  <p className="font-bold text-xs text-primary">No resolved hazards found.</p>
                </div>
              ) : (
                resolvedReports.map((report) => (
                  <div 
                    key={report.id}
                    className="p-3 bg-white border border-border-subtle/50 rounded-xl flex flex-col hover:bg-slate-50 transition-all"
                  >
                    <div className="flex gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 border border-green-200 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-xs font-bold text-primary truncate leading-none">{report.title}</p>
                          <span className="text-[8px] font-black px-1.5 rounded-full bg-green-100 text-green-700">
                            Resolved
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary truncate">📍 {report.location}</p>
                        
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[9px] font-semibold text-text-secondary border-t border-slate-100 pt-1.5">
                          <div>
                            <span className="text-[8px] text-text-secondary/60 block">Assigned Team</span>
                            <span className="text-primary truncate block">{report.assignedTeam || 'Team Gamma (Rapid Response)'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-text-secondary/60 block">Duration</span>
                            <span className="text-primary block">{report.resolutionTime || '42 Mins'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100/50">
                          <span className="text-[8px] text-text-secondary/60 italic">Resolved: {report.actualCompletionDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* C. CITIZEN VERIFICATION FEEDBACK PANEL */}
          {selectedReport && selectedReport.status === 'Resolved' && (
            <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4 space-y-3 animate-fade-in-up">
              <h3 className="font-bold text-xs text-primary border-b border-border-subtle pb-2 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-600" /> Citizen Verification System
              </h3>
              
              {selectedReport.citizenVerified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2 text-[10.5px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-700">✓ Citizen Verified Resolution</span>
                    <span className="flex text-amber-500 font-bold">
                      {Array(selectedReport.citizenRating || 5).fill('★').join('')}
                    </span>
                  </div>
                  <p className="text-green-600 font-medium italic">"{selectedReport.citizenFeedback}"</p>
                  <div className="grid grid-cols-2 gap-2 text-center border-t border-green-200/50 pt-2 font-bold text-[9px]">
                    <div>
                      <span className="text-text-secondary block font-semibold">Satisfaction:</span>
                      <span className="text-primary text-xs">{selectedReport.satisfactionScore}%</span>
                    </div>
                    <div>
                      <span className="text-text-secondary block font-semibold">Quality Index:</span>
                      <span className="text-primary text-xs">{selectedReport.resolutionQualityScore}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[10px] text-text-secondary leading-normal">
                    This repair is resolved. Citizens can verify visual quality, submit ratings, and add notes.
                  </div>
                  
                  {/* Star Rating Select */}
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[9px] font-bold text-text-secondary uppercase">Rate Quality:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setFeedbackRating(star)} 
                          className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${star <= feedbackRating ? 'fill-amber-500' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback text */}
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Enter resolution notes, verify road smoothness..." 
                    className="w-full text-[10px] p-2 bg-slate-50 border border-border-subtle rounded-lg outline-none font-semibold"
                    rows={2}
                  />

                  {/* Follow-up image mock upload */}
                  <div className="border border-dashed border-border-subtle rounded p-2.5 text-center bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                    <span className="text-[9px] font-bold text-text-secondary">Upload Follow-up Image</span>
                  </div>

                  <button 
                    onClick={() => handleCitizenVerify(selectedReport.id, feedbackRating, feedbackText || 'Verified by Citizen. Excellent repaving work.')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 rounded-lg text-[10px] transition-colors cursor-pointer"
                  >
                    Submit Verification & Feedback
                  </button>
                </div>
              )}
            </section>
          )}

          {/* D. AI INSIGHTS PANEL */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4">
            <h3 className="font-bold text-xs text-primary border-b border-border-subtle pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-purple-600" /> AI Insights Panel
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-2.5 items-start">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-1" />
                <p className="text-[10.5px] font-semibold text-text-secondary leading-snug">
                  5 critical hazards require attention within 24 hours.
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-1" />
                <p className="text-[10.5px] font-semibold text-text-secondary leading-snug">
                  Sector 7 currently has the highest road risk score.
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-1" />
                <p className="text-[10.5px] font-semibold text-text-secondary leading-snug">
                  Repairing the top 3 hazards could reduce risk by 25%.
                </p>
              </div>
            </div>
          </section>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 max-w-sm w-full p-6 animate-fade-in-up">
            <h4 className="text-sm font-black text-primary uppercase tracking-wide flex items-center gap-1.5 text-red-600 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" /> Clear Resolved History?
            </h4>
            <p className="text-xs text-text-secondary font-medium leading-relaxed mb-6">
              Are you sure you want to permanently delete all resolved hazards from the system? This action cannot be undone and will update the database in real-time.
            </p>
            <div className="flex gap-3 justify-end text-xs font-bold">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllResolved}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crew Progress Update Modal */}
      {updatingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 max-w-md w-full p-6 animate-fade-in-up space-y-4">
            <div className="flex justify-between items-start border-b pb-2.5">
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
                className="text-text-secondary hover:text-primary font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-text-secondary">
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
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-bold text-primary outline-none focus:border-primary transition-all"
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

            <div className="flex gap-3 justify-end text-xs font-bold pt-2 border-t border-slate-100">
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
                  showToast(`Crew report updated for: ${updatingReport.title}`, 'success');
                  setUpdatingReport(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
              >
                Submit Updates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
