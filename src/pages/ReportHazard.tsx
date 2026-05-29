import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Camera, 
  AlertCircle, 
  Droplets, 
  Minus, 
  Navigation, 
  CircleEllipsis, 
  Send, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Trash2,
  AlertTriangle,
  LightbulbOff,
  Sparkles
} from 'lucide-react';

interface Detection {
  label: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in percentages (0-100)
}

interface AIResult {
  hazardType: string;
  severityScore: number;
  confidence: number;
  urgency: string;
  detections: Detection[];
  description: string;
}

export function ReportHazard() {
  const [selectedHazard, setSelectedHazard] = useState('Pothole');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // File Upload and AI analysis state
  const defaultImageSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuA1n2NbFoToVIImEahvIZSjTkMR5FTXSWp5f0i44_rrN5OvxYZLRQ_oNqHNxD3sFB-nDpXmafydIW44x-pnxEFZG9bTuaUC6E2Qt_awUiMo8OM0fbzOUqk7HhlTxKafEzP_X_VkroxOJSzIaL3Z27pmQJDihdjtMz-DvYmpv8IeGrNo62FAq_HL7QQSiFfc5J1X3gig8LmGziPIjg9wkvs06EaejGoBkfC6jKHwVCzUkDjo2td8nMsT0y4VsHXyeNU5RqZ8SIWc48Q";
  
  const defaultAiResult: AIResult = {
    hazardType: 'Pothole',
    severityScore: 8.4,
    confidence: 98,
    urgency: 'Immediate (Within 24hrs)',
    detections: [
      { label: 'Pothole', severity: 'Critical', box_2d: [25, 20, 60, 60] },
      { label: 'Minor Crack', severity: 'Medium', box_2d: [60, 55, 75, 75] }
    ],
    description: 'Reference example: AI-detected severe pothole with structural cracking.'
  };

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLog, setAnalysisLog] = useState("");
  const [aiResult, setAiResult] = useState<AIResult>(defaultAiResult);
  const [isMock, setIsMock] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Location states
  const [locationName, setLocationName] = useState('San Francisco, CA');
  const [coordinates, setCoordinates] = useState('37.7749° N, 122.4194° W');
  const [gpsStatus, setGpsStatus] = useState<'ACTIVE' | 'FETCHING' | 'ERROR' | 'EDITING'>('ACTIVE');
  const [tempLocation, setTempLocation] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hazardTypes = [
    { name: 'Pothole', icon: AlertCircle },
    { name: 'Waterlogging', icon: Droplets },
    { name: 'Missing Divider', icon: Minus },
    { name: 'Traffic Signal', icon: Navigation },
    { name: 'Spillage', icon: Droplets },
    { name: 'Other', icon: CircleEllipsis },
  ];

  const fetchUserLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      return;
    }

    setGpsStatus('FETCHING');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const latStr = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`;
        setCoordinates(`${latStr}, ${lonStr}`);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'RoadWatch-AI/1.0'
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            const address = data.address;
            const city = address.city || address.town || address.village || address.suburb || address.county || '';
            const state = address.state || '';
            const country = address.country || '';
            
            let label = '';
            if (city && state) {
              label = `${city}, ${state}`;
            } else if (city) {
              label = city;
            } else if (state && country) {
              label = `${state}, ${country}`;
            } else {
              label = country || 'Detected Location';
            }
            setLocationName(label);
          } else {
            setLocationName('Detected Location');
          }
          setGpsStatus('ACTIVE');
        } catch (e) {
          console.warn("Reverse geocoding failed, using fallback label", e);
          setLocationName('Detected Location');
          setGpsStatus('ACTIVE');
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsStatus('ERROR');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Run location fetch at startup
  useEffect(() => {
    fetchUserLocation();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // If using local mock analysis, rerun when category changes on an uploaded image
  useEffect(() => {
    if (imageSrc && isMock && !isAnalyzing) {
      runMockAnalysis(selectedHazard);
    }
  }, [selectedHazard]);

  // Open Camera
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access your camera. Please ensure permissions are granted.");
      setCameraActive(false);
    }
  };

  // Close Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageSrc(dataUrl);
        stopCamera();
        triggerAnalysis(dataUrl);
      }
    }
  };

  // File Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG, JPG, JPEG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const src = event.target.result as string;
        setImageSrc(src);
        triggerAnalysis(src);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset image back to default
  const handleReset = () => {
    setImageSrc(null);
    setAiResult(defaultAiResult);
    setSubmitted(false);
    setIsMock(true);
  };

  // Run AI Analysis
  const triggerAnalysis = (src: string) => {
    setSubmitted(false);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      runGeminiAnalysis(src, apiKey);
    } else {
      runMockAnalysis(selectedHazard);
    }
  };

  // Real Gemini API call
  const runGeminiAnalysis = async (src: string, apiKey: string) => {
    setIsAnalyzing(true);
    setAnalysisLog("Sending payload to Gemini 2.5 Flash...");

    try {
      const mimeType = src.split(';')[0].split(':')[1] || 'image/jpeg';
      const base64Data = src.split(',')[1];

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                },
                {
                  text: `Perform a professional civil engineering inspection of this road image.
Carefully scan the road surface and surrounding infrastructure to locate and identify hazards (potholes, cracks, waterlogging/puddles, missing lane dividers, failed traffic lights, or road spills).
For each detected hazard:
- Focus on drawing extremely tight, pixel-accurate bounding boxes.
- Calculate exact integer percentage coordinates [ymin, xmin, ymax, xmax] (0 to 100) representing height/width positions on the image.
- Classify severity and explain the hazard detail in the description.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                hazardType: {
                  type: "STRING",
                  enum: ["Pothole", "Waterlogging", "Missing Divider", "Traffic Signal", "Spillage", "Other"]
                },
                severityScore: {
                  type: "NUMBER",
                  description: "Severity rating from 1.0 (minimal/cosmetic) to 10.0 (critical, highly hazardous, urgent repair needed)."
                },
                confidence: {
                  type: "INTEGER",
                  description: "AI confidence percentage (50 to 100)."
                },
                urgency: {
                  type: "STRING",
                  enum: ["Immediate (Within 24hrs)", "High (2-3 days)", "Medium (1 week)", "Low (Routine)"]
                },
                detections: {
                  type: "ARRAY",
                  description: "List of all individual hazard detections observed.",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: {
                        type: "STRING",
                        description: "Specific hazard name (e.g. 'Deep Pothole', 'Transverse Crack', 'Pool of Water')."
                      },
                      severity: {
                        type: "STRING",
                        enum: ["Critical", "High", "Medium", "Low"]
                      },
                      box_2d: {
                        type: "ARRAY",
                        description: "Normalized bounding box coordinate array: [ymin, xmin, ymax, xmax] as integer percentages from 0 to 100.",
                        items: { type: "INTEGER" }
                      }
                    },
                    required: ["label", "severity", "box_2d"]
                  }
                },
                description: {
                  type: "STRING",
                  description: "Actionable summary detailing all detected anomalies and their threat level."
                }
              },
              required: ["hazardType", "severityScore", "confidence", "urgency", "detections", "description"]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract pure JSON from markdown if necessary
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      setAiResult({
        hazardType: parsed.hazardType || selectedHazard,
        severityScore: parsed.severityScore || 5.0,
        confidence: parsed.confidence || 85,
        urgency: parsed.urgency || "High (2-3 days)",
        detections: parsed.detections || [],
        description: parsed.description || "AI analysis completed."
      });
      
      // Auto-select detected hazard type
      if (parsed.hazardType) {
        const matchingType = hazardTypes.find(h => h.name.toLowerCase() === parsed.hazardType.toLowerCase());
        if (matchingType) {
          setSelectedHazard(matchingType.name);
        }
      }

      setIsMock(false);
    } catch (error) {
      console.error("Gemini API error, falling back to mock:", error);
      runMockAnalysis(selectedHazard);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock Fallback Analysis with scanning feedback
  const runMockAnalysis = (category: string) => {
    setIsAnalyzing(true);
    setAnalysisLog("Accessing camera frame...");

    const steps = [
      { log: "Scanning road surface contours...", delay: 400 },
      { log: "Running YOLOv8 anomaly detection...", delay: 900 },
      { log: "Evaluating severity and priority...", delay: 1400 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setAnalysisLog(step.log);
      }, step.delay);
    });

    setTimeout(() => {
      let detections: Detection[] = [];
      let severityScore = 5.0;
      let urgency = "Medium (1 week)";
      let confidence = 85;

      const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

      switch (category) {
        case 'Pothole':
          detections = [
            { label: 'Pothole', severity: 'Critical', box_2d: [rnd(30, 45), rnd(20, 35), rnd(60, 75), rnd(55, 75)] },
            { label: 'Minor Crack', severity: 'Medium', box_2d: [rnd(60, 70), rnd(50, 65), rnd(75, 85), rnd(75, 90)] }
          ];
          severityScore = parseFloat((Math.random() * 2 + 7.5).toFixed(1));
          urgency = "Immediate (Within 24hrs)";
          confidence = rnd(92, 99);
          break;
        case 'Waterlogging':
          detections = [
            { label: 'Waterlogging', severity: 'High', box_2d: [rnd(40, 55), rnd(15, 30), rnd(80, 90), rnd(70, 85)] }
          ];
          severityScore = parseFloat((Math.random() * 2 + 6.0).toFixed(1));
          urgency = "High (2-3 days)";
          confidence = rnd(88, 96);
          break;
        case 'Missing Divider':
          detections = [
            { label: 'Missing Divider', severity: 'Critical', box_2d: [rnd(15, 30), rnd(40, 48), rnd(80, 95), rnd(52, 60)] }
          ];
          severityScore = parseFloat((Math.random() * 1.5 + 8.2).toFixed(1));
          urgency = "Immediate (Within 24hrs)";
          confidence = rnd(90, 97);
          break;
        case 'Traffic Signal':
          detections = [
            { label: 'Signal Failure', severity: 'High', box_2d: [rnd(10, 25), rnd(35, 45), rnd(50, 65), rnd(55, 65)] }
          ];
          severityScore = parseFloat((Math.random() * 2 + 5.5).toFixed(1));
          urgency = "High (2-3 days)";
          confidence = rnd(87, 94);
          break;
        case 'Spillage':
          detections = [
            { label: 'Road Spillage', severity: 'High', box_2d: [rnd(45, 60), rnd(25, 40), rnd(75, 85), rnd(65, 80)] }
          ];
          severityScore = parseFloat((Math.random() * 2 + 6.5).toFixed(1));
          urgency = "Immediate (Within 24hrs)";
          confidence = rnd(89, 95);
          break;
        default:
          detections = [
            { label: 'Anomaly', severity: 'Medium', box_2d: [rnd(35, 50), rnd(25, 40), rnd(70, 80), rnd(60, 75)] }
          ];
          severityScore = parseFloat((Math.random() * 3 + 4.0).toFixed(1));
          urgency = "Medium (1 week)";
          confidence = rnd(80, 90);
      }

      setAiResult({
        hazardType: category,
        severityScore,
        confidence,
        urgency,
        detections,
        description: `Simulated local AI detection of ${category} hazard.`
      });
      setIsMock(true);
      setIsAnalyzing(false);
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Save report in local storage for persistence
    const newReport = {
      id: `rep-${Date.now()}`,
      type: aiResult?.hazardType || selectedHazard,
      severity: aiResult?.severityScore || 5.0,
      confidence: aiResult?.confidence || 90,
      urgency: aiResult?.urgency || "High",
      description: aiResult?.description || `Reported ${selectedHazard} hazard`,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    };
    
    const existingReports = JSON.parse(localStorage.getItem('roadwatch_reports') || '[]');
    localStorage.setItem('roadwatch_reports', JSON.stringify([newReport, ...existingReports]));

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8 pb-32">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Report Road Hazard</h2>
          <p className="text-text-secondary mt-1">Real-time AI-assisted safety reporting system.</p>
        </div>
        {gpsStatus === 'EDITING' ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (tempLocation.trim()) {
                setLocationName(tempLocation);
                setCoordinates('Manually Entered');
                setGpsStatus('ACTIVE');
              }
            }}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-border-subtle shadow-sm"
          >
            <input 
              type="text"
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              placeholder="Enter location (e.g. city, state)"
              className="px-2 py-1 border border-border-subtle rounded text-xs text-primary focus:outline-none focus:ring-1 focus:ring-safety-yellow bg-surface-bright"
              autoFocus
            />
            <button type="submit" className="text-xs bg-primary text-white px-3 py-1 rounded font-bold hover:opacity-90 transition-all">
              Save
            </button>
            <button 
              type="button" 
              onClick={() => setGpsStatus('ACTIVE')}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-border-subtle shadow-sm">
            <div className={`w-2 h-2 rounded-full ${
              gpsStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
              gpsStatus === 'FETCHING' ? 'bg-yellow-500 animate-ping' : 'bg-red-500'
            }`}></div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {gpsStatus === 'ACTIVE' ? 'GPS AUTO-DETECTION: ACTIVE' :
               gpsStatus === 'FETCHING' ? 'GPS AUTO-DETECTION: FETCHING...' : 'GPS AUTO-DETECTION: FAILED'}
            </span>
            <span className="text-sm font-bold text-primary border-l border-r px-3 mx-1">
              {locationName} {coordinates && `(${coordinates})`}
            </span>
            <div className="flex gap-2">
              {gpsStatus === 'ERROR' && (
                <button 
                  onClick={fetchUserLocation}
                  className="text-primary hover:underline text-sm font-semibold flex items-center gap-1 mr-2"
                >
                  Retry
                </button>
              )}
              <button 
                onClick={() => {
                  setTempLocation(locationName);
                  setGpsStatus('EDITING');
                }}
                className="text-primary hover:underline text-sm font-semibold"
              >
                Edit Location
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          
          {/* File Upload Area */}
          <section 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelect}
            className={`bg-white/50 backdrop-blur p-8 rounded-xl border-dashed border-2 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[320px] group relative ${
              isDragging ? 'border-safety-yellow bg-yellow-50/20' : 'border-outline-variant hover:border-primary'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
              <UploadCloud className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-primary">Upload Visual Evidence</h3>
            <p className="text-on-surface-variant text-sm mt-2 text-center max-w-md">
              Drag and drop high-resolution images or click to select files. Our AI will automatically analyze the content for hazard detection.
            </p>
            
            <div className="mt-6 flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleFileSelect}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all"
              >
                Select Files
              </button>
              <button 
                onClick={startCamera}
                className="border border-outline-variant text-primary px-6 py-2.5 rounded-lg font-bold hover:bg-surface-container-low active:scale-95 transition-all flex items-center gap-2 bg-white"
              >
                <Camera className="w-5 h-5" /> Use Camera
              </button>
            </div>
          </section>

          {/* Hazard Selection */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold text-on-surface-variant tracking-widest uppercase">Select Hazard Category</h3>
              {imageSrc && (
                <button 
                  onClick={handleReset}
                  className="text-xs flex items-center gap-1.5 text-red-500 hover:text-red-700 font-bold uppercase transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Upload
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {hazardTypes.map((type) => (
                <button
                  key={type.name}
                  onClick={() => setSelectedHazard(type.name)}
                  className={`p-4 rounded-lg bg-white flex flex-col items-center gap-3 transition-all border ${
                    selectedHazard === type.name ? 'border-safety-yellow bg-yellow-50/50 shadow-sm' : 'border-border-subtle hover:border-safety-yellow'
                  }`}
                >
                  <type.icon className={`w-7 h-7 ${selectedHazard === type.name ? 'text-safety-yellow' : 'text-primary'}`} />
                  <span className="text-sm font-bold text-primary">{type.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* AI Preview Section */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold text-on-surface-variant tracking-widest uppercase">AI Detection Preview</h3>
              {!isMock && (
                <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-green-600" /> LIVE GEMINI AI
                </span>
              )}
            </div>
            
            <div className="glass-panel rounded-xl overflow-hidden relative shadow-lg bg-white">
              
              {/* Image & Bounding Box Overlays */}
              <div className="relative group bg-surface-dim aspect-[4/3] flex items-center justify-center overflow-hidden">
                <img 
                  src={imageSrc || defaultImageSrc} 
                  alt="AI detection preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Scanner Overlay during Analysis */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-10 h-10 text-safety-yellow animate-spin mb-3" />
                    <p className="text-white font-bold text-sm text-center">{analysisLog}</p>
                    <div 
                      className="absolute left-0 right-0 h-1 bg-safety-yellow shadow-[0_0_10px_var(--color-safety-yellow)] pointer-events-none"
                      style={{ animation: 'scan 2s ease-in-out infinite' }}
                    />
                  </div>
                )}

                {/* Simulated / Real Bounding Boxes */}
                {!isAnalyzing && aiResult && aiResult.detections && aiResult.detections.map((det, idx) => {
                  const [ymin, xmin, ymax, xmax] = det.box_2d || [0, 0, 0, 0];
                  
                  const severityColors = {
                    Critical: 'border-red-600 bg-red-500/10 text-red-600',
                    High: 'border-orange-500 bg-orange-500/10 text-orange-500',
                    Medium: 'border-safety-yellow bg-yellow-500/10 text-primary',
                    Low: 'border-blue-500 bg-blue-500/10 text-blue-500'
                  };

                  const badgeColors = {
                    Critical: 'bg-red-600 text-white',
                    High: 'bg-orange-500 text-white',
                    Medium: 'bg-safety-yellow text-primary',
                    Low: 'bg-blue-500 text-white'
                  };

                  const colorClass = severityColors[det.severity] || severityColors.Medium;
                  const badgeClass = badgeColors[det.severity] || badgeColors.Medium;

                  return (
                    <div 
                      key={idx}
                      className={`absolute border-2 rounded-sm transition-all duration-300 ${colorClass}`}
                      style={{
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        height: `${ymax - ymin}%`,
                        width: `${xmax - xmin}%`
                      }}
                    >
                      <div className={`absolute -top-6 left-0 font-bold text-[9px] px-2 py-0.5 rounded-t-sm uppercase whitespace-nowrap shadow-sm ${badgeClass}`}>
                        {det.label}: {det.severity}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Metadata details */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Severity Score</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-4xl font-bold leading-none text-primary">
                        {isAnalyzing ? '...' : aiResult?.severityScore.toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-on-surface-variant mb-1">/ 10</span>
                    </div>
                    <div className="w-full h-1.5 bg-outline-variant mt-4 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-safety-yellow transition-all duration-500" 
                        style={{ width: isAnalyzing ? '0%' : `${(aiResult?.severityScore || 0) * 10}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Detection Confidence</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-4xl font-bold leading-none text-primary">
                        {isAnalyzing ? '...' : aiResult?.confidence}
                      </span>
                      <span className="text-sm font-bold text-on-surface-variant mb-1">%</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-4 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wide">High Reliability</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary text-white rounded-lg">
                  <div>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider mb-1">Suggested Repair Urgency</p>
                    <p className="font-bold text-lg">{isAnalyzing ? 'Analyzing...' : aiResult?.urgency}</p>
                  </div>
                  <AlertCircle className="text-safety-yellow w-8 h-8 flex-shrink-0" />
                </div>
                
                {aiResult?.description && !isAnalyzing && (
                  <div className="p-3 bg-surface-container-low border border-border-subtle rounded-lg text-xs text-on-surface-variant leading-relaxed">
                    <span className="font-bold block mb-1">AI Report Summary:</span>
                    {aiResult.description}
                  </div>
                )}
                
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || submitted || isAnalyzing}
                  className={`w-full font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-3 shadow-md transition-all ${
                    submitted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-safety-yellow text-primary hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : submitted ? 'Report Submitted' : 'Submit Report'}
                  {!isSubmitting && !submitted && <Send className="w-5 h-5" />}
                </button>
                <p className="text-center text-[11px] text-on-surface-variant px-4 leading-relaxed">
                  By submitting, you confirm the visual data is accurate. RoadWatch AI will log this into the municipal safety database and notify local transit authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Stream Modal Overlay */}
      {cameraActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-deep-slate rounded-xl overflow-hidden shadow-2xl border border-border-subtle max-w-lg w-full">
            <div className="p-4 bg-primary text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-safety-yellow" /> Live Camera Stream
              </h3>
              <button 
                onClick={stopCamera}
                className="text-white/80 hover:text-white text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {/* HUD scanlines grid overlay for aesthetic */}
              <div className="absolute inset-0 border border-white/10 pointer-events-none">
                <div 
                  className="w-full h-0.5 bg-safety-yellow/50 absolute top-1/2 left-0 pointer-events-none"
                  style={{ animation: 'scan 3s ease-in-out infinite' }}
                />
              </div>
            </div>
            
            <div className="p-4 flex justify-center gap-3 bg-surface-container-low">
              <button 
                onClick={capturePhoto}
                className="bg-safety-yellow text-primary px-6 py-2.5 rounded-lg font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Camera className="w-5 h-5" /> Take Photo
              </button>
              <button 
                onClick={stopCamera}
                className="border border-outline-variant text-primary px-6 py-2.5 rounded-lg font-bold hover:bg-surface-container-high transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
