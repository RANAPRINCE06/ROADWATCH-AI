import React, { useState } from 'react';
import { Bot, FileText, Download, RefreshCw, CheckCircle2, ChevronRight, Eye, AlertTriangle } from 'lucide-react';

interface SafetyReport {
  id: string;
  title: string;
  date: string;
  category: 'Infrastructure' | 'Drainage' | 'Traffic Flow';
  decayIndex: number; // 0 to 10 scale
  safetyRating: 'Safe' | 'Warning' | 'Hazardous';
  summary: string;
  aiInsights: string;
}

export function AIReportDetails() {
  const [reports, setReports] = useState<SafetyReport[]>([
    {
      id: 'rep-1',
      title: 'Sector 4: Orchard Road Surface Assessment',
      date: 'May 29, 2026',
      category: 'Infrastructure',
      decayIndex: 8.4,
      safetyRating: 'Hazardous',
      summary: 'Heavy asphalt structural deterioration, depth profiling reveals multiple sub-layer fissures with immediate water pooling risks.',
      aiInsights: 'Recommend localized resurfacing within 24 hours. Transit speeds should remain capped at 30km/h to mitigate tyre blowouts.'
    },
    {
      id: 'rep-2',
      title: 'Bayfront Ave Drainage Vulnerability Review',
      date: 'May 28, 2026',
      category: 'Drainage',
      decayIndex: 5.8,
      safetyRating: 'Warning',
      summary: 'Curbside catch basins show 40% debris obstruction. Saturated soil limits runoff absorption rate during heavy precipitation.',
      aiInsights: 'Recommend deploying municipal sanitation crews for clearing catchment screens. Heavy rain expected in 18 hours.'
    },
    {
      id: 'rep-3',
      title: 'Marina Coastal Expressway Traffic Flow Optimization',
      date: 'May 25, 2026',
      category: 'Traffic Flow',
      decayIndex: 2.1,
      safetyRating: 'Safe',
      summary: 'Edge node sensors show lane utilization is balanced. Average speeds maintained at 78 km/h. Fissure indexes remain below limits.',
      aiInsights: 'Standard operations normal. Continue scheduling monthly baseline laser telemetry profile sweeps.'
    }
  ]);

  const [selectedReportId, setSelectedReportId] = useState<string>('rep-1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState('');

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setGeneratingProgress('Analyzing Edge Telemetry...');
    
    setTimeout(() => {
      setGeneratingProgress('Running AI Computer Vision Models...');
    }, 500);

    setTimeout(() => {
      setGeneratingProgress('Compiling Safety Ratings...');
    }, 1000);

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratingProgress('');
      
      // Seed a newly generated report to state
      const newRep: SafetyReport = {
        id: `rep-${Date.now()}`,
        title: 'Napier Road Pavement Degradation Index',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        category: 'Infrastructure',
        decayIndex: 4.2,
        safetyRating: 'Warning',
        summary: 'Early micro-fissure development detected along bus lanes. Visual inspection suggests aggregate compaction issues.',
        aiInsights: 'Monitor weekly. Resurfacing schedule can be delayed to Q3 next cycle, unless rainfall rate exceeds historical average by 20%.'
      };
      
      setReports(prev => [newRep, ...prev]);
      setSelectedReportId(newRep.id);
    }, 1500);
  };

  const getSafetyBadgeStyle = (rating: string) => {
    switch (rating) {
      case 'Hazardous':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Warning':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">AI Mission Reports</h2>
          <p className="text-text-secondary mt-1">Autonomous computer-vision infrastructure diagnostics reports.</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="bg-primary hover:bg-neutral-800 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-70 cursor-pointer"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          <span>{isGenerating ? 'Generative Engine active...' : 'Run Generative Safety Audit'}</span>
        </button>
      </div>

      {isGenerating && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-center gap-3 animate-fade-in-up text-xs font-semibold text-primary">
          <RefreshCw className="w-4 h-4 animate-spin text-safety-yellow" />
          <span>{generatingProgress}</span>
        </div>
      )}

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Reports Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Available Assessments</h3>
          
          <div className="space-y-3">
            {reports.map((r) => {
              const isSelected = r.id === selectedReportId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group cursor-pointer ${
                    isSelected 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white border-border-subtle hover:border-primary text-primary hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs leading-snug">{r.title}</h4>
                    <span className={`text-[9px] font-medium mt-1.5 block opacity-70 ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
                      {r.date} • {r.category}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                    isSelected ? 'text-white' : 'text-text-secondary'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Report details pane */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-border-subtle rounded-xl shadow-sm p-6 space-y-6">
            
            <div className="flex justify-between items-start gap-4 border-b border-border-subtle/50 pb-4">
              <div>
                <h3 className="text-lg font-bold text-primary">{activeReport.title}</h3>
                <p className="text-[10px] text-text-secondary uppercase font-semibold mt-1">
                  Generated on {activeReport.date} by RoadWatch Diagnostics Engine v2.4
                </p>
              </div>
              
              <div className="flex gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSafetyBadgeStyle(activeReport.safetyRating)}`}>
                  {activeReport.safetyRating}
                </span>
              </div>
            </div>

            {/* Decay Index & Vision overlay preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Decay Index (D.I.)</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-primary">{activeReport.decayIndex}</span>
                  <span className="text-xs text-text-secondary font-bold">/ 10</span>
                </div>
                <div className="w-full h-1.5 bg-outline-variant mt-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      activeReport.decayIndex >= 7.5 ? 'bg-red-500' : activeReport.decayIndex >= 5.0 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${activeReport.decayIndex * 10}%` }}
                  />
                </div>
              </div>

              {/* Segmented Vision Preview card */}
              <div className="md:col-span-2 bg-slate-900 rounded-xl overflow-hidden relative min-h-[100px] border border-slate-800">
                <img 
                  className="w-full h-full object-cover opacity-50 absolute inset-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1n2NbFoToVIImEahvIZSjTkMR5FTXSWp5f0i44_rrN5OvxYZLRQ_oNqHNxD3sFB-nDpXmafydIW44x-pnxEFZG9bTuaUC6E2Qt_awUiMo8OM0fbzOUqk7HhlTxKafEzP_X_VkroxOJSzIaL3Z27pmQJDihdjtMz-DvYmpv8IeGrNo62FAq_HL7QQSiFfc5J1X3gig8LmGziPIjg9wkvs06EaejGoBkfC6jKHwVCzUkDjo2td8nMsT0y4VsHXyeNU5RqZ8SIWc48Q" 
                  alt="Segmentation Preview"
                />
                <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur border border-white/20 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> AI Segmented Mesh
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <span className="bg-red-500/80 backdrop-blur border border-red-400/50 px-2 py-0.5 rounded text-[8px] font-bold text-white">DECAY</span>
                  <span className="bg-safety-yellow/85 backdrop-blur border border-yellow-400/50 px-2 py-0.5 rounded text-[8px] font-bold text-primary">POURING</span>
                </div>
              </div>
            </div>

            {/* Assessment summary */}
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">Assessment Summary</h4>
                <p className="text-xs text-text-secondary leading-relaxed bg-slate-50 border border-border-subtle p-3 rounded-lg">
                  {activeReport.summary}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-primary" /> AI Copilot Insights
                </h4>
                <p className="text-xs text-primary leading-relaxed bg-safety-yellow/10 border border-safety-yellow/20 p-3 rounded-lg font-semibold flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-safety-yellow flex-shrink-0 mt-0.5" />
                  <span>{activeReport.aiInsights}</span>
                </p>
              </div>
            </div>

            {/* Download section */}
            <div className="flex justify-end gap-2 border-t border-border-subtle/50 pt-4">
              <button className="bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-primary py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
                <Download className="w-4 h-4" /> Export CSV Log
              </button>
              <button className="bg-primary hover:bg-neutral-800 text-white py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer">
                <FileText className="w-4 h-4" /> Download PDF Briefing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
