import { ArrowRight, Heart, MapPin, MessageCircle, Send } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import yardPhoto from '@/assets/harvard-yard.webp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { events, type DemoPost } from '@/features/demo/data';
import { useDemo } from '@/features/demo/demo-state';
import {
  Avatar,
  CharacterLink,
  DemoHeading,
  NoResults,
} from '@/features/demo/demo-ui';

function PostCard({ post }: { post: DemoPost }) {
  const { likes, likeCount, toggleLike, addComment, characters } = useDemo();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const commentsId = useId();
  const author = characters.find(({ id }) => id === post.authorId);
  if (!author) return null;
  const liked = likes.includes(post.id);

  function sendComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    addComment(post.id, comment.trim());
    setComment('');
  }

  return (
    <article
      className="demo-panel social-post"
      aria-label={`Publication de ${author.name}`}
    >
      <div className="post-author">
        <CharacterLink character={author} />
        <p className="demo-date">{post.time}</p>
      </div>
      <p className="post-text">{post.text}</p>
      {post.photo && (
        <figure className="post-figure">
          <img
            src={yardPhoto}
            alt="Allées de Harvard Yard en automne"
            loading="lazy"
            width={960}
            height={600}
          />
          <figcaption>
            <a href="https://commons.wikimedia.org/wiki/File:Harvard_yard.jpg">
              Pundit, Wikimedia Commons
            </a>
            {' · '}
            <a href="https://creativecommons.org/licenses/by-sa/3.0/">
              CC BY-SA 3.0
            </a>
            {' · Recadrée'}
          </figcaption>
        </figure>
      )}
      <div className="post-actions">
        <Button
          type="button"
          variant="ghost"
          aria-pressed={liked}
          onClick={() => toggleLike(post.id)}
        >
          <Heart aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />{' '}
          J’aime <span>{post.likes + likeCount(post.id)}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          aria-controls={commentsId}
          onClick={() => setOpen(!open)}
        >
          <MessageCircle aria-hidden="true" /> Commentaires{' '}
          <span>{post.comments.length}</span>
        </Button>
      </div>
      <div id={commentsId} hidden={!open} className="post-comments">
        {post.comments.length ? (
          <ul>
            {post.comments.map((entry) => (
              <li key={entry.id}>
                <strong>
                  {characters.find(({ id }) => id === entry.authorId)?.name}
                </strong>
                <p>{entry.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="demo-aside">Aucun commentaire.</p>
        )}
        <form onSubmit={sendComment} className="comment-form">
          <div>
            <Label htmlFor={`${commentsId}-text`}>Commentaire RP</Label>
            <Input
              id={`${commentsId}-text`}
              maxLength={280}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={!comment.trim()}>
            Envoyer
          </Button>
        </form>
      </div>
    </article>
  );
}

export function SocialPage() {
  const { posts, addPost, activeCharacter, characters } = useDemo();
  const [post, setPost] = useState('');
  if (!activeCharacter) return null;
  const authors = [...new Set(posts.map((item) => item.authorId))].filter(
    (id) => id !== activeCharacter.id,
  );
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!post.trim()) return;
    addPost(post.trim());
    setPost('');
    toast.success('Publication ajoutée');
  }
  return (
    <div className="demo-page">
      <DemoHeading title="Publications" />
      <div className="social-layout">
        <div className="social-feed">
          <form onSubmit={publish} className="demo-panel social-composer">
            <div className="post-author">
              <Avatar character={activeCharacter} />
              <div>
                <strong>{activeCharacter.name}</strong>
                <p className="demo-aside">Votre personnage</p>
              </div>
            </div>
            <div className="demo-field">
              <Label htmlFor="new-post">Publication RP</Label>
              <textarea
                id="new-post"
                aria-describedby="post-privacy"
                rows={3}
                maxLength={600}
                value={post}
                onChange={(event) => setPost(event.target.value)}
                placeholder="Écrire une publication…"
              />
            </div>
            <div className="composer-actions">
              <p className="demo-aside" id="post-privacy">
                Session locale. N’ajoutez aucune donnée personnelle.
              </p>
              <Button type="submit" disabled={!post.trim()}>
                <Send aria-hidden="true" /> Publier
              </Button>
            </div>
          </form>
          {posts.map((item) => (
            <PostCard key={item.id} post={item} />
          ))}
        </div>
        <aside className="social-sidebar" aria-label="Communauté">
          <section className="demo-panel" aria-labelledby="social-members">
            <header className="demo-panel-header">
              <h2 id="social-members">Dans le fil</h2>
            </header>
            <ul className="demo-panel-list">
              {authors.map((id) => {
                const person = characters.find(
                  (character) => character.id === id,
                );
                return person ? (
                  <li key={id}>
                    <CharacterLink character={person} />
                  </li>
                ) : null;
              })}
            </ul>
            <Link
              to="/preview/directory"
              className="social-sidebar-link text-link"
            >
              Voir les membres <ArrowRight aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

const eventCategories = [...new Set(events.map((event) => event.category))];

export function AgendaPage() {
  const [category, setCategory] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const { events: saved, toggleEvent } = useDemo();
  const filtered = events.filter(
    (event) =>
      (!category || event.category === category) &&
      (!savedOnly || saved.includes(event.id)),
  );
  return (
    <div className="demo-page">
      <DemoHeading
        title="Agenda"
        description="Les inscriptions sont simulées."
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="agenda-category">Catégorie</Label>
          <select
            id="agenda-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {eventCategories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <label className="demo-checkbox">
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={(event) => setSavedOnly(event.target.checked)}
          />{' '}
          Mes inscriptions
        </label>
      </div>
      {filtered.length ? (
        <ol className="demo-panel agenda-list">
          {filtered.map(
            ({
              id,
              title,
              day,
              month,
              datetime,
              time,
              place,
              category: label,
              description,
            }) => {
              const attending = saved.includes(id);
              return (
                <li key={id}>
                  <Card className="agenda-card">
                    <time className="date-tile" dateTime={datetime}>
                      <strong>{day}</strong>
                      <small>{month}</small>
                    </time>
                    <div>
                      <span className="demo-date">{label}</span>
                      <h2>{title}</h2>
                      <p>{description}</p>
                      <p className="agenda-meta">
                        {time} <MapPin aria-hidden="true" /> {place}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={attending ? 'secondary' : 'outline'}
                      aria-pressed={attending}
                      aria-label={`${attending ? 'Inscrit' : 'S’inscrire'} · ${title}`}
                      onClick={() => toggleEvent(id)}
                    >
                      {attending ? 'Inscrit' : 'S’inscrire'}
                    </Button>
                  </Card>
                </li>
              );
            },
          )}
        </ol>
      ) : (
        <NoResults description="Aucun rendez-vous pour ces filtres." />
      )}
    </div>
  );
}
