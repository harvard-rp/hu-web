import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { findHouse, type Character } from './data';

export function DemoHeading({
  section,
  title,
  description,
  action,
}: {
  section?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="demo-heading">
      <div>
        {section && <p className="eyebrow">{section}</p>}
        <h1>{title}</h1>
        {description && <p className="demo-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Avatar({ character }: { character: Character }) {
  return (
    <span className="demo-avatar" data-tone={character.tone} aria-hidden="true">
      {character.initials}
    </span>
  );
}

export function CharacterLink({ character }: { character: Character }) {
  return (
    <Link className="demo-person" to={`/preview/people/${character.id}`}>
      <Avatar character={character} />
      <span>
        {character.name}
        <small>{findHouse(character.house)?.name} House</small>
      </span>
    </Link>
  );
}

export function NoResults({
  description = 'Essayez une autre recherche.',
}: {
  description?: string;
}) {
  return (
    <Card className="demo-card">
      <Empty role="status">
        <EmptyHeader>
          <EmptyTitle>Aucun résultat</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Card>
  );
}

export function BackLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className="text-link">
      <ArrowLeft aria-hidden="true" /> {children}
    </Link>
  );
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
