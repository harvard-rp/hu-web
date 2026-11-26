import {
  ArrowRight,
  CalendarDays,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { announcements, events } from '@/features/demo/data';
import { findHouse } from '@/features/demo/catalogues';
import { characterTypes } from '@/features/demo/characters';
import { useDemo } from '@/features/demo/demo-state';
import { Avatar, CharacterLink } from '@/features/demo/demo-ui';

export function PreviewPage() {
  const { posts, activeCharacter: person, characters, ranking } = useDemo();
  if (!person) return null;
  return (
    <div className="preview-page">
      <header className="dashboard-heading">
        <h1>Accueil</h1>
        <span>Semestre d’automne</span>
      </header>
      <section
        id="overview"
        tabIndex={-1}
        className="dashboard-overview demo-panel"
        aria-label="Mon personnage"
      >
        <div className="dashboard-identity">
          <Avatar character={person} />
          <div>
            <Link className="dashboard-name" to="/preview/character">
              {person.name}
            </Link>
            <p>
              {person.type === 'student'
                ? [person.major, person.year].filter(Boolean).join(' · ') ||
                  'Étudiant'
                : characterTypes[person.type]}
            </p>
          </div>
          {person.type === 'student' && (
            <Badge variant="outline" asChild>
              <Link to={`/preview/houses/${person.house}`}>
                {findHouse(person.house)?.name} House
              </Link>
            </Badge>
          )}
        </div>
        {person.type === 'student' && (
          <div className="dashboard-stats">
            <Link to="/preview/ranking">
              <span>Réputation</span>
              <strong>
                {person.points.toLocaleString('fr-FR')} <small>pts</small>
              </strong>
            </Link>
            <Link to="/preview/ranking">
              <span>Classement</span>
              <strong>
                {ranking.findIndex(({ id }) => id === person.id) + 1}
                <sup>e</sup>
              </strong>
            </Link>
          </div>
        )}
      </section>
      <div className="dashboard-columns">
        <section
          id="announcements"
          tabIndex={-1}
          aria-labelledby="announcements-title"
          className="demo-panel"
        >
          <header className="demo-panel-header">
            <Megaphone aria-hidden="true" />
            <h2 id="announcements-title">Annonces</h2>
          </header>
          <ul className="demo-panel-list">
            {announcements.map(({ title, description, date }) => (
              <li key={title}>
                <p className="demo-date">{date}</p>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section
          id="events"
          tabIndex={-1}
          aria-labelledby="events-title"
          className="demo-panel"
        >
          <header className="demo-panel-header">
            <CalendarDays aria-hidden="true" />
            <h2 id="events-title">Prochains événements</h2>
            <Link to="/preview/agenda" className="text-link panel-action">
              Agenda <ArrowRight aria-hidden="true" />
            </Link>
          </header>
          <ul className="demo-panel-list compact-events">
            {events.map(({ id, title, day, month, datetime, time, place }) => (
              <li key={id}>
                <time className="date-tile" dateTime={datetime}>
                  <strong>{day}</strong>
                  <small>{month}</small>
                </time>
                <div>
                  <h3>{title}</h3>
                  <p>
                    {time} · {place}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="demo-panel" aria-labelledby="activity-title">
        <header className="demo-panel-header">
          <MessageSquare aria-hidden="true" />
          <h2 id="activity-title">Activité récente</h2>
          <Link to="/preview/social" className="text-link panel-action">
            Publications <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        <ul className="demo-panel-list activity-list">
          {posts.slice(0, 2).map((post) => {
            const author = characters.find(({ id }) => id === post.authorId);
            if (!author) return null;
            return (
              <li key={post.id}>
                <CharacterLink character={author} showHouse={false} />
                <p>{post.text}</p>
                <span className="demo-date">{post.time}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
