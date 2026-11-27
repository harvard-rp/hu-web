import { webcrypto } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import {
  createAuthStorage,
  createSupabaseAuth,
} from '@/lib/services/supabase-auth';

const storageKey = 'hu-test-session';
const projectOrigin = 'https://supabase-auth-test.example';
const publicKey = 'sb_publishable_fake_test_key';

describe('Supabase SDK authentication adapter', () => {
  it('drops Discord tokens while retaining the SDK session and separate PKCE verifier', async () => {
    const storage = createAuthStorage(localStorage, storageKey);
    const session = {
      access_token: 'supabase-access',
      refresh_token: 'supabase-refresh',
      user: { id: 'one' },
    };
    const providerTokens = {
      provider_token: 'discord-token',
      provider_refresh_token: 'discord-refresh',
    };
    const raw = JSON.stringify({ ...session, ...providerTokens });
    await storage.setItem(storageKey, raw);
    await storage.setItem(storageKey + '-code-verifier', '"test-verifier"');
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(session);
    expect(await storage.getItem(storageKey + '-code-verifier')).toBe(
      '"test-verifier"',
    );

    localStorage.setItem(storageKey, raw);
    expect(JSON.parse((await storage.getItem(storageKey))!)).toEqual(session);
    expect(localStorage.getItem(storageKey)).not.toContain('discord-token');
    await storage.removeItem(storageKey);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('starts Discord PKCE with the pinned SDK and no additional scopes', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const redirectTo = 'http://localhost:5173/auth/callback';
    const assign = vi.fn();
    const client = createSupabaseAuth(
      { kind: 'ready', origin: projectOrigin, publishableKey: publicKey },
      { localStorage, location: { assign } as unknown as Location, crypto },
    );

    await client.signIn(redirectTo);
    expect(assign).toHaveBeenCalledTimes(1);
    const target = new URL(String(assign.mock.calls[0]?.[0]));
    expect(target.origin).toBe(projectOrigin);
    expect(target.pathname).toBe('/auth/v1/authorize');
    expect(target.searchParams.get('provider')).toBe('discord');
    expect(target.searchParams.get('redirect_to')).toBe(redirectTo);
    expect(target.searchParams.get('code_challenge_method')).toBe('s256');
    expect(target.searchParams.get('code_challenge')).toMatch(
      /^[A-Za-z0-9_-]{43}$/,
    );
    expect(target.searchParams.has('scopes')).toBe(false);
    expect(
      localStorage.getItem(`hu-auth:${projectOrigin}-code-verifier`),
    ).toBeTruthy();
  });
});
