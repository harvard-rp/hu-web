import { Link } from 'react-router';

export function Brand({ campus = false }: { campus?: boolean }) {
  return (
    <Link to={campus ? '/preview' : '/'} className="brand">
      <span className="brand-mark" aria-hidden="true">
        H<span>RP</span>
      </span>
      <span className="brand-copy">
        {campus ? 'Digital Campus' : 'Harvard University RP'}
        {campus && <small>Harvard University RP</small>}
      </span>
    </Link>
  );
}
