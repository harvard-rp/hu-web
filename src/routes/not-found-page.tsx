import { ArrowLeft, MapPinOff } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <section
      className="not-found content-shell"
      aria-labelledby="not-found-title"
    >
      <span className="login-mark">
        <MapPinOff aria-hidden="true" />
      </span>
      <p className="eyebrow">404</p>
      <h1 id="not-found-title">Page introuvable.</h1>
      <p>Cette page ne fait pas partie du campus.</p>
      <Button asChild>
        <Link to="/">
          <ArrowLeft aria-hidden="true" /> Retour à l’accueil
        </Link>
      </Button>
    </section>
  );
}
