import React, { useState } from 'react';
import { UploadCloud, Camera, AlertCircle, Droplets, Minus, Navigation, CircleEllipsis, Send, CheckCircle2 } from 'lucide-react';

export function ReportHazard() {
  const [selectedHazard, setSelectedHazard] = useState('Pothole');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hazardTypes = [
    { name: 'Pothole', icon: AlertCircle },
    { name: 'Waterlogging', icon: Droplets },
    { name: 'Missing Divider', icon: Minus },
    { name: 'Traffic Signal', icon: Navigation },
    { name: 'Spillage', icon: Droplets },
    { name: 'Other', icon: CircleEllipsis },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8 pb-32">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Report Road Hazard</h2>
          <p className="text-text-secondary mt-1">Real-time AI-assisted safety reporting system.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-border-subtle shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">GPS AUTO-DETECTION: ACTIVE</span>
          <span className="text-sm font-bold text-primary border-l border-r px-3 mx-1">San Francisco, CA (37.7749° N, 122.4194° W)</span>
          <button className="text-primary hover:underline text-sm font-semibold">Edit Location</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          
          <section className="bg-white/50 backdrop-blur p-8 rounded-xl border-dashed border-2 border-outline-variant hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center min-h-[320px] group">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-primary">Upload Visual Evidence</h3>
            <p className="text-on-surface-variant text-sm mt-2 text-center max-w-md">
              Drag and drop high-resolution images or video files here. Our AI will automatically analyze the content for hazard detection.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all">
                Select Files
              </button>
              <button className="border border-outline-variant text-primary px-6 py-2.5 rounded-lg font-bold hover:bg-surface-container-low active:scale-95 transition-all flex items-center gap-2 bg-white">
                <Camera className="w-5 h-5" /> Use Camera
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-on-surface-variant mb-4 tracking-widest uppercase">Select Hazard Category</h3>
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

        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <h3 className="text-[11px] font-bold text-on-surface-variant mb-4 tracking-widest uppercase">AI Detection Preview</h3>
            
            <div className="glass-panel rounded-xl overflow-hidden relative shadow-lg bg-white">
              <div className="relative group bg-surface-dim">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1n2NbFoToVIImEahvIZSjTkMR5FTXSWp5f0i44_rrN5OvxYZLRQ_oNqHNxD3sFB-nDpXmafydIW44x-pnxEFZG9bTuaUC6E2Qt_awUiMo8OM0fbzOUqk7HhlTxKafEzP_X_VkroxOJSzIaL3Z27pmQJDihdjtMz-DvYmpv8IeGrNo62FAq_HL7QQSiFfc5J1X3gig8LmGziPIjg9wkvs06EaejGoBkfC6jKHwVCzUkDjo2td8nMsT0y4VsHXyeNU5RqZ8SIWc48Q" 
                  alt="AI detection preview"
                  className="w-full aspect-[4/3] object-cover"
                />
                
                {/* Simulated Bounding Boxes */}
                <div className="absolute top-[25%] left-[20%] w-[40%] h-[35%] border-2 border-safety-yellow rounded-sm">
                  <div className="absolute -top-6 left-0 bg-safety-yellow text-primary font-bold text-[10px] px-2 py-0.5 rounded-t-sm uppercase">Pothole: Critical</div>
                </div>
                <div className="absolute top-[60%] left-[55%] w-[20%] h-[15%] border-2 border-white/50 rounded-sm">
                  <div className="absolute -top-6 left-0 bg-white/50 text-primary font-bold text-[10px] px-2 py-0.5 rounded-t-sm uppercase">Minor Crack</div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Severity Score</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-4xl font-bold leading-none text-primary">8.4</span>
                      <span className="text-sm font-bold text-on-surface-variant mb-1">/ 10</span>
                    </div>
                    <div className="w-full h-1.5 bg-outline-variant mt-4 rounded-full overflow-hidden">
                      <div className="h-full bg-safety-yellow w-[84%]"></div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-low p-4 rounded-lg">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Detection Confidence</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-4xl font-bold leading-none text-primary">98</span>
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
                    <p className="font-bold text-lg">Immediate (Within 24hrs)</p>
                  </div>
                  <AlertCircle className="text-safety-yellow w-8 h-8" />
                </div>
                
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || submitted}
                  className={`w-full font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-3 shadow-md transition-all ${
                    submitted ? 'bg-green-500 text-white' : 'bg-safety-yellow text-primary hover:scale-[1.01] active:scale-[0.98]'
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
    </div>
  );
}
