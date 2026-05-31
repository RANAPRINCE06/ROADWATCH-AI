import React, { useState, useEffect } from 'react';
import { Search, Bell, Bot, MapPin, Menu, Play, AlertTriangle, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getReports, Report } from '../utils/storage';

export function TopBar({ isOpen, onToggle, onToggleChat, isChatOpen }: { isOpen: boolean; onToggle: () => void; onToggleChat: () => void; isChatOpen: boolean }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalReports, setCriticalReports] = useState<Report[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const userStr = localStorage.getItem('roadwatch_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email || 'admin@roadwatch.gov';
  const role = user?.role || 'authority';

  const displayName = role === 'citizen' ? 'Citizen User' : role === 'maintenance' ? 'Maintenance Crew Lead' : 'Marcus Thorne';
  const roleTitle = role === 'citizen' ? 'Citizen Reporter' : role === 'maintenance' ? 'Operations Dispatch' : 'Chief Safety Officer';

  const handleSignOut = () => {
    localStorage.removeItem('roadwatch_user');
    navigate('/login');
  };

  useEffect(() => {
    const updateAlerts = () => {
      const allReports = getReports();
      const criticals = allReports.filter(r => !r.resolved && r.severity === 'Critical');
      setCriticalReports(criticals);
    };

    updateAlerts();
    window.addEventListener('roadwatch-reports-updated', updateAlerts);
    return () => {
      window.removeEventListener('roadwatch-reports-updated', updateAlerts);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    window.dispatchEvent(new CustomEvent('roadwatch-search', { detail: val }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('roadwatch-search', { detail: '' }));
  };

  const handleTriggerDemo = () => {
    try {
      navigate('/dashboard');
      setTimeout(() => {
        window.dispatchEvent(new Event('roadwatch-start-simulation'));
      }, 300);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetMap = () => {
    navigate('/dashboard');
    setTimeout(() => {
      window.dispatchEvent(new Event('roadwatch-reset-map'));
    }, 150);
  };

  return (
    <header className={`fixed top-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border-subtle flex justify-between items-center h-16 px-6 shadow-sm transition-all duration-300 ${
      isOpen ? 'w-[calc(100%-240px)]' : 'w-full'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        {!isOpen && (
          <button 
            onClick={onToggle}
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
            title="Expand Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
          <input 
            id="map-search-input"
            className="w-full pl-10 pr-10 py-2 bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary text-body-md outline-none transition-all" 
            placeholder="Search locations, hazards, or districts..." 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-container text-text-secondary hover:text-primary transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          {/* Notifications Bell with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low cursor-pointer ${
                showNotifications ? 'bg-surface-container-low text-primary' : ''
              }`}
              title="Critical Active Alerts"
            >
              <Bell className="w-5 h-5" />
              {criticalReports.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {criticalReports.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border-subtle z-50 p-4 animate-fade-in-up">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2 mb-2.5">
                  <h4 className="text-xs font-black text-primary tracking-wide uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" /> Critical Hazards ({criticalReports.length})
                  </h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] text-text-secondary hover:text-primary font-bold">✕</button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                  {criticalReports.length === 0 ? (
                    <div className="text-[10px] text-text-secondary text-center py-6 font-semibold">
                      No active critical hazards
                    </div>
                  ) : (
                    criticalReports.map((r) => (
                      <div 
                        key={r.id}
                        onClick={() => {
                          navigate('/dashboard');
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('roadwatch-select-report', { detail: r.id }));
                          }, 150);
                          setShowNotifications(false);
                        }}
                        className="p-2.5 hover:bg-red-50/50 rounded-lg border border-red-100/50 cursor-pointer transition-colors flex gap-2.5 items-start group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-primary group-hover:text-red-700 transition-colors truncate leading-tight">{r.title}</p>
                          <p className="text-[9px] text-text-secondary truncate mt-0.5">{r.location}</p>
                          <p className="text-[8px] text-text-secondary/60 mt-0.5 italic">{r.source}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onToggleChat}
            className={`text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low cursor-pointer ${isChatOpen ? 'bg-surface-container-low text-primary' : ''}`}
            title="AI Chat Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleResetMap}
            className="text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low cursor-pointer"
            title="Reset Map View"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleTriggerDemo}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1.5 rounded-full font-black text-xs hover:shadow-lg transition-all active:scale-95 animate-pulse cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Demo Mode
          </button>

          <button 
            onClick={onToggleChat}
            className="flex items-center gap-2 bg-safety-yellow text-primary px-4 py-1.5 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 cursor-pointer"
          >
            AI Assistant
          </button>
        </div>
        
        <div className="h-8 w-px bg-outline-variant"></div>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-body-sm font-bold leading-tight group-hover:text-primary transition-colors">{displayName}</p>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">{roleTitle}</p>
            </div>
            <img 
              alt="User profile" 
              className="w-10 h-10 rounded-full border border-border-subtle object-cover shadow-sm group-hover:border-primary transition-all" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs1aCxQRSRbOaSzSN0IuWNbUJMmA7-n88Bk5LD4_K6qzpBufNOp4ON04PdaGd-6-uBjiKVCdr2mPAwmYYdV6QXSFIfY9KgQ26ieTh2PaUU8Pq_Pi0uJHs009XW8NUmUcs8A4YU9g8fcs64ACg6MdPUHf8zW3q_OC2LVklLfTeLw_jsslfuu1m2RmnaMjt8csa0tP2wz3yqfGriYWlrRAeUY4NOAVadZ0MhgJPuHurxSxVRqqJ_ENSQdjRfgP8zLYtLy7cRvNbG-l0" 
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-xl shadow-xl border border-border-subtle z-50 p-3 animate-fade-in-up">
              <div className="px-2 py-1.5 border-b border-border-subtle/50 mb-1.5">
                <p className="text-xs font-black text-primary truncate leading-tight">{displayName}</p>
                <p className="text-[9px] text-text-secondary truncate mt-0.5">{email}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-2 py-2 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-all text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

