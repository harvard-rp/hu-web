import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findHouse, houses } from '@/features/demo/catalogues';
import { characterTypes } from '@/features/demo/characters';
import { fixtureRelations } from '@/features/demo/data';
import { useDemo } from '@/features/demo/demo-state';
import {
  Avatar,
  BackLink,
  CharacterLink,
  DemoHeading,
  NoResults,
  normalizeSearch,
} from '@/features/demo/demo-ui';

function RelationList({ forId }: { forId: string }) {
  const { characters } = useDemo();
  const relations = fixtureRelations.flatMap((relation) => {
    const otherId =
      forId === 'camille'
        ? relation.characterId
        : relation.characterId === forId
          ? 'camille'
          : undefined;
    const other = characters.find(({ id }) => id === otherId);
    return other ? [{ ...relation, other }] : [];
  });
  if (!relations.length)
    return <p className="demo-panel-copy">Aucune relation renseignée.</p>;
  return (
    <ul className="demo-panel-list relations-list">
      {relations.map(({ other, kind, note }) => (
        <li key={other.id}>
          <CharacterLink character={other} showHouse={false} />
          <div>
            <strong>{kind}</strong>
            <p>{note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CharacterPage({ own = false }: { own?: boolean }) {
  const { characterId = '' } = useParams();
  const { characters, posts, activeCharacter } = useDemo();
  const character = own
    ? activeCharacter
    : characters.find(({ id }) => id === characterId);
  if (!character)
    return (
      <div className="demo-page">
        <BackLink to="/preview/directory">Voir les membres</BackLink>
        <DemoHeading title="Personnage introuvable" />
      </div>
    );
  const isActive = character.id === activeCharacter?.id;
  const socialPosts = posts.filter(({ authorId }) => authorId === character.id);
  return (
    <div className="demo-page profile-page">
      <header className="profile-card demo-panel">
        <Avatar character={character} />
        <DemoHeading
          title={character.name}
          description={characterTypes[character.type]}
        />
        {own && (
          <Button asChild variant="outline">
            <Link to="/preview/characters">Mes personnages</Link>
          </Button>
        )}
      </header>
      <div className="profile-columns">
        {character.type === 'student' ? (
          <section className="demo-panel" aria-labelledby="profile-studies">
            <header className="demo-panel-header">
              <h2 id="profile-studies">Études</h2>
            </header>
            <dl className="profile-facts demo-panel-copy">
              {character.major && (
                <div>
                  <dt>Filière</dt>
                  <dd>{character.major}</dd>
                </div>
              )}
              {character.year && (
                <div>
                  <dt>Année</dt>
                  <dd>{character.year}</dd>
                </div>
              )}
              <div>
                <dt>House</dt>
                <dd>
                  <Link
                    className="text-link"
                    to={`/preview/houses/${character.house}`}
                  >
                    {findHouse(character.house)?.name} House
                  </Link>
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          character.role && (
            <section className="demo-panel" aria-labelledby="profile-role">
              <header className="demo-panel-header">
                <h2 id="profile-role">Fonction</h2>
              </header>
              <p className="demo-panel-copy">{character.role}</p>
            </section>
          )
        )}
        <section className="demo-panel" aria-labelledby="profile-about">
          <header className="demo-panel-header">
            <h2 id="profile-about">Biographie</h2>
          </header>
          <p className="demo-panel-copy">
            {character.bio || 'Aucune biographie renseignée.'}
          </p>
        </section>
      </div>
      <section className="demo-panel" aria-labelledby="profile-relations">
        <header className="demo-panel-header">
          <h2 id="profile-relations">Relations</h2>
          {isActive && (
            <Link to="/preview/relations" className="text-link panel-action">
              Toutes les relations <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </header>
        <RelationList forId={character.id} />
      </section>
      <section className="demo-panel" aria-labelledby="profile-posts">
        <header className="demo-panel-header">
          <h2 id="profile-posts">Publications</h2>
          <Link to="/preview/social" className="text-link panel-action">
            Voir le fil <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        {socialPosts.length ? (
          <ul className="demo-panel-list">
            {socialPosts.map((post) => (
              <li key={post.id}>
                <p>{post.text}</p>
                <span className="demo-date">{post.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="demo-panel-copy">Aucune publication.</p>
        )}
      </section>
    </div>
  );
}

export function DirectoryPage() {
  const { characters } = useDemo();
  const [search, setSearch] = useState('');
  const [house, setHouse] = useState('');
  const query = normalizeSearch(search);
  const matches = characters.filter(
    (character) =>
      (!house || (character.type === 'student' && character.house === house)) &&
      normalizeSearch(
        `${character.name} ${character.type === 'student' ? character.major : characterTypes[character.type]}`,
      ).includes(query),
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
                {character.type === 'student'
                  ? [character.major, character.year]
                      .filter(Boolean)
                      .join(' · ')
                  : character.role}
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
  const { ranking, activeCharacter } = useDemo();
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
                const active = character.id === activeCharacter?.id;
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
      <details className="demo-panel demo-panel-copy reputation-notes">
        <summary>Pistes de réputation</summary>
        <p>
          Notes et devoirs, participation aux clubs, actions RP, gossip,
          événements et animations, inactivité éventuelle. Le barème reste à
          définir.
        </p>
      </details>
    </div>
  );
}

export function RelationsPage() {
  const { activeCharacter } = useDemo();
  if (!activeCharacter) return null;
  return (
    <div className="demo-page">
      <DemoHeading title="Relations" description={activeCharacter.name} />
      <div className="demo-panel">
        <RelationList forId={activeCharacter.id} />
      </div>
    </div>
  );
}
