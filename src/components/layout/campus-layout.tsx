import { ChevronDown, LogIn, Menu, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';

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
          aria-label="Open campus navigation"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="mobile-menu-content">
        <DialogHeader>
          <DialogTitle>Digital Campus</DialogTitle>
          <DialogDescription>Campus navigation</DialogDescription>
        </DialogHeader>
        <CampusNavigation onNavigate={() => setOpen(false)} />
        <Link className="sidebar-home" to="/" onClick={() => setOpen(false)}>
          Return to public site
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
          aria-label="Guest account"
        >
          <span className="guest-icon">
            <UserRound aria-hidden="true" />
          </span>
          <span className="account-label">Guest</span>
          <ChevronDown className="account-label" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Guest preview</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login">
            <LogIn aria-hidden="true" /> Sign-in information
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CampusLayout() {
  return (
    <div className="campus-layout">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="campus-sidebar" aria-label="Campus sidebar">
        <Brand />
        <CampusNavigation />
        <Link className="sidebar-home" to="/">
          Return to public site
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
              Preview
            </Badge>
          </div>
          <div className="campus-header-actions">
            <CampusSearch />
            <ThemeSwitcher />
            <AccountMenu />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="campus-main">
          <Outlet />
        </main>

        <footer className="campus-footer">
          <Disclaimer />
          <ApiStatus />
        </footer>
      </div>
    </div>
  );
}
