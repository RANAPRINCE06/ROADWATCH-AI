import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  Camera,
  Users,
  Star,
  MessageSquare
} from 'lucide-react';
import { 
  getReports, 
  getRepairs,
  resolveReport as storageResolveReport, 
  addReport as storageAddReport, 
  updateReportStatus, 
  verifyRepair,
  Report 
} from '../utils/storage';

const HAZARD_TEMPLATES = [
  { title: 'Severe Pothole', location: 'Orchard Rd Lane 2', severity: 'Critical', icon: 'alert', source: 'Citizen Portal', imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },
  { title: 'Deep Pothole', location: 'Stamford Road Crossing', severity: 'Critical', icon: 'alert', source: 'AI Camera #4', imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80' },
  { title: 'Waterlogging (10cm)', location: 'Bayfront Ave Slip Rd', severity: 'Active', icon: 'droplets', source: 'AI Detected', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80' },
  { title: 'Debris on Roadway', location: 'Nicoll Highway West', severity: 'Active', icon: 'hardhat', source: 'Citizen Portal', imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=400&q=80' }
] as const;

// Interactive Image Comparison Slider Component
function ImageComparisonSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  
  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border-subtle select-none">
      {/* Before Image */}
      <img src={beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      {/* After Image Overlay */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none" 
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={afterUrl} 
          alt="After" 
          className="absolute inset-0 w-full h-full object-cover max-w-none" 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>

      {/* Divider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow pointer-events-none" 
        style={{ left: `${sliderPos}%` }}
      />
      
      {/* Handle */}
      <div 
        className="absolute w-6 h-6 rounded-full bg-white border border-slate-300 shadow flex items-center justify-center top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-bold text-primary"
        style={{ left: `${sliderPos}%` }}
      >
        ↔
      </div>

      {/* Invisible Slider Input for Native Dragging */}
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={sliderPos} 
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" 
      />

      <span className="absolute bottom-1.5 left-2.5 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow z-10 pointer-events-none">BEFORE</span>
      <span className="absolute bottom-1.5 right-2.5 bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow z-10 pointer-events-none">AFTER</span>
    </div>
  );
}

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
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null);
  const [aiAccuracy, setAiAccuracy] = useState<number>(98.5);
  const [meanResolveTime, setMeanResolveTime] = useState<number>(42);
  const [now, setNow] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Feedback System Inputs
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);



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

    window.addEventListener('roadwatch-reports-updated', handleSync);
    window.addEventListener('roadwatch-repairs-updated', handleSync);
    window.addEventListener('roadwatch-start-simulation', handleStartSim);
    window.addEventListener('roadwatch-search', handleSearch);
    window.addEventListener('roadwatch-select-report', handleSelectReport);
    window.addEventListener('roadwatch-reset-map', handleResetMap);
    
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
    window.dispatchEvent(new CustomEvent('roadwatch-toast', { detail: { message, type } }));
  };

  // Authority Action Panel operations
  const handleVerify = (id: string) => {
    updateReportStatus(id, { status: 'Verified' });
    showToast('Verified hazard details. AI scan complete.', 'info');
  };

  const handleAssign = (id: string, team = 'Team Gamma (Rapid Response)') => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    updateReportStatus(id, { 
      status: 'Assigned',
      assignedTeam: team,
      startDate: todayStr,
      estimatedCompletionDate: todayStr
    });
    showToast(`Assigned ${team} for dispatch.`, 'info');
  };

  const handleStartRepair = (id: string) => {
    updateReportStatus(id, { status: 'Repairing' });
    showToast('Crew deployed on site. Repairs active.', 'info');
  };

  const handleResolve = (id: string) => {
    storageResolveReport(id);
    showToast('Repaving verified. Hazard marked Resolved.', 'success');
  };

  const handleCitizenVerify = (id: string, rating: number, feedback: string) => {
    verifyRepair(id, rating, feedback);
    showToast('Citizen feedback registered. Satisfaction score updated!', 'success');
    setFeedbackText('');
  };

  // Generate isolated citizen report
  const simulateNewHazard = () => {
    const template = HAZARD_TEMPLATES[Math.floor(Math.random() * HAZARD_TEMPLATES.length)];
    const x = Math.floor(Math.random() * 50) + 25;
    const y = Math.floor(Math.random() * 50) + 25;
    
    const newReport = storageAddReport({
      title: template.title,
      location: template.location,
      severity: template.severity,
      icon: template.icon,
      source: template.source,
      x,
      y,
      lat: 1.295 + (Math.random() - 0.5) * 0.02,
      lng: 103.85 + (Math.random() - 0.5) * 0.02,
      imageUrl: template.imageUrl,
      description: 'Reported via Citizen Portal mobile app. Asphalt crumbling.',
      status: 'Detected',
      priorityScore: 0,
      estimatedRisk: 'Pending Safety Audit',
      recommendedRepairTime: 'Assess Pending'
    });

    setSelectedReportId(newReport.id);
    showToast(`🚨 New Complaint: ${template.title} at ${template.location}`, 'alert');
  };

  // Reset simulator
  const resetDemoState = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setSimActive(false);
    setSimStep(-1);
    setSimReportId(null);
    setSimLogs([]);
    setReports(loadReportsFromStorage());
  };

  // 9-Stage playthrough playbook
  const runDemoStep = (stepIndex: number, currentReportId: string | null) => {
    let nextReportId = currentReportId;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    switch (stepIndex) {
      case 0: { // 1. Citizen Uploads Image
        const newRep = storageAddReport({
          title: 'Critical Asphalt Sinkhole',
          location: 'Stamford Road Crossing',
          severity: 'Critical',
          icon: 'alert',
          source: 'Citizen Portal',
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
        });
        nextReportId = newRep.id;
        setSelectedReportId(newRep.id);
        setSimReportId(newRep.id);
        setMapPan({ x: -120, y: 40 });
        setZoomLevel(1.5);
        setSimLogs(prev => [...prev, '✓ Step 1: Citizen uploaded damage photo. Registered as Detected.']);
        showToast('Step 1: Citizen uploaded Stamford Rd pothole photo.', 'alert');
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
        if (currentReportId) {
          updateReportStatus(currentReportId, {
            status: 'Verified',
            priorityScore: 94,
            estimatedRisk: 'High Accident Risk',
            recommendedRepairTime: 'Within 24 Hours'
          });
          setSimLogs(prev => [...prev, '✓ Step 4: AI Priority algorithm scored severity at 94/100 (High Risk).']);
          showToast('Step 4: Priority Score (94/100) generated.', 'info');
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
    
    let step = 0;
    let repId: string | null = null;
    
    repId = runDemoStep(0, null);

    simTimerRef.current = setInterval(() => {
      step += 1;
      if (step < 9) {
        setSimStep(step);
        repId = runDemoStep(step, repId);
      } else {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
      }
    }, 2800);
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
  const resolvedReports = reports.filter(r => r.resolved);
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
  const pendingReviewReports = activeReports.filter(r => r.status === 'Detected');
  const criticalHazardsReports = activeReports.filter(r => r.status === 'Verified');
  const scheduledRepairsReports = activeReports.filter(r => r.status === 'Assigned');
  const activeRepairsReports = activeReports.filter(r => r.status === 'Repairing');

  return (
    <div className="p-6 max-w-[1440px] mx-auto pb-24 animate-fade-in-up space-y-6">
      

      {/* 1. IMPACT DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Map, KanBan, Before/After) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map Card */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden relative group h-[420px] transition-all hover:shadow-md">
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
                  <button 
                    onClick={() => handleResolve(selectedReport.id)}
                    className="w-full bg-green-600 text-white hover:bg-green-700 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Complete Repair
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. AUTHORITY ACTION PANEL */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4 text-primary" /> Authority Action Panel
              </h3>
              <span className="text-[9px] text-text-secondary font-semibold">Simulate Operations Control</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Column 1: Review Issue / Awaiting Review */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-border-subtle flex flex-col space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-secondary px-1 border-b pb-1.5">
                  <span>Review Issue</span>
                  <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[8px]">{pendingReviewReports.length}</span>
                </div>
                
                <div className="flex-1 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pt-1">
                  {pendingReviewReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-6">All reviewed</div>
                  ) : (
                    pendingReviewReports.map(r => (
                      <div key={r.id} className="bg-white p-2.5 rounded-lg border border-border-subtle flex flex-col space-y-1.5 hover:border-primary/30 transition-colors">
                        <div className="text-[10px] font-bold text-primary truncate">{r.title}</div>
                        <div className="text-[9px] text-text-secondary truncate">{r.location}</div>
                        <button 
                          onClick={() => handleVerify(r.id)}
                          className="w-full bg-slate-900 hover:bg-black text-white text-[9px] font-bold py-1 rounded transition-colors cursor-pointer"
                        >
                          Verify Hazard
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Assign Team */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-border-subtle flex flex-col space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-secondary px-1 border-b pb-1.5">
                  <span>Assign Team</span>
                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[8px]">{criticalHazardsReports.length}</span>
                </div>

                <div className="flex-1 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pt-1">
                  {criticalHazardsReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-6">No verified hazards</div>
                  ) : (
                    criticalHazardsReports.map(r => (
                      <div key={r.id} className="bg-white p-2.5 rounded-lg border border-border-subtle flex flex-col space-y-1.5 hover:border-primary/30 transition-colors">
                        <div className="text-[10px] font-bold text-primary truncate flex justify-between items-center">
                          <span>{r.title}</span>
                          <span className={`text-[8px] px-1 rounded ${r.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.severity === 'Critical' ? 'Crit' : 'High'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleAssign(r.id)}
                          className="w-full bg-safety-yellow hover:opacity-90 text-primary text-[9px] font-black py-1 rounded transition-all cursor-pointer"
                        >
                          Assign Team Gamma
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Start Repair */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-border-subtle flex flex-col space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-secondary px-1 border-b pb-1.5">
                  <span>Start Repair</span>
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px]">{scheduledRepairsReports.length}</span>
                </div>

                <div className="flex-1 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pt-1">
                  {scheduledRepairsReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-6">No scheduled dispatches</div>
                  ) : (
                    scheduledRepairsReports.map(r => (
                      <div key={r.id} className="bg-white p-2.5 rounded-lg border border-border-subtle flex flex-col space-y-1.5 hover:border-primary/30 transition-colors">
                        <div className="text-[10px] font-bold text-primary truncate">{r.title}</div>
                        <div className="text-[8px] text-blue-600 font-bold italic truncate">{r.assignedTeam || 'Crew Assigned'}</div>
                        <button 
                          onClick={() => handleStartRepair(r.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold py-1 rounded transition-colors cursor-pointer"
                        >
                          Start Repair
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 4: Complete Repair */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-border-subtle flex flex-col space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-secondary px-1 border-b pb-1.5">
                  <span>Complete Repair</span>
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[8px] animate-pulse">{activeRepairsReports.length}</span>
                </div>

                <div className="flex-1 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pt-1">
                  {activeRepairsReports.length === 0 ? (
                    <div className="text-[9px] text-center text-text-secondary opacity-60 py-6">No active repairs</div>
                  ) : (
                    activeRepairsReports.map(r => (
                      <div key={r.id} className="bg-white p-2.5 rounded-lg border border-border-subtle flex flex-col space-y-1.5 hover:border-primary/30 transition-colors">
                        <div className="text-[10px] font-bold text-primary truncate">{r.title}</div>
                        <div className="text-[9px] text-text-secondary truncate">{r.location}</div>
                        <button 
                          onClick={() => handleResolve(r.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold py-1 rounded transition-colors cursor-pointer"
                        >
                          Complete Repair
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* 5. BEFORE & AFTER REPAIR COMPARISON */}
          <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-4">
            <h3 className="font-bold text-xs text-primary border-b border-border-subtle pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-green-600" /> Before & After Repair Comparison
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resolvedReports.length === 0 ? (
                <div className="col-span-2 text-center text-xs text-text-secondary py-8 bg-slate-50/50 rounded-xl border border-dashed border-border-subtle">
                  No resolved repairs available yet. Guide an active hazard to resolution to view details.
                </div>
              ) : (
                resolvedReports.slice(0, 2).map(r => (
                  <div key={r.id} className="border border-border-subtle rounded-xl p-3 bg-slate-50 flex flex-col space-y-3">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-[10px] font-bold text-primary truncate pr-2">{r.title}</span>
                      <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase">resolved</span>
                    </div>

                    {/* Drag-based Image Slider */}
                    <ImageComparisonSlider 
                      beforeUrl={r.beforeImageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80'} 
                      afterUrl={r.afterImageUrl || 'https://images.unsplash.com/photo-1594913785162-e6785b49eed9?auto=format&fit=crop&w=400&q=80'} 
                    />

                    <div className="space-y-1 bg-white p-2 rounded border border-border-subtle text-[9px]">
                      <div className="text-[8px] text-text-secondary font-bold uppercase tracking-wider">Repair Notes</div>
                      <p className="text-text-secondary leading-snug font-medium italic">"{r.repairNotes}"</p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-semibold text-text-secondary pt-0.5">
                      <span>Crew: <strong className="text-primary font-bold">{r.assignedTeam}</strong></span>
                      <span>Date: <strong className="text-primary font-bold">{r.actualCompletionDate}</strong></span>
                    </div>
                  </div>
                ))
              )}
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredActiveReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-text-secondary opacity-60">
                  <ShieldCheck className="w-8 h-8 text-green-500 mb-1 animate-bounce" />
                  <p className="font-bold text-xs text-primary">All Clear</p>
                  <p className="text-[10px] mt-0.5">
                    {searchQuery ? 'No active hazards match the search query.' : 'No active hazards detected in this sector.'}
                  </p>
                </div>
              ) : (
                filteredActiveReports.map((report) => {
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
                            <span className={`text-[8px] font-black px-1.5 rounded-full ${isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {report.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary truncate">{report.location} — {report.source}</p>
                          <span className="text-[8px] bg-slate-100 text-slate-700 px-1 rounded mt-1 inline-block font-medium">Status: {report.status || 'Detected'}</span>
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

    </div>
  );
}
