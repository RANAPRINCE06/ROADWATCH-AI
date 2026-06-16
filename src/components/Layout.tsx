import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIChatDrawer } from './AIChatDrawer';
import { getSettings } from '../utils/storage';

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [justNotification, setJustNotification] = useState<{
    message: string;
    type: 'alert' | 'success' | 'info';
  } | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setJustNotification(e.detail);
      setTimeout(() => setJustNotification(null), 4000);
    };
    window.addEventListener('roadwatch-toast', handleToast);
    return () => window.removeEventListener('roadwatch-toast', handleToast);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const settings = getSettings();
      if (settings.theme === 'Dark Theme' || settings.theme === 'Slate/Immersive Mode') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    window.addEventListener('roadwatch-settings-updated', applyTheme);
    return () => {
      window.removeEventListener('roadwatch-settings-updated', applyTheme);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <TopBar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />
      <main className={`transition-all duration-300 pt-16 ${
        isSidebarOpen ? 'ml-[240px]' : 'ml-0'
      } ${
        isChatOpen ? 'mr-[380px]' : 'mr-0'
      }`}>
        {children}
      </main>
      <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      {/* Global Toast */}
      {justNotification && (
        <div className={`fixed bottom-6 right-6 z-[100] bg-deep-slate text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in-up border max-w-sm transition-all duration-300 ${
          justNotification.type === 'success' ? 'border-green-500/30' : justNotification.type === 'alert' ? 'border-red-500/30' : 'border-white/10'
        }`}>
          <div className="relative w-3.5 h-3.5 flex-shrink-0">
            {justNotification.type === 'success' ? (
              <span className="text-green-400">✓</span>
            ) : justNotification.type === 'alert' ? (
              <span className="text-red-500 font-bold">!</span>
            ) : (
              <span className="text-blue-400">ℹ</span>
            )}
          </div>
          <div className="flex-1 text-xs font-semibold tracking-wide">
            {justNotification.message}
          </div>
        </div>
      )}
    </div>
  );
}
