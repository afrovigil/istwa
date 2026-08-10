import { Activity, ActivityCharacteristics, Partner, PartnerCharacteristics, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-bwaka',
    nom: 'Dr. Bwaka A.',
    mail: 'bwakaa@who.int',
    telephones: ['+242 06 11 22 33', '+221 77 000 11 22'],
    habilitation: 'administrateur',
  },
  {
    id: 'u-admin-agbenue',
    nom: 'Dr. Agbenue E.',
    mail: 'agbenue@who.int',
    telephones: ['+242 06 44 55 66'],
    habilitation: 'administrateur',
  },
  {
    id: 'u-admin-bukhari',
    nom: 'Dr. Bukhari M.',
    mail: 'bukharim@who.int',
    telephones: ['+242 06 77 88 99'],
    habilitation: 'administrateur',
  },
  {
    id: 'u-1',
    nom: 'Dr. Aminata Diallo',
    mail: 'aminata.diallo@istwa.org',
    telephones: ['+221 77 123 45 67', '+221 33 890 00 11'],
    habilitation: 'administrateur',
  },
  {
    id: 'u-2',
    nom: 'Moussa Camara',
    mail: 'moussa.camara@istwa.org',
    telephones: ['+221 78 456 78 90'],
    habilitation: 'moniteur',
  },
  {
    id: 'u-3',
    nom: 'Fatou Sow',
    mail: 'fatou.sow@istwa.org',
    telephones: ['+221 76 987 65 43'],
    habilitation: 'opérateur',
  },
  {
    id: 'u-4',
    nom: 'Jean-Luc Kaboré',
    mail: 'jeanluc.kabore@istwa.org',
    telephones: ['+226 70 11 22 33', '+226 25 30 40 50'],
    habilitation: 'moniteur',
  },
  {
    id: 'u-5',
    nom: 'Aïssatou Ndiaye',
    mail: 'aissatou.ndiaye@istwa.org',
    telephones: ['+221 77 555 12 34'],
    habilitation: 'opérateur',
  },
];

export const INITIAL_PARTNER_CHARACTERISTICS: PartnerCharacteristics = {
  types: [
    'Institutionnel',
    'Bailleur de fonds',
    'ONG Partenaire',
    'Secteur Privé',
    'Réseau Académique',
  ],
  niveaux: [
    'Stratégique',
    'Régional',
    'National',
    'Local',
    'International',
  ],
};

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'p-1',
    libelle: 'Ministère de l’Environnement et du Développement Durable',
    type: 'Institutionnel',
    niveau: 'National',
    superviseur: 'M. Cheikh Diop (Directeur Cabinet)',
    contacts: [
      {
        id: 'c-1',
        nom: 'Ousmane Ba',
        mail: 'oba@environnement.gouv.sn',
        telephone: '+221 33 821 00 00',
      },
      {
        id: 'c-2',
        nom: 'Mariama Traoré',
        mail: 'm.traore@environnement.gouv.sn',
        telephone: '+221 77 340 11 22',
      },
    ],
  },
  {
    id: 'p-2',
    libelle: 'Banque Africaine de Développement (BAD)',
    type: 'Bailleur de fonds',
    niveau: 'International',
    superviseur: 'Mme. Sylvie Kouassi (Chef de Projet)',
    contacts: [
      {
        id: 'c-3',
        nom: 'Pascal Mensah',
        mail: 'p.mensah@afdb.org',
        telephone: '+225 20 26 10 00',
      },
    ],
  },
  {
    id: 'p-3',
    libelle: 'WWF Afrique de l’Ouest',
    type: 'ONG Partenaire',
    niveau: 'Régional',
    superviseur: 'Dr. Ibrahim Traoré (Coordonnateur Régional)',
    contacts: [
      {
        id: 'c-4',
        nom: 'Marie Faye',
        mail: 'mfaye@wwfwestafrica.org',
        telephone: '+221 33 869 11 22',
      },
    ],
  },
];

export const INITIAL_ACTIVITY_CHARACTERISTICS: ActivityCharacteristics = {
  types: [
    'Atelier de Concertation',
    'Évaluation d\'impact',
    'Formation Technico-Opérationnelle',
    'Audit de Conformité',
    'Mobilisation des Ressources',
    'Mission de Terrain',
  ],
  pmds: [
    'PMDS-2026-A1 (Analyse & Diagnostic)',
    'PMDS-2026-B2 (Déploiement Opérationnel)',
    'PMDS-2026-C3 (Suivi & Évaluation)',
    'PMDS-2026-D4 (Capitalisation & Pérennisation)',
  ],
  planVpd: [
    'PlanVPD-AXE1 (Gouvernance & Synergies)',
    'PlanVPD-AXE2 (Infrastructures & Équipements)',
    'PlanVPD-AXE3 (Renforcement de Capacités)',
    'PlanVPD-AXE4 (Inclusion & Durabilité)',
  ],
  livrables: [
    'Rapport d\'analyse d\'impact',
    'Document de cadrage technique',
    'Guide méthodologique',
    'Procès-verbal de recette',
    'Tableau de bord de suivi',
  ],
  objectifs: [
    'Amélioration de la gouvernance sectorielle',
    'Renforcement des capacités opérationnelles',
    'Digitalisation des processus clés',
    'Optimisation des ressources financières',
    'Sécurisation des infrastructures',
  ],
  pmdsAssignments: {
    'PMDS-2026-A1 (Analyse & Diagnostic)': ['u-2', 'u-3'],
    'PMDS-2026-B2 (Déploiement Opérationnel)': ['u-2'],
    'PMDS-2026-C3 (Suivi & Évaluation)': ['u-3'],
  },
  planVpdAssignments: {
    'PlanVPD-AXE1 (Gouvernance & Synergies)': ['u-2'],
    'PlanVPD-AXE2 (Infrastructures & Équipements)': ['u-3'],
    'PlanVPD-AXE3 (Renforcement de Capacités)': ['u-2', 'u-3'],
  },
};

function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    libelle: 'Atelier régional de cadrage stratégique de l\'équipe ISTWA',
    type: 'Atelier de Concertation',
    pmds: 'PMDS-2026-A1 (Analyse & Diagnostic)',
    planVpd: 'PlanVPD-AXE1 (Gouvernance & Synergies)',
    livrable: 'Document de cadrage technique',
    objectif: 'Amélioration de la gouvernance sectorielle',
    deadline: getRelativeDate(4), // Due in 4 days (orange)
    partenaires: ['p-1', 'p-2'],
    responsables: 'u-2', // Moussa Camara
    urgent: 'Oui',
    createdAt: getRelativeDate(-15),
    etapes: [
      {
        id: 'step-1-1',
        libelle: 'Élaboration des Termes de Référence (TDR) et validation par le comité',
        deadline: getRelativeDate(-5),
        responsable: 'Moussa Camara',
        commentaire: 'TDR validés lors de la réunion de coordination du 2.',
        progression: 100,
      },
      {
        id: 'step-1-2',
        libelle: 'Envoi des invitations officielles aux partenaires stratégiques',
        deadline: getRelativeDate(1),
        responsable: 'Moussa Camara',
        commentaire: 'Invitations lancées pour 85% des structures cibles.',
        progression: 80,
      },
      {
        id: 'step-1-3',
        libelle: 'Préparation des kits de travail et réservation de la salle',
        deadline: getRelativeDate(4),
        responsable: 'Fatou Sow',
        commentaire: 'Attente de confirmation du devis d\'hébergement.',
        progression: 40,
      },
    ],
  },
  {
    id: 'act-2',
    libelle: 'Formation des opérateurs régionaux sur la plateforme ISTWAMONITOR',
    type: 'Formation Technico-Opérationnelle',
    pmds: 'PMDS-2026-B2 (Déploiement Opérationnel)',
    planVpd: 'PlanVPD-AXE3 (Renforcement de Capacités)',
    livrable: 'Guide méthodologique',
    objectif: 'Renforcement des capacités opérationnelles',
    deadline: getRelativeDate(-3), // Overdue by 3 days (red)
    partenaires: ['p-3'],
    responsables: 'u-3', // Fatou Sow
    urgent: 'Oui',
    createdAt: getRelativeDate(-20),
    etapes: [
      {
        id: 'step-2-1',
        libelle: 'Rédaction du manuel d\'utilisation et des fiches guidées',
        deadline: getRelativeDate(-10),
        responsable: 'Fatou Sow',
        commentaire: 'Manuel finalisé en version PDF interactif.',
        progression: 100,
      },
      {
        id: 'step-2-2',
        libelle: 'Animation des sessions pratiques en visioconférence',
        deadline: getRelativeDate(-3),
        responsable: 'Fatou Sow',
        commentaire: 'Session reportée en raison d\'indisponibilités du réseau local.',
        progression: 30,
      },
    ],
  },
  {
    id: 'act-3',
    libelle: 'Audit de conformité environnementale des infrastructures partenaires',
    type: 'Audit de Conformité',
    pmds: 'PMDS-2026-C3 (Suivi & Évaluation)',
    planVpd: 'PlanVPD-AXE2 (Infrastructures & Équipements)',
    deadline: getRelativeDate(25), // Normal future
    partenaires: ['p-1'],
    responsables: 'u-4', // Jean-Luc Kaboré
    urgent: 'Non',
    createdAt: getRelativeDate(-10),
    etapes: [
      {
        id: 'step-3-1',
        libelle: 'Collecte et vérification des grilles d\'évaluation d\'impact',
        deadline: getRelativeDate(10),
        responsable: 'Jean-Luc Kaboré',
        commentaire: 'Toutes les fiches reçues sans réserve.',
        progression: 100,
      },
      {
        id: 'step-3-2',
        libelle: 'Visite de vérification sur site des 3 stations principales',
        deadline: getRelativeDate(25),
        responsable: 'Jean-Luc Kaboré',
        commentaire: 'Mission planifiée en concertation avec le Ministère.',
        progression: 100,
      },
    ],
  },
  {
    id: 'act-4',
    libelle: 'Mise en place du réseau de capteurs et télémesures en zones critiques',
    type: 'Évaluation d\'impact',
    pmds: 'PMDS-2026-B2 (Déploiement Opérationnel)',
    planVpd: 'PlanVPD-AXE2 (Infrastructures & Équipements)',
    deadline: getRelativeDate(-5), // Overdue by 5 days (red)
    partenaires: ['p-2', 'p-3'],
    responsables: 'u-5', // Aïssatou Ndiaye
    urgent: 'Non',
    createdAt: getRelativeDate(-30),
    etapes: [
      {
        id: 'step-4-1',
        libelle: 'Réception et étalonnage en laboratoire des capteurs IoT',
        deadline: getRelativeDate(-12),
        responsable: 'Aïssatou Ndiaye',
        commentaire: 'Test de précision satisfaisant à 99%.',
        progression: 100,
      },
      {
        id: 'step-4-2',
        libelle: 'Installation physique des boîtiers d\'acquisition sur le terrain',
        deadline: getRelativeDate(-5),
        responsable: 'Aïssatou Ndiaye',
        commentaire: 'Retard de livraison du matériel complémentaire.',
        progression: 25,
      },
    ],
  },
];
