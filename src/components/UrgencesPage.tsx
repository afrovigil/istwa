import React from 'react';
import { useApp } from '../context/AppContext';
import {
  formatDateFr,
  getActivityProgress,
  getDaysRemaining,
  getItemDeadlineStatus,
  getStatusStyle,
} from '../utils/helpers';
import {
  Flame,
  Clock,
  UserCheck,
  Building2,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const UrgencesPage: React.FC = () => {
  const { activities, users, partners, updateStepProgress, setActiveTab } = useApp();

  // Filter ONLY urgent activities that are NOT completed
  const urgentActivities = activities.filter(act => {
    const prog = getActivityProgress(act);
    return act.urgent === 'Oui' && prog < 100;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="crystal-banner rounded-3xl p-6 lg:p-8 text-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 mb-1">
              <img
                src="./istwa.png"
                alt="ISTWA Logo"
                className="w-11 h-11 object-contain shrink-0"
              />
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 animate-bounce text-rose-600" />
                <span>Urgences — ISTWA</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Activités Prioritaires Non Complétées
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium">
              Sont répertoriées ici uniquement les activités marquées « Urgent = Oui » dont le taux de réalisation n'a pas atteint 100%. Ajustez directement les curseurs d'étapes pour lever les blocages.
            </p>
          </div>

          <div className="crystal-card border border-rose-200/80 bg-rose-50/50 rounded-2xl p-4 text-center min-w-[140px] shadow-sm">
            <span className="text-3xl font-black text-rose-600 block">
              {urgentActivities.length}
            </span>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Urgence(s) Active(s)
            </span>
          </div>
        </div>
      </div>

      {/* Main List */}
      {urgentActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto opacity-90" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Excellente nouvelle !
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aucune activité urgente n'est en souffrance. Toutes les tâches prioritaires ont été complétées à 100%.
          </p>
          <button
            onClick={() => setActiveTab('activities')}
            className="mt-2 px-4 py-2 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs transition-all shadow-md"
          >
            Voir le plan de travail complet
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {urgentActivities.map(act => {
            const actProg = getActivityProgress(act);
            const status = getItemDeadlineStatus(act.deadline, actProg);
            const style = getStatusStyle(status);
            const daysRem = getDaysRemaining(act.deadline);

            const respUser = users.find(u => u.id === act.responsables)?.nom || act.responsables;
            const assignedPartners = partners.filter(p => act.partenaires.includes(p.id));

            return (
              <div
                key={act.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${style.cardBorder} p-6 shadow-md space-y-5`}
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white flex items-center space-x-1 uppercase tracking-wider">
                        <Flame className="w-3 h-3" />
                        <span>URGENT = OUI</span>
                      </span>

                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${style.badgeBg}`}>
                        {style.label}
                      </span>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          daysRem < 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {daysRem < 0
                          ? `EXSPIRÉ (Retard de ${Math.abs(daysRem)} jours)`
                          : `Reste ${daysRem} jour(s)`}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                      {act.libelle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Deadline: <strong className="text-slate-900 dark:text-slate-100">{formatDateFr(act.deadline)}</strong></span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        <span>Responsable: <strong className="text-slate-900 dark:text-slate-100">{respUser}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Progress gauge */}
                  <div className="text-right bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[150px]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Avancement Actuel</div>
                    <div className={`text-2xl font-black ${style.textColor}`}>
                      {actProg}%
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${style.barColor}`}
                        style={{ width: `${actProg}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Characteristics tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    Type: <strong>{act.type}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    PMDS: <strong>{act.pmds}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    PlanVPD: <strong>{act.planVpd}</strong>
                  </span>
                  {assignedPartners.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-medium border border-sky-200 dark:border-sky-800">
                      Partenaires: {assignedPartners.map(p => p.libelle).join(', ')}
                    </span>
                  )}
                </div>

                {/* Steps Section with Sliders */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-rose-500" />
                    <span>Mise à jour rapide des étapes de cette urgence ({act.etapes.length})</span>
                  </div>

                  {act.etapes.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
                      Aucune étape enregistrée pour cette activité urgente.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {act.etapes.map(step => {
                        const stepStatus = getItemDeadlineStatus(step.deadline, step.progression);
                        const stepStyle = getStatusStyle(stepStatus);

                        return (
                          <div
                            key={step.id}
                            className={`p-3.5 rounded-xl border bg-slate-50/80 dark:bg-slate-800/50 ${stepStyle.cardBorder} space-y-2`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                  {step.libelle}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  Deadline: {formatDateFr(step.deadline)} | Resp: {step.responsable}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stepStyle.badgeBg} self-start sm:self-center`}>
                                {stepStyle.label}
                              </span>
                            </div>

                            {/* Direct Slider */}
                            <div className="flex items-center space-x-3 pt-1">
                              <span className="text-xs text-slate-500 font-medium">Progression:</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={step.progression}
                                onChange={e =>
                                  updateStepProgress(act.id, step.id, Number(e.target.value))
                                }
                                className="flex-1 accent-rose-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                              />
                              <span className={`text-xs font-black ${stepStyle.textColor} min-w-[40px] text-right`}>
                                {step.progression}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
