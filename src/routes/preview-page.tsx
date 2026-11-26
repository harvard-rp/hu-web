import {
  ArrowUpRight,
  CalendarDays,
  Megaphone,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router';

import campusImage from '@/assets/campus-autumn.webp';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { announcements, events, ranking, student } from '@/features/demo/data';

const stats = [
  {
    label: 'Réputation',
    value: student.points,
    subtitle: 'Points fictifs',
    path: '/preview/ranking',
    Icon: Sparkles,
  },
  {
    label: 'Classement',
    value: `${ranking.indexOf(student) + 1}e`,
    subtitle: 'Position de démonstration',
    path: '/preview/ranking',
    Icon: Trophy,
  },
  {
    label: 'Ma House',
    value: 'Adams',
    subtitle: 'River Houses',
    path: '/preview/houses/adams',
    Icon: Shield,
  },
];

export function PreviewPage() {
  return (
    <div className="preview-page">
      <section
        id="overview"
        className="preview-hero demo-welcome"
        tabIndex={-1}
        aria-labelledby="preview-title"
      >
        <img
          src={campusImage}
          alt=""
          width={1260}
          height={945}
          fetchPriority="high"
        />
        <div className="preview-hero-copy">
          <Badge variant="outline" className="preview-label">
            Semestre d’automne
          </Badge>
          <h1 id="preview-title">Bienvenue, Camille.</h1>
          <p>
            Adams House <span aria-hidden="true">·</span> Littérature{' '}
            <span aria-hidden="true">·</span> 2e année
          </p>
          <Link className="preview-profile" to="/preview/character">
            Voir ma fiche <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="dashboard-stats">
        {stats.map(({ label, value, subtitle, path, Icon }) => (
          <Card key={label} className="demo-card stat-card">
            <Link to={path} className="stat-link">
              <span className="stat-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="stat-label">{label}</span>
              <strong>{value}</strong>
              <small>{subtitle}</small>
              <ArrowUpRight className="stat-arrow" aria-hidden="true" />
            </Link>
          </Card>
        ))}
      </div>

      <div className="dashboard-columns">
        <section
          id="announcements"
          tabIndex={-1}
          aria-labelledby="announcements-title"
          className="demo-panel"
        >
          <header className="demo-panel-header">
            <span className="panel-icon">
              <Megaphone aria-hidden="true" />
            </span>
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
            <span className="panel-icon">
              <CalendarDays aria-hidden="true" />
            </span>
            <h2 id="events-title">Agenda</h2>
            <Link to="/preview/agenda" className="text-link panel-action">
              Voir l’agenda <ArrowUpRight aria-hidden="true" />
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
    </div>
  );
}
