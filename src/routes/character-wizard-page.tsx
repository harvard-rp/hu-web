import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { emptyDraft, majors, type CharacterDraft } from '@/features/demo/data';
import { useDemo } from '@/features/demo/demo-state';
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

function Field({
  name,
  label,
  children,
  error,
}: {
  name: string;
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="demo-field">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const recapFields = [
  ['identity', 'Identité et pronoms'],
  ['personality', 'Présentation et personnalité'],
  ['appearance', 'Description physique'],
  ['faceClaim', 'Face claim'],
  ['major', 'Filière'],
  ['majorProposal', 'Filière proposée'],
  ['academic', 'Parcours universitaire'],
  ['story', 'Histoire'],
  ['anecdotes', 'Anecdotes'],
  ['relations', 'Relations RP'],
  ['warnings', 'Avertissements de contenu'],
] as const;

export function DraftSummary({ draft }: { draft: CharacterDraft }) {
  const visibleFields = recapFields.filter(
    ([key]) =>
      draft[key] &&
      !(
        draft.profile === 'non-student' &&
        ['major', 'majorProposal', 'academic'].includes(key)
      ) &&
      !(key === 'majorProposal' && draft.major !== 'other'),
  );
  return (
    <dl className="draft-summary">
      <div>
        <dt>Nom du personnage</dt>
        <dd>{draft.name}</dd>
      </div>
      <div>
        <dt>Type de profil</dt>
        <dd>{draft.profile === 'student' ? 'Étudiant' : 'Non étudiant'}</dd>
      </div>
      {visibleFields.map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>
            {key === 'major' && draft.major === 'other'
              ? 'Autre filière'
              : draft[key]}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CharacterWizardPage() {
  const [params] = useSearchParams();
  const { submit } = useDemo();
  const [draft, setDraft] = useState<CharacterDraft>(() => ({
    ...emptyDraft,
    major: params.get('major') === 'other' ? 'other' : '',
  }));
  const [step, setStep] = useState(0);
  const [fieldError, setFieldError] = useState<'name' | 'majorProposal'>();
  const [submitted, setSubmitted] = useState(false);

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
    document.getElementById('wizard-form')?.focus();
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
    const academicFields =
      draft.profile === 'student'
        ? {
            major: draft.major,
            academic: draft.academic,
            majorProposal:
              draft.major === 'other' ? draft.majorProposal.trim() : '',
          }
        : { major: '', majorProposal: '', academic: '' };
    submit({ ...draft, ...academicFields, name: draft.name.trim() });
    setSubmitted(true);
    toast.success('Fiche fictive envoyée à la file de simulation');
  }

  function textField(
    key: keyof Omit<CharacterDraft, 'profile'>,
    label: string,
  ) {
    return (
      <Field name={key} label={label}>
        <textarea
          id={key}
          rows={3}
          maxLength={600}
          value={draft[key]}
          onChange={(event) => update(key, event.target.value)}
        />
      </Field>
    );
  }

  return (
    <div className="demo-page">
      <DemoHeading
        section="Vie étudiante"
        title="Créer une fiche RP"
        description="Écrivez uniquement au sujet d’un personnage fictif. La fiche reste dans cette session de démonstration."
      />
      {submitted ? (
        <section
          role="status"
          className="demo-panel demo-panel-copy demo-wizard-result"
        >
          <h2>Fiche fictive soumise</h2>
          <p>Retrouvez-la dans la file de validation simulée.</p>
          <Button asChild>
            <Link to="/preview/staff">Ouvrir l’espace staff</Link>
          </Button>
        </section>
      ) : (
        <>
          <ol className="wizard-steps" aria-label="Étapes de création">
            {steps.map((label, index) => (
              <li
                key={label}
                aria-current={index === step ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <form
            id="wizard-form"
            tabIndex={-1}
            className="demo-panel wizard-form"
            onSubmit={next}
            noValidate
          >
            <h2>{steps[step]}</h2>
            {step === 0 && (
              <div className="demo-form-grid">
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
                <Field name="profile" label="Type de profil">
                  <select
                    id="profile"
                    value={draft.profile}
                    onChange={(event) =>
                      update(
                        'profile',
                        event.target.value === 'non-student'
                          ? 'non-student'
                          : 'student',
                      )
                    }
                  >
                    <option value="student">Étudiant</option>
                    <option value="non-student">Non étudiant</option>
                  </select>
                </Field>
                {textField('identity', 'Identité et pronoms du personnage')}
              </div>
            )}
            {step === 1 && (
              <div className="demo-form-grid">
                {textField('personality', 'Présentation et personnalité')}
                {textField('appearance', 'Description physique')}
                {textField(
                  'faceClaim',
                  'Face claim (description fictive, sans photo ni lien)',
                )}
              </div>
            )}
            {step === 2 && (
              <div className="demo-form-grid">
                {draft.profile === 'student' ? (
                  <>
                    <Field name="major" label="Filière">
                      <select
                        id="major"
                        value={draft.major}
                        onChange={(event) =>
                          update('major', event.target.value)
                        }
                      >
                        <option value="">Sélection facultative</option>
                        {majors.map((major) => (
                          <option key={major}>{major}</option>
                        ))}
                        <option value="other">
                          Proposer une autre filière
                        </option>
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
                    {textField('academic', 'Parcours universitaire fictif')}
                  </>
                ) : (
                  <p>
                    Les informations universitaires sont facultatives pour ce
                    type de profil dans le prototype.
                  </p>
                )}
                <p className="demo-aside">
                  La House est attribuée par le staff lors de la validation.
                </p>
              </div>
            )}
            {step === 3 && (
              <div className="demo-form-grid">
                {textField('story', 'Histoire')}
                {textField('anecdotes', 'Anecdotes')}
                {textField('relations', 'Relations RP')}
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
                {step === steps.length - 1
                  ? 'Soumettre la fiche fictive'
                  : 'Suivant'}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
