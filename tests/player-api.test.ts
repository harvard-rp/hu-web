import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@/lib/services/api-client';

const token = 'synthetic.jwt.value';
const context = {
  playerId: '10000000-0000-4000-8000-000000000001',
  capabilities: ['characters.review'],
  characters: [
    {
      id: '10000000-0000-4000-8000-000000000002',
      validationStatus: 'approved',
      useStatus: 'active',
      canAccessCampus: true,
    },
  ],
  canAccessCampus: true,
};
const config = {
  kind: 'ready',
  baseUrl: 'https://api.example/',
  timeoutMs: 5000,
} as const;

describe('Authenticated API transport', () => {
  it('sends only a bearer to the configured API for bootstrap and player context', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json(context));
    const client = createApiClient(config, transport);
    await expect(client.bootstrap(token)).resolves.toMatchObject({
      data: context,
    });
    await expect(client.me(token)).resolves.toMatchObject({ data: context });
    const [bootstrapUrl, bootstrapInit] = transport.mock.calls[0]!;
    const [meUrl, meInit] = transport.mock.calls[1]!;
    expect(String(bootstrapUrl)).toBe(
      'https://api.example/api/v1/auth/bootstrap',
    );
    expect(String(meUrl)).toBe('https://api.example/api/v1/me');
    expect(bootstrapInit?.method).toBe('POST');
    expect(meInit?.method).toBe('GET');
    for (const [, init] of transport.mock.calls) {
      expect(init).toMatchObject({
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
      });
      expect(init?.body).toBeUndefined();
    }
  });

  it('fails closed on a redirect and makes no request to its destination', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.redirect('https://elsewhere.example/collect'),
      );
    await expect(
      createApiClient(config, transport).me(token),
    ).rejects.toMatchObject({ status: 302 });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[1]?.redirect).toBe('error');
    expect(String(transport.mock.calls[0]?.[0])).toBe(
      'https://api.example/api/v1/me',
    );
    await expect(
      createApiClient(
        { ...config, baseUrl: 'http://outside.example/' },
        transport,
      ).me(token),
    ).rejects.toMatchObject({ kind: 'unavailable' });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('only interprets the documented player link error and never returns raw error bodies', async () => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: 'PLAYER_LINK_REQUIRED', message: token } },
          { status: 403 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: 'UNRELATED', message: token } },
          { status: 403 },
        ),
      );
    const api = createApiClient(config, transport);
    await expect(api.me(token)).rejects.toMatchObject({
      status: 403,
      code: 'PLAYER_LINK_REQUIRED',
      message: 'The API returned an error.',
    });
    await expect(api.me(token)).rejects.toMatchObject({
      status: 403,
      code: undefined,
      message: 'The API returned an error.',
    });
  });

  it.each([
    { ...context, discordId: 'unexpected' },
    { ...context, playerId: 'no-id' },
    { ...context, capabilities: ['admin'] },
    {
      ...context,
      characters: [{ ...context.characters[0], useStatus: 'deleted' }],
    },
  ])('rejects responses outside the player contract', async (body) => {
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(body));
    await expect(
      createApiClient(config, transport).bootstrap(token),
    ).rejects.toMatchObject({ kind: 'response' });
  });
});
