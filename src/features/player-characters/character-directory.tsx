import { ArrowRight } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { SessionActions } from '@/features/auth/auth-ui';
import type { PlayerContext } from '@/lib/services/player-context';
import type { CharacterKind } from '@/lib/services/character-contract';
import {
  CharacterError,
  CharacterState,
  Screen,
  canEdit,
  characterName,
  isUncertain,
  kindLabel,
} from './character-ui';
import { ExitDialog, useExitGuard } from './exit-guard';
import {
  usePlayerMutation,
  usePlayerQuery,
  type PlayerSession,
} from './player-queries';

const accountBack = { to: '/account', label: 'Retour à mes personnages' };

export function CharacterDirectory({
  session,
  player,
}: {
  session: PlayerSession;
  player: PlayerContext;
}) {
  const { controller, scope } = session;
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.characterRequest(
        scope,
        async (api, token, signal) => {
          const [characters, capacity] = await Promise.all([
            api.list(token, signal),
            api.capacity(token, signal),
          ]);
          return { characters: characters.data, capacity: capacity.data };
        },
        signal,
      ),
    [controller, scope],
  );
  const { state, retry } = usePlayerQuery(load);

  return (
    <Screen title="Mes personnages">
      <p className="player-muted">Session ouverte.</p>
      {state.kind === 'loading' && (
        <p role="status">Chargement de vos personnages…</p>
      )}
      {state.kind === 'error' && (
        <CharacterError error={state.error} retry={retry} />
      )}
      {state.kind === 'ready' && (
        <>
          <section
            className="player-surface player-panel"
            aria-labelledby="capacity-title"
          >
            <header className="player-section-bar">
              <div>
                <h2 id="capacity-title">Emplacements</h2>
                <p className="player-muted">
                  5 de base + {state.data.capacity.total - 5} via les boosts
                  confirmés
                </p>
              </div>
              {state.data.capacity.available > 0 && (
                <Button asChild>
                  <Link to="/account/characters/new">Créer un personnage</Link>
                </Button>
              )}
            </header>
            <dl className="player-capacity">
              <div>
                <dt>Total</dt>
                <dd>{state.data.capacity.total}</dd>
              </div>
              <div>
                <dt>Utilisés</dt>
                <dd>{state.data.capacity.used}</dd>
              </div>
              <div>
                <dt>Disponibles</dt>
                <dd>{state.data.capacity.available}</dd>
              </div>
            </dl>
            {state.data.capacity.used > state.data.capacity.total ? (
              <p>
                Votre compte dépasse sa capacité. Vos personnages restent
                consultables.
              </p>
            ) : (
              state.data.capacity.available === 0 && (
                <p>Tous vos emplacements sont occupés.</p>
              )
            )}
          </section>
          {state.data.characters.length === 0 ? (
            <p>Vous n’avez encore aucun personnage.</p>
          ) : (
            <ul
              aria-label="Vos personnages"
              className="player-surface player-records"
            >
              {state.data.characters.map((character) => (
                <li key={character.id}>
                  <div>
                    <h2>
                      <Link
                        className="player-record-name"
                        to={`/account/characters/${character.id}`}
                      >
                        {characterName(character)}
                      </Link>
                    </h2>
                    <p className="player-muted">
                      {kindLabel[character.kind]}
                      {character.nickname &&
                      character.nickname !== characterName(character)
                        ? ` · ${character.nickname}`
                        : ''}
                    </p>
                    <CharacterState character={character} />
                  </div>
                  <div className="player-actions">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        aria-label={`Voir la fiche · ${characterName(character)}`}
                        to={`/account/characters/${character.id}`}
                      >
                        Voir la fiche
                      </Link>
                    </Button>
                    {canEdit(character) && (
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          aria-label={`Modifier · ${characterName(character)}`}
                          to={`/account/characters/${character.id}/edit`}
                        >
                          Modifier
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ClubDirectory session={session} />
          <p className="player-muted">
            {player.canAccessCampus
              ? 'Vous avez au moins un personnage éligible au campus.'
              : 'Aucun personnage éligible au campus pour le moment.'}{' '}
            Les fonctions du campus réel restent indisponibles.
          </p>
        </>
      )}
      <div className="player-section-bar player-footer-actions">
        <Link className="text-link" to="/preview">
          Ouvrir le campus de démonstration <ArrowRight aria-hidden="true" />
        </Link>
        <SessionActions controller={controller} />
      </div>
    </Screen>
  );
}

function ClubDirectory({
  session: { controller, scope },
}: {
  session: PlayerSession;
}) {
  const [opened, setOpened] = useState(false);
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.characterRequest(
        scope,
        async (api, token, signal) => (await api.clubs(token, signal)).data,
        signal,
      ),
    [controller, scope],
  );
  const { state, retry } = usePlayerQuery(load, opened);

  return (
    <details
      className="player-surface player-panel"
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true);
      }}
    >
      <summary>Consulter le catalogue des clubs</summary>
      {opened && (
        <>
          {state.kind === 'loading' && (
            <p role="status">Chargement des clubs…</p>
          )}
          {state.kind === 'error' && (
            <CharacterError error={state.error} retry={retry} />
          )}
          {state.kind === 'ready' &&
            (state.data.length ? (
              <ul className="player-clubs">
                {state.data.map((club) => (
                  <li key={club.id}>
                    {club.name}
                    {club.memberCapacity && (
                      <span className="player-muted">
                        {' '}
                        · {club.memberCapacity} places
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun club actif dans le catalogue.</p>
            ))}
        </>
      )}
    </details>
  );
}

export function CreateCharacter({ session }: { session: PlayerSession }) {
  const navigate = useNavigate();
  const [kind, setKind] = useState<CharacterKind>('student');
  const mutation = usePlayerMutation(session);
  const uncertain = !!mutation.failure && isUncertain(mutation.failure.error);
  const guard = useExitGuard(mutation.pending, session.scope.signal);

  return (
    <Screen title="Créer un personnage" back={accountBack}>
      <form
        className="player-surface player-panel player-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (uncertain) return;
          void mutation.run(
            (api, token, signal) => api.create(token, signal, kind),
            ({ data }) => {
              guard.allowExit();
              void navigate(`/account/characters/${data.id}/edit`, {
                replace: true,
              });
            },
          );
        }}
      >
        <p>
          Un brouillon occupe un emplacement. Le type est fixé à la création.
        </p>
        <fieldset
          disabled={mutation.pending || uncertain}
          className="player-choice"
        >
          <legend>Type de personnage</legend>
          {Object.entries(kindLabel).map(([key, label]) => (
            <label key={key}>
              <input
                type="radio"
                name="kind"
                value={key}
                checked={kind === key}
                onChange={() => setKind(key as CharacterKind)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        {mutation.failure && (
          <CharacterError
            error={mutation.failure.error}
            message={
              uncertain
                ? 'La création a peut-être abouti. Vérifiez la liste de vos personnages avant de créer un autre brouillon.'
                : undefined
            }
          />
        )}
        <div className="player-actions">
          {uncertain ? (
            <Button asChild>
              <Link to="/account">Vérifier mes personnages</Link>
            </Button>
          ) : (
            <Button type="submit" disabled={mutation.pending}>
              {mutation.pending
                ? 'Création en cours…'
                : 'Confirmer la création'}
            </Button>
          )}
        </div>
      </form>
      <ExitDialog blocker={guard.blocker} working />
    </Screen>
  );
}
