import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, ActivityStep } from '../types';
import {
  formatDateFr,
  getActivityProgress,
  getDaysRemaining,
  getItemDeadlineStatus,
  getStatusStyle,
} from '../utils/helpers';
import {
  Plus,
  Search,
  Filter,
  UserCheck,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Trash2,
  Calendar,
  Layers,
  MessageSquare,
  X,
  FileText,
  PackageCheck,
  Target,
  Users,
} from 'lucide-react';

export const ActivitiesPage: React.FC = () => {
  const {
    activities,
    addActivity,
    deleteActivity,
    addStepToActivity,
    updateStepProgress,
    deleteStepFromActivity,
    users,
    partners,
    activityCharacteristics,
    currentUser,
  } = useApp();

  // Create Activity Modal Toggle
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Activity Form Fields
  const [actLibelle, setActLibelle] = useState('');
  const [actType, setActType] = useState(activityCharacteristics.types[0] || '');
  const [actPmds, setActPmds] = useState(activityCharacteristics.pmds[0] || '');
  const [actPlanVpd, setActPlanVpd] = useState(activityCharacteristics.planVpd[0] || '');
  const [actLivrable, setActLivrable] = useState(activityCharacteristics.livrables?.[0] || '');
  const [actObjectif, setActObjectif] = useState(activityCharacteristics.objectifs?.[0] || '');
  const [selectedOperatorForModal, setSelectedOperatorForModal] = useState<string>('');
  const [actDeadline, setActDeadline] = useState('');
  const [actPartenaires, setActPartenaires] = useState<string[]>([]);
  const [actResponsables, setActResponsables] = useState<string>(users[0]?.id || '');
  const [actUrgent, setActUrgent] = useState<'Oui' | 'Non'>('Non');

  // Search & Filters in Activities view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterResponsable, setFilterResponsable] = useState('');
  const [filterUrgent, setFilterUrgent] = useState('');
  const [filterPmds, setFilterPmds] = useState('');
  const [filterPlanVpd, setFilterPlanVpd] = useState('');
  const [filterLivrable, setFilterLivrable] = useState('');
  const [filterObjectif, setFilterObjectif] = useState('');

  // Track Expanded Activity Card IDs
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // New Step Modal/Inline Form State per Activity
  const [addingStepForActId, setAddingStepForActId] = useState<string | null>(null);
  const [stepLibelle, setStepLibelle] = useState('');
  const [stepDeadline, setStepDeadline] = useState('');
  const [stepResponsable, setStepResponsable] = useState('');
  const [stepCommentaire, setStepCommentaire] = useState('');
  const [stepProgression, setStepProgression] = useState(0);

  const toggleExpandCard = (id: string) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Available PMDS and PlanVPD based on selected operator filter in creation modal
  const availablePmdsList = activityCharacteristics.pmds.filter(pmds => {
    if (!selectedOperatorForModal) return true;
    const assigned = activityCharacteristics.pmdsAssignments?.[pmds] || [];
    return assigned.length === 0 || assigned.includes(selectedOperatorForModal);
  });

  const availablePlanVpdList = activityCharacteristics.planVpd.filter(plan => {
    if (!selectedOperatorForModal) return true;
    const assigned = activityCharacteristics.planVpdAssignments?.[plan] || [];
    return assigned.length === 0 || assigned.includes(selectedOperatorForModal);
  });

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actLibelle.trim() || !actDeadline) {
      alert('Veuillez renseigner au moins le libellé et la date de deadline.');
      return;
    }

    addActivity({
      libelle: actLibelle.trim(),
      type: actType || activityCharacteristics.types[0] || 'Atelier',
      pmds: actPmds || availablePmdsList[0] || 'PMDS-1',
      planVpd: actPlanVpd || availablePlanVpdList[0] || 'PlanVPD-1',
      livrable: actLivrable || activityCharacteristics.livrables?.[0] || '',
      objectif: actObjectif || activityCharacteristics.objectifs?.[0] || '',
      deadline: actDeadline,
      partenaires: actPartenaires,
      responsables: actResponsables || users[0]?.id || 'u-1',
      urgent: actUrgent,
    });

    // Reset Form
    setActLibelle('');
    setActDeadline('');
    setActPartenaires([]);
    setActUrgent('Non');
    setShowCreateModal(false);
  };

  const handleCreateStep = (activityId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!stepLibelle.trim() || !stepDeadline) {
      alert('Veuillez renseigner le libellé et la deadline de l’étape.');
      return;
    }

    addStepToActivity(activityId, {
      libelle: stepLibelle.trim(),
      deadline: stepDeadline,
      responsable: stepResponsable.trim() || 'Non spécifié',
      commentaire: stepCommentaire.trim(),
      progression: stepProgression,
    });

    // Reset Step Form
    setAddingStepForActId(null);
    setStepLibelle('');
    setStepDeadline('');
    setStepResponsable('');
    setStepCommentaire('');
    setStepProgression(0);
  };

  const togglePartnerSelection = (partnerId: string) => {
    if (actPartenaires.includes(partnerId)) {
      setActPartenaires(actPartenaires.filter(id => id !== partnerId));
    } else {
      setActPartenaires([...actPartenaires, partnerId]);
    }
  };

  // Filter activities list
  const filteredActivities = activities.filter(act => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.libelle.toLowerCase().includes(q);
      const matchPmds = act.pmds.toLowerCase().includes(q);
      const matchType = act.type.toLowerCase().includes(q);
      const matchLivrable = act.livrable?.toLowerCase().includes(q);
      const matchObjectif = act.objectif?.toLowerCase().includes(q);
      if (!matchTitle && !matchPmds && !matchType && !matchLivrable && !matchObjectif) return false;
    }

    if (filterType && act.type !== filterType) return false;
    if (filterResponsable && act.responsables !== filterResponsable) return false;
    if (filterUrgent && act.urgent !== filterUrgent) return false;
    if (filterPmds && act.pmds !== filterPmds) return false;
    if (filterPlanVpd && act.planVpd !== filterPlanVpd) return false;
    if (filterLivrable && act.livrable !== filterLivrable) return false;
    if (filterObjectif && act.objectif !== filterObjectif) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="crystal-banner rounded-2xl p-6 text-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src="./istwa.png"
            alt="ISTWA Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
              <span>Gestion des Activités ISTWA</span>
              <span className="px-2.5 py-0.5 text-xs bg-[#1E7FB8] text-white rounded-full font-bold">
                {activities.length} au total
              </span>
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Visualisation en dalettes compactes. Cliquez sur une activité pour dérouler ses caractéristiques et ajuster le curseur de progression des étapes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-sm shadow-md flex items-center space-x-2 transition-all self-start md:self-auto shrink-0"
        >
          <Plus className="w-5 h-5 text-white" />
          <span>Nouvelle Activité</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par libellé, type, PMDS..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Tous les types</option>
            {activityCharacteristics.types.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterPmds}
            onChange={e => setFilterPmds(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Tous les PMDS</option>
            {activityCharacteristics.pmds.map((p, idx) => (
              <option key={idx} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterPlanVpd}
            onChange={e => setFilterPlanVpd(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Tous les PlanVPD</option>
            {activityCharacteristics.planVpd.map((p, idx) => (
              <option key={idx} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterLivrable}
            onChange={e => setFilterLivrable(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Tous les livrables</option>
            {(activityCharacteristics.livrables || []).map((liv, idx) => (
              <option key={idx} value={liv}>
                {liv}
              </option>
            ))}
          </select>

          <select
            value={filterObjectif}
            onChange={e => setFilterObjectif(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Tous les objectifs</option>
            {(activityCharacteristics.objectifs || []).map((obj, idx) => (
              <option key={idx} value={obj}>
                {obj}
              </option>
            ))}
          </select>

          <select
            value={filterResponsable}
            onChange={e => setFilterResponsable(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Tous les responsables</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>

          <select
            value={filterUrgent}
            onChange={e => setFilterUrgent(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none"
          >
            <option value="">Toute urgence</option>
            <option value="Oui">Urgent = Oui</option>
            <option value="Non">Urgent = Non</option>
          </select>
        </div>
      </div>

      {/* COMPACT DALELLES / CARDS GRID */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
          <h3 className="text-base font-semibold">Aucune activité enregistrée</h3>
          <p className="text-xs text-slate-400 mt-1">
            Cliquez sur "Nouvelle Activité" pour ajouter une tâche au plan ISTWA.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map(act => {
            const actProg = getActivityProgress(act);
            const status = getItemDeadlineStatus(act.deadline, actProg);
            const style = getStatusStyle(status);
            const daysRem = getDaysRemaining(act.deadline);

            const isExpanded = !!expandedCardIds[act.id];
            const respUser = users.find(u => u.id === act.responsables)?.nom || act.responsables;
            const assignedPartners = partners.filter(p => act.partenaires.includes(p.id));

            return (
              <div
                key={act.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${style.cardBorder}`}
              >
                {/* COMPACT VISIBLE HEADER (DALETTE COMPACTE) */}
                <div
                  onClick={() => toggleExpandCard(act.id)}
                  className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {/* Urgence Badge Fully Visible */}
                      {act.urgent === 'Oui' ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500 text-white shadow-xs flex items-center space-x-1 animate-pulse">
                          <Flame className="w-3 h-3" />
                          <span>URGENT: OUI</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border">
                          Urgent: Non
                        </span>
                      )}

                      {/* Status Badge Fully Visible */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${style.badgeBg}`}>
                        {style.label}
                      </span>

                      {/* Days countdown alert */}
                      {status !== 'completed' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          daysRem < 0 ? 'bg-rose-100 text-rose-800' : daysRem <= 7 ? 'bg-amber-100 text-amber-800' : 'text-slate-500'
                        }`}>
                          {daysRem < 0 ? `Échéance dépassée de ${Math.abs(daysRem)}j` : `J-${daysRem}`}
                        </span>
                      )}
                    </div>

                    {/* Libellé Fully Visible */}
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-snug">
                      {act.libelle}
                    </h3>

                    {/* Metadata line: Deadline & Responsable fully visible */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Deadline: <strong className="text-slate-900 dark:text-slate-100">{formatDateFr(act.deadline)}</strong></span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        <span>Responsable: <strong className="text-slate-900 dark:text-slate-100">{respUser}</strong></span>
                      </div>

                      <div className="flex items-center space-x-1 text-slate-500">
                        <span>{act.etapes.length} étape(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Expand toggle */}
                  <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right min-w-[120px]">
                      <div className="text-[11px] text-slate-500 font-semibold">Mise en œuvre</div>
                      <div className={`text-xl font-black ${style.textColor}`}>
                        {actProg}%
                      </div>
                      <div className="w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${style.barColor} transition-all duration-300`}
                          style={{ width: `${actProg}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT (DÉTAILS COMPLETS AU CLIC) */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-6">
                    {/* Activity Characteristics Summary Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Type d'activité</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">PMDS</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.pmds}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">PlanVPD</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.planVpd}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Livrable</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.livrable || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Objectif</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.objectif || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Partenaires Associés</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {assignedPartners.length === 0 ? (
                            <span className="text-slate-400">Aucun</span>
                          ) : (
                            assignedPartners.map(p => (
                              <span key={p.id} className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-medium">
                                {p.libelle}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STEPS LIST SECTION & PROGRESS SLIDERS */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-sky-600" />
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                            Étapes & Progression ({act.etapes.length})
                          </h4>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setAddingStepForActId(act.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Ajouter une étape</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Supprimer l'activité ${act.libelle} ?`)) {
                                deleteActivity(act.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 text-xs"
                            title="Supprimer cette activité"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Add Step Form inside Activity */}
                      {addingStepForActId === act.id && (
                        <form
                          onSubmit={e => handleCreateStep(act.id, e)}
                          className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-4 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase">
                              Nouvelle étape pour l'activité
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddingStepForActId(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={stepLibelle}
                              onChange={e => setStepLibelle(e.target.value)}
                              placeholder="Libellé de l'étape *"
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                              required
                            />
                            <input
                              type="date"
                              value={stepDeadline}
                              onChange={e => setStepDeadline(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                              required
                            />
                            <input
                              type="text"
                              value={stepResponsable}
                              onChange={e => setStepResponsable(e.target.value)}
                              placeholder="Responsable de l'étape"
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                            />
                            <input
                              type="text"
                              value={stepCommentaire}
                              onChange={e => setStepCommentaire(e.target.value)}
                              placeholder="Commentaire ou observation"
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                            />
                          </div>

                          <div className="flex items-center space-x-3 pt-1">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Progression initiale: {stepProgression}%
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={stepProgression}
                              onChange={e => setStepProgression(Number(e.target.value))}
                              className="flex-1 accent-sky-600"
                            />
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-lg bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs transition-all shadow-sm"
                            >
                              Enregistrer l'étape
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Steps List Items */}
                      {act.etapes.length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-center">
                          Aucune étape définie pour le moment. La progression de l'activité est à 0%.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {act.etapes.map(step => {
                            const stepStatus = getItemDeadlineStatus(step.deadline, step.progression);
                            const stepStyle = getStatusStyle(stepStatus);

                            return (
                              <div
                                key={step.id}
                                className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border ${stepStyle.cardBorder} space-y-2`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                        {step.libelle}
                                      </span>
                                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.2 rounded-full border ${stepStyle.badgeBg}`}>
                                        {stepStyle.label}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                                      <span>Deadline: <strong>{formatDateFr(step.deadline)}</strong></span>
                                      <span>Responsable: <strong>{step.responsable}</strong></span>
                                      {step.commentaire && (
                                        <span className="italic text-slate-400">"{step.commentaire}"</span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => deleteStepFromActivity(act.id, step.id)}
                                    className="text-slate-400 hover:text-rose-500 p-1 self-end sm:self-center"
                                    title="Supprimer l'étape"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* SLIDER DESK / CURSEUR DE PROGRESSION */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-4">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[70px]">
                                    Curseur:
                                  </span>

                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={step.progression}
                                    onChange={e =>
                                      updateStepProgress(act.id, step.id, Number(e.target.value))
                                    }
                                    className="flex-1 accent-sky-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                                  />

                                  <span className={`text-xs font-extrabold ${stepStyle.textColor} min-w-[45px] text-right`}>
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ACTIVITY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl text-slate-900 dark:text-slate-100 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-xl">Créer une nouvelle activité</h2>
                  <p className="text-xs text-slate-500">
                    Définissez le type, les attributs PMDS/PlanVPD, l'urgence et les intervenants.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              {/* Libellé */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Libellé de l'activité <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={actLibelle}
                  onChange={e => setActLibelle(e.target.value)}
                  placeholder="ex: Mission de suivi hydrologique sur le bassin versant"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Operator filter selector for PMDS and PlanVPD */}
              <div className="bg-sky-50/70 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center space-x-2 text-sky-900 dark:text-sky-200 font-semibold">
                  <Users className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Filtrer PMDS & PlanVPD par Opérateur :</span>
                </div>
                <select
                  value={selectedOperatorForModal}
                  onChange={e => setSelectedOperatorForModal(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs outline-none font-medium"
                >
                  <option value="">Tous les opérateurs (voir toutes les rubriques)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nom} ({u.habilitation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Type (Single-select from Admin activity characteristics) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Type d'activité
                  </label>
                  <select
                    value={actType}
                    onChange={e => setActType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  >
                    {activityCharacteristics.types.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PMDS (Single-select from Admin activity characteristics, filtered by operator) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Rubrique PMDS
                  </label>
                  <select
                    value={actPmds}
                    onChange={e => setActPmds(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  >
                    {availablePmdsList.length === 0 ? (
                      <option value="">Aucun PMDS affecté</option>
                    ) : (
                      availablePmdsList.map((pmds, idx) => (
                        <option key={idx} value={pmds}>
                          {pmds}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* PlanVPD (Single-select from Admin activity characteristics, filtered by operator) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    PlanVPD
                  </label>
                  <select
                    value={actPlanVpd}
                    onChange={e => setActPlanVpd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  >
                    {availablePlanVpdList.length === 0 ? (
                      <option value="">Aucun PlanVPD affecté</option>
                    ) : (
                      availablePlanVpdList.map((plan, idx) => (
                        <option key={idx} value={plan}>
                          {plan}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Livrables and Objectifs inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Livrable attendu
                  </label>
                  <select
                    value={actLivrable}
                    onChange={e => setActLivrable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  >
                    <option value="">-- Aucun livrable sélectionné --</option>
                    {(activityCharacteristics.livrables || []).map((liv, idx) => (
                      <option key={idx} value={liv}>
                        {liv}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Objectif stratégique
                  </label>
                  <select
                    value={actObjectif}
                    onChange={e => setActObjectif(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  >
                    <option value="">-- Aucun objectif sélectionné --</option>
                    {(activityCharacteristics.objectifs || []).map((obj, idx) => (
                      <option key={idx} value={obj}>
                        {obj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Deadline (Date d'échéance) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={actDeadline}
                    onChange={e => setActDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                {/* Responsable (Single-select from Users created in Admin) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Responsable unique (Utilisateur ISTWA)
                  </label>
                  <select
                    value={actResponsables}
                    onChange={e => setActResponsables(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nom} ({u.habilitation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urgence Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Caractéristique Urgence
                </label>
                <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="urgent"
                      value="Non"
                      checked={actUrgent === 'Non'}
                      onChange={() => setActUrgent('Non')}
                      className="accent-sky-600"
                    />
                    <span>Non (Activité Standard)</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer">
                    <input
                      type="radio"
                      name="urgent"
                      value="Oui"
                      checked={actUrgent === 'Oui'}
                      onChange={() => setActUrgent('Oui')}
                      className="accent-rose-600"
                    />
                    <span>Oui (Priorité Absolue / Urgent)</span>
                  </label>
                </div>
              </div>

              {/* Partenaires (Multi-select dropdown / check pills from Admin Partners) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Partenaires Associés (Choix multiple à partir des partenaires enregistrés)
                </label>

                {partners.length === 0 ? (
                  <p className="text-xs text-rose-500">
                    Aucun partenaire créé. Allez dans l'onglet Admin pour ajouter des partenaires.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {partners.map(p => {
                      const isSelected = actPartenaires.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePartnerSelection(p.id)}
                          className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-950 dark:text-sky-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{p.libelle}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 ml-1" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs shadow-md shadow-[#1E7FB8]/30 transition-all"
                >
                  Enregistrer l'Activité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
