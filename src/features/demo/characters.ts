import type { HouseId } from './catalogues';

export const characterTypes = {
  student: 'Étudiant',
  professor: 'Professeur',
  employee: 'Personnel universitaire',
  citizen: 'Citoyen',
} as const;

export type CharacterType = keyof typeof characterTypes;

type CharacterIdentity = {
  id: string;
  name: string;
  initials: string;
  tone: string;
  bio: string;
  role?: string;
};

export type StudentCharacter = CharacterIdentity & {
  type: 'student';
  house: HouseId;
  major: string;
  year?: string;
  points: number;
};

export type Character =
  | StudentCharacter
  | (CharacterIdentity & {
      type: Exclude<CharacterType, 'student'>;
    });

export type CharacterDraft = {
  name: string;
  firstName: string;
  nickname: string;
  age: string;
  orientation: string;
  birthDate: string;
  birthPlace: string;
  origins: string;
  residence: string;
  finances: string;
  profile: CharacterType;
  role: string;
  personality: string;
  appearance: string;
  faceClaim: string;
  major: string;
  majorProposal: string;
  scholarship: '' | 'yes' | 'no';
  clubs: readonly string[];
  story: string;
  anecdotes: string;
  relations: string;
  warnings: string;
};

export const emptyDraft: CharacterDraft = {
  name: '',
  firstName: '',
  nickname: '',
  age: '',
  orientation: '',
  birthDate: '',
  birthPlace: '',
  origins: '',
  residence: '',
  finances: '',
  profile: 'student',
  role: '',
  personality: '',
  appearance: '',
  faceClaim: '',
  major: '',
  majorProposal: '',
  scholarship: '',
  clubs: [],
  story: '',
  anecdotes: '',
  relations: '',
  warnings: '',
};

export const reviewStatusLabels = {
  pending: 'En attente',
  changes: 'Correction demandée',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  suspended: 'Suspendue',
} as const;

export type ReviewStatus = keyof typeof reviewStatusLabels;
export type ReviewDecision = 'accepted' | 'rejected' | 'changes';

export type Review = {
  id: string;
  draft: CharacterDraft;
  status: ReviewStatus;
  house?: HouseId;
  note?: string;
  studentDetails?: { year: string; points: number };
};

export function draftName({ name, firstName }: CharacterDraft) {
  return [firstName.trim(), name.trim()].filter(Boolean).join(' ');
}

export function usableCharacter(record: Review): Character | undefined {
  if (record.status !== 'accepted') return undefined;
  const { draft } = record;
  const name = draftName(draft);
  const identity = {
    id: record.id,
    name,
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
    tone: draft.profile === 'student' ? 'berry' : 'blue',
    bio: draft.story,
    role: draft.role,
  };

  if (draft.profile !== 'student') return { ...identity, type: draft.profile };
  if (!record.house) return undefined;

  return {
    ...identity,
    type: 'student',
    house: record.house,
    major: draft.major === 'other' ? draft.majorProposal : draft.major,
    year: record.studentDetails?.year,
    points: record.studentDetails?.points ?? 0,
  };
}
