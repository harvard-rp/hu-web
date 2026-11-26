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
      <h1 id="not-found-title">Page not found.</h1>
      <p>We couldn’t find this part of campus.</p>
      <Button asChild>
        <Link to="/">
          <ArrowLeft aria-hidden="true" /> Back to home
        </Link>
      </Button>
    </section>
  );
}
