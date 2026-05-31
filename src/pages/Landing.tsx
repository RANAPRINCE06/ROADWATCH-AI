import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map,
  HardHat,
  Network,
  Bot,
  BookOpen,
  FileText,
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
  X,
  Activity as AnalyticsIcon,
  ShieldAlert,
  ArrowRightCircle
} from 'lucide-react';

export function Landing() {
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'heatmap' | 'citizen' | 'tracker'>('dashboard');
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="bg-slate-50 text-slate-900 scroll-smooth min-h-screen font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center h-16 px-8 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2">
          <Network className="text-blue-600 w-6 h-6" />
          <span className="text-base font-bold text-slate-900 tracking-tight">RoadWatch AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#challenge" className="text-slate-600 hover:text-blue-600 transition-colors">The Challenge</a>
          <a href="#solution" className="text-slate-600 hover:text-blue-600 transition-colors">Our Solution</a>
          <a href="#workflow" className="text-slate-600 hover:text-blue-600 transition-colors">Workflow</a>
          <a href="#preview" className="text-slate-600 hover:text-blue-600 transition-colors">Platform Preview</a>
          <a href="#metrics" className="text-slate-600 hover:text-blue-600 transition-colors">Metrics</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-750 transition-all duration-200 hover:shadow-sm">
            Launch Platform
          </Link>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-blue-50 to-cyan-50 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="space-y-6 lg:col-span-5 text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200">
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
              <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Smart City Operations</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Safer Roads Through <span className="text-blue-600">AI-Powered Hazard Detection</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-lg">
              ROADWATCH AI helps detect road hazards, prioritize repairs, track progress, and improve road safety using real-time intelligence.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-blue-700 hover:shadow-md transition-all duration-200">
                Launch Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => setShowDemoModal(true)}
                className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-blue-50 transition-all duration-200"
              >
                <Play className="w-4 h-4 text-blue-600 fill-blue-600" /> Watch Demo
              </button>
            </div>
          </div>

          {/* Right Side Mockup */}
          <div className="lg:col-span-7 relative animate-fade-in-up">
            <div className="relative z-10 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3 px-1">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-[10px] text-slate-500 bg-slate-100 px-6 py-0.5 rounded font-mono">roadwatch.ai/dashboard</div>
                <div className="w-10"></div>
              </div>
              
              {/* Mockup Body Grid */}
              <div className="grid grid-cols-12 gap-3 text-xs bg-slate-50 p-2 rounded-lg">
                {/* Side Nav Mini */}
                <div className="col-span-2 space-y-2 border-r border-slate-200 pr-2 hidden sm:block">
                  <div className="h-5 bg-blue-600/10 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </div>

                {/* Dashboard Elements */}
                <div className="col-span-12 sm:col-span-10 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                      <p className="text-[9px] text-slate-500 font-medium">Critical Risks</p>
                      <p className="text-xs font-bold mt-0.5 text-red-500">12 Active</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                      <p className="text-[9px] text-slate-500 font-medium">GIS Heatmap</p>
                      <p className="text-xs font-bold mt-0.5 text-blue-600">32 Live Pins</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                      <p className="text-[9px] text-slate-500 font-medium">Active Crews</p>
                      <p className="text-xs font-bold mt-0.5 text-emerald-500">4 Crews</p>
                    </div>
                  </div>

                  {/* Heatmap & Active Incident Layer Mock */}
                  <div className="bg-white p-3 rounded border border-slate-200 shadow-sm grid grid-cols-5 gap-3">
                    <div className="col-span-3 border border-slate-200 rounded-md h-32 relative bg-slate-100 overflow-hidden flex items-center justify-center">
                      {/* Dotted GIS Grid */}
                      <div className="absolute inset-0 map-bg"></div>
                      <div className="absolute top-8 left-10 w-3 h-3 bg-red-500 rounded-full border border-white animate-ping"></div>
                      <div className="absolute top-8 left-10 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                      
                      <div className="absolute top-20 right-16 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                      <div className="absolute top-10 right-8 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                      
                      <span className="absolute bottom-1 right-1.5 text-[8px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow font-bold text-slate-900 flex items-center gap-1">
                        <Map className="w-2.5 h-2.5 text-blue-600" /> GIS LIVE MAP
                      </span>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Alert Queue</p>
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[9px] text-slate-900">rep-9082</span>
                          <span className="text-[8px] bg-red-55 text-red-500 font-bold">Critical</span>
                        </div>
                        <span className="text-[9px] text-slate-600 truncate">Pothole @ Orchard Rd</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[9px] text-slate-900">rep-9081</span>
                          <span className="text-[8px] bg-amber-55 text-amber-600 font-bold">Active</span>
                        </div>
                        <span className="text-[9px] text-slate-600 truncate">Obstruction @ Nicoll</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-blue-100 rounded-full -z-10 blur-xl opacity-50"></div>
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-cyan-100 rounded-full -z-10 blur-xl opacity-50"></div>
          </div>
        </div>
      </header>

      {/* SECTION 2 — THE PROBLEM */}
      <section id="challenge" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">The Challenge</h2>
            <p className="text-slate-600 mt-3">
              Traditional infrastructure maintenance relies on slow, reactive systems, leading to severe decay and safety issues.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Cards */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <span className="text-lg">🚧</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Road hazards often remain unreported</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Potholes, fissures, and structural decay persist for weeks before citizens or street sweeps catalog them manually.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Delayed repairs increase accident risks</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Without rapid alerting or triage, simple cracks escalate into major road craters, causing vehicle damage and traffic hazards.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="text-lg">📉</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Authorities lack real-time visibility</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Municipal teams operate without centralized data layers, making it difficult to allocate crews, score repair urgency, or verify fixes.
                  </p>
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-8 h-96 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none map-bg"></div>
              
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Unmonitored Hazard Zone</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">Reactive Infrastructure Model</h4>
                <p className="text-xs text-slate-600 max-w-sm">
                  Traditional pipeline gaps: Citizen complaint takes 15+ days to reach maintenance logs, increasing road accident rates by 28%.
                </p>
              </div>

              {/* Graphic representation */}
              <div className="border border-slate-200 bg-white rounded-lg p-4 relative z-10 shadow-sm flex flex-col gap-2 mt-4">
                <div className="flex justify-between text-[10px] border-b border-slate-200 pb-1 text-slate-500 font-mono">
                  <span>SEGMENT: STAMFORD-RD</span>
                  <span className="text-red-500 font-bold">CRITICAL DECAY</span>
                </div>
                <div className="flex items-center gap-3 py-1">
                  <div className="w-10 h-10 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-500 text-base font-bold">
                    !
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 flex justify-between items-center font-medium mt-1">
                  <span>Days Since Incident: <strong className="text-slate-900 font-bold">18 Days</strong></span>
                  <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">No Crew Dispatched</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE SOLUTION */}
      <section id="solution" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">How ROADWATCH AI Solves This</h2>
            <p className="text-slate-600 mt-3">
              We bridge the gap between hazard identification and resolution with an integrated computer vision and incident lifecycle management system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">🤖 AI Hazard Detection</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Automatic hazard detection, categorizing cracks, potholes, and spillage instantly using lightweight computer vision.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center mb-4 border border-cyan-100">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">🗺️ Live Risk Mapping</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Aggregates detected hazards onto an interactive GIS heatmap layer to isolate safety zones and risk clusters.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-100">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">🏗️ Repair Tracking</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Coordinates dispatch operations with real-time status syncing from assignment to repairing and resolution.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mb-4 border border-indigo-100">
                <AnalyticsIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">📊 Road Safety Analytics</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Calculates risk metrics, priority scores, and estimated repair timelines based on traffic intensity and damage depth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section id="workflow" className="py-24 bg-blue-50 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">The Incident Lifecycle Workflow</h2>
            <p className="text-slate-600 mt-3 font-medium">
              ROADWATCH AI coordinates a bidirectional feedback loop between citizens, AI detection nodes, and municipal repair crews.
            </p>
          </div>

          {/* Connected timeline step cards */}
          <div className="relative">
            {/* Desktop horizontal line */}
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 hidden lg:block z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              {/* Step 1: Citizen Report (Completed - Green) */}
              <div className="bg-white border-2 border-emerald-500 rounded-xl p-5 flex flex-col items-center text-center shadow-sm relative group">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs mb-3 shadow-inner">✓</span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Citizen Report</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  Uploads photo evidence via the mobile portal with active GPS coordinates.
                </p>
              </div>

              {/* Step 2: AI Detection (Completed - Green) */}
              <div className="bg-white border-2 border-emerald-500 rounded-xl p-5 flex flex-col items-center text-center shadow-sm relative group">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs mb-3 shadow-inner">✓</span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">AI Detection</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  Gemini models analyze severity and generate local boundary estimates.
                </p>
              </div>

              {/* Step 3: Map Update (Completed - Green) */}
              <div className="bg-white border-2 border-emerald-500 rounded-xl p-5 flex flex-col items-center text-center shadow-sm relative group">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs mb-3 shadow-inner">✓</span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Map Update</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  Pins populate the active heatmaps automatically with risk priorities.
                </p>
              </div>

              {/* Step 4: Team Assignment (Current - Blue) */}
              <div className="bg-white border-2 border-blue-650 rounded-xl p-5 flex flex-col items-center text-center shadow-md relative group scale-[1.03] ring-4 ring-blue-100">
                <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs mb-3 shadow-md animate-pulse">4</span>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Team Assignment</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  Admins dispatch specific resurfacing or drainage crews via control boards.
                </p>
              </div>

              {/* Step 5: Repair Tracking (Upcoming - Gray) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center shadow-sm relative group opacity-75">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xs mb-3">5</span>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Repair Tracking</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  Crews move incident status from Assigned to Active Repair in real time.
                </p>
              </div>

              {/* Step 6: Resolution (Upcoming - Gray) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center shadow-sm relative group opacity-75">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-xs mb-3">6</span>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Resolution</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  Submit ratings and feedback to officially close the lifecycle loop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — PLATFORM PREVIEW */}
      <section id="preview" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform Preview</h2>
            <p className="text-slate-600 mt-3 font-medium">
              Explore the core administrative and community workspaces of the ROADWATCH AI safety platform.
            </p>
          </div>

          {/* Interactive tab selector */}
          <div className="flex justify-center border-b border-slate-200 max-w-lg mx-auto mb-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActivePreviewTab('dashboard')}
                className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all duration-250 border-b-2 ${
                  activePreviewTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActivePreviewTab('heatmap')}
                className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all duration-250 border-b-2 ${
                  activePreviewTab === 'heatmap'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Map
              </button>
              <button
                onClick={() => setActivePreviewTab('citizen')}
                className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all duration-250 border-b-2 ${
                  activePreviewTab === 'citizen'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Citizen Portal
              </button>
              <button
                onClick={() => setActivePreviewTab('tracker')}
                className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all duration-250 border-b-2 ${
                  activePreviewTab === 'tracker'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Incident Tracker
              </button>
            </div>
          </div>

          {/* Preview Canvas in White Rounded Cards with Light Shadow */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md max-w-4xl mx-auto min-h-[460px] flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            {activePreviewTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">System Operations Dashboard</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold uppercase">Live state</span>
                </div>
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Average Inference Speed</p>
                    <p className="text-xl font-bold mt-1 text-slate-900">12.8ms</p>
                    <span className="text-[9px] text-slate-500">Precision confidence: 99.1%</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Edge Sensors Stream</p>
                    <p className="text-xl font-bold mt-1 text-slate-900">1,280 active</p>
                    <span className="text-[9px] text-slate-500">Connected node matrices</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Accident Rate Trend</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">-34.2%</p>
                    <span className="text-[9px] text-emerald-700 font-medium">Safe zones expanded</span>
                  </div>
                </div>

                {/* Simulated list */}
                <div className="space-y-2 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-550">Critical Alert Feed</p>
                  <div className="flex items-center justify-between p-2.5 bg-red-50/50 border border-red-200/60 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <strong className="text-slate-900">rep-4091: Severe Asphalt Crater</strong>
                      <span className="text-slate-500">| Sector 4, Orchard Rd</span>
                    </div>
                    <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">Priority Score: 92</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <strong className="text-slate-900">rep-4089: Water Accumulation</strong>
                      <span className="text-slate-505">| Bayfront Ave North</span>
                    </div>
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Priority Score: 80</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'heatmap' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Interactive GIS Safety Heatmap</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200 font-bold uppercase">Render Engine 2.4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 border border-slate-200 rounded-xl h-64 relative bg-slate-50 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 map-bg"></div>
                    {/* Simulated Pins */}
                    <div className="absolute top-12 left-24 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white shadow-md animate-bounce"></div>
                      <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-sm text-[8px] font-bold mt-1 text-slate-900">Orchard Rd</div>
                    </div>
                    
                    <div className="absolute top-28 right-32 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-sm text-[8px] font-bold mt-1 text-slate-900">Bayfront Ave</div>
                    </div>

                    <div className="absolute bottom-12 right-12 flex flex-col items-center">
                      <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-sm text-[8px] font-bold mt-1 text-slate-900">Nicoll Hwy</div>
                    </div>

                    <span className="absolute bottom-2 left-2 text-[8px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow font-mono text-slate-500">Zoom: 14.5x | Layers: Active Hazards</span>
                  </div>

                  <div className="md:col-span-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Segment Telemetry</p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Selected Location</span>
                        <strong className="text-slate-900 font-bold">Sector 4, Orchard Rd</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Accident Risk Level</span>
                        <span className="text-[10px] font-bold text-red-500 uppercase">High Risk Index</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Recommended Detour</span>
                        <span className="text-[10px] text-blue-600 font-semibold">Bypass via Clemenceau Ave</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'citizen' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Citizen Safety Portal</h3>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 font-bold uppercase">Mobile View</span>
                </div>

                <div className="flex justify-center">
                  <div className="border border-slate-200 bg-white rounded-2xl p-4 shadow-sm w-72 flex flex-col gap-3">
                    {/* Device Header */}
                    <div className="flex justify-between items-center px-1 text-[9px] text-slate-500 border-b border-slate-200 pb-2">
                      <span className="font-bold">Report Road Hazard</span>
                      <span>📍 GPS Active</span>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Select Category</label>
                        <div className="grid grid-cols-2 gap-1.5 font-bold">
                          <span className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center gap-1 cursor-pointer hover:bg-slate-100 text-[10px] justify-center text-slate-700">⚠️ Pothole</span>
                          <span className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center gap-1 cursor-pointer hover:bg-slate-100 text-[10px] justify-center text-slate-700">💧 Water</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Visual Evidence</label>
                        <div className="border border-dashed border-slate-200 bg-slate-50 rounded-lg p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px]">
                          <span className="text-xl">📸</span>
                          <span className="text-[9px] text-slate-500 mt-1 font-bold">Upload Hazard Photo</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Description</label>
                        <textarea placeholder="Describe the damage..." className="w-full p-2 border border-slate-200 rounded text-[10px] h-12 bg-slate-50 outline-none" disabled></textarea>
                      </div>

                      <button className="w-full bg-blue-600 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm" disabled>
                        File Safety Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'tracker' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Active Incident Tracker Board</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200 font-bold uppercase">Admin View Only</span>
                </div>

                {/* Simulated Kanban Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
                  <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[9px] font-bold text-blue-700 uppercase">
                      <span>🔵 Submitted</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded text-[9px] space-y-1 shadow-sm">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>rep-4091</span>
                        <span className="text-red-500">Critical</span>
                      </div>
                      <p className="text-[8px] text-slate-550 truncate">Pothole @ Orchard Rd</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[9px] font-bold text-amber-700 uppercase">
                      <span>🟡 Verified</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded text-[9px] space-y-1 shadow-sm">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>rep-4089</span>
                        <span className="text-amber-500">Active</span>
                      </div>
                      <p className="text-[8px] text-slate-500 truncate">Deep Crack @ Bayfront</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[9px] font-bold text-sky-700 uppercase">
                      <span>🟠 Assigned</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded text-[9px] space-y-1 shadow-sm">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>rep-4075</span>
                        <span className="text-slate-500">Scheduled</span>
                      </div>
                      <p className="text-[8px] text-slate-500 truncate">Resurfacing | Team Alpha</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[9px] font-bold text-emerald-700 uppercase">
                      <span>🟢 Resolved</span>
                      <span>(1)</span>
                    </div>
                    <div className="p-2 bg-white border border-slate-200 rounded text-[9px] space-y-1 shadow-sm">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>rep-4061</span>
                        <span className="text-emerald-500">Cured</span>
                      </div>
                      <p className="text-[8px] text-slate-500 truncate">Sinkhole repair complete</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-4 border-t border-slate-200 mt-4">
              <Link to="/login" className="text-blue-600 hover:underline text-xs font-semibold inline-flex items-center gap-1">
                Open full operational interface in live environment <ArrowRight className="w-3 h-3 text-blue-650" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — IMPACT METRICS */}
      <section id="metrics" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">14,820</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hazards Detected</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                <HardHat className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">342</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Repairs</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">9,104</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Resolved Issues</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center shrink-0 border border-cyan-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl md:text-3xl font-extrabold text-cyan-550 tracking-tight">98.2%</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Road Safety Score</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY ROADWATCH AI */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Beyond Simple Complaint Reporting</h2>
            <p className="text-slate-600 mt-3 font-medium">
              ROADWATCH AI is built to manage the complete lifecycle of road hazard resolution, replacing one-way complaint logs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Traditional */}
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-red-200/60">
                <span className="text-lg">❌</span>
                <h3 className="text-lg font-bold text-slate-900">Traditional Systems</h3>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Complaint Submitted</strong>
                    Manual forms and email logs require manual vetting, adding days to triage.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">No Visibility</strong>
                    Citizens remain unaware of review status, crew dispatches, or resolution timelines.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Slow Follow-Up</strong>
                    Repairs occur without priority weights, resulting in backlogs of severe road hazards.
                  </div>
                </li>
              </ul>
            </div>

            {/* RoadWatch AI */}
            <div className="bg-emerald-50/50 border border-emerald-250 rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-emerald-200/60">
                <span className="text-lg text-emerald-600">✓</span>
                <h3 className="text-lg font-bold text-slate-900">ROADWATCH AI Lifecycle</h3>
              </div>

              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">AI Hazard Detection</strong>
                    Immediate image validation and boundary scans map risk segments instantly.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Priority Scoring</strong>
                    Dynamic score calculation based on traffic impact, hazard type, and severity.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Team Assignment & Repair Tracking</strong>
                    Centralized municipal scheduler records progress updates from dispatches to cures.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Citizen Verification</strong>
                    Bidirectional loop lets reporting citizens review the patch work to close the ticket.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — TEAM & TECHNOLOGY */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8 grid md:grid-cols-2 gap-16">
          {/* Team Members */}
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Team Members
              </h3>
              <p className="text-xs text-slate-500 mt-1">Hackathon developers & designers</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">P</div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Prince</p>
                  <p className="text-[10px] text-slate-500">Core Developer</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-500 border border-cyan-100 flex items-center justify-center font-bold text-sm shrink-0">R</div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Rudra</p>
                  <p className="text-[10px] text-slate-500">Core Developer</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">S</div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Saloni</p>
                  <p className="text-[10px] text-slate-500">Product Designer</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center gap-3 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm shrink-0">S</div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Sarika</p>
                  <p className="text-[10px] text-slate-500">Data Scientist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" /> Technology Stack
              </h3>
              <p className="text-xs text-slate-500 mt-1">Core frameworks and service layers</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center text-center hover:-translate-y-0.5 transition-transform duration-200">
                <span className="text-sm font-bold text-slate-900">React</span>
                <span className="text-[9px] text-slate-500">UI Library</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center text-center hover:-translate-y-0.5 transition-transform duration-200">
                <span className="text-sm font-bold text-slate-900">TypeScript</span>
                <span className="text-[9px] text-slate-500">Type Safety</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center text-center hover:-translate-y-0.5 transition-transform duration-200">
                <span className="text-sm font-bold text-slate-900">Firebase</span>
                <span className="text-[9px] text-slate-500">Real-time Data</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center text-center hover:-translate-y-0.5 transition-transform duration-200">
                <span className="text-sm font-bold text-blue-600">Gemini AI</span>
                <span className="text-[9px] text-slate-500">Visual Audits</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center text-center hover:-translate-y-0.5 transition-transform duration-200">
                <span className="text-sm font-bold text-slate-900">Tailwind CSS</span>
                <span className="text-[9px] text-slate-500">Utility Styling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FOOTER */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Network className="text-blue-500 w-5 h-5" />
            <span className="text-sm font-bold text-white tracking-tight">RoadWatch AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-medium">
            <a href="https://github.com/RANAPRINCE06/ROADWATCH-AI" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub Repository
            </a>
            <button onClick={() => setShowDemoModal(true)} className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <Play className="w-3.5 h-3.5" /> Watch Demo Video
            </button>
            <Link to="/login" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Documentation
            </Link>
            <a href="mailto:info@roadwatch.ai" className="hover:text-blue-400 transition-colors">
              Contact Support
            </a>
          </div>

          <div className="text-[10px] text-slate-500">
            © {new Date().getFullYear()} ROADWATCH AI. Built for municipal safety audits.
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">ROADWATCH AI Platform Demonstration</h3>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Embedded video mock */}
            <div className="bg-slate-950 aspect-video relative flex items-center justify-center p-8 text-center text-white">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <Play className="w-6 h-6 fill-white text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Demo Video Presentation</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    To watch the complete demonstration, please refer to the hackathon pitch links or launch the dashboard directly to interact in real time.
                  </p>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="bg-white text-slate-900 px-4 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-colors"
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
