import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, StatusCategory } from '../types';
import {
  getActivityProgress,
  getGlobalWorkPlanProgress,
  getItemDeadlineStatus,
  getStatusStyle,
  formatDateFr,
} from '../utils/helpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Filter,
  Flame,
  CheckCircle2,
  Clock,
  PlayCircle,
  ListTodo,
  TrendingUp,
  X,
  UserCheck,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    activities,
    users,
    partners,
    activityCharacteristics,
    filterState,
    setFilterState,
    resetFilters,
    applyMetricFilter,
    setActiveTab,
  } = useApp();

  const globalProgress = getGlobalWorkPlanProgress(activities);

  // Apply basic dropdown filters first
  const baseFilteredActivities = activities.filter(act => {
    // Responsables filter
    if (
      filterState.responsables.length > 0 &&
      !filterState.responsables.includes(act.responsables)
    ) {
      return false;
    }
    // PMDS filter
    if (filterState.pmds.length > 0 && !filterState.pmds.includes(act.pmds)) {
      return false;
    }
    // PlanVPD filter
    if (filterState.planVpd.length > 0 && !filterState.planVpd.includes(act.planVpd)) {
      return false;
    }
    // Types filter
    if (filterState.types.length > 0 && !filterState.types.includes(act.type)) {
      return false;
    }
    // Partenaires filter (if any selected partner is in activity's partenaires)
    if (
      filterState.partenaires.length > 0 &&
      !act.partenaires.some(pId => filterState.partenaires.includes(pId))
    ) {
      return false;
    }
    // Livrables filter
    if (
      filterState.livrables &&
      filterState.livrables.length > 0 &&
      (!act.livrable || !filterState.livrables.includes(act.livrable))
    ) {
      return false;
    }
    // Objectifs filter
    if (
      filterState.objectifs &&
      filterState.objectifs.length > 0 &&
      (!act.objectif || !filterState.objectifs.includes(act.objectif))
    ) {
      return false;
    }
    // Urgent only toggle
    if (filterState.urgentOnly && act.urgent !== 'Oui') {
      return false;
    }
    return true;
  });

  // Calculate Metrics for ALL Activities
  const calculateActivityStats = (actList: Activity[]) => {
    let total = actList.length;
    let demarre = 0;
    let complete = 0;
    let enRetard = 0;

    actList.forEach(act => {
      const prog = getActivityProgress(act);
      const status = getItemDeadlineStatus(act.deadline, prog);

      if (prog === 100) {
        complete += 1;
      } else if (status === 'overdue') {
        enRetard += 1;
      } else if (prog > 0) {
        demarre += 1;
      }
    });

    return { total, demarre, complete, enRetard };
  };

  // Calculate Metrics for Steps across matching activities
  const calculateStepStats = (actList: Activity[]) => {
    let total = 0;
    let demarre = 0;
    let complete = 0;
    let enRetard = 0;

    actList.forEach(act => {
      act.etapes.forEach(step => {
        total += 1;
        const status = getItemDeadlineStatus(step.deadline, step.progression);
        if (step.progression === 100) {
          complete += 1;
        } else if (status === 'overdue') {
          enRetard += 1;
        } else if (step.progression > 0) {
          demarre += 1;
        }
      });
    });

    return { total, demarre, complete, enRetard };
  };

  const actStats = calculateActivityStats(baseFilteredActivities);
  const stepStats = calculateStepStats(baseFilteredActivities);

  // Urgent activities stats
  const urgentActivities = baseFilteredActivities.filter(a => a.urgent === 'Oui');
  const urgentActStats = calculateActivityStats(urgentActivities);
  const urgentStepStats = calculateStepStats(urgentActivities);

  // Final Filtered Activities list after metric card clicks
  const finalFilteredActivities = baseFilteredActivities.filter(act => {
    if (!filterState.metricCategory) return true;

    const prog = getActivityProgress(act);
    const status = getItemDeadlineStatus(act.deadline, prog);

    if (filterState.metricType === 'activity') {
      switch (filterState.metricCategory) {
        case 'Total':
          return true;
        case 'Démarré':
          return prog > 0 && prog < 100;
        case 'Complété':
          return prog === 100;
        case 'En retard':
          return status === 'overdue';
        default:
          return true;
      }
    } else if (filterState.metricType === 'step') {
      // Return activities that have at least one step matching the category
      return act.etapes.some(step => {
        const sStatus = getItemDeadlineStatus(step.deadline, step.progression);
        switch (filterState.metricCategory) {
          case 'Total':
            return true;
          case 'Démarré':
            return step.progression > 0 && step.progression < 100;
          case 'Complété':
            return step.progression === 100;
          case 'En retard':
            return sStatus === 'overdue';
          default:
            return true;
        }
      });
    }

    return true;
  });

  // Data for Charts
  const pmdsProgressData = activityCharacteristics.pmds.map(pmds => {
    const pmdsActs = activities.filter(a => a.pmds === pmds);
    const avgProg = pmdsActs.length > 0 ? getGlobalWorkPlanProgress(pmdsActs) : 0;
    return {
      name: pmds.split('(')[0].trim(),
      Progression: avgProg,
      Activités: pmdsActs.length,
    };
  });

  const pieStatusData = [
    { name: 'Complétés', value: actStats.complete, color: '#10b981' },
    { name: 'En cours', value: actStats.demarre, color: '#0284c7' },
    { name: 'En retard', value: actStats.enRetard, color: '#f43f5e' },
    {
      name: 'Non démarrés',
      value: Math.max(0, actStats.total - actStats.complete - actStats.demarre - actStats.enRetard),
      color: '#94a3b8',
    },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Global Progress Header */}
      <div className="crystal-banner rounded-3xl p-6 lg:p-8 text-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center space-x-3 mb-1">
              <img
                src="./istwa.png"
                alt="ISTWA Logo"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1E7FB8] text-white text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Tableau de Bord - ISTWA</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Suivi global du plan de travail & des interactions ISTWA
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl font-medium">
              Consultez l'avancement moyen, filtrez les métriques par responsable ou axe stratégique, et surveillez l'état d'avancement des étapes en temps réel.
            </p>
          </div>

          {/* Large Global Circular Progress Card */}
          <div className="lg:col-span-4 crystal-card text-slate-900 border border-slate-200/80 rounded-2xl p-5 flex items-center justify-around shadow-md">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Mise en œuvre globale
              </span>
              <div className="text-3xl font-black text-slate-900">
                {globalProgress}%
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Moyenne des {stepStats.total} étape(s)
              </p>
            </div>

            {/* Gauge visual */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-sky-600 transition-all duration-1000"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - globalProgress / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <TrendingUp className="w-6 h-6 absolute text-sky-600" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Filtres Multicritères du Dashboard
            </h3>
          </div>
          {(filterState.responsables.length > 0 ||
            filterState.pmds.length > 0 ||
            filterState.planVpd.length > 0 ||
            filterState.types.length > 0 ||
            filterState.partenaires.length > 0 ||
            (filterState.livrables && filterState.livrables.length > 0) ||
            (filterState.objectifs && filterState.objectifs.length > 0) ||
            filterState.metricCategory !== null) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Responsables Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Responsables
            </label>
            <select
              value={filterState.responsables[0] || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  responsables: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les responsables</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </div>

          {/* PMDS Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              PMDS
            </label>
            <select
              value={filterState.pmds[0] || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  pmds: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les PMDS</option>
              {activityCharacteristics.pmds.map((pmds, idx) => (
                <option key={idx} value={pmds}>
                  {pmds}
                </option>
              ))}
            </select>
          </div>

          {/* PlanVPD Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              PlanVPD
            </label>
            <select
              value={filterState.planVpd[0] || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  planVpd: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les PlanVPD</option>
              {activityCharacteristics.planVpd.map((plan, idx) => (
                <option key={idx} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          {/* Types d'activités Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Types d'activités
            </label>
            <select
              value={filterState.types[0] || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  types: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les types</option>
              {activityCharacteristics.types.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Partenaires Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Partenaires
            </label>
            <select
              value={filterState.partenaires[0] || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  partenaires: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les partenaires</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Livrables Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Livrables
            </label>
            <select
              value={(filterState.livrables && filterState.livrables[0]) || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  livrables: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les livrables</option>
              {(activityCharacteristics.livrables || []).map((liv, idx) => (
                <option key={idx} value={liv}>
                  {liv}
                </option>
              ))}
            </select>
          </div>

          {/* Objectifs Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Objectifs
            </label>
            <select
              value={(filterState.objectifs && filterState.objectifs[0]) || ''}
              onChange={e =>
                setFilterState(prev => ({
                  ...prev,
                  objectifs: e.target.value ? [e.target.value] : [],
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">Tous les objectifs</option>
              {(activityCharacteristics.objectifs || []).map((obj, idx) => (
                <option key={idx} value={obj}>
                  {obj}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* GLOBAL METRICS SECTION (ACTIVITÉS & ÉTAPES) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center space-x-2">
            <ListTodo className="w-5 h-5 text-sky-600" />
            <span>Synthèse globale des Activités et des Étapes</span>
          </h2>
          <span className="text-xs text-slate-500 italic">
            Cliquez sur un chiffre pour filtrer la liste d'activités
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Block 1: ACTIVITÉS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
                Métrique: Activités ({actStats.total})
              </span>
              <span className="text-xs text-sky-600 font-semibold bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Cliquez pour filtrer
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total */}
              <button
                onClick={() => applyMetricFilter('Total', 'activity')}
                className={`p-3 rounded-xl border border-l-4 border-l-blue-500 text-left transition-all ${
                  filterState.metricCategory === 'Total' && filterState.metricType === 'activity'
                    ? 'ring-2 ring-indigo-500 bg-blue-50/80 border-blue-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {actStats.total}
                </div>
              </button>

              {/* Démarré */}
              <button
                onClick={() => applyMetricFilter('Démarré', 'activity')}
                className={`p-3 rounded-xl border border-l-4 border-l-amber-400 text-left transition-all ${
                  filterState.metricCategory === 'Démarré' && filterState.metricType === 'activity'
                    ? 'ring-2 ring-amber-500 bg-amber-50/80 border-amber-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Démarré
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {actStats.demarre}
                </div>
              </button>

              {/* Complété */}
              <button
                onClick={() => applyMetricFilter('Complété', 'activity')}
                className={`p-3 rounded-xl border border-l-4 border-l-emerald-500 text-left transition-all ${
                  filterState.metricCategory === 'Complété' && filterState.metricType === 'activity'
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Complété
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {actStats.complete}
                </div>
              </button>

              {/* En retard */}
              <button
                onClick={() => applyMetricFilter('En retard', 'activity')}
                className={`p-3 rounded-xl border border-l-4 border-l-red-500 text-left transition-all ${
                  filterState.metricCategory === 'En retard' && filterState.metricType === 'activity'
                    ? 'ring-2 ring-rose-500 bg-rose-50/80 border-rose-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  En retard
                </div>
                <div className="text-2xl font-black text-red-600 mt-1">
                  {actStats.enRetard}
                </div>
              </button>
            </div>
          </div>

          {/* Card Block 2: ÉTAPES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
                Métrique: Étapes ({stepStats.total})
              </span>
              <span className="text-xs text-sky-600 font-semibold bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Cliquez pour filtrer
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Étapes */}
              <button
                onClick={() => applyMetricFilter('Total', 'step')}
                className={`p-3 rounded-xl border border-l-4 border-l-blue-500 text-left transition-all ${
                  filterState.metricCategory === 'Total' && filterState.metricType === 'step'
                    ? 'ring-2 ring-indigo-500 bg-blue-50/80 border-blue-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {stepStats.total}
                </div>
              </button>

              {/* Démarré */}
              <button
                onClick={() => applyMetricFilter('Démarré', 'step')}
                className={`p-3 rounded-xl border border-l-4 border-l-amber-400 text-left transition-all ${
                  filterState.metricCategory === 'Démarré' && filterState.metricType === 'step'
                    ? 'ring-2 ring-amber-500 bg-amber-50/80 border-amber-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Démarré
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {stepStats.demarre}
                </div>
              </button>

              {/* Complété */}
              <button
                onClick={() => applyMetricFilter('Complété', 'step')}
                className={`p-3 rounded-xl border border-l-4 border-l-emerald-500 text-left transition-all ${
                  filterState.metricCategory === 'Complété' && filterState.metricType === 'step'
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Complété
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {stepStats.complete}
                </div>
              </button>

              {/* En retard */}
              <button
                onClick={() => applyMetricFilter('En retard', 'step')}
                className={`p-3 rounded-xl border border-l-4 border-l-red-500 text-left transition-all ${
                  filterState.metricCategory === 'En retard' && filterState.metricType === 'step'
                    ? 'ring-2 ring-rose-500 bg-rose-50/80 border-rose-300'
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  En retard
                </div>
                <div className="text-2xl font-black text-red-600 mt-1">
                  {stepStats.enRetard}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION IDENTIQUE: ACTIVITÉS URGENTES */}
      <div className="space-y-4 bg-rose-50/30 dark:bg-rose-950/10 p-5 rounded-3xl border border-rose-200/80 dark:border-rose-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-500 text-white">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
              Section Dédiée: Activités Urgentes (Urgent = Oui)
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('urgencies')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
          >
            <span>Accéder au volet Urgences</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Urgent Activities Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-3">
            <span className="font-bold text-rose-900 dark:text-rose-200 text-sm uppercase tracking-wider block pb-2 border-b border-rose-100 dark:border-rose-950">
              Activités Urgentes ({urgentActStats.total})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => applyMetricFilter('Total', 'activity', true)}
                className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-400 text-center"
              >
                <div className="text-xs font-semibold text-slate-500">Total</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {urgentActStats.total}
                </div>
              </button>

              <button
                onClick={() => applyMetricFilter('Démarré', 'activity', true)}
                className="p-3 rounded-xl border bg-sky-50 dark:bg-sky-950/20 border-sky-200 text-center"
              >
                <div className="text-xs font-semibold text-sky-700">Démarré</div>
                <div className="text-2xl font-black text-sky-600 mt-1">
                  {urgentActStats.demarre}
                </div>
              </button>

              <button
                onClick={() => applyMetricFilter('Complété', 'activity', true)}
                className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-center"
              >
                <div className="text-xs font-semibold text-emerald-700">Complété</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {urgentActStats.complete}
                </div>
              </button>

              <button
                onClick={() => applyMetricFilter('En retard', 'activity', true)}
                className="p-3 rounded-xl border bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-center"
              >
                <div className="text-xs font-semibold text-rose-700">En retard</div>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {urgentActStats.enRetard}
                </div>
              </button>
            </div>
          </div>

          {/* Urgent Steps Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-3">
            <span className="font-bold text-rose-900 dark:text-rose-200 text-sm uppercase tracking-wider block pb-2 border-b border-rose-100 dark:border-rose-950">
              Étapes des Activités Urgentes ({urgentStepStats.total})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => applyMetricFilter('Total', 'step', true)}
                className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-400 text-center"
              >
                <div className="text-xs font-semibold text-slate-500">Total</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {urgentStepStats.total}
                </div>
              </button>

              <button
                onClick={() => applyMetricFilter('Démarré', 'step', true)}
                className="p-3 rounded-xl border bg-sky-50 dark:bg-sky-950/20 border-sky-200 text-center"
              >
                <div className="text-xs font-semibold text-sky-700">Démarré</div>
                <div className="text-2xl font-black text-sky-600 mt-1">
                  {urgentStepStats.demarre}
                </div>
              </button>

              <button
                onClick={() => applyMetricFilter('Complété', 'step', true)}
                className="p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-center"
              >
                <div className="text-xs font-semibold text-emerald-700">Complété</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {urgentStepStats.complete}
                </div>
              </button>

              <button
                onClick={() => applyMetricFilter('En retard', 'step', true)}
                className="p-3 rounded-xl border bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-center"
              >
                <div className="text-xs font-semibold text-rose-700">En retard</div>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {urgentStepStats.enRetard}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS / GRAPHICAL VIEW OF GLOBAL PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chart 1: PMDS Progression Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Avancement par Rubrique PMDS
              </h3>
              <p className="text-xs text-slate-500">
                Pourcentage moyen de mise en œuvre des étapes par axe PMDS
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pmdsProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Avancement moyen']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
                <Bar dataKey="Progression" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Breakdown Pie Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Répartition des Statuts d'Activités
            </h3>
            <p className="text-xs text-slate-500">
              État d'avancement comparatif global
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieStatusData.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune donnée disponible</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* FILTERED ACTIVITIES LIST TABLE / GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center space-x-2">
              <span>Activités Sélectionnées</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {finalFilteredActivities.length} résultat(s)
              </span>
            </h3>
            {filterState.metricCategory && (
              <p className="text-xs text-sky-600 font-medium mt-0.5">
                Filtre actif par clic de métrique: <strong>{filterState.metricCategory}</strong> ({filterState.metricType === 'activity' ? 'Activités' : 'Étapes'})
                {filterState.urgentOnly ? ' - Urgentes uniquement' : ''}
              </p>
            )}
          </div>

          <button
            onClick={() => setActiveTab('activities')}
            className="px-4 py-2 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs flex items-center space-x-1 shadow-md shadow-[#1E7FB8]/30 transition-all"
          >
            <span>Gérer les activités dans la page dédiée</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {finalFilteredActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Aucune activité ne correspond aux filtres appliqués.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalFilteredActivities.map(act => {
              const actProg = getActivityProgress(act);
              const status = getItemDeadlineStatus(act.deadline, actProg);
              const style = getStatusStyle(status);

              const respUser = users.find(u => u.id === act.responsables)?.nom || act.responsables;
              const actPartners = partners.filter(p => act.partenaires.includes(p.id));

              return (
                <div
                  key={act.id}
                  className={`p-4 rounded-2xl border transition-all ${style.cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-2">
                      {act.libelle}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${style.badgeBg}`}>
                      {style.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 my-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Progression ({act.etapes.length} étapes)</span>
                      <span className={style.textColor}>{actProg}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${style.barColor} transition-all duration-300`}
                        style={{ width: `${actProg}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>{respUser}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateFr(act.deadline)}</span>
                    </div>

                    {act.urgent === 'Oui' && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-300">
                        URGENT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
