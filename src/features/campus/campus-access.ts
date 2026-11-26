import type { CharacterType } from '@/features/demo/characters';

export function canOpenCampusPath(path: string, type?: CharacterType) {
  const route = path.split('#')[0]!.toLowerCase().replace(/\/+$/, '');
  const section = route.split('/')[2];

  if (
    route === '/preview/character/new' ||
    section === 'characters' ||
    section === 'staff'
  ) {
    return true;
  }
  if (section === 'ranking') return type === 'student';
  return !!type;
}
