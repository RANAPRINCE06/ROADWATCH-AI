import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert, Users, DollarSign, Calendar, Filter, ArrowUpDown, BrainCircuit, Activity } from 'lucide-react';
import { getReports, resolveReport, Report } from '../utils/storage';

interface PriorityItem {
  id: string;
  type: 'pothole' | 'flooding' | 'obstacle' | 'signal' | 'other';
  title: string;
  location: string;
  district: string;
  priorityScore: number; // 0-100
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  trafficImpact: 'Severe' | 'High' | 'Moderate' | 'Low';
  accidentRisk: number; // %
  complaintWeight: number; // count/votes
  roadImportance: 'Highway' | 'Arterial' | 'Local';
  cost: number;
  deadline: string;
  team: string;
  status: 'Pending' | 'Scheduled' | 'In Progress';
}

export function PriorityCenter() {
  const [reports, setReports] = useState<Report[]>(() => getReports());
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'risk'>('score');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  useEffect(() => {
    const handleSync = () => {
      setReports(getReports());
    };
    window.addEventListener('roadwatch-reports-updated', handleSync);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleSync);
    };
  }, []);

  // Compute priority items dynamically from storage reports
  const priorityItems: PriorityItem[] = reports
    .filter(r => !r.resolved)
    .map((r, idx) => {
      // Map icons to categories
      let type: PriorityItem['type'] = 'pothole';
      if (r.icon === 'droplets') type = 'flooding';
      else if (r.icon === 'hardhat') type = 'obstacle';
      else if (r.title.toLowerCase().includes('signal')) type = 'signal';
      else if (r.icon === 'alert') type = 'pothole';
      else type = 'other';

      // Parse districts from location name or assign logically
      let district = 'Downtown Core';
      if (r.location.toLowerCase().includes('orchard')) district = 'Orchard Sector';
      else if (r.location.toLowerCase().includes('bayfront') || r.location.toLowerCase().includes('marina')) district = 'Marina Bay';
      else if (r.location.toLowerCase().includes('geylang')) district = 'Geylang East';
      else if (r.location.toLowerCase().includes('jurong')) district = 'Jurong West';

      // Calculate Priority Score deterministically
      let severityPoints = 25;
      let severityLabel: PriorityItem['severity'] = 'Medium';
      if (r.severity === 'Critical') {
        severityPoints = 45;
        severityLabel = 'Critical';
      } else if (r.severity === 'Active') {
        severityPoints = 30;
        severityLabel = 'High';
      } else if (r.severity === 'Pending') {
        severityPoints = 15;
        severityLabel = 'Low';
      }

      // Generate parameters based on ID or index to look realistic
      const hash = r.title.length + r.location.length + idx;
      const trafficImpact: PriorityItem['trafficImpact'] = 
        hash % 4 === 0 ? 'Severe' : hash % 4 === 1 ? 'High' : hash % 4 === 2 ? 'Moderate' : 'Low';
      
      const trafficPoints = trafficImpact === 'Severe' ? 25 : trafficImpact === 'High' ? 18 : trafficImpact === 'Moderate' ? 10 : 5;
      
      const roadImportance: PriorityItem['roadImportance'] = 
        r.location.toLowerCase().includes('expressway') || r.location.toLowerCase().includes('highway') ? 'Highway' :
        r.location.toLowerCase().includes('rd') || r.location.toLowerCase().includes('ave') ? 'Arterial' : 'Local';
      
      const roadPoints = roadImportance === 'Highway' ? 15 : roadImportance === 'Arterial' ? 10 : 5;

      const accidentRisk = Math.min(96, Math.max(12, (severityPoints + trafficPoints + (hash % 15))));
      const complaintWeight = hash % 20 + 3; // complaint votes simulation
      const priorityScore = Math.min(100, Math.round(severityPoints + trafficPoints + roadPoints + (complaintWeight * 0.5)));

      // Costs & assignments
      const cost = type === 'flooding' ? 8500 : type === 'pothole' ? 1200 : type === 'obstacle' ? 2400 : 950;
      const deadlineDays = priorityScore > 85 ? '12 Hours' : priorityScore > 70 ? '24 Hours' : priorityScore > 50 ? '3 Days' : '7 Days';
      
      const teams = ['Team Alpha (Resurfacing)', 'Team Delta (Drainage)', 'Team Gamma (Rapid Response)', 'Team Epsilon (Signals)'];
      const team = type === 'flooding' ? teams[1] : type === 'pothole' ? teams[0] : type === 'signal' ? teams[3] : teams[2];

      const status: PriorityItem['status'] = r.severity === 'Critical' ? 'Pending' : r.severity === 'Active' ? 'Scheduled' : 'In Progress';

      return {
        id: r.id,
        type,
        title: r.title,
        location: r.location,
        district,
        priorityScore,
        severity: severityLabel,
        trafficImpact,
        accidentRisk,
        complaintWeight,
        roadImportance,
        cost,
        deadline: deadlineDays,
        team,
        status
      };
    });

  // Unique lists for filters
  const districts = ['All', ...Array.from(new Set(priorityItems.map(item => item.district)))];

  // Filtering & Sorting
  const filteredItems = priorityItems.filter(item => {
    const matchDistrict = filterDistrict === 'All' || item.district === filterDistrict;
    
    let matchPriority = true;
    if (filterPriority !== 'All') {
      if (filterPriority === 'Critical') matchPriority = item.priorityScore >= 85;
      else if (filterPriority === 'High') matchPriority = item.priorityScore >= 70 && item.priorityScore < 85;
      else if (filterPriority === 'Medium') matchPriority = item.priorityScore >= 50 && item.priorityScore < 70;
      else if (filterPriority === 'Low') matchPriority = item.priorityScore < 50;
    }

    return matchDistrict && matchPriority;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'score') return b.priorityScore - a.priorityScore;
    if (sortBy === 'cost') return b.cost - a.cost;
    if (sortBy === 'risk') return b.accidentRisk - a.accidentRisk;
    return 0;
  });

  const getPriorityColorClass = (score: number) => {
    if (score >= 85) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getPriorityBadgeLabel = (score: number) => {
    if (score >= 85) return 'Critical';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  };

  // Top AI Recommendation
  const topCriticalItem = sortedItems.find(item => item.priorityScore >= 85);
  const aiRecommendation = topCriticalItem 
    ? `Deploy ${topCriticalItem.team} to resolve the "${topCriticalItem.title}" at ${topCriticalItem.location} within ${topCriticalItem.deadline}. Resolving this will reduce traffic delays in the ${topCriticalItem.district} sector by approx 42% and decrease safety risk index.`
    : reports.filter(r => !r.resolved).length > 0
      ? `Conduct structural maintenance sweeps along arterial roads. Current high priority sectors are stable, but regular inspections are recommended.`
      : `All city sectors are clear. No high priority repairs logged at this time. Operations are running at 100% safety parameters.`;

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">AI Repair Priority Center</h2>
          <p className="text-text-secondary mt-1">Algorithmic repair scheduling optimization and budget allocation matrix.</p>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/20 shadow-lg bg-primary/5 mb-8 flex gap-4 items-start">
        <div className="p-3 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
          <BrainCircuit className="w-6 h-6 text-safety-yellow" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-safety-yellow" /> AI Priority Dispatch recommendation
          </span>
          <p className="text-sm font-semibold text-primary mt-1.5 leading-relaxed">
            {aiRecommendation}
          </p>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-xl border border-border-subtle mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none cursor-pointer"
          >
            {districts.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">🔴 Critical (85+)</option>
            <option value="High">🟠 High (70-84)</option>
            <option value="Medium">🟡 Medium (50-69)</option>
            <option value="Low">🟢 Low (&lt;50)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
            <ArrowUpDown className="w-4 h-4" /> Sort by:
          </span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-border-subtle">
            <button
              onClick={() => setSortBy('score')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                sortBy === 'score' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Priority Score
            </button>
            <button
              onClick={() => setSortBy('cost')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                sortBy === 'cost' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Cost
            </button>
            <button
              onClick={() => setSortBy('risk')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                sortBy === 'risk' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
              }`}
            >
              Accident Risk
            </button>
          </div>
        </div>
      </div>

      {/* Priority Matrix List */}
      <div className="space-y-4">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-all duration-200 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Score and Category */}
              <div className="lg:col-span-2 flex items-center gap-4 border-r border-border-subtle/50 pr-4">
                <div className="text-center flex-shrink-0">
                  <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">AI Priority</span>
                  <div className="text-4xl font-extrabold text-primary tracking-tighter mt-0.5">
                    {item.priorityScore}
                  </div>
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full border text-center uppercase tracking-wider ${getPriorityColorClass(item.priorityScore)}`}>
                    {getPriorityBadgeLabel(item.priorityScore)}
                  </span>
                  <span className="text-[9px] text-text-secondary text-center uppercase font-bold mt-0.5">
                    {item.roadImportance} Route
                  </span>
                </div>
              </div>

              {/* Hazard Meta details */}
              <div className="lg:col-span-4 space-y-1.5">
                <h4 className="font-bold text-sm text-primary leading-tight flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-safety-yellow flex-shrink-0" />
                  {item.title}
                </h4>
                <p className="text-xs text-text-secondary font-medium">
                  📍 {item.location} ({item.district})
                </p>
                <div className="flex gap-4 text-[10px] text-text-secondary font-semibold">
                  <span>Accident Probability: <strong className="text-red-600">{item.accidentRisk}%</strong></span>
                  <span>Traffic Impact: <strong className="text-primary">{item.trafficImpact}</strong></span>
                  <span>Upvotes: <strong>{item.complaintWeight}</strong></span>
                </div>
              </div>

              {/* Dispatch team details */}
              <div className="lg:col-span-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Assigned Team:</span>
                </div>
                <p className="text-xs font-semibold text-primary pl-5">{item.team}</p>
                <p className="text-[10px] text-text-secondary pl-5">Status: <strong className="text-primary font-bold">{item.status}</strong></p>
              </div>

              {/* Repair budget and Deadlines */}
              <div className="lg:col-span-2 space-y-1">
                <div className="flex items-center gap-1 text-xs text-text-secondary font-semibold">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  <span>Cost: <strong>${item.cost.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Target: <strong className="text-primary font-bold">{item.deadline}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <div className="lg:col-span-1 flex justify-end">
                <button
                  onClick={() => {
                    resolveReport(item.id);
                  }}
                  className="bg-primary hover:bg-neutral-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-safety-yellow" /> Resolve
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-border-subtle p-16 text-center shadow-sm">
            <BrainCircuit className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
            <h4 className="font-bold text-sm text-primary">Priority Repair Ledger Clear</h4>
            <p className="text-xs text-text-secondary mt-1">No active reports match the selected filters. Operations normal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
