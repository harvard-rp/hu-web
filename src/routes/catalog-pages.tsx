import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Dumbbell,
  Palette,
  UsersRound,
} from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  characters,
  clubs,
  clubCategories,
  findHouse,
  houses,
  majors,
} from '@/features/demo/data';
import {
  BackLink,
  CharacterLink,
  DemoHeading,
  NoResults,
  normalizeSearch,
} from '@/features/demo/demo-ui';

function Emblem({ house }: { house: (typeof houses)[number] }) {
  return (
    <span
      className="house-emblem"
      style={{ '--house-color': house.color } as CSSProperties}
      aria-hidden="true"
    >
      {house.symbol}
    </span>
  );
}

export function HousesPage() {
  return (
    <div className="demo-page">
      <DemoHeading
        section="Université"
        title="Les Houses"
        description="Douze résidences, chacune avec une ambiance imaginée pour le RP. Le staff attribue les Houses lors de la validation des fiches."
      />
      <p className="demo-aside">
        Les écussons sont des placeholders provisoires. Les descriptions et les
        effectifs sont propres à la démonstration.
      </p>
      <div className="demo-grid house-grid">
        {houses.map((house) => (
          <Card key={house.id} className="demo-card house-card">
            <Link to={house.id} className="house-card-link">
              <Emblem house={house} />
              <div>
                <p className="demo-date">{house.location}</p>
                <h2>{house.name} House</h2>
              </div>
              <ArrowUpRight className="house-arrow" aria-hidden="true" />
              <p>{house.summary}</p>
              <div className="demo-tags">
                {house.traits.map((trait) => (
                  <Badge key={trait} variant="outline">
                    {trait}
                  </Badge>
                ))}
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HouseDetailPage() {
  const { houseId = '' } = useParams();
  const house = findHouse(houseId);
  if (!house)
    return (
      <div className="demo-page">
        <BackLink to="/preview/houses">Toutes les Houses</BackLink>
        <DemoHeading title="House introuvable" />
      </div>
    );
  const members = characters.filter(
    (character) => character.house === house.id,
  );
  return (
    <div className="demo-page">
      <BackLink to="/preview/houses">Toutes les Houses</BackLink>
      <div className="house-detail demo-panel">
        <Emblem house={house} />
        <DemoHeading
          section={house.location}
          title={`${house.name} House`}
          description={house.summary}
        />
        <div className="demo-tags">
          {house.traits.map((trait) => (
            <Badge key={trait} variant="outline">
              {trait}
            </Badge>
          ))}
        </div>
        <p className="demo-aside">
          Écusson provisoire · attribution par le staff
        </p>
      </div>
      <section className="demo-panel" aria-labelledby="house-members">
        <header className="demo-panel-header">
          <h2 id="house-members">Membres fictifs</h2>
          <Badge variant="outline">
            {members.length} profil{members.length === 1 ? '' : 's'}
          </Badge>
        </header>
        {members.length ? (
          <ul className="demo-panel-list">
            {members.map((member) => (
              <li key={member.id}>
                <CharacterLink character={member} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="demo-panel-copy">
            Aucun membre dans ce jeu de données.
          </p>
        )}
      </section>
    </div>
  );
}

const clubIcons = {
  Sport: Dumbbell,
  'Art et culture': Palette,
  Académique: BookOpen,
  'Loisirs et organisation': UsersRound,
};

export function ClubsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const query = normalizeSearch(search);
  const matches = clubs.filter(
    (club) =>
      (!category || club.category === category) &&
      normalizeSearch(`${club.name} ${club.description}`).includes(query),
  );

  return (
    <div className="demo-page">
      <DemoHeading
        section="Université"
        title="Clubs du campus"
        description="Parcourez les activités par catégorie. Les responsables et les effectifs affichés sont fictifs."
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="club-search">Rechercher un club</Label>
          <Input
            id="club-search"
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
        {matches.length} club{matches.length === 1 ? '' : 's'} affiché
        {matches.length === 1 ? '' : 's'}
      </p>
      {matches.length ? (
        <div className="demo-grid club-grid">
          {matches.map((club) => {
            const Icon = clubIcons[club.category];
            return (
              <Card key={club.name} className="demo-card catalogue-card">
                <div className="catalogue-top">
                  <span className="panel-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <Badge variant="outline">{club.category}</Badge>
                </div>
                <h2>{club.name}</h2>
                <p>{club.description}</p>
                {club.provenance !== 'documented' && (
                  <Badge variant="outline">
                    {club.provenance === 'sample'
                      ? 'Exemple fictif'
                      : 'À confirmer'}
                  </Badge>
                )}
                <dl className="catalogue-facts">
                  <div>
                    <dt>Effectif fictif</dt>
                    <dd>
                      {club.members}
                      {club.capacity ? ` / ${club.capacity}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>Capacité</dt>
                    <dd>
                      {club.capacity ??
                        (club.provenance === 'to-confirm'
                          ? 'À confirmer'
                          : 'Illimitée')}
                    </dd>
                  </div>
                  <div>
                    <dt>Responsable fictif</dt>
                    <dd>
                      {club.leader ??
                        (club.name === 'Natation'
                          ? 'À confirmer'
                          : 'Non renseigné')}
                    </dd>
                  </div>
                </dl>
                {club.note && <p className="demo-aside">{club.note}</p>}
              </Card>
            );
          })}
        </div>
      ) : (
        <NoResults />
      )}
    </div>
  );
}

export function MajorsPage() {
  return (
    <div className="demo-page">
      <DemoHeading
        section="Université"
        title="Filières"
        description="Le catalogue initial est ouvert aux propositions. Une autre filière peut être proposée dans une fiche étudiante."
        action={
          <Button asChild>
            <Link to="/preview/character/new?major=other">
              Proposer une filière <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <ul className="demo-grid majors-grid">
        {majors.map((major) => (
          <li key={major}>
            <Card className="demo-card major-card">
              <Building2 aria-hidden="true" />
              <h2>{major}</h2>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
