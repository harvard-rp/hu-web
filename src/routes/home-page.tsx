import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
} from 'lucide-react';
import { Link } from 'react-router';

import campusImage from '@/assets/campus-autumn.webp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const campusLinks = [
  {
    Icon: LayoutDashboard,
    title: 'Campus overview',
    description: 'Take a first look at the student dashboard.',
    href: '/preview',
  },
  {
    Icon: Megaphone,
    title: 'Announcements',
    description: 'Visit the campus noticeboard.',
    href: '/preview#announcements',
  },
  {
    Icon: CalendarDays,
    title: 'Calendar',
    description: 'See where upcoming RP events will appear.',
    href: '/preview#events',
  },
];

export function HomePage() {
  return (
    <>
      <section className="home-hero content-shell" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow">Discord university roleplay</p>
          <h1 id="home-title" className="home-title">
            The Digital <em>Campus.</em>
          </h1>
          <p className="hero-description">
            Your home for Harvard University RP. Explore the campus, catch
            university announcements, and see where the next chapter of your
            roleplay will begin.
          </p>
          <div className="hero-actions">
            <Button asChild size="lg">
              <Link to="/preview">
                Explore campus <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            <Link to="/login" className="text-link">
              Sign in <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
        <figure className="home-hero-figure">
          <img
            src={campusImage}
            alt="Illustration of a red-brick university quadrangle framed by autumn trees"
            width={1260}
            height={945}
            fetchPriority="high"
          />
          <figcaption>Fictional campus illustration</figcaption>
        </figure>
      </section>

      <section
        className="around-campus content-shell"
        aria-labelledby="around-title"
      >
        <h2 id="around-title">Around campus</h2>
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
