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
  | {
      kind: 'ready';
      player: PlayerContext;
      scope: AccountScope;
      reviewSignal?: AbortSignal;
      reviewRefusal?: ApiError;
      reopenSignal?: AbortSignal;
      reopenRefusal?: ApiError;
    };

export type AccountScope = Readonly<{ id: number; signal: AbortSignal }>;

type Readiness = 'enabled' | 'disabled' | 'invalid-config';
type Resolution = 'read' | 'bootstrap';
type Dependencies = {
  service: () => AuthService | Promise<AuthService>;
  api: Pick<ApiClient, 'me' | 'bootstrap'> &
    Partial<Pick<ApiClient, 'characters' | 'staff' | 'reopen'>>;
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
  const grants = {
    review: {
      capability: 'characters.review',
      access: undefined as AbortController | undefined,
      refusal: undefined as ApiError | undefined,
    },
    reopen: {
      capability: 'characters.reopen',
      access: undefined as AbortController | undefined,
      refusal: undefined as ApiError | undefined,
    },
  } satisfies Record<
    'review' | 'reopen',
    {
      capability: PlayerContext['capabilities'][number];
      access?: AbortController;
      refusal?: ApiError;
    }
  >;
  let contextRefresh = 0;
  let retryRestore = false;
  let callback = dependencies?.callback;

  function update(next: AuthState) {
    state = next;
    for (const notify of listeners) notify();
  }

  function publishPlayer(player: PlayerContext, fromMe: boolean) {
    for (const grant of Object.values(grants)) {
      if (
        fromMe &&
        player.capabilities.includes(grant.capability) &&
        !grant.refusal
      ) {
        grant.access ??= new AbortController();
      } else {
        grant.access?.abort();
        grant.access = undefined;
      }
    }
    update({
      kind: 'ready',
      player,
      scope,
      reviewSignal: grants.review.access?.signal,
      reviewRefusal: grants.review.refusal,
      reopenSignal: grants.reopen.access?.signal,
      reopenRefusal: grants.reopen.refusal,
    });
  }

  function problem(value: AuthProblem) {
    update({ kind: 'problem', problem: value, hasSession: session !== null });
  }

  function discardAccount() {
    for (const grant of Object.values(grants)) {
      grant.access?.abort();
      grant.access = undefined;
      grant.refusal = undefined;
    }
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
      let fromMe = method === 'read';
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
        fromMe = false;
        update({ kind: 'initializing' });
        result = await dependencies.api.bootstrap(
          next.accessToken,
          request.signal,
        );
      }
      if (!request.signal.aborted) {
        resolution = 'read';
        publishPlayer(result.data, fromMe);
        if (
          !fromMe &&
          Object.values(grants).some(({ capability }) =>
            result.data.capabilities.includes(capability),
          )
        )
          void refreshPlayer(scope);
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
        if (event === 'TOKEN_REFRESHED') {
          if (state.kind === 'ready') {
            // Revalidate live capabilities without replacing the account scope.
            // A reviewer can lose access while the sheet remains open.
            void refreshPlayer(scope);
          } else if (
            !pending &&
            state.kind === 'problem' &&
            state.problem === 'api-unavailable'
          ) {
            void resolve(next, resolution);
          }
        }
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

  async function refreshPlayer(owner: AccountScope) {
    if (!dependencies) return;
    const refresh = ++contextRefresh;
    try {
      const result = await authenticated(owner, dependencies.api.me);
      if (
        owner === scope &&
        refresh === contextRefresh &&
        state.kind === 'ready'
      )
        publishPlayer(result.data, true);
    } catch {
      // A secondary read cannot undo a confirmed write or restore revoked access.
    }
  }

  async function withCapability<T>(
    kind: keyof typeof grants,
    owner: AccountScope,
    grant: AbortSignal,
    operation: (token: string, signal: AbortSignal) => Promise<T>,
    caller: AbortSignal,
  ) {
    const record = grants[kind];
    if (grant !== record.access?.signal || grant.aborted)
      throw new ApiError('aborted');
    try {
      return await authenticated(
        owner,
        operation,
        AbortSignal.any([caller, grant]),
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        owner === scope &&
        grant === record.access?.signal &&
        state.kind === 'ready'
      ) {
        record.refusal = error;
        publishPlayer(state.player, true);
        void refreshPlayer(owner);
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
    async staffRequest<T>(
      owner: AccountScope,
      grant: AbortSignal,
      operation: (
        api: Pick<ApiClient, 'staff' | 'characters'>,
        token: string,
        signal: AbortSignal,
      ) => Promise<T>,
      caller: AbortSignal,
    ) {
      const { staff, characters } = dependencies?.api ?? {};
      if (!staff || !characters) throw new ApiError('unavailable');
      return withCapability(
        'review',
        owner,
        grant,
        (token, signal) => operation({ staff, characters }, token, signal),
        caller,
      );
    },
    async reopeningRequest<T>(
      owner: AccountScope,
      grant: AbortSignal,
      operation: (
        api: Pick<ApiClient, 'reopen' | 'characters'>,
        token: string,
        signal: AbortSignal,
      ) => Promise<T>,
      caller: AbortSignal,
    ) {
      const { reopen, characters } = dependencies?.api ?? {};
      if (!reopen || !characters) throw new ApiError('unavailable');
      return withCapability(
        'reopen',
        owner,
        grant,
        (token, signal) => operation({ reopen, characters }, token, signal),
        caller,
      );
    },
    refreshPlayer,
    signOut: () => signOut(),
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
export const noAuth = createAuthController('disabled');
