import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, Header } from './components/Navbar';
import { DashboardPage } from './components/DashboardPage';
import { ActivitiesPage } from './components/ActivitiesPage';
import { UrgencesPage } from './components/UrgencesPage';
import { AdminPage } from './components/AdminPage';
import { AuthModal } from './components/AuthModal';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-[#f8f9f2] via-[#EFF0DA]/30 to-[#e8ebcf]/20 text-slate-800 overflow-hidden font-sans">
      {/* Auth Modal overlay for restricted tabs and actions */}
      <AuthModal />

      {/* Left Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />

        {/* Dynamic Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-transparent">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'activities' && <ActivitiesPage />}
          {activeTab === 'urgencies' && <UrgencesPage />}
          {activeTab === 'admin' && <AdminPage />}
        </main>

        {/* High Density Footer */}
        <footer className="h-9 bg-white/80 backdrop-blur-md border-t border-slate-200/80 px-6 flex items-center justify-between text-[11px] text-slate-600 font-medium shrink-0">
          <div className="flex items-center space-x-2 truncate">
            <img src="./istwa.png" alt="ISTWA Logo" className="w-4 h-4 object-contain" />
            <p className="truncate">
              © ISTWAMONITOR 2026 — Plan de travail & interactions de l'équipe ISTWA
            </p>
          </div>
          <p className="text-[#5b6b2e] font-mono font-bold hidden sm:block">
            Haute Densité v2.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
