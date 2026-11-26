import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import campusPhoto from '@/assets/harvard-hall.webp';
import campusPhotoSmall from '@/assets/harvard-hall-small.webp';
import { Button } from '@/components/ui/button';

export function HomePage() {
  return (
    <section className="home-hero content-shell" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <p className="public-context">Digital Campus</p>
        <h1 id="home-title" className="home-title">
          <span>Harvard</span> <span>University RP</span>
        </h1>
        <p className="hero-description">Campus de jeu de rôle sur Discord.</p>
        <div className="hero-actions">
          <Button asChild>
            <Link to="/preview">
              Accéder au campus <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Connexion</Link>
          </Button>
        </div>
      </div>
      <figure className="home-hero-figure">
        <img
          src={campusPhoto}
          srcSet={`${campusPhotoSmall} 720w, ${campusPhoto} 1440w`}
          sizes="(max-width: 760px) calc(100vw - 2rem), (max-width: 1280px) 55vw, 680px"
          alt="Façade en briques rouges de Harvard Hall"
          width={1440}
          height={1080}
          fetchPriority="high"
        />
        <figcaption>
          Harvard Hall, Cambridge
          <a href="https://commons.wikimedia.org/wiki/File:Harvard_Hall_-_Harvard_University.jpg">
            Photo de Daderot
          </a>
        </figcaption>
      </figure>
    </section>
  );
}
