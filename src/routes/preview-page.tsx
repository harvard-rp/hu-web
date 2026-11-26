import { CalendarDays, Megaphone, Sparkles, Trophy } from 'lucide-react';

import campusImage from '@/assets/campus-autumn.webp';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

const indicators = [
  {
    Icon: Sparkles,
    label: 'Reputation',
    detail: 'Character reputation will appear here.',
  },
  {
    Icon: Trophy,
    label: 'Leaderboard',
    detail: 'The campus rankings will appear here.',
  },
];

const notices = [
  {
    id: 'announcements',
    title: 'Announcements',
    Icon: Megaphone,
    empty: 'No announcements yet',
    detail: 'Campus notices will be published here.',
  },
  {
    id: 'events',
    title: 'Upcoming events',
    Icon: CalendarDays,
    empty: 'No events scheduled',
    detail: 'Future roleplay events will appear here.',
  },
];

export function PreviewPage() {
  return (
    <div className="preview-page">
      <section
        id="overview"
        className="preview-hero"
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
            Development preview
          </Badge>
          <h1 id="preview-title">Welcome to campus.</h1>
          <p>
            Explore the layout of the future Digital Campus and see where campus
            updates will live.
          </p>
        </div>
      </section>

      <div className="indicator-grid" aria-label="Future indicators">
        {indicators.map(({ Icon, label, detail }) => (
          <Card className="indicator-card" key={label}>
            <CardHeader className="indicator-header">
              <span className="indicator-icon">
                <Icon aria-hidden="true" />
              </span>
              <h2>{label}</h2>
              <Badge variant="outline" className="unavailable-chip">
                Unavailable
              </Badge>
            </CardHeader>
            <CardContent className="indicator-content">
              <span aria-hidden="true" className="indicator-dash">
                —
              </span>
              <p>{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="notice-grid">
        {notices.map(({ id, title, Icon, empty, detail }) => (
          <section
            id={id}
            key={id}
            tabIndex={-1}
            aria-labelledby={`${id}-title`}
          >
            <Card className="notice-card">
              <CardHeader className="notice-header">
                <h2 id={`${id}-title`}>{title}</h2>
              </CardHeader>
              <Empty className="notice-empty">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Icon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>{empty}</EmptyTitle>
                  <EmptyDescription>{detail}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
