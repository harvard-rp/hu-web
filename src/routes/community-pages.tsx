import { CalendarDays, Heart, MapPin, MessageCircle, Send } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import campusImage from '@/assets/campus-autumn.webp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  events,
  findCharacter,
  student,
  type DemoPost,
} from '@/features/demo/data';
import { useDemo } from '@/features/demo/demo-state';
import {
  Avatar,
  CharacterLink,
  DemoHeading,
  NoResults,
} from '@/features/demo/demo-ui';

function PostCard({ post }: { post: DemoPost }) {
  const { likes, toggleLike, addComment } = useDemo();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const commentsId = useId();
  const author = findCharacter(post.authorId);
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
        <img
          src={campusImage}
          alt="Cour fictive sous les couleurs d’automne"
          loading="lazy"
          width={1260}
          height={945}
        />
      )}
      <div className="post-actions">
        <Button
          type="button"
          variant="ghost"
          aria-pressed={liked}
          onClick={() => toggleLike(post.id)}
        >
          <Heart aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />{' '}
          J’aime <span>{post.likes + Number(liked)}</span>
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
                <strong>{findCharacter(entry.authorId)?.name}</strong>
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
  const { posts, addPost } = useDemo();
  const [post, setPost] = useState('');
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!post.trim()) return;
    addPost(post.trim());
    setPost('');
    toast.success('Publication ajoutée à cette session fictive');
  }
  return (
    <div className="demo-page">
      <DemoHeading
        section="Communauté"
        title="Journal RP"
        description="Le fil des personnages. Les publications, réactions et commentaires restent dans cette session fictive."
      />
      <div className="social-feed">
        <form onSubmit={publish} className="demo-panel social-composer">
          <div className="post-author">
            <Avatar character={student} />
            <strong>{student.name}</strong>
          </div>
          <div className="demo-field">
            <Label htmlFor="new-post">Publication RP</Label>
            <textarea
              id="new-post"
              rows={3}
              maxLength={600}
              value={post}
              onChange={(event) => setPost(event.target.value)}
              placeholder="Écrire en tant que Camille…"
            />
          </div>
          <Button type="submit" disabled={!post.trim()}>
            <Send aria-hidden="true" /> Publier dans la démo
          </Button>
        </form>
        {posts.map((item) => (
          <PostCard key={item.id} post={item} />
        ))}
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
        section="Communauté"
        title="Agenda universitaire"
        description="Rendez-vous fictifs du semestre d’automne. Les inscriptions sont simulées."
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
          Mes inscriptions simulées
        </label>
      </div>
      {filtered.length ? (
        <ul className="agenda-list">
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
                  <Card className="demo-card agenda-card">
                    <time className="date-tile" dateTime={datetime}>
                      <strong>{day}</strong>
                      <small>{month}</small>
                    </time>
                    <div>
                      <Badge variant="outline">{label}</Badge>
                      <h2>{title}</h2>
                      <p>{description}</p>
                      <p className="agenda-meta">
                        <CalendarDays aria-hidden="true" /> {time}{' '}
                        <MapPin aria-hidden="true" /> {place}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={attending ? 'secondary' : 'outline'}
                      aria-pressed={attending}
                      aria-label={`${attending ? 'Inscription simulée' : 'Simuler l’inscription'} · ${title}`}
                      onClick={() => toggleEvent(id)}
                    >
                      {attending
                        ? 'Inscription simulée'
                        : 'Simuler l’inscription'}
                    </Button>
                  </Card>
                </li>
              );
            },
          )}
        </ul>
      ) : (
        <NoResults description="Aucun rendez-vous pour ces filtres." />
      )}
    </div>
  );
}
