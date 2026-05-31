import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  Map, 
  BarChart3, 
  Bot, 
  Bell, 
  ShieldCheck, 
  Settings, 
  Zap, 
  ChevronLeft,
  ArrowUpDown,
  BrainCircuit,
  ShieldAlert,
  ClipboardList,
  FileText,
  Award,
  Cpu
} from 'lucide-react';

const coreLinks = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Live Heatmap', icon: Map, path: '/heatmap' },
  { name: 'Emergency Alerts', icon: Bell, path: '/alerts' },
];

const intelligenceLinks = [
  { name: 'Road Risk Prediction', icon: BrainCircuit, path: '/predictive' },
  { name: 'Analytics & Reports', icon: BarChart3, path: '/analytics' },
];

const citizenLinks = [
  { name: 'Report Hazard', icon: AlertOctagon, path: '/report' },
  { name: 'Citizen Portal', icon: ClipboardList, path: '/citizen' },
  { name: 'AI Command Center', icon: Bot, path: '/command-center' },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  const renderLink = (link: { name: string; icon: any; path: string }) => {
    const isActive = location.pathname === link.path;
    return (
      <Link
        key={link.name}
        to={link.path}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 group ${
          isActive ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest text-primary'
        }`}
      >
        <link.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'}`} />
        <span className="text-xs font-semibold">{link.name}</span>
      </Link>
    );
  };

  return (
    <aside className={`fixed left-0 top-0 h-full w-[240px] flex flex-col border-r border-outline-variant z-50 bg-white transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-5 flex justify-between items-center border-b border-outline-variant/30 flex-shrink-0">
        <div>
          <h1 className="text-lg font-black text-primary leading-tight">ROADWATCH AI</h1>
          <p className="text-[9px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">Smart City Operations</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-secondary/60 uppercase tracking-wider px-3 block mb-1">Core Modules</span>
          {coreLinks.map(renderLink)}
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-secondary/60 uppercase tracking-wider px-3 block mb-1">AI & Intelligence</span>
          {intelligenceLinks.map(renderLink)}
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-secondary/60 uppercase tracking-wider px-3 block mb-1">Citizen & IoT</span>
          {citizenLinks.map(renderLink)}
        </div>
      </nav>

      <div className="p-4 border-t border-outline-variant flex-shrink-0">
        <button className="w-full bg-error text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform shadow-sm hover:bg-red-600 text-xs cursor-pointer">
          <Zap className="w-4.5 h-4.5" />
          <span>Emergency Response</span>
        </button>
      </div>
    </aside>
  );
}
