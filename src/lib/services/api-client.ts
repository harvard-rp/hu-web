import { z } from 'zod';

import { ApiError } from './api-error';
import type { ApiConfig } from './api-config';
import { playerContextSchema } from './player-context';
import { readPublicUrl } from './public-url';

export { ApiError } from './api-error';

const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('hu-api'),
});

const playerLinkError = z.object({
  error: z.object({ code: z.literal('PLAYER_LINK_REQUIRED') }),
});

export function createApiClient(
  config: ApiConfig,
  transport: typeof fetch = fetch,
) {
  async function request<Output>(
    path: 'health' | 'api/v1/me' | 'api/v1/auth/bootstrap',
    schema: z.ZodType<Output>,
    externalSignal?: AbortSignal,
    token?: string,
  ) {
    if (config.kind !== 'ready') throw new ApiError('unavailable');
    const base = readPublicUrl(config.baseUrl);
    if (!base || (path !== 'health' && !token))
      throw new ApiError('unavailable');
    const url = new URL(path, base);
    if (url.origin !== base.origin) throw new ApiError('unavailable');

    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), config.timeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, deadline.signal])
      : deadline.signal;

    let requestId: string | undefined;
    try {
      signal.throwIfAborted();
      const response = await transport(url, {
        method: path === 'api/v1/auth/bootstrap' ? 'POST' : 'GET',
        headers: {
          Accept: 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'omit',
        ...(token && { cache: 'no-store', referrerPolicy: 'no-referrer' }),
        redirect: 'error',
        signal,
      });
      requestId = response.headers.get('X-Request-Id') || undefined;
      if (!response.ok) {
        let code: ApiError['code'];
        if (path === 'api/v1/me' && response.status === 403) {
          const failure = (await response
            .json()
            .catch(() => undefined)) as unknown;
          if (playerLinkError.safeParse(failure).success)
            code = 'PLAYER_LINK_REQUIRED';
        }
        throw new ApiError('http', response.status, requestId, code);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        signal.throwIfAborted();
        throw new ApiError('response', response.status, requestId);
      }
      const result = schema.safeParse(body);
      if (!result.success)
        throw new ApiError('response', response.status, requestId);
      return { data: result.data, requestId };
    } catch (error) {
      if (deadline.signal.aborted)
        throw new ApiError('timeout', undefined, requestId);
      if (externalSignal?.aborted)
        throw new ApiError('aborted', undefined, requestId);
      if (error instanceof ApiError) throw error;
      throw new ApiError('network', undefined, requestId);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    health: (signal?: AbortSignal) => request('health', healthSchema, signal),
    me: (token: string, signal?: AbortSignal) =>
      request('api/v1/me', playerContextSchema, signal, token),
    bootstrap: (token: string, signal?: AbortSignal) =>
      request('api/v1/auth/bootstrap', playerContextSchema, signal, token),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
