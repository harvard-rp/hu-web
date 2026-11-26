import {
  ArrowRight,
  BookOpen,
  Dumbbell,
  Palette,
  UsersRound,
} from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  clubs,
  clubCategories,
  findHouse,
  houses,
  majors,
} from '@/features/demo/catalogues';
import { useDemo } from '@/features/demo/demo-state';
import {
  BackLink,
  CharacterLink,
  DemoHeading,
  NoResults,
  normalizeSearch,
} from '@/features/demo/demo-ui';

type House = (typeof houses)[number];
const houseGroups = ['River Houses', 'Quad Houses'] as const;

function HouseMark({ house }: { house: House }) {
  return (
    <span
      className="house-emblem"
      style={{ '--house-color': house.color } as CSSProperties}
      aria-hidden="true"
    >
      {house.name.slice(0, 2)}
    </span>
  );
}

export function HousesPage() {
  const { ranking } = useDemo();
  return (
    <div className="demo-page house-directory">
      <DemoHeading
        title="Houses"
        description="Le staff attribue votre House lors de la validation de la fiche."
      />
      {houseGroups.map((group) => (
        <section
          key={group}
          aria-labelledby={
            group.startsWith('River') ? 'river-title' : 'quad-title'
          }
        >
          <h2
            className="directory-group-title"
            id={group.startsWith('River') ? 'river-title' : 'quad-title'}
          >
            {group}
          </h2>
          <ul className="house-grid">
            {houses
              .filter((house) => house.location === group)
              .map((house) => {
                const count = ranking.filter(
                  (character) => character.house === house.id,
                ).length;
                return (
                  <li key={house.id} className="demo-panel house-card">
                    <Link to={house.id} className="house-card-link">
                      <HouseMark house={house} />
                      <div>
                        <h3>{house.name} House</h3>
                        <p>
                          {count} {count === 1 ? 'membre' : 'membres'}
                        </p>
                      </div>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
      <p className="demo-aside">
        Membres fictifs. Monogrammes créés pour le RP.
      </p>
    </div>
  );
}

export function HouseDetailPage() {
  const { houseId = '' } = useParams();
  const { ranking } = useDemo();
  const house = findHouse(houseId);
  if (!house)
    return (
      <div className="demo-page">
        <BackLink to="/preview/houses">Toutes les Houses</BackLink>
        <DemoHeading title="House introuvable" />
      </div>
    );
  const members = ranking.filter((character) => character.house === house.id);
  return (
    <div className="demo-page house-detail-page">
      <div className="house-detail">
        <HouseMark house={house} />
        <DemoHeading
          title={`${house.name} House`}
          description={house.location}
        />
      </div>
      <section className="demo-panel" aria-labelledby="house-about">
        <header className="demo-panel-header">
          <h2 id="house-about">À propos</h2>
        </header>
        <div className="demo-panel-copy house-about">
          <p>{house.summary}</p>
          <ul aria-label="Caractéristiques" className="house-traits">
            {house.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="demo-panel" aria-labelledby="house-members">
        <header className="demo-panel-header">
          <h2 id="house-members">Membres</h2>
          <span className="demo-aside">
            {members.length}{' '}
            {members.length === 1 ? 'profil fictif' : 'profils fictifs'}
          </span>
        </header>
        {members.length ? (
          <ul className="demo-panel-list">
            {members.map((member) => (
              <li key={member.id}>
                <CharacterLink character={member} showHouse={false} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="demo-panel-copy">Aucun membre dans la démonstration.</p>
        )}
      </section>
    </div>
  );
}

const clubIcons = {
  Sport: Dumbbell,
  'Arts et culture': Palette,
  Académique: BookOpen,
  Loisirs: UsersRound,
  Organisation: UsersRound,
};

function ClubList({ entries }: { entries: typeof clubs }) {
  return (
    <ul className="demo-panel club-list">
      {entries.map((club) => {
        const Icon = clubIcons[club.category];
        return (
          <li key={club.name} className="club-row">
            <div className="club-summary">
              <Icon aria-hidden="true" />
              <div>
                <h3>{club.name}</h3>
                <span className="demo-aside">{club.category}</span>
                {club.provisional && (
                  <span className="club-pending">À confirmer</span>
                )}
                {club.description && <p>{club.description}</p>}
                {club.name === 'Natation' && (
                  <p className="club-note">Type de responsable à confirmer.</p>
                )}
              </div>
            </div>
            <dl className="club-facts">
              <div>
                <dt>Effectif</dt>
                <dd>
                  {club.members ?? '—'}
                  {club.capacity ? ` / ${club.capacity}` : ''}
                </dd>
              </div>
              <div>
                <dt>Capacité</dt>
                <dd>
                  {club.capacity ??
                    (club.provisional
                      ? 'À confirmer'
                      : 'Aucun plafond communiqué')}
                </dd>
              </div>
              <div>
                <dt>Responsabilité</dt>
                <dd>{club.leadership}</dd>
                {club.leader && <dd>{club.leader} (fictif)</dd>}
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

export function ClubsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const query = normalizeSearch(search);
  const matches = clubs.filter(
    (club) =>
      (!category || club.category === category) &&
      normalizeSearch(`${club.name} ${club.description ?? ''}`).includes(query),
  );
  return (
    <div className="demo-page">
      <DemoHeading
        title="Clubs"
        description="Effectifs et responsables affichés à titre fictif."
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="club-search">Rechercher un club</Label>
          <Input
            id="club-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom ou activité"
          />
        </div>
        <div>
          <Label htmlFor="club-category">Catégorie</Label>
          <select
            id="club-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {clubCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <p role="status" className="demo-aside">
        {matches.length} {matches.length === 1 ? 'club' : 'clubs'}
      </p>
      {matches.length ? <ClubList entries={matches} /> : <NoResults />}
    </div>
  );
}

export function MajorsPage() {
  return (
    <div className="demo-page">
      <DemoHeading
        title="Filières"
        action={
          <Button asChild>
            <Link to="/preview/character/new?major=other">
              Proposer une filière <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <ul className="demo-panel majors-list">
        {majors.map((major) => (
          <li key={major}>{major}</li>
        ))}
      </ul>
    </div>
  );
}
