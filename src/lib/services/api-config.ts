import { z } from 'zod';

export type ApiConfig =
  | { kind: 'disabled' }
  | { kind: 'invalid' }
  | { kind: 'ready'; baseUrl: string; timeoutMs: number };

const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
const timeout = z.coerce.number().int().min(1).max(120_000);
const settings = z.object({
  VITE_API_BASE_URL: z.string().trim().optional(),
  VITE_API_TIMEOUT_MS: z.string().trim().optional(),
});

export function readApiConfig(env: unknown): ApiConfig {
  const result = settings.safeParse(env);
  if (!result.success) return { kind: 'invalid' };
  const { VITE_API_BASE_URL: value, VITE_API_TIMEOUT_MS: duration } =
    result.data;
  if (!value) return { kind: 'disabled' };

  const url = URL.parse(value);
  if (
    !url ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && loopback.has(url.hostname))) ||
    url.username ||
    url.password ||
    value.includes('?') ||
    value.includes('#')
  ) {
    return { kind: 'invalid' };
  }

  const parsedTimeout = timeout.safeParse(duration || '5000');
  if (!parsedTimeout.success) return { kind: 'invalid' };

  url.pathname = url.pathname.replace(/\/+$/, '') + '/';
  return { kind: 'ready', baseUrl: url.href, timeoutMs: parsedTimeout.data };
}

export const apiConfig = readApiConfig({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS,
});
