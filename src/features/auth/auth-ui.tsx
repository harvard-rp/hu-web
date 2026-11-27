import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { AuthController, AuthProblem, AuthState } from './auth-session';

const messages: Record<AuthProblem, string> = {
  cancelled: 'La connexion Discord a été annulée ou refusée.',
  'invalid-callback':
    'Ce lien de connexion est invalide ou a expiré. Recommencez depuis cette page.',
  'sign-in': 'Impossible d’ouvrir la connexion Discord. Réessayez.',
  'auth-unavailable': 'Le service de connexion est momentanément indisponible.',
  'callback-unavailable':
    'La connexion n’a pas pu aboutir. Réessayez avec Discord.',
  'api-unavailable':
    'Votre espace personnel est momentanément indisponible. Votre session reste ouverte.',
  'identity-required':
    'Une identité Discord liée est nécessaire pour accéder à votre compte joueur.',
  'link-conflict':
    'Cette identité Discord est déjà liée à un autre compte joueur. Contactez le staff.',
  expired: 'Votre session a expiré. Reconnectez-vous.',
};

export function AuthPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="login-frame content-shell" aria-labelledby="auth-title">
      <div className="login-content">
        <h1 id="auth-title">{title}</h1>
        {children}
      </div>
    </section>
  );
}

export function AuthFeedback({ state }: { state: AuthState }) {
  if (state.kind === 'problem') {
    return (
      <p id="discord-status" role="alert">
        {messages[state.problem]}
      </p>
    );
  }

  const labels = {
    disabled: 'La connexion Discord est indisponible.',
    'invalid-config': 'La connexion Discord est indisponible pour le moment.',
    loading: 'Vérification de la session…',
    'signed-out': 'Connectez-vous avec votre compte Discord.',
    redirecting: 'Ouverture de Discord…',
    initializing: 'Initialisation du compte joueur…',
    ready: 'Session ouverte.',
  };
  return (
    <p id="discord-status" role="status">
      {labels[state.kind]}
    </p>
  );
}

export function SessionActions({
  controller,
  retry = false,
}: {
  controller: AuthController;
  retry?: boolean;
}) {
  return (
    <div className="auth-actions">
      {retry && (
        <Button type="button" onClick={controller.retry}>
          Réessayer
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => void controller.signOut()}
      >
        Se déconnecter
      </Button>
    </div>
  );
}
