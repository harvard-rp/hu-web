import { z } from 'zod';

// Mirrors hu-api's character-sheet and owner review schemas.
export const characterKind = z.enum([
  'student',
  'teacher',
  'staff_member',
  'citizen',
]);
export const characterId = z.uuid();
export const validationStatus = z.enum([
  'draft',
  'submitted',
  'changes_requested',
  'approved',
  'rejected',
]);
const useStatus = z.enum(['active', 'suspended']);
const dateTime = z.iso.datetime({ offset: true });
const nullableText = z.string().nullable();
const age = z.number().int().min(0).max(32767);

export const textLimits = {
  firstName: 80,
  lastName: 80,
  nickname: 80,
  sexualOrientation: 120,
  birthPlace: 200,
  origins: 200,
  residence: 200,
  financialSituation: 200,
  occupation: 200,
  personality: 4000,
  physicalDescription: 4000,
  faceClaim: 300,
  backstory: 12000,
  anecdotes: 4000,
} as const;

export const listLimits = { contentWarnings: 120, rpLinks: 300 } as const;
export const listItemCount = 12;
export const maxBodyBytes = 96 * 1024;

const rpString = (limit: number) =>
  z
    .string()
    .refine(
      (value) =>
        value.isWellFormed() &&
        !value.includes('\0') &&
        /\S/u.test(value) &&
        [...value].length <= limit,
    );
const rpText = (limit: number) => rpString(limit).nullable().optional();
const rpList = (limit: number) =>
  z.array(rpString(limit)).max(listItemCount).nullable().optional();

export const editableFields = z.strictObject({
  firstName: rpText(textLimits.firstName),
  lastName: rpText(textLimits.lastName),
  nickname: rpText(textLimits.nickname),
  age: age.nullable().optional(),
  sexualOrientation: rpText(textLimits.sexualOrientation),
  birthDate: z.iso.date().nullable().optional(),
  birthPlace: rpText(textLimits.birthPlace),
  origins: rpText(textLimits.origins),
  residence: rpText(textLimits.residence),
  financialSituation: rpText(textLimits.financialSituation),
  occupation: rpText(textLimits.occupation),
  personality: rpText(textLimits.personality),
  physicalDescription: rpText(textLimits.physicalDescription),
  faceClaim: rpText(textLimits.faceClaim),
  backstory: rpText(textLimits.backstory),
  anecdotes: rpText(textLimits.anecdotes),
  contentWarnings: rpList(listLimits.contentWarnings),
  rpLinks: rpList(listLimits.rpLinks),
  programId: z.uuid().nullable().optional(),
  isScholarshipHolder: z.boolean().nullable().optional(),
});

const summary = z.strictObject({
  id: characterId,
  kind: characterKind,
  validationStatus,
  useStatus,
  revision: z.uuid(),
  createdAt: dateTime,
  updatedAt: dateTime,
  firstName: nullableText,
  lastName: nullableText,
  nickname: nullableText,
});
export const characterList = z.array(summary);
export const characterDetail = summary.extend({
  houseId: z.uuid().nullable(),
  programId: z.uuid().nullable(),
  isScholarshipHolder: z.boolean().nullable(),
  age: age.nullable(),
  sexualOrientation: nullableText,
  birthDate: nullableText,
  birthPlace: nullableText,
  origins: nullableText,
  residence: nullableText,
  financialSituation: nullableText,
  occupation: nullableText,
  personality: nullableText,
  physicalDescription: nullableText,
  faceClaim: nullableText,
  backstory: nullableText,
  anecdotes: nullableText,
  contentWarnings: z.array(nullableText).nullable(),
  rpLinks: z.array(nullableText).nullable(),
});
export const characterCapacity = z.strictObject({
  total: z.number().int().min(5),
  used: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
});

const entry = z.strictObject({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
});
export const characterCatalog = z.array(entry);
export const clubCatalog = z.array(
  entry.extend({ memberCapacity: z.number().int().positive().nullable() }),
);
export const characterReviews = z.array(
  z.strictObject({
    decision: z.enum(['approved', 'changes_requested', 'rejected']),
    reviewedAt: dateTime,
    comment: nullableText,
    assignedHouseId: z.uuid().nullable(),
  }),
);

export type CharacterKind = z.infer<typeof characterKind>;
export type CharacterSummary = z.infer<typeof summary>;
export type CharacterDetail = z.infer<typeof characterDetail>;
export type CharacterCapacity = z.infer<typeof characterCapacity>;
export type EditableFields = z.infer<typeof editableFields>;
export type CharacterCatalog = z.infer<typeof characterCatalog>;
export type CharacterReviews = z.infer<typeof characterReviews>;
