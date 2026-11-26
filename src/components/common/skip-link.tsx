import { Link, useLocation } from 'react-router';

export function SkipLink() {
  const { pathname, search } = useLocation();
  return (
    <Link
      to={{ pathname, search, hash: '#main-content' }}
      className="skip-link"
      onClick={() => document.getElementById('main-content')?.focus()}
    >
      Aller au contenu
    </Link>
  );
}
