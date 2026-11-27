import { z } from 'zod';
import {
  characterDetail,
  characterKind,
  characterReviews,
  rpString,
} from './character-contract';

const dateTime = z.iso.datetime({ offset: true });
const decision = z.enum(['accepted', 'declined']);
const reference = z.strictObject({
  requestId: z.uuid(),
  expectedRevision: z.uuid(),
});
export const ownerReopeningInput = reference.extend({ reason: rpString(2000) });
export const staffReopeningInput = reference.extend({
  decision,
  justification: rpString(2000),
});
export const reopening = z.strictObject({
  requestId: z.uuid(),
  requestedRevision: z.uuid(),
  reason: z.string(),
  requestedAt: dateTime,
  decision: decision.nullable(),
  justification: z.string().nullable(),
  decidedAt: dateTime.nullable(),
  resultingRevision: z.uuid().nullable(),
});
export const reopeningHistory = z.array(reopening);
export const staffArchive = z.strictObject({
  sheet: characterDetail,
  reviews: characterReviews,
});
export const staffArchives = z.strictObject({
  items: z
    .array(
      z.strictObject({
        id: z.uuid(),
        kind: characterKind,
        revision: z.uuid(),
        archivedAt: dateTime,
        refusalCount: z.number().int().min(3),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        pendingRequestId: z.uuid().nullable(),
      }),
    )
    .max(50),
  nextCursor: z.uuid().nullable(),
});
export type Reopening = z.infer<typeof reopening>;
export type ReopeningHistory = z.infer<typeof reopeningHistory>;
export type OwnerReopeningInput = z.infer<typeof ownerReopeningInput>;
export type StaffReopeningInput = z.infer<typeof staffReopeningInput>;
