import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  HelpCircle, 
  Calendar, 
  Droplets, 
  Car, 
  BarChart3, 
  AlertCircle, 
  Sparkles, 
  BrainCircuit,
  Compass
} from 'lucide-react';
import { getReports, Report } from '../utils/storage';

interface PredictionSegment {
  id: string;
  segmentName: string;
  roadName: string;
  district: string;
  failureProbability: number; // %
  predictedFailureDays: number;
  riskCategory: 'Severe' | 'Major' | 'Warning' | 'Stable';
  rainfallImpact: 'High' | 'Medium' | 'Low';
  trafficDensity: 'High' | 'Medium' | 'Low';
  historicalAccidents: number;
  recommendation: string;
}

export function PredictiveAnalytics() {
  const [activeDistrict, setActiveDistrict] = useState<string>('All');
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

  const baseSegments = [
    {
      id: 'seg-101',
      segmentName: 'A12-Orchard North',
      roadName: 'Orchard Link',
      district: 'Orchard Sector',
      matchKeys: ['orchard'],
      defaultProbability: 84,
      rainfallImpact: 'High' as const,
      trafficDensity: 'High' as const,
      historicalAccidents: 4,
      baseRecommendation: 'Schedule asphalt sealing. Water runoff pooling is accelerating micro-fissure expansion.'
    },
    {
      id: 'seg-102',
      segmentName: 'B07-Bayfront Northbound',
      roadName: 'Bayfront Ave',
      district: 'Marina Bay',
      matchKeys: ['bayfront'],
      defaultProbability: 78,
      rainfallImpact: 'High' as const,
      trafficDensity: 'High' as const,
      historicalAccidents: 2,
      baseRecommendation: 'Clear roadside drains. Heavy rain predictions indicate sub-layer soil saturation limits will be breached.'
    },
    {
      id: 'seg-103',
      segmentName: 'C22-Cross Street East',
      roadName: 'Cross St',
      district: 'Downtown Core',
      matchKeys: ['cross'],
      defaultProbability: 52,
      rainfallImpact: 'Medium' as const,
      trafficDensity: 'High' as const,
      historicalAccidents: 1,
      baseRecommendation: 'Monitor structural vibrations. Construction works nearby are creating aggregate displacement risks.'
    },
    {
      id: 'seg-104',
      segmentName: 'D09-Geylang Bypass',
      roadName: 'Geylang Road',
      district: 'Geylang East',
      matchKeys: ['geylang'],
      defaultProbability: 35,
      rainfallImpact: 'Low' as const,
      trafficDensity: 'Medium' as const,
      historicalAccidents: 0,
      baseRecommendation: 'Routine maintenance sweep scheduled. Surface layer shows standard friction wear index.'
    },
    {
      id: 'seg-105',
      segmentName: 'E15-Napier Outer Lane',
      roadName: 'Napier Rd',
      district: 'Orchard Sector',
      matchKeys: ['napier'],
      defaultProbability: 72,
      rainfallImpact: 'High' as const,
      trafficDensity: 'Medium' as const,
      historicalAccidents: 3,
      baseRecommendation: 'Plan aggregate binder injection. Heavy bus transit is creating localized shear stress fractures.'
    }
  ];

  const predictiveSegments: PredictionSegment[] = baseSegments.map(seg => {
    const matchingHazards = reports.filter(r => 
      !r.resolved && 
      seg.matchKeys.some(key => r.location.toLowerCase().includes(key) || r.title.toLowerCase().includes(key))
    );

    let probability = seg.defaultProbability;
    if (matchingHazards.length > 0) {
      probability += matchingHazards.length * 8;
      matchingHazards.forEach(h => {
        if (h.severity === 'Critical') probability += 10;
      });
    } else {
      probability = Math.round(probability / 2);
    }
    probability = Math.min(98, Math.max(10, probability));

    const predictedFailureDays = Math.max(7, Math.round(90 * (1 - probability / 100)));

    let riskCategory: 'Severe' | 'Major' | 'Warning' | 'Stable' = 'Stable';
    if (probability >= 80) riskCategory = 'Severe';
    else if (probability >= 60) riskCategory = 'Major';
    else if (probability >= 40) riskCategory = 'Warning';

    const recommendation = matchingHazards.length > 0
      ? `[ALERT: ${matchingHazards.length} ACTIVE INCIDENT${matchingHazards.length > 1 ? 'S' : ''}] ${seg.baseRecommendation}`
      : `No immediate threats. ${seg.baseRecommendation}`;

    return {
      id: seg.id,
      segmentName: seg.segmentName,
      roadName: seg.roadName,
      district: seg.district,
      failureProbability: probability,
      predictedFailureDays,
      riskCategory,
      rainfallImpact: seg.rainfallImpact,
      trafficDensity: seg.trafficDensity,
      historicalAccidents: seg.historicalAccidents,
      recommendation
    };
  });

  const filteredSegments = activeDistrict === 'All' 
    ? predictiveSegments 
    : predictiveSegments.filter(s => s.district === activeDistrict);

  // Dynamic calculations for Risk Score
  const avgRiskScore = Math.round(
    predictiveSegments.reduce((acc, curr) => acc + curr.failureProbability, 0) / predictiveSegments.length
  );

  const severeSegmentsCount = predictiveSegments.filter(s => s.riskCategory === 'Severe').length;
  const majorSegmentsCount = predictiveSegments.filter(s => s.riskCategory === 'Severe' || s.riskCategory === 'Major').length;

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Severe':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Major':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getFailureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Find highest risk segment
  const highestRiskSeg = [...predictiveSegments].sort((a,b) => b.failureProbability - a.failureProbability)[0];

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Road Risk Prediction Section</h2>
        <p className="text-text-secondary mt-1">AI-powered forecasting, future damage probability models, and high-risk municipal warning alerts.</p>
      </div>

      {/* AI RISK INSIGHTS CARD */}
      <div className="bg-gradient-to-tr from-purple-900 to-indigo-900 text-white rounded-xl p-6 shadow-md border border-white/5 mb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-safety-yellow animate-pulse shrink-0" />
            <span className="text-xs font-black tracking-wider uppercase text-safety-yellow">AI-Powered Risk Forecast Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {highestRiskSeg ? `${highestRiskSeg.roadName} has a ${highestRiskSeg.failureProbability}% risk of pavement failure within the next ${highestRiskSeg.predictedFailureDays} days.` : "All pavement sectors currently stable."}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {severeSegmentsCount > 0 ? `${severeSegmentsCount} high-priority deterioration sectors flagged. Proactive maintenance clearing advised.` : "No immediate precipitation deterioration warnings flagged."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metrics (Risk score, high risk zones) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Risk Score Gauge */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Average Pavement Risk Score</span>
            <div className="text-3xl font-black text-primary">
              {avgRiskScore}<span className="text-sm font-semibold text-text-secondary">/100</span>
            </div>
            <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +2.5% increase in deterioration
            </p>
          </div>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-black border border-red-100">
            {avgRiskScore >= 70 ? 'High' : 'Med'}
          </div>
        </div>

        {/* High-Risk Zones */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">High-Risk Zones</span>
            <div className="text-3xl font-black text-primary">
              {severeSegmentsCount} <span className="text-xs font-semibold text-text-secondary">Severe Sectors</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">Orchard Rd Link & Bayfront Ave</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Predicted Damage Areas */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Predicted Damage Areas</span>
            <div className="text-3xl font-black text-primary">
              {majorSegmentsCount} <span className="text-xs font-semibold text-text-secondary">Impact Areas</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-1 font-medium">Proactive paving dispatches queued</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Compass className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Decay curves & Environmental variables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Decay curves */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
          <h3 className="font-bold text-xs text-primary flex items-center gap-1.5 border-b border-border-subtle/50 pb-3 mb-4 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-primary" /> Projected Pavement Decay Curves (12 Months)
          </h3>
          
          <div className="relative w-full h-[220px] bg-slate-50 rounded-xl p-4 border border-border-subtle flex flex-col justify-between">
            <svg viewBox="0 0 500 180" className="w-full h-full">
              <line x1="40" y1="20" x2="460" y2="20" stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" />
              <line x1="40" y1="70" x2="460" y2="70" stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" />
              <line x1="40" y1="120" x2="460" y2="120" stroke="#E5E7EB" strokeDasharray="3,3" strokeWidth="1" />
              <line x1="40" y1="160" x2="460" y2="160" stroke="#9CA3AF" strokeWidth="1" />

              {/* Curve 1: Severe (Orchard) */}
              <path d="M 40 25 Q 120 40 200 80 T 360 145 T 460 160" fill="none" stroke="#EF4444" strokeWidth="2.5" />
              {/* Curve 2: Major (Bayfront) */}
              <path d="M 40 25 Q 150 35 260 65 T 390 110 T 460 135" fill="none" stroke="#F59E0B" strokeWidth="2" />
              {/* Curve 3: Stable (Geylang) */}
              <path d="M 40 25 Q 180 30 300 45 T 420 70 T 460 85" fill="none" stroke="#10B981" strokeWidth="2" />

              <circle cx="200" cy="80" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="210" y="76" fontSize="9" fontWeight="bold" fill="#EF4444">Sector A12 (Month 5)</text>

              <circle cx="260" cy="65" r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="270" y="60" fontSize="9" fontWeight="bold" fill="#D97706">Sector B07 (Month 7)</text>

              <text x="5" y="24" fontSize="8" fontWeight="bold" fill="#6B7280">100% (New)</text>
              <text x="5" y="74" fontSize="8" fontWeight="bold" fill="#6B7280">50% (Decay)</text>
              <text x="5" y="124" fontSize="8" fontWeight="bold" fill="#6B7280">20% (Failure)</text>
              <text x="5" y="164" fontSize="8" fontWeight="bold" fill="#6B7280">0%</text>

              <text x="40" y="174" fontSize="8" fontWeight="bold" fill="#6B7280" textAnchor="middle">May 26</text>
              <text x="145" y="174" fontSize="8" fontWeight="bold" fill="#6B7280" textAnchor="middle">Aug 26</text>
              <text x="250" y="174" fontSize="8" fontWeight="bold" fill="#6B7280" textAnchor="middle">Nov 26</text>
              <text x="355" y="174" fontSize="8" fontWeight="bold" fill="#6B7280" textAnchor="middle">Feb 27</text>
              <text x="460" y="174" fontSize="8" fontWeight="bold" fill="#6B7280" textAnchor="middle">May 27</text>
            </svg>

            <div className="flex justify-center gap-6 text-[10px] font-bold text-text-secondary border-t border-border-subtle pt-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> High Stress (Heavy Transit)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> Moderate Stress</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm"></span> Low Stress (Residential)</span>
            </div>
          </div>
        </div>

        {/* Environmental forecast factors */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs text-primary flex items-center gap-1.5 border-b border-border-subtle/50 pb-3 mb-4 uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4 text-primary" /> key Forecast weightings
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4 font-semibold">
              The AI models predict future cracks by factoring traffic tonnage and rainfall saturation weights.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-border-subtle rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Precipitation saturated load</h4>
                  <p className="text-[9px] text-text-secondary">Rainfall water runoff</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">x1.48</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-border-subtle rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Heavy Transit Load</h4>
                  <p className="text-[9px] text-text-secondary">Average heavy vehicle axle rate</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">x1.82</span>
            </div>
          </div>
        </div>

      </div>

      {/* District filters */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-border-subtle shadow-sm w-max">
        {(['All', 'Orchard Sector', 'Marina Bay', 'Downtown Core', 'Geylang East'] as const).map((dist) => (
          <button
            key={dist}
            onClick={() => setActiveDistrict(dist)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeDistrict === dist 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-primary hover:bg-slate-50'
            }`}
          >
            {dist}
          </button>
        ))}
      </div>

      {/* Segment Predictions list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSegments.map((seg) => (
          <div 
            key={seg.id}
            className="bg-white rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                    Segment {seg.segmentName}
                  </span>
                  <h3 className="text-base font-bold text-primary leading-tight mt-1.5">{seg.roadName}</h3>
                  <span className="text-[10px] text-text-secondary font-semibold">📍 Area: {seg.district}</span>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRiskColor(seg.riskCategory)}`}>
                    {seg.riskCategory} Risk
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-black text-primary">{seg.failureProbability}%</span>
                    <span className="text-[10px] text-text-secondary font-semibold">Risk Probability</span>
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-subtle">
                  <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Estimated Date</span>
                  <span className="text-[11px] text-primary font-bold mt-1 block flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> {getFailureDate(seg.predictedFailureDays)}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-subtle">
                  <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Rainfall Impact</span>
                  <span className="text-[11px] text-primary font-bold mt-1 block flex items-center justify-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> {seg.rainfallImpact}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-border-subtle">
                  <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider block">Traffic Tonnage</span>
                  <span className="text-[11px] text-primary font-bold mt-1 block flex items-center justify-center gap-1">
                    <Car className="w-3.5 h-3.5 text-orange-500" /> {seg.trafficDensity}
                  </span>
                </div>
              </div>
            </div>

            {/* AI intervene suggestion */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3 items-start mt-auto">
              <Sparkles className="w-4.5 h-4.5 text-safety-yellow flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[9px] font-bold text-primary uppercase tracking-wider font-black">AI Road Safety Mitigation Advice</span>
                <p className="text-[11px] text-primary font-semibold leading-relaxed mt-1">
                  {seg.recommendation}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
