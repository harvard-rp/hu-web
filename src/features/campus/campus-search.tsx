import { useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
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
import { previewSections } from './campus-navigation';

export function CampusSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const sections = previewSections.filter(({ label }) =>
    label.toLowerCase().includes(query.trim().toLowerCase()),
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
          size="icon"
          className="icon-button"
          aria-label="Search campus"
        >
          <Search aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search campus</DialogTitle>
          <DialogDescription>
            Find a section in the public preview.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="campus-search">Section name</Label>
          <Input
            id="campus-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {sections.length ? (
          <ul className="grid gap-1">
            {sections.map(({ id, label, Icon }) => (
              <li key={id}>
                <Link
                  to={`/preview#${id}`}
                  onClick={() => changeOpen(false)}
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
              <EmptyTitle>No matching sections</EmptyTitle>
              <EmptyDescription>
                Try Dashboard, Announcements or Events.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </DialogContent>
    </Dialog>
  );
}
