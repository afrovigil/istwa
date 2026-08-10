import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_ACTIVITIES,
  INITIAL_ACTIVITY_CHARACTERISTICS,
  INITIAL_PARTNER_CHARACTERISTICS,
  INITIAL_PARTNERS,
  INITIAL_USERS,
} from '../data/initialData';
import {
  Activity,
  ActivityCharacteristics,
  ActivityStep,
  FilterState,
  Habilitation,
  Partner,
  PartnerCharacteristics,
  StatusCategory,
  User,
} from '../types';
import { getActivityProgress, getItemDeadlineStatus } from '../utils/helpers';
import { downloadDatabaseJSON, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  adminSubTab: string;
  setAdminSubTab: (subTab: string) => void;

  // Auth & Session
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalNotice: string;
  promptAuth: (notice?: string) => void;
  loginWithEmail: (email: string, pass: string) => { success: boolean; message?: string };
  registerAccount: (data: { nom: string; mail: string; pass: string; telephone?: string; habilitation?: Habilitation }) => { success: boolean; message?: string };
  registerInitialPassword: (email: string, newPass: string) => { success: boolean; message?: string };
  requestPasswordReset: (email: string) => { success: boolean; message?: string; recoveryCode?: string };
  resetPasswordWithCode: (email: string, code: string, newPass: string) => { success: boolean; message?: string };
  logout: () => void;

  // Data Export & Import
  exportFullDatabase: () => void;
  importFullDatabase: (jsonString: string) => { success: boolean; message?: string };
  realtimeConnected: boolean;

  // Data
  users: User[];
  partners: Partner[];
  activityCharacteristics: ActivityCharacteristics;
  partnerCharacteristics: PartnerCharacteristics;
  activities: Activity[];

  // User CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  pendingUsersCount: number;

  // Partner CRUD
  addPartner: (partner: Omit<Partner, 'id'>) => void;
  updatePartner: (partner: Partner) => void;
  deletePartner: (id: string) => void;

  // Activity Characteristics management
  addActivityCharItem: (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', value: string) => void;
  bulkAddActivityCharItems: (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', values: string[]) => void;
  removeActivityCharItem: (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', value: string) => void;
  assignOperatorToPmds: (pmds: string, operatorIds: string[]) => void;
  assignOperatorToPlanVpd: (planVpd: string, operatorIds: string[]) => void;

  // Partner Characteristics management
  addPartnerCharItem: (category: 'types' | 'niveaux', value: string) => void;
  removePartnerCharItem: (category: 'types' | 'niveaux', value: string) => void;

  // Activity CRUD
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'etapes'>) => void;
  updateActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;

  // Step CRUD & Progress Update
  addStepToActivity: (activityId: string, step: Omit<ActivityStep, 'id'>) => void;
  updateStepProgress: (activityId: string, stepId: string, progression: number) => void;
  deleteStepFromActivity: (activityId: string, stepId: string) => void;

  // Search & Filter
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  applyMetricFilter: (category: StatusCategory, targetType: 'activity' | 'step', urgentOnly?: boolean) => void;

  // Demo Reset
  resetToDemoData: () => void;

  // Critical delay notifications count & list
  criticalAlerts: { id: string; title: string; type: 'activity' | 'step'; deadline: string; responsable: string; days: number }[];
}

const STORAGE_KEYS = {
  USERS: 'istwa_users',
  PARTNERS: 'istwa_partners',
  ACT_CHARS: 'istwa_act_chars',
  PART_CHARS: 'istwa_part_chars',
  ACTIVITIES: 'istwa_activities',
  CURRENT_USER: 'istwa_current_user',
  PASSWORDS: 'istwa_user_passwords',
  RECOVERY_CODES: 'istwa_recovery_codes',
};

const DEFAULT_FILTER_STATE: FilterState = {
  responsables: [],
  pmds: [],
  planVpd: [],
  types: [],
  partenaires: [],
  livrables: [],
  objectifs: [],
  deadlineStatus: 'all',
  urgentOnly: false,
  metricCategory: null,
  metricType: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const safeGetStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.warn(`Failed to read/parse localStorage key "${key}":`, err);
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start on 'dashboard' in public mode by default
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [adminSubTab, setAdminSubTab] = useState<string>('users');

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return safeGetStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  });

  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {
      'bwakaa@who.int': 'admin123',
      'agbenue@who.int': 'admin123',
      'bukharim@who.int': 'admin123',
      'jeanpaul.istwa@org.fr': 'admin123',
      'aminata.diallo@istwa.org': 'admin123',
      'moussa.camara@istwa.org': 'user123',
      'fatou.sow@istwa.org': 'user123',
      'jeanluc.kabore@istwa.org': 'user123',
      'aissatou.ndiaye@istwa.org': 'user123',
    };
    const parsed = safeGetStorage<Record<string, string> | null>(STORAGE_KEYS.PASSWORDS, null);
    if (!parsed) return defaults;
    return { ...defaults, ...parsed };
  });

  const [recoveryCodes, setRecoveryCodes] = useState<Record<string, string>>(() => {
    return safeGetStorage<Record<string, string>>(STORAGE_KEYS.RECOVERY_CODES, {});
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalNotice, setAuthModalNotice] = useState('');

  // Data States
  const [users, setUsers] = useState<User[]>(() => {
    const userList: User[] = safeGetStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);

    // Ensure mandatory default WHO admins are always present in users array
    const requiredWhoAdmins: User[] = [
      { id: 'u-admin-bwaka', nom: 'Dr. Bwaka A.', mail: 'bwakaa@who.int', telephones: ['+242 06 11 22 33'], habilitation: 'administrateur' },
      { id: 'u-admin-agbenue', nom: 'Dr. Agbenue E.', mail: 'agbenue@who.int', telephones: ['+242 06 44 55 66'], habilitation: 'administrateur' },
      { id: 'u-admin-bukhari', nom: 'Dr. Bukhari M.', mail: 'bukharim@who.int', telephones: ['+242 06 77 88 99'], habilitation: 'administrateur' },
    ];

    const updatedList = [...userList];
    requiredWhoAdmins.forEach(admin => {
      const idx = updatedList.findIndex(u => u.mail.toLowerCase() === admin.mail.toLowerCase());
      if (idx === -1) {
        updatedList.unshift(admin);
      } else {
        updatedList[idx] = { ...updatedList[idx], habilitation: 'administrateur' };
      }
    });

    return updatedList;
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    return safeGetStorage<Partner[]>(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);
  });

  const [activityCharacteristics, setActivityCharacteristics] = useState<ActivityCharacteristics>(() => {
    const saved = safeGetStorage<ActivityCharacteristics>(STORAGE_KEYS.ACT_CHARS, INITIAL_ACTIVITY_CHARACTERISTICS);
    return {
      types: saved.types && saved.types.length > 0 ? saved.types : INITIAL_ACTIVITY_CHARACTERISTICS.types,
      pmds: saved.pmds && saved.pmds.length > 0 ? saved.pmds : INITIAL_ACTIVITY_CHARACTERISTICS.pmds,
      planVpd: saved.planVpd && saved.planVpd.length > 0 ? saved.planVpd : INITIAL_ACTIVITY_CHARACTERISTICS.planVpd,
      livrables: saved.livrables && saved.livrables.length > 0 ? saved.livrables : INITIAL_ACTIVITY_CHARACTERISTICS.livrables,
      objectifs: saved.objectifs && saved.objectifs.length > 0 ? saved.objectifs : INITIAL_ACTIVITY_CHARACTERISTICS.objectifs,
      pmdsAssignments: saved.pmdsAssignments || INITIAL_ACTIVITY_CHARACTERISTICS.pmdsAssignments || {},
      planVpdAssignments: saved.planVpdAssignments || INITIAL_ACTIVITY_CHARACTERISTICS.planVpdAssignments || {},
    };
  });

  const [partnerCharacteristics, setPartnerCharacteristics] = useState<PartnerCharacteristics>(() => {
    return safeGetStorage<PartnerCharacteristics>(STORAGE_KEYS.PART_CHARS, INITIAL_PARTNER_CHARACTERISTICS);
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    return safeGetStorage<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  });

  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(isSupabaseConfigured);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACT_CHARS, JSON.stringify(activityCharacteristics));
  }, [activityCharacteristics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PART_CHARS, JSON.stringify(partnerCharacteristics));
  }, [partnerCharacteristics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
  }, [passwords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECOVERY_CODES, JSON.stringify(recoveryCodes));
  }, [recoveryCodes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // Real-time synchronization across browser tabs via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('istwamonitor_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE') {
          const { newActivities, newUsers, newPartners, newActChars, newPartChars } = event.data;
          if (newActivities) setActivities(newActivities);
          if (newUsers) setUsers(newUsers);
          if (newPartners) setPartners(newPartners);
          if (newActChars) setActivityCharacteristics(newActChars);
          if (newPartChars) setPartnerCharacteristics(newPartChars);
        }
      };
    } catch {
      // BroadcastChannel optional fallback
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  // Broadcast function
  const broadcastUpdate = (
    newActs = activities,
    newUsrs = users,
    newPrts = partners,
    newAcCh = activityCharacteristics,
    newPtCh = partnerCharacteristics
  ) => {
    try {
      const channel = new BroadcastChannel('istwamonitor_sync');
      channel.postMessage({
        type: 'STATE_UPDATE',
        newActivities: newActs,
        newUsers: newUsrs,
        newPartners: newPrts,
        newActChars: newAcCh,
        newPartChars: newPtCh,
      });
      channel.close();
    } catch {
      // BroadcastChannel optional fallback
    }
  };

  // Auth Prompt helper
  const promptAuth = (notice?: string) => {
    setAuthModalNotice(
      notice ||
        'Pour accéder à cet onglet ou effectuer cette action, vous devez être connecté. Le Dashboard reste accessible librement.'
    );
    setIsAuthModalOpen(true);
  };

  // Controlled tab navigation: Only Dashboard is public without auth
  const setActiveTab = (tab: string) => {
    if (tab === 'dashboard') {
      setActiveTabState('dashboard');
      return;
    }

    if (!currentUser) {
      promptAuth(
        `Pour accéder à l'onglet "${
          tab === 'activities' ? 'Activités' : tab === 'urgencies' ? 'Urgences' : 'Administration'
        }", veuillez vous connecter à votre compte utilisateur.`
      );
      return;
    }

    setActiveTabState(tab);
  };

  // Auth Actions
  const loginWithEmail = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => (u.mail || (u as any).email || '').toLowerCase() === trimmedEmail);

    if (!foundUser) {
      return {
        success: false,
        message: 'Cette adresse e-mail n\'est pas enregistrée. Vous pouvez créer un compte directement en choisissant "Créer un compte".',
      };
    }

    const userStatus = foundUser.status || 'approuvé';
    if (userStatus === 'en_attente') {
      return {
        success: false,
        message: 'Votre compte a été créé avec succès, mais il est actuellement en attente d\'approbation par un administrateur. Vous recevrez l\'accès dès sa validation.',
      };
    }

    if (userStatus === 'rejeté') {
      return {
        success: false,
        message: 'Votre demande d\'accès au compte a été déclinée par un administrateur.',
      };
    }

    const savedPass = passwords[trimmedEmail];
    if (!savedPass) {
      return {
        success: false,
        message: 'Aucun mot de passe n\'a encore été défini pour cette adresse. Veuillez utiliser l\'option "Première connexion / Mot de passe perdu".',
      };
    }

    if (savedPass !== pass) {
      return {
        success: false,
        message: 'Mot de passe erroné.',
      };
    }

    setCurrentUser(foundUser);
    return { success: true };
  };

  const registerAccount = (data: { nom: string; mail: string; pass: string; telephone?: string; habilitation?: Habilitation }) => {
    const trimmedEmail = data.mail.trim().toLowerCase();
    const trimmedNom = data.nom.trim();
    const pass = data.pass.trim();

    if (!trimmedNom || !trimmedEmail || !pass) {
      return { success: false, message: 'Veuillez remplir tous les champs obligatoires (Nom, Email, Mot de passe).' };
    }

    const existingUser = users.find(u => (u.mail || (u as any).email || '').toLowerCase() === trimmedEmail);
    if (existingUser) {
      return { success: false, message: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.' };
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      nom: trimmedNom,
      mail: trimmedEmail,
      telephones: data.telephone?.trim() ? [data.telephone.trim()] : [],
      habilitation: data.habilitation || 'opérateur',
      status: 'en_attente', // REQUIRES ADMIN APPROVAL
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setPasswords(prev => ({
      ...prev,
      [trimmedEmail]: pass,
    }));

    if (isSupabaseConfigured && supabase) {
      supabase.from('users').insert({
        id: newUser.id,
        nom: newUser.nom,
        mail: newUser.mail,
        telephones: newUser.telephones,
        habilitation: newUser.habilitation,
        status: newUser.status,
      }).then(({ error }) => {
        if (error) console.warn('Supabase user insert error:', error);
      });
    }

    broadcastUpdate(activities, updatedUsers);

    return {
      success: true,
      message: 'Votre compte a été créé avec succès ! Il est actuellement en attente d\'approbation par un administrateur. L\'administrateur validera votre accès sous peu.',
    };
  };

  const registerInitialPassword = (email: string, newPass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => (u.mail || (u as any).email || '').toLowerCase() === trimmedEmail);

    if (!foundUser) {
      return {
        success: false,
        message: 'Cette adresse mail n\'existe pas dans le système. Vous pouvez créer un compte via l\'onglet "Créer un compte".',
      };
    }

    setPasswords(prev => ({
      ...prev,
      [trimmedEmail]: newPass,
    }));

    setCurrentUser(foundUser);
    return {
      success: true,
      message: 'Mot de passe configuré avec succès ! Connexion automatique en cours...',
    };
  };

  const requestPasswordReset = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => (u.mail || (u as any).email || '').toLowerCase() === trimmedEmail);

    if (!foundUser) {
      return {
        success: false,
        message: 'Aucun compte associé à ce courriel.',
      };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRecoveryCodes(prev => ({
      ...prev,
      [trimmedEmail]: code,
    }));

    // If Supabase is connected, invoke Supabase password reset
    if (supabase) {
      supabase.auth.resetPasswordForEmail(trimmedEmail).catch(() => {});
    }

    return {
      success: true,
      message: `Un lien/code de réinitialisation a été généré pour ${foundUser.nom}.`,
      recoveryCode: code,
    };
  };

  const resetPasswordWithCode = (email: string, code: string, newPass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const validCode = recoveryCodes[trimmedEmail];

    if (!validCode || validCode !== code.trim()) {
      return {
        success: false,
        message: 'Code de récupération incorrect ou expiré.',
      };
    }

    setPasswords(prev => ({
      ...prev,
      [trimmedEmail]: newPass,
    }));

    const foundUser = users.find(u => (u.mail || (u as any).email || '').toLowerCase() === trimmedEmail);
    if (foundUser) {
      setCurrentUser(foundUser);
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTabState('dashboard');
  };

  // Database Export & Import
  const exportFullDatabase = () => {
    const dbState = {
      users,
      partners,
      activityCharacteristics,
      partnerCharacteristics,
      activities,
      passwords,
    };
    downloadDatabaseJSON(dbState);
  };

  const importFullDatabase = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;

      if (data.users) setUsers(data.users);
      if (data.partners) setPartners(data.partners);
      if (data.activityCharacteristics) setActivityCharacteristics(data.activityCharacteristics);
      if (data.partnerCharacteristics) setPartnerCharacteristics(data.partnerCharacteristics);
      if (data.activities) setActivities(data.activities);
      if (data.passwords) setPasswords(data.passwords);

      broadcastUpdate(
        data.activities || activities,
        data.users || users,
        data.partners || partners,
        data.activityCharacteristics || activityCharacteristics,
        data.partnerCharacteristics || partnerCharacteristics
      );

      return { success: true, message: 'Base de données restaurée avec succès !' };
    } catch {
      return { success: false, message: 'Fichier JSON invalide ou corrompu.' };
    }
  };

  // User Actions
  const addUser = (userData: Omit<User, 'id'>) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour ajouter un utilisateur.');
      return;
    }
    const newUser: User = {
      ...userData,
      status: userData.status || 'approuvé',
      id: `u-${Date.now()}`,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    broadcastUpdate(activities, updatedUsers);
  };

  const approveUser = (userId: string) => {
    const updatedUsers = users.map(u => (u.id === userId ? { ...u, status: 'approuvé' as const } : u));
    setUsers(updatedUsers);
    broadcastUpdate(activities, updatedUsers);
  };

  const rejectUser = (userId: string) => {
    const updatedUsers = users.map(u => (u.id === userId ? { ...u, status: 'rejeté' as const } : u));
    setUsers(updatedUsers);
    broadcastUpdate(activities, updatedUsers);
  };

  const pendingUsersCount = users.filter(u => u.status === 'en_attente').length;

  const updateUser = (updated: User) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier un utilisateur.');
      return;
    }
    const updatedUsers = users.map(u => (u.id === updated.id ? updated : u));
    setUsers(updatedUsers);
    broadcastUpdate(activities, updatedUsers);
  };

  const deleteUser = (id: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour supprimer un utilisateur.');
      return;
    }
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    broadcastUpdate(activities, updatedUsers);
  };

  // Partner Actions
  const addPartner = (partnerData: Omit<Partner, 'id'>) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour ajouter un partenaire.');
      return;
    }
    const newPartner: Partner = {
      ...partnerData,
      id: `p-${Date.now()}`,
    };
    const updatedPartners = [...partners, newPartner];
    setPartners(updatedPartners);
    broadcastUpdate(activities, users, updatedPartners);
  };

  const updatePartner = (updated: Partner) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier un partenaire.');
      return;
    }
    const updatedPartners = partners.map(p => (p.id === updated.id ? updated : p));
    setPartners(updatedPartners);
    broadcastUpdate(activities, users, updatedPartners);
  };

  const deletePartner = (id: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour supprimer un partenaire.');
      return;
    }
    const updatedPartners = partners.filter(p => p.id !== id);
    setPartners(updatedPartners);
    broadcastUpdate(activities, users, updatedPartners);
  };

  // Activity Characteristics
  const addActivityCharItem = (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', value: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier les caractéristiques.');
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    const currentCategoryList = activityCharacteristics[category] || [];
    const updatedChar = {
      ...activityCharacteristics,
      [category]: currentCategoryList.includes(trimmed)
        ? currentCategoryList
        : [...currentCategoryList, trimmed],
    };
    setActivityCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, updatedChar);
  };

  const bulkAddActivityCharItems = (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', values: string[]) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier les caractéristiques.');
      return;
    }
    const currentCategoryList = activityCharacteristics[category] || [];
    const newItems = values
      .map(v => v.trim())
      .filter(v => v.length > 0 && !currentCategoryList.includes(v));
    if (newItems.length === 0) return;
    const updatedChar = {
      ...activityCharacteristics,
      [category]: [...currentCategoryList, ...newItems],
    };
    setActivityCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, updatedChar);
  };

  const removeActivityCharItem = (category: 'types' | 'pmds' | 'planVpd' | 'livrables' | 'objectifs', value: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier les caractéristiques.');
      return;
    }
    const currentCategoryList = activityCharacteristics[category] || [];
    const updatedChar = {
      ...activityCharacteristics,
      [category]: currentCategoryList.filter(item => item !== value),
    };
    setActivityCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, updatedChar);
  };

  const assignOperatorToPmds = (pmds: string, operatorIds: string[]) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier l\'affectation.');
      return;
    }
    const updatedChar = {
      ...activityCharacteristics,
      pmdsAssignments: {
        ...(activityCharacteristics.pmdsAssignments || {}),
        [pmds]: operatorIds,
      },
    };
    setActivityCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, updatedChar);
  };

  const assignOperatorToPlanVpd = (planVpd: string, operatorIds: string[]) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier l\'affectation.');
      return;
    }
    const updatedChar = {
      ...activityCharacteristics,
      planVpdAssignments: {
        ...(activityCharacteristics.planVpdAssignments || {}),
        [planVpd]: operatorIds,
      },
    };
    setActivityCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, updatedChar);
  };

  // Partner Characteristics
  const addPartnerCharItem = (category: 'types' | 'niveaux', value: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier les caractéristiques.');
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    const updatedChar = {
      ...partnerCharacteristics,
      [category]: partnerCharacteristics[category].includes(trimmed)
        ? partnerCharacteristics[category]
        : [...partnerCharacteristics[category], trimmed],
    };
    setPartnerCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, activityCharacteristics, updatedChar);
  };

  const removePartnerCharItem = (category: 'types' | 'niveaux', value: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier les caractéristiques.');
      return;
    }
    const updatedChar = {
      ...partnerCharacteristics,
      [category]: partnerCharacteristics[category].filter(item => item !== value),
    };
    setPartnerCharacteristics(updatedChar);
    broadcastUpdate(activities, users, partners, activityCharacteristics, updatedChar);
  };

  // Activity Actions
  const addActivity = (actData: Omit<Activity, 'id' | 'createdAt' | 'etapes'>) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour créer une nouvelle activité.');
      return;
    }
    const newActivity: Activity = {
      ...actData,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      etapes: [],
    };
    const updatedActs = [newActivity, ...activities];
    setActivities(updatedActs);
    broadcastUpdate(updatedActs);
  };

  const updateActivity = (updated: Activity) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour modifier cette activité.');
      return;
    }
    const updatedActs = activities.map(a => (a.id === updated.id ? updated : a));
    setActivities(updatedActs);
    broadcastUpdate(updatedActs);
  };

  const deleteActivity = (id: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour supprimer cette activité.');
      return;
    }
    const updatedActs = activities.filter(a => a.id !== id);
    setActivities(updatedActs);
    broadcastUpdate(updatedActs);
  };

  // Step Actions
  const addStepToActivity = (activityId: string, stepData: Omit<ActivityStep, 'id'>) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour ajouter une étape.');
      return;
    }
    const newStep: ActivityStep = {
      ...stepData,
      id: `step-${Date.now()}`,
    };
    const updatedActs = activities.map(act => {
      if (act.id === activityId) {
        return {
          ...act,
          etapes: [...act.etapes, newStep],
        };
      }
      return act;
    });
    setActivities(updatedActs);
    broadcastUpdate(updatedActs);
  };

  const updateStepProgress = (activityId: string, stepId: string, progression: number) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour ajuster le niveau d\'avancement.');
      return;
    }
    const updatedActs = activities.map(act => {
      if (act.id === activityId) {
        const updatedSteps = act.etapes.map(step => {
          if (step.id === stepId) {
            return { ...step, progression: Math.min(100, Math.max(0, progression)) };
          }
          return step;
        });
        return {
          ...act,
          etapes: updatedSteps,
        };
      }
      return act;
    });
    setActivities(updatedActs);
    broadcastUpdate(updatedActs);
  };

  const deleteStepFromActivity = (activityId: string, stepId: string) => {
    if (!currentUser) {
      promptAuth('Veuillez vous connecter pour supprimer cette étape.');
      return;
    }
    const updatedActs = activities.map(act => {
      if (act.id === activityId) {
        return {
          ...act,
          etapes: act.etapes.filter(s => s.id !== stepId),
        };
      }
      return act;
    });
    setActivities(updatedActs);
    broadcastUpdate(updatedActs);
  };

  const resetFilters = () => {
    setFilterState(DEFAULT_FILTER_STATE);
  };

  const applyMetricFilter = (category: StatusCategory, targetType: 'activity' | 'step', urgentOnly = false) => {
    setFilterState(prev => ({
      ...prev,
      metricCategory: category,
      metricType: targetType,
      urgentOnly: urgentOnly,
    }));
  };

  const resetToDemoData = () => {
    setUsers(INITIAL_USERS);
    setPartners(INITIAL_PARTNERS);
    setActivityCharacteristics(INITIAL_ACTIVITY_CHARACTERISTICS);
    setPartnerCharacteristics(INITIAL_PARTNER_CHARACTERISTICS);
    setActivities(INITIAL_ACTIVITIES);
    setFilterState(DEFAULT_FILTER_STATE);
    localStorage.clear();
  };

  // Calculate critical delay alerts
  const criticalAlerts: { id: string; title: string; type: 'activity' | 'step'; deadline: string; responsable: string; days: number }[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  activities.forEach(act => {
    const actProg = getActivityProgress(act);
    const respUser = users.find(u => u.id === act.responsables)?.nom || act.responsables;
    const actStatus = getItemDeadlineStatus(act.deadline, actProg);

    if (actStatus === 'overdue' || actStatus === 'due_soon') {
      const d = new Date(act.deadline);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 2 || actStatus === 'overdue') {
        criticalAlerts.push({
          id: act.id,
          title: `[Activité] ${act.libelle}`,
          type: 'activity',
          deadline: act.deadline,
          responsable: respUser,
          days: diffDays,
        });
      }
    }

    act.etapes.forEach(step => {
      const stepStatus = getItemDeadlineStatus(step.deadline, step.progression);
      if (stepStatus === 'overdue' || stepStatus === 'due_soon') {
        const d = new Date(step.deadline);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 2 || stepStatus === 'overdue') {
          criticalAlerts.push({
            id: step.id,
            title: `[Étape] ${step.libelle} (${act.libelle})`,
            type: 'step',
            deadline: step.deadline,
            responsable: step.responsable,
            days: diffDays,
          });
        }
      }
    });
  });

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        adminSubTab,
        setAdminSubTab,
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalNotice,
        promptAuth,
        loginWithEmail,
        registerAccount,
        registerInitialPassword,
        requestPasswordReset,
        resetPasswordWithCode,
        logout,
        exportFullDatabase,
        importFullDatabase,
        realtimeConnected,
        users,
        partners,
        activityCharacteristics,
        partnerCharacteristics,
        activities,
        addUser,
        updateUser,
        deleteUser,
        approveUser,
        rejectUser,
        pendingUsersCount,
        addPartner,
        updatePartner,
        deletePartner,
        addActivityCharItem,
        bulkAddActivityCharItems,
        removeActivityCharItem,
        assignOperatorToPmds,
        assignOperatorToPlanVpd,
        addPartnerCharItem,
        removePartnerCharItem,
        addActivity,
        updateActivity,
        deleteActivity,
        addStepToActivity,
        updateStepProgress,
        deleteStepFromActivity,
        filterState,
        setFilterState,
        resetFilters,
        applyMetricFilter,
        resetToDemoData,
        criticalAlerts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
