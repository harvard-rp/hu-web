import { ArrowUpRight } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';

import { Brand } from '@/components/common/brand';
import { Disclaimer } from '@/components/common/disclaimer';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="public-header">
        <div className="content-shell public-header-inner">
          <Brand />
          <nav aria-label="Public navigation" className="public-navigation">
            <NavLink to="/preview" className="header-campus">
              Campus preview
            </NavLink>
            <ThemeSwitcher />
            <Button asChild variant="outline" className="header-sign-in">
              <Link to="/login">
                Sign in <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

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
