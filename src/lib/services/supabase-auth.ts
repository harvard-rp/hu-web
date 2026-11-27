import {
  createClient,
  isAuthSessionMissingError,
  isAuthRetryableFetchError,
  type Session,
  type SupportedStorage,
} from '@supabase/supabase-js';
import type { SupabaseConfig } from './supabase-config';

import {
  SessionError,
  type AuthService,
  type AuthSession,
} from './auth-service';

function toAuthSession(session: Session | null): AuthSession | null {
  return session?.user?.id && session.access_token
    ? { userId: session.user.id, accessToken: session.access_token }
    : null;
}

function sanitize(value: string) {
  try {
    const session: unknown = JSON.parse(value);
    if (!session || typeof session !== 'object' || Array.isArray(session))
      return null;
    const {
      provider_token: providerToken,
      provider_refresh_token: providerRefreshToken,
      ...rest
    } = session as Record<string, unknown>;
    return providerToken === undefined && providerRefreshToken === undefined
      ? value
      : JSON.stringify(rest);
  } catch {
    return null;
  }
}

// Limit redaction to the SDK session record. It owns the PKCE verifier and
// related storage keys, which must survive a full-page redirect.
export function createAuthStorage(
  storage: Storage,
  storageKey: string,
): SupportedStorage {
  return {
    getItem(key) {
      const value = storage.getItem(key);
      if (key !== storageKey || value === null) return value;
      const clean = sanitize(value);
      if (clean === null) storage.removeItem(key);
      else if (clean !== value) storage.setItem(key, clean);
      return clean;
    },
    setItem(key, value) {
      if (key !== storageKey) {
        storage.setItem(key, value);
        return;
      }
      const clean = sanitize(value);
      if (clean !== null) storage.setItem(key, clean);
      else storage.removeItem(key);
    },
    removeItem: (key) => storage.removeItem(key),
  };
}

function sessionError(error: unknown) {
  return new SessionError(
    isAuthRetryableFetchError(error) ? 'unavailable' : 'invalid',
  );
}

export function createSupabaseAuth(
  config: Extract<SupabaseConfig, { kind: 'ready' }>,
  browser: Pick<Window, 'localStorage' | 'location' | 'crypto'> = window,
  transport: typeof fetch = fetch,
): AuthService {
  const storageKey = `hu-auth:${config.origin}`;
  const storage = createAuthStorage(browser.localStorage, storageKey);
  const client = createClient(config.origin, config.publishableKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      storage,
      storageKey,
      debug: false,
    },
    global: {
      fetch: (input, init) => {
        const url = URL.parse(
          input instanceof Request ? input.url : String(input),
        );
        if (!url || url.origin !== config.origin)
          return Promise.reject(new SessionError('unavailable'));
        const deadline = AbortSignal.timeout(10_000);
        const caller =
          init?.signal ?? (input instanceof Request ? input.signal : undefined);
        return transport(input, {
          ...init,
          signal: caller ? AbortSignal.any([caller, deadline]) : deadline,
          redirect: 'error',
          referrerPolicy: 'no-referrer',
        });
      },
    },
  });

  return {
    async signIn(redirectTo) {
      if (!browser.crypto.subtle) throw new SessionError('unavailable');
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw sessionError(error);
      const target = URL.parse(data.url ?? '');
      if (
        !target ||
        target.origin !== config.origin ||
        target.pathname !== '/auth/v1/authorize'
      ) {
        throw new SessionError('invalid');
      }
      browser.location.assign(target.href);
    },
    async exchange(code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw sessionError(error);
      const session = toAuthSession(data.session);
      if (!session) throw new SessionError('invalid');
      return session;
    },
    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error && !isAuthSessionMissingError(error)) throw sessionError(error);
      return toAuthSession(data.session);
    },
    subscribe(callback) {
      client.auth.onAuthStateChange((event, session) => {
        if (
          event === 'SIGNED_IN' ||
          event === 'SIGNED_OUT' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          callback(event, toAuthSession(session));
        }
      });
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw sessionError(error);
    },
  };
}
