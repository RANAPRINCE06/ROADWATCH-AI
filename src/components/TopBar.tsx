import React, { useState, useEffect } from 'react';
import { Search, Bell, Bot, MapPin, Menu, Play, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getReports, Report } from '../utils/storage';

export function TopBar({ isOpen, onToggle, onToggleChat, isChatOpen }: { isOpen: boolean; onToggle: () => void; onToggleChat: () => void; isChatOpen: boolean }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const getSortedCriticalHazards = () => {
    return getReports()
      .filter(r => r.severity === 'Critical' && !r.resolved && r.status !== 'Resolved')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const [criticalHazards, setCriticalHazards] = useState<Report[]>(() => getSortedCriticalHazards());
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [prevCount, setPrevCount] = useState(() => criticalHazards.length);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('roadwatch_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'Marcus Thorne',
      title: 'Chief Safety Officer',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs1aCxQRSRbOaSzSN0IuWNbUJMmA7-n88Bk5LD4_K6qzpBufNOp4ON04PdaGd-6-uBjiKVCdr2mPAwmYYdV6QXSFIfY9KgQ26ieTh2PaUU8Pq_Pi0uJHs009XW8NUmUcs8A4YU9g8fcs64ACg6MdPUHf8zW3q_OC2LVklLfTeLw_jsslfuu1m2RmnaMjt8csa0tP2wz3yqfGriYWlrRAeUY4NOAVadZ0MhgJPuHurxSxVRqqJ_ENSQdjRfgP8zLYtLy7cRvNbG-l0'
    };
  });

  const formatTimeAgo = (timestampStr: string) => {
    if (!timestampStr) return 'Just now';
    const date = new Date(timestampStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleToggleNotifications = () => {
    const nextShow = !showNotifications;
    setShowNotifications(nextShow);
    if (nextShow) {
      setHasNewAlert(false);
    }
  };

  useEffect(() => {
    const updateHazardsList = () => {
      const hazards = getSortedCriticalHazards();
      setCriticalHazards(hazards);
      setPrevCount(prev => {
        if (hazards.length > prev) {
          setHasNewAlert(true);
        }
        return hazards.length;
      });
    };
    updateHazardsList();
    window.addEventListener('roadwatch-reports-updated', updateHazardsList);
    
    const handleUserUpdate = () => {
      try {
        const saved = localStorage.getItem('roadwatch_user_profile');
        if (saved) setProfile(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('roadwatch-user-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('roadwatch-reports-updated', updateHazardsList);
      window.removeEventListener('roadwatch-user-updated', handleUserUpdate);
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

  const handleLogout = () => {
    localStorage.removeItem('roadwatch_user_profile');
    window.dispatchEvent(new Event('roadwatch-user-updated'));
    navigate('/login');
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
              onClick={handleToggleNotifications}
              className={`relative text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low cursor-pointer ${
                showNotifications ? 'bg-surface-container-low text-primary' : ''
              }`}
              title="Critical Active Alerts"
            >
              <Bell className="w-5 h-5" />
              {criticalHazards.length > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white z-10">
                    {criticalHazards.length}
                  </span>
                  {hasNewAlert && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 w-4 h-4 rounded-full border border-white animate-ping"></span>
                  )}
                </>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-border-subtle z-50 p-4 animate-fade-in-up">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2 mb-2.5">
                  <h4 className="text-xs font-black text-primary tracking-wide uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" /> Critical Alerts ({criticalHazards.length})
                  </h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] text-text-secondary hover:text-primary font-bold">✕</button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                  {criticalHazards.length === 0 ? (
                    <div className="text-[10px] text-text-secondary text-center py-6 font-semibold">
                      No Critical Alerts
                    </div>
                  ) : (
                    criticalHazards.map((a) => (
                      <div 
                        key={a.id}
                        onClick={() => {
                          navigate('/alerts');
                          setShowNotifications(false);
                        }}
                        className="p-2.5 hover:bg-red-50/50 rounded-lg border border-red-100/50 cursor-pointer transition-colors flex gap-2.5 items-start group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-primary group-hover:text-red-700 transition-colors truncate leading-tight">{a.title}</p>
                          <p className="text-[9px] text-text-secondary truncate mt-0.5">📍 {a.location}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[8px] text-text-secondary/60 italic">Reported: {formatTimeAgo(a.timestamp)}</span>
                            <span className="text-[8px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{a.status}</span>
                          </div>
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
        
        {/* Profile Container with Hover Dropdown */}
        <div className="relative group flex items-center h-16">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-right flex flex-col justify-center">
              <p className="text-body-sm font-bold leading-none text-slate-800 group-hover:text-primary transition-colors">{profile.name}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-none">{profile.title}</p>
            </div>
            <img 
              alt="User profile" 
              className="w-10 h-10 rounded-full border border-border-subtle object-cover" 
              src={profile.avatarUrl} 
            />
          </div>

          {/* Dropdown Menu on Hover */}
          <div className="absolute right-0 top-14 w-40 bg-white rounded-xl shadow-xl border border-slate-200/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 flex flex-col gap-1">
            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors cursor-pointer text-left w-full"
            >
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left w-full"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

