import { ArrowUpRight, Medal } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export function CharacterPage({ own = false }: { own?: boolean }) {
  const { characterId = '' } = useParams();
  const character = own ? student : findCharacter(characterId);
  if (!character)
    return (
      <div className="demo-page">
        <BackLink to="/preview/directory">Voir les effectifs</BackLink>
        <DemoHeading title="Personnage introuvable" />
      </div>
    );
  const house = findHouse(character.house);
  return (
    <div className="demo-page">
      <BackLink to={own ? '/preview' : '/preview/directory'}>
        {own ? 'Tableau de bord' : 'Voir les effectifs'}
      </BackLink>
      <div className="profile-card demo-panel">
        <Avatar character={character} />
        <div>
          <DemoHeading
            section={own ? 'Mon personnage' : 'Profil fictif'}
            title={character.name}
            description={`${character.major} · ${character.year}`}
          />
          <Link className="text-link" to={`/preview/houses/${character.house}`}>
            {house?.name} House <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        {own && (
          <Button asChild variant="outline">
            <Link to="/preview/character/new">Créer une fiche</Link>
          </Button>
        )}
      </div>
      <section className="demo-panel" aria-labelledby="profile-about">
        <header className="demo-panel-header">
          <h2 id="profile-about">Présentation RP</h2>
          <Badge variant="outline">Personnage fictif</Badge>
        </header>
        <p className="demo-panel-copy">{character.bio}</p>
      </section>
      {own && (
        <Link to="/preview/relations" className="text-link">
          Voir mes relations <ArrowUpRight aria-hidden="true" />
        </Link>
      )}
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
      <DemoHeading
        section="Université"
        title="Effectifs universitaires"
        description="L’annuaire rassemble les personnages fictifs de cette démonstration."
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="people-search">Nom ou filière</Label>
          <Input
            id="people-search"
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
        <ul className="demo-grid directory-grid">
          {matches.map((character) => (
            <li key={character.id}>
              <Card className="demo-card directory-card">
                <CharacterLink character={character} />
                <p>
                  {character.major} · {character.year}
                </p>
              </Card>
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
  return (
    <div className="demo-page">
      <DemoHeading
        section="Communauté"
        title="Classement de réputation"
        description="Les positions et les points sont issus d’un jeu de données de démonstration."
      />
      <ol className="demo-panel ranking-list" aria-label="Classement">
        {ranking.map((character, index) => (
          <li
            key={character.id}
            className={
              character.id === student.id ? 'current-student' : undefined
            }
          >
            <span className="rank-value">
              <span className="sr-only">Position </span>
              {index + 1}
              {index === 0 && <Medal aria-hidden="true" />}
            </span>
            <CharacterLink character={character} />
            <strong className="rank-points">
              {character.points.toLocaleString('fr-FR')} <small>pts</small>
            </strong>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RelationsPage() {
  return (
    <div className="demo-page">
      <DemoHeading
        section="Vie étudiante"
        title="Relations RP"
        description="Les liens de Camille dans l’histoire fictive du campus."
      />
      <ul className="demo-grid directory-grid">
        {relations.map(({ characterId, kind, note }) => {
          const character = findCharacter(characterId);
          if (!character) return null;
          return (
            <li key={characterId}>
              <Card className="demo-card directory-card">
                <CharacterLink character={character} />
                <Badge variant="outline">{kind}</Badge>
                <p>{note}</p>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
