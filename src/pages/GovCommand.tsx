import React, { useState } from 'react';
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
  const [reports] = useState(() => getReports());
  const [sensors] = useState(() => getSensors());
  const [complaints] = useState(() => getComplaints());

  const activeReportsCount = reports.filter(r => !r.resolved).length;
  const resolvedCount = reports.filter(r => r.resolved).length;
  
  const totalBudget = 100000;
  const spentBudget = 42500;
  const remainingBudget = totalBudget - spentBudget;
  const utilizationPercentage = (spentBudget / totalBudget) * 100;

  // District scores & metrics
  const districtsData = [
    { name: 'Orchard Sector', score: 85, active: 2, resolved: 6 },
    { name: 'Marina Bay', score: 92, active: 1, resolved: 8 },
    { name: 'Downtown Core', score: 90, active: 1, resolved: 5 },
    { name: 'Geylang East', score: 76, active: 2, resolved: 4 }
  ];

  const teamData: TeamPerformance[] = [
    { name: 'Team Alpha', specialization: 'Asphalt Resurfacing', activeDispatches: 2, successRate: 98.4, avgResponseTime: '38 Mins', status: 'Deployed' },
    { name: 'Team Delta', specialization: 'Drainage Systems', activeDispatches: 1, successRate: 95.8, avgResponseTime: '45 Mins', status: 'Active' },
    { name: 'Team Gamma', specialization: 'Rapid Response', activeDispatches: 1, successRate: 99.1, avgResponseTime: '15 Mins', status: 'Deployed' },
    { name: 'Team Epsilon', specialization: 'Traffic Signals', activeDispatches: 0, successRate: 97.2, avgResponseTime: '30 Mins', status: 'Standby' }
  ];

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
            <div className="text-3xl font-bold text-primary mt-1">82.5%</div>
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
              1 team on standby reserve
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
              {/* Allocation: 58% ($58k spent limit), 25%, 17% */}
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="220" strokeDashoffset="92.4" />
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#FACC15" strokeWidth="12" strokeDasharray="220" strokeDashoffset="147.4" style={{ transform: 'rotate(208.8deg)', transformOrigin: '50px 50px' }} />
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#F97316" strokeWidth="12" strokeDasharray="220" strokeDashoffset="182.6" style={{ transform: 'rotate(298.8deg)', transformOrigin: '50px 50px' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-primary">${spentBudget.toLocaleString()}</span>
              <span className="text-[8px] text-text-secondary uppercase font-bold">Spent</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] font-bold text-text-secondary">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Drainage</span>
              <span className="text-primary">$24,650</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-safety-yellow rounded-sm"></span> Resurfacing</span>
              <span className="text-primary">$10,625</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span> Signals</span>
              <span className="text-primary">$7,225</span>
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
