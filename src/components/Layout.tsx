import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Sidebar />
      <TopBar />
      <main className="ml-[240px] pt-16">
        {children}
      </main>
    </div>
  );
}
