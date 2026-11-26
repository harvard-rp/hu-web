import { ArrowUpRight } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';

import { SkipLink } from '@/components/common/skip-link';
import { Brand } from '@/components/common/brand';
import { Disclaimer } from '@/components/common/disclaimer';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <SkipLink />
      <header className="public-header">
        <div className="content-shell public-header-inner">
          <Brand />
          <nav aria-label="Navigation publique" className="public-navigation">
            <NavLink to="/preview" className="header-campus">
              Démonstration
            </NavLink>
            <ThemeSwitcher />
            <Button asChild variant="outline" className="header-sign-in">
              <Link to="/login">
                Connexion <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="public-demo-strip">
        <span>Mode démonstration</span>
        <span>Personnages et activités fictifs</span>
      </div>

      <main id="main-content" tabIndex={-1} className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="content-shell footer-inner">
          <span className="footer-brand">Harvard University RP</span>
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
