import { createContext, useContext, useState, type ReactNode } from 'react';

import { findHouse, confirmedClubs, type HouseId } from './catalogues';
import {
  usableCharacter,
  type Character,
  type CharacterDraft,
  type Review,
  type ReviewDecision,
  type StudentCharacter,
} from './characters';
import {
  campusMembers,
  initialPosts,
  initialReviews,
  type DemoPost,
} from './data';

const baseSlots = 5;
export const maxCharacterClubs = 2;

type CharacterSelections = Readonly<Record<string, readonly string[]>>;

type DemoState = {
  posts: readonly DemoPost[];
  likes: CharacterSelections;
  events: CharacterSelections;
  reviews: readonly Review[];
  activeId: string | null;
  boosts: number;
};

const baseline: DemoState = {
  posts: initialPosts,
  likes: {},
  events: {},
  reviews: initialReviews,
  activeId: 'camille',
  boosts: 4,
};

function getCapacity(reviews: DemoState['reviews'], boosts: number) {
  const used = reviews.filter(({ status }) => status !== 'rejected').length;
  const total = baseSlots + boosts;
  return {
    base: baseSlots,
    total,
    used,
    available: Math.max(0, total - used),
    over: Math.max(0, used - total),
  };
}

export function validBoostCount(value: number) {
  return (
    Number.isSafeInteger(value) &&
    value >= 0 &&
    Number.isSafeInteger(baseSlots + value)
  );
}

type DemoContextValue = {
  posts: DemoState['posts'];
  reviews: DemoState['reviews'];
  boosts: number;
  capacity: ReturnType<typeof getCapacity>;
  activeCharacter: Character | undefined;
  characters: readonly Character[];
  ranking: readonly StudentCharacter[];
  likes: readonly string[];
  likeCount: (id: string) => number;
  events: readonly string[];
  selectCharacter: (id: string | null) => void;
  setBoosts: (boosts: number) => void;
  addPost: (text: string) => void;
  addComment: (id: string, text: string) => void;
  toggleLike: (id: string) => void;
  toggleEvent: (id: string) => void;
  submit: (draft: CharacterDraft, reviewId?: string) => void;
  assignHouse: (id: string, house: HouseId) => void;
  review: (
    id: string,
    status: ReviewDecision,
    house?: HouseId,
    note?: string,
  ) => void;
  reset: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const DemoRevisionContext = createContext(0);

function findActive(state: DemoState) {
  const record = state.reviews.find(({ id }) => id === state.activeId);
  return record && usableCharacter(record);
}

function toggle(items: readonly string[], id: string) {
  return items.includes(id)
    ? items.filter((item) => item !== id)
    : [...items, id];
}

function toggleForCharacter(
  state: DemoState,
  field: 'likes' | 'events',
  id: string,
) {
  const active = findActive(state);
  if (!active) return state;
  const choices = state[field];
  return {
    ...state,
    [field]: { ...choices, [active.id]: toggle(choices[active.id] ?? [], id) },
  };
}

function readyDraft(draft: CharacterDraft) {
  if (draft.profile !== 'student') {
    return {
      ...draft,
      clubs: [],
      major: '',
      majorProposal: '',
      scholarship: '',
    } satisfies CharacterDraft;
  }

  const submitted = [...new Set(draft.clubs.filter(Boolean))];
  if (
    submitted.length > maxCharacterClubs ||
    submitted.some((name) => !confirmedClubs.some((club) => club.name === name))
  )
    return undefined;
  return {
    ...draft,
    clubs: submitted,
    majorProposal: draft.major === 'other' ? draft.majorProposal.trim() : '',
  };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(baseline);
  const [revision, setRevision] = useState(0);
  const activeCharacter = findActive(state);
  const characters = [
    ...state.reviews.flatMap((record) => usableCharacter(record) ?? []),
    ...campusMembers,
  ];
  const ranking = characters
    .filter((person) => person.type === 'student')
    .sort((a, b) => b.points - a.points);

  return (
    <DemoContext
      value={{
        posts: state.posts,
        reviews: state.reviews,
        boosts: state.boosts,
        capacity: getCapacity(state.reviews, state.boosts),
        characters,
        activeCharacter,
        ranking,
        likes: (activeCharacter && state.likes[activeCharacter.id]) ?? [],
        likeCount(id) {
          return Object.values(state.likes).filter((items) =>
            items.includes(id),
          ).length;
        },
        events: (activeCharacter && state.events[activeCharacter.id]) ?? [],
        selectCharacter(id) {
          setState((current) => {
            if (id === null) return { ...current, activeId: null };
            const record = current.reviews.find((item) => item.id === id);
            return record && usableCharacter(record)
              ? { ...current, activeId: id }
              : current;
          });
        },
        setBoosts(boosts) {
          if (validBoostCount(boosts))
            setState((current) => ({ ...current, boosts }));
        },
        addPost(text) {
          const id = crypto.randomUUID();
          setState((current) => {
            const active = findActive(current);
            if (!active) return current;
            const post: DemoPost = {
              id,
              authorId: active.id,
              text,
              likes: 0,
              comments: [],
              time: 'À l’instant',
            };
            return { ...current, posts: [post, ...current.posts] };
          });
        },
        addComment(id, text) {
          const commentId = crypto.randomUUID();
          setState((current) => {
            const active = findActive(current);
            if (!active) return current;
            const comment = { id: commentId, authorId: active.id, text };
            return {
              ...current,
              posts: current.posts.map((post) =>
                post.id === id
                  ? { ...post, comments: [...post.comments, comment] }
                  : post,
              ),
            };
          });
        },
        toggleLike(id) {
          setState((current) => toggleForCharacter(current, 'likes', id));
        },
        toggleEvent(id) {
          setState((current) => toggleForCharacter(current, 'events', id));
        },
        submit(draft, reviewId) {
          const prepared = readyDraft(draft);
          if (!prepared) return;
          const id = reviewId ?? crypto.randomUUID();
          setState((current) => {
            if (reviewId)
              return {
                ...current,
                reviews: current.reviews.map((record) =>
                  record.id === reviewId && record.status === 'changes'
                    ? {
                        ...record,
                        draft: prepared,
                        status: 'pending',
                        house:
                          prepared.profile === 'student'
                            ? record.house
                            : undefined,
                        note: undefined,
                      }
                    : record,
                ),
              };
            if (!getCapacity(current.reviews, current.boosts).available)
              return current;
            return {
              ...current,
              reviews: [
                { id, status: 'pending', draft: prepared },
                ...current.reviews,
              ],
            };
          });
        },
        assignHouse(id, house) {
          if (!findHouse(house)) return;
          setState((current) => ({
            ...current,
            reviews: current.reviews.map((record) =>
              record.id === id &&
              record.status === 'pending' &&
              record.draft.profile === 'student'
                ? { ...record, house }
                : record,
            ),
          }));
        },
        review(id, status, house, note) {
          setState((current) => ({
            ...current,
            reviews: current.reviews.map((record) => {
              if (record.id !== id || record.status !== 'pending')
                return record;
              if (
                status === 'accepted' &&
                record.draft.profile === 'student' &&
                (!house || !findHouse(house))
              )
                return record;
              return {
                ...record,
                status,
                house: record.draft.profile === 'student' ? house : undefined,
                note,
              };
            }),
          }));
        },
        reset() {
          setState(baseline);
          setRevision((value) => value + 1);
        },
      }}
    >
      <DemoRevisionContext value={revision}>{children}</DemoRevisionContext>
    </DemoContext>
  );
}

export function useDemoRevision() {
  return useContext(DemoRevisionContext);
}

export function useDemo() {
  const state = useContext(DemoContext);
  if (!state) throw new Error('DemoProvider is required.');
  return state;
}
