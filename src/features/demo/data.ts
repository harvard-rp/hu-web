export const houses = [
  {
    id: 'adams',
    name: 'Adams',
    color: '#79283d',
    symbol: '✦',
    location: 'River Houses',
    traits: ['Créativité', 'Indépendance', 'Culture'],
    summary:
      'Dans la démo, Adams rassemble les esprits qui lancent un ciné-club après le dîner et accueillent les idées qui bousculent les habitudes.',
  },
  {
    id: 'cabot',
    name: 'Cabot',
    color: '#374d6a',
    symbol: '◇',
    location: 'Quad Houses',
    traits: ['Accueil', 'Entraide', 'Curiosité'],
    summary:
      'On imagine Cabot autour de longues tables, où une conversation commencée au café finit par devenir un projet partagé.',
  },
  {
    id: 'currier',
    name: 'Currier',
    color: '#356254',
    symbol: '✿',
    location: 'Quad Houses',
    traits: ['Écoute', 'Expression', 'Collectif'],
    summary:
      'Cette interprétation de Currier fait la part belle aux petites scènes et aux rendez-vous où chacun peut prendre la parole.',
  },
  {
    id: 'dunster',
    name: 'Dunster',
    color: '#8a5136',
    symbol: '✧',
    location: 'River Houses',
    traits: ['Énergie', 'Hospitalité', 'Initiative'],
    summary:
      'Dunster est ici une maison de rencontres spontanées, où un premier bonjour peut donner lieu à toute une soirée.',
  },
  {
    id: 'eliot',
    name: 'Eliot',
    color: '#525178',
    symbol: '△',
    location: 'River Houses',
    traits: ['Soin', 'Rigueur', 'Échange'],
    summary:
      'Dans le prototype, Eliot accueille les personnages qui aiment préparer les détails et donner du temps aux conversations de fond.',
  },
  {
    id: 'kirkland',
    name: 'Kirkland',
    color: '#6a493d',
    symbol: '✶',
    location: 'River Houses',
    traits: ['Théâtre', 'Improvisation', 'Amitié'],
    summary:
      'Kirkland sert de décor à des répétitions tardives, des projets improvisés et des rencontres autour de la scène.',
  },
  {
    id: 'leverett',
    name: 'Leverett',
    color: '#3f5b74',
    symbol: '⊹',
    location: 'River Houses',
    traits: ['Diversité', 'Élan', 'Ouverture'],
    summary:
      'La version RP de Leverett invite à croiser des parcours différents entre deux allées et à faire place aux nouvelles idées.',
  },
  {
    id: 'lowell',
    name: 'Lowell',
    color: '#4c4169',
    symbol: '❋',
    location: 'River Houses',
    traits: ['Traditions', 'Transmission', 'Dialogue'],
    summary:
      'Ce Lowell fictif privilégie les rendez-vous réguliers et les conversations où les histoires d’une promotion passent à la suivante.',
  },
  {
    id: 'mather',
    name: 'Mather',
    color: '#4a5b4a',
    symbol: '⬡',
    location: 'River Houses',
    traits: ['Fabrication', 'Ingéniosité', 'Partage'],
    summary:
      'On imagine à Mather des ateliers où l’on essaie, démonte et recommence ensemble, quelle que soit sa spécialité.',
  },
  {
    id: 'pforzheimer',
    name: 'Pforzheimer',
    color: '#705138',
    symbol: '◈',
    location: 'Quad Houses',
    traits: ['Curiosité', 'Esprit de groupe', 'Créativité'],
    summary:
      'Dans cette démo, Pforzheimer accueille des projets de voisinage qui naissent d’un détail remarqué au détour du Quad.',
  },
  {
    id: 'quincy',
    name: 'Quincy',
    color: '#815344',
    symbol: '✺',
    location: 'River Houses',
    traits: ['Convivialité', 'Organisation', 'Ouverture'],
    summary:
      'Notre Quincy fictif est une maison où l’on prépare les rencontres du campus et où les invitations circulent facilement.',
  },
  {
    id: 'winthrop',
    name: 'Winthrop',
    color: '#3b5963',
    symbol: '✷',
    location: 'River Houses',
    traits: ['Persévérance', 'Esprit d’équipe', 'Équilibre'],
    summary:
      'Winthrop est ici le point de départ de projets collectifs, des sorties au bord de l’eau aux rendez-vous de travail.',
  },
] as const;

export type HouseId = (typeof houses)[number]['id'];

export const majors = [
  'Droit',
  'Médecine',
  'Littérature',
  'Psychologie',
  'Sciences de l’ingénieur',
  'Informatique',
  'Biologie',
  'Architecture',
  'Art',
  'Sport',
  'Économie',
  'Sciences sociales',
  'Langues étrangères',
  'Cinéma',
  'Marketing',
] as const;

export type Character = {
  id: string;
  name: string;
  initials: string;
  house: HouseId;
  major: (typeof majors)[number];
  year: string;
  points: number;
  tone: string;
  bio: string;
};

export const characters: readonly Character[] = [
  {
    id: 'camille',
    name: 'Camille Delorme',
    initials: 'CD',
    house: 'adams',
    major: 'Littérature',
    year: '2e année',
    points: 840,
    tone: 'berry',
    bio: 'Camille tient un carnet d’observations sur le campus et espère un jour en faire un recueil. On la retrouve souvent près de la bibliothèque, avec un café trop froid et un livre de trop.',
  },
  {
    id: 'ambrose',
    name: 'Ambrose Vale',
    initials: 'AV',
    house: 'eliot',
    major: 'Droit',
    year: '3e année',
    points: 1280,
    tone: 'blue',
    bio: 'Ambrose aime les débats préparés et les promenades silencieuses près de la rivière.',
  },
  {
    id: 'nora',
    name: 'Nora Sorel',
    initials: 'NS',
    house: 'currier',
    major: 'Psychologie',
    year: '2e année',
    points: 1120,
    tone: 'green',
    bio: 'Nora organise des soirées de lecture à voix haute dans le Quad.',
  },
  {
    id: 'milo',
    name: 'Milo Ashford',
    initials: 'MA',
    house: 'quincy',
    major: 'Cinéma',
    year: '1re année',
    points: 970,
    tone: 'gold',
    bio: 'Milo collectionne les plans du campus à l’aube pour un court métrage fictif.',
  },
  {
    id: 'jules',
    name: 'Jules Mercier',
    initials: 'JM',
    house: 'mather',
    major: 'Sciences de l’ingénieur',
    year: '3e année',
    points: 760,
    tone: 'green',
    bio: 'Jules préfère un prototype fonctionnel à une présentation parfaite.',
  },
  {
    id: 'iris',
    name: 'Iris Bellamy',
    initials: 'IB',
    house: 'adams',
    major: 'Art',
    year: '2e année',
    points: 710,
    tone: 'gold',
    bio: 'Iris monte une exposition de croquis réalisés sous les arbres du campus.',
  },
  {
    id: 'alex',
    name: 'Alex Rowan',
    initials: 'AR',
    house: 'cabot',
    major: 'Biologie',
    year: '1re année',
    points: 650,
    tone: 'blue',
    bio: 'Alex arpente les serres et prête volontiers ses notes de terrain.',
  },
  {
    id: 'lea',
    name: 'Léa Wren',
    initials: 'LW',
    house: 'dunster',
    major: 'Sport',
    year: '2e année',
    points: 620,
    tone: 'berry',
    bio: 'Léa préfère les entraînements du matin et improvise les sorties du week-end.',
  },
  {
    id: 'ciel',
    name: 'Ciel Arden',
    initials: 'CA',
    house: 'kirkland',
    major: 'Langues étrangères',
    year: '1re année',
    points: 580,
    tone: 'gold',
    bio: 'Ciel prête sa voix à des lectures et à des répétitions en plusieurs langues.',
  },
  {
    id: 'remy',
    name: 'Rémy Locke',
    initials: 'RL',
    house: 'leverett',
    major: 'Marketing',
    year: '2e année',
    points: 560,
    tone: 'green',
    bio: 'Rémy conçoit des affiches pour les rencontres du campus fictif.',
  },
  {
    id: 'sasha',
    name: 'Sasha Grey',
    initials: 'SG',
    house: 'lowell',
    major: 'Sciences sociales',
    year: '3e année',
    points: 510,
    tone: 'berry',
    bio: 'Sasha recueille les récits de promotion pour un projet de mémoire.',
  },
  {
    id: 'manon',
    name: 'Manon Birch',
    initials: 'MB',
    house: 'pforzheimer',
    major: 'Architecture',
    year: '2e année',
    points: 490,
    tone: 'blue',
    bio: 'Manon esquisse les bancs et passages méconnus du Quad.',
  },
  {
    id: 'eden',
    name: 'Eden Frost',
    initials: 'EF',
    house: 'winthrop',
    major: 'Informatique',
    year: '1re année',
    points: 450,
    tone: 'green',
    bio: 'Eden construit des outils simples pour les projets collectifs.',
  },
];

export const student = characters[0]!;
export const findHouse = (id: string) =>
  houses.find((house) => house.id === id);
export const findCharacter = (id: string) =>
  characters.find((character) => character.id === id);
export const ranking = [...characters].sort((a, b) => b.points - a.points);

export const clubCategories = [
  'Sport',
  'Art et culture',
  'Académique',
  'Loisirs et organisation',
] as const;
type ClubCategory = (typeof clubCategories)[number];

type Club = {
  name: string;
  category: ClubCategory;
  description: string;
  members: number;
  leader?: string;
  capacity?: number;
  provenance: 'documented' | 'to-confirm' | 'sample';
  note?: string;
};

export const clubs: readonly Club[] = [
  {
    name: 'Natation',
    category: 'Sport',
    description:
      'Des créneaux en bassin pour travailler ses longueurs et rencontrer d’autres nageurs.',
    members: 7,
    provenance: 'documented',
    note: 'Type de responsable à confirmer. Les deux mentions de la source sont réunies ici.',
  },
  {
    name: 'Club de droit',
    category: 'Académique',
    description:
      'Un espace de discussion autour de cas fictifs et de débats argumentés.',
    members: 0,
    provenance: 'to-confirm',
    note: 'Présent uniquement dans les descriptions. Inscription au catalogue à confirmer.',
  },
  {
    name: 'BDE',
    category: 'Loisirs et organisation',
    description:
      'Une équipe qui propose des temps de rencontre et coordonne les initiatives étudiantes.',
    members: 8,
    capacity: 10,
    leader: 'Milo Ashford',
    provenance: 'documented',
  },
  {
    name: 'Atelier argentique',
    category: 'Art et culture',
    description:
      'Un petit laboratoire de regards sur le campus, du cadrage au tirage.',
    members: 9,
    leader: 'Iris Bellamy',
    provenance: 'sample',
  },
  {
    name: 'Cercle des carnets',
    category: 'Art et culture',
    description:
      'Un rendez-vous d’écriture pour échanger des fragments et des lectures.',
    members: 6,
    leader: 'Camille Delorme',
    provenance: 'sample',
  },
  {
    name: 'Observatoire du Quad',
    category: 'Académique',
    description:
      'Un groupe curieux qui prépare des observations et tient un journal du ciel.',
    members: 5,
    provenance: 'sample',
  },
  {
    name: 'Course du matin',
    category: 'Sport',
    description:
      'Des sorties conviviales en petit groupe, au rythme de chacun.',
    members: 11,
    leader: 'Léa Wren',
    provenance: 'sample',
  },
  {
    name: 'Table de jeux',
    category: 'Loisirs et organisation',
    description:
      'Des tables ouvertes pour découvrir un jeu et trouver de nouveaux partenaires.',
    members: 10,
    provenance: 'sample',
  },
];

export const announcements = [
  {
    title: 'La bibliothèque prolonge ses horaires',
    description:
      'La salle de lecture reste ouverte en soirée pendant la semaine des ateliers.',
    date: '16 novembre',
  },
  {
    title: 'Appel à contributions pour le journal',
    description:
      'La rédaction fictive recherche des chroniques de campus et des récits de personnages.',
    date: '14 novembre',
  },
];

export const events = [
  {
    id: 'reading',
    title: 'Veillée de lecture',
    month: 'NOV.',
    day: '20',
    datetime: '2026-11-20T18:30',
    time: '18 h 30',
    place: 'Bibliothèque · Salle de lecture',
    category: 'Culture',
    description: 'Chacun peut apporter un extrait à lire au groupe.',
  },
  {
    id: 'photo',
    title: 'Promenade argentique',
    month: 'NOV.',
    day: '22',
    datetime: '2026-11-22T15:00',
    time: '15 h 00',
    place: 'Le Quad · Allée centrale',
    category: 'Clubs',
    description:
      'Un itinéraire fictif pour capter les dernières couleurs de l’automne.',
  },
  {
    id: 'debate',
    title: 'Atelier d’éloquence',
    month: 'NOV.',
    day: '26',
    datetime: '2026-11-26T17:00',
    time: '17 h 00',
    place: 'Eliot House · Salon',
    category: 'Études',
    description: 'Un débat guidé à partir de situations entièrement fictives.',
  },
] as const;

export type DemoComment = { id: string; authorId: string; text: string };
export type DemoPost = {
  id: string;
  authorId: string;
  time: string;
  text: string;
  photo?: boolean;
  likes: number;
  comments: readonly DemoComment[];
};

export const initialPosts: readonly DemoPost[] = [
  {
    id: 'fall',
    authorId: 'iris',
    time: 'Il y a 2 h',
    text: 'Le campus a pris les couleurs de l’encre et du cuivre ce matin. J’ai presque fini la série de croquis pour l’atelier.',
    photo: true,
    likes: 18,
    comments: [
      {
        id: 'fall-1',
        authorId: 'camille',
        text: 'Garde-moi une place à l’atelier, je viendrai avec mon carnet.',
      },
    ],
  },
  {
    id: 'reading',
    authorId: 'nora',
    time: 'Hier',
    text: 'Je prépare la prochaine veillée de lecture. Cette fois, j’aimerais entendre des textes que personne n’a encore lus devant un public.',
    likes: 9,
    comments: [],
  },
];

export const relations = [
  {
    characterId: 'iris',
    kind: 'Amitié',
    note: 'Partagent un carnet de croquis et se retrouvent entre deux cours.',
  },
  {
    characterId: 'nora',
    kind: 'Collaboration',
    note: 'Préparent ensemble la prochaine veillée de lecture.',
  },
  {
    characterId: 'ambrose',
    kind: 'Rivalité amicale',
    note: 'Se défient régulièrement lors des débats de la bibliothèque.',
  },
] as const;

export type CharacterDraft = {
  name: string;
  profile: 'student' | 'non-student';
  identity: string;
  personality: string;
  appearance: string;
  faceClaim: string;
  major: string;
  majorProposal: string;
  academic: string;
  story: string;
  anecdotes: string;
  relations: string;
  warnings: string;
};

export type ReviewStatus = 'pending' | 'changes' | 'accepted' | 'rejected';
export type Review = {
  id: string;
  draft: CharacterDraft;
  status: ReviewStatus;
  house?: HouseId;
  note?: string;
};

export const emptyDraft: CharacterDraft = {
  name: '',
  profile: 'student',
  identity: '',
  personality: '',
  appearance: '',
  faceClaim: '',
  major: '',
  majorProposal: '',
  academic: '',
  story: '',
  anecdotes: '',
  relations: '',
  warnings: '',
};

export const initialReviews: readonly Review[] = [
  {
    id: 'review-alma',
    status: 'pending',
    draft: {
      ...emptyDraft,
      name: 'Alma Verdier',
      major: 'Architecture',
      personality: 'Observatrice et persévérante.',
      story:
        'Alma dessine les lieux qu’elle traverse pour apprendre à les connaître.',
    },
  },
  {
    id: 'review-soren',
    status: 'pending',
    draft: {
      ...emptyDraft,
      name: 'Soren Finch',
      profile: 'non-student',
      personality: 'Réservé et attentif.',
      story:
        'Soren participe à un collectif fictif qui aide à organiser les rencontres du quartier.',
    },
  },
];
