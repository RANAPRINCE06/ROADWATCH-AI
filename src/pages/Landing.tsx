import React from 'react';
import {
  Map,
  Rss, // For sensors icon
  Megaphone, // For campaign
  HardHat, // For engineering
  CheckCircle,
  ArrowRight,
  Maximize,
  Quote,
  Network,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="bg-background text-on-background scroll-smooth">
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center h-16 px-8 bg-white/80 backdrop-blur-xl border-b border-border-subtle shadow-sm">
        <div className="flex items-center gap-2">
          <Network className="text-primary w-6 h-6" />
          <span className="text-lg font-bold text-on-surface">RoadWatch AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <a href="#features" className="text-text-secondary hover:text-primary transition-all">Features</a>
          <a href="#demo" className="text-text-secondary hover:text-primary transition-all">AI Demo</a>
          <a href="#heatmap" className="text-text-secondary hover:text-primary transition-all">Live Map</a>
          <a href="#faq" className="text-text-secondary hover:text-primary transition-all">Resources</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            Launch Console
          </Link>
        </div>
      </nav>

      <header className="relative pt-32 pb-20 overflow-hidden min-h-[921px] flex items-center">
        <div className="absolute inset-0 hero-pattern -z-10"></div>
        <div className="max-w-[1440px] mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant">
              <span className="flex h-2 w-2 rounded-full bg-safety-yellow animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">Next-Gen Urban Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Safer Roads with <span className="text-primary italic">AI</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-lg">
              Detect, report, and monitor dangerous roads in real time using satellite imagery and community-driven data intelligence.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/report" className="bg-safety-yellow text-primary px-8 py-4 rounded font-semibold text-lg flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 border-t border-white/20">
                <span className="font-bold">⚠</span> Report Hazard
              </Link>
              <Link to="/heatmap" className="bg-surface-container-highest text-primary px-8 py-4 rounded font-semibold text-lg flex items-center gap-2 hover:bg-surface-variant transition-all active:scale-95 border border-outline-variant">
                <Map className="w-5 h-5" /> Explore Live Map
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10 glass-panel p-4 rounded-xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHX3ScIZFqAAbvKMpvPN857Y17V6W_zowU4X_tCn2Y8ovPUzf58g49Wi87OlAENVdFeZg6SbPoiwdwBuDOiUa2GiZc9yLB7PSq68I43dxpnnMBb3_VetQ13i8To7zIE09RcX4TofueCnyWc0vHq7co1UREbR_ch6IXjb-oX1goHIz82iB5RxsvMT2Kk4GeGXmSRAK9vkuQ0QAE3TtlO9eod5PWsIpe5nji8f879onXl1r97qAbJ1NMr0cl-rwmEl2qJ8VDs6qSLtQ" 
                alt="Dashboard Preview" 
                className="rounded-lg w-full h-auto"
              />
              <div className="absolute -bottom-6 -left-6 glass-panel p-4 rounded-lg shadow-xl hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-safety-yellow flex items-center justify-center">
                    <span className="text-primary font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase">ACTIVE ALERT</p>
                    <p className="text-sm font-bold">Sinkhole detected on Main St.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-deep-slate py-16">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <p className="text-4xl md:text-5xl font-bold text-safety-yellow">12.4k</p>
              <p className="text-[11px] font-bold text-on-primary-fixed-dim uppercase tracking-wider">Total Reports</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-4xl md:text-5xl font-bold text-white">8,290</p>
              <p className="text-[11px] font-bold text-on-primary-fixed-dim uppercase tracking-wider">Roads Fixed</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-4xl md:text-5xl font-bold text-error">412</p>
              <p className="text-[11px] font-bold text-on-primary-fixed-dim uppercase tracking-wider">Active Hazards</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-4xl md:text-5xl font-bold text-white">94%</p>
              <p className="text-[11px] font-bold text-on-primary-fixed-dim uppercase tracking-wider">Safe Zones</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold">How RoadWatch Works</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Three simple steps to smarter, safer urban infrastructure.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group">
              <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center mb-6 group-hover:bg-safety-yellow transition-colors duration-300">
                <Rss className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Autonomous Detection</h3>
              <p className="text-text-secondary text-sm">
                Our AI models scan satellite feeds and street cameras 24/7 to identify structural anomalies and hazards.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center mb-6 group-hover:bg-safety-yellow transition-colors duration-300">
                <Megaphone className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Instant Reporting</h3>
              <p className="text-text-secondary text-sm">
                Hazards are instantly logged and categorized into our global safety ledger for public visibility.
              </p>
            </div>
            <div className="group">
              <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center mb-6 group-hover:bg-safety-yellow transition-colors duration-300">
                <HardHat className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Rapid Response</h3>
              <p className="text-text-secondary text-sm">
                City maintenance teams receive high-priority dispatch notifications to resolve critical issues fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-24 bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Smart City Vision AI</h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Our proprietary neural network detects road defects with 99.2% accuracy. From potholes to faded lane markings, we see what legacy systems miss.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-safety-yellow w-6 h-6 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Real-time Anomaly Labeling</p>
                    <p className="text-text-secondary text-xs mt-1">Automated tagging of hazard types and severity levels.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-safety-yellow w-6 h-6 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Predictive Maintenance</p>
                    <p className="text-text-secondary text-xs mt-1">AI forecasts road degradation before it becomes dangerous.</p>
                  </div>
                </li>
              </ul>
              <button className="bg-primary text-on-primary px-6 py-3 rounded text-sm font-semibold flex items-center gap-2 hover:bg-on-surface-variant transition-all mt-4">
                View Technical Docs
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-outline-variant aspect-video group">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaKpzILNKBoNm-17PXpiTuomoQzX0NatZ3bs_sCLOE-x6y44GMxt6ePjuQQ24KJc6dPVEMEHBd65zv5vmzThBMHmwM-d3MRH6PjN21s17QDgBdJZeNqZ7fhfwFKPEpxiJs8GuJeKT-fvimmnZvxe-dtUdNJrho_J7LldXytQLXBCuSZ1MuUJvbh7v1PysBd2cLo5t2fYe5SBhT8r5YaePGKgP3IQkNsbF1worWfaTS4UvzFYej0WPPBn6Ye1b0C-hbWu22l8YXlUI" 
                alt="AI Vision Demo" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-safety-yellow">Processing Feed...</span>
                  <span className="text-sm font-bold uppercase tracking-tight text-white mt-1">Segment: Downtown-04</span>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-safety-yellow/50 animate-[scan_3s_linear_infinite] shadow-[0_0_15px_#FACC15]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap Preview & Footer can be simplified for this wrapper */}
      <footer className="bg-deep-slate text-white pt-20 pb-12 mt-20">
        <div className="max-w-[1440px] mx-auto px-8 grid md:grid-cols-4 gap-12 border-b border-border-subtle/20 pb-16 mb-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <Network className="text-safety-yellow w-8 h-8" />
              <span className="text-xl font-bold">RoadWatch AI</span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm">
              Building the data foundation for zero-hazard infrastructure through machine learning and community vigilance.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-safety-yellow">Live Heatmap</a></li>
              <li><a href="#" className="hover:text-safety-yellow">API Integration</a></li>
              <li><a href="#" className="hover:text-safety-yellow">Safety Reports</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-safety-yellow">About Us</a></li>
              <li><a href="#" className="hover:text-safety-yellow">Press Kit</a></li>
              <li><a href="#" className="hover:text-safety-yellow">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-8 flex justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RoadWatch AI Systems. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
