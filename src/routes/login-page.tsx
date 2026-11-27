import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import type { AuthController } from '@/features/auth/auth-session';
import { AuthFeedback } from '@/features/auth/auth-ui';
import { useAuth } from '@/features/auth/use-auth';

export function LoginPage({ controller }: { controller: AuthController }) {
  const state = useAuth(controller);
  const hasSession =
    state.kind === 'ready' || (state.kind === 'problem' && state.hasSession);
  const canSignIn = state.kind === 'signed-out' || state.kind === 'problem';
  return (
    <section
      className="login-frame content-shell"
      aria-labelledby="login-title"
    >
      <Link className="text-link login-back" to="/">
        <ArrowLeft aria-hidden="true" /> Retour à l’accueil
      </Link>
      <div className="login-content">
        <h1 id="login-title">Connexion</h1>
        <AuthFeedback state={state} />
        {hasSession ? (
          <Button asChild>
            <Link to="/account">Ouvrir mon espace personnel</Link>
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canSignIn}
            aria-describedby="discord-status"
            onClick={() => void controller.signIn()}
          >
            Continuer avec Discord
          </Button>
        )}
        {state.kind === 'problem' &&
          !state.hasSession &&
          state.problem === 'auth-unavailable' && (
            <button
              type="button"
              className="text-link"
              onClick={controller.retry}
            >
              Réessayer la vérification
            </button>
          )}
        <Link className="text-link" to="/preview">
          Accéder au campus sans compte <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
