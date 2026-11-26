import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  MessagesSquare,
  Settings,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router';

const futureSections = [
  { label: 'My Character', Icon: UserRound },
  { label: 'Leaderboard', Icon: Trophy },
  { label: 'Social', Icon: MessagesSquare },
  { label: 'Relationships', Icon: UsersRound },
  { label: 'University', Icon: GraduationCap },
  { label: 'Calendar', Icon: CalendarDays },
  { label: 'Settings', Icon: Settings },
];

export const previewSections = [
  { id: 'overview', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'announcements', label: 'Announcements', Icon: MessagesSquare },
  { id: 'events', label: 'Events', Icon: CalendarDays },
];

export function CampusNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Campus navigation" className="campus-navigation">
      <p className="nav-caption">Campus</p>
      <ul>
        <li>
          <Link
            to="/preview"
            onClick={onNavigate}
            aria-current="page"
            className="campus-nav-link active"
          >
            <LayoutDashboard aria-hidden="true" /> Dashboard
          </Link>
        </li>
        {futureSections.map(({ label, Icon }) => (
          <li key={label}>
            <span className="campus-nav-link unavailable" aria-disabled="true">
              <Icon aria-hidden="true" />
              <span>
                {label}
                <span className="sr-only"> · unavailable</span>
              </span>
              <LockKeyhole className="nav-lock" aria-hidden="true" />
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
