import type { ApiClient } from '@/lib/services/api-client';
import { ApiError } from '@/lib/services/api-error';
import type { PlayerContext } from '@/lib/services/player-context';
import {
  SessionError,
  type AuthService,
  type AuthSession,
} from '@/lib/services/auth-service';
import type { OAuthCallback } from './callback';

export type AuthProblem =
  | 'cancelled'
  | 'invalid-callback'
  | 'sign-in'
  | 'auth-unavailable'
  | 'callback-unavailable'
  | 'api-unavailable'
  | 'identity-required'
  | 'link-conflict'
  | 'expired';

export type AuthState =
  | {
      kind:
        | 'disabled'
        | 'invalid-config'
        | 'loading'
        | 'signed-out'
        | 'redirecting'
        | 'initializing';
    }
  | { kind: 'problem'; problem: AuthProblem; hasSession: boolean }
  | { kind: 'ready'; player: PlayerContext; scope: AccountScope };

export type AccountScope = Readonly<{ id: number; signal: AbortSignal }>;

type Readiness = 'enabled' | 'disabled' | 'invalid-config';
type Resolution = 'read' | 'bootstrap';
type Dependencies = {
  service: () => AuthService | Promise<AuthService>;
  api: Pick<ApiClient, 'me' | 'bootstrap'> &
    Partial<Pick<ApiClient, 'characters'>>;
  callback: OAuthCallback;
  redirectTo: string;
};

function refreshFailure(error: unknown): boolean {
  return error instanceof SessionError && error.kind === 'invalid';
}

export function createAuthController(
  readiness: Readiness,
  dependencies?: Dependencies,
) {
  let state: AuthState = {
    kind: readiness === 'enabled' ? 'loading' : readiness,
  };
  const listeners = new Set<() => void>();
  let startup: Promise<void> | undefined;
  let auth: Promise<AuthService> | undefined;
  let subscribed = false;
  let signingOut = false;
  let session: AuthSession | null = null;
  let resolution: Resolution = 'read';
  let pending: AbortController | undefined;
  let eventRevision = 0;
  let account = new AbortController();
  let scope: AccountScope = { id: 0, signal: account.signal };
  let contextRefresh = 0;
  let retryRestore = false;
  let callback = dependencies?.callback;

  function update(next: AuthState) {
    state = next;
    for (const notify of listeners) notify();
  }

  function problem(value: AuthProblem) {
    update({ kind: 'problem', problem: value, hasSession: session !== null });
  }

  function discardAccount() {
    account.abort();
    account = new AbortController();
    scope = { id: eventRevision, signal: account.signal };
    pending?.abort();
    pending = undefined;
    session = null;
    resolution = 'read';
    retryRestore = false;
  }

  function service() {
    if (!dependencies) return Promise.reject(new SessionError('unavailable'));
    auth ??= Promise.resolve()
      .then(dependencies.service)
      .catch((error: unknown) => {
        auth = undefined;
        throw error;
      });
    return auth;
  }

  async function signOut(expired = false) {
    if (signingOut) return;
    signingOut = true;
    eventRevision++;
    discardAccount();
    if (expired) problem('expired');
    else update({ kind: 'signed-out' });
    try {
      if (auth) await (await auth).signOut();
    } catch {
      // The pinned SDK removes the local session before revoking it remotely.
    } finally {
      signingOut = false;
    }
  }

  async function resolve(next: AuthSession, method: Resolution) {
    if (!dependencies) return;
    pending?.abort();
    const request = new AbortController();
    pending = request;
    session = next;
    resolution = method;
    update({ kind: method === 'bootstrap' ? 'initializing' : 'loading' });

    try {
      let result;
      try {
        result = await (
          method === 'bootstrap'
            ? dependencies.api.bootstrap
            : dependencies.api.me
        )(next.accessToken, request.signal);
      } catch (error) {
        if (request.signal.aborted) return;
        if (
          method !== 'read' ||
          !(error instanceof ApiError) ||
          error.code !== 'PLAYER_LINK_REQUIRED'
        )
          throw error;
        resolution = 'bootstrap';
        update({ kind: 'initializing' });
        result = await dependencies.api.bootstrap(
          next.accessToken,
          request.signal,
        );
      }
      if (!request.signal.aborted) {
        resolution = 'read';
        update({ kind: 'ready', player: result.data, scope });
      }
    } catch (error) {
      if (request.signal.aborted) return;
      const status = error instanceof ApiError ? error.status : undefined;
      if (
        status === 401 &&
        session &&
        session.accessToken !== next.accessToken
      ) {
        void resolve(session, resolution);
      } else if (status === 401) void signOut(true);
      else if (status === 403) problem('identity-required');
      else if (status === 409) problem('link-conflict');
      else problem('api-unavailable');
    } finally {
      if (pending === request) pending = undefined;
    }
  }

  function subscribeToSession(client: AuthService) {
    if (subscribed) return;
    subscribed = true;
    client.subscribe((event, next) => {
      if (signingOut) return;
      if (event !== 'SIGNED_OUT' && next && next.userId === session?.userId) {
        // SDK may emit SIGNED_IN again on tab focus. Accept token rotation without
        // replacing a resolved player's data or duplicating an in-flight bootstrap.
        session = next;
        if (
          event === 'TOKEN_REFRESHED' &&
          !pending &&
          state.kind === 'problem' &&
          state.problem === 'api-unavailable'
        )
          void resolve(next, resolution);
        return;
      }
      eventRevision++;
      const hadSession = session !== null;
      discardAccount();
      if (!next || event === 'SIGNED_OUT') {
        if (hadSession || state.kind === 'loading') problem('expired');
        return;
      }
      // The SDK also emits SIGNED_IN when it restores a session on reload.
      // Bootstrap belongs to a completed callback or a missing player link.
      void resolve(next, 'read');
    });
  }

  async function restore() {
    retryRestore = false;
    update({ kind: 'loading' });
    const revision = eventRevision;
    try {
      const client = await service();
      subscribeToSession(client);
      const stored = await client.getSession();
      if (revision !== eventRevision) return;
      if (stored) await resolve(stored, 'read');
      else update({ kind: 'signed-out' });
    } catch (error) {
      if (revision !== eventRevision) return;
      retryRestore = !refreshFailure(error);
      problem(retryRestore ? 'auth-unavailable' : 'expired');
    }
  }

  async function initialize() {
    if (readiness !== 'enabled') return;
    const incoming = callback;
    callback = undefined;
    if (incoming?.kind === 'cancelled' || incoming?.kind === 'invalid') {
      problem(incoming.kind === 'cancelled' ? 'cancelled' : 'invalid-callback');
      return;
    }
    const revision = eventRevision;
    try {
      if (incoming?.kind === 'code') {
        const client = await service();
        const exchanged = await client.exchange(incoming.code);
        if (revision !== eventRevision) return;
        subscribeToSession(client);
        await resolve(exchanged, 'bootstrap');
      } else {
        await restore();
      }
    } catch (error) {
      problem(
        refreshFailure(error) ? 'invalid-callback' : 'callback-unavailable',
      );
    }
  }

  async function authenticated<T>(
    owner: AccountScope,
    operation: (token: string, signal: AbortSignal) => Promise<T>,
    caller?: AbortSignal,
  ) {
    const current = session;
    if (
      !current ||
      owner !== scope ||
      owner.signal.aborted ||
      state.kind !== 'ready'
    ) {
      throw new ApiError('aborted');
    }
    const signal = caller
      ? AbortSignal.any([owner.signal, caller])
      : owner.signal;
    if (signal.aborted) throw new ApiError('aborted');
    try {
      const data = await operation(current.accessToken, signal);
      if (signal.aborted) throw new ApiError('aborted');
      return data;
    } catch (error) {
      if (signal.aborted) throw new ApiError('aborted');
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        session?.accessToken === current.accessToken
      ) {
        void signOut(true);
      }
      throw error;
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      startup ??= initialize();
      return startup;
    },
    async signIn() {
      if (
        !dependencies ||
        signingOut ||
        readiness !== 'enabled' ||
        session ||
        (state.kind !== 'signed-out' && state.kind !== 'problem')
      )
        return;
      update({ kind: 'redirecting' });
      try {
        await (await service()).signIn(dependencies.redirectTo);
      } catch {
        problem('sign-in');
      }
    },
    retry() {
      if (pending || signingOut) return;
      if (session) void resolve(session, resolution);
      else if (retryRestore) void restore();
    },
    characterRequest<T>(
      owner: AccountScope,
      operation: (
        client: ApiClient['characters'],
        token: string,
        signal: AbortSignal,
      ) => Promise<T>,
      caller?: AbortSignal,
    ) {
      return authenticated(
        owner,
        (token, signal) => {
          if (!dependencies?.api.characters) throw new ApiError('unavailable');
          return operation(dependencies.api.characters, token, signal);
        },
        caller,
      );
    },
    async refreshPlayer(owner: AccountScope) {
      if (!dependencies) return;
      const refresh = ++contextRefresh;
      try {
        const result = await authenticated(owner, dependencies.api.me);
        if (
          owner === scope &&
          refresh === contextRefresh &&
          state.kind === 'ready'
        ) {
          update({ kind: 'ready', player: result.data, scope });
        }
      } catch {
        // Confirmed character writes remain successful if context refresh fails.
      }
    },
    signOut: () => signOut(),
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
export const noAuth = createAuthController('disabled');
