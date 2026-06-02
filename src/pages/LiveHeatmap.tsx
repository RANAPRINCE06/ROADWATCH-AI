import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getReports, resolveReport as storageResolveReport, addReport as storageAddReport, Report } from '../utils/storage';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  LocateFixed, 
  Play, 
  Pause, 
  AlertTriangle, 
  Droplets, 
  Hammer, 
  Plus, 
  Minus, 
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Navigation,
  RefreshCw,
  AlertCircle,
  Compass,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

// Bypass TS compilation checking for Google Maps script namespace
declare const google: any;

const histogramData = [
  12, 18, 22, 14, 10, 8, 25, 42, 65, 55, 48, 38, 44, 52, 70, 78, 88, 92, 74, 50, 42, 32, 20, 14
];

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

interface HazardMarkerData {
  id: string;
  type: 'pothole' | 'flooding' | 'obstacle';
  title: string;
  location: string;
  severity: 'High' | 'Medium' | 'Low';
  detectedTime: string;
  lat: number;
  lng: number;
  details: string;
}

// Singapore city coordinates
const initialMarkers: HazardMarkerData[] = [
  {
    id: 'm1',
    type: 'pothole',
    title: 'Severe Asphalt Pothole',
    location: 'Sector 4, Orchard Rd',
    severity: 'High',
    detectedTime: '4m ago',
    lat: 1.3048,
    lng: 103.8318,
    details: 'Large road crater, depth approx 10cm, causing lane diversions.'
  },
  {
    id: 'm2',
    type: 'flooding',
    title: 'Water Accumulation (15cm)',
    location: 'Bayfront Ave North',
    severity: 'High',
    detectedTime: '12m ago',
    lat: 1.2847,
    lng: 103.8590,
    details: 'Water pooling on left lane. Traffic speed reduced to 20 km/h.'
  },
  {
    id: 'm3',
    type: 'obstacle',
    title: 'Road Construction Works',
    location: 'Cross St Junction',
    severity: 'Medium',
    detectedTime: '1h ago',
    lat: 1.2789,
    lng: 103.8485,
    details: 'Lane narrowing due to utility maintenance. Ends in 2 days.'
  },
  {
    id: 'm4',
    type: 'pothole',
    title: 'Minor Road Surface Fissures',
    location: 'Marina Boulevard',
    severity: 'Low',
    detectedTime: '3h ago',
    lat: 1.2764,
    lng: 103.8545,
    details: 'Cracks widening on shoulder. Scheduled for maintenance next cycle.'
  },
  {
    id: 'm5',
    type: 'flooding',
    title: 'Drain Overflow Risk',
    location: 'Geylang Rd Junction',
    severity: 'Medium',
    detectedTime: '30m ago',
    lat: 1.3120,
    lng: 103.8760,
    details: 'Drainage debris causing minor water buildup on curbside.'
  }
];

const incidentTemplates = [
  { type: 'pothole', title: 'Deep Road Crater', location: 'Tanjong Pagar Rd', severity: 'High' },
  { type: 'flooding', title: 'Roadway Ponding', location: 'Geylang Rd Lane 3', severity: 'Medium' },
  { type: 'obstacle', title: 'Debris & Metal Scrap', location: 'PIE Exit 15', severity: 'High' },
  { type: 'pothole', title: 'Sinking Manhole Cover', location: 'Keppel Rd Eastbound', severity: 'Medium' },
  { type: 'obstacle', title: 'Construction Barricade', location: 'Marina Way', severity: 'Low' },
  { type: 'flooding', title: 'Heavy Roadside Pooling', location: 'Serangoon Rd', severity: 'Medium' },
  { type: 'pothole', title: 'Severe Surface Fissure', location: 'Nicoll Highway', severity: 'High' },
];

interface HeatmapZone {
  id: string;
  type: 'pothole' | 'flooding' | 'obstacle';
  lat: number;
  lng: number;
  severity: 'High' | 'Medium';
  baseRadius: number; // base size in pixels
}

// Heatmap zones are computed dynamically within the component from active reports

export function LiveHeatmap() {
  // Layer states
  const [activeLayers, setActiveLayers] = useState({
    potholes: true,
    flooding: true,
    obstacles: true,
    liveTraffic: true,
  });

  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showRouteDrawer, setShowRouteDrawer] = useState(false);
  const [showFeedDrawer, setShowFeedDrawer] = useState(true);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Script load & Map instances
  const [apiLoaded, setApiLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(13);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trafficLayerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  // Timeline playback state
  const [timelineVal, setTimelineVal] = useState(65);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Shared storage state
  const [reports, setReports] = useState<Report[]>(() => getReports());

  const [filterSeverity, setFilterSeverity] = useState({
    Critical: true,
    Active: true,
    Pending: true,
    Scheduled: true,
  });

  const [filterStatus, setFilterStatus] = useState({
    Detected: true,
    Verified: true,
    Assigned: true,
    Repairing: true,
    Resolved: false,
  });

  useEffect(() => {
    const handleSync = () => {
      setReports(getReports());
    };
    const handleSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSearchQuery(detail || '');
    };
    window.addEventListener('roadwatch-reports-updated', handleSync);
    window.addEventListener('roadwatch-search', handleSearch);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
      window.removeEventListener('roadwatch-search', handleSearch);
    };
  }, []);

  const formatTimeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const mappedMarkers = reports
    .map(r => {
      let type: 'pothole' | 'flooding' | 'obstacle' = 'pothole';
      if (r.icon === 'droplets') type = 'flooding';
      else if (r.icon === 'hardhat') type = 'obstacle';

      let severity: 'High' | 'Medium' | 'Low' = 'Low';
      if (r.severity === 'Critical') severity = 'High';
      else if (r.severity === 'Active') severity = 'Medium';

      const timeStr = r.timestamp ? formatTimeAgo(new Date(r.timestamp)) : 'Just now';

      return {
        id: r.id,
        type,
        title: r.title,
        location: r.location,
        severity,
        originalSeverity: r.severity || 'Active',
        status: r.status || (r.resolved ? 'Resolved' : 'Detected'),
        resolved: !!r.resolved,
        detectedTime: timeStr,
        lat: r.lat || 1.3048,
        lng: r.lng || 103.8318,
        x: r.x || 50,
        y: r.y || 50,
        details: r.description || `Active ${r.title} at ${r.location}.`
      };
    });

  const [newIncidentFlash, setNewIncidentFlash] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Dispatch safe routing state variables
  const [showRoutingPanel, setShowRoutingPanel] = useState(true);
  const [routeStart, setRouteStart] = useState('Marina Boulevard, Singapore');
  const [routeEnd, setRouteEnd] = useState('Orchard Road, Singapore');
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    distance: string;
    duration: string;
    hazardsFlagged: any[];
    routesList: any[];
    selectedRouteIndex: number;
  } | null>(null);

  // DYNAMIC SCRIPT LOADER (Loads Google Maps JS with visualization, geometry, and places APIs)
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    const loadScript = () => {
      // Define a global callback that sets state when maps API is fully loaded
      (window as any).initGoogleMapCallback = () => {
        setApiLoaded(true);
      };

      // Define a global callback to catch Google Maps authentication failures
      (window as any).gm_authFailure = () => {
        console.warn("Google Maps API Authentication failed. Falling back to Sandbox Mode.");
        setIsSandboxMode(true);
      };

      if ((window as any).google && (window as any).google.maps) {
        setApiLoaded(true);
        return;
      }

      const existing = document.getElementById('google-maps-api-script') as HTMLScriptElement;
      if (existing) {
        // If the script is already loaded/loading, check google.maps status
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
      // Load sandbox if key not supplied
      const keyQuery = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' ? `key=${apiKey}&` : '';
      if (!keyQuery) {
        setIsSandboxMode(true);
      }
      
      // Load async with our callback function
      script.src = `https://maps.googleapis.com/maps/api/js?${keyQuery}loading=async&callback=initGoogleMapCallback&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.addEventListener('load', () => {
        // Fallback check if callback was not triggered
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

  // MAP INSTANTIATION & SYNCING
  useEffect(() => {
    if (!apiLoaded || !mapContainerRef.current || map) return;

    try {
      const darkMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#1a1f2c" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8a9ba8" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2c" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2c3b47" }] },
        { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#a7b6c2" }] },
        { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bfccd6" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8a9ba8" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#13232f" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#5c7080" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#293947" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a9ba8" }] },
        { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#30404d" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#384a5c" }] },
        { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#30404d" }] },
        { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#5c7080" }] },
        { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#8a9ba8" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e131f" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#384a5c" }] }
      ];

      const googleMap = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 1.2950, lng: 103.8500 }, // Central Singapore focus
        zoom: 13,
        styles: darkMapStyles,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
      });

      // Synchronize zooms
      googleMap.addListener('zoom_changed', () => {
        setZoomLevel(googleMap.getZoom());
      });

      // Autocomplete setup for main top bar search if DOM is ready
      const setupTopBarAutocomplete = () => {
        const topSearch = document.getElementById('map-search-input');
        if (topSearch && google.maps.places) {
          const auto = new google.maps.places.Autocomplete(topSearch, {
            fields: ['geometry', 'name'],
            types: ['geocode', 'establishment']
          });
          auto.addListener('place_changed', () => {
            const place = auto.getPlace();
            if (place.geometry?.location) {
              googleMap.panTo(place.geometry.location);
              googleMap.setZoom(15);
            }
          });
        }
      };
      
      // Delay slightly to ensure header input is fully rendered
      setTimeout(setupTopBarAutocomplete, 500);

      // Traffic overlay setup
      trafficLayerRef.current = new google.maps.TrafficLayer();
      if (activeLayers.liveTraffic) {
        trafficLayerRef.current.setMap(googleMap);
      }

      // Directions Renderer Setup
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: googleMap,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#FACC15', // Neon safe routing color
          strokeWeight: 5,
          strokeOpacity: 0.85
        }
      });

      setMap(googleMap);
    } catch (e) {
      console.error("Google Maps initialization failed: ", e);
      setIsSandboxMode(true);
    }
  }, [apiLoaded, map]);

  // Traffic layer visibility synchronizer
  useEffect(() => {
    if (!map || !trafficLayerRef.current) return;
    trafficLayerRef.current.setMap(activeLayers.liveTraffic ? map : null);
  }, [map, activeLayers.liveTraffic]);

  // TIMELINE PLAYBACK LOGIC
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineVal((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Simulated live feed generator
  useEffect(() => {
    const feedInterval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * incidentTemplates.length);
      const template = incidentTemplates[randomIdx];
      
      let icon: 'alert' | 'droplets' | 'hardhat' = 'alert';
      if (template.type === 'flooding') icon = 'droplets';
      else if (template.type === 'obstacle') icon = 'hardhat';

      let severity: 'Critical' | 'Active' | 'Pending' = 'Active';
      if (template.severity === 'High') severity = 'Critical';
      else if (template.severity === 'Medium') severity = 'Active';
      else severity = 'Pending';

      const lat = 1.27 + Math.random() * 0.05;
      const lng = 103.82 + Math.random() * 0.06;

      storageAddReport({
        title: template.title,
        location: template.location,
        severity,
        icon,
        source: 'AI Edge Node',
        x: Math.floor(Math.random() * 60) + 20,
        y: Math.floor(Math.random() * 60) + 20,
        lat,
        lng,
        imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
        description: `Autonomous detection alert: ${template.title} at ${template.location}.`
      });

      setNewIncidentFlash(true);
      setTimeout(() => setNewIncidentFlash(false), 800);
    }, 15000); // 15 seconds

    return () => clearInterval(feedInterval);
  }, []);

  // Format percentage to a human-readable 24H timestamp
  const getTimelineTime = (val: number) => {
    if (val === 100) return 'Live Current';
    const totalMinutes = Math.round((val / 100) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    
    const padHour = formattedHours < 10 ? `0${formattedHours}` : formattedHours;
    const padMin = minutes < 10 ? `0${minutes}` : minutes;
    return `${padHour}:${padMin} ${ampm}`;
  };

  // Filter markers based on layers and timeline hourly constraints
  const filteredMarkers = mappedMarkers.filter((m) => {
    if (m.type === 'pothole' && !activeLayers.potholes) return false;
    if (m.type === 'flooding' && !activeLayers.flooding) return false;
    if (m.type === 'obstacle' && !activeLayers.obstacles) return false;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = m.title.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Severity filter
    const sev = m.originalSeverity;
    if (sev === 'Critical' && !filterSeverity.Critical) return false;
    if (sev === 'Active' && !filterSeverity.Active) return false;
    if (sev === 'Pending' && !filterSeverity.Pending) return false;
    if (sev === 'Scheduled' && !filterSeverity.Scheduled) return false;

    // Status filter
    const stat = m.status;
    if (stat === 'Detected' && !filterStatus.Detected) return false;
    if (stat === 'Verified' && !filterStatus.Verified) return false;
    if (stat === 'Assigned' && !filterStatus.Assigned) return false;
    if (stat === 'Repairing' && !filterStatus.Repairing) return false;
    if (stat === 'Resolved' && !filterStatus.Resolved) return false;

    // Timeline time-lapse simulation constraints
    if (timelineVal < 100) {
      const reportDate = new Date(reports.find(r => r.id === m.id)?.timestamp || '');
      const today = new Date();
      if (reportDate.toDateString() === today.toDateString()) {
        const reportMinutes = reportDate.getHours() * 60 + reportDate.getMinutes();
        const maxMinutes = (timelineVal / 100) * 24 * 60;
        if (reportMinutes > maxMinutes) {
          return false;
        }
      }
    }
    
    return true;
  });

  const heatmapZones: HeatmapZone[] = filteredMarkers.map(m => ({
    id: `hz-${m.id}`,
    type: m.type,
    lat: m.lat,
    lng: m.lng,
    severity: m.severity === 'High' ? 'High' : 'Medium',
    baseRadius: m.severity === 'High' ? 160 : 120
  }));

  // Custom Heatmap implementation is handled reactively using GoogleMapPortalOverlay inside the JSX

  const activeHazardsCount = filteredMarkers.length;
  const isHighRisk = activeHazardsCount > 5;

  const handleZoomIn = () => {
    if (map) map.setZoom(map.getZoom() + 1);
  };
  
  const handleZoomOut = () => {
    if (map) map.setZoom(map.getZoom() - 1);
  };

  const handleResetViewport = () => {
    if (map) {
      map.panTo({ lat: 1.2950, lng: 103.8500 });
      map.setZoom(13);
      setSelectedMarkerId(null);
    }
  };

  // Autocomplete setup for dispatch input fields
  useEffect(() => {
    if (!apiLoaded || !google.maps.places) return;

    const startInput = document.getElementById('route-start-input');
    const endInput = document.getElementById('route-end-input');

    if (startInput) {
      const autoStart = new google.maps.places.Autocomplete(startInput, {
        fields: ['formatted_address'],
        types: ['geocode', 'establishment']
      });
      autoStart.addListener('place_changed', () => {
        const place = autoStart.getPlace();
        if (place.formatted_address) setRouteStart(place.formatted_address);
      });
    }

    if (endInput) {
      const autoEnd = new google.maps.places.Autocomplete(endInput, {
        fields: ['formatted_address'],
        types: ['formatted_address']
      });
      autoEnd.addListener('place_changed', () => {
        const place = autoEnd.getPlace();
        if (place.formatted_address) setRouteEnd(place.formatted_address);
      });
    }
  }, [apiLoaded]);

  // CORE ROUTING ENGINE & COLLISION CHECKING ALGORITHM
  const calculateSafeRoute = () => {
    if (!map || !(window as any).google?.maps) return;
    setRouteLoading(true);

    const directionsService = new google.maps.DirectionsService();

    directionsService.route({
      origin: routeStart,
      destination: routeEnd,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true
    }, (result: any, status: string) => {
      setRouteLoading(false);
      
      if (status === google.maps.DirectionsStatus.OK && result) {
        processRoutesAndHazards(result);
      } else {
        // Safe fallback in Sandbox mode (without valid keys) to simulate routing
        console.warn("Real route API failed or missing credentials. Running sandbox fallback simulation...");
        runSandboxRouteSimulation();
      }
    });
  };

  // Calculates spherical distances to find active hazards along Directions routes
  const processRoutesAndHazards = (directionsResult: any) => {
    const routes = directionsResult.routes;
    const processedRoutesList: any[] = [];

    routes.forEach((route: any, routeIdx: number) => {
      const path = route.overview_path; // coordinates along route path
      const flagged: any[] = [];

      filteredMarkers.forEach((hazard) => {
        const hazardLatLng = new google.maps.LatLng(hazard.lat, hazard.lng);
        let minDistance = Infinity;

        // Spherical geometry calculation for precise route safety mapping
        for (let i = 0; i < path.length; i++) {
          if (google.maps.geometry?.spherical) {
            const dist = google.maps.geometry.spherical.computeDistanceBetween(path[i], hazardLatLng);
            if (dist < minDistance) minDistance = dist;
          } else {
            // Rough distance formula fallback if geometry library fails to load
            const dx = (path[i].lng() - hazard.lng) * 111000 * Math.cos(hazard.lat * Math.PI / 180);
            const dy = (path[i].lat() - hazard.lat) * 111000;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) minDistance = dist;
          }
        }

        // Flag if hazard is within 250 meters of route path
        if (minDistance < 250) {
          flagged.push({
            hazard,
            distance: Math.round(minDistance)
          });
        }
      });

      processedRoutesList.push({
        index: routeIdx,
        summary: route.summary || `Route Option ${routeIdx + 1}`,
        distance: route.legs[0].distance.text,
        duration: route.legs[0].duration.text,
        hazardsFlagged: flagged,
        rawRoute: route
      });
    });

    // Auto-select route with fewest hazards (Optimized detours)
    const sorted = [...processedRoutesList].sort((a, b) => a.hazardsFlagged.length - b.hazardsFlagged.length);
    const bestRouteIndex = sorted[0].index;

    directionsRendererRef.current.setDirections(directionsResult);
    directionsRendererRef.current.setRouteIndex(bestRouteIndex);

    setActiveRouteInfo({
      distance: processedRoutesList[bestRouteIndex].distance,
      duration: processedRoutesList[bestRouteIndex].duration,
      hazardsFlagged: processedRoutesList[bestRouteIndex].hazardsFlagged,
      routesList: processedRoutesList,
      selectedRouteIndex: bestRouteIndex
    });
  };

  // Sandbox simulation engine: draws straight line and performs safety check
  const runSandboxRouteSimulation = () => {
    // Generate coordinate pairs for geolocations in Singapore
    const getMockCoords = (name: string) => {
      const low = name.toLowerCase();
      if (low.includes('orchard')) return { lat: 1.3048, lng: 103.8318 };
      if (low.includes('bayfront') || low.includes('marina')) return { lat: 1.2847, lng: 103.8590 };
      if (low.includes('cross')) return { lat: 1.2789, lng: 103.8485 };
      if (low.includes('geylang')) return { lat: 1.3120, lng: 103.8760 };
      return { lat: 1.2950, lng: 103.8500 };
    };

    const start = getMockCoords(routeStart);
    const end = getMockCoords(routeEnd);

    // Create polyline in map
    const pathCoords = [
      new google.maps.LatLng(start.lat, start.lng),
      new google.maps.LatLng((start.lat + end.lat) / 2, (start.lng + end.lng) / 2 + 0.005),
      new google.maps.LatLng(end.lat, end.lng)
    ];

    new google.maps.Polyline({
      path: pathCoords,
      strokeColor: '#FACC15',
      strokeWeight: 5,
      strokeOpacity: 0.85,
      map: map
    });

    // Check collisions
    const flagged: any[] = [];
    filteredMarkers.forEach((hazard) => {
      let minDistance = Infinity;

      for (let i = 0; i < pathCoords.length; i++) {
        const dx = (pathCoords[i].lng() - hazard.lng) * 111000 * Math.cos(hazard.lat * Math.PI / 180);
        const dy = (pathCoords[i].lat() - hazard.lat) * 111000;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) minDistance = dist;
      }

      if (minDistance < 350) {
        flagged.push({
          hazard,
          distance: Math.round(minDistance)
        });
      }
    });

    setActiveRouteInfo({
      distance: '6.4 km',
      duration: '14 mins',
      hazardsFlagged: flagged,
      routesList: [
        { index: 0, summary: 'Expressway Avoidance', distance: '6.4 km', duration: '14 mins', hazardsFlagged: flagged }
      ],
      selectedRouteIndex: 0
    });
  };

  const selectRouteOption = (index: number) => {
    if (!activeRouteInfo || !directionsRendererRef.current) return;
    directionsRendererRef.current.setRouteIndex(index);
    const selectedRoute = activeRouteInfo.routesList[index];
    setActiveRouteInfo({
      ...activeRouteInfo,
      distance: selectedRoute.distance,
      duration: selectedRoute.duration,
      hazardsFlagged: selectedRoute.hazardsFlagged,
      selectedRouteIndex: index
    });
  };

  const clearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    setActiveRouteInfo(null);
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'pothole':
        return <AlertTriangle className="w-4 h-4 text-primary" />;
      case 'flooding':
        return <Droplets className="w-4 h-4 text-white" />;
      case 'obstacle':
        return <Hammer className="w-4 h-4 text-white" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-primary" />;
    }
  };

  const getMarkerBgClass = (type: string) => {
    switch (type) {
      case 'pothole':
        return 'bg-safety-yellow text-primary border border-yellow-300';
      case 'flooding':
        return 'bg-blue-600 text-white border border-blue-400';
      case 'obstacle':
        return 'bg-orange-500 text-white border border-orange-400';
      default:
        return 'bg-safety-yellow text-primary';
    }
  };

  return (
    <div className="mt-[-64px] h-screen w-full flex flex-col relative overflow-hidden bg-[#0c101a] select-none text-on-surface">
      
      {/* Sandbox warning pill */}
      {isSandboxMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-primary/95 text-white border border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
          <span>
            {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY'
              ? "Google Maps Auth Failed. Running in Offline Sandbox Mode."
              : "Google Maps Developer Mode. Enter key in `.env` for production GIS."}
          </span>
        </div>
      )}

      {/* FULLSCREEN REAL MAP CONTAINER */}
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full absolute inset-0 z-0 bg-[#0c101a] ${isSandboxMode ? 'opacity-0 pointer-events-none' : ''}`}
      />

      {/* FALLBACK MOCK MAP CONTAINER */}
      {(!map || isSandboxMode) && (
        <div className="absolute inset-0 bg-[#0c101a] flex items-center justify-center pointer-events-none">
          <img 
            className="w-full h-full object-cover opacity-20 grayscale select-none" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuHFT25LrIudFzN9hASHnRgcA8BFks14OkKHmCUQHsIgxP3_efPdHHmYslWisBVEx-kYPAL-txAPhVyEdBWysgahj1JzAnfyT5ZDTy2s0D9OlsRCR4Ptdllch1EeRvlylM3nqORXTkFaZrifD2-giS6p6l0A1aYfo-GaksLZgNQ4RGx2i2L8P3hRQddcA-WQqfF6xLKPU35tm4cCYL8xEECIOHkl-TNtw2HmoENL3JBWVs9vbh25GB2z1RhXII3CXQ_qhCdGJn7lo" 
            alt="Mock Map Background"
          />
          {/* Soft grid lines to make it look premium */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
          
          {/* Animated fallback mock indicators when Google Maps API fails/loads blank */}
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {filteredMarkers.map((marker) => {
              const isSelected = selectedMarkerId === marker.id;
              return (
                <div 
                  key={marker.id}
                  className="absolute pointer-events-auto cursor-pointer group"
                  style={{ top: `${marker.y}%`, left: `${marker.x}%`, transform: 'translate(-50%, -50%)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarkerId(isSelected ? null : marker.id);
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <span className={`absolute inline-flex h-9 w-9 rounded-full opacity-60 animate-ping ${
                      marker.type === 'flooding' 
                        ? 'bg-blue-500' 
                        : marker.type === 'obstacle' 
                          ? 'bg-orange-400' 
                          : 'bg-safety-yellow'
                    }`} />
                    <motion.div 
                      whileHover={{ scale: 1.15 }}
                      className={`relative z-10 p-2 rounded-full shadow-2xl transition-all duration-200 ${getMarkerBgClass(marker.type)}`}
                    >
                      {getMarkerIcon(marker.type)}
                    </motion.div>

                    {/* Translucent detailed popup card */}
                    <div 
                      className={`absolute top-full mt-2 w-64 glass-panel p-4 rounded-xl shadow-2xl border border-white/20 text-on-surface z-50 text-left transition-all duration-300 pointer-events-auto ${
                        isSelected 
                          ? 'opacity-100 translate-y-0 scale-100 visible' 
                          : 'opacity-0 translate-y-2 scale-95 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:visible'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-primary">{marker.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          marker.severity === 'High' 
                            ? 'bg-red-100 text-red-700' 
                            : marker.severity === 'Medium' 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {marker.severity}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[11px] text-text-secondary uppercase font-semibold mb-2">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{marker.location}</span>
                      </div>
                      
                      <p className="text-xs text-text-secondary leading-relaxed mb-3">
                        {marker.details}
                      </p>
                      
                      <div className="flex justify-between items-center text-[10px] text-text-secondary border-t border-border-subtle pt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {marker.detectedTime}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            storageResolveReport(marker.id);
                            setSelectedMarkerId(null);
                          }}
                          className="text-white bg-green-600 hover:bg-green-700 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom React HTML Heatmap Overlays mapped inside google map viewport */}
      {map && !isSandboxMode && showHeatmap && heatmapZones.map((zone) => {
        // Filter based on active layers
        if (zone.type === 'pothole' && !activeLayers.potholes) return null;
        if (zone.type === 'flooding' && !activeLayers.flooding) return null;
        if (zone.type === 'obstacle' && !activeLayers.obstacles) return null;

        // Filter based on timeline timelapse hours
        if (zone.id === 'hz1' && timelineVal < 15) return null; // Orchard Pothole
        if (zone.id === 'hz2' && timelineVal < 35) return null; // Bayfront Flooding
        if (zone.id === 'hz3' && timelineVal < 50) return null; // Geylang Flood Risk

        // Calculate responsive radius based on timeline timelapse
        const sizeFactor = 0.5 + (timelineVal / 100) * 1.0;
        const radius = zone.baseRadius * sizeFactor;

        // Color coding for hazard severity
        const colorClass = zone.type === 'flooding' 
          ? 'bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.35)]' 
          : zone.severity === 'High' 
            ? 'bg-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.35)]' 
            : 'bg-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.35)]';

        return (
          <GoogleMapPortalOverlay 
            key={zone.id} 
            map={map} 
            position={{ lat: zone.lat, lng: zone.lng }}
          >
            <motion.div 
              animate={{ 
                scale: [0.96, 1.04, 0.96],
                opacity: [0.45, 0.65, 0.45]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`rounded-full blur-2xl pointer-events-none transition-all duration-300 ${colorClass}`}
              style={{
                width: `${radius}px`,
                height: `${radius}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </GoogleMapPortalOverlay>
        );
      })}

      {/* Custom React HTML Marker Overlays mapped inside google map viewport */}
      {map && !isSandboxMode && filteredMarkers.map((marker) => {
        const isSelected = selectedMarkerId === marker.id;
        return (
          <GoogleMapPortalOverlay 
            key={marker.id}
            map={map} 
            position={{ lat: marker.lat, lng: marker.lng }}
          >
            <div 
              className="relative cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarkerId(isSelected ? null : marker.id);
              }}
            >
              <div className="relative flex flex-col items-center group">
                <span className={`absolute inline-flex h-9 w-9 rounded-full opacity-60 animate-ping ${
                  marker.type === 'flooding' 
                    ? 'bg-blue-500' 
                    : marker.type === 'obstacle' 
                      ? 'bg-orange-400' 
                      : 'bg-safety-yellow'
                }`} />

                <motion.div 
                  whileHover={{ scale: 1.15 }}
                  className={`relative z-10 p-2 rounded-full shadow-2xl transition-all duration-200 ${getMarkerBgClass(marker.type)}`}
                >
                  {getMarkerIcon(marker.type)}
                </motion.div>

                {/* Translucent detailed popup card */}
                <div 
                  className={`absolute top-full mt-2 w-64 glass-panel p-4 rounded-xl shadow-2xl border border-white/20 text-on-surface z-50 text-left transition-all duration-300 pointer-events-auto ${
                    isSelected 
                      ? 'opacity-100 translate-y-0 scale-100 visible' 
                      : 'opacity-0 translate-y-2 scale-95 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:visible'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-primary">{marker.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      marker.severity === 'High' 
                        ? 'bg-red-100 text-red-700' 
                        : marker.severity === 'Medium' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {marker.severity}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[11px] text-text-secondary uppercase font-semibold mb-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{marker.location}</span>
                  </div>
                  
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">
                    {marker.details}
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] text-text-secondary border-t border-border-subtle pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {marker.detectedTime}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        storageResolveReport(marker.id);
                        setSelectedMarkerId(null);
                      }}
                      className="text-white bg-green-600 hover:bg-green-700 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GoogleMapPortalOverlay>
        );
      })}

      {/* FLOATING UI: TOP LEFT CONFIGURATOR COLUMN */}
      <div className="absolute top-[88px] left-6 z-20 flex flex-col gap-4">
        <div className="glass-panel p-1.5 rounded-xl border border-white/20 shadow-lg flex flex-col gap-1.5 w-14 items-center">
          <button 
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${
              showLayersPanel ? 'bg-primary text-white' : 'hover:bg-surface-container text-on-surface-variant'
            }`}
            title="Toggle Layers Panel"
          >
            <Layers className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setShowRouteDrawer(!showRouteDrawer)}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${
              showRouteDrawer ? 'bg-primary text-white' : 'hover:bg-surface-container text-on-surface-variant'
            }`}
            title="Toggle Route Planner"
          >
            <Navigation className="w-5 h-5 rotate-45" />
          </button>
          
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${
              showHeatmap ? 'bg-primary text-white' : 'hover:bg-surface-container text-on-surface-variant'
            }`}
            title="Toggle Heatmap Layer"
          >
            {showHeatmap ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={handleResetViewport}
            className="p-2.5 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors flex items-center justify-center"
            title="Reset Map Center"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="glass-panel p-1.5 rounded-xl border border-white/20 shadow-lg flex flex-col gap-1 w-14 items-center">
          <button 
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors flex items-center justify-center"
            title="Zoom In"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-bold text-text-secondary">{zoomLevel}x</span>
          <button 
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors flex items-center justify-center"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Layers Selectors Card */}
        <AnimatePresence>
          {showLayersPanel && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel p-5 rounded-xl border border-white/20 shadow-lg w-56 text-primary space-y-4"
            >
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-3">Live Layers</h4>
                <div className="space-y-2 border-b border-border-subtle/30 pb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.potholes} 
                      onChange={() => setActiveLayers({ ...activeLayers, potholes: !activeLayers.potholes })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
                    />
                    <span className={`text-xs font-medium transition-colors ${activeLayers.potholes ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`}>
                      Potholes
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.flooding} 
                      onChange={() => setActiveLayers({ ...activeLayers, flooding: !activeLayers.flooding })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
                    />
                    <span className={`text-xs font-medium transition-colors ${activeLayers.flooding ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`}>
                      Flooding
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.obstacles} 
                      onChange={() => setActiveLayers({ ...activeLayers, obstacles: !activeLayers.obstacles })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
                    />
                    <span className={`text-xs font-medium transition-colors ${activeLayers.obstacles ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`}>
                      Obstacles
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={activeLayers.liveTraffic} 
                      onChange={() => setActiveLayers({ ...activeLayers, liveTraffic: !activeLayers.liveTraffic })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
                    />
                    <span className={`text-xs font-medium transition-colors ${activeLayers.liveTraffic ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`}>
                      Live Traffic Layer
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-3">Severity</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-border-subtle/30 pb-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={filterSeverity.Critical} onChange={() => setFilterSeverity({...filterSeverity, Critical: !filterSeverity.Critical})} className="w-3.5 h-3.5 accent-primary rounded" />
                    <span>Critical</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={filterSeverity.Active} onChange={() => setFilterSeverity({...filterSeverity, Active: !filterSeverity.Active})} className="w-3.5 h-3.5 accent-primary rounded" />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={filterSeverity.Pending} onChange={() => setFilterSeverity({...filterSeverity, Pending: !filterSeverity.Pending})} className="w-3.5 h-3.5 accent-primary rounded" />
                    <span>Pending</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={filterSeverity.Scheduled} onChange={() => setFilterSeverity({...filterSeverity, Scheduled: !filterSeverity.Scheduled})} className="w-3.5 h-3.5 accent-primary rounded" />
                    <span>Sched</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-3">Status</h4>
                <div className="space-y-2 text-[10px] border-b border-border-subtle/30 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={filterStatus.Detected} onChange={() => setFilterStatus({...filterStatus, Detected: !filterStatus.Detected})} className="w-3.5 h-3.5 accent-primary rounded" />
                      <span>Detected</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={filterStatus.Verified} onChange={() => setFilterStatus({...filterStatus, Verified: !filterStatus.Verified})} className="w-3.5 h-3.5 accent-primary rounded" />
                      <span>Verified</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={filterStatus.Assigned} onChange={() => setFilterStatus({...filterStatus, Assigned: !filterStatus.Assigned})} className="w-3.5 h-3.5 accent-primary rounded" />
                      <span>Assigned</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={filterStatus.Repairing} onChange={() => setFilterStatus({...filterStatus, Repairing: !filterStatus.Repairing})} className="w-3.5 h-3.5 accent-primary rounded" />
                      <span>Repairing</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer pt-1 border-t border-dashed border-border-subtle/30">
                    <input type="checkbox" checked={filterStatus.Resolved} onChange={() => setFilterStatus({...filterStatus, Resolved: !filterStatus.Resolved})} className="w-3.5 h-3.5 accent-primary rounded" />
                    <span>Include Resolved</span>
                  </label>
                </div>
              </div>

              {/* Map Legend integrated inside Layers card to prevent collisions */}
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-2.5">Risk Level</h4>
                <div className="space-y-2 text-[10px] font-semibold text-text-secondary">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-error shadow-sm shadow-red-500/50"></span>
                    <span className="text-primary font-bold">High Danger</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-safety-yellow shadow-sm shadow-yellow-500/50"></span>
                    <span className="text-primary font-bold">Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
                    <span className="text-primary font-bold">Safe Zone</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLOATING UI: ROUTE PLANNING & SAFETY DETOURS PANEL */}
      <AnimatePresence>
        {showRouteDrawer && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-[88px] left-[88px] z-20 flex flex-col gap-4 w-80 text-primary"
          >
            <div className="glass-panel p-5 rounded-xl border border-white/20 shadow-lg">
              <div 
                className="flex justify-between items-center cursor-pointer mb-4"
                onClick={() => setShowRouteDrawer(false)}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary rotate-45" />
                  <h3 className="text-sm font-bold text-primary">Dispatch Safety Router</h3>
                </div>
                <span className="text-xs text-text-secondary hover:text-primary transition-colors">
                  Collapse
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Start Dispatch Location</label>
                  <input 
                    id="route-start-input"
                    type="text" 
                    value={routeStart}
                    onChange={(e) => setRouteStart(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-xs text-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="E.g. Marina Boulevard"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Destination Hub</label>
                  <input 
                    id="route-end-input"
                    type="text" 
                    value={routeEnd}
                    onChange={(e) => setRouteEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-xs text-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="E.g. Orchard Road"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={calculateSafeRoute}
                    disabled={routeLoading}
                    className="flex-1 bg-primary text-white hover:bg-neutral-800 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {routeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 rotate-45" />}
                    <span>Plot Safe Dispatch</span>
                  </button>

                  {activeRouteInfo && (
                    <button
                      onClick={clearRoute}
                      className="bg-surface-container hover:bg-surface-container-high py-2 px-3 rounded-lg text-xs font-bold text-text-secondary border border-border-subtle transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Dispatch Hazard Proximity Warnings output */}
                {activeRouteInfo && (
                  <div className="border-t border-border-subtle/50 pt-3 space-y-3">
                    <div className="flex justify-between text-xs text-text-secondary font-semibold">
                      <span>Est: {activeRouteInfo.distance}</span>
                      <span>Time: {activeRouteInfo.duration}</span>
                    </div>

                    {/* Routing Alternatives detouring select */}
                    {activeRouteInfo.routesList && activeRouteInfo.routesList.length > 1 && (
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Alternate Route Safety</label>
                        <div className="space-y-1">
                          {activeRouteInfo.routesList.map((routeOpt) => {
                            const isCurrent = activeRouteInfo.selectedRouteIndex === routeOpt.index;
                            const hazardCount = routeOpt.hazardsFlagged.length;
                            
                            return (
                              <button
                                key={routeOpt.index}
                                onClick={() => selectRouteOption(routeOpt.index)}
                                className={`w-full text-left p-1.5 rounded border text-[10px] flex justify-between items-center transition-all ${
                                  isCurrent
                                    ? 'bg-primary text-white border-primary shadow-sm font-bold'
                                    : 'bg-surface border-border-subtle hover:bg-surface-container-low text-primary'
                                }`}
                              >
                                <span>{routeOpt.summary}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  hazardCount === 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {hazardCount === 0 ? '✔ Avoids Hazards' : `⚠ ${hazardCount} Hazard${hazardCount > 1 ? 's' : ''}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Active Warnings panel */}
                    {activeRouteInfo.hazardsFlagged.length > 0 ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-1.5 text-red-700 text-xs font-bold">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          <span>Hazard Collision Flagged</span>
                        </div>
                        <p className="text-[10px] text-red-600 leading-normal">
                          The active route intersects municipal hazard boundaries. Proceed with caution.
                        </p>
                        <div className="space-y-1.5 pt-1">
                          {activeRouteInfo.hazardsFlagged.map((flag, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] text-red-700 font-medium">
                              <span className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-red-500"></span>
                                {flag.hazard.title}
                              </span>
                              <span className="font-bold">dist: {flag.distance}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>AI Clean Routing Verified</span>
                        </div>
                        <p className="text-[10px] text-green-600 leading-normal">
                          Route clear of all reported potholes, flooded roads, and active work zones. Safe dispatch recommended.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING UI: TOP RIGHT LIVE INCIDENT FEED */}
      <AnimatePresence>
        {showFeedDrawer && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-[88px] right-6 z-20 flex flex-col gap-4 w-80"
          >
            <div className="glass-panel rounded-xl border border-white/20 shadow-lg overflow-hidden text-primary">
              <div className={`p-4 border-b border-border-subtle/50 flex justify-between items-center transition-colors duration-500 ${
                newIncidentFlash ? 'bg-red-50' : 'bg-transparent'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full bg-red-600 ${newIncidentFlash ? 'animate-ping' : 'animate-pulse'}`}></span>
                  <h3 className="text-sm font-bold text-primary">Live Incident Feed</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-text-secondary bg-surface-container px-2 py-0.5 rounded uppercase tracking-wider">
                    Real-time
                  </span>
                  <button
                    onClick={() => setShowFeedDrawer(false)}
                    className="p-1 hover:bg-surface-container rounded text-text-secondary hover:text-primary transition-colors flex items-center justify-center"
                    title="Hide Feed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3.5 max-h-56 overflow-y-auto custom-scrollbar">
                <AnimatePresence initial={false}>
                  {filteredMarkers.slice(0, 5).map((inc) => (
                    <motion.div 
                      key={inc.id}
                      initial={{ opacity: 0, y: -12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className={`flex gap-3 items-start border-l-2 p-1.5 pl-3 hover:bg-surface-container-low rounded-r-md transition-colors ${
                        inc.severity === 'High' 
                          ? 'border-error' 
                          : inc.severity === 'Medium' 
                            ? 'border-safety-yellow' 
                            : 'border-blue-500'
                      }`}
                    >
                      <div className="flex-grow">
                        <div className="flex justify-between items-baseline">
                          <p className="text-xs font-bold text-primary leading-snug">{inc.title}</p>
                          <span className="text-[9px] text-text-secondary whitespace-nowrap">{inc.detectedTime}</span>
                        </div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5">
                          {inc.location}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="glass-panel p-5 rounded-xl border border-white/20 shadow-lg text-primary">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-border-subtle/50 pr-4">
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Hazards Mapped</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold tracking-tight text-primary">
                      <AnimatedCounter value={activeLayers.potholes || activeLayers.flooding || activeLayers.obstacles ? activeHazardsCount : 0} />
                    </span>
                    <span className="text-xs text-error font-bold">+12%</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1.5 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-error" /> vs last hour
                  </p>
                </div>
                
                <div className="pl-2">
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Risk Index</p>
                  <p className={`text-2xl font-bold mt-1 ${isHighRisk ? 'text-red-600' : 'text-safety-yellow'}`}>
                    {isHighRisk ? 'High Danger' : 'Medium Risk'}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-2.5 font-semibold flex items-center gap-1">
                    <ShieldAlert className={`w-3.5 h-3.5 ${isHighRisk ? 'text-red-500' : 'text-yellow-500'}`} /> Zone Alpha
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right feed toggle trigger button */}
      {!showFeedDrawer && (
        <button
          onClick={() => setShowFeedDrawer(true)}
          className="absolute top-[88px] right-6 z-20 px-4 py-2 bg-white border border-border-subtle rounded-xl shadow-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-2 group active:scale-95 font-bold text-xs"
          title="Open Incident Feed & Analytics"
        >
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-error" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-error rounded-full border border-white animate-ping"></span>
          </div>
          <span>Incidents</span>
        </button>
      )}

      {/* FLOATING UI: BOTTOM CENTER TIMELINE HISTORY PANEL */}
      <AnimatePresence>
        {showTimelineDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-8 left-0 right-0 mx-auto z-20 w-full max-w-2xl px-6"
          >
            <div className="glass-panel p-5 rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-4 text-primary">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 bg-primary text-white rounded-full hover:bg-neutral-800 transition-colors shadow-md flex items-center justify-center"
                    title={isPlaying ? 'Pause Timeline' : 'Play Timelapse'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Timeline History</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => { setTimelineVal(100); setIsPlaying(false); }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all border ${
                        timelineVal === 100 
                          ? 'bg-red-600 text-white border-red-500 shadow-sm' 
                          : 'bg-surface-container text-text-secondary border-transparent hover:bg-surface-variant'
                      }`}
                    >
                      LIVE
                    </button>
                    <button 
                      onClick={() => { setTimelineVal(65); setIsPlaying(false); }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all border ${
                        timelineVal === 65 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-surface-container text-text-secondary border-transparent hover:bg-surface-variant'
                      }`}
                    >
                      LAST 24H
                    </button>
                    <button 
                      onClick={() => { setTimelineVal(35); setIsPlaying(false); }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all border ${
                        timelineVal === 35 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-surface-container text-text-secondary border-transparent hover:bg-surface-variant'
                      }`}
                    >
                      7 DAYS
                    </button>
                  </div>
                  <button
                    onClick={() => setShowTimelineDrawer(false)}
                    className="p-1 hover:bg-surface-container rounded text-text-secondary hover:text-primary transition-colors flex items-center justify-center"
                    title="Hide Timeline"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex flex-col gap-1 pt-2">
                <div className="h-10 flex items-end gap-[3px] px-1 pointer-events-none mb-1">
                  {histogramData.map((height, idx) => {
                    const barPosition = (idx / histogramData.length) * 100;
                    const isClose = Math.abs(timelineVal - barPosition) < (100 / histogramData.length);
                    
                    return (
                      <div 
                        key={idx}
                        className={`flex-1 rounded-t-sm transition-all duration-300 ${
                          isClose 
                            ? 'bg-safety-yellow opacity-100 shadow-[0_0_6px_rgba(250,204,21,0.6)]' 
                            : 'bg-outline-variant/40 opacity-40 hover:opacity-75'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>

                <div className="relative w-full h-1 bg-surface-container-highest rounded-full">
                  <div 
                    className="absolute left-0 top-0 h-full bg-primary/70 rounded-full"
                    style={{ width: `${timelineVal}%` }}
                  />
                  
                  <div 
                    className="absolute -top-10 -translate-x-1/2 bg-primary text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1 font-bold z-30 transition-all"
                    style={{ left: `${timelineVal}%` }}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-safety-yellow" />
                    {getTimelineTime(timelineVal)}
                  </div>

                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={timelineVal}
                    onChange={(e) => {
                      setTimelineVal(Number(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="absolute -top-1.5 left-0 w-full h-4 opacity-100 cursor-pointer accent-primary custom-slider bg-transparent appearance-none z-20"
                  />
                </div>

                <div className="flex justify-between text-[9px] font-bold text-text-secondary mt-1 px-1">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span className={Math.abs(timelineVal - 50) < 10 ? 'text-primary font-bold' : ''}>12:00</span>
                  <span>18:00</span>
                  <span className={timelineVal === 100 ? 'text-red-600 font-extrabold' : ''}>LIVE</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom timeline toggle trigger button */}
      {!showTimelineDrawer && (
        <button
          onClick={() => setShowTimelineDrawer(true)}
          className="absolute bottom-8 left-0 right-0 mx-auto z-20 w-max px-4 py-2 bg-white border border-border-subtle rounded-full shadow-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-2 active:scale-95 font-bold text-xs"
          title="Open Timeline History"
        >
          <Clock className="w-4 h-4 text-primary" />
          <span>Timeline History</span>
        </button>
      )}

      {/* Map Legend has been moved inside the Layers selectors card to prevent collisions */}
    </div>
  );
}

// React Counter Animation Component
interface CounterProps {
  value: number;
}

function AnimatedCounter({ value }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startVal = displayValue;
    const endVal = value;
    if (startVal === endVal) return;

    const duration = 500;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = progress * (2 - progress);
      const current = Math.round(startVal + (endVal - startVal) * easedProgress);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [value]);

  return <>{displayValue}</>;
}
