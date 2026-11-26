export const houses = [
  {
    id: 'adams',
    name: 'Adams',
    color: '#8d384a',
    location: 'River Houses',
    traits: ['Créativité', 'Indépendance', 'Ouverture d’esprit'],
    summary:
      'Adams rassemble des étudiants créatifs et indépendants, ouverts aux idées qui sortent du cadre. Arts, littérature, cinéma, théâtre et musique nourrissent une vie intellectuelle et bohème.',
  },
  {
    id: 'cabot',
    name: 'Cabot',
    color: '#374d6a',
    location: 'Quad Houses',
    traits: ['Vie associative', 'Activités collectives', 'Accueil'],
    summary:
      'À Cabot, les étudiants se retrouvent dans les associations, les projets collectifs et les activités culturelles. Les échanges sont simples et chaleureux, dans une ambiance familiale.',
  },
  {
    id: 'currier',
    name: 'Currier',
    color: '#356254',
    location: 'Quad Houses',
    traits: ['Imagination', 'Arts visuels', 'Indépendance'],
    summary:
      'La musique et les arts visuels occupent une place importante à Currier. Les étudiants y mènent des projets à leur façon, dans un cadre moderne et informel qui laisse de la place à l’improvisation.',
  },
  {
    id: 'dunster',
    name: 'Dunster',
    color: '#8a5136',
    location: 'River Houses',
    traits: ['Études', 'Leadership', 'Traditions'],
    summary:
      'Les étudiants de Dunster accordent du temps aux études, à la prise de responsabilités et aux événements universitaires. La House est organisée, attachée aux traditions et aux rendez-vous soignés.',
  },
  {
    id: 'eliot',
    name: 'Eliot',
    color: '#525178',
    location: 'River Houses',
    traits: ['Culture', 'Débats d’idées', 'Traditions'],
    summary:
      'À Eliot, on échange sur la littérature, l’histoire, la politique et les arts. Les traditions comptent, dans une ambiance calme et raffinée.',
  },
  {
    id: 'kirkland',
    name: 'Kirkland',
    color: '#6a493d',
    location: 'River Houses',
    traits: ['Culture', 'Engagement', 'Projets collectifs'],
    summary:
      'Les étudiants de Kirkland s’investissent dans le théâtre, la littérature, la politique et les associations. Les projets se montent en groupe et occupent une bonne part de la vie de la House.',
  },
  {
    id: 'leverett',
    name: 'Leverett',
    color: '#3f5b74',
    location: 'River Houses',
    traits: ['Polyvalence', 'Collaboration', 'Vie associative'],
    summary:
      'À Leverett, les projets sportifs côtoient les sciences, les arts et la vie associative. Les étudiants ont des intérêts variés et travaillent volontiers ensemble.',
  },
  {
    id: 'lowell',
    name: 'Lowell',
    color: '#4c4169',
    location: 'River Houses',
    traits: ['Études', 'Musique classique', 'Sciences humaines'],
    summary:
      'À Lowell, les études et les débats font partie du quotidien. La musique classique, la littérature et les sciences humaines y tiennent une place importante, dans un cadre traditionnel.',
  },
  {
    id: 'mather',
    name: 'Mather',
    color: '#4a5b4a',
    location: 'River Houses',
    traits: ['Autonomie', 'Sciences', 'Pratique'],
    summary:
      'À Mather, les étudiants travaillent volontiers en autonomie sur des projets scientifiques, créatifs ou pratiques. L’ambiance est moderne et informelle, avec peu de goût pour les conventions.',
  },
  {
    id: 'pforzheimer',
    name: 'Pforzheimer',
    color: '#705138',
    location: 'Quad Houses',
    traits: ['Échanges internationaux', 'Diversité culturelle', 'Engagement'],
    summary:
      'Pforzheimer réunit des étudiants intéressés par les échanges internationaux et la diversité culturelle. Les arts et l’engagement local y favorisent les rencontres dans un cadre accueillant.',
  },
  {
    id: 'quincy',
    name: 'Quincy',
    color: '#815344',
    location: 'River Houses',
    traits: ['Vie sociale', 'Sport', 'Activités collectives'],
    summary:
      'À Quincy, les étudiants se retrouvent aux soirées, aux activités sportives et dans les associations. La vie de groupe y est animée et conviviale.',
  },
  {
    id: 'winthrop',
    name: 'Winthrop',
    color: '#3b5963',
    location: 'River Houses',
    traits: ['Histoire', 'Traditions', 'Vie communautaire'],
    summary:
      'À Winthrop, l’histoire, la politique et la culture font partie des échanges. Les étudiants tiennent aux traditions de la House et aux liens qu’ils nouent au quotidien.',
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

export const findHouse = (id: string) =>
  houses.find((house) => house.id === id);

export const clubCategories = [
  'Sport',
  'Arts et culture',
  'Académique',
  'Loisirs',
  'Organisation',
] as const;

type ClubCategory = (typeof clubCategories)[number];
type Club = {
  name: string;
  category: ClubCategory;
  description?: string;
  leadership: 'Capitanat' | 'Présidence' | 'À confirmer';
  capacity?: number;
  members?: number;
  leader?: string;
  provisional?: true;
};

type ClubEntry = {
  name: string;
  description?: string;
  captain?: true;
  provisional?: true;
};

const catalogue: Record<ClubCategory, readonly ClubEntry[]> = {
  Sport: [
    {
      name: 'Football américain',
      captain: true,
      description: 'Préparation physique, entraînements et stratégie d’équipe.',
    },
    {
      name: 'Basketball',
      captain: true,
      description: 'Technique individuelle, jeu collectif et matchs.',
    },
    {
      name: 'Hockey sur glace',
      captain: true,
      description: 'Patinage, maniement de la crosse et tactique sur glace.',
    },
    {
      name: 'Lacrosse',
      captain: true,
      description: 'Travail de l’agilité, de l’endurance et du jeu collectif.',
    },
    {
      name: 'Escrime',
      captain: true,
      description: 'Technique, précision et réflexes.',
    },
    {
      name: 'Natation',
      description:
        'Travail de la technique, de la vitesse et de l’endurance en bassin.',
    },
    {
      name: 'Cheerleading',
      captain: true,
      description:
        'Danse, gymnastique et acrobaties pour soutenir les équipes.',
    },
    {
      name: 'Boxe',
      description: 'Préparation physique, technique et sparring encadré.',
    },
    {
      name: 'Arts martiaux',
      description:
        'Apprentissage des techniques de combat et travail de la maîtrise de soi.',
    },
    {
      name: 'Patinage artistique',
      captain: true,
      description: 'Équilibre, technique et chorégraphie sur glace.',
    },
    { name: 'Équitation', captain: true },
  ],
  'Arts et culture': [
    {
      name: 'Arts plastiques',
      description: 'Dessin, peinture, sculpture et projets artistiques.',
    },
    {
      name: 'Musique',
      description: 'Pratique instrumentale, chant, composition et concerts.',
    },
    {
      name: 'Comédie musicale',
      description: 'Chant, danse et théâtre autour de spectacles.',
    },
    {
      name: 'Théâtre',
      description: 'Interprétation, répétitions et travail sur scène.',
    },
    {
      name: 'Cinéma',
      description:
        'Écriture de scénarios, réalisation, montage et analyse de films.',
    },
    {
      name: 'Photographie',
      description: 'Cadrage, retouche et projets photo.',
    },
    {
      name: 'Littérature',
      description: 'Lecture, écriture et discussions en groupe.',
    },
    { name: 'Danse' },
    {
      name: 'Journalisme',
      description: 'Rédaction et entretiens pour le journal universitaire.',
    },
    { name: 'Radio' },
  ],
  Académique: [
    {
      name: 'Sciences',
      description: 'Expériences, recherches et projets scientifiques.',
    },
    {
      name: 'Informatique',
      description: 'Programmation, technologies et projets en équipe.',
    },
    {
      name: 'Langues',
      description: 'Apprentissage, conversation et échanges culturels.',
    },
    { name: 'Débats' },
    {
      name: 'Club de droit',
      provisional: true,
      description: 'Études de cas, simulations de procès et argumentation.',
    },
  ],
  Loisirs: [
    { name: 'Échecs', description: 'Stratégie, parties amicales et tournois.' },
    {
      name: 'Jeux vidéo',
      description: 'Jeu en groupe, compétitions et projets numériques.',
    },
    {
      name: 'Restauration',
      description: 'Cuisine, ateliers et découverte culinaire.',
    },
    { name: 'Urbex' },
    { name: 'Aventure' },
    { name: 'Automobile' },
  ],
  Organisation: [
    {
      name: 'BDE',
      description:
        'Représentation des étudiants, organisation d’événements et projets associatifs.',
    },
  ],
};

export const clubs: readonly Club[] = clubCategories.flatMap((category) =>
  catalogue[category].map(({ captain, name, ...entry }): Club => ({
    ...entry,
    name,
    category,
    leadership:
      entry.provisional || name === 'Natation'
        ? 'À confirmer'
        : captain
          ? 'Capitanat'
          : 'Présidence',
    ...(name === 'BDE'
      ? { capacity: 10, members: 8, leader: 'Milo Ashford' }
      : {}),
    ...(name === 'Natation' ? { members: 7 } : {}),
  })),
);

export const confirmedClubs = clubs.filter((club) => !club.provisional);
