import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIChatDrawer } from './AIChatDrawer';
import { getSettings } from '../utils/storage';

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    </div>
  );
}
