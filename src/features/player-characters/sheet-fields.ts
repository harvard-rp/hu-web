import {
  editableFields,
  listItemCount,
  listLimits,
  maxBodyBytes,
  textLimits,
  type CharacterCatalog,
  type CharacterDetail,
  type CharacterKind,
  type EditableFields,
} from '@/lib/services/character-contract';

export type Field = keyof EditableFields;
type FieldInfo = {
  field: Field;
  label: string;
  control?: 'textarea' | 'list' | 'number' | 'date' | 'program' | 'scholarship';
};

export const sheetSections = [
  {
    title: 'Identité',
    fields: [
      { field: 'firstName', label: 'Prénom' },
      { field: 'lastName', label: 'Nom' },
      { field: 'nickname', label: 'Surnom' },
      { field: 'age', label: 'Âge', control: 'number' },
      { field: 'birthDate', label: 'Date de naissance', control: 'date' },
      { field: 'birthPlace', label: 'Lieu de naissance' },
      { field: 'sexualOrientation', label: 'Orientation sexuelle' },
      { field: 'origins', label: 'Origines' },
    ],
  },
  {
    title: 'Personnalité',
    fields: [
      { field: 'personality', label: 'Personnalité', control: 'textarea' },
    ],
  },
  {
    title: 'Apparence',
    fields: [
      {
        field: 'physicalDescription',
        label: 'Description physique',
        control: 'textarea',
      },
      { field: 'faceClaim', label: 'Face claim' },
    ],
  },
  {
    title: 'Situation et fonction',
    fields: [
      { field: 'residence', label: 'Lieu de vie' },
      { field: 'financialSituation', label: 'Situation financière' },
      { field: 'occupation', label: 'Fonction' },
    ],
  },
  {
    title: 'Université',
    fields: [
      { field: 'programId', label: 'Filière', control: 'program' },
      {
        field: 'isScholarshipHolder',
        label: 'Boursier',
        control: 'scholarship',
      },
    ],
  },
  {
    title: 'Histoire',
    fields: [
      { field: 'backstory', label: 'Histoire', control: 'textarea' },
      { field: 'anecdotes', label: 'Anecdotes', control: 'textarea' },
    ],
  },
  {
    title: 'Avertissements et liens RP',
    fields: [
      {
        field: 'contentWarnings',
        label: 'Avertissements de contenu',
        control: 'list',
      },
      { field: 'rpLinks', label: 'Liens RP', control: 'list' },
    ],
  },
] satisfies { title: string; fields: FieldInfo[] }[];

const fields = sheetSections.flatMap((section): FieldInfo[] => section.fields);
export const fieldLabels = Object.fromEntries(
  fields.map(({ field, label }) => [field, label]),
) as Record<Field, string>;
export type SheetValues = Record<Field, string>;

export function fieldsFor(kind: CharacterKind, group: FieldInfo[]) {
  return group.filter(
    ({ field }) =>
      (field !== 'programId' || kind === 'student' || kind === 'teacher') &&
      (field !== 'isScholarshipHolder' || kind === 'student'),
  );
}

export function sheetValues(sheet: CharacterDetail): SheetValues {
  return Object.fromEntries(
    fields.map(({ field }) => {
      const value = sheet[field];
      return [
        field,
        Array.isArray(value)
          ? value.join('\n')
          : value === null
            ? ''
            : String(value),
      ];
    }),
  ) as SheetValues;
}

function fieldValue(raw: string, control?: FieldInfo['control']) {
  if (!raw.trim()) return null;
  if (control === 'number') return Number(raw);
  if (control === 'scholarship') return raw === 'true';
  if (control === 'list')
    return raw.split('\n').filter((item) => /\S/u.test(item));
  return raw;
}

export function changedFields(sheet: CharacterDetail, values: SheetValues) {
  const original = sheetValues(sheet);
  return Object.fromEntries(
    fieldsFor(sheet.kind, fields)
      .filter(({ field }) => values[field] !== original[field])
      .flatMap(({ field, control }) => {
        const value = fieldValue(values[field], control);
        const saved = sheet[field];
        const sameList =
          Array.isArray(value) &&
          Array.isArray(saved) &&
          value.length === saved.length &&
          value.every((item, index) => item === saved[index]);
        return value === saved || sameList ? [] : [[field, value]];
      }),
  );
}

export function validatePatch(
  sheet: CharacterDetail,
  changes: Record<string, unknown>,
) {
  const parsed = editableFields.safeParse(changes);
  if (!parsed.success)
    return {
      kind: 'invalid' as const,
      fields: [
        ...new Set(parsed.error.issues.map(({ path }) => path[0] as Field)),
      ],
    };
  const bytes = new TextEncoder().encode(
    JSON.stringify({ ...parsed.data, expectedRevision: sheet.revision }),
  ).byteLength;
  return bytes > maxBodyBytes
    ? { kind: 'too-large' as const }
    : { kind: 'valid' as const, data: parsed.data };
}

export function fieldConstraint(field: Field) {
  if (field === 'contentWarnings' || field === 'rpLinks')
    return `Une entrée par ligne, jusqu’à ${listItemCount} entrées de ${listLimits[field]} caractères chacune.`;
  if (field === 'age') return 'De 0 à 32 767 ans, en nombre entier.';
  if (field in textLimits)
    return `${textLimits[field as keyof typeof textLimits]} caractères maximum.`;
  return undefined;
}

export function missingForSubmission(sheet: CharacterDetail) {
  const required = [
    'firstName',
    'lastName',
    'personality',
    'physicalDescription',
    'faceClaim',
    'backstory',
  ] as const;
  const missing: Field[] = required.filter((field) => !sheet[field]?.trim());
  if (sheet.kind === 'student' && !sheet.programId) missing.push('programId');
  return missing.map((field) => fieldLabels[field]);
}

export function catalogName(
  catalog: CharacterCatalog,
  id: string | null,
  fallback: string,
) {
  return id
    ? (catalog.find((entry) => entry.id === id)?.name ?? fallback)
    : 'Non renseigné';
}
