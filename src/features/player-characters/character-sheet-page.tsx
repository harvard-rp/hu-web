import { ReviewHistory, SheetFields } from './sheet-display';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/services/api-error';
import {
  characterId as idSchema,
  type CharacterCatalog,
  type CharacterDetail,
  type CharacterReviews,
} from '@/lib/services/character-contract';
import {
  CharacterError,
  CharacterState,
  Screen,
  canEdit,
  characterName,
  kindLabel,
} from './character-ui';
import { ExitDialog, useExitGuard } from './exit-guard';
import {
  usePlayerMutation,
  usePlayerQuery,
  type PlayerSession,
} from './player-queries';
import {
  catalogName,
  changedFields,
  fieldConstraint,
  fieldsFor,
  missingForSubmission,
  sheetSections,
  sheetValues,
  validatePatch,
  type Field,
} from './sheet-fields';

const back = { to: '/account', label: 'Retour à mes personnages' };

export function CharacterSheetRoute({
  session,
  editing = false,
}: {
  session: PlayerSession;
  editing?: boolean;
}) {
  const id = useParams().characterId;
  if (!idSchema.safeParse(id).success || !id)
    return <Screen title="Personnage introuvable" back={back} />;
  return (
    <CharacterSheet
      key={`${id}-${editing}`}
      id={id}
      session={session}
      editing={editing}
    />
  );
}

function CharacterSheet({
  id,
  session,
  editing,
}: {
  id: string;
  session: PlayerSession;
  editing: boolean;
}) {
  const { controller, scope } = session;
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.characterRequest(
        scope,
        async (api, token, signal) => {
          const [sheet, reviews, houses, programs] = await Promise.all([
            api.detail(token, signal, id),
            api.reviews(token, signal, id),
            api.houses(token, signal),
            api.programs(token, signal),
          ]);
          return {
            sheet: sheet.data,
            reviews: reviews.data,
            houses: houses.data,
            programs: programs.data,
          };
        },
        signal,
      ),
    [controller, scope, id],
  );
  const { state, retry } = usePlayerQuery(load);

  if (state.kind === 'loading')
    return (
      <Screen title="Fiche de personnage" back={back}>
        <p role="status">Chargement de la fiche…</p>
      </Screen>
    );
  if (state.kind === 'error')
    return (
      <Screen title="Fiche de personnage" back={back}>
        <CharacterError error={state.error} retry={retry} />
      </Screen>
    );
  const { sheet, houses, programs, reviews } = state.data;
  if (editing && canEdit(sheet))
    return (
      <SheetEditor
        initial={sheet}
        houses={houses}
        programs={programs}
        reviews={reviews}
        session={session}
      />
    );
  return (
    <SheetDetails
      initial={sheet}
      lockedEditor={editing}
      houses={houses}
      programs={programs}
      reviews={reviews}
      session={session}
      reload={retry}
    />
  );
}

type SheetProps = {
  initial: CharacterDetail;
  houses: CharacterCatalog;
  programs: CharacterCatalog;
  reviews: CharacterReviews;
  session: PlayerSession;
};

function SheetDetails({
  initial,
  lockedEditor,
  houses,
  programs,
  reviews,
  session,
  reload,
}: SheetProps & { lockedEditor: boolean; reload: () => void }) {
  const [sheet, setSheet] = useState(initial);
  const [submissionAttempt, setSubmissionAttempt] = useState(false);
  const mutation = usePlayerMutation(session);
  const missing = missingForSubmission(sheet);
  const stale =
    mutation.failure?.error instanceof ApiError &&
    ['CHARACTER_REVISION_CONFLICT', 'CHARACTER_LOCKED'].includes(
      mutation.failure.error.code ?? '',
    );

  function submit() {
    setSubmissionAttempt(true);
    if (missing.length) return;
    void mutation.run(
      (api, token, signal) =>
        api.submit(token, signal, sheet.id, sheet.revision),
      ({ data }) => {
        setSheet(data);
        setSubmissionAttempt(false);
      },
    );
  }

  return (
    <Screen title={characterName(sheet)} back={back}>
      <div className="player-section-bar">
        <div>
          <p className="player-muted">{kindLabel[sheet.kind]}</p>
          <CharacterState character={sheet} />
        </div>
        {canEdit(sheet) && (
          <div className="player-actions">
            <Button asChild variant="outline">
              <Link to={`/account/characters/${sheet.id}/edit`}>
                Modifier la fiche
              </Link>
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={mutation.pending || stale}
            >
              Soumettre la fiche au staff
            </Button>
          </div>
        )}
      </div>
      {lockedEditor && <p role="status">Cette fiche est verrouillée.</p>}
      {submissionAttempt && missing.length > 0 && (
        <p className="player-notice" role="alert">
          Champs requis pour la soumission · {missing.join(', ')}.
        </p>
      )}
      {mutation.pending && <p role="status">Soumission en cours…</p>}
      {mutation.failure && (
        <CharacterError
          error={mutation.failure.error}
          retry={stale ? reload : undefined}
        />
      )}
      <section
        className="player-surface player-panel"
        aria-labelledby="sheet-details"
      >
        <h2 id="sheet-details">Fiche</h2>
        <SheetFields sheet={sheet} houses={houses} programs={programs} />
      </section>
      <ReviewHistory reviews={reviews} houses={houses} />
    </Screen>
  );
}

function SheetEditor({
  initial,
  houses,
  programs,
  reviews,
  session,
}: SheetProps) {
  const [sheet, setSheet] = useState(initial);
  const [values, setValues] = useState(() => sheetValues(initial));
  const [invalid, setInvalid] = useState<Field[]>([]);
  const [formError, setFormError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [inspect, setInspect] = useState(false);
  const mutation = usePlayerMutation(session);
  const navigate = useNavigate();
  const changes = changedFields(sheet, values);
  const dirty = Object.keys(changes).length > 0;
  const missing = missingForSubmission(sheet);
  const guard = useExitGuard(dirty || mutation.pending, session.scope.signal);
  const detailPath = `/account/characters/${sheet.id}`;
  const needsReload =
    mutation.failure?.error instanceof ApiError &&
    ['CHARACTER_REVISION_CONFLICT', 'CHARACTER_LOCKED'].includes(
      mutation.failure.error.code ?? '',
    );
  const { controller, scope } = session;
  const loadLatest = useCallback(
    (signal: AbortSignal) =>
      controller.characterRequest(
        scope,
        async (api, token, signal) =>
          (await api.detail(token, signal, sheet.id)).data,
        signal,
      ),
    [controller, scope, sheet.id],
  );
  const latest = usePlayerQuery(loadLatest, inspect);

  function change(field: Field, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setInvalid((previous) => previous.filter((key) => key !== field));
    setFormError('');
    setAnnouncement('');
  }

  function save() {
    if (!dirty || needsReload) return;
    const result = validatePatch(sheet, changes);
    if (result.kind === 'invalid') {
      setInvalid(result.fields);
      setFormError('Vérifiez les valeurs des champs indiqués.');
      if (result.fields[0]) document.getElementById(result.fields[0])?.focus();
      return;
    }
    if (result.kind === 'too-large') {
      setFormError(
        'La fiche dépasse la taille maximale de 96 Kio. Raccourcissez les textes.',
      );
      return;
    }
    setFormError('');
    setAnnouncement('');
    void mutation.run(
      (api, token, signal) =>
        api.edit(token, signal, sheet.id, sheet.revision, result.data),
      ({ data }) => {
        setSheet(data);
        setValues(sheetValues(data));
        setAnnouncement('Fiche enregistrée.');
      },
    );
  }

  function submit() {
    if (dirty || needsReload) return;
    if (missing.length) {
      setFormError(`Champs requis pour la soumission · ${missing.join(', ')}.`);
      return;
    }
    setFormError('');
    setAnnouncement('');
    void mutation.run(
      (api, token, signal) =>
        api.submit(token, signal, sheet.id, sheet.revision),
      () => {
        guard.allowExit();
        void navigate(detailPath, { replace: true });
      },
    );
  }

  function adopt(remote: CharacterDetail) {
    setSheet(remote);
    setValues(sheetValues(remote));
    setInspect(false);
    setFormError('');
    setInvalid([]);
    mutation.clearError();
    setAnnouncement('Version distante chargée.');
  }

  return (
    <Screen
      title="Modifier la fiche"
      back={{ to: detailPath, label: 'Retour à la fiche' }}
    >
      <div>
        <p className="player-muted">
          {characterName(sheet)} · {kindLabel[sheet.kind]}
        </p>
        <CharacterState character={sheet} />
      </div>
      <p className="player-muted">
        Saisissez uniquement les informations d’un personnage fictif. Le
        brouillon peut rester incomplet.
      </p>
      <form
        id="player-sheet-form"
        className="player-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <fieldset
          disabled={mutation.pending || !canEdit(sheet)}
          className="player-form"
        >
          {sheetSections.map(({ title, fields }) => {
            const visible = fieldsFor(sheet.kind, fields);
            const showHouse =
              title === 'Université' &&
              (sheet.kind === 'student' || sheet.houseId !== null);
            if (!visible.length && !showHouse) return null;
            return (
              <section className="player-surface player-panel" key={title}>
                <h2>{title}</h2>
                <div className="player-field-grid">
                  {visible.map(({ field, label, control }) => {
                    const constraint = fieldConstraint(field);
                    const error = invalid.includes(field);
                    const hint = error
                      ? `Valeur invalide. ${constraint ?? 'Vérifiez le format.'}`
                      : control === 'list'
                        ? constraint
                        : undefined;
                    const props = {
                      id: field,
                      value: values[field],
                      'aria-invalid': error || undefined,
                      'aria-describedby': hint ? `${field}-hint` : undefined,
                    };
                    return (
                      <div
                        className="player-field"
                        key={field}
                        data-wide={
                          control === 'textarea' ||
                          control === 'list' ||
                          undefined
                        }
                      >
                        <Label htmlFor={field}>{label}</Label>
                        {control === 'textarea' || control === 'list' ? (
                          <textarea
                            {...props}
                            rows={field === 'backstory' ? 10 : 4}
                            onChange={(event) =>
                              change(field, event.target.value)
                            }
                          />
                        ) : control === 'program' ? (
                          <select
                            {...props}
                            onChange={(event) =>
                              change(field, event.target.value)
                            }
                          >
                            <option value="">Aucune filière</option>
                            {values.programId &&
                              !programs.some(
                                (item) => item.id === values.programId,
                              ) && (
                                <option value={values.programId} disabled>
                                  Filière hors catalogue
                                </option>
                              )}
                            {programs.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        ) : control === 'scholarship' ? (
                          <select
                            {...props}
                            onChange={(event) =>
                              change(field, event.target.value)
                            }
                          >
                            <option value="">Non renseigné</option>
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        ) : (
                          <Input
                            {...props}
                            type={control ?? 'text'}
                            onChange={(event) =>
                              change(field, event.target.value)
                            }
                          />
                        )}
                        {hint && (
                          <p
                            className={error ? 'field-error' : 'player-muted'}
                            id={`${field}-hint`}
                          >
                            {hint}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {showHouse && (
                    <div className="player-field">
                      <strong>House</strong>
                      <p>
                        {sheet.houseId
                          ? catalogName(
                              houses,
                              sheet.houseId,
                              'House hors catalogue',
                            )
                          : 'Attribuée par le staff lors de la validation.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </fieldset>
        {formError && (
          <p role="alert" className="player-notice">
            {formError}
          </p>
        )}
        {mutation.failure && <CharacterError error={mutation.failure.error} />}
        {needsReload && !inspect && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              latest.retry();
              setInspect(true);
            }}
          >
            Consulter la version distante
          </Button>
        )}
        {inspect && (
          <section
            className="player-surface player-panel"
            aria-labelledby="latest-title"
          >
            <h2 id="latest-title">Version distante</h2>
            {latest.state.kind === 'loading' && (
              <p role="status">Chargement de la version distante…</p>
            )}
            {latest.state.kind === 'error' && (
              <CharacterError error={latest.state.error} retry={latest.retry} />
            )}
            {latest.state.kind === 'ready' && (
              <>
                <CharacterState character={latest.state.data} />
                <SheetFields
                  sheet={latest.state.data}
                  houses={houses}
                  programs={programs}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (latest.state.kind === 'ready') adopt(latest.state.data);
                  }}
                >
                  {dirty
                    ? 'Abandonner mes modifications et charger cette version'
                    : 'Charger cette version'}
                </Button>
              </>
            )}
          </section>
        )}
        <div className="player-surface player-panel">
          <p role="status">
            {mutation.pending
              ? 'Enregistrement de la demande…'
              : announcement ||
                (dirty ? 'Modifications non enregistrées.' : '')}
          </p>
          {!canEdit(sheet) && <p>Cette fiche est verrouillée.</p>}
          <div className="player-actions">
            <Button
              type="submit"
              disabled={
                !dirty || needsReload || mutation.pending || !canEdit(sheet)
              }
            >
              Enregistrer le brouillon
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                dirty || needsReload || mutation.pending || !canEdit(sheet)
              }
              onClick={submit}
            >
              Soumettre la fiche au staff
            </Button>
          </div>
        </div>
      </form>
      <ReviewHistory reviews={reviews} houses={houses} />
      <ExitDialog blocker={guard.blocker} working={mutation.pending} />
    </Screen>
  );
}
