import React, { useState } from 'react';
import { FileText, Download, Share2, Printer, CheckCircle, RefreshCw, Layers, Calendar, ClipboardCheck } from 'lucide-react';
import { getReports, getSensors, getComplaints } from '../utils/storage';

export function ReportsCenter() {
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'sensors' | 'financial'>('weekly');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [district, setDistrict] = useState<string>('All');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);

  const [reports] = useState(() => getReports());
  const [sensors] = useState(() => getSensors());
  const [complaints] = useState(() => getComplaints());

  const activeCount = reports.filter(r => !r.resolved).length;
  const resolvedCount = reports.filter(r => r.resolved).length;

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationDone(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationDone(true);
    }, 1500);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'weekly':
        return 'Weekly Road Integrity Executive Summary';
      case 'monthly':
        return 'Monthly Municipal Infrastructure Audit';
      case 'sensors':
        return 'IoT Edge Sensor Performance Telemetry Brief';
      default:
        return 'Q2 Budget & Maintenance Cost Allocation Audit';
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-32 animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary tracking-tight">Reporting & Export Center</h2>
        <p className="text-text-secondary mt-1">Export official municipal road inspections, budget briefs, and sensor uptime documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Report Configuration Panel */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
              <ClipboardCheck className="w-4.5 h-4.5" /> Configure Briefing Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Briefing Type</label>
                <select
                  value={reportType}
                  onChange={(e) => { setReportType(e.target.value as any); setGenerationDone(false); }}
                  className="w-full bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none cursor-pointer"
                >
                  <option value="weekly">Weekly Road Safety Executive Briefing</option>
                  <option value="monthly">Monthly City-Wide Infrastructure Audit</option>
                  <option value="sensors">IoT Edge Sensor Telemetry & Diagnostics Log</option>
                  <option value="financial">Q2 Maintenance Cost Allocation & Budget Report</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Target District</label>
                <select
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setGenerationDone(false); }}
                  className="w-full bg-surface-bright border border-border-subtle rounded-lg text-xs p-2 text-primary font-semibold outline-none cursor-pointer"
                >
                  <option value="All">All City Districts (Combined)</option>
                  <option value="Orchard Sector">Orchard Sector only</option>
                  <option value="Marina Bay">Marina Bay only</option>
                  <option value="Downtown Core">Downtown Core only</option>
                  <option value="Geylang East">Geylang East only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Export Format</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-border-subtle">
                  {(['pdf', 'excel', 'csv'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => { setFormat(fmt); setGenerationDone(false); }}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase ${
                        format === fmt ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-primary hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isGenerating ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Layers className="w-4.5 h-4.5" />}
              <span>{isGenerating ? 'Compiling Datasets...' : 'Compile Document'}</span>
            </button>

            {generationDone && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold rounded-lg flex items-center gap-2 animate-fade-in-up">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Document compiled successfully! Download links unlocked on the preview dashboard.</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Report Document Preview */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-border-subtle/50 pb-3 mb-6 flex justify-between items-center">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <FileText className="w-4.5 h-4.5" /> Interactive Document Preview
            </h3>
            <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Ready
            </span>
          </div>

          {/* Preview Sheet mockup */}
          <div className="border border-border-subtle rounded-xl p-8 bg-slate-50/50 shadow-inner flex flex-col justify-between min-h-[350px] space-y-6">
            <div className="space-y-4">
              <div className="border-b border-border-subtle pb-4 flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-base text-primary leading-tight">{getReportTitle()}</h4>
                  <p className="text-[9px] text-text-secondary uppercase font-semibold mt-1">
                    Audited District: {district === 'All' ? 'Municipal Combined (SG)' : district}
                  </p>
                </div>
                <div className="text-[9px] text-right font-semibold text-text-secondary">
                  <span>DATE: {new Date().toLocaleDateString()}</span>
                  <span className="block mt-0.5">STATUS: VALIDATED</span>
                </div>
              </div>

              {/* Data representation */}
              <div className="space-y-3">
                <p className="text-xs text-text-secondary leading-relaxed">
                  This safety brief compiles active accelerometer vibration telemetry from the municipal sensor grid alongside YOLOv8 computer vision hazard outputs.
                </p>

                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-border-subtle text-xs font-bold text-text-secondary">
                  <div className="flex justify-between border-b pb-1.5">
                    <span>Active Hazards Found:</span>
                    <span className="text-primary">{activeCount}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span>Resolved Hazards:</span>
                    <span className="text-primary">{resolvedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Edge Nodes online:</span>
                    <span className="text-primary">{sensors.filter(s => s.status === 'Online').length}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Citizen Complaints:</span>
                    <span className="text-primary">{complaints.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Authorizer seal and actions */}
            <div className="flex justify-between items-end border-t border-border-subtle pt-4 text-left">
              <div>
                <span className="text-[8px] text-text-secondary uppercase font-bold tracking-wider block">Auditing Authority</span>
                <span className="text-xs font-bold text-primary mt-0.5 block">Chief Safety Officer Marcus Thorne</span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!generationDone}
                  onClick={() => alert(`Exporting ${getReportTitle()} in .${format} format...`)}
                  className="bg-primary hover:bg-neutral-800 disabled:bg-slate-200 text-white disabled:text-slate-400 p-2 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Download File"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={!generationDone}
                  onClick={() => alert('Opening printer interface...')}
                  className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-text-secondary disabled:text-slate-300 p-2 rounded-lg flex items-center justify-center transition-all active:scale-95 border border-border-subtle cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={!generationDone}
                  onClick={() => alert('Link copied to clipboard. Share with municipal officials.')}
                  className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-text-secondary disabled:text-slate-300 p-2 rounded-lg flex items-center justify-center transition-all active:scale-95 border border-border-subtle cursor-pointer"
                  title="Share Report"
                >
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
