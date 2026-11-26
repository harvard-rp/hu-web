import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmedClubs, majors } from '@/features/demo/catalogues';
import {
  characterTypes,
  draftName,
  emptyDraft,
  type CharacterDraft,
  type CharacterType,
  type Review,
} from '@/features/demo/characters';
import { maxCharacterClubs, useDemo } from '@/features/demo/demo-state';
import { DemoHeading } from '@/features/demo/demo-ui';

const steps = [
  'Identité',
  'Portrait',
  'Université',
  'Histoire et relations',
  'Récapitulatif',
];
const demoName = z.string().trim().min(1).max(80);
const demoProposal = z.string().trim().min(1).max(100);
type TextFieldKey = Exclude<
  keyof CharacterDraft,
  'profile' | 'scholarship' | 'clubs'
>;

function Field({
  name,
  label,
  children,
  error,
  hint,
}: {
  name: string;
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="demo-field">
      <Label htmlFor={name}>{label}</Label>
      {hint && (
        <p id={`${name}-hint`} className="demo-aside">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const identityFields = [
  ['firstName', 'Prénom'],
  ['nickname', 'Surnom'],
  ['age', 'Âge', 'number'],
  ['orientation', 'Orientation sexuelle du personnage'],
  ['birthDate', 'Date de naissance', 'date'],
  ['birthPlace', 'Lieu de naissance'],
  ['origins', 'Origines'],
  ['residence', 'Lieu de vie'],
  ['finances', 'Situation financière'],
  ['role', 'Fonction'],
] as const;

export function DraftSummary({ draft }: { draft: CharacterDraft }) {
  const fields = [
    ['Nom du personnage', draftName(draft)],
    ['Type de profil', characterTypes[draft.profile]],
    ...identityFields
      .filter(([key]) => key !== 'firstName')
      .map(([key, label]) => [label, draft[key]]),
    ['Personnalité', draft.personality],
    ['Description physique', draft.appearance],
    ['Face claim', draft.faceClaim],
    ...(draft.profile === 'student'
      ? [
          [
            'Filière',
            draft.major === 'other' ? draft.majorProposal : draft.major,
          ],
          [
            'Boursier',
            draft.scholarship && (draft.scholarship === 'yes' ? 'Oui' : 'Non'),
          ],
          ['Clubs', draft.clubs.filter(Boolean).join(', ')],
        ]
      : []),
    ['Histoire', draft.story],
    ['Anecdotes', draft.anecdotes],
    ['Liens RP', draft.relations],
    ['Avertissements de contenu', draft.warnings],
  ];

  return (
    <dl className="draft-summary">
      {fields
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export function CharacterWizardPage() {
  const [params] = useSearchParams();
  const { reviews } = useDemo();
  const reviewId = params.get('fiche');
  const record = reviews.find(
    (item) => item.id === reviewId && item.status === 'changes',
  );
  if (reviewId && !record)
    return (
      <div className="demo-page">
        <DemoHeading title="Fiche indisponible" />
        <Link className="text-link" to="/preview/characters">
          Voir mes fiches
        </Link>
      </div>
    );
  const proposeMajor = params.get('major') === 'other';
  return (
    <CharacterWizard
      key={record?.id ?? String(proposeMajor)}
      record={record}
      proposeMajor={proposeMajor}
    />
  );
}

function CharacterWizard({
  record,
  proposeMajor,
}: {
  record?: Review;
  proposeMajor: boolean;
}) {
  const { submit, capacity } = useDemo();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CharacterDraft>(
    () =>
      record?.draft ?? { ...emptyDraft, major: proposeMajor ? 'other' : '' },
  );
  const [step, setStep] = useState(0);
  const [fieldError, setFieldError] = useState<'name' | 'majorProposal'>();
  const [submitted, setSubmitted] = useState(false);
  const formId = useId();
  const title = record ? 'Corriger ma fiche' : 'Créer un personnage';

  function update<Key extends keyof CharacterDraft>(
    key: Key,
    value: CharacterDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (fieldError === key) setFieldError(undefined);
  }

  function goTo(index: number) {
    setFieldError(undefined);
    setStep(index);
    document.getElementById(formId)?.focus();
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0 && !demoName.safeParse(draft.name).success) {
      setFieldError('name');
      document.getElementById('name')?.focus();
      return;
    }
    if (
      step === 2 &&
      draft.profile === 'student' &&
      draft.major === 'other' &&
      !demoProposal.safeParse(draft.majorProposal).success
    ) {
      setFieldError('majorProposal');
      document.getElementById('majorProposal')?.focus();
      return;
    }
    if (step < steps.length - 1) {
      goTo(step + 1);
      return;
    }
    if (!record && !capacity.available) return;
    submit(
      { ...draft, name: draft.name.trim(), firstName: draft.firstName.trim() },
      record?.id,
    );
    if (record) void navigate('/preview/characters');
    else setSubmitted(true);
    toast.success('Fiche ajoutée à la file de validation');
  }

  function textField(key: TextFieldKey, label: string, hint?: string) {
    return (
      <Field name={key} label={label} hint={hint}>
        <textarea
          id={key}
          rows={3}
          aria-describedby={hint ? `${key}-hint` : undefined}
          value={draft[key]}
          onChange={(event) => update(key, event.target.value)}
        />
      </Field>
    );
  }

  if (submitted)
    return (
      <div className="demo-page">
        <DemoHeading title={title} />
        <section
          aria-label="Confirmation"
          className="demo-panel demo-panel-copy demo-wizard-result"
        >
          <h2 role="status">Fiche soumise</h2>
          <Button asChild>
            <Link to="/preview/characters">Suivre ma fiche</Link>
          </Button>
          <Link to="/preview/staff" className="text-link">
            Voir la file de validation
          </Link>
        </section>
      </div>
    );

  if (!record && !capacity.available)
    return (
      <div className="demo-page">
        <DemoHeading
          title={title}
          description="Aucun emplacement disponible."
        />
        <Link className="text-link" to="/preview/characters">
          Voir mes personnages
        </Link>
      </div>
    );

  return (
    <div className="demo-page">
      <DemoHeading
        title={title}
        description="Décrivez un personnage fictif. N’utilisez aucune donnée personnelle réelle."
      />
      {record?.note && (
        <p className="demo-panel demo-panel-copy">{record.note}</p>
      )}
      <ol className="wizard-steps" aria-label="Étapes de création">
        {steps.map((label, index) => (
          <li key={label} aria-current={index === step ? 'step' : undefined}>
            <span aria-hidden="true">{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <form
        id={formId}
        tabIndex={-1}
        className="demo-panel wizard-form"
        onSubmit={next}
        noValidate
      >
        <h2>{steps[step]}</h2>
        {step === 0 && (
          <div className="demo-form-grid identity-fields">
            <Field
              name="name"
              label="Nom du personnage (obligatoire)"
              error={
                fieldError === 'name'
                  ? 'Saisissez un nom de personnage fictif.'
                  : undefined
              }
            >
              <Input
                id="name"
                value={draft.name}
                required
                maxLength={80}
                aria-invalid={fieldError === 'name'}
                aria-describedby={
                  fieldError === 'name' ? 'name-error' : undefined
                }
                onChange={(event) => update('name', event.target.value)}
              />
            </Field>
            {identityFields.map(([key, label, type]) => (
              <Field name={key} label={label} key={key}>
                <Input
                  id={key}
                  type={type ?? 'text'}
                  value={draft[key]}
                  onChange={(event) => update(key, event.target.value)}
                />
              </Field>
            ))}
            <Field name="profile" label="Type de profil">
              <select
                id="profile"
                value={draft.profile}
                onChange={(event) =>
                  update('profile', event.target.value as CharacterType)
                }
              >
                {Object.entries(characterTypes).map(([type, label]) => (
                  <option value={type} key={type}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="demo-form-grid">
            {textField(
              'personality',
              'Personnalité',
              'Le modèle de fiche demande au moins cinq lignes.',
            )}
            {textField(
              'appearance',
              'Description physique',
              'Le modèle de fiche demande au moins cinq lignes.',
            )}
            {textField('faceClaim', 'Face claim (description uniquement)')}
          </div>
        )}
        {step === 2 &&
          (draft.profile === 'student' ? (
            <div className="demo-form-grid">
              <Field name="major" label="Filière">
                <select
                  id="major"
                  value={draft.major}
                  onChange={(event) => update('major', event.target.value)}
                >
                  <option value="">Choisir une filière</option>
                  {majors.map((major) => (
                    <option key={major}>{major}</option>
                  ))}
                  <option value="other">Proposer une autre filière</option>
                </select>
              </Field>
              {draft.major === 'other' && (
                <Field
                  name="majorProposal"
                  label="Filière proposée (obligatoire)"
                  error={
                    fieldError === 'majorProposal'
                      ? 'Saisissez le nom de la filière proposée.'
                      : undefined
                  }
                >
                  <Input
                    id="majorProposal"
                    required
                    value={draft.majorProposal}
                    maxLength={100}
                    aria-invalid={fieldError === 'majorProposal'}
                    aria-describedby={
                      fieldError === 'majorProposal'
                        ? 'majorProposal-error'
                        : undefined
                    }
                    onChange={(event) =>
                      update('majorProposal', event.target.value)
                    }
                  />
                </Field>
              )}
              <Field name="scholarship" label="Boursier">
                <select
                  id="scholarship"
                  value={draft.scholarship}
                  onChange={(event) =>
                    update(
                      'scholarship',
                      event.target.value as CharacterDraft['scholarship'],
                    )
                  }
                >
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </Field>
              <fieldset className="wizard-clubs">
                <legend>Clubs, deux au maximum</legend>
                {Array.from({ length: maxCharacterClubs }, (_, index) => (
                  <Field
                    key={index}
                    name={`club-${index + 1}`}
                    label={`Club ${index + 1}`}
                  >
                    <select
                      id={`club-${index + 1}`}
                      value={draft.clubs[index] ?? ''}
                      onChange={(event) =>
                        update(
                          'clubs',
                          Array.from(
                            { length: maxCharacterClubs },
                            (_, slot) =>
                              slot === index
                                ? event.target.value
                                : (draft.clubs[slot] ?? ''),
                          ),
                        )
                      }
                    >
                      <option value="">Aucun</option>
                      {confirmedClubs
                        .filter(
                          ({ name }) =>
                            !draft.clubs.some(
                              (selected, slot) =>
                                slot !== index && selected === name,
                            ),
                        )
                        .map(({ name }) => (
                          <option key={name}>{name}</option>
                        ))}
                    </select>
                  </Field>
                ))}
              </fieldset>
              <p className="demo-aside">
                Le staff attribue la House à la validation.
              </p>
            </div>
          ) : (
            <p>La rubrique universitaire s’applique aux étudiants.</p>
          ))}
        {step === 3 && (
          <div className="demo-form-grid">
            {textField(
              'story',
              'Histoire',
              'Le modèle de fiche demande au moins dix lignes.',
            )}
            {textField('anecdotes', 'Anecdotes')}
            {textField('relations', 'Liens RP')}
            {textField('warnings', 'Avertissements de contenu')}
          </div>
        )}
        {step === 4 && <DraftSummary draft={draft} />}
        <div className="wizard-actions">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => goTo(step - 1)}
            >
              Précédent
            </Button>
          )}
          <Button type="submit">
            {step === steps.length - 1 ? 'Soumettre ma fiche' : 'Suivant'}
          </Button>
        </div>
      </form>
    </div>
  );
}
