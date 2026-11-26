import { ChevronDown, LogIn, Menu, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';

import { SkipLink } from '@/components/common/skip-link';
import { ResetDemo } from '@/features/demo/reset-demo';
import { useDemoRevision } from '@/features/demo/demo-state';
import { Brand } from '@/components/common/brand';
import { Disclaimer } from '@/components/common/disclaimer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiStatus } from '@/features/campus/api-status';
import { CampusNavigation } from '@/features/campus/campus-navigation';
import { CampusSearch } from '@/features/campus/campus-search';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="icon-button"
          aria-label="Ouvrir la navigation du campus"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="mobile-menu-content">
        <DialogHeader>
          <DialogTitle>Digital Campus</DialogTitle>
          <DialogDescription>Navigation du campus</DialogDescription>
        </DialogHeader>
        <CampusNavigation onNavigate={() => setOpen(false)} />
        <Link className="sidebar-home" to="/" onClick={() => setOpen(false)}>
          Retour à l’accueil
        </Link>
      </DialogContent>
    </Dialog>
  );
}

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="account-trigger"
          aria-label="Invité · Compte de démonstration"
        >
          <span className="guest-icon">
            <UserRound aria-hidden="true" />
          </span>
          <span className="account-label">Invité</span>
          <ChevronDown className="account-label" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Session de démonstration</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login">
            <LogIn aria-hidden="true" /> Informations de connexion
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CampusLayout() {
  const revision = useDemoRevision();
  return (
    <div className="campus-layout">
      <SkipLink />
      <aside className="campus-sidebar" aria-label="Barre latérale du campus">
        <Brand />
        <CampusNavigation />
        <Link className="sidebar-home" to="/">
          Retour à l’accueil
        </Link>
      </aside>

      <div className="campus-workspace">
        <header className="campus-header">
          <div className="campus-header-leading">
            <div className="mobile-menu">
              <MobileMenu />
            </div>
            <span className="campus-header-title">Digital Campus</span>
            <Badge variant="outline" className="preview-chip">
              Mode démonstration
            </Badge>
          </div>
          <div className="campus-header-actions">
            <CampusSearch />
            <ThemeSwitcher />
            <AccountMenu />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="campus-main">
          <Outlet key={revision} />
        </main>

        <footer className="campus-footer">
          <Disclaimer />
          <div className="demo-footer-actions">
            <ApiStatus config={{ kind: 'disabled' }} />
            <ResetDemo />
          </div>
        </footer>
      </div>
    </div>
  );
}
