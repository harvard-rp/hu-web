import { useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, Megaphone, Search } from 'lucide-react';
import { Link } from 'react-router';

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeSearch } from '@/features/demo/demo-ui';
import { campusDestinations } from './campus-navigation';

const searchableDestinations = [
  ...campusDestinations,
  { label: 'Annonces', path: '/preview#announcements', Icon: Megaphone },
  { label: 'Événements', path: '/preview#events', Icon: CalendarDays },
];

export function CampusSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const focusTarget = useRef<string | null>(null);
  const sections = searchableDestinations.filter(({ label }) =>
    normalizeSearch(label).includes(normalizeSearch(query)),
  );

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) setQuery('');
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="campus-search-trigger"
          aria-label="Rechercher sur le campus"
        >
          <Search aria-hidden="true" />
          <span className="campus-search-label">Rechercher</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        onCloseAutoFocus={(event) => {
          const target = focusTarget.current;
          if (!target) return;
          focusTarget.current = null;
          event.preventDefault();
          document.getElementById(target)?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader>
          <DialogTitle>Rechercher sur le campus</DialogTitle>
          <DialogDescription>Cherchez par nom de rubrique.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="campus-search">Nom de la rubrique</Label>
          <Input
            id="campus-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {sections.length ? (
          <ul className="grid max-h-64 gap-1 overflow-y-auto">
            {sections.map(({ path, label, Icon }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => {
                    focusTarget.current = path.split('#')[1] ?? 'main-content';
                    changeOpen(false);
                  }}
                  className="search-result"
                >
                  <Icon aria-hidden="true" /> {label}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="p-4 md:p-4" role="status">
            <EmptyHeader>
              <EmptyTitle>Aucune rubrique trouvée</EmptyTitle>
              <EmptyDescription>
                Essayez « Houses », « Agenda » ou « Journal ».
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </DialogContent>
    </Dialog>
  );
}
