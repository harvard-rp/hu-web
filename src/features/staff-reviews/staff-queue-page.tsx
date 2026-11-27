import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  CharacterError,
  Screen,
  charactersDate,
  kindLabel,
} from '@/features/player-characters/character-ui';
import { usePlayerQuery } from '@/features/player-characters/player-queries';
import {
  backToAccount,
  staffQueuePath,
  type ReviewSession,
} from './review-access';

export function StaffQueuePage({ session }: { session: ReviewSession }) {
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);
  const { controller, scope, grant } = session;
  const location = useLocation();
  const confirmed = location.state?.reviewRecorded === true;
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.staffRequest(
        scope,
        grant,
        ({ staff }, token, signal) => staff.queue(token, signal, cursor),
        signal,
      ),
    [controller, scope, grant, cursor],
  );
  const { state, retry } = usePlayerQuery(load);
  const next = state.kind === 'ready' ? state.data.data.nextCursor : null;

  return (
    <Screen title="Fiches à examiner" back={backToAccount}>
      {confirmed && (
        <p role="status" className="staff-confirmed">
          Décision enregistrée.
        </p>
      )}
      <div className="player-section-bar">
        <p className="player-muted">File de validation du staff</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCursors([]);
            retry();
          }}
        >
          Actualiser la file
        </Button>
      </div>
      {state.kind === 'loading' && <p role="status">Chargement de la file…</p>}
      {state.kind === 'error' && (
        <CharacterError error={state.error} retry={retry} />
      )}
      {state.kind === 'ready' && (
        <>
          {state.data.data.items.length === 0 ? (
            <p className="player-surface player-panel">
              {cursor
                ? 'Aucune fiche sur cette page.'
                : 'Aucune fiche en attente.'}
            </p>
          ) : (
            <ul
              className="player-surface staff-queue"
              aria-label="Fiches en attente"
            >
              {state.data.data.items.map((character) => {
                const name =
                  [character.firstName, character.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Personnage sans nom';
                return (
                  <li key={character.id}>
                    <div>
                      <strong>{name}</strong>
                      <p className="player-muted">
                        {kindLabel[character.kind]}
                      </p>
                      {character.useStatus === 'suspended' && (
                        <span className="player-status" data-suspended>
                          Suspendu
                        </span>
                      )}
                    </div>
                    <div className="player-muted">
                      Dernière modification
                      <time dateTime={character.updatedAt}>
                        {charactersDate.format(new Date(character.updatedAt))}
                      </time>
                    </div>
                    <Button asChild variant="outline">
                      <Link
                        to={`${staffQueuePath}/characters/${character.id}`}
                        aria-label={`Examiner la fiche de ${name}`}
                      >
                        Examiner
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {(cursor || next) && (
        <nav aria-label="Pages de la file" className="player-actions">
          <Button
            type="button"
            variant="outline"
            disabled={!cursor || state.kind === 'loading'}
            onClick={() => setCursors(cursors.slice(0, -1))}
          >
            Page précédente
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!next || cursors.includes(next)}
            onClick={() => {
              if (next) setCursors([...cursors, next]);
            }}
          >
            Page suivante
          </Button>
        </nav>
      )}
    </Screen>
  );
}
