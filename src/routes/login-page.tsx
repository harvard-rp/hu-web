import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

export function LoginPage() {
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
        <p id="discord-status">La connexion Discord est indisponible.</p>
        <Button type="button" disabled aria-describedby="discord-status">
          Continuer avec Discord
        </Button>
        <Link className="text-link" to="/preview">
          Accéder au campus sans compte <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
