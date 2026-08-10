import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Habilitation, Partner, PartnerContact, User } from '../types';
import { isAuthorizedForDatabaseDownload } from '../utils/helpers';
import { getSupabaseSQLScript, isSupabaseConfigured } from '../lib/supabase';
import {
  Users,
  Building2,
  ListPlus,
  SlidersHorizontal,
  Plus,
  Trash2,
  Mail,
  Phone,
  Shield,
  UserPlus,
  Check,
  Search,
  Tag,
  Layers,
  FileCheck,
  Edit,
  X,
  Download,
  Upload,
  Database,
  Cloud,
  Copy,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Target,
  PackageCheck,
  UserCheck,
} from 'lucide-react';

interface CsvUploadButtonProps {
  category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs';
  categoryLabel: string;
  onImport: (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', label: string, items: string[]) => void;
}

const CsvUploadButton: React.FC<CsvUploadButtonProps> = ({ category, categoryLabel, onImport }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const items: string[] = [];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Split by comma, semicolon, or tab
        const cells = trimmedLine
          .split(/[,;\t]/)
          .map(cell => cell.replace(/^["']|["']$/g, '').trim())
          .filter(cell => cell.length > 0);

        cells.forEach(cell => {
          if (index === 0) {
            const lower = cell.toLowerCase();
            if (['type', 'types', 'pmds', 'planvpd', 'plan vpd', 'livrable', 'livrables', 'objectif', 'objectifs', 'nom', 'libelle', 'valeur', 'item', 'title'].includes(lower)) {
              return;
            }
          }
          items.push(cell);
        });
      });

      if (items.length > 0) {
        onImport(category, categoryLabel, items);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <label
      title={`Importer des éléments en masse depuis un fichier CSV (.csv, .txt) pour ${categoryLabel}`}
      className="cursor-pointer px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 border border-sky-200 dark:border-sky-800 transition-all shrink-0 ml-auto"
    >
      <Upload className="w-3 h-3" />
      <span>CSV</span>
      <input
        type="file"
        accept=".csv,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
};

export const AdminPage: React.FC = () => {
  const {
    adminSubTab,
    setAdminSubTab,
    users,
    addUser,
    deleteUser,
    approveUser,
    rejectUser,
    pendingUsersCount,
    partners,
    addPartner,
    deletePartner,
    activityCharacteristics,
    addActivityCharItem,
    bulkAddActivityCharItems,
    removeActivityCharItem,
    assignOperatorToPmds,
    assignOperatorToPlanVpd,
    partnerCharacteristics,
    addPartnerCharItem,
    removePartnerCharItem,
    exportFullDatabase,
    importFullDatabase,
    activities,
    currentUser,
  } = useApp();

  const [copiedSql, setCopiedSql] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSQLScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = importFullDatabase(content);
        setImportStatus(res.message || (res.success ? 'Importation réussie !' : 'Erreur'));
      }
    };
    reader.readAsText(file);
  };

  // --- Users State ---
  const [userNom, setUserNom] = useState('');
  const [userMail, setUserMail] = useState('');
  const [userHabilitation, setUserHabilitation] = useState<Habilitation>('opérateur');
  const [userPhones, setUserPhones] = useState<string[]>(['']);
  const [userSearch, setUserSearch] = useState('');

  const handleAddPhoneField = () => {
    setUserPhones([...userPhones, '']);
  };

  const handlePhoneChange = (index: number, val: string) => {
    const updated = [...userPhones];
    updated[index] = val;
    setUserPhones(updated);
  };

  const handleRemovePhoneField = (index: number) => {
    if (userPhones.length <= 1) return;
    setUserPhones(userPhones.filter((_, i) => i !== index));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNom.trim() || !userMail.trim()) {
      alert('Veuillez renseigner le nom et l’adresse email.');
      return;
    }

    const filteredPhones = userPhones.map(p => p.trim()).filter(Boolean);
    addUser({
      nom: userNom.trim(),
      mail: userMail.trim().toLowerCase(),
      telephones: filteredPhones.length > 0 ? filteredPhones : ['Non renseigné'],
      habilitation: userHabilitation,
    });

    // Reset Form
    setUserNom('');
    setUserMail('');
    setUserHabilitation('opérateur');
    setUserPhones(['']);
  };

  // --- Partners State ---
  const [partnerLibelle, setPartnerLibelle] = useState('');
  const [partnerType, setPartnerType] = useState(partnerCharacteristics.types[0] || '');
  const [partnerNiveau, setPartnerNiveau] = useState(partnerCharacteristics.niveaux[0] || '');
  const [partnerSuperviseur, setPartnerSuperviseur] = useState('');
  const [partnerContacts, setPartnerContacts] = useState<Omit<PartnerContact, 'id'>[]>([
    { nom: '', mail: '', telephone: '' },
  ]);
  const [partnerSearch, setPartnerSearch] = useState('');

  const handleAddContactField = () => {
    setPartnerContacts([...partnerContacts, { nom: '', mail: '', telephone: '' }]);
  };

  const handleContactChange = (index: number, field: keyof PartnerContact, val: string) => {
    const updated = [...partnerContacts];
    updated[index] = { ...updated[index], [field]: val };
    setPartnerContacts(updated);
  };

  const handleRemoveContactField = (index: number) => {
    if (partnerContacts.length <= 1) return;
    setPartnerContacts(partnerContacts.filter((_, i) => i !== index));
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerLibelle.trim()) {
      alert('Veuillez spécifier le libellé du partenaire.');
      return;
    }

    const validContacts: PartnerContact[] = partnerContacts
      .filter(c => c.nom.trim() || c.mail.trim() || c.telephone.trim())
      .map((c, idx) => ({
        id: `c-${Date.now()}-${idx}`,
        nom: c.nom.trim() || 'Contact sans nom',
        mail: c.mail.trim() || '-',
        telephone: c.telephone.trim() || '-',
      }));

    addPartner({
      libelle: partnerLibelle.trim(),
      type: partnerType || partnerCharacteristics.types[0] || 'Institutionnel',
      niveau: partnerNiveau || partnerCharacteristics.niveaux[0] || 'National',
      superviseur: partnerSuperviseur.trim() || 'Non spécifié',
      contacts: validContacts.length > 0 ? validContacts : [],
    });

    // Reset Partner Form
    setPartnerLibelle('');
    setPartnerSuperviseur('');
    setPartnerContacts([{ nom: '', mail: '', telephone: '' }]);
  };

  // --- Activity Characteristics Input State ---
  const [newActType, setNewActType] = useState('');
  const [newPmds, setNewPmds] = useState('');
  const [newPlanVpd, setNewPlanVpd] = useState('');
  const [newLivrable, setNewLivrable] = useState('');
  const [newObjectif, setNewObjectif] = useState('');
  const [assigningItem, setAssigningItem] = useState<{ category: 'pmds' | 'planVpd'; name: string } | null>(null);
  const [csvImportStatus, setCsvImportStatus] = useState<string | null>(null);

  const handleBulkCsvImport = (
    category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs',
    categoryLabel: string,
    items: string[]
  ) => {
    bulkAddActivityCharItems(category, items);
    setCsvImportStatus(`Import réussi : ${items.length} élément(s) extrait(s) et ajouté(s) dans "${categoryLabel}".`);
    setTimeout(() => setCsvImportStatus(null), 5000);
  };

  // --- Partner Characteristics Input State ---
  const [newPartnerType, setNewPartnerType] = useState('');
  const [newPartnerNiveau, setNewPartnerNiveau] = useState('');

  // --- User Filter State ---
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.nom.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.mail.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.habilitation.toLowerCase().includes(userSearch.toLowerCase());

    const status = u.status || 'approuvé';
    if (userStatusFilter === 'pending') return matchesSearch && status === 'en_attente';
    if (userStatusFilter === 'approved') return matchesSearch && status === 'approuvé';
    if (userStatusFilter === 'rejected') return matchesSearch && status === 'rejeté';
    return matchesSearch;
  });

  const filteredPartners = partners.filter(
    p =>
      p.libelle.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.type.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.niveau.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="crystal-banner rounded-2xl p-6 mb-8 text-slate-900 shadow-xl">
        <div className="flex items-center space-x-3.5 mb-2">
          <img
            src="./istwa.png"
            alt="ISTWA Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Espace d'Administration ISTWA</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E7FB8] text-white font-bold uppercase">
                ISTWAMONITOR
              </span>
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Gestion des comptes utilisateurs, habilitations, partenaires et référentiels du plan ISTWA
            </p>
          </div>
        </div>

        {/* Admin Sub-Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200/80 pt-4">
          <button
            onClick={() => setAdminSubTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              adminSubTab === 'users'
                ? 'bg-[#1E7FB8] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs & Habilitations</span>
            <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
              adminSubTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {users.length}
            </span>
            {pendingUsersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-slate-950 animate-pulse">
                {pendingUsersCount} en attente
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminSubTab('partners')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              adminSubTab === 'partners'
                ? 'bg-[#1E7FB8] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Partenaires & Contacts</span>
            <span className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
              adminSubTab === 'partners' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {partners.length}
            </span>
          </button>

          <button
            onClick={() => setAdminSubTab('activity_chars')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              adminSubTab === 'activity_chars'
                ? 'bg-[#1E7FB8] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Caractéristiques d’activités</span>
          </button>

          <button
            onClick={() => setAdminSubTab('partner_chars')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              adminSubTab === 'partner_chars'
                ? 'bg-[#1E7FB8] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Caractéristiques des partenaires</span>
          </button>

          <button
            onClick={() => setAdminSubTab('database')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              adminSubTab === 'database'
                ? 'bg-[#1E7FB8] text-white shadow-md'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-sky-500" />
            <span>Base de données & Sauvegardes</span>
          </button>

          <button
            onClick={() => setAdminSubTab('github_supabase')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              adminSubTab === 'github_supabase'
                ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/30'
                : 'bg-[#2d3628] text-[#c5d3b8] hover:bg-[#384333] hover:text-white border border-[#414e3b]'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Déploiement GitHub & Supabase</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: UTILISATEURS */}
      {adminSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Pending Users Alert Banner */}
          {pendingUsersCount > 0 && (
            <div className="lg:col-span-12 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    {pendingUsersCount} demande(s) de création de compte en attente d'approbation administrateur
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Toute personne peut créer un compte. Seul un administrateur peut valider l'accès pour autoriser la connexion.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserStatusFilter('pending')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 self-start sm:self-auto transition-colors"
              >
                Voir les demandes ({pendingUsersCount})
              </button>
            </div>
          )}

          {/* Create User Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <div className="flex items-center space-x-2 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <UserPlus className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Créer un utilisateur
              </h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Nom & Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={userNom}
                  onChange={e => setUserNom(e.target.value)}
                  placeholder="ex: Dr. Ousmane Sow"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Email (Identifiant principal) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={userMail}
                    onChange={e => setUserMail(e.target.value)}
                    placeholder="ousmane.sow@istwa.org"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Phone Numbers */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Téléphones (Champs multiples)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhoneField}
                    className="text-xs text-sky-600 font-semibold flex items-center space-x-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter numéro</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {userPhones.map((phone, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={phone}
                          onChange={e => handlePhoneChange(idx, e.target.value)}
                          placeholder="+221 77 000 00 00"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                      </div>
                      {userPhones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhoneField(idx)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Habilitation */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Habilitation
                </label>
                <select
                  value={userHabilitation}
                  onChange={e => setUserHabilitation(e.target.value as Habilitation)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="opérateur">Opérateur</option>
                  <option value="moniteur">Moniteur</option>
                  <option value="administrateur">Administrateur</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Les utilisateurs créés par l'administrateur sont directement approuvés.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-sm shadow-md shadow-[#1E7FB8]/30 flex items-center justify-center space-x-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enregistrer l'utilisateur</span>
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  Utilisateurs de l'Équipe ISTWA
                </h2>
                <p className="text-xs text-slate-500">
                  {users.length} utilisateur(s) enregistrés
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Rechercher utilisateur..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setUserStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  userStatusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous ({users.length})
              </button>

              <button
                type="button"
                onClick={() => setUserStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                  userStatusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <span>En attente</span>
                <span className="px-1.5 py-0.2 bg-amber-900 text-amber-100 text-[10px] rounded-full font-black">
                  {pendingUsersCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  userStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Approuvés ({users.filter(u => (u.status || 'approuvé') === 'approuvé').length})
              </button>

              <button
                type="button"
                onClick={() => setUserStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  userStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Refusés ({users.filter(u => u.status === 'rejeté').length})
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Aucun utilisateur ne correspond aux critères de recherche.
                </div>
              ) : (
                filteredUsers.map(u => {
                  const status = u.status || 'approuvé';
                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        status === 'en_attente'
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                          : status === 'rejeté'
                          ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-sky-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {u.nom}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              u.habilitation === 'administrateur'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : u.habilitation === 'moniteur'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {u.habilitation}
                          </span>

                          {status === 'en_attente' ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              ⏳ En attente de validation
                            </span>
                          ) : status === 'rejeté' ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                              ❌ Refusé
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✅ Approuvé
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.mail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.telephones.length > 0 ? u.telephones.join(', ') : 'Aucun téléphone'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 self-end sm:self-center">
                        {(status === 'en_attente' || status === 'rejeté') && (
                          <button
                            type="button"
                            onClick={() => approveUser(u.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-colors"
                            title="Approuver cet utilisateur"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approuver</span>
                          </button>
                        )}

                        {(status === 'en_attente' || status === 'approuvé') && (
                          <button
                            type="button"
                            onClick={() => rejectUser(u.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center space-x-1 transition-colors"
                            title="Refuser / Bloquer l'accès"
                          >
                            <X className="w-3.5 h-3.5 text-amber-800" />
                            <span>Refuser</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Supprimer définitivement l'utilisateur ${u.nom} ?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PARTENAIRES */}
      {adminSubTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Partner Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
            <div className="flex items-center space-x-2 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Créer un partenaire
              </h2>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Libellé de l'institution / partenaire <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={partnerLibelle}
                  onChange={e => setPartnerLibelle(e.target.value)}
                  placeholder="ex: Ministère de l'Environnement"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Type
                  </label>
                  <select
                    value={partnerType}
                    onChange={e => setPartnerType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {partnerCharacteristics.types.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Niveau
                  </label>
                  <select
                    value={partnerNiveau}
                    onChange={e => setPartnerNiveau(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {partnerCharacteristics.niveaux.map((n, idx) => (
                      <option key={idx} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Superviseur institutionnel
                </label>
                <input
                  type="text"
                  value={partnerSuperviseur}
                  onChange={e => setPartnerSuperviseur(e.target.value)}
                  placeholder="ex: Dr. Cheikh Diop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              {/* Dynamic Contacts section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Contacts Partenaire (Contacts multiples)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddContactField}
                    className="text-xs text-sky-600 font-semibold flex items-center space-x-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter contact</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {partnerContacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          Contact #{idx + 1}
                        </span>
                        {partnerContacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContactField(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={contact.nom}
                        onChange={e => handleContactChange(idx, 'nom', e.target.value)}
                        placeholder="Nom du contact"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          value={contact.mail}
                          onChange={e => handleContactChange(idx, 'mail', e.target.value)}
                          placeholder="Email"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={contact.telephone}
                          onChange={e => handleContactChange(idx, 'telephone', e.target.value)}
                          placeholder="Téléphone"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-sm shadow-md shadow-[#1E7FB8]/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>Enregistrer le partenaire</span>
              </button>
            </form>
          </div>

          {/* Partner List */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  Partenaires Répertoriés
                </h2>
                <p className="text-xs text-slate-500">
                  {partners.length} organisme(s) partenaire(s)
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={partnerSearch}
                  onChange={e => setPartnerSearch(e.target.value)}
                  placeholder="Rechercher partenaire..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredPartners.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Aucun partenaire enregistré.
                </div>
              ) : (
                filteredPartners.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-sky-300 dark:hover:border-sky-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          {p.libelle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                            Type: {p.type}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Niveau: {p.niveau}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Superviseur: <strong className="text-slate-700 dark:text-slate-300">{p.superviseur}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer le partenaire ${p.libelle} ?`)) {
                            deletePartner(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Supprimer le partenaire"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Contacts Table inside partner */}
                    {p.contacts && p.contacts.length > 0 && (
                      <div className="bg-white dark:bg-slate-900/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700/80 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase text-[10px] tracking-wider">
                          Contacts désignés ({p.contacts.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.contacts.map((c, idx) => (
                            <div
                              key={c.id || idx}
                              className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 space-y-0.5"
                            >
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {c.nom}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{c.mail}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{c.telephone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CARACTÉRISTIQUES D'ACTIVITÉS */}
      {adminSubTab === 'activity_chars' && (
        <div className="space-y-6">
          <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 text-xs text-sky-900 dark:text-sky-200 flex items-center space-x-3">
            <ListPlus className="w-5 h-5 flex-shrink-0 text-sky-600" />
            <p>
              Gérez les 5 listes de caractéristiques (Types, PMDS, Plan VPD, Livrables, Objectifs) et affectez des Opérateurs spécifiques aux rubriques PMDS et Plan VPD. <strong>Astuce :</strong> Utilisez le bouton <em>CSV</em> sur chaque rubrique pour ajouter des éléments en masse à partir d'un fichier CSV ou texte (1 ligne ou valeur séparée par virgule/point-virgule par élément).
            </p>
          </div>

          {csvImportStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{csvImportStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* List 1: Types d'activités */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                      Types d'activités ({activityCharacteristics.types.length})
                    </h3>
                  </div>
                  <CsvUploadButton
                    category="types"
                    categoryLabel="Types d'activités"
                    onImport={handleBulkCsvImport}
                  />
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                  {activityCharacteristics.types.map((type, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{type}</span>
                      <button
                        onClick={() => removeActivityCharItem('types', type)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newActType}
                  onChange={e => setNewActType(e.target.value)}
                  placeholder="Nouveau type..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addActivityCharItem('types', newActType);
                    setNewActType('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* List 2: PMDS (with Operator Assignment) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                      Liste PMDS ({activityCharacteristics.pmds.length})
                    </h3>
                  </div>
                  <CsvUploadButton
                    category="pmds"
                    categoryLabel="Rubriques PMDS"
                    onImport={handleBulkCsvImport}
                  />
                </div>

                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                  {activityCharacteristics.pmds.map((pmds, idx) => {
                    const assignedOpIds = activityCharacteristics.pmdsAssignments?.[pmds] || [];
                    const assignedUsers = users.filter(u => assignedOpIds.includes(u.id));

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{pmds}</span>
                          <button
                            onClick={() => removeActivityCharItem('pmds', pmds)}
                            className="text-slate-400 hover:text-rose-500 transition-colors ml-2"
                            title="Supprimer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Assigned operators preview & toggle button */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                            {assignedUsers.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">Tous opérateurs</span>
                            ) : (
                              assignedUsers.map(u => (
                                <span key={u.id} className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-semibold">
                                  {u.nom}
                                </span>
                              ))
                            )}
                          </div>
                          <button
                            onClick={() => setAssigningItem({ category: 'pmds', name: pmds })}
                            className="px-2 py-1 bg-sky-50 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 border border-sky-200 dark:border-sky-800 transition-all"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Opérateurs</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newPmds}
                  onChange={e => setNewPmds(e.target.value)}
                  placeholder="Nouveau PMDS..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addActivityCharItem('pmds', newPmds);
                    setNewPmds('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* List 3: PlanVPD (with Operator Assignment) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                      Liste PlanVPD ({activityCharacteristics.planVpd.length})
                    </h3>
                  </div>
                  <CsvUploadButton
                    category="planVpd"
                    categoryLabel="Rubriques PlanVPD"
                    onImport={handleBulkCsvImport}
                  />
                </div>

                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                  {activityCharacteristics.planVpd.map((plan, idx) => {
                    const assignedOpIds = activityCharacteristics.planVpdAssignments?.[plan] || [];
                    const assignedUsers = users.filter(u => assignedOpIds.includes(u.id));

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{plan}</span>
                          <button
                            onClick={() => removeActivityCharItem('planVpd', plan)}
                            className="text-slate-400 hover:text-rose-500 transition-colors ml-2"
                            title="Supprimer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Assigned operators preview & toggle button */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                            {assignedUsers.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">Tous opérateurs</span>
                            ) : (
                              assignedUsers.map(u => (
                                <span key={u.id} className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-semibold">
                                  {u.nom}
                                </span>
                              ))
                            )}
                          </div>
                          <button
                            onClick={() => setAssigningItem({ category: 'planVpd', name: plan })}
                            className="px-2 py-1 bg-sky-50 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 border border-sky-200 dark:border-sky-800 transition-all"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Opérateurs</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newPlanVpd}
                  onChange={e => setNewPlanVpd(e.target.value)}
                  placeholder="Nouveau PlanVPD..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addActivityCharItem('planVpd', newPlanVpd);
                    setNewPlanVpd('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* List 4: Livrables */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <PackageCheck className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                      Liste Livrables ({(activityCharacteristics.livrables || []).length})
                    </h3>
                  </div>
                  <CsvUploadButton
                    category="livrables"
                    categoryLabel="Livrables attendus"
                    onImport={handleBulkCsvImport}
                  />
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                  {(activityCharacteristics.livrables || []).map((liv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{liv}</span>
                      <button
                        onClick={() => removeActivityCharItem('livrables', liv)}
                        className="text-slate-400 hover:text-rose-500 transition-colors ml-2"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newLivrable}
                  onChange={e => setNewLivrable(e.target.value)}
                  placeholder="Nouveau Livrable..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addActivityCharItem('livrables', newLivrable);
                    setNewLivrable('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* List 5: Objectifs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                      Liste Objectifs ({(activityCharacteristics.objectifs || []).length})
                    </h3>
                  </div>
                  <CsvUploadButton
                    category="objectifs"
                    categoryLabel="Objectifs stratégiques"
                    onImport={handleBulkCsvImport}
                  />
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                  {(activityCharacteristics.objectifs || []).map((obj, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{obj}</span>
                      <button
                        onClick={() => removeActivityCharItem('objectifs', obj)}
                        className="text-slate-400 hover:text-rose-500 transition-colors ml-2"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newObjectif}
                  onChange={e => setNewObjectif(e.target.value)}
                  placeholder="Nouveau Objectif..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addActivityCharItem('objectifs', newObjectif);
                    setNewObjectif('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>

          {/* OPERATOR ASSIGNMENT MODAL FOR PMDS / PLANVPD */}
          {assigningItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      Affecter des Opérateurs
                    </h3>
                    <p className="text-xs text-sky-600 font-semibold truncate max-w-xs mt-0.5">
                      {assigningItem.category === 'pmds' ? 'PMDS: ' : 'Plan VPD: '}{assigningItem.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setAssigningItem(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Sélectionnez les opérateurs habilités à voir ou traiter cette rubrique lors de la création d'activités. Si aucun opérateur n'est sélectionné, la rubrique reste accessible à tous.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {users.map(u => {
                    const currentAssigned = assigningItem.category === 'pmds'
                      ? (activityCharacteristics.pmdsAssignments?.[assigningItem.name] || [])
                      : (activityCharacteristics.planVpdAssignments?.[assigningItem.name] || []);
                    const isChecked = currentAssigned.includes(u.id);

                    const toggleOperator = () => {
                      const updated = isChecked
                        ? currentAssigned.filter(id => id !== u.id)
                        : [...currentAssigned, u.id];
                      if (assigningItem.category === 'pmds') {
                        assignOperatorToPmds(assigningItem.name, updated);
                      } else {
                        assignOperatorToPlanVpd(assigningItem.name, updated);
                      }
                    };

                    return (
                      <div
                        key={u.id}
                        onClick={toggleOperator}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-sky-600" />
                          <div>
                            <p className="font-semibold">{u.nom}</p>
                            <p className="text-[10px] text-slate-400">{u.mail} • {u.habilitation}</p>
                          </div>
                        </div>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setAssigningItem(null)}
                    className="px-4 py-2 bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Terminer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: CARACTÉRISTIQUES DES PARTENAIRES */}
      {adminSubTab === 'partner_chars' && (
        <div className="space-y-6">
          <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 text-xs text-sky-900 dark:text-sky-200 flex items-center space-x-3">
            <Building2 className="w-5 h-5 flex-shrink-0 text-sky-600" />
            <p>
              Peuplez les deux listes indépendantes (Type et Niveau) définissant le profil et les rubriques des partenaires ISTWA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* List 1: Types de partenaires */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Tag className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                    Types de partenaires
                  </h3>
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                  {partnerCharacteristics.types.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{t}</span>
                      <button
                        onClick={() => removePartnerCharItem('types', t)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newPartnerType}
                  onChange={e => setNewPartnerType(e.target.value)}
                  placeholder="Nouveau type de partenaire..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addPartnerCharItem('types', newPartnerType);
                    setNewPartnerType('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* List 2: Niveaux de partenaires */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                    Niveaux de partenaires
                  </h3>
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                  {partnerCharacteristics.niveaux.map((n, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{n}</span>
                      <button
                        onClick={() => removePartnerCharItem('niveaux', n)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newPartnerNiveau}
                  onChange={e => setNewPartnerNiveau(e.target.value)}
                  placeholder="Nouveau niveau de partenaire..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    addPartnerCharItem('niveaux', newPartnerNiveau);
                    setNewPartnerNiveau('');
                  }}
                  className="px-3 py-1.5 bg-[#1E7FB8] hover:bg-[#186da0] text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: BASE DE DONNÉES & SAUVEGARDES */}
      {adminSubTab === 'database' && (
        <div className="space-y-6">
          <div className="crystal-banner p-6 rounded-2xl text-slate-900 shadow-xl space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src="./istwa.png"
                alt="ISTWA Logo"
                className="w-12 h-12 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-sm shrink-0"
              />
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Gestion & Exportation de la Base de Données ISTWAMONITOR
                </h2>
                <p className="text-xs text-slate-600">
                  Sauvegardez l'intégralité du système (activités, étapes, utilisateurs, partenaires, mots de passe) ou restaurez un état antérieur.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 text-center">
              <div className="crystal-card p-3 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold uppercase">Activités</div>
                <div className="text-xl font-black text-slate-900 mt-1">{activities.length}</div>
              </div>
              <div className="crystal-card p-3 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold uppercase">Utilisateurs</div>
                <div className="text-xl font-black text-slate-900 mt-1">{users.length}</div>
              </div>
              <div className="crystal-card p-3 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold uppercase">Partenaires</div>
                <div className="text-xl font-black text-slate-900 mt-1">{partners.length}</div>
              </div>
              <div className="crystal-card p-3 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-bold uppercase">Étapes Total</div>
                <div className="text-xl font-black text-sky-600 mt-1">
                  {activities.reduce((acc, a) => acc + a.etapes.length, 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <Download className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Télécharger toute la base de données
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Génère et télécharge immédiatement un fichier <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-600">.json</code> complet contenant toutes les données actuelles de l'application.
                </p>
              </div>

              {isAuthorizedForDatabaseDownload(currentUser) ? (
                <button
                  onClick={exportFullDatabase}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger la Base Complète (JSON)</span>
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Téléchargement réservé aux Administrateurs et Opérateurs.</span>
                </div>
              )}
            </div>

            {/* Import Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Restaurer une sauvegarde JSON
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Sélectionnez un fichier JSON de sauvegarde précédemment téléchargé pour réimporter et mettre à jour le système en temps réel.
                </p>

                {importStatus && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{importStatus}</span>
                  </div>
                )}
              </div>

              <label className="w-full cursor-pointer py-3.5 px-4 rounded-xl bg-[#1E7FB8] hover:bg-[#186da0] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Sélectionner le fichier JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: DÉPLOIEMENT GITHUB & SUPABASE */}
      {adminSubTab === 'github_supabase' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Déploiement GitHub & Supabase (Synchronisation Temps Réel)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Permet la synchronisation instantanée des données entre tous les utilisateurs de l'URL
                  </p>
                </div>
              </div>

              {isSupabaseConfigured ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 text-xs font-extrabold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Connecté à Supabase</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 text-xs font-bold">
                  Synchro locale active (Prêt pour Supabase)
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <p>
                L'application intègre le client Supabase et un canal de diffusion en temps réel. Pour connecter votre projet Supabase lors du déploiement GitHub :
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                <li>Créez un projet sur <strong>Supabase.com</strong>.</li>
                <li>Allez dans le <strong>SQL Editor</strong> de Supabase et collez le script DDL ci-dessous.</li>
                <li>
                  Définissez les variables d'environnement dans GitHub Actions / Vercel / Cloud Run :
                  <div className="my-1.5 font-mono text-[11px] bg-slate-950 text-indigo-300 p-2.5 rounded-xl border border-slate-800">
                    VITE_SUPABASE_URL="https://votre-projet.supabase.co"<br />
                    VITE_SUPABASE_ANON_KEY="votre-cle-anon-publique"
                  </div>
                </li>
              </ol>
            </div>

            {/* SQL Script Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">
                  Script de création des tables SQL Supabase
                </label>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-[#1E7FB8] hover:bg-[#186da0] text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copié !' : 'Copier le script SQL'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={getSupabaseSQLScript()}
                rows={12}
                className="w-full p-3 bg-slate-950 text-indigo-300 font-mono text-[11px] rounded-xl border border-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

