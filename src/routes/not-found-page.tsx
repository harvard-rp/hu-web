import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <section
      className="not-found content-shell"
      aria-labelledby="not-found-title"
    >
      <h1 id="not-found-title">Page introuvable</h1>
      <Button asChild>
        <Link to="/">
          <ArrowLeft aria-hidden="true" /> Retour à l’accueil
        </Link>
      </Button>
    </section>
  );
}
