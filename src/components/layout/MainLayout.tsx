import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps): JSX.Element => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border/60 bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#030957]/10 text-[#030957] dark:bg-amber-400/10 dark:text-amber-400">
              منصة العزب الهندسية
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              دعم شامل لوكلاء Azure AI & المقاولات والمعمار
            </span>
          </div>
          <NotificationCenter />
        </header>
        <div className="flex-1 overflow-auto flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

