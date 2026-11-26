import { emptyDraft, type Review, type StudentCharacter } from './characters';

export const campusMembers: readonly StudentCharacter[] = [
  {
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
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
    type: 'student',
    id: 'sasha',
    name: 'Sasha Girard',
    initials: 'SG',
    house: 'lowell',
    major: 'Sciences sociales',
    year: '3e année',
    points: 510,
    tone: 'berry',
    bio: 'Sasha prépare un mémoire sur la vie en résidence. Elle mène des entretiens avec des étudiants de première année.',
  },
  {
    type: 'student',
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
    type: 'student',
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

export const fixtureRelations = [
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

export const initialReviews: readonly Review[] = [
  {
    id: 'camille',
    status: 'accepted',
    house: 'adams',
    studentDetails: { year: '2e année', points: 840 },
    draft: {
      ...emptyDraft,
      name: 'Delorme',
      firstName: 'Camille',
      major: 'Littérature',
      story:
        'Camille étudie la littérature. Elle écrit des nouvelles et aide Nora à organiser les soirées de lecture. Elle travaille souvent à la bibliothèque avec Iris.',
    },
  },
  {
    id: 'theo',
    status: 'accepted',
    draft: {
      ...emptyDraft,
      name: 'Marchand',
      firstName: 'Théo',
      profile: 'professor',
      role: 'Enseigne l’histoire contemporaine',
      story: 'Théo prépare un cours sur les archives de la ville.',
    },
  },
  {
    id: 'maya',
    status: 'accepted',
    draft: {
      ...emptyDraft,
      name: 'Laurent',
      firstName: 'Maya',
      profile: 'employee',
      role: 'Bibliothécaire',
      story: 'Maya s’occupe du fonds local et du prêt en salle de lecture.',
    },
  },
  {
    id: 'sam',
    status: 'accepted',
    draft: {
      ...emptyDraft,
      name: 'Morel',
      firstName: 'Sam',
      profile: 'citizen',
      role: 'Libraire',
      story: 'Sam tient une petite librairie près du campus.',
    },
  },
  {
    id: 'review-alma',
    status: 'pending',
    draft: {
      ...emptyDraft,
      name: 'Verdier',
      firstName: 'Alma',
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
      name: 'Finch',
      firstName: 'Soren',
      profile: 'citizen',
      personality: 'Réservé et attentif.',
      story:
        'Soren fait partie du collectif de quartier et prépare sa prochaine réunion.',
    },
  },
  {
    id: 'review-lina',
    status: 'changes',
    note: 'Préciser pourquoi Lina a changé de filière.',
    draft: {
      ...emptyDraft,
      name: 'Lenoir',
      firstName: 'Lina',
      major: 'Biologie',
    },
  },
  {
    id: 'review-arthur',
    status: 'suspended',
    house: 'winthrop',
    draft: {
      ...emptyDraft,
      name: 'Rivière',
      firstName: 'Arthur',
      major: 'Économie',
    },
  },
];
