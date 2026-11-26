import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Shield,
  Trophy,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { NavLink } from 'react-router';

import { useDemo } from '@/features/demo/demo-state';
import { canOpenCampusPath } from './campus-access';

export const campusGroups = [
  {
    title: 'Campus',
    links: [
      { label: 'Accueil', path: '/preview', Icon: LayoutDashboard },
      { label: 'Mon personnage', path: '/preview/character', Icon: UserRound },
      {
        label: 'Mes personnages',
        path: '/preview/characters',
        Icon: UsersRound,
      },
      {
        label: 'Créer un personnage',
        path: '/preview/character/new',
        Icon: UserPlus,
      },
      { label: 'Relations', path: '/preview/relations', Icon: UsersRound },
    ],
  },
  {
    title: 'Université',
    links: [
      { label: 'Houses', path: '/preview/houses', Icon: Shield },
      { label: 'Clubs', path: '/preview/clubs', Icon: BookOpen },
      { label: 'Filières', path: '/preview/majors', Icon: GraduationCap },
      { label: 'Membres', path: '/preview/directory', Icon: UsersRound },
    ],
  },
  {
    title: 'Communauté',
    links: [
      { label: 'Classement', path: '/preview/ranking', Icon: Trophy },
      { label: 'Publications', path: '/preview/social', Icon: MessagesSquare },
      { label: 'Agenda', path: '/preview/agenda', Icon: CalendarDays },
    ],
  },
  {
    title: 'Staff · simulation HRP',
    links: [
      { label: 'Espace staff', path: '/preview/staff', Icon: ClipboardCheck },
    ],
  },
];

export const campusDestinations = campusGroups.flatMap((group) => group.links);

export function CampusNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const { activeCharacter, capacity } = useDemo();
  const groups = campusGroups
    .map(({ title, links }) => ({
      title,
      links: links.filter(
        ({ path }) =>
          canOpenCampusPath(path, activeCharacter?.type) &&
          (path !== '/preview/character/new' || capacity.available > 0),
      ),
    }))
    .filter(({ links }) => links.length > 0);
  return (
    <nav
      aria-label="Navigation du campus"
      className="campus-navigation demo-navigation"
    >
      {groups.map(({ title, links }) => (
        <div key={title}>
          <p className="nav-caption">{title}</p>
          <ul>
            {links.map(({ label, path, Icon }) => (
              <li key={path}>
                <NavLink
                  end={path === '/preview' || path === '/preview/character'}
                  to={path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `campus-nav-link${isActive ? ' active' : ''}`
                  }
                >
                  <Icon aria-hidden="true" /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
