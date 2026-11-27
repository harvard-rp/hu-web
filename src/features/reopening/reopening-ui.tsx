import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  CharacterError,
  charactersDate,
  isUncertain,
} from '@/features/player-characters/character-ui';
import {
  ExitDialog,
  useExitGuard,
} from '@/features/player-characters/exit-guard';
import { ApiError } from '@/lib/services/api-error';
import type { CharacterDetail } from '@/lib/services/character-contract';
import {
  ownerReopeningInput,
  staffReopeningInput,
  type OwnerReopeningInput,
  type StaffReopeningInput,
  type ReopeningHistory,
} from '@/lib/services/reopening-contract';

export function ReopeningTimeline({ history }: { history: ReopeningHistory }) {
  return (
    <section
      className="player-surface player-panel"
      aria-labelledby="reopening-timeline"
    >
      <h2 id="reopening-timeline">Demandes de réouverture</h2>
      {history.length ? (
        <ol className="player-reviews">
          {history.map((entry) => (
            <li key={entry.requestId}>
              <div className="player-section-bar">
                <strong>
                  {entry.decision === 'accepted'
                    ? 'Acceptée'
                    : entry.decision === 'declined'
                      ? 'Refusée'
                      : 'En attente'}
                </strong>
                <time dateTime={entry.requestedAt}>
                  {charactersDate.format(new Date(entry.requestedAt))}
                </time>
              </div>
              <p className="player-prose">{entry.reason}</p>
              {entry.decidedAt && (
                <p className="player-muted">
                  Décision du{' '}
                  <time dateTime={entry.decidedAt}>
                    {charactersDate.format(new Date(entry.decidedAt))}
                  </time>
                </p>
              )}
              {entry.justification && (
                <p className="player-prose">{entry.justification}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p>Aucune demande de réouverture.</p>
      )}
    </section>
  );
}

type CommonForm = {
  sheet: CharacterDetail;
  signal: AbortSignal;
  check: (
    signal: AbortSignal,
  ) => Promise<{ sheet: CharacterDetail | null; history: ReopeningHistory }>;
  finished: () => void;
  reload: () => void;
};
type FormProps = CommonForm &
  (
    | {
        pendingId?: never;
        send: (
          input: OwnerReopeningInput,
          signal: AbortSignal,
        ) => Promise<unknown>;
      }
    | {
        pendingId: string;
        send: (
          input: StaffReopeningInput,
          signal: AbortSignal,
        ) => Promise<unknown>;
      }
  );
type Input = OwnerReopeningInput | StaffReopeningInput;

export function ReopeningForm(props: FormProps) {
  const [text, setText] = useState('');
  const [decision, setDecision] =
    useState<StaffReopeningInput['decision']>('accepted');
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<unknown>();
  const [checkRequired, setCheckRequired] = useState(false);
  const [reloadRequired, setReloadRequired] = useState(false);
  const [notice, setNotice] = useState('');
  const attempt = useRef<Input>(undefined);
  const request = useRef<AbortController>(null);
  const guard = useExitGuard(!!text || pending, props.signal);
  const staff = props.pendingId !== undefined;
  const label = staff ? 'Justification' : 'Motif de la demande';

  useEffect(() => () => request.current?.abort(), []);

  async function run(operation: (signal: AbortSignal) => Promise<void>) {
    if (request.current || props.signal.aborted) return;
    const current = new AbortController();
    request.current = current;
    setPending(true);
    try {
      await operation(current.signal);
    } finally {
      request.current = null;
      if (!current.signal.aborted && !props.signal.aborted) setPending(false);
    }
  }

  function prepare() {
    if (checkRequired || reloadRequired) return;
    const input =
      props.pendingId !== undefined
        ? staffReopeningInput.safeParse({
            requestId: props.pendingId,
            expectedRevision: props.sheet.revision,
            decision,
            justification: text.trim(),
          })
        : ownerReopeningInput.safeParse({
            requestId: attempt.current?.requestId ?? crypto.randomUUID(),
            expectedRevision: props.sheet.revision,
            reason: text.trim(),
          });
    if (!input.success) {
      setInvalid(true);
      document.getElementById('reopening-message')?.focus();
      return;
    }
    attempt.current = input.data;
    setError(undefined);
    setOpen(true);
  }

  function save() {
    const input = attempt.current;
    if (!input) return;
    void run(async (signal) => {
      setOpen(false);
      setNotice('');
      try {
        if (props.pendingId !== undefined && 'decision' in input)
          await props.send(input, signal);
        if (props.pendingId === undefined && 'reason' in input)
          await props.send(input, signal);
        if (!signal.aborted && !props.signal.aborted) {
          guard.allowExit();
          props.finished();
        }
      } catch (failure) {
        if (signal.aborted || props.signal.aborted) return;
        setError(failure);
        if (
          isUncertain(failure) ||
          (failure instanceof ApiError &&
            [
              'CHARACTER_REOPENING_CONFLICT',
              'CHARACTER_REVISION_CONFLICT',
              'CHARACTER_NOT_FOUND',
            ].includes(failure.code ?? ''))
        )
          setCheckRequired(true);
      }
    });
  }

  function verify() {
    const input = attempt.current;
    if (!input) return;
    void run(async (signal) => {
      try {
        const actual = await props.check(signal);
        if (signal.aborted || props.signal.aborted) return;
        const prior = actual.history.find(
          ({ requestId }) => requestId === input.requestId,
        );
        if (prior && ('decision' in input ? prior.decision !== null : true)) {
          const matches =
            'decision' in input
              ? prior.decision === input.decision &&
                prior.justification === input.justification
              : prior.reason === input.reason &&
                prior.requestedRevision ===
                  input.expectedRevision.toLowerCase();
          if (matches) {
            // Refresh the observed state without claiming who wrote it.
            guard.allowExit();
            props.finished();
            return;
          }
          setError(undefined);
          setCheckRequired(false);
          setReloadRequired(true);
          setNotice(
            'L’historique contient une autre décision ou demande. Relisez le dossier.',
          );
          return;
        }
        setError(undefined);
        setCheckRequired(false);
        if (
          actual.sheet?.revision !== input.expectedRevision ||
          (staff ? !prior : !actual.sheet.actions.canRequestReopening)
        ) {
          setReloadRequired(true);
          setNotice(
            'L’état de la fiche a changé. Relisez le dossier avant toute nouvelle action.',
          );
        } else {
          setNotice(
            'La fiche et la demande ont été vérifiées. Vous pouvez confirmer une nouvelle tentative.',
          );
        }
      } catch (failure) {
        if (!signal.aborted && !props.signal.aborted) setError(failure);
      }
    });
  }

  return (
    <section
      className="player-surface player-panel"
      aria-labelledby="reopening-form"
    >
      <h2 id="reopening-form">
        {staff ? 'Traiter la demande' : 'Demander une réouverture'}
      </h2>
      <p>
        {staff
          ? 'Une acceptation remet la fiche en brouillon si le joueur dispose d’un emplacement.'
          : 'Vous pouvez déposer une demande même si tous vos emplacements sont occupés. La demande ne réserve aucune place.'}
      </p>
      {invalid && (
        <p role="alert">Saisissez un texte de 1 à 2 000 caractères.</p>
      )}
      {error !== undefined && (
        <CharacterError
          error={error}
          message={
            error instanceof ApiError &&
            error.code === 'CHARACTER_CAPACITY_REACHED'
              ? 'Le joueur n’a aucun emplacement disponible. La demande reste en attente.'
              : isUncertain(error)
                ? 'Le résultat est incertain. Vérifiez la fiche et l’historique avant toute nouvelle tentative.'
                : undefined
          }
        />
      )}
      {notice && <p role="status">{notice}</p>}
      {pending && <p role="status">Requête en cours…</p>}
      {checkRequired && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={verify}
        >
          Vérifier la fiche et l’historique
        </Button>
      )}
      {reloadRequired && (
        <Button type="button" variant="outline" onClick={props.reload}>
          Relire le dossier
        </Button>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          prepare();
        }}
      >
        <fieldset
          className="player-form"
          disabled={pending || checkRequired || reloadRequired}
        >
          {staff && (
            <div className="player-field">
              <Label htmlFor="reopening-decision">Décision proposée</Label>
              <select
                id="reopening-decision"
                value={decision}
                onChange={(event) =>
                  setDecision(
                    event.target.value === 'declined' ? 'declined' : 'accepted',
                  )
                }
              >
                <option value="accepted">Accepter la réouverture</option>
                <option value="declined">Refuser la réouverture</option>
              </select>
            </div>
          )}
          <div className="player-field">
            <Label htmlFor="reopening-message">{label}</Label>
            <textarea
              id="reopening-message"
              rows={5}
              aria-required="true"
              aria-invalid={invalid || undefined}
              aria-describedby="reopening-message-hint"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setInvalid(false);
              }}
            />
            <p id="reopening-message-hint" className="player-muted">
              2 000 caractères maximum.
            </p>
          </div>
          <div className="player-actions">
            <Button type="submit">
              Vérifier {staff ? 'la décision' : 'la demande'}
            </Button>
          </div>
        </fieldset>
      </form>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmer {staff ? 'la décision' : 'la demande'}
            </DialogTitle>
            <DialogDescription>
              {staff
                ? decision === 'accepted'
                  ? 'La fiche redeviendra un brouillon et occupera un emplacement.'
                  : 'La fiche restera dans les archives.'
                : 'Le staff pourra lire votre motif. Votre fiche reste archivée pendant l’examen.'}
            </DialogDescription>
          </DialogHeader>
          <p className="player-prose staff-confirmation-comment">
            {text.trim()}
          </p>
          <div className="player-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Revenir au formulaire
            </Button>
            <Button
              type="button"
              variant={
                staff && decision === 'declined' ? 'destructive' : 'default'
              }
              onClick={save}
            >
              Confirmer l’envoi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ExitDialog blocker={guard.blocker} working={pending} />
    </section>
  );
}
