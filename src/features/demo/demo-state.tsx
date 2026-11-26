import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  initialPosts,
  initialReviews,
  student,
  type CharacterDraft,
  type DemoPost,
  type HouseId,
  type Review,
  type ReviewStatus,
} from './data';

type DemoState = {
  posts: readonly DemoPost[];
  likes: readonly string[];
  events: readonly string[];
  reviews: readonly Review[];
};

const baseline: DemoState = {
  posts: initialPosts,
  likes: [],
  events: [],
  reviews: initialReviews,
};

type DemoContextValue = DemoState & {
  addPost: (text: string) => void;
  addComment: (id: string, text: string) => void;
  toggleLike: (id: string) => void;
  toggleEvent: (id: string) => void;
  submit: (draft: CharacterDraft) => void;
  assignHouse: (id: string, house: HouseId) => void;
  review: (
    id: string,
    status: Exclude<ReviewStatus, 'pending'>,
    house?: HouseId,
    note?: string,
  ) => void;
  reset: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function toggle(items: readonly string[], id: string) {
  return items.includes(id)
    ? items.filter((item) => item !== id)
    : [...items, id];
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(baseline);
  const [revision, setRevision] = useState(0);

  return (
    <DemoContext
      value={{
        ...state,
        addPost(text) {
          const post: DemoPost = {
            id: crypto.randomUUID(),
            authorId: student.id,
            text,
            likes: 0,
            comments: [],
            time: 'À l’instant',
          };
          setState((current) => ({
            ...current,
            posts: [post, ...current.posts],
          }));
        },
        addComment(id, text) {
          const comment = {
            id: crypto.randomUUID(),
            authorId: student.id,
            text,
          };
          setState((current) => ({
            ...current,
            posts: current.posts.map((post) =>
              post.id === id
                ? { ...post, comments: [...post.comments, comment] }
                : post,
            ),
          }));
        },
        toggleLike(id) {
          setState((current) => ({
            ...current,
            likes: toggle(current.likes, id),
          }));
        },
        toggleEvent(id) {
          setState((current) => ({
            ...current,
            events: toggle(current.events, id),
          }));
        },
        submit(draft) {
          const record: Review = {
            id: crypto.randomUUID(),
            status: 'pending',
            draft,
          };
          setState((current) => ({
            ...current,
            reviews: [record, ...current.reviews],
          }));
        },
        assignHouse(id, house) {
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
            reviews: current.reviews.map((record) =>
              record.id === id && record.status === 'pending'
                ? { ...record, status, house, note }
                : record,
            ),
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

const DemoRevisionContext = createContext(0);

export function useDemoRevision() {
  return useContext(DemoRevisionContext);
}

export function useDemo() {
  const state = useContext(DemoContext);
  if (!state) throw new Error('DemoProvider is required.');
  return state;
}
