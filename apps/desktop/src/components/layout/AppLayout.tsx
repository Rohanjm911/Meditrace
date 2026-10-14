import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { HowToUseModal } from '../guide/HowToUseModal';

export const AppLayout: React.FC = () => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState(0);

  useEffect(() => {
    // Check if user just logged in or first visit
    const justLoggedIn = sessionStorage.getItem('meditrace_just_logged_in') === 'true';
    const isFirstTime = localStorage.getItem('meditrace_has_seen_guide') !== 'true';
    const isGuideDisabled = localStorage.getItem('meditrace_disable_login_guide') === 'true';

    if ((justLoggedIn || isFirstTime) && !isGuideDisabled) {
      setIsGuideOpen(true);
      sessionStorage.removeItem('meditrace_just_logged_in');
      localStorage.setItem('meditrace_has_seen_guide', 'true');
    }

    const handleOpenGuide = (e: any) => {
      if (e?.detail?.tab !== undefined) {
        setGuideTab(e.detail.tab);
      } else {
        setGuideTab(0);
      }
      setIsGuideOpen(true);
    };

    window.addEventListener('meditrace:open-guide', handleOpenGuide);
    return () => window.removeEventListener('meditrace:open-guide', handleOpenGuide);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-soft text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Outlet />
        </main>
      </div>

      <HowToUseModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultTab={guideTab}
      />
    </div>
  );
};
