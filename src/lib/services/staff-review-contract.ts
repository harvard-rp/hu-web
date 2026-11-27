import { z } from 'zod';
import {
  characterId,
  characterKind,
  characterReview,
  reviewDecision,
  rpString,
} from './character-contract';

export const staffQueue = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: characterId,
        kind: characterKind,
        revision: z.uuid(),
        useStatus: z.enum(['active', 'suspended']),
        updatedAt: z.iso.datetime({ offset: true }),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
      }),
    )
    .max(50),
  nextCursor: z.uuid().nullable(),
});

export const reviewCommentLimit = 2000;
export const reviewInput = z.strictObject({
  expectedRevision: z.uuid(),
  decision: reviewDecision,
  comment: rpString(reviewCommentLimit).optional(),
  houseId: z.uuid().optional(),
});

export const reviewResult = z.strictObject({
  characterId,
  revision: z.uuid(),
  houseId: z.uuid().nullable(),
  review: characterReview,
});

export type StaffQueue = z.infer<typeof staffQueue>;
export type ReviewInput = z.infer<typeof reviewInput>;
