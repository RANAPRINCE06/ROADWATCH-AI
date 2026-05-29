import React from 'react';
import { Search, Bell, Bot, MapPin, Menu } from 'lucide-react';

export function TopBar({ isOpen, onToggle, onToggleChat, isChatOpen }: { isOpen: boolean; onToggle: () => void; onToggleChat: () => void; isChatOpen: boolean }) {
  return (
    <header className={`fixed top-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border-subtle flex justify-between items-center h-16 px-6 shadow-sm transition-all duration-300 ${
      isOpen ? 'w-[calc(100%-240px)]' : 'w-full'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        {!isOpen && (
          <button 
            onClick={onToggle}
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
            title="Expand Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
          <input 
            id="map-search-input"
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary text-body-md outline-none transition-all" 
            placeholder="Search locations, hazards, or districts..." 
            type="text" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="relative text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={onToggleChat}
            className={`text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low ${isChatOpen ? 'bg-surface-container-low text-primary' : ''}`}
            title="AI Chat Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-all flex items-center justify-center p-1.5 rounded-full hover:bg-surface-container-low">
            <MapPin className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={onToggleChat}
          className="flex items-center gap-2 bg-safety-yellow text-primary px-4 py-1.5 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95"
        >
          AI Assistant
        </button>
        
        <div className="h-8 w-px bg-outline-variant"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-body-sm font-bold leading-tight group-hover:text-primary transition-colors">Marcus Thorne</p>
            <p className="text-[11px] text-on-surface-variant opacity-70">Chief Safety Officer</p>
          </div>
          <img 
            alt="User profile" 
            className="w-10 h-10 rounded-full border border-border-subtle object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs1aCxQRSRbOaSzSN0IuWNbUJMmA7-n88Bk5LD4_K6qzpBufNOp4ON04PdaGd-6-uBjiKVCdr2mPAwmYYdV6QXSFIfY9KgQ26ieTh2PaUU8Pq_Pi0uJHs009XW8NUmUcs8A4YU9g8fcs64ACg6MdPUHf8zW3q_OC2LVklLfTeLw_jsslfuu1m2RmnaMjt8csa0tP2wz3yqfGriYWlrRAeUY4NOAVadZ0MhgJPuHurxSxVRqqJ_ENSQdjRfgP8zLYtLy7cRvNbG-l0" 
          />
        </div>
      </div>
    </header>
  );
}
