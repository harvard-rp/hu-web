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

import { isExternalSheetUrl } from '@/lib/services/external-sheet';

export type Field = keyof EditableFields;
type FieldInfo = {
  field: Field;
  label: string;
  control?: 'textarea' | 'list' | 'number' | 'date' | 'program' | 'scholarship';
};

export const sheetSections = [
  {
    title: 'Format de la fiche',
    fields: [
      { field: 'sheetMode', label: 'Mode de fiche' },
      { field: 'externalUrl', label: 'Lien de consultation' },
    ],
  },
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
      .filter(
        ({ field }) =>
          !(field === 'externalUrl' && values.sheetMode === 'inline') &&
          values[field] !== original[field],
      )
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

// PostgreSQL normalizes CRLF and CR to LF. Its btrim whitelist differs from JS trim.
const lineWhitespace = new Set(
  '\t\v\f \u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF',
);
export function editorialLines(value: string | null) {
  return (value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) =>
      [...line].some((character) => !lineWhitespace.has(character)),
    ).length;
}
export const editorialLimits = {
  physicalDescription: { min: 5, max: Infinity, label: 'au moins 5 lignes' },
  personality: { min: 5, max: 10, label: '5 à 10 lignes' },
  backstory: { min: 10, max: 15, label: '10 à 15 lignes' },
};
type EditorialField = keyof typeof editorialLimits;
export function editorialHint(field: Field, value: string) {
  if (!Object.hasOwn(editorialLimits, field)) return undefined;
  const rule = editorialLimits[field as EditorialField];
  return `${editorialLines(value)} ligne(s) · ${rule.label}`;
}

export function missingForSubmission(
  sheet: CharacterDetail,
  programs: CharacterCatalog,
) {
  const missing: string[] = [];
  for (const field of ['firstName', 'lastName', 'faceClaim'] as const) {
    if (!sheet[field]?.trim()) missing.push(fieldLabels[field]);
  }
  if (sheet.age === null) missing.push(fieldLabels.age);
  if (!sheet.birthDate) missing.push(fieldLabels.birthDate);
  if (
    (sheet.kind === 'student' || sheet.programId) &&
    !programs.some(({ id }) => id === sheet.programId)
  )
    missing.push('Filière active');
  if (
    (sheet.kind === 'teacher' || sheet.kind === 'staff_member') &&
    !sheet.occupation?.trim()
  )
    missing.push(fieldLabels.occupation);
  if (sheet.sheetMode === 'inline') {
    for (const field of Object.keys(editorialLimits) as EditorialField[]) {
      const { min, max, label } = editorialLimits[field];
      const count = editorialLines(sheet[field]);
      if (count < min || count > max)
        missing.push(`${fieldLabels[field]} (${label})`);
    }
  } else if (!sheet.externalUrl || !isExternalSheetUrl(sheet.externalUrl)) {
    missing.push('Lien de consultation valide');
  }
  return missing;
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
