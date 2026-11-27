import { describe, expect, it } from 'vitest';
import { oauthRedirectUrl, readOAuthCallback } from '@/features/auth/callback';
import { readSupabaseConfig } from '@/lib/services/supabase-config';

const publicKey = 'sb_publishable_fake_test_key';

describe('Supabase frontend configuration', () => {
  it('disables authentication for absent auth variables and for Pages builds', () => {
    expect(readSupabaseConfig({})).toEqual({ kind: 'disabled' });
    expect(
      readSupabaseConfig(
        {
          VITE_SUPABASE_URL: 'https://supabase.example',
          VITE_SUPABASE_PUBLISHABLE_KEY: publicKey,
        },
        true,
      ),
    ).toEqual({ kind: 'disabled' });
  });

  it.each([
    ['https://supabase.example/', 'https://supabase.example'],
    ['http://127.0.0.1:54321', 'http://127.0.0.1:54321'],
    ['http://localhost:54321', 'http://localhost:54321'],
    ['http://[::1]:54321', 'http://[::1]:54321'],
  ])('accepts only the configured project origin (%s)', (url, origin) => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: publicKey,
      }),
    ).toEqual({ kind: 'ready', origin, publishableKey: publicKey });
  });

  it.each([
    ['http://supabase.example', publicKey],
    ['http://127.1:54321', publicKey],
    ['https://supabase.example/path', publicKey],
    ['https://someone@supa.example', publicKey],
    ['https://supabase.example/?token=extra', publicKey],
    ['https://supabase.example', 'sb_secret_test_key'],
    ['https://supabase.example', 'legacy.JWT.example'],
    ['https://supabase.example', undefined],
    [undefined, publicKey],
  ])('rejects incomplete or unsafe configuration', (url, key) => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: key,
      }),
    ).toEqual({ kind: 'invalid' });
  });
});

describe('OAuth callback parsing', () => {
  it('uses fixed callback documents for both routers', () => {
    const origin = 'https://campus.example';
    expect(oauthRedirectUrl(origin, '/', false)).toBe(
      origin + '/auth/callback',
    );
    expect(oauthRedirectUrl(origin, '/hu-web/', true)).toBe(
      origin + '/hu-web/',
    );
    expect(
      readOAuthCallback(
        origin + '/auth/callback?code=one-time&next=https://outside.example',
        '/',
        false,
      ),
    ).toEqual({
      callback: { kind: 'code', code: 'one-time' },
      cleanPath: '/auth/callback',
    });
    expect(
      readOAuthCallback(origin + '/hu-web/?code=one-time', '/hu-web/', true),
    ).toEqual({
      callback: { kind: 'code', code: 'one-time' },
      cleanPath: '/hu-web/#/auth/callback',
    });
  });

  it.each([
    '/auth/callback?code=first&code=second',
    '/auth/callback?code=abc%2Fxyz',
    '/auth/callback?code=first&access_token=unsolicited',
    '/auth/callback#code=unsolicited',
    '/auth/callback?code=' + 'a'.repeat(513),
    '/auth/callback#access_token=unused',
  ])('rejects and scrubs malformed or implicit callback input', (path) => {
    expect(
      readOAuthCallback('https://campus.example' + path, '/', false),
    ).toEqual({
      callback: { kind: 'invalid' },
      cleanPath: '/auth/callback',
    });
  });

  it('handles OAuth denial from the document query or a legacy error fragment', () => {
    expect(
      readOAuthCallback(
        'https://campus.example/auth/callback?error=access_denied&error_description=private',
        '/',
        false,
      ),
    ).toEqual({ callback: { kind: 'cancelled' }, cleanPath: '/auth/callback' });
    expect(
      readOAuthCallback(
        'https://campus.example/hu-web/#error=access_denied&error_description=private',
        '/hu-web/',
        true,
      ),
    ).toEqual({
      callback: { kind: 'cancelled' },
      cleanPath: '/hu-web/#/auth/callback',
    });
  });

  it('leaves ordinary SPA deep links alone and ignores a code in a HashRouter query', () => {
    expect(
      readOAuthCallback(
        'https://campus.example/hu-web/#/preview/character/new?major=other',
        '/hu-web/',
        true,
      ),
    ).toEqual({ callback: { kind: 'none' } });
    expect(
      readOAuthCallback(
        'https://campus.example/hu-web/#/auth/callback?code=wrong-place',
        '/hu-web/',
        true,
      ),
    ).toEqual({
      callback: { kind: 'invalid' },
      cleanPath: '/hu-web/#/auth/callback',
    });
  });
});
