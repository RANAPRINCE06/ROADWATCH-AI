import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Printer, CheckCircle, RefreshCw, Layers, Calendar, ClipboardCheck } from 'lucide-react';
import { getReports, getSensors, getComplaints } from '../utils/storage';

export function ReportsCenter() {
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'sensors' | 'financial'>('weekly');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [district, setDistrict] = useState<string>('All');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);

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

  const generateCSVContent = (): string => {
    let headers: string[] = [];
    let rows: string[][] = [];

    const filterByDistrict = (items: any[]): any[] => {
      if (district === 'All') return items;
      const q = district.replace(' only', '').toLowerCase();
      return items.filter(item => {
        const loc = ((item.location as string) || (item.locationName as string) || '').toLowerCase();
        return loc.includes(q) || (q === 'orchard' && loc.includes('orchard')) || (q === 'marina' && loc.includes('bayfront'));
      });
    };

    if (reportType === 'weekly' || reportType === 'monthly') {
      headers = ['ID', 'Title', 'Location', 'Severity', 'Status', 'Priority Score', 'Estimated Risk', 'Source', 'Timestamp'];
      const filteredReports = filterByDistrict(reports);
      rows = filteredReports.map(r => [
        r.id,
        r.title.replace(/"/g, '""'),
        r.location.replace(/"/g, '""'),
        r.severity,
        r.status || '',
        String(r.priorityScore || ''),
        (r.estimatedRisk || '').replace(/"/g, '""'),
        r.source || '',
        r.timestamp || ''
      ]);
    } else if (reportType === 'sensors') {
      headers = ['Sensor ID', 'Name', 'Location', 'Vibration (Hz)', 'Temperature (C)', 'Battery (%)', 'Status', 'Connectivity', 'Road Health Score'];
      const filteredSensors = filterByDistrict(sensors);
      rows = filteredSensors.map(s => [
        s.id,
        s.name,
        s.locationName,
        String(s.vibration),
        String(s.temperature),
        String(s.battery),
        s.status,
        s.connectivity,
        String(s.roadHealthScore)
      ]);
    } else { // financial
      headers = ['Item', 'Quantity', 'Est Unit Cost (SGD)', 'Total Cost (SGD)', 'Status'];
      const filteredReports = filterByDistrict(reports);
      const activePotholes = filteredReports.filter(r => !r.resolved && (r.title.toLowerCase().includes('pothole') || r.icon === 'alert'));
      const activeFloods = filteredReports.filter(r => !r.resolved && (r.title.toLowerCase().includes('flood') || r.icon === 'droplets'));
      const resCount = filteredReports.filter(r => r.resolved).length;
      
      rows = [
        ['Resolved Paving Works (Complete)', String(resCount), '850', String(resCount * 850), 'Paid'],
        ['Pending Pothole Repairs', String(activePotholes.length), '1200', String(activePotholes.length * 1200), 'Budgeted'],
        ['Emergency Drainage Clearance', String(activeFloods.length), '1500', String(activeFloods.length * 1500), 'Budgeted'],
        ['AI Core Licensing & Edge Maintenance', '5', '450', '2250', 'Fixed Cost']
      ];
    }

    return [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');
  };

  const downloadCSV = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_report_${district.toLowerCase().replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filterByDistrict = (items: any[]): any[] => {
      if (district === 'All') return items;
      const q = district.replace(' only', '').toLowerCase();
      return items.filter(item => {
        const loc = ((item.location as string) || (item.locationName as string) || '').toLowerCase();
        return loc.includes(q) || (q === 'orchard' && loc.includes('orchard')) || (q === 'marina' && loc.includes('bayfront'));
      });
    };

    const filteredReports = filterByDistrict(reports);
    const filteredSensors = filterByDistrict(sensors);

    let mainTableHTML = '';
    if (reportType === 'weekly' || reportType === 'monthly') {
      mainTableHTML = `
        <h3>Active Hazards Registry</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Hazard Title</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Priority Score</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports.map(r => `
              <tr>
                <td>${r.id}</td>
                <td>${r.title}</td>
                <td>${r.location}</td>
                <td><span class="badge ${r.severity.toLowerCase()}">${r.severity}</span></td>
                <td>${r.status || 'Detected'}</td>
                <td>${r.priorityScore || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'sensors') {
      mainTableHTML = `
        <h3>IoT Sensor Telemetry Logs</h3>
        <table>
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Device Name</th>
              <th>Location</th>
              <th>Vibration</th>
              <th>Temp</th>
              <th>Battery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSensors.map(s => `
              <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.locationName}</td>
                <td>${s.vibration} Hz</td>
                <td>${s.temperature} &deg;C</td>
                <td>${s.battery}%</td>
                <td><span class="badge ${s.status.toLowerCase()}">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else { // financial
      const activePotholes = filteredReports.filter(r => !r.resolved && (r.title.toLowerCase().includes('pothole') || r.icon === 'alert'));
      const activeFloods = filteredReports.filter(r => !r.resolved && (r.title.toLowerCase().includes('flood') || r.icon === 'droplets'));
      const resCount = filteredReports.filter(r => r.resolved).length;
      const totalBudget = (resCount * 850) + (activePotholes.length * 1200) + (activeFloods.length * 1500) + 2250;

      mainTableHTML = `
        <h3>Q2 Budget & Maintenance Cost Allocation</h3>
        <table>
          <thead>
            <tr>
              <th>Expense Item</th>
              <th>Quantity</th>
              <th>Est. Unit Cost</th>
              <th>Total Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Resolved Paving Works (Complete)</td>
              <td>${resCount}</td>
              <td>$850 SGD</td>
              <td>$${resCount * 850} SGD</td>
              <td>Paid</td>
            </tr>
            <tr>
              <td>Pending Pothole Repairs</td>
              <td>${activePotholes.length}</td>
              <td>$1,200 SGD</td>
              <td>$${activePotholes.length * 1200} SGD</td>
              <td>Budgeted</td>
            </tr>
            <tr>
              <td>Emergency Drainage Clearance</td>
              <td>${activeFloods.length}</td>
              <td>$1,500 SGD</td>
              <td>$${activeFloods.length * 1500} SGD</td>
              <td>Budgeted</td>
            </tr>
            <tr>
              <td>AI Core Licensing & Edge Maintenance</td>
              <td>5 Nodes</td>
              <td>$450 SGD</td>
              <td>$2,250 SGD</td>
              <td>Fixed Cost</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Total Cost Allocation:</td>
              <td colspan="2">$${totalBudget} SGD</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${getReportTitle()}</title>
          <style>
            body { font-family: sans-serif; color: #1a1f2c; margin: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { font-size: 20px; margin: 0; color: #0c101a; }
            h3 { font-size: 14px; margin-top: 30px; margin-bottom: 10px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
            .meta { font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; color: #334155; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge.critical { background: #fee2e2; color: #991b1b; }
            .badge.high { background: #fee2e2; color: #991b1b; }
            .badge.major { background: #ffedd5; color: #9a3412; }
            .badge.medium { background: #ffedd5; color: #9a3412; }
            .badge.online { background: #dcfce7; color: #166534; }
            .badge.warning { background: #fef9c3; color: #854d0e; }
            .badge.offline { background: #f1f5f9; color: #475569; }
            .total-row { font-weight: bold; background: #f8fafc; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${getReportTitle()}</h1>
              <div class="meta" style="margin-top: 5px;">
                <span>District: ${district === 'All' ? 'All Districts Combined' : district}</span> &bull; 
                <span>CSO: Marcus Thorne</span>
              </div>
            </div>
            <div class="meta" style="text-align: right;">
              <span>Report Generated: ${new Date().toLocaleString()}</span><br/>
              <span>System: RoadWatch AI Portal</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #475569;">
            This document compiles verified reports from the RoadWatch AI system, incorporating citizen inputs and IoT sensor streams.
          </p>
          ${mainTableHTML}
          <div class="footer">
            Confidential &bull; Municipal Infrastructure Services (SG)
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportAction = () => {
    if (format === 'pdf') {
      handlePrint();
    } else {
      downloadCSV();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Shareable report link copied to clipboard.');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
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
                  onClick={handleExportAction}
                  className="bg-primary hover:bg-neutral-800 disabled:bg-slate-200 text-white disabled:text-slate-400 p-2 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Download File"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={!generationDone}
                  onClick={handlePrint}
                  className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-text-secondary disabled:text-slate-300 p-2 rounded-lg flex items-center justify-center transition-all active:scale-95 border border-border-subtle cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={!generationDone}
                  onClick={handleShare}
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
