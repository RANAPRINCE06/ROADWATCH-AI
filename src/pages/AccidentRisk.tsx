import React, { useState, useEffect } from 'react';
import { AlertOctagon, TrendingUp, Sparkles, MapPin, Award, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import { getReports, Report } from '../utils/storage';

interface RiskZone {
  id: string;
  roadSegment: string;
  locationName: string;
  collisionProbability: number; // %
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  contributingFactors: string;
  recommendedCountermeasure: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

export function AccidentRisk() {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-1');
  const [reports, setReports] = useState<Report[]>(() => getReports());

  useEffect(() => {
    const handleSync = () => {
      setReports(getReports());
    };
    window.addEventListener('roadwatch-reports-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
    };
  }, []);

  const segments = [
    {
      id: 'zone-1',
      roadSegment: 'Orchard Rd Sector 4',
      locationName: 'Sector 4, Orchard Rd',
      matchKeys: ['orchard'],
      defaultLat: 1.3048,
      defaultLng: 103.8318,
      defaultX: 35,
      defaultY: 50,
      baseCountermeasure: 'Deploy Team Alpha for emergency patch. Install temporary illuminated warning beacons and cap speed limit at 40 km/h.'
    },
    {
      id: 'zone-2',
      roadSegment: 'Bayfront Ave Sliproad',
      locationName: 'Bayfront Ave North',
      matchKeys: ['bayfront'],
      defaultLat: 1.2847,
      defaultLng: 103.8590,
      defaultX: 65,
      defaultY: 30,
      baseCountermeasure: 'Execute suction drainage clearance. Deploy emergency warning signage 100m upstream of blindspot.'
    },
    {
      id: 'zone-3',
      roadSegment: 'Cross St Eastbound Junction',
      locationName: 'Cross St Junction',
      matchKeys: ['cross'],
      defaultLat: 1.2789,
      defaultLng: 103.8485,
      defaultX: 80,
      defaultY: 75,
      baseCountermeasure: 'Instruct construction contractors to reinforce barricade reflective guides and deploy safety signalers.'
    },
    {
      id: 'zone-4',
      roadSegment: 'Geylang Rd Lane 3 Intersection',
      locationName: 'Geylang Rd Junction',
      matchKeys: ['geylang'],
      defaultLat: 1.3120,
      defaultLng: 103.8760,
      defaultX: 50,
      defaultY: 60,
      baseCountermeasure: 'Initiate drain flushing. Apply high-friction surfacing treatment (HFST) on intersection approaches.'
    }
  ];

  const riskZones: RiskZone[] = segments.map(seg => {
    const matchingHazards = reports.filter(r => 
      !r.resolved && 
      seg.matchKeys.some(key => r.location.toLowerCase().includes(key) || r.title.toLowerCase().includes(key))
    );

    let probability = 10;
    matchingHazards.forEach(h => {
      if (h.severity === 'Critical') probability += 45;
      else if (h.severity === 'Active') probability += 25;
      else probability += 12;
    });

    probability = Math.min(98, Math.max(10, probability));

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
    if (probability >= 90) grade = 'F';
    else if (probability >= 70) grade = 'D';
    else if (probability >= 50) grade = 'C';
    else if (probability >= 25) grade = 'B';
    
    let contributingFactors = '';
    if (matchingHazards.length === 0) {
      contributingFactors = 'No active hazards detected. Segment currently in optimal state with regular sensor monitoring.';
    } else {
      const summaries = matchingHazards.map(h => `${h.title} (${h.severity} severity)`).join(', ');
      contributingFactors = `Active hazards present: ${summaries}. High traffic load and varying pavement friction index.`;
    }

    const hasCritical = matchingHazards.some(h => h.severity === 'Critical');
    const recommendedCountermeasure = hasCritical 
      ? `[IMMEDIATE DISPATCH REQUIRED] ${seg.baseCountermeasure}`
      : `Monitor telemetry scans. ${seg.baseCountermeasure}`;

    const lat = matchingHazards[0]?.lat || seg.defaultLat;
    const lng = matchingHazards[0]?.lng || seg.defaultLng;
    const x = matchingHazards[0]?.x || seg.defaultX;
    const y = matchingHazards[0]?.y || seg.defaultY;

    return {
      id: seg.id,
      roadSegment: seg.roadSegment,
      locationName: seg.locationName,
      collisionProbability: probability,
      grade,
      contributingFactors,
      recommendedCountermeasure,
      lat,
      lng,
      x,
      y
    };
  });

  const selectedZone = riskZones.find(z => z.id === selectedZoneId) || riskZones[0];

  const criticalSectorsCount = riskZones.filter(z => z.grade === 'F' || z.grade === 'D').length;
  const avgProbability = riskZones.reduce((acc, curr) => acc + curr.collisionProbability, 0) / riskZones.length;
  
  let overallGrade = 'A';
  if (avgProbability >= 85) overallGrade = 'F';
  else if (avgProbability >= 70) overallGrade = 'D';
  else if (avgProbability >= 50) overallGrade = 'C';
  else if (avgProbability >= 25) overallGrade = 'B-';

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Accident Risk Intelligence</h2>
        <p className="text-text-secondary mt-1">AI-synthesized crash risk mapping, safety scorecards, and predictive road collision forecasts.</p>
      </div>

      {/* Top statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">High Danger Risk Zones</span>
            <span className="text-2xl font-black text-primary mt-0.5">{criticalSectorsCount} Critical Sector{criticalSectorsCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Target Risk Mitigation</span>
            <span className="text-2xl font-black text-primary mt-0.5">-{Math.min(88, Math.round(50 - avgProbability / 2))}% Collision Rate</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Overall Road Safety Grade</span>
            <span className="text-2xl font-black text-primary mt-0.5">Grade: {overallGrade}</span>
          </div>
        </div>
      </div>

      {/* Split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Collision Map grid & Trend Chart */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Flat Map Plotting Risk Zones */}
          <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-4">
              <MapPin className="w-4 h-4 text-primary" /> Incident Hotspot Spatial Forecast
            </h3>

            <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-800">
              <img 
                className="w-full h-full object-cover opacity-15 grayscale select-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuHFT25LrIudFzN9hASHnRgcA8BFks14OkKHmCUQHsIgxP3_efPdHHmYslWisBVEx-kYPAL-txAPhVyEdBWysgahj1JzAnfyT5ZDTy2s0D9OlsRCR4Ptdllch1EeRvlylM3nqORXTkFaZrifD2-giS6p6l0A1aYfo-GaksLZgNQ4RGx2i2L8P3hRQddcA-WQqfF6xLKPU35tm4cCYL8xEECIOHkl-TNtw2HmoENL3JBWVs9vbh25GB2z1RhXII3CXQ_qhCdGJn7lo" 
                alt="Risk Map"
              />
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

              {/* Plot risk zones */}
              {riskZones.map(zone => {
                const isSelected = zone.id === selectedZoneId;
                const isCritical = zone.collisionProbability >= 80;
                const color = isCritical ? 'border-red-500 bg-red-500/20' : 'border-amber-500 bg-amber-500/20';

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ top: `${zone.y}%`, left: `${zone.x}%` }}
                  >
                    <div className={`relative flex items-center justify-center ${isSelected ? 'scale-125 z-30' : 'hover:scale-110'}`}>
                      <span className={`absolute w-12 h-12 rounded-full border-2 animate-ping opacity-60 ${isCritical ? 'border-red-500 bg-red-500/10' : 'border-amber-500 bg-amber-500/10'}`} />
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shadow-xl ${
                        isCritical ? 'bg-red-600 border-red-400' : 'bg-amber-500 border-amber-300'
                      }`}>
                        {zone.grade}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Accidents Trend Chart */}
          <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-4">
              <TrendingUp className="w-4.5 h-4.5 text-primary" /> Historic Collision Density (Last 5 Years)
            </h3>
            
            <div className="relative w-full h-[140px] p-2 bg-slate-50 border border-border-subtle rounded-xl flex flex-col justify-between">
              <svg viewBox="0 0 500 100" className="w-full h-full">
                <line x1="30" y1="10" x2="470" y2="10" stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="30" y1="50" x2="470" y2="50" stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="30" y1="85" x2="470" y2="85" stroke="#9CA3AF" strokeWidth="1" />

                {/* Trend line: declining accident rate from 88 down to 24 */}
                <path 
                  d="M 30 18 L 140 28 L 250 48 L 360 62 L 470 78" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="2.5"
                />
                <circle cx="30" cy="18" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="140" cy="28" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="250" cy="48" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="360" cy="62" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="470" cy="78" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />

                <text x="30" y="94" fontSize="7" fontWeight="bold" fill="#6B7280" textAnchor="middle">2022</text>
                <text x="140" y="94" fontSize="7" fontWeight="bold" fill="#6B7280" textAnchor="middle">2023</text>
                <text x="250" y="94" fontSize="7" fontWeight="bold" fill="#6B7280" textAnchor="middle">2024</text>
                <text x="360" y="94" fontSize="7" fontWeight="bold" fill="#6B7280" textAnchor="middle">2025</text>
                <text x="470" y="94" fontSize="7" fontWeight="bold" fill="#6B7280" textAnchor="middle">2026</text>

                <text x="5" y="21" fontSize="7" fontWeight="bold" fill="#6B7280">80</text>
                <text x="5" y="53" fontSize="7" fontWeight="bold" fill="#6B7280">40</text>
                <text x="5" y="88" fontSize="7" fontWeight="bold" fill="#6B7280">10</text>
              </svg>
            </div>
            <p className="text-[10px] text-text-secondary text-center mt-2.5 font-bold">
              Graph demonstrates dynamic decline in traffic collisions following placement of AI edge sensors.
            </p>
          </div>
        </section>

        {/* Right Side: Risk Details & Safety scorecard */}
        <section className="lg:col-span-4 space-y-6">
          {/* Active Risk Segment scorecard */}
          <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-sm space-y-5">
            <div className="border-b border-border-subtle/50 pb-3 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-primary leading-tight">{selectedZone.roadSegment}</h4>
                <span className="text-[10px] text-text-secondary font-semibold mt-1 block">📍 {selectedZone.locationName}</span>
              </div>
              <span className={`text-2xl font-black px-3.5 py-1.5 rounded-xl border flex items-center justify-center shadow-inner ${
                selectedZone.collisionProbability >= 80 ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {selectedZone.grade}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Collision Probability</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-primary">{selectedZone.collisionProbability}%</span>
                  <span className="text-[10px] text-text-secondary font-semibold">Risk Index</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Contributing Factors</span>
                <p className="text-xs text-text-secondary leading-relaxed mt-1.5 bg-slate-50 border border-border-subtle p-3 rounded-lg font-medium">
                  {selectedZone.contributingFactors}
                </p>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3 items-start">
                <Sparkles className="w-4.5 h-4.5 text-safety-yellow flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Safety Countermeasure</span>
                  <p className="text-[11px] text-primary font-semibold leading-relaxed mt-1">
                    {selectedZone.recommendedCountermeasure}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick High-Risk segments List */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Dangerous Sectors</h3>
            <div className="space-y-2">
              {riskZones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedZoneId === zone.id ? 'bg-slate-100 border-primary' : 'bg-white border-border-subtle hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-4">
                    <h5 className="font-bold text-xs text-primary truncate leading-tight">{zone.roadSegment}</h5>
                    <span className="text-[9px] text-text-secondary font-medium block mt-1">
                      Probability: {zone.collisionProbability}% • Grade: {zone.grade}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);
