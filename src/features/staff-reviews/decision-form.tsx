import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
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
  characterName,
  isUncertain,
  validationLabel,
} from '@/features/player-characters/character-ui';
import {
  ExitDialog,
  useExitGuard,
} from '@/features/player-characters/exit-guard';
import { catalogName } from '@/features/player-characters/sheet-fields';
import { ApiError } from '@/lib/services/api-error';
import type {
  CharacterCatalog,
  CharacterDetail,
} from '@/lib/services/character-contract';
import {
  reviewCommentLimit,
  reviewInput,
  type ReviewInput,
} from '@/lib/services/staff-review-contract';
import { staffQueuePath, type ReviewSession } from './review-access';

const actionLabels = {
  approved: 'Valider',
  changes_requested: 'Demander des corrections',
  rejected: 'Refuser',
} as const;

type Recovery =
  | { kind: 'uncertain'; error: unknown }
  | { kind: 'changed'; error?: unknown }
  | {
      kind: 'closed';
      error?: unknown;
      latestDecision?: ReviewInput['decision'];
    }
  | { kind: 'verified'; message: string };

const messages: Partial<Record<NonNullable<ApiError['code']>, string>> = {
  CHARACTER_REVIEW_COMMENT_REQUIRED:
    'Un commentaire est obligatoire pour demander des corrections ou refuser la fiche.',
  CHARACTER_HOUSE_REQUIRED: 'Choisissez une House pour valider cet étudiant.',
  INVALID_CHARACTER_HOUSE:
    'Cette House ne peut plus être attribuée. Rechargez la fiche et le catalogue.',
  CHARACTER_NOT_SUBMITTED:
    'Une décision a déjà été enregistrée. La fiche n’est plus en attente.',
  CHARACTER_REVISION_CONFLICT:
    'La fiche a changé. Relisez la nouvelle version avant de prendre une décision.',
};

export function DecisionForm({
  session,
  sheet,
  houses,
  historySize,
  reload,
  onClosed,
}: {
  session: ReviewSession;
  sheet: CharacterDetail;
  houses: CharacterCatalog;
  historySize: number;
  reload: () => void;
  onClosed: () => void;
}) {
  const [decision, setDecision] = useState<ReviewInput['decision'] | ''>('');
  const [comment, setComment] = useState('');
  const [house, setHouse] = useState('');
  const [confirmation, setConfirmation] = useState<ReviewInput>();
  const [problem, setProblem] = useState<{
    message: string;
    field: 'decision' | 'comment' | 'house';
  }>();
  const [failure, setFailure] = useState<unknown>();
  const [recovery, setRecovery] = useState<Recovery>();
  const [busy, setBusy] = useState(false);
  const current = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const { controller, scope, grant } = session;
  const guard = useExitGuard(!!comment || busy, grant);
  const canAssign =
    sheet.kind === 'student' &&
    (decision === 'approved' || decision === 'changes_requested');
  const requiresHouse =
    sheet.kind === 'student' && decision === 'approved' && !sheet.houseId;
  const requiresComment =
    decision === 'changes_requested' || decision === 'rejected';

  useEffect(() => () => current.current?.abort(), []);

  function invalid(field: 'decision' | 'comment' | 'house', message: string) {
    setProblem({ field, message });
    document.getElementById('staff-' + field)?.focus();
  }

  function prepare() {
    if (current.current || (recovery && recovery.kind !== 'verified')) return;
    setFailure(undefined);
    const text = comment.trim();
    if (!decision) return invalid('decision', 'Choisissez une décision.');
    if (!text && requiresComment)
      return invalid(
        'comment',
        'Un commentaire est obligatoire pour cette décision.',
      );
    if (requiresHouse && !house)
      return invalid(
        'house',
        'Choisissez une House pour valider cet étudiant.',
      );
    const parsed = reviewInput.safeParse({
      expectedRevision: sheet.revision,
      decision,
      ...(text && { comment: text }),
      ...(canAssign && house && { houseId: house }),
    });
    if (!parsed.success)
      return invalid(
        'comment',
        `Le commentaire doit contenir au plus ${reviewCommentLimit.toLocaleString('fr-FR')} caractères et être valide.`,
      );
    setProblem(undefined);
    setConfirmation(parsed.data);
  }

  async function run(operation: (signal: AbortSignal) => Promise<void>) {
    if (current.current || grant.aborted) return;
    const request = new AbortController();
    current.current = request;
    setBusy(true);
    try {
      await operation(request.signal);
    } finally {
      current.current = null;
      if (!request.signal.aborted && !grant.aborted) setBusy(false);
    }
  }

  function save(input: ReviewInput) {
    void run(async (signal) => {
      setConfirmation(undefined);
      setRecovery(undefined);
      try {
        await controller.staffRequest(
          scope,
          grant,
          ({ staff }, token, signal) =>
            staff.decide(token, signal, sheet.id, input),
          signal,
        );
        if (signal.aborted || grant.aborted) return;
        guard.allowExit();
        void navigate(staffQueuePath, {
          replace: true,
          state: { reviewRecorded: true },
        });
      } catch (error) {
        if (signal.aborted || grant.aborted) return;
        if (
          error instanceof ApiError &&
          (error.code === 'CHARACTER_NOT_SUBMITTED' || error.status === 404)
        ) {
          setRecovery({ kind: 'closed', error });
          onClosed();
        } else if (
          error instanceof ApiError &&
          (error.code === 'CHARACTER_REVISION_CONFLICT' ||
            error.code === 'INVALID_CHARACTER_HOUSE')
        ) {
          setRecovery({ kind: 'changed', error });
        } else if (isUncertain(error)) {
          setRecovery({ kind: 'uncertain', error });
        } else {
          setFailure(error);
        }
      }
    });
  }

  function verify() {
    void run(async (signal) => {
      // Independent requests allow a revocation from either endpoint to abort the other immediately.
      const [latest, history] = await Promise.allSettled([
        controller.staffRequest(
          scope,
          grant,
          ({ staff }, token, signal) => staff.detail(token, signal, sheet.id),
          signal,
        ),
        controller.staffRequest(
          scope,
          grant,
          ({ staff }, token, signal) => staff.reviews(token, signal, sheet.id),
          signal,
        ),
      ]);
      if (signal.aborted || grant.aborted) return;
      if (
        latest.status === 'rejected' &&
        latest.reason instanceof ApiError &&
        latest.reason.status === 404
      ) {
        if (
          history.status === 'fulfilled' ||
          (history.reason instanceof ApiError && history.reason.status === 404)
        ) {
          setRecovery({
            kind: 'closed',
            error: latest.reason,
            latestDecision:
              history.status === 'fulfilled' &&
              history.value.data.length > historySize
                ? history.value.data.at(-1)?.decision
                : undefined,
          });
          onClosed();
        } else {
          setRecovery({ kind: 'uncertain', error: history.reason });
        }
        return;
      }
      if (latest.status === 'rejected' || history.status === 'rejected') {
        setRecovery({
          kind: 'uncertain',
          error:
            latest.status === 'rejected'
              ? latest.reason
              : history.status === 'rejected' && history.reason,
        });
        return;
      }
      const now = latest.value.data;
      if (
        now.revision !== sheet.revision ||
        history.value.data.length !== historySize
      ) {
        setRecovery({ kind: 'changed' });
      } else {
        setRecovery({
          kind: 'verified',
          message:
            'La fiche et l’historique sont inchangés. Vous pouvez confirmer une nouvelle tentative.',
        });
      }
    });
  }

  const blocked = !!recovery && recovery.kind !== 'verified';
  const recoveryMessage =
    recovery?.kind === 'closed'
      ? 'La fiche n’est plus accessible dans la file. Actualisez la file pour poursuivre.'
      : recovery?.kind === 'changed'
        ? 'La fiche ou son catalogue a changé. Relisez la version actuelle avant de prendre une décision.'
        : 'Le résultat est incertain. Vérifiez la fiche et son historique avant toute nouvelle tentative.';

  return (
    <section
      className="player-surface player-panel staff-decision"
      aria-labelledby="staff-decision-title"
    >
      <h2 id="staff-decision-title">Décision</h2>
      <p className="player-muted">La décision porte sur la version affichée.</p>
      {problem && (
        <p role="alert" className="player-notice">
          {problem.message}
        </p>
      )}
      {failure !== undefined && (
        <CharacterError
          error={failure}
          message={
            failure instanceof ApiError && failure.code
              ? messages[failure.code]
              : undefined
          }
        />
      )}
      {recovery?.kind === 'verified' && <p role="status">{recovery.message}</p>}
      {recovery && recovery.kind !== 'verified' && (
        <>
          <CharacterError
            error={recovery.error}
            message={
              recovery.error instanceof ApiError && recovery.error.code
                ? (messages[recovery.error.code] ?? recoveryMessage)
                : recoveryMessage
            }
          />
          {recovery.kind === 'changed' && (
            <Button type="button" variant="outline" onClick={reload}>
              Relire la fiche et repartir sans le commentaire saisi
            </Button>
          )}
          {recovery.kind === 'uncertain' && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={verify}
            >
              Vérifier l’état et l’historique
            </Button>
          )}
          {recovery.kind === 'closed' && recovery.latestDecision && (
            <p role="status">
              Dernière décision dans l’historique ·{' '}
              {validationLabel[recovery.latestDecision]}
            </p>
          )}
          {recovery.kind === 'closed' && (
            <Button asChild variant="outline">
              <Link to={staffQueuePath}>Revenir à la file</Link>
            </Button>
          )}
        </>
      )}
      {busy && <p role="status">Vérification auprès de l’API…</p>}
      <form
        className="player-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          prepare();
        }}
      >
        <fieldset className="player-form" disabled={busy || blocked}>
          <div className="player-field">
            <Label htmlFor="staff-decision">Décision proposée</Label>
            <select
              id="staff-decision"
              value={decision}
              aria-invalid={problem?.field === 'decision' || undefined}
              onChange={(event) => {
                const selection = event.target.value;
                if (
                  selection === '' ||
                  selection === 'approved' ||
                  selection === 'changes_requested' ||
                  selection === 'rejected'
                ) {
                  setDecision(selection);
                  if (!selection || selection === 'rejected') setHouse('');
                  setProblem(undefined);
                }
              }}
            >
              <option value="">Choisir une décision</option>
              <option value="approved">Valider</option>
              <option value="changes_requested">
                Demander des corrections
              </option>
              <option value="rejected">Refuser</option>
            </select>
          </div>
          {canAssign && (
            <div className="player-field">
              <Label htmlFor="staff-house">
                House{requiresHouse ? ' (obligatoire)' : ''}
              </Label>
              <select
                id="staff-house"
                value={house}
                aria-required={requiresHouse || undefined}
                aria-invalid={problem?.field === 'house' || undefined}
                onChange={(event) => {
                  setHouse(event.target.value);
                  setProblem(undefined);
                }}
              >
                <option value="">
                  {sheet.houseId
                    ? 'Conserver l’attribution actuelle'
                    : 'Aucune nouvelle attribution'}
                </option>
                {houses
                  .filter((entry) => entry.id !== sheet.houseId)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
              </select>
              {sheet.houseId && (
                <p className="player-muted">
                  Attribution actuelle ·{' '}
                  {catalogName(houses, sheet.houseId, 'House hors catalogue')}
                </p>
              )}
            </div>
          )}
          <div className="player-field">
            <Label htmlFor="staff-comment">
              Commentaire{requiresComment ? ' (obligatoire)' : ''}
            </Label>
            <p id="staff-comment-hint" className="player-muted">
              Visible par le joueur · 2 000 caractères maximum.
            </p>
            <textarea
              id="staff-comment"
              rows={6}
              value={comment}
              aria-required={requiresComment || undefined}
              aria-describedby="staff-comment-hint"
              aria-invalid={problem?.field === 'comment' || undefined}
              onChange={(event) => {
                setComment(event.target.value);
                setProblem(undefined);
              }}
            />
          </div>
          <div className="player-actions">
            <Button
              type="submit"
              variant={decision === 'rejected' ? 'destructive' : 'default'}
            >
              Vérifier la décision
            </Button>
          </div>
        </fieldset>
      </form>
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la décision</DialogTitle>
            <DialogDescription>
              {confirmation && actionLabels[confirmation.decision]} ·{' '}
              {characterName(sheet)}. Le joueur pourra consulter cette décision.
            </DialogDescription>
          </DialogHeader>
          {confirmation?.houseId && (
            <p>
              House ·{' '}
              {catalogName(
                houses,
                confirmation.houseId,
                'House hors catalogue',
              )}
            </p>
          )}
          {confirmation?.comment && (
            <p className="staff-confirmation-comment player-prose">
              {confirmation.comment}
            </p>
          )}
          <div className="player-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmation(undefined)}
            >
              Revenir à la décision
            </Button>
            <Button
              type="button"
              variant={
                confirmation?.decision === 'rejected'
                  ? 'destructive'
                  : 'default'
              }
              onClick={() => {
                if (confirmation) save(confirmation);
              }}
            >
              Enregistrer la décision
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ExitDialog blocker={guard.blocker} working={busy} />
    </section>
  );
}
