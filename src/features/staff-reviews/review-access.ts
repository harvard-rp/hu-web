import type { PlayerSession } from '@/features/player-characters/player-queries';

export type ReviewSession = PlayerSession & { grant: AbortSignal };
export const staffQueuePath = '/account/staff';
export const backToQueue = { to: staffQueuePath, label: 'Retour à la file' };
export const backToAccount = {
  to: '/account',
  label: 'Retour à mes personnages',
};
