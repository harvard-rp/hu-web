import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AccountScope,
  AuthController,
} from '@/features/auth/auth-session';
import type { ApiClient } from '@/lib/services/api-client';

export type PlayerSession = { controller: AuthController; scope: AccountScope };
type CharacterClient = ApiClient['characters'];
type Operation<T> = (
  client: CharacterClient,
  token: string,
  signal: AbortSignal,
) => Promise<T>;

type Result<T> =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; data: T };

export function usePlayerQuery<T>(
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const [resolved, setResolved] = useState<{
    attempt: number;
    load: typeof load;
    result: Result<T>;
  }>();
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const request = new AbortController();
    void load(request.signal).then(
      (data) => {
        if (!request.signal.aborted)
          setResolved({ attempt, load, result: { kind: 'ready', data } });
      },
      (error: unknown) => {
        if (!request.signal.aborted)
          setResolved({ attempt, load, result: { kind: 'error', error } });
      },
    );
    return () => request.abort();
  }, [load, attempt, enabled]);

  const state: Result<T> =
    resolved?.attempt === attempt && resolved.load === load && enabled
      ? resolved.result
      : { kind: 'loading' };
  return { state, retry };
}

export function usePlayerMutation({ controller, scope }: PlayerSession) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ error: unknown }>();
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), [scope]);

  async function run<T>(operation: Operation<T>, accept: (data: T) => void) {
    if (active.current) return;
    const request = new AbortController();
    active.current = request;
    setPending(true);
    setFailure(undefined);
    try {
      const data = await controller.characterRequest(
        scope,
        operation,
        request.signal,
      );
      if (!request.signal.aborted && !scope.signal.aborted) {
        accept(data);
        void controller.refreshPlayer(scope);
      }
    } catch (error) {
      if (!request.signal.aborted && !scope.signal.aborted)
        setFailure({ error });
    } finally {
      active.current = null;
      if (!request.signal.aborted && !scope.signal.aborted) setPending(false);
    }
  }

  return { run, pending, failure, clearError: () => setFailure(undefined) };
}
