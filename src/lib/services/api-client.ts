import { z } from 'zod';

import type { ApiConfig } from './api-config';

const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('hu-api'),
});

const messages = {
  unavailable: 'The API connection is unavailable.',
  timeout: 'The API took too long to respond.',
  aborted: 'The API request was cancelled.',
  network: 'The API could not be reached.',
  http: 'The API returned an error.',
  response: 'The API returned an unexpected response.',
};

export class ApiError extends Error {
  constructor(
    readonly kind: keyof typeof messages,
    readonly status?: number,
    readonly requestId?: string,
  ) {
    super(messages[kind]);
    this.name = 'ApiError';
  }
}

export function createApiClient(
  config: ApiConfig,
  transport: typeof fetch = fetch,
) {
  async function health(externalSignal?: AbortSignal) {
    if (config.kind !== 'ready') throw new ApiError('unavailable');

    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), config.timeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, deadline.signal])
      : deadline.signal;

    let requestId: string | undefined;
    try {
      signal.throwIfAborted();
      const response = await transport(new URL('health', config.baseUrl), {
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        redirect: 'error',
        signal,
      });
      requestId = response.headers.get('X-Request-Id') || undefined;
      if (!response.ok) throw new ApiError('http', response.status, requestId);

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        signal.throwIfAborted();
        throw new ApiError('response', response.status, requestId);
      }
      const result = healthSchema.safeParse(body);
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

  return { health };
}

export type ApiClient = ReturnType<typeof createApiClient>;
