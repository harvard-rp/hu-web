import { z } from 'zod';
import { readPublicUrl } from './public-url.ts';

export type SupabaseConfig =
  | { kind: 'disabled' | 'invalid' }
  | { kind: 'ready'; origin: string; publishableKey: string };

const settings = z.object({
  VITE_SUPABASE_URL: z.string().trim().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().trim().optional(),
});

export function readSupabaseConfig(
  env: unknown,
  demoBuild = false,
): SupabaseConfig {
  if (demoBuild) return { kind: 'disabled' };
  const result = settings.safeParse(env);
  if (!result.success) return { kind: 'invalid' };
  const { VITE_SUPABASE_URL: value, VITE_SUPABASE_PUBLISHABLE_KEY: key } =
    result.data;
  if (!value && !key) return { kind: 'disabled' };
  const url = value && readPublicUrl(value);
  if (
    !url ||
    url.pathname !== '/' ||
    !key ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)
  ) {
    return { kind: 'invalid' };
  }
  return { kind: 'ready', origin: url.origin, publishableKey: key };
}
