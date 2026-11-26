export const houses = [
  {
    id: 'adams',
    name: 'Adams',
    color: '#8d384a',
    location: 'River Houses',
    traits: ['Créativité', 'Indépendance', 'Ouverture d’esprit'],
    summary:
      'Adams réunit des personnages créatifs et indépendants qui aiment échanger autour des arts, de la littérature, du cinéma, du théâtre ou de la musique.',
  },
  {
    id: 'cabot',
    name: 'Cabot',
    color: '#374d6a',
    location: 'Quad Houses',
  },
  {
    id: 'currier',
    name: 'Currier',
    color: '#356254',
    location: 'Quad Houses',
  },
  {
    id: 'dunster',
    name: 'Dunster',
    color: '#8a5136',
    location: 'River Houses',
  },
  {
    id: 'eliot',
    name: 'Eliot',
    color: '#525178',
    location: 'River Houses',
  },
  {
    id: 'kirkland',
    name: 'Kirkland',
    color: '#6a493d',
    location: 'River Houses',
  },
  {
    id: 'leverett',
    name: 'Leverett',
    color: '#3f5b74',
    location: 'River Houses',
  },
  {
    id: 'lowell',
    name: 'Lowell',
    color: '#4c4169',
    location: 'River Houses',
  },
  {
    id: 'mather',
    name: 'Mather',
    color: '#4a5b4a',
    location: 'River Houses',
  },
  {
    id: 'pforzheimer',
    name: 'Pforzheimer',
    color: '#705138',
    location: 'Quad Houses',
  },
  {
    id: 'quincy',
    name: 'Quincy',
    color: '#815344',
    location: 'River Houses',
  },
  {
    id: 'winthrop',
    name: 'Winthrop',
    color: '#3b5963',
    location: 'River Houses',
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
    bio: 'Camille étudie la littérature. Elle écrit des nouvelles et aide Nora à organiser les soirées de lecture. Elle travaille souvent à la bibliothèque avec Iris.',
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
    bio: 'Ambrose étudie le droit et participe aux ateliers d’éloquence. Il retrouve souvent Camille à la bibliothèque pour préparer les débats.',
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
    bio: 'Milo tourne son premier court métrage pour un cours de cinéma. Il s’occupe aussi des inscriptions au BDE.',
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
    bio: 'Jules passe ses après-midi à l’atelier. Pour son projet de troisième année, il répare un vieux projecteur avec Eden.',
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
    bio: 'Iris travaille sur une série de croquis du campus pour son cours d’art. Elle dessine souvent avec Camille.',
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
    bio: 'Alex étudie la biologie et prend des permanences aux serres le jeudi.',
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
    bio: 'Léa s’entraîne tôt et organise une sortie course le samedi.',
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
    bio: 'Ciel étudie les langues étrangères et aide Nora à trouver des textes pour les soirées de lecture.',
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
    bio: 'Rémy crée les affiches du BDE en parallèle de ses cours de marketing.',
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
    bio: 'Sasha prépare un mémoire sur la vie en résidence. Elle mène des entretiens avec des étudiants de première année.',
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
    bio: 'Pour son cours d’architecture, Manon relève les accès et les cheminements du Quad.',
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
    bio: 'Eden s’occupe du site du BDE et donne un coup de main à Jules à l’atelier.',
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
    description: 'Entraînements en bassin et travail technique en groupe.',
    members: 7,
    provenance: 'documented',
    note: 'Type de responsable à confirmer.',
  },
  {
    name: 'Club de droit',
    category: 'Académique',
    description: 'Études de cas et débats autour du droit.',
    members: 0,
    provenance: 'to-confirm',
    note: 'Le club figure dans les descriptions. Sa présence dans l’annuaire reste à confirmer.',
  },
  {
    name: 'BDE',
    category: 'Loisirs et organisation',
    description:
      'Le bureau des étudiants organise les rencontres et accompagne les projets des clubs.',
    members: 8,
    capacity: 10,
    leader: 'Milo Ashford',
    provenance: 'documented',
  },
  {
    name: 'Atelier argentique',
    category: 'Art et culture',
    description: 'Prise de vue sur pellicule, développement et tirage.',
    members: 9,
    leader: 'Iris Bellamy',
    provenance: 'sample',
  },
  {
    name: 'Cercle des carnets',
    category: 'Art et culture',
    description: 'Séances d’écriture et relecture de textes en groupe.',
    members: 6,
    leader: 'Camille Delorme',
    provenance: 'sample',
  },
  {
    name: 'Observatoire du Quad',
    category: 'Académique',
    description: 'Observations du ciel et tenue d’un carnet de terrain.',
    members: 5,
    provenance: 'sample',
  },
  {
    name: 'Course du matin',
    category: 'Sport',
    description: 'Sortie course le samedi matin, avec deux groupes d’allure.',
    members: 11,
    leader: 'Léa Wren',
    provenance: 'sample',
  },
  {
    name: 'Table de jeux',
    category: 'Loisirs et organisation',
    description: 'Jeux de société en salle commune le vendredi.',
    members: 10,
    provenance: 'sample',
  },
];

export const announcements = [
  {
    title: 'La bibliothèque prolonge ses horaires',
    description:
      'La salle de lecture fermera à 22 h du lundi au jeudi, pendant la semaine des ateliers.',
    date: '25 novembre',
  },
  {
    title: 'Appel à contributions pour le journal',
    description:
      'Envoyez vos idées de sujet à Nora avant vendredi pour le prochain numéro.',
    date: '23 novembre',
  },
];

export const events = [
  {
    id: 'reading',
    title: 'Veillée de lecture',
    month: 'nov.',
    day: '27',
    datetime: '2026-11-27T18:30',
    time: '18 h 30',
    place: 'Bibliothèque · Salle de lecture',
    category: 'Culture',
    description: 'Chacun peut apporter un extrait à lire au groupe.',
  },
  {
    id: 'photo',
    title: 'Promenade argentique',
    month: 'nov.',
    day: '29',
    datetime: '2026-11-29T15:00',
    time: '15 h 00',
    place: 'Le Quad · Allée centrale',
    category: 'Clubs',
    description:
      'Rendez-vous devant l’entrée du Quad. Pensez à prendre une pellicule.',
  },
  {
    id: 'debate',
    title: 'Atelier d’éloquence',
    month: 'déc.',
    day: '03',
    datetime: '2026-12-03T17:00',
    time: '17 h 00',
    place: 'Eliot House · Salon',
    category: 'Études',
    description: 'Exercices en binôme. Le sujet sera donné sur place.',
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
    text: 'J’ai pris cette photo en rentrant de l’atelier. On se retrouve au même endroit dimanche pour les croquis ?',
    photo: true,
    likes: 18,
    comments: [
      {
        id: 'fall-1',
        authorId: 'camille',
        text: 'Oui, je prends mon carnet. Vers 15 h ?',
      },
    ],
  },
  {
    id: 'reading',
    authorId: 'nora',
    time: 'Hier',
    text: 'Il reste deux places pour lire vendredi. Si vous avez un texte court, envoyez-moi un message.',
    likes: 9,
    comments: [],
  },
];

export const relations = [
  {
    characterId: 'iris',
    kind: 'Amitié',
    note: 'Elles se retrouvent le jeudi pour dessiner.',
  },
  {
    characterId: 'nora',
    kind: 'Collaboration',
    note: 'Elles préparent la prochaine soirée de lecture.',
  },
  {
    characterId: 'ambrose',
    kind: 'Rivalité amicale',
    note: 'Ils se retrouvent souvent dans des camps opposés aux débats.',
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
        'Alma vient d’arriver en architecture. Elle prépare un carnet de relevés du quartier pour son premier projet.',
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
        'Soren fait partie du collectif de quartier et prépare sa prochaine réunion.',
    },
  },
];
