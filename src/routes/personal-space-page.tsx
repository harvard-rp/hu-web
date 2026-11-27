import { ArrowRight } from 'lucide-react';
import { Link, Navigate } from 'react-router';

import type { AuthController } from '@/features/auth/auth-session';
import {
  AuthFeedback,
  AuthPanel,
  SessionActions,
} from '@/features/auth/auth-ui';
import { useAuth } from '@/features/auth/use-auth';
import type { PlayerContext } from '@/lib/services/player-context';

type Character = PlayerContext['characters'][number];

const validationLabels: Record<Character['validationStatus'], string> = {
  draft: 'Brouillon',
  submitted: 'En attente de validation',
  changes_requested: 'Correction demandée',
  approved: 'Validée',
  rejected: 'Refusée',
};

const useLabels: Record<Character['useStatus'], string> = {
  active: 'Actif',
  suspended: 'Suspendu',
};

export function AuthCallbackPage({
  controller,
}: {
  controller: AuthController;
}) {
  const state = useAuth(controller);
  if (
    state.kind === 'ready' ||
    (state.kind === 'problem' && state.hasSession)
  ) {
    return <Navigate to="/account" replace />;
  }
  if (state.kind !== 'loading' && state.kind !== 'initializing') {
    return <Navigate to="/login" replace />;
  }
  return (
    <AuthPanel title="Connexion à Discord">
      <AuthFeedback state={state} />
    </AuthPanel>
  );
}

export function PersonalSpacePage({
  controller,
}: {
  controller: AuthController;
}) {
  const state = useAuth(controller);
  if (
    state.kind === 'signed-out' ||
    state.kind === 'disabled' ||
    state.kind === 'invalid-config' ||
    (state.kind === 'problem' && !state.hasSession)
  ) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthPanel title="Espace personnel">
      <AuthFeedback state={state} />
      {state.kind === 'ready' && <PlayerOverview player={state.player} />}
      {(state.kind === 'ready' ||
        state.kind === 'initializing' ||
        (state.kind === 'problem' && state.hasSession)) && (
        <SessionActions
          controller={controller}
          retry={
            state.kind === 'problem' && state.problem === 'api-unavailable'
          }
        />
      )}
    </AuthPanel>
  );
}

function PlayerOverview({ player }: { player: PlayerContext }) {
  const { characters, canAccessCampus } = player;
  return (
    <>
      <section
        className="auth-characters"
        aria-labelledby="auth-characters-title"
      >
        <h2 id="auth-characters-title">
          {characters.length} personnage{characters.length > 1 ? 's' : ''}
        </h2>
        <p>
          {characters.length === 0
            ? 'Votre compte ne contient encore aucun personnage.'
            : canAccessCampus
              ? 'Vous avez au moins un personnage utilisable.'
              : 'Aucun personnage utilisable pour le moment.'}
        </p>
        {characters.length > 0 && (
          <ol>
            {characters.map((character, index) => (
              <li key={character.id}>
                <h3>Personnage {index + 1}</h3>
                <dl>
                  <div>
                    <dt>Fiche</dt>
                    <dd>{validationLabels[character.validationStatus]}</dd>
                  </div>
                  <div>
                    <dt>Utilisation</dt>
                    <dd>{useLabels[character.useStatus]}</dd>
                  </div>
                  <div>
                    <dt>Accès au campus</dt>
                    <dd>
                      {character.canAccessCampus ? 'Éligible' : 'Indisponible'}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p>
        La création de fiches et les fonctions du campus réel sont encore
        indisponibles.
      </p>
      <Link className="text-link" to="/preview">
        Ouvrir le campus de démonstration <ArrowRight aria-hidden="true" />
      </Link>
    </>
  );
}
