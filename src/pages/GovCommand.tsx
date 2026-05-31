import React, { useState, useEffect } from 'react';
import { ShieldCheck, BarChart3, TrendingUp, DollarSign, Users, Award, ShieldAlert, PieChart } from 'lucide-react';
import { getReports, getSensors, getComplaints } from '../utils/storage';

interface TeamPerformance {
  name: string;
  specialization: string;
  activeDispatches: number;
  successRate: number; // %
  avgResponseTime: string;
  status: 'Deployed' | 'Standby' | 'Active';
}

export function GovCommand() {
  const [reports, setReports] = useState(() => getReports());
  const [sensors, setSensors] = useState(() => getSensors());
  const [complaints, setComplaints] = useState(() => getComplaints());

  useEffect(() => {
    const handleReportsSync = () => setReports(getReports());
    const handleSensorsSync = () => setSensors(getSensors());
    const handleComplaintsSync = () => setComplaints(getComplaints());

    window.addEventListener('roadwatch-reports-updated', handleReportsSync);
    window.addEventListener('roadwatch-sensors-updated', handleSensorsSync);
    window.addEventListener('roadwatch-complaints-updated', handleComplaintsSync);

    return () => {
      window.removeEventListener('roadwatch-reports-updated', handleReportsSync);
      window.removeEventListener('roadwatch-sensors-updated', handleSensorsSync);
      window.removeEventListener('roadwatch-complaints-updated', handleComplaintsSync);
    };
  }, []);

  const activeReportsCount = reports.filter(r => !r.resolved).length;
  const resolvedCount = reports.filter(r => r.resolved).length;

  // Road Health Index dynamic computation
  const calculateRoadHealthIndex = () => {
    if (sensors.length === 0) return 82.5;
    const sum = sensors.reduce((acc, s) => acc + s.roadHealthScore, 0);
    return parseFloat((sum / sensors.length).toFixed(1));
  };
  const roadHealthIndex = calculateRoadHealthIndex();

  // Dynamic budget calculation based on reports
  let drainageSpent = 15000;
  let resurfacingSpent = 12000;
  let signalsSpent = 8000;

  reports.forEach(r => {
    const titleLower = r.title.toLowerCase();
    const isDrainage = titleLower.includes('waterlogging') || titleLower.includes('flood') || r.icon === 'droplets';
    const isResurfacing = titleLower.includes('pothole') || titleLower.includes('crack') || r.icon === 'alert' || r.icon === 'hardhat';

    const cost = r.resolved ? 4500 : 1500;

    if (isDrainage) {
      drainageSpent += cost;
    } else if (isResurfacing) {
      resurfacingSpent += cost;
    } else {
      signalsSpent += cost;
    }
  });

  const spentBudget = drainageSpent + resurfacingSpent + signalsSpent;
  const totalBudget = 100000;
  const remainingBudget = totalBudget - spentBudget;
  const utilizationPercentage = (spentBudget / totalBudget) * 100;

  const drainagePct = spentBudget > 0 ? (drainageSpent / spentBudget) * 100 : 0;
  const resurfacingPct = spentBudget > 0 ? (resurfacingSpent / spentBudget) * 100 : 0;
  const signalsPct = spentBudget > 0 ? (signalsSpent / spentBudget) * 100 : 0;

  const drainageOffset = 220 * (1 - drainagePct / 100);
  const resurfacingOffset = 220 * (1 - resurfacingPct / 100);
  const signalsOffset = 220 * (1 - signalsPct / 100);

  const resurfacingRot = (drainagePct / 100) * 360;
  const signalsRot = ((drainagePct + resurfacingPct) / 100) * 360;

  // District scores & metrics computed dynamically
  const getDistrict = (location: string): string => {
    const loc = location.toLowerCase();
    if (loc.includes('orchard')) return 'Orchard Sector';
    if (loc.includes('marina') || loc.includes('bayfront')) return 'Marina Bay';
    if (loc.includes('geylang') || loc.includes('jalan besar')) return 'Geylang East';
    return 'Downtown Core';
  };

  const districtsMap: Record<string, { active: number; resolved: number }> = {
    'Orchard Sector': { active: 0, resolved: 0 },
    'Marina Bay': { active: 0, resolved: 0 },
    'Downtown Core': { active: 0, resolved: 0 },
    'Geylang East': { active: 0, resolved: 0 }
  };

  reports.forEach(r => {
    const dist = getDistrict(r.location);
    if (r.resolved) {
      districtsMap[dist].resolved++;
    } else {
      districtsMap[dist].active++;
    }
  });

  const districtsData = Object.keys(districtsMap).map(name => {
    const { active, resolved } = districtsMap[name];
    let score = 95;
    score -= active * 5;
    score += resolved * 1.5;
    score = Math.round(Math.min(100, Math.max(50, score)));
    return { name, score, active, resolved };
  });

  // Teams performance computed dynamically
  const teamsList = [
    { name: 'Orchard Resurfacing', specialization: 'Asphalt Resurfacing', baseSuccess: 98.4, baseTime: 38 },
    { name: 'Bishan Pavement Crew', specialization: 'Asphalt Resurfacing', baseSuccess: 96.2, baseTime: 40 },
    { name: 'City Hall Rapid Unit', specialization: 'Rapid Response', baseSuccess: 99.1, baseTime: 15 },
    { name: 'Marina Drainage Ops', specialization: 'Drainage Systems', baseSuccess: 95.8, baseTime: 45 },
    { name: 'Tanjong Signal Patrol', specialization: 'Traffic Signals', baseSuccess: 97.2, baseTime: 30 },
    { name: 'Geylang Drainage Techs', specialization: 'Drainage Systems', baseSuccess: 94.5, baseTime: 48 },
    { name: 'Clementi Quick Squad', specialization: 'Rapid Response', baseSuccess: 98.0, baseTime: 18 },
    { name: 'Changi Signal Team', specialization: 'Traffic Signals', baseSuccess: 96.5, baseTime: 35 },
    { name: 'Woodlands Asphalt Crew', specialization: 'Asphalt Resurfacing', baseSuccess: 97.0, baseTime: 42 },
    { name: 'Jurong Response Team', specialization: 'Rapid Response', baseSuccess: 98.7, baseTime: 16 }
  ];

  const teamData: TeamPerformance[] = teamsList.map(t => {
    const teamReports = reports.filter(r => r.assignedTeam && r.assignedTeam.includes(t.name));
    const activeDispatches = teamReports.filter(r => !r.resolved && (r.status === 'Assigned' || r.status === 'Repairing')).length;
    const resolvedCount = teamReports.filter(r => r.resolved).length;

    let status: 'Deployed' | 'Standby' | 'Active' = 'Standby';
    if (activeDispatches > 0) {
      status = teamReports.some(r => r.status === 'Repairing') ? 'Active' : 'Deployed';
    }

    const successRate = parseFloat(Math.min(100, t.baseSuccess + (resolvedCount * 0.1)).toFixed(1));

    let avgResponseTime = `${t.baseTime} Mins`;
    const resolvedTimes = teamReports.filter(r => r.resolved && r.resolutionTime);
    if (resolvedTimes.length > 0) {
      let totalMins = 0;
      resolvedTimes.forEach(r => {
        const m = r.resolutionTime?.match(/(\d+)/);
        if (m) totalMins += parseInt(m[1], 10);
      });
      avgResponseTime = `${Math.round(totalMins / resolvedTimes.length)} Mins`;
    }

    return {
      name: t.name,
      specialization: t.specialization,
      activeDispatches,
      successRate,
      avgResponseTime,
      status
    };
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Government Command Dashboard</h2>
        <p className="text-text-secondary mt-1">City-wide infrastructure intelligence and municipal resource coordination panel.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* City Road Health Index */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Road Health Index</span>
            <div className="text-3xl font-bold text-primary mt-1">{roadHealthIndex}%</div>
            <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +4.2% vs last month
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center text-green-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Budget utilization */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Budget Spent</span>
            <div className="text-3xl font-bold text-primary mt-1">${spentBudget.toLocaleString()}</div>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              {utilizationPercentage.toFixed(1)}% of $100k budget
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Completion rate */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Repair Completion</span>
            <div className="text-3xl font-bold text-primary mt-1">
              {reports.length > 0 ? ((resolvedCount / reports.length) * 100).toFixed(1) : '100'}%
            </div>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              {resolvedCount} of {reports.length} hazards fixed
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active teams */}
        <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Dispatched Teams</span>
            <div className="text-3xl font-bold text-primary mt-1">
              {teamData.filter(t => t.status !== 'Standby').length} Crews
            </div>
            <p className="text-[10px] text-text-secondary font-semibold mt-1">
              {teamData.filter(t => t.status === 'Standby').length} team{teamData.filter(t => t.status === 'Standby').length === 1 ? '' : 's'} on standby reserve
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

        {/* District Performance Comparison chart */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
          <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-6">
            <BarChart3 className="w-4 h-4 text-primary" /> District Performance Comparison
          </h3>

          <div className="space-y-4">
            {districtsData.map(dist => (
              <div key={dist.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-primary">{dist.name}</span>
                  <span className="text-text-secondary">Safety score: <strong className="text-primary">{dist.score}%</strong> • Fixed: {dist.resolved} / Active: {dist.active}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dist.score >= 90 ? 'bg-green-500' : dist.score >= 80 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dist.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Allocation donut chart */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-4">
            <PieChart className="w-4 h-4 text-primary" /> Budget Breakdown
          </h3>

          <div className="relative flex items-center justify-center h-[120px] mb-4">
            <svg viewBox="0 0 100 100" className="w-[100px] h-[100px] -rotate-90">
              {/* Donut representation */}
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#E5E7EB" strokeWidth="12" />
              {/* Allocation: Drainage, Resurfacing, Signals */}
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="220" strokeDashoffset={drainageOffset} />
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#FACC15" strokeWidth="12" strokeDasharray="220" strokeDashoffset={resurfacingOffset} style={{ transform: `rotate(${resurfacingRot}deg)`, transformOrigin: '50px 50px' }} />
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#F97316" strokeWidth="12" strokeDasharray="220" strokeDashoffset={signalsOffset} style={{ transform: `rotate(${signalsRot}deg)`, transformOrigin: '50px 50px' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-primary">${spentBudget.toLocaleString()}</span>
              <span className="text-[8px] text-text-secondary uppercase font-bold">Spent</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] font-bold text-text-secondary">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Drainage</span>
              <span className="text-primary">${drainageSpent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-safety-yellow rounded-sm"></span> Resurfacing</span>
              <span className="text-primary">${resurfacingSpent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span> Signals</span>
              <span className="text-primary">${signalsSpent.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team performance table */}
      <section className="bg-white rounded-xl border border-border-subtle shadow-sm p-6">
        <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3 mb-4">
          <Users className="w-4 h-4" /> Municipal Operations Team Deployment
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-secondary pb-2">
                <th className="py-2.5">Team Name</th>
                <th className="py-2.5">Specialization</th>
                <th className="py-2.5 text-center">Active Dispatches</th>
                <th className="py-2.5 text-center">Avg Response Time</th>
                <th className="py-2.5 text-center">Success Rate</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 font-medium">
              {teamData.map((team, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-primary">{team.name}</td>
                  <td className="py-3">{team.specialization}</td>
                  <td className="py-3 text-center text-primary">{team.activeDispatches}</td>
                  <td className="py-3 text-center">{team.avgResponseTime}</td>
                  <td className="py-3 text-center text-primary font-bold">{team.successRate}%</td>
                  <td className="py-3 text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      team.status === 'Deployed'
                        ? 'bg-blue-100 text-blue-700'
                        : team.status === 'Active'
                          ? 'bg-amber-100 text-amber-700 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {team.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
