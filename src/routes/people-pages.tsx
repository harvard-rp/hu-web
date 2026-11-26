import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  characters,
  findCharacter,
  findHouse,
  houses,
  ranking,
  relations,
  student,
} from '@/features/demo/data';
import {
  Avatar,
  BackLink,
  CharacterLink,
  DemoHeading,
  NoResults,
  normalizeSearch,
} from '@/features/demo/demo-ui';

function RelationList() {
  return (
    <ul className="demo-panel-list relations-list">
      {relations.map(({ characterId, kind, note }) => {
        const character = findCharacter(characterId);
        if (!character) return null;
        return (
          <li key={characterId}>
            <CharacterLink character={character} showHouse={false} />
            <div>
              <strong>{kind}</strong>
              <p>{note}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CharacterPage({ own = false }: { own?: boolean }) {
  const { characterId = '' } = useParams();
  const character = own ? student : findCharacter(characterId);
  if (!character)
    return (
      <div className="demo-page">
        <BackLink to="/preview/directory">Voir les membres</BackLink>
        <DemoHeading title="Personnage introuvable" />
      </div>
    );
  const house = findHouse(character.house);
  const isStudent = character.id === student.id;
  const relation = relations.find((item) => item.characterId === character.id);
  return (
    <div className="demo-page profile-page">
      <header className="profile-card demo-panel">
        <Avatar character={character} />
        <DemoHeading title={character.name} description="Personnage fictif" />
        {own && (
          <Button asChild variant="outline">
            <Link to="/preview/character/new">Créer un personnage</Link>
          </Button>
        )}
      </header>
      <div className="profile-columns">
        <section className="demo-panel" aria-labelledby="profile-studies">
          <header className="demo-panel-header">
            <h2 id="profile-studies">Études</h2>
          </header>
          <dl className="profile-facts demo-panel-copy">
            <div>
              <dt>Filière</dt>
              <dd>{character.major}</dd>
            </div>
            <div>
              <dt>Année</dt>
              <dd>{character.year}</dd>
            </div>
            <div>
              <dt>House</dt>
              <dd>
                <Link
                  className="text-link"
                  to={`/preview/houses/${character.house}`}
                >
                  {house?.name} House
                </Link>
              </dd>
            </div>
          </dl>
        </section>
        <section className="demo-panel" aria-labelledby="profile-about">
          <header className="demo-panel-header">
            <h2 id="profile-about">Biographie</h2>
          </header>
          <p className="demo-panel-copy">{character.bio}</p>
        </section>
      </div>
      <section className="demo-panel" aria-labelledby="profile-relations">
        <header className="demo-panel-header">
          <h2 id="profile-relations">Relations</h2>
          {isStudent && (
            <Link to="/preview/relations" className="text-link panel-action">
              Toutes les relations <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </header>
        {isStudent ? (
          <RelationList />
        ) : relation ? (
          <ul className="demo-panel-list relations-list">
            <li>
              <CharacterLink character={student} showHouse={false} />
              <div>
                <strong>{relation.kind}</strong>
                <p>{relation.note}</p>
              </div>
            </li>
          </ul>
        ) : (
          <p className="demo-panel-copy">Aucune relation renseignée.</p>
        )}
      </section>
    </div>
  );
}

export function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [house, setHouse] = useState('');
  const query = normalizeSearch(search);
  const matches = characters.filter(
    (character) =>
      (!house || character.house === house) &&
      normalizeSearch(`${character.name} ${character.major}`).includes(query),
  );
  return (
    <div className="demo-page">
      <DemoHeading title="Membres" />
      <div className="demo-filters">
        <div>
          <Label htmlFor="people-search">Nom ou filière</Label>
          <Input
            id="people-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="people-house">House</Label>
          <select
            id="people-house"
            value={house}
            onChange={(event) => setHouse(event.target.value)}
          >
            <option value="">Toutes les Houses</option>
            {houses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="demo-aside" role="status">
        {matches.length} personnage{matches.length === 1 ? '' : 's'}
      </p>
      {matches.length ? (
        <ul className="demo-panel demo-panel-list member-list">
          {matches.map((character) => (
            <li key={character.id}>
              <CharacterLink character={character} />
              <p>
                {character.major} · {character.year}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <NoResults />
      )}
    </div>
  );
}

export function RankingPage() {
  const [search, setSearch] = useState('');
  const query = normalizeSearch(search);
  const matches = ranking
    .map((character, index) => ({
      character,
      position: index + 1,
      house: findHouse(character.house)?.name,
    }))
    .filter(({ character, house }) =>
      normalizeSearch(`${character.name} ${house ?? ''}`).includes(query),
    );
  return (
    <div className="demo-page">
      <DemoHeading title="Classement" />
      <div className="demo-filters">
        <div>
          <Label htmlFor="ranking-search">Rechercher par nom ou House</Label>
          <Input
            id="ranking-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <p className="sr-only" role="status">
        {matches.length} résultat{matches.length === 1 ? '' : 's'}
      </p>
      {matches.length ? (
        <div className="demo-panel ranking-panel">
          <table className="ranking-table">
            <caption className="sr-only">Classement de réputation</caption>
            <thead>
              <tr>
                <th scope="col">Rang</th>
                <th scope="col">Personnage</th>
                <th scope="col">House</th>
                <th scope="col">Points</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(({ character, position, house }) => {
                const active = character.id === student.id;
                return (
                  <tr
                    key={character.id}
                    className={active ? 'current-student' : undefined}
                  >
                    <td>{position}</td>
                    <th scope="row">
                      <CharacterLink character={character} showHouse={false} />
                      {active && (
                        <small className="active-character">Vous</small>
                      )}
                    </th>
                    <td>{house}</td>
                    <td>{character.points.toLocaleString('fr-FR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <NoResults />
      )}
    </div>
  );
}

export function RelationsPage() {
  return (
    <div className="demo-page">
      <DemoHeading title="Relations" description={student.name} />
      <div className="demo-panel">
        <RelationList />
      </div>
    </div>
  );
}
