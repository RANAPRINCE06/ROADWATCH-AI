import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertOctagon, Map, BarChart3, Bot, Bell, ShieldCheck, Settings, Zap, ChevronLeft } from 'lucide-react';

const mainLinks = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Report Hazard', icon: AlertOctagon, path: '/report' },
  { name: 'Live Heatmap', icon: Map, path: '/heatmap' },
  { name: 'Analytics', icon: BarChart3, path: '/analytics' },
  { name: 'AI Reports', icon: Bot, path: '/reports' },
  { name: 'Emergency Alerts', icon: Bell, path: '/alerts' },
];

const systemLinks = [
  { name: 'Admin Panel', icon: ShieldCheck, path: '/admin' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-full w-[240px] flex flex-col border-r border-outline-variant z-50 bg-white transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-white leading-tight">RoadWatch AI</h1>
          <p className="text-[11px] text-on-surface-variant font-label-caps uppercase tracking-widest mt-1">City Safety Intelligence</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {mainLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group ${
                isActive ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <link.icon className={`w-[20px] h-[20px] ${isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'}`} />
              <span className="font-body-md">{link.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 pb-2 px-3">
          <span className="text-label-caps font-label-caps text-outline uppercase">System</span>
        </div>

        {systemLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group ${
                isActive ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <link.icon className={`w-[20px] h-[20px] ${isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'}`} />
              <span className="font-body-md">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-outline-variant">
        <button className="w-full bg-error text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform shadow-sm hover:bg-red-600">
          <Zap className="w-5 h-5" />
          <span className="text-body-sm">Emergency Response</span>
        </button>
      </div>
    </aside>
  );
}
