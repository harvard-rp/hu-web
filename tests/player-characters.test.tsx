import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/app/app';
import { createAuthController } from '@/features/auth/auth-session';
import type {
  AuthService,
  SessionEvent,
  AuthSession,
} from '@/lib/services/auth-service';
import { createApiClient } from '@/lib/services/api-client';
import type { CharacterDetail } from '@/lib/services/character-contract';
import {
  changedFields,
  sheetValues,
  validatePatch,
} from '@/features/player-characters/sheet-fields';

const uuid = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const id = uuid(2);
const initialRevision = uuid(3);
const nextRevision = uuid(4);
const programId = uuid(5);
const houseId = uuid(6);
const requestId = uuid(7);
const timestamp = '2026-11-27T10:00:00+00:00';
const apiHost = 'https://api.example';
const account = '/account';
const listPath = '/api/v1/characters';
const detail = `/account/characters/${id}`;
const apiDetail = `${listPath}/${id}`;
const session = { userId: 'user-a', accessToken: 'synthetic-session-a' };
const currentPlayer = {
  playerId: uuid(1),
  capabilities: [],
  characters: [],
  canAccessCampus: false,
};

const draft: CharacterDetail = {
  id,
  kind: 'student',
  validationStatus: 'draft',
  useStatus: 'active',
  revision: initialRevision,
  createdAt: timestamp,
  updatedAt: timestamp,
  firstName: 'Élise',
  lastName: 'Armand',
  nickname: 'Lise',
  houseId: null,
  programId,
  isScholarshipHolder: true,
  age: null,
  sexualOrientation: null,
  birthDate: null,
  birthPlace: null,
  origins: null,
  residence: null,
  financialSituation: null,
  occupation: null,
  personality: 'Observatrice.',
  physicalDescription: 'Porte des lunettes.',
  faceClaim: 'Référence fictive.',
  backstory: 'Étudie les archives.',
  anecdotes: null,
  contentWarnings: ['Solitude'],
  rpLinks: ['https://exemple.invalid/texte'],
};
function summary(sheet: CharacterDetail) {
  const {
    id,
    kind,
    validationStatus,
    useStatus,
    revision,
    createdAt,
    updatedAt,
    firstName,
    lastName,
    nickname,
  } = sheet;
  return {
    id,
    kind,
    validationStatus,
    useStatus,
    revision,
    createdAt,
    updatedAt,
    firstName,
    lastName,
    nickname,
  };
}
const programs = [{ id: programId, slug: 'history', name: 'Histoire' }];
const houses = [{ id: houseId, slug: 'quincy', name: 'Quincy' }];
const fail = (status: number, code: string) =>
  Response.json(
    { error: { code, message: 'private technical detail', requestId } },
    { status },
  );

type Call = { path: string; method: string; body: unknown; init: RequestInit };
function fixture({
  route = account,
  sheet = draft,
  empty = false,
  capacity = { total: 7, used: 1, available: 6 },
  signedIn = true,
  enabled = true,
}: {
  route?: string;
  sheet?: CharacterDetail;
  empty?: boolean;
  capacity?: { total: number; used: number; available: number };
  signedIn?: boolean;
  enabled?: boolean;
} = {}) {
  const calls: Call[] = [];
  let current = sheet;
  let ownerEvent: (event: SessionEvent, value: AuthSession | null) => void;
  const service: AuthService = {
    signIn: vi.fn(),
    exchange: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue(signedIn ? session : null),
    subscribe: (listener) => {
      ownerEvent = listener;
    },
  };

  const handle = vi.fn(
    (call: Call): Response | Promise<Response> | undefined => {
      if (call.method === 'PATCH') {
        const body = call.body as Partial<CharacterDetail> & {
          expectedRevision?: string;
        };
        const { expectedRevision, ...fields } = body;
        expect(expectedRevision).toBe(current.revision);
        current = { ...current, ...fields, revision: nextRevision };
        return Response.json(current);
      }
      if (call.path === apiDetail + '/submit') {
        current = {
          ...current,
          validationStatus: 'submitted',
          revision: uuid(8),
        };
        return Response.json(current);
      }
    },
  );
  const transport = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    expect(url.origin).toBe(apiHost);
    const request: Call = {
      path: url.pathname,
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      init: init ?? {},
    };
    calls.push(request);
    const response = await handle(request);
    if (response) return response;
    if (request.path === '/api/v1/me') return Response.json(currentPlayer);
    if (request.method === 'POST' && request.path === listPath) {
      current = {
        ...draft,
        kind: (request.body as { kind: CharacterDetail['kind'] }).kind,
      };
      return Response.json(current, { status: 201 });
    }
    if (request.path === listPath)
      return Response.json(empty ? [] : [summary(current)]);
    if (request.path === listPath + '/capacity') return Response.json(capacity);
    if (request.path === apiDetail) return Response.json(current);
    if (request.path === apiDetail + '/reviews') return Response.json([]);
    if (request.path === '/api/v1/catalogs/houses')
      return Response.json(houses);
    if (request.path === '/api/v1/catalogs/programs')
      return Response.json(programs);
    if (request.path === '/api/v1/catalogs/clubs')
      return Response.json([
        { id: uuid(9), slug: 'music', name: 'Musique', memberCapacity: 10 },
      ]);
    return fail(404, 'CHARACTER_NOT_FOUND');
  });
  const api = createApiClient(
    { kind: 'ready', baseUrl: apiHost + '/', timeoutMs: 5000 },
    transport,
  );
  const auth = createAuthController('enabled', {
    service: () => service,
    api,
    callback: { kind: 'none' },
    redirectTo: 'https://web.example/auth/callback',
  });
  const router = createMemoryRouter(
    [{ path: '*', element: <App auth={auth} charactersEnabled={enabled} /> }],
    { initialEntries: [route] },
  );
  const user = userEvent.setup();
  render(<RouterProvider router={router} />);
  return {
    calls,
    handle,
    router,
    user,
    service,
    emit: (event: SessionEvent, next: AuthSession | null) =>
      ownerEvent(event, next),
  };
}

describe('Player character routes', () => {
  it.each(['/account/characters/new', detail, detail + '/edit'])(
    'protects direct navigation to %s',
    async (route) => {
      const { calls } = fixture({ route, signedIn: false });
      expect(
        await screen.findByRole('heading', { name: 'Connexion' }),
      ).toBeVisible();
      expect(calls).toEqual([]);
    },
  );

  it('uses the old space when disabled and leaves preview independent when enabled', async () => {
    const { calls, router } = fixture({ enabled: false });
    expect(
      await screen.findByRole('heading', { name: 'Espace personnel' }),
    ).toBeVisible();
    expect(calls.map(({ path }) => path)).toEqual(['/api/v1/me']);
    await act(() => router.navigate('/account/characters/new'));
    expect(
      await screen.findByRole('heading', { name: 'Page introuvable' }),
    ).toBeVisible();
    await act(() => router.navigate('/preview'));
    expect(
      await screen.findByRole('heading', { name: 'Accueil' }),
    ).toBeVisible();
    expect(calls.map(({ path }) => path)).toEqual(['/api/v1/me']);
  });

  it('loads an empty account and a read-only club catalogue', async () => {
    const { user, calls } = fixture({
      empty: true,
      capacity: { total: 7, used: 0, available: 7 },
    });
    expect(
      await screen.findByText('Vous n’avez encore aucun personnage.'),
    ).toBeVisible();
    expect(
      screen.getByText('5 de base + 2 via les boosts confirmés'),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Créer un personnage' }),
    ).toBeVisible();
    await user.click(screen.getByText('Consulter le catalogue des clubs'));
    expect(await screen.findByText('Musique')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /adhérer/i }),
    ).not.toBeInTheDocument();
    expect(calls.some(({ path }) => path === '/api/v1/catalogs/clubs')).toBe(
      true,
    );
  });

  it.each([
    [
      { total: 5, used: 5, available: 0 },
      'Tous vos emplacements sont occupés.',
    ],
    [{ total: 5, used: 7, available: 0 }, /Votre compte dépasse sa capacité/],
  ] as const)(
    'uses server capacity and keeps sheets accessible when full',
    async (capacity, message) => {
      fixture({
        capacity,
        sheet: {
          ...draft,
          useStatus: 'suspended',
          validationStatus: 'approved',
        },
      });
      expect(await screen.findByText(message)).toBeVisible();
      expect(screen.getByRole('link', { name: 'Élise Armand' })).toBeVisible();
      expect(screen.getByText('Validé')).toBeVisible();
      expect(screen.getByText('Suspendu')).toBeVisible();
      expect(
        screen.queryByRole('link', { name: 'Créer un personnage' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /Modifier/ }),
      ).not.toBeInTheDocument();
    },
  );

  it('submits one draft creation and keeps the request body limited to kind', async () => {
    const { user, calls, handle } = fixture({
      route: '/account/characters/new',
    });
    let finish!: (response: Response) => void;
    handle.mockImplementation((call) =>
      call.method === 'POST'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : undefined,
    );
    await user.click(await screen.findByRole('radio', { name: 'Professeur' }));
    await user.dblClick(
      screen.getByRole('button', { name: 'Confirmer la création' }),
    );
    const writes = calls.filter(({ method }) => method === 'POST');
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      body: { kind: 'teacher' },
      init: {
        redirect: 'error',
        cache: 'no-store',
        headers: {
          Authorization: 'Bearer synthetic-session-a',
          'Content-Type': 'application/json',
        },
      },
    });
    await act(async () =>
      finish(Response.json({ ...draft, kind: 'teacher' }, { status: 201 })),
    );
    expect(
      await screen.findByRole('heading', { name: 'Modifier la fiche' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(calls.filter(({ path }) => path === '/api/v1/me')).toHaveLength(2),
    );
  });

  it('blocks a repeat creation if the original write outcome is uncertain', async () => {
    const { user, calls, handle } = fixture({
      route: '/account/characters/new',
    });
    handle.mockImplementation((call) => {
      if (call.method === 'POST')
        return Promise.reject(new TypeError('transport failed'));
    });
    await user.click(
      await screen.findByRole('button', { name: 'Confirmer la création' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La création a peut-être abouti.',
    );
    expect(
      screen.queryByRole('button', { name: 'Confirmer la création' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Vérifier mes personnages' }),
    ).toBeVisible();
    expect(calls.filter(({ method }) => method === 'POST')).toHaveLength(1);
  });

  it('patches only changed fields and submits using the returned revision', async () => {
    const { user, calls } = fixture({ route: detail + '/edit' });
    const nickname = await screen.findByLabelText('Surnom');
    await user.clear(nickname);
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer le brouillon' }),
    );
    expect(await screen.findByText('Fiche enregistrée.')).toBeVisible();
    expect(calls.find(({ method }) => method === 'PATCH')?.body).toEqual({
      expectedRevision: initialRevision,
      nickname: null,
    });
    await user.click(
      screen.getByRole('button', { name: 'Soumettre la fiche au staff' }),
    );
    expect(await screen.findByText('En attente de validation')).toBeVisible();
    expect(
      calls.find(({ path }) => path === apiDetail + '/submit')?.body,
    ).toEqual({ expectedRevision: nextRevision });
  });

  it('keeps local edits when a revision conflicts and displays the remote version separately', async () => {
    const { user, calls, handle } = fixture({ route: detail + '/edit' });
    handle.mockImplementation((call) =>
      call.method === 'PATCH'
        ? fail(409, 'CHARACTER_REVISION_CONFLICT')
        : call.path === apiDetail &&
            calls.some(({ method }) => method === 'PATCH')
          ? Response.json({
              ...draft,
              firstName: 'Prénom distant',
              revision: nextRevision,
            })
          : undefined,
    );
    const firstName = await screen.findByLabelText('Prénom');
    await user.clear(firstName);
    await user.type(firstName, 'Prénom local');
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer le brouillon' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vos modifications locales sont conservées.',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(requestId);
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'private technical detail',
    );
    await user.click(
      screen.getByRole('button', { name: 'Consulter la version distante' }),
    );
    expect(await screen.findByText('Prénom distant')).toBeVisible();
    expect(firstName).toHaveValue('Prénom local');
    expect(calls.filter(({ method }) => method === 'PATCH')).toHaveLength(1);
    await user.click(
      screen.getByRole('button', {
        name: 'Abandonner mes modifications et charger cette version',
      }),
    );
    expect(firstName).toHaveValue('Prénom distant');
  });

  it('warns before leaving an edited sheet', async () => {
    const { user, router } = fixture({ route: detail + '/edit' });
    const nickname = await screen.findByLabelText('Surnom');
    await user.type(nickname, ' bis');
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await user.click(screen.getByRole('link', { name: 'Retour à la fiche' }));
    const prompt = within(
      await screen.findByRole('dialog', { name: 'Quitter cette page ?' }),
    );
    await user.click(
      prompt.getByRole('button', { name: 'Rester sur la page' }),
    );
    expect(nickname).toHaveValue('Lise bis');
    await user.click(screen.getByRole('link', { name: 'Retour à la fiche' }));
    await user.click(
      await screen.findByRole('button', { name: 'Quitter la page' }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe(detail));
  });

  it('names missing requirements and respects the server incomplete response', async () => {
    const { user, calls, handle } = fixture({
      route: detail,
      sheet: { ...draft, programId: null },
    });
    await user.click(
      await screen.findByRole('button', {
        name: 'Soumettre la fiche au staff',
      }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Filière');
    expect(calls.some(({ path }) => path === apiDetail + '/submit')).toBe(
      false,
    );
    await user.click(screen.getByRole('link', { name: 'Modifier la fiche' }));
    await user.selectOptions(
      await screen.findByLabelText('Filière'),
      programId,
    );
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer le brouillon' }),
    );
    await screen.findByText('Fiche enregistrée.');
    handle.mockImplementation((call) =>
      call.path.endsWith('/submit')
        ? fail(422, 'CHARACTER_INCOMPLETE')
        : undefined,
    );
    await user.click(
      screen.getByRole('button', { name: 'Soumettre la fiche au staff' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Complétez les champs requis',
    );
  });

  it('shows the historic review and allows resubmission after corrections', async () => {
    const { user, handle } = fixture({
      route: detail,
      sheet: {
        ...draft,
        validationStatus: 'changes_requested',
        useStatus: 'suspended',
      },
    });
    const comment =
      '<img src="https://outside.example/picture"> Préciser les origines.';
    handle.mockImplementation((call) => {
      if (call.path.endsWith('/reviews'))
        return Response.json([
          {
            decision: 'changes_requested',
            reviewedAt: timestamp,
            comment,
            assignedHouseId: houseId,
          },
        ]);
      if (call.path.endsWith('/submit')) {
        return Response.json({
          ...draft,
          validationStatus: 'submitted',
          useStatus: 'suspended',
          revision: nextRevision,
        });
      }
    });
    const history = within(
      await screen.findByRole('region', { name: 'Décisions du staff' }),
    );
    expect(history.getByText(comment)).toBeVisible();
    expect(history.getByText('House attribuée · Quincy')).toBeVisible();
    expect(history.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Suspendu')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Soumettre la fiche au staff' }),
    );
    expect(await screen.findByText('En attente de validation')).toBeVisible();
    expect(history.getByText('Corrections demandées')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Modifier la fiche' }),
    ).not.toBeInTheDocument();
  });

  it.each(['submitted', 'approved', 'rejected'] as const)(
    'locks direct editor access for %s sheets',
    async (validationStatus) => {
      fixture({
        route: detail + '/edit',
        sheet: { ...draft, validationStatus },
      });
      expect(
        await screen.findByText('Cette fiche est verrouillée.'),
      ).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Enregistrer le brouillon' }),
      ).not.toBeInTheDocument();
    },
  );

  it('distinguishes unavailable data from an empty account, with retry', async () => {
    const { user, handle } = fixture();
    handle.mockImplementation((call) =>
      call.path === listPath ? fail(503, 'SERVICE_UNAVAILABLE') : undefined,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'momentanément indisponible',
    );
    expect(
      screen.queryByText('Vous n’avez encore aucun personnage.'),
    ).not.toBeInTheDocument();
    handle.mockReturnValue(undefined);
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(
      await screen.findByRole('link', { name: 'Élise Armand' }),
    ).toBeVisible();
  });

  it('clears protected data when the API reports an expired session', async () => {
    const { handle, service } = fixture();
    handle.mockImplementation((call) =>
      call.path === listPath ? fail(401, 'UNAUTHENTICATED') : undefined,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'session a expiré',
    );
    expect(
      screen.queryByRole('link', { name: 'Élise Armand' }),
    ).not.toBeInTheDocument();
    expect(service.signOut).toHaveBeenCalledTimes(1);
  });

  it('uses rotated tokens and discards a late result after account change and logout', async () => {
    const { handle, emit, calls, user } = fixture();
    let finish!: (response: Response) => void;
    handle.mockImplementation((call) =>
      call.path === listPath &&
      new Headers(call.init.headers).get('Authorization')?.endsWith('-a')
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : call.path === listPath
          ? Response.json([summary({ ...draft, firstName: 'Nouveau' })])
          : undefined,
    );
    await waitFor(() => expect(finish).toBeDefined());
    const previous = calls.find(({ path }) => path === listPath);
    await act(async () =>
      emit('SIGNED_IN', {
        userId: 'user-b',
        accessToken: 'synthetic-session-b',
      }),
    );
    expect(
      await screen.findByRole('link', { name: 'Nouveau Armand' }),
    ).toBeVisible();
    expect(previous?.init.signal?.aborted).toBe(true);
    await act(async () =>
      emit('TOKEN_REFRESHED', {
        userId: 'user-b',
        accessToken: 'synthetic-session-rotated',
      }),
    );
    await user.click(screen.getByText('Consulter le catalogue des clubs'));
    expect(await screen.findByText('Musique')).toBeVisible();
    expect(
      new Headers(
        calls.find(({ path }) => path.endsWith('/clubs'))?.init.headers,
      ).get('Authorization'),
    ).toBe('Bearer synthetic-session-rotated');
    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(
      await screen.findByRole('heading', { name: 'Connexion' }),
    ).toBeVisible();
    await act(async () => finish(Response.json([summary(draft)])));
    expect(screen.queryByText('Élise Armand')).not.toBeInTheDocument();
    expect(screen.queryByText('Nouveau Armand')).not.toBeInTheDocument();
  });
});

describe('Sheet field validation', () => {
  it('matches byte, date, codepoint and list limits while preserving untouched arrays', () => {
    const values = sheetValues(draft);
    expect(
      changedFields(draft, {
        ...values,
        origins: '   ',
        contentWarnings: 'Solitude\n',
      }),
    ).toEqual({});
    expect(
      changedFields(draft, { ...values, birthDate: '2026-02-30' }),
    ).toEqual({ birthDate: '2026-02-30' });
    expect(validatePatch(draft, { birthDate: '2026-02-30' })).toMatchObject({
      kind: 'invalid',
    });
    expect(validatePatch(draft, { firstName: '😀'.repeat(80) })).toMatchObject({
      kind: 'valid',
    });
    expect(
      validatePatch(draft, {
        firstName: '😀'.repeat(81),
        contentWarnings: Array(13).fill('x'),
      }),
    ).toMatchObject({ kind: 'invalid' });
    const long = '😀'.repeat(4_000);
    expect(
      validatePatch(draft, {
        physicalDescription: long,
        personality: long,
        anecdotes: long,
        backstory: long.repeat(3),
      }),
    ).toMatchObject({ kind: 'valid' });
    expect(
      validatePatch(draft, {
        physicalDescription: long,
        personality: long,
        anecdotes: long,
        backstory: long.repeat(3),
        faceClaim: '😀'.repeat(300),
        rpLinks: Array(12).fill('😀'.repeat(300)),
      }),
    ).toMatchObject({ kind: 'too-large' });
  });
});
