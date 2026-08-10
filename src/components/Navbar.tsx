import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getGlobalWorkPlanProgress, isAuthorizedForDatabaseDownload } from '../utils/helpers';
import {
  Bell,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ListTodo,
  Flame,
  RotateCcw,
  X,
  UserCheck,
  Clock,
  ChevronRight,
  Plus,
  Menu,
  Download,
  Lock,
  LogOut,
  LogIn,
  Wifi,
  Cloud,
} from 'lucide-react';

export const Sidebar: React.FC<{ mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }> = ({
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    activeTab,
    setActiveTab,
    activities,
    currentUser,
    promptAuth,
    logout,
    exportFullDatabase,
    realtimeConnected,
  } = useApp();
  const globalProgress = getGlobalWorkPlanProgress(activities);

  const urgentCount = activities.filter(
    a => a.urgent === 'Oui' && getGlobalWorkPlanProgress([a]) < 100
  ).length;

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-68 crystal-sidebar text-slate-800 flex flex-col justify-between shadow-xl transition-transform duration-300 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="p-3.5 border-b border-slate-200/70 flex items-center justify-between bg-white/60 backdrop-blur-md">
            <div
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <img
                src="./istwa.png"
                alt="ISTWA Logo"
                className="w-10 h-10 object-contain transition-transform group-hover:scale-105 shrink-0"
              />
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center space-x-1">
                  <span>ISTWA</span>
                  <span className="text-sky-600">MONITOR</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold mt-0.5 flex items-center gap-1">
                  <span>Plan ISTWA</span>
                  {realtimeConnected ? (
                    <span className="inline-flex items-center text-emerald-600 text-[9px] font-bold">
                      <Wifi className="w-2.5 h-2.5 mr-0.5 animate-pulse" /> Supabase
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-400 text-[9px] font-bold">
                      <Cloud className="w-2.5 h-2.5" />
                    </span>
                  )}
                </p>
              </div>
            </div>
            {setMobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="py-4 space-y-1.5 px-3">
            {/* Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#1E7FB8] text-white shadow-md shadow-[#1E7FB8]/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 mr-3 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">Dashboard</span>
            </button>

            {/* Activités - Auth Required */}
            <button
              onClick={() => handleNavClick('activities')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'activities'
                  ? 'bg-[#1E7FB8] text-white shadow-md shadow-[#1E7FB8]/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <ListTodo className={`w-4 h-4 mr-3 shrink-0 ${activeTab === 'activities' ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">Plan & Activités</span>
              {!currentUser ? (
                <Lock className="w-3.5 h-3.5 ml-auto text-amber-500 shrink-0" />
              ) : (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'activities' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {activities.length}
                </span>
              )}
            </button>

            {/* Urgences - Auth Required */}
            <button
              onClick={() => handleNavClick('urgencies')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'urgencies'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 hover:bg-rose-50/80 hover:text-rose-700'
              }`}
            >
              <Flame className={`w-4 h-4 mr-3 shrink-0 ${activeTab === 'urgencies' ? 'text-white' : 'text-rose-500'}`} />
              <span className="truncate">Urgences</span>
              {!currentUser ? (
                <Lock className="w-3.5 h-3.5 ml-auto text-amber-500 shrink-0" />
              ) : urgentCount > 0 ? (
                <span className="ml-auto bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {urgentCount}
                </span>
              ) : null}
            </button>

            {/* Admin - Auth Required */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#1E7FB8] text-white shadow-md shadow-[#1E7FB8]/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <Settings className={`w-4 h-4 mr-3 shrink-0 ${activeTab === 'admin' ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">Administration</span>
              {!currentUser && <Lock className="w-3.5 h-3.5 ml-auto text-amber-500 shrink-0" />}
            </button>
          </nav>

          {/* Quick Database Download Button - Available to Administrator and Operator */}
          {isAuthorizedForDatabaseDownload(currentUser) && (
            <div className="px-3 my-2">
              <button
                onClick={exportFullDatabase}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 text-xs font-bold transition-all shadow-xs"
                title="Télécharger toute la base de données en fichier JSON"
              >
                <Download className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate">Télécharger toute la base</span>
              </button>
            </div>
          )}

          {/* Global Progress Widget */}
          <div className="mx-3 my-2 p-3 rounded-xl crystal-card space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span>Progression Générale</span>
              <span className="text-slate-900 font-mono text-xs font-extrabold">{globalProgress}%</span>
            </div>
            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 bg-white/60 backdrop-blur-md border-t border-slate-200/70">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                  {currentUser.nom.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.nom}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold truncate">
                    {currentUser.habilitation || (currentUser as any).role}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => promptAuth()}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs shadow-md transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Se Connecter</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export const Header: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const {
    activeTab,
    setActiveTab,
    criticalAlerts,
    resetToDemoData,
    currentUser,
    promptAuth,
    logout,
    exportFullDatabase,
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 shadow-xs z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="./istwa.png"
            alt="ISTWA Logo"
            className="w-7 h-7 object-contain rounded-lg p-0.5 bg-stone-100 border border-stone-300 shadow-xs"
          />
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {activeTab === 'dashboard' && '📊 Dashboard'}
            {activeTab === 'activities' && '📋 Plan de Travail & Activités'}
            {activeTab === 'urgencies' && '🚨 Urgences'}
            {activeTab === 'admin' && '⚙️ Espace Administration'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Télécharger la base button - Available to Administrator and Operator */}
        {isAuthorizedForDatabaseDownload(currentUser) && (
          <button
            onClick={exportFullDatabase}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
            title="Télécharger toute la base de données au format JSON"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden lg:inline">Télécharger la Base</span>
          </button>
        )}

        {/* Quick New Activity Action */}
        <button
          onClick={() => setActiveTab('activities')}
          className="bg-[#1E7FB8] hover:bg-[#186da0] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+ Nouvelle Activité</span>
        </button>

        {/* Critical Alerts Bell */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
          title="Retards critiques et alertes"
        >
          <Bell className="w-4 h-4" />
          {criticalAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white animate-bounce">
              {criticalAlerts.length}
            </span>
          )}
        </button>

        {/* Reset Demo Data */}
        <button
          onClick={() => {
            if (
              window.confirm(
                'Voulez-vous réinitialiser toutes les données aux valeurs de démonstration ?'
              )
            ) {
              resetToDemoData();
            }
          }}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors text-xs hidden sm:block"
          title="Réinitialiser les données de démo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Auth State Button */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <p className="text-xs font-extrabold text-slate-800 leading-none">{currentUser.nom}</p>
              <p className="text-[9px] font-bold text-[#1E7FB8] uppercase tracking-widest mt-0.5">
                {currentUser.habilitation || (currentUser as any).role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => promptAuth()}
            className="bg-sky-50 hover:bg-sky-100 text-[#1E7FB8] border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Connexion</span>
          </button>
        )}
      </div>

      {/* Critical Delays Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white border-l border-slate-200 text-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Alertes de Retards Critiques</h3>
                  <p className="text-[11px] text-slate-500">
                    Éléments expirés ou échéance &lt; 2 jours
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {criticalAlerts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <h4 className="text-sm font-bold text-slate-800">Aucun retard critique</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Toutes les activités et étapes sont dans les délais.
                  </p>
                </div>
              ) : (
                criticalAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      alert.days < 0
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 line-clamp-2">
                        {alert.title}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap uppercase ${
                          alert.days < 0
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {alert.days < 0 ? `En retard (${Math.abs(alert.days)}j)` : `J-${alert.days}`}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/80 pt-2">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#1E7FB8]" />
                        <span className="font-semibold">{alert.responsable}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{alert.deadline}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">{criticalAlerts.length} alerte(s) active(s)</span>
              <button
                onClick={() => {
                  setShowNotifications(false);
                  setActiveTab('urgencies');
                }}
                className="text-[#1E7FB8] hover:text-[#186da0] font-bold flex items-center space-x-1"
              >
                <span>Voir les Urgences</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export const Navbar = Sidebar;
