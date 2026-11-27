import { useCallback } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  CharacterError,
  CharacterState,
  Screen,
  characterName,
  charactersDate,
  kindLabel,
} from '@/features/player-characters/character-ui';
import {
  usePlayerQuery,
  type PlayerSession,
} from '@/features/player-characters/player-queries';
import type { CharacterDetail } from '@/lib/services/character-contract';
import { ReopeningForm, ReopeningTimeline } from './reopening-ui';

const account = { to: '/account', label: 'Retour à mes personnages' };

export function OwnerArchives({
  session: { scope, controller },
}: {
  session: PlayerSession;
}) {
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.characterRequest(
        scope,
        (api, token, signal) => api.archives(token, signal),
        signal,
      ),
    [controller, scope],
  );
  const { state, retry } = usePlayerQuery(load);
  return (
    <Screen title="Mes archives" back={account}>
      <p>Les personnages archivés ne comptent pas dans vos emplacements.</p>
      {state.kind === 'loading' && (
        <p role="status">Chargement des archives…</p>
      )}
      {state.kind === 'error' && (
        <CharacterError error={state.error} retry={retry} />
      )}
      {state.kind === 'ready' &&
        (state.data.data.length ? (
          <ul className="player-surface player-records">
            {state.data.data.map((sheet) => (
              <li key={sheet.id}>
                <div>
                  <strong>{characterName(sheet)}</strong>
                  <p className="player-muted">{kindLabel[sheet.kind]}</p>
                  <CharacterState character={sheet} />
                  {sheet.archivedAt && (
                    <time dateTime={sheet.archivedAt} className="player-muted">
                      {charactersDate.format(new Date(sheet.archivedAt))}
                    </time>
                  )}
                </div>
                <Button asChild variant="outline">
                  <Link
                    to={`/account/characters/${sheet.id}`}
                    aria-label={`Consulter la fiche archivée de ${characterName(sheet)}`}
                  >
                    Consulter
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Vous n’avez aucun personnage archivé.</p>
        ))}
    </Screen>
  );
}

export function OwnerReopeningPanel({
  session: { scope, controller },
  sheet,
  reload,
}: {
  session: PlayerSession;
  sheet: CharacterDetail;
  reload: () => void;
}) {
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.characterRequest(
        scope,
        (api, token, signal) => api.reopeningHistory(token, signal, sheet.id),
        signal,
      ),
    [controller, scope, sheet.id],
  );
  const { state, retry } = usePlayerQuery(load);
  if (state.kind === 'loading')
    return <p role="status">Chargement des demandes…</p>;
  if (state.kind === 'error')
    return <CharacterError error={state.error} retry={retry} />;
  const history = state.data.data;
  return (
    <>
      <ReopeningTimeline history={history} />
      {sheet.archivedAt &&
        sheet.actions.canRequestReopening &&
        !history.some((row) => row.decision === null) && (
          <ReopeningForm
            sheet={sheet}
            signal={scope.signal}
            reload={reload}
            finished={() => {
              reload();
              void controller.refreshPlayer(scope);
            }}
            send={(input, signal) =>
              controller.characterRequest(
                scope,
                (api, token, signal) =>
                  api.requestReopening(token, signal, sheet.id, input),
                signal,
              )
            }
            check={async (signal) => {
              const [updated, requests] = await Promise.all([
                controller.characterRequest(
                  scope,
                  (api, token, signal) => api.detail(token, signal, sheet.id),
                  signal,
                ),
                load(signal),
              ]);
              return { sheet: updated.data, history: requests.data };
            }}
          />
        )}
    </>
  );
}
