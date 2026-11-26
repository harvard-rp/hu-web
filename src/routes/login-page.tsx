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
          <ArrowLeft aria-hidden="true" /> Back to home
        </Link>
        <span className="login-mark">
          <MessagesSquare aria-hidden="true" />
        </span>
        <h1 id="login-title">Sign in to campus.</h1>
        <p id="discord-status">
          Campus accounts will use Discord. Discord sign-in is not available
          yet.
        </p>
        <Button
          size="lg"
          type="button"
          disabled
          aria-describedby="discord-status"
          className="discord-button"
        >
          <LockKeyhole aria-hidden="true" /> Continue with Discord
        </Button>
        <p className="login-status">
          You can visit the public preview as a guest.
        </p>
        <Link className="text-link" to="/preview">
          Explore the public preview <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      <figure className="login-figure">
        <img src={campusImage} alt="" width={1260} height={945} />
      </figure>
    </section>
  );
}
