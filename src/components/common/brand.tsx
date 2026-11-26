import { Landmark } from 'lucide-react';
import { Link } from 'react-router';

export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Landmark aria-hidden="true" />
      </span>
      <span className="brand-copy">
        <span>
          Harvard University <strong>RP</strong>
        </span>
        <small>Digital Campus</small>
      </span>
      <span className="sr-only"> · Accueil</span>
    </Link>
  );
}
