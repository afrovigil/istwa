export type Habilitation = 'opérateur' | 'moniteur' | 'administrateur';

export interface User {
  id: string;
  nom: string;
  mail: string; // Identifier
  telephones: string[]; // Multiple phone numbers
  habilitation: Habilitation;
  status?: 'approuvé' | 'en_attente' | 'rejeté';
}

export interface PartnerContact {
  id: string;
  nom: string;
  mail: string;
  telephone: string;
}

export interface Partner {
  id: string;
  libelle: string;
  type: string;
  niveau: string;
  superviseur: string;
  contacts: PartnerContact[];
}

export interface ActivityCharacteristics {
  types: string[];
  pmds: string[];
  planVpd: string[];
  livrables: string[];
  objectifs: string[];
  pmdsAssignments?: Record<string, string[]>; // PMDS string -> operator user IDs
  planVpdAssignments?: Record<string, string[]>; // PlanVPD string -> operator user IDs
}

export interface PartnerCharacteristics {
  types: string[];
  niveaux: string[];
}

export interface ActivityStep {
  id: string;
  libelle: string;
  deadline: string; // ISO date YYYY-MM-DD
  responsable: string; // User ID or name
  commentaire: string;
  progression: number; // 0 to 100
}

export interface Activity {
  id: string;
  libelle: string;
  type: string;
  pmds: string;
  planVpd: string;
  livrable?: string;
  objectif?: string;
  deadline: string; // ISO date YYYY-MM-DD
  partenaires: string[]; // Partner IDs
  responsables: string; // User ID
  urgent: 'Oui' | 'Non';
  etapes: ActivityStep[];
  createdAt: string;
}

export type StatusCategory = 'Total' | 'Démarré' | 'Complété' | 'En retard';

export interface FilterState {
  responsables: string[];
  pmds: string[];
  planVpd: string[];
  types: string[];
  partenaires: string[];
  livrables?: string[];
  objectifs?: string[];
  deadlineStatus: string; // 'all' | 'overdue' | 'due_soon' | 'completed'
  urgentOnly: boolean;
  metricCategory?: StatusCategory | null; // Selected from dashboard card click
  metricType?: 'activity' | 'step' | null;
}
