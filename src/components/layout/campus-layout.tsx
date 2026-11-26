import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  LogIn,
  Menu,
  UserRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { Brand } from '@/components/common/brand';
import { Disclaimer } from '@/components/common/disclaimer';
import { SkipLink } from '@/components/common/skip-link';
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
import {
  CampusNavigation,
  campusDestinations,
} from '@/features/campus/campus-navigation';
import { CampusSearch } from '@/features/campus/campus-search';
import { findCharacter, findHouse, student } from '@/features/demo/data';
import { useDemoRevision } from '@/features/demo/demo-state';
import { ResetDemo } from '@/features/demo/reset-demo';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const didNavigate = useRef(false);

  function closeForNavigation() {
    didNavigate.current = true;
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ouvrir la navigation du campus"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="left"
        className="mobile-menu-content"
        onCloseAutoFocus={(event) => {
          if (!didNavigate.current) return;
          didNavigate.current = false;
          event.preventDefault();
          document
            .getElementById('main-content')
            ?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader>
          <DialogTitle>Digital Campus</DialogTitle>
          <DialogDescription className="sr-only">
            Navigation du campus
          </DialogDescription>
        </DialogHeader>
        <CampusNavigation onNavigate={closeForNavigation} />
        <Link className="sidebar-home" to="/" onClick={closeForNavigation}>
          Site public <ArrowUpRight aria-hidden="true" />
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
          aria-label={`${student.name} · Personnage actif`}
        >
          <span className="account-icon">
            <UserRound aria-hidden="true" />
          </span>
          <span className="account-label">{student.name}</span>
          <ChevronDown className="account-label" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Personnage actif</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/preview/character">
            <UserRound aria-hidden="true" /> Mon personnage
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login">
            <LogIn aria-hidden="true" /> Connexion
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CampusBreadcrumb({ pathname }: { pathname: string }) {
  const [, , section, id] = pathname.split('/');
  const destination = campusDestinations.find(({ path }) => path === pathname);
  const parent =
    section === 'houses' && id
      ? ['Houses', '/preview/houses']
      : section === 'people' && id
        ? ['Membres', '/preview/directory']
        : null;
  const house = section === 'houses' && id ? findHouse(id) : undefined;
  const character = section === 'people' && id ? findCharacter(id) : undefined;
  const label =
    destination?.label ?? (house ? `${house.name} House` : character?.name);
  if (pathname === '/preview' || !label) return <span>Digital Campus</span>;
  return (
    <nav aria-label="Fil d’Ariane" className="campus-breadcrumb">
      <Link to="/preview">Campus</Link>
      {parent && (
        <>
          <ChevronRight aria-hidden="true" />
          <Link to={parent[1]!}>{parent[0]}</Link>
        </>
      )}
      <ChevronRight aria-hidden="true" />
      <span aria-current="page">{label}</span>
    </nav>
  );
}

export function CampusLayout() {
  const revision = useDemoRevision();
  const { pathname } = useLocation();
  const route = pathname.replace(/\/+$/, '');
  return (
    <div className="campus-layout">
      <SkipLink />
      <aside className="campus-sidebar" aria-label="Barre latérale du campus">
        <Brand campus />
        <CampusNavigation />
        <Link className="sidebar-home" to="/">
          Site public <ArrowUpRight aria-hidden="true" />
        </Link>
      </aside>
      <div className="campus-workspace">
        <header className="campus-header">
          <div className="campus-header-leading">
            <div className="mobile-menu">
              <MobileMenu />
            </div>
            <div className="campus-header-title">
              <CampusBreadcrumb pathname={route} />
            </div>
            <span className="demo-indicator">Mode démonstration</span>
          </div>
          <div className="campus-header-actions">
            <CampusSearch />
            <ThemeSwitcher />
            <AccountMenu />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="campus-main"
          data-section={route.split('/')[2] ?? 'home'}
        >
          <Outlet key={revision} />
        </main>
        <footer className="campus-footer">
          <Disclaimer />
          <div className="demo-footer-actions">
            <ResetDemo />
            <ApiStatus config={{ kind: 'disabled' }} />
          </div>
        </footer>
      </div>
    </div>
  );
}
