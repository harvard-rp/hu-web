import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router';

import campusImage from '@/assets/campus-autumn.webp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const campusLinks = [
  {
    Icon: LayoutDashboard,
    title: 'Tableau de bord',
    description: 'Ouvrez la session fictive de Camille Delorme.',
    href: '/preview',
  },
  {
    Icon: Shield,
    title: 'Les Houses',
    description: 'Découvrez les douze résidences du campus RP.',
    href: '/preview/houses',
  },
  {
    Icon: CalendarDays,
    title: 'Agenda',
    description: 'Parcourez les rendez-vous fictifs du campus.',
    href: '/preview/agenda',
  },
];

export function HomePage() {
  return (
    <>
      <section className="home-hero content-shell" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow">Roleplay universitaire sur Discord</p>
          <h1 id="home-title" className="home-title">
            Digital <em>Campus.</em>
          </h1>
          <p className="hero-description">
            Incarnez un personnage fictif, découvrez les Houses et explorez la
            vie étudiante dans le prototype de Harvard University RP.
          </p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <Link to="/preview">
                Entrer dans la démo <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            <Link to="/login" className="text-link">
              Connexion <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
        <figure className="home-hero-figure">
          <img
            src={campusImage}
            alt="Cour universitaire fictive en briques rouges, bordée d’arbres d’automne"
            width={1260}
            height={945}
            fetchPriority="high"
          />
          <figcaption>Illustration d’un campus fictif</figcaption>
        </figure>
      </section>

      <section
        className="around-campus content-shell"
        aria-labelledby="around-title"
      >
        <h2 id="around-title">La vie sur le campus</h2>
        <div className="campus-link-grid">
          {campusLinks.map(({ Icon, title, description, href }) => (
            <Card className="campus-link-card" key={title}>
              <Link to={href} className="campus-link">
                <span className="campus-link-icon">
                  <Icon aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="campus-link-arrow"
                  aria-hidden="true"
                />
                <h3>{title}</h3>
                <p>{description}</p>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
