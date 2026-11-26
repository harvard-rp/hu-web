import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@/lib/services/api-client';
import { readApiConfig } from '@/lib/services/api-config';

function settings(url: string, timeout = '') {
  return readApiConfig({
    VITE_API_BASE_URL: url,
    VITE_API_TIMEOUT_MS: timeout,
  });
}

const config = {
  kind: 'ready',
  baseUrl: 'https://api.example/backend/',
  timeoutMs: 200,
} as const;

describe('API configuration', () => {
  it('disables the client for a missing or blank URL', () => {
    expect(readApiConfig({})).toEqual({ kind: 'disabled' });
    expect(settings('  ')).toEqual({ kind: 'disabled' });
  });

  it('normalizes the URL and reads the timeout', () => {
    expect(settings(' https://api.example/backend ', '1200')).toEqual({
      kind: 'ready',
      baseUrl: 'https://api.example/backend/',
      timeoutMs: 1200,
    });
    expect(settings('http://127.0.0.1:8787')).toEqual({
      kind: 'ready',
      baseUrl: 'http://127.0.0.1:8787/',
      timeoutMs: 5000,
    });
  });

  it.each([
    'missing-scheme',
    'ftp://api.example',
    'http://api.example',
    'https://user:secret@api.example',
    'https://api.example?key=value',
    'https://api.example#hash',
  ])('rejects %s', (baseUrl) => {
    expect(settings(baseUrl)).toEqual({ kind: 'invalid' });
  });

  it.each(['0', '-5', 'NaN', '1.5', '120001'])(
    'rejects timeout %s',
    (timeout) => {
      expect(settings('https://api.example', timeout)).toEqual({
        kind: 'invalid',
      });
    },
  );
});

describe('HTTP health client', () => {
  it('validates the service contract and captures its request ID', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { status: 'ok', service: 'hu-api' },
          { headers: { 'X-Request-Id': 'test-request' } },
        ),
      );
    const client = createApiClient(config, transport);
    await expect(client.health()).resolves.toEqual({
      data: { status: 'ok', service: 'hu-api' },
      requestId: 'test-request',
    });
    expect(transport).toHaveBeenCalledWith(
      new URL('https://api.example/backend/health'),
      expect.objectContaining({ credentials: 'omit', redirect: 'error' }),
    );
  });

  it('does not call fetch in standalone mode', async () => {
    const transport = vi.fn<typeof fetch>();
    await expect(
      createApiClient({ kind: 'disabled' }, transport).health(),
    ).rejects.toMatchObject({ kind: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });

  it('reports HTTP status and request ID without propagating the response body', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('Private error', {
        status: 503,
        headers: { 'X-Request-Id': 'test-request' },
      }),
    );
    await expect(
      createApiClient(config, transport).health(),
    ).rejects.toMatchObject({
      kind: 'http',
      status: 503,
      requestId: 'test-request',
      message: 'The API returned an error.',
    });
  });

  it('rejects malformed and out-of-contract success responses', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ status: 'ok', service: 'another-service' }),
      )
      .mockResolvedValueOnce(new Response('<html>'));
    const client = createApiClient(config, transport);
    await expect(client.health()).rejects.toMatchObject({ kind: 'response' });
    await expect(client.health()).rejects.toMatchObject({ kind: 'response' });
  });

  it('normalizes network errors', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('Private detail'));
    await expect(
      createApiClient(config, transport).health(),
    ).rejects.toMatchObject({
      kind: 'network',
      message: 'The API could not be reached.',
    });
  });

  it('aborts requests that exceed the configured timeout', async () => {
    const transport = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    );
    await expect(
      createApiClient({ ...config, timeoutMs: 10 }, transport).health(),
    ).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('honors caller cancellation before issuing a request', async () => {
    const transport = vi.fn<typeof fetch>();
    const controller = new AbortController();
    controller.abort();
    await expect(
      createApiClient(config, transport).health(controller.signal),
    ).rejects.toMatchObject({ kind: 'aborted' });
    expect(transport).not.toHaveBeenCalled();
  });
});
