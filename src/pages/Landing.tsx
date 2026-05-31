import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map,
  HardHat,
  Network,
  Bot,
  BookOpen,
  FileText,
  ExternalLink,
  AlertTriangle,
  Play,
  Github,
  Check,
  ArrowRight,
  TrendingUp,
  Activity,
  Users,
  Code,
  Layers,
  MapPin,
  Clock,
  CheckCircle,
  Eye,
  Info,
  Layers3,
  X
} from 'lucide-react';

export function Landing() {
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'heatmap' | 'citizen' | 'tracker'>('dashboard');
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="bg-background text-on-background scroll-smooth min-h-screen font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center h-16 px-8 bg-white/90 backdrop-blur-md border-b border-border-subtle shadow-sm">
        <div className="flex items-center gap-2">
          <Network className="text-primary w-6 h-6" />
          <span className="text-base font-bold text-on-surface tracking-tight">RoadWatch AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#challenge" className="text-text-secondary hover:text-primary transition-colors">The Challenge</a>
          <a href="#solution" className="text-text-secondary hover:text-primary transition-colors">Our Solution</a>
          <a href="#workflow" className="text-text-secondary hover:text-primary transition-colors">Workflow</a>
          <a href="#preview" className="text-text-secondary hover:text-primary transition-colors">Platform Preview</a>
          <a href="#metrics" className="text-text-secondary hover:text-primary transition-colors">Metrics</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            Launch Platform
          </Link>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-border-subtle">
        <div className="absolute inset-0 hero-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-[1280px] mx-auto px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="space-y-6 lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant">
              <span className="flex h-2 w-2 rounded-full bg-safety-yellow animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Hackathon Submission</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary leading-[1.1]">
              Safer Roads Through AI-Powered Hazard Detection
            </h1>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-lg">
              ROADWATCH AI helps detect road hazards, prioritize repairs, track progress, and improve road safety using real-time intelligence.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/login" className="bg-primary text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md">
                Launch Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => setShowDemoModal(true)}
                className="bg-white text-primary border border-border-subtle px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4 text-primary fill-primary" /> Watch Demo
              </button>
            </div>
          </div>

          {/* Right Side Mockup */}
          <div className="lg:col-span-7 relative">
            <div className="relative z-10 bg-white border border-border-subtle p-3 rounded-xl shadow-xl">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-2.5 mb-3 px-1">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></span>
                  <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></span>
                </div>
                <div className="text-[11px] text-text-secondary bg-slate-100 px-8 py-0.5 rounded font-mono">roadwatch.ai/ops</div>
                <div className="w-12"></div>
              </div>
              
              {/* Mockup Body Grid */}
              <div className="grid grid-cols-12 gap-3 text-xs bg-slate-50 p-2 rounded-lg">
                {/* Side Nav Mini */}
                <div className="col-span-2 space-y-2 border-r border-border-subtle pr-2 hidden sm:block">
                  <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-primary/10 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </div>

                {/* Dashboard Elements */}
                <div className="col-span-12 sm:col-span-10 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded border border-border-subtle shadow-sm">
                      <p className="text-[10px] text-text-secondary font-medium">Critical Risk</p>
                      <p className="text-sm font-bold mt-0.5 text-red-600">12 active</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-border-subtle shadow-sm">
                      <p className="text-[10px] text-text-secondary font-medium">GIS Heatmap</p>
                      <p className="text-sm font-bold mt-0.5 text-blue-600">32 live pins</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-border-subtle shadow-sm">
                      <p className="text-[10px] text-text-secondary font-medium">Team Dispatches</p>
                      <p className="text-sm font-bold mt-0.5 text-green-600">4 active</p>
                    </div>
                  </div>

                  {/* Heatmap & Active Incident Layer Mock */}
                  <div className="bg-white p-3 rounded border border-border-subtle shadow-sm grid grid-cols-5 gap-3">
                    <div className="col-span-3 border border-border-subtle rounded-md h-32 relative bg-slate-100 overflow-hidden flex items-center justify-center">
                      {/* Dotted GIS Grid */}
                      <div className="absolute inset-0 map-bg"></div>
                      <div className="absolute top-8 left-10 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
                      <div className="absolute top-8 left-10 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                      
                      <div className="absolute top-20 right-16 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                      <div className="absolute top-10 right-8 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      
                      <span className="absolute bottom-1 right-1.5 text-[8px] bg-white px-1.5 py-0.5 rounded shadow font-bold text-primary flex items-center gap-1">
                        <Map className="w-2.5 h-2.5" /> GIS MAP VIEW
                      </span>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Incident Queue</p>
                      <div className="p-1.5 bg-slate-50 border border-border-subtle rounded flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[10px]">rep-9082</span>
                          <span className="text-[8px] bg-red-100 text-red-700 px-1 rounded font-bold">Critical</span>
                        </div>
                        <span className="text-[9px] text-text-secondary truncate">Pothole @ Orchard Rd</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 border border-border-subtle rounded flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[10px]">rep-9081</span>
                          <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-bold">Active</span>
                        </div>
                        <span className="text-[9px] text-text-secondary truncate">Obstruction @ Nicoll</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-slate-100 rounded-full -z-10 blur-xl"></div>
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-slate-200/50 rounded-full -z-10 blur-xl"></div>
          </div>
        </div>
      </header>

      {/* SECTION 2 — THE PROBLEM */}
      <section id="challenge" className="py-24 bg-white border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-primary">The Challenge</h2>
            <p className="text-text-secondary mt-3">
              Traditional infrastructure maintenance relies on slow, reactive systems, leading to severe decay and safety issues.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Cards */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-border-subtle hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">🚧</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-primary">Road hazards often remain unreported</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Potholes, fissures, and structural decay persist for weeks before citizens or street sweeps catalog them manually.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-border-subtle hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-primary">Delayed repairs increase accident risks</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Without rapid alerting or triage, simple cracks escalate into major road craters, causing vehicle damage and traffic hazards.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-border-subtle hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">📉</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-primary">Authorities lack real-time visibility</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Municipal teams operate without centralized data layers, making it difficult to allocate crews, score repair urgency, or verify fixes.
                  </p>
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="lg:col-span-5 bg-slate-50 border border-border-subtle rounded-xl p-8 h-96 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none map-bg"></div>
              
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                  <span className="text-xs font-bold text-red-700 uppercase tracking-widest">Unmonitored Hazard Zone</span>
                </div>
                <h4 className="text-lg font-bold text-primary">Reactive Infrastructure Model</h4>
                <p className="text-xs text-text-secondary max-w-sm">
                  Traditional pipeline gaps: Citizen complaint takes 15+ days to reach maintenance logs, increasing road accident rates by 28%.
                </p>
              </div>

              {/* Graphic representation */}
              <div className="border border-border-subtle bg-white rounded-lg p-4 relative z-10 shadow-sm flex flex-col gap-2 mt-4">
                <div className="flex justify-between text-[10px] border-b border-border-subtle pb-1 text-text-secondary font-mono">
                  <span>SEGMENT: STAMFORD-RD</span>
                  <span className="text-red-600 font-bold">CRITICAL DECAY</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <div className="w-12 h-12 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-600 text-xl font-bold">
                    !
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="text-[10px] text-text-secondary flex justify-between items-center font-medium mt-1">
                  <span>Days Since Incident: <strong className="text-primary font-bold">18 Days</strong></span>
                  <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">No Crew Dispatched</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE SOLUTION */}
      <section id="solution" className="py-24 bg-slate-50 border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-primary font-sans">How ROADWATCH AI Solves This</h2>
            <p className="text-text-secondary mt-3">
              We bridge the gap between hazard identification and resolution with an integrated computer vision and incident lifecycle management system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-primary flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-primary">🤖 AI Hazard Detection</h3>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                Automatic hazard detection, categorizing cracks, potholes, and spillage instantly using lightweight computer vision.
              </p>
            </div>

            <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-primary flex items-center justify-center mb-4">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-primary">🗺️ Live Risk Mapping</h3>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                Aggregates detected hazards onto an interactive GIS heatmap layer to isolate safety zones and risk clusters.
              </p>
            </div>

            <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-primary flex items-center justify-center mb-4">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-primary">🏗️ Repair Tracking</h3>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                Coordinates dispatch operations with real-time status syncing from assignment to repairing and resolution.
              </p>
            </div>

            <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-primary flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-primary">📊 Road Safety Analytics</h3>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                Calculates risk metrics, priority scores, and estimated repair timelines based on traffic intensity and damage depth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section id="workflow" className="py-24 bg-white border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-primary">The Incident Lifecycle Workflow</h2>
            <p className="text-text-secondary mt-3">
              ROADWATCH AI coordinates a bidirectional feedback loop between citizens, AI detection nodes, and municipal repair crews.
            </p>
          </div>

          {/* Workflow centerpiece */}
          <div className="relative">
            {/* Connection line (Desktop only) */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 hidden lg:block z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              <div className="bg-slate-50 border border-border-subtle rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-slate-300 transition-colors">
                <span className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs mb-3">1</span>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Citizen Reports Hazard</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                  Uploads photo evidence via the mobile portal with active GPS coordinates.
                </p>
              </div>

              <div className="bg-slate-50 border border-border-subtle rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-slate-300 transition-colors">
                <span className="w-7 h-7 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-700 flex items-center justify-center font-bold text-xs mb-3">2</span>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">AI Detects Severity</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                  Gemini models analyze severity and generate local boundary estimates.
                </p>
              </div>

              <div className="bg-slate-50 border border-border-subtle rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-slate-300 transition-colors">
                <span className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-bold text-xs mb-3">3</span>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Hazard Appears on Map</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                  Pins populate the active heatmaps automatically with risk priorities.
                </p>
              </div>

              <div className="bg-slate-50 border border-border-subtle rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-slate-300 transition-colors">
                <span className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs mb-3">4</span>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Authority Assigns Team</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                  Admins dispatch specific resurfacing or drainage crews via control boards.
                </p>
              </div>

              <div className="bg-slate-50 border border-border-subtle rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-slate-300 transition-colors">
                <span className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs mb-3">5</span>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Repair Progress Tracked</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                  Crews move incident status from Assigned to Active Repair in real time.
                </p>
              </div>

              <div className="bg-slate-50 border border-border-subtle rounded-xl p-4 flex flex-col items-center text-center shadow-sm relative group hover:border-slate-300 transition-colors">
                <span className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center font-bold text-xs mb-3">6</span>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Citizen Verifies Resolution</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                  Submit ratings and feedback to officially close the lifecycle loop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — PLATFORM PREVIEW */}
      <section id="preview" className="py-24 bg-slate-50 border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Platform Preview</h2>
            <p className="text-text-secondary mt-3">
              Explore the core administrative and community workspaces of the ROADWATCH AI safety platform.
            </p>
          </div>

          {/* Interactive tab selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActivePreviewTab('dashboard')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                activePreviewTab === 'dashboard'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border-subtle text-text-secondary hover:border-slate-300 hover:text-primary'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePreviewTab('heatmap')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                activePreviewTab === 'heatmap'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border-subtle text-text-secondary hover:border-slate-300 hover:text-primary'
              }`}
            >
              Live Heatmap
            </button>
            <button
              onClick={() => setActivePreviewTab('citizen')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                activePreviewTab === 'citizen'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border-subtle text-text-secondary hover:border-slate-300 hover:text-primary'
              }`}
            >
              Citizen Portal
            </button>
            <button
              onClick={() => setActivePreviewTab('tracker')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                activePreviewTab === 'tracker'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border-subtle text-text-secondary hover:border-slate-300 hover:text-primary'
              }`}
            >
              Incident Tracker
            </button>
          </div>

          {/* Preview Canvas */}
          <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-md max-w-4xl mx-auto min-h-[460px] flex flex-col justify-between">
            {activePreviewTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-primary text-sm">System Operations Dashboard</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold uppercase">Live state</span>
                </div>
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Average Inference Speed</p>
                    <p className="text-xl font-bold mt-1 text-primary">12.8ms</p>
                    <span className="text-[9px] text-text-secondary">Precision confidence: 99.1%</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Edge Sensors Stream</p>
                    <p className="text-xl font-bold mt-1 text-primary">1,280 active</p>
                    <span className="text-[9px] text-text-secondary">Connected node matrices</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Accident Rate Trend</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">-34.2%</p>
                    <span className="text-[9px] text-emerald-700 font-medium">Safe zones expanded</span>
                  </div>
                </div>

                {/* Simulated list */}
                <div className="space-y-2 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Critical Alert Feed</p>
                  <div className="flex items-center justify-between p-2.5 bg-red-50/50 border border-red-200/60 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <strong className="text-primary">rep-4091: Severe Asphalt Crater</strong>
                      <span className="text-text-secondary">| Sector 4, Orchard Rd</span>
                    </div>
                    <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">Priority Score: 92</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <strong className="text-primary">rep-4089: Water Accumulation</strong>
                      <span className="text-text-secondary">| Bayfront Ave North</span>
                    </div>
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Priority Score: 80</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'heatmap' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-primary text-sm">Interactive GIS Safety Heatmap</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-text-secondary px-2.5 py-0.5 rounded-full border border-border-subtle font-bold uppercase">Render Engine 2.4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 border border-border-subtle rounded-xl h-64 relative bg-slate-55 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 map-bg"></div>
                    {/* Simulated Pins */}
                    <div className="absolute top-12 left-24 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white shadow-md animate-bounce"></div>
                      <div className="bg-white px-1 py-0.5 rounded border border-border-subtle shadow-sm text-[8px] font-bold mt-1">Orchard Rd</div>
                    </div>
                    
                    <div className="absolute top-28 right-32 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="bg-white px-1 py-0.5 rounded border border-border-subtle shadow-sm text-[8px] font-bold mt-1">Bayfront Ave</div>
                    </div>

                    <div className="absolute bottom-12 right-12 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="bg-white px-1 py-0.5 rounded border border-border-subtle shadow-sm text-[8px] font-bold mt-1">Nicoll Hwy</div>
                    </div>

                    <span className="absolute bottom-2 left-2 text-[8px] bg-white px-2 py-0.5 rounded border border-border-subtle shadow font-mono text-text-secondary">Zoom: 14.5x | Layers: Active Hazards</span>
                  </div>

                  <div className="md:col-span-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Segment Telemetry</p>
                    <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-xs space-y-2">
                      <div>
                        <span className="text-[10px] text-text-secondary block">Selected Location</span>
                        <strong className="text-primary">Sector 4, Orchard Rd</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary block">Accident Risk Level</span>
                        <span className="text-[10px] font-bold text-red-600 uppercase">High Risk Index</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary block">Recommended Detour</span>
                        <span className="text-[10px] text-primary font-medium">Bypass via Clemenceau Ave</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'citizen' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-primary text-sm">Citizen Safety Portal</h3>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 font-bold uppercase">Mobile View</span>
                </div>

                <div className="flex justify-center">
                  <div className="border border-border-subtle bg-white rounded-2xl p-4 shadow-sm w-72 flex flex-col gap-3">
                    {/* Device Header */}
                    <div className="flex justify-between items-center px-1 text-[9px] text-text-secondary border-b border-border-subtle pb-2">
                      <span className="font-bold">Report Road Hazard</span>
                      <span>📍 GPS Active</span>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[9px] font-bold text-text-secondary block mb-1 uppercase">Select Category</label>
                        <div className="grid grid-cols-2 gap-1.5 font-bold">
                          <span className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center gap-1 cursor-pointer hover:bg-slate-100 text-[10px] justify-center">⚠️ Pothole</span>
                          <span className="p-2 border border-slate-300 rounded bg-slate-50 flex items-center gap-1 cursor-pointer hover:bg-slate-100 text-[10px] justify-center">💧 Water</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-secondary block mb-1 uppercase">Visual Evidence</label>
                        <div className="border border-dashed border-border-subtle bg-slate-50 rounded-lg p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px]">
                          <span className="text-xl">📸</span>
                          <span className="text-[9px] text-text-secondary mt-1 font-bold">Upload Hazard Photo</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-secondary block mb-1 uppercase">Description</label>
                        <textarea placeholder="Describe the damage..." className="w-full p-2 border border-border-subtle rounded text-[10px] h-12 bg-slate-50 outline-none" disabled></textarea>
                      </div>

                      <button className="w-full bg-primary text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm" disabled>
                        File Safety Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'tracker' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-primary text-sm">Active Incident Tracker Board</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-text-secondary px-2.5 py-0.5 rounded-full border border-border-subtle font-bold uppercase">Admin View Only</span>
                </div>

                {/* Simulated Kanban Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
                  <div className="bg-slate-50 p-2 border border-border-subtle rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-1 text-[9px] font-bold text-blue-700 uppercase">
                      <span>🔵 Submitted</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-border-subtle rounded text-[9px] space-y-1">
                      <div className="flex justify-between font-bold text-primary">
                        <span>rep-4091</span>
                        <span className="text-red-600">Critical</span>
                      </div>
                      <p className="text-[8px] text-text-secondary truncate">Pothole @ Orchard Rd</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 border border-border-subtle rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-1 text-[9px] font-bold text-yellow-700 uppercase">
                      <span>🟡 Verified</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-border-subtle rounded text-[9px] space-y-1">
                      <div className="flex justify-between font-bold text-primary">
                        <span>rep-4089</span>
                        <span className="text-amber-600">Active</span>
                      </div>
                      <p className="text-[8px] text-text-secondary truncate">Deep Crack @ Bayfront</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 border border-border-subtle rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-1 text-[9px] font-bold text-orange-700 uppercase">
                      <span>🟠 Assigned</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-border-subtle rounded text-[9px] space-y-1">
                      <div className="flex justify-between font-bold text-primary">
                        <span>rep-4075</span>
                        <span className="text-green-600">Scheduled</span>
                      </div>
                      <p className="text-[8px] text-text-secondary truncate">Resurfacing | Team Alpha</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 border border-border-subtle rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-1 text-[9px] font-bold text-emerald-700 uppercase">
                      <span>🟢 Resolved</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-border-subtle rounded text-[9px] space-y-1">
                      <div className="flex justify-between font-bold text-primary">
                        <span>rep-4061</span>
                        <span className="text-slate-500">Cured</span>
                      </div>
                      <p className="text-[8px] text-text-secondary truncate">Sinkhole repair complete</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-4 border-t border-border-subtle mt-4">
              <Link to="/login" className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1">
                Open full operational interface in live environment <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — IMPACT METRICS */}
      <section id="metrics" className="py-20 bg-white border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 bg-slate-50 border border-border-subtle rounded-xl text-center space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">14,820</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Hazards Detected</p>
            </div>
            <div className="p-6 bg-slate-50 border border-border-subtle rounded-xl text-center space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">342</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Active Repairs</p>
            </div>
            <div className="p-6 bg-slate-50 border border-border-subtle rounded-xl text-center space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">9,104</p>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Resolved Issues</p>
            </div>
            <div className="p-6 bg-slate-50 border border-border-subtle rounded-xl text-center space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-emerald-600 tracking-tight">98.2%</p>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-semibold">Road Safety Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY ROADWATCH AI */}
      <section className="py-24 bg-white border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Beyond Simple Complaint Reporting</h2>
            <p className="text-text-secondary mt-3">
              ROADWATCH AI is built to manage the complete lifecycle of road hazard resolution, replacing one-way complaint logs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Traditional */}
            <div className="bg-slate-50 border border-border-subtle rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                <span className="text-lg">❌</span>
                <h3 className="text-lg font-bold text-primary">Traditional Systems</h3>
              </div>
              
              <ul className="space-y-4 text-sm text-text-secondary font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-primary block text-xs">Complaint Submitted</strong>
                    Manual forms and email logs require manual vetting, adding days to triage.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-primary block text-xs">No Visibility</strong>
                    Citizens remain unaware of review status, crew dispatches, or resolution timelines.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-primary block text-xs">Slow Follow-Up</strong>
                    Repairs occur without priority weights, resulting in backlogs of severe road hazards.
                  </div>
                </li>
              </ul>
            </div>

            {/* RoadWatch AI */}
            <div className="bg-primary text-white rounded-xl p-8 space-y-6 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 hero-pattern opacity-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-2 pb-3 border-b border-slate-700 relative z-10">
                <span className="text-lg">✓</span>
                <h3 className="text-lg font-bold">ROADWATCH AI Lifecycle</h3>
              </div>

              <ul className="space-y-4 text-sm text-slate-300 relative z-10">
                <li className="flex items-start gap-2.5">
                  <span className="text-safety-yellow font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-white block text-xs">AI Hazard Detection</strong>
                    Immediate image validation and boundary scans map risk segments instantly.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-safety-yellow font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-white block text-xs">Priority Scoring</strong>
                    Dynamic score calculation based on traffic impact, hazard type, and severity.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-safety-yellow font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-white block text-xs">Team Assignment & Repair Tracking</strong>
                    Centralized municipal scheduler records progress updates from dispatches to cures.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-safety-yellow font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-white block text-xs">Citizen Verification</strong>
                    Bidirectional loop lets reporting citizens review the patch work to close the ticket.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — TEAM & TECHNOLOGY */}
      <section className="py-24 bg-slate-50 border-b border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-8 grid md:grid-cols-2 gap-16">
          {/* Team Members */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Team Members
              </h3>
              <p className="text-xs text-text-secondary mt-1">Hackathon developers & designers</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-border-subtle p-4 rounded-lg">
                <p className="font-semibold text-sm text-primary">Prince</p>
                <p className="text-[10px] text-text-secondary">Core Developer</p>
              </div>
              <div className="bg-white border border-border-subtle p-4 rounded-lg">
                <p className="font-semibold text-sm text-primary">Rudra</p>
                <p className="text-[10px] text-text-secondary">Core Developer</p>
              </div>
              <div className="bg-white border border-border-subtle p-4 rounded-lg">
                <p className="font-semibold text-sm text-primary">Saloni</p>
                <p className="text-[10px] text-text-secondary">Product Designer</p>
              </div>
              <div className="bg-white border border-border-subtle p-4 rounded-lg">
                <p className="font-semibold text-sm text-primary">Sarika</p>
                <p className="text-[10px] text-text-secondary">Data Scientist</p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" /> Technology Stack
              </h3>
              <p className="text-xs text-text-secondary mt-1">Core frameworks and service layers</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-border-subtle p-3 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-primary">React</span>
                <span className="text-[9px] text-text-secondary">UI Library</span>
              </div>
              <div className="bg-white border border-border-subtle p-3 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-primary">TypeScript</span>
                <span className="text-[9px] text-text-secondary">Type Safety</span>
              </div>
              <div className="bg-white border border-border-subtle p-3 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-primary">Firebase</span>
                <span className="text-[9px] text-text-secondary">Data Sync & Auth</span>
              </div>
              <div className="bg-white border border-border-subtle p-3 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-primary">Gemini AI</span>
                <span className="text-[9px] text-text-secondary">Image Triage</span>
              </div>
              <div className="bg-white border border-border-subtle p-3 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-primary">Tailwind CSS</span>
                <span className="text-[9px] text-text-secondary">Utility Styling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FOOTER */}
      <footer className="bg-white border-t border-border-subtle py-12">
        <div className="max-w-[1280px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Network className="text-primary w-5 h-5" />
            <span className="text-sm font-bold text-primary tracking-tight">RoadWatch AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-text-secondary font-medium">
            <a href="https://github.com/RANAPRINCE06/ROADWATCH-AI" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub Repository
            </a>
            <button onClick={() => setShowDemoModal(true)} className="hover:text-primary transition-colors flex items-center gap-1">
              <Play className="w-3.5 h-3.5" /> Watch Demo Video
            </button>
            <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Documentation
            </Link>
            <a href="mailto:info@roadwatch.ai" className="hover:text-primary transition-colors">
              Contact Support
            </a>
          </div>

          <div className="text-[10px] text-text-secondary">
            © {new Date().getFullYear()} ROADWATCH AI. Built for municipal safety audits.
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border-subtle rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center px-4 py-3 border-b border-border-subtle bg-slate-50">
              <h3 className="font-bold text-sm text-primary">ROADWATCH AI Platform Demonstration</h3>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="text-text-secondary hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Embedded video mock */}
            <div className="bg-slate-950 aspect-video relative flex items-center justify-center p-8 text-center text-white">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <Play className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Demo Video Presentation</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    To watch the complete demonstration, please refer to the hackathon pitch links or launch the dashboard directly to interact in real time.
                  </p>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="bg-white text-primary px-4 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-colors"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
