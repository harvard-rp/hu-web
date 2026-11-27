import { z } from 'zod';

export const playerContextSchema = z.strictObject({
  playerId: z.uuid(),
  capabilities: z.array(z.enum(['characters.review', 'boosts.manage'])),
  characters: z.array(
    z.strictObject({
      id: z.uuid(),
      validationStatus: z.enum([
        'draft',
        'submitted',
        'changes_requested',
        'approved',
        'rejected',
      ]),
      useStatus: z.enum(['active', 'suspended']),
      canAccessCampus: z.boolean(),
    }),
  ),
  canAccessCampus: z.boolean(),
});

export type PlayerContext = z.infer<typeof playerContextSchema>;
