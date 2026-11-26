import {
  ArrowLeft,
  ArrowUpRight,
  LockKeyhole,
  MessagesSquare,
} from 'lucide-react';
import { Link } from 'react-router';

import campusImage from '@/assets/campus-autumn.webp';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  return (
    <section
      className="login-frame content-shell"
      aria-labelledby="login-title"
    >
      <div className="login-content">
        <Link className="text-link login-back" to="/">
          <ArrowLeft aria-hidden="true" /> Retour à l’accueil
        </Link>
        <span className="login-mark">
          <MessagesSquare aria-hidden="true" />
        </span>
        <h1 id="login-title">Connexion au campus.</h1>
        <p id="discord-status">
          Les futurs comptes utiliseront Discord. La connexion Discord est
          indisponible.
        </p>
        <Button
          size="lg"
          type="button"
          disabled
          aria-describedby="discord-status"
          className="discord-button"
        >
          <LockKeyhole aria-hidden="true" /> Continuer avec Discord
        </Button>
        <p className="login-status">
          La démonstration est publique et accessible sans compte.
        </p>
        <Link className="text-link" to="/preview">
          Accéder à la démonstration <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      <figure className="login-figure">
        <img src={campusImage} alt="" width={1260} height={945} />
      </figure>
    </section>
  );
}
