import { ArrowRight, LogOut } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  characterTypes,
  draftName,
  reviewStatusLabels,
  usableCharacter,
} from '@/features/demo/characters';
import { findHouse } from '@/features/demo/catalogues';
import { useDemo } from '@/features/demo/demo-state';
import { Avatar, DemoHeading } from '@/features/demo/demo-ui';

export function AccountPage() {
  const { reviews, activeCharacter, capacity, boosts, selectCharacter } =
    useDemo();

  return (
    <div className="demo-page">
      <DemoHeading
        title="Mes personnages"
        description="Compte fictif"
        action={
          capacity.available > 0 && (
            <Button asChild>
              <Link to="/preview/character/new">
                Créer un personnage <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )
        }
      />
      <section className="demo-panel" aria-labelledby="slots-title">
        <header className="demo-panel-header">
          <h2 id="slots-title">Emplacements</h2>
        </header>
        <div className="demo-panel-copy account-capacity" aria-live="polite">
          <strong>
            {capacity.used} / {capacity.total} utilisés
          </strong>
          <span>
            {capacity.base} de base + {boosts} boosts confirmés
          </span>
          <span>
            {capacity.available} disponible{capacity.available === 1 ? '' : 's'}
          </span>
          {capacity.over > 0 && (
            <p className="account-warning">
              {capacity.over} en trop. Les fiches sont conservées. Aucune
              nouvelle fiche tant que la limite est dépassée.
            </p>
          )}
        </div>
      </section>
      <section className="demo-panel" aria-labelledby="characters-title">
        <header className="demo-panel-header">
          <h2 id="characters-title" tabIndex={-1}>
            Personnages et suivi
          </h2>
          {activeCharacter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="panel-action"
              onClick={() => {
                document.getElementById('characters-title')?.focus();
                selectCharacter(null);
              }}
            >
              <LogOut aria-hidden="true" /> Quitter le personnage
            </Button>
          )}
        </header>
        <p className="sr-only" role="status">
          {activeCharacter
            ? `Personnage actif : ${activeCharacter.name}`
            : 'Aucun personnage actif'}
        </p>
        <ul className="demo-panel-list account-characters">
          {reviews.map((record) => {
            const person = usableCharacter(record);
            const isActive = activeCharacter?.id === record.id;
            const house = record.house && findHouse(record.house);
            const name = draftName(record.draft);
            return (
              <li key={record.id} tabIndex={-1}>
                <div className="account-character">
                  {person && <Avatar character={person} />}
                  <div>
                    <h3>{name}</h3>
                    <p>
                      {characterTypes[record.draft.profile]}
                      {house && ` · ${house.name} House`}
                    </p>
                    {record.note && <p>{record.note}</p>}
                  </div>
                </div>
                <span className="staff-status" data-status={record.status}>
                  {isActive ? 'Actif' : reviewStatusLabels[record.status]}
                </span>
                {record.status === 'changes' && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to={`/preview/character/new?fiche=${record.id}`}
                      aria-label={`Corriger la fiche · ${name}`}
                    >
                      Corriger la fiche
                    </Link>
                  </Button>
                )}
                {person && !isActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.currentTarget
                        .closest('li')
                        ?.focus({ preventScroll: true });
                      selectCharacter(record.id);
                    }}
                    aria-label={`Activer ${name}`}
                  >
                    Activer
                  </Button>
                )}
                {isActive && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/preview/character">Voir le profil</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
