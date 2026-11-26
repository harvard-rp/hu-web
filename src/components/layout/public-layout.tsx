import { Outlet } from 'react-router';

import { SkipLink } from '@/components/common/skip-link';
import { Brand } from '@/components/common/brand';
import { Disclaimer } from '@/components/common/disclaimer';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <SkipLink />
      <header className="public-header">
        <div className="content-shell public-header-inner">
          <Brand />
          <div className="public-navigation">
            <span className="demo-indicator">Mode démonstration</span>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="public-main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="content-shell footer-inner">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
