import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from '@/app/app';
import { createAuthController } from '@/features/auth/auth-session';
import type {
  AuthService,
  AuthSession,
  SessionEvent,
} from '@/lib/services/auth-service';
import { createApiClient } from '@/lib/services/api-client';
import type {
  CharacterDetail,
  CharacterReviews,
} from '@/lib/services/character-contract';
import type { ReviewInput } from '@/lib/services/staff-review-contract';

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
  validationStatus: 'submitted',
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
const queue = '/account/staff';
const detail = `${queue}/characters/${id}`;
const apiQueue = '/api/v1/staff/characters';
const apiSheet = `${apiQueue}/${id}`;
const apiReviews = `${apiSheet}/reviews`;
const comment = 'Préciser son parcours.';
const priorReview = {
  decision: 'changes_requested' as const,
  reviewedAt: timestamp,
  comment: '<b>Préciser la chronologie.</b>',
  assignedHouseId: null,
};
const fail = (status: number, code: string) =>
  Response.json(
    { error: { code, message: 'private data', requestId } },
    { status },
  );

function fixture({
  route = detail,
  staff = true,
  enabled = true,
  charactersEnabled = true,
  sheet = draft,
  signedIn = true,
  empty = false,
}: {
  route?: string;
  staff?: boolean;
  enabled?: boolean;
  charactersEnabled?: boolean;
  sheet?: CharacterDetail;
  signedIn?: boolean;
  empty?: boolean;
} = {}) {
  const calls: {
    path: string;
    method: string;
    body?: ReviewInput;
    init: RequestInit;
  }[] = [];
  let listener: (event: SessionEvent, next: AuthSession | null) => void;
  let current: CharacterDetail = { ...sheet };
  let hasGrant = staff;
  let history: CharacterReviews = [priorReview];
  const service: AuthService = {
    signIn: vi.fn(),
    exchange: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue(signedIn ? session : null),
    subscribe: (sub) => {
      listener = sub;
    },
  };
  const override =
    vi.fn<
      (call: (typeof calls)[number]) => Response | Promise<Response> | undefined
    >();
  const transport = vi.fn<typeof fetch>(async (input, request = {}) => {
    const url = new URL(String(input));
    expect(url.origin).toBe(apiHost);
    expect(request.redirect).toBe('error');
    const call = {
      path: url.pathname + url.search,
      method: request.method ?? 'GET',
      body:
        typeof request.body === 'string'
          ? (JSON.parse(request.body) as ReviewInput)
          : undefined,
      init: request,
    };
    calls.push(call);
    const intercepted = await override(call);
    if (intercepted) return intercepted;
    if (url.pathname === '/api/v1/me')
      return Response.json({
        ...currentPlayer,
        capabilities: hasGrant ? ['characters.review'] : [],
        characters: [
          {
            id: uuid(30),
            validationStatus: 'approved',
            useStatus: 'active',
            canAccessCampus: true,
          },
        ],
      });
    if (url.pathname === '/api/v1/characters')
      return Response.json([
        {
          id: uuid(30),
          kind: 'teacher',
          firstName: 'Camille',
          lastName: 'Renard',
          nickname: null,
          validationStatus: 'approved',
          useStatus: 'active',
          revision: nextRevision,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ]);
    if (url.pathname === '/api/v1/characters/capacity')
      return Response.json({ total: 5, used: 1, available: 4 });
    if (url.pathname === '/api/v1/catalogs/houses')
      return Response.json([{ id: houseId, name: 'Quincy', slug: 'quincy' }]);
    if (url.pathname === '/api/v1/catalogs/programs')
      return Response.json([
        { id: programId, name: 'Histoire', slug: 'history' },
      ]);
    if (!hasGrant) return fail(403, 'CHARACTER_REVIEW_FORBIDDEN');
    if (url.pathname === apiQueue) {
      const second = url.searchParams.get('after');
      return Response.json({
        items:
          empty || current.validationStatus !== 'submitted'
            ? []
            : [
                {
                  id: second ? uuid(9) : id,
                  kind: current.kind,
                  revision: current.revision,
                  useStatus: second ? 'suspended' : current.useStatus,
                  updatedAt: timestamp,
                  firstName: second ? 'Iris' : current.firstName,
                  lastName: second ? 'Laurent' : current.lastName,
                },
              ],
        nextCursor:
          second || empty || current.validationStatus !== 'submitted'
            ? null
            : id,
      });
    }
    if (url.pathname === apiSheet && current.validationStatus === 'submitted')
      return Response.json(current);
    if (url.pathname === apiReviews) {
      if (call.method === 'POST' && call.body) {
        const { decision, expectedRevision, comment, houseId } = call.body;
        expect(expectedRevision).toBe(current.revision);
        const review = {
          decision,
          reviewedAt: timestamp,
          comment: comment ?? null,
          assignedHouseId: houseId ?? null,
        };
        current = {
          ...current,
          validationStatus: decision,
          revision: nextRevision,
          houseId: houseId ?? current.houseId,
        };
        history = [...history, review];
        return Response.json(
          {
            characterId: id,
            revision: nextRevision,
            houseId: current.houseId,
            review,
          },
          { status: 201 },
        );
      }
      return Response.json(history);
    }
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
    [
      {
        path: '*',
        element: (
          <App
            auth={auth}
            charactersEnabled={charactersEnabled}
            staffReviewsEnabled={enabled}
          />
        ),
      },
    ],
    { initialEntries: [route] },
  );
  const user = userEvent.setup();
  render(<RouterProvider router={router} />);
  return {
    user,
    router,
    auth,
    calls,
    override,
    posts: () => calls.filter(({ method }) => method === 'POST'),
    receive: (next: AuthSession | null) =>
      act(() => listener(next ? 'SIGNED_IN' : 'SIGNED_OUT', next)),
    rotate: () =>
      act(() =>
        listener('TOKEN_REFRESHED', {
          ...session,
          accessToken: 'synthetic-session-rotated',
        }),
      ),
    revoke: () => {
      hasGrant = false;
    },
    updateSheet: (patch: Partial<CharacterDetail>) => {
      current = { ...current, ...patch };
    },
    addDecision: () => {
      history = [...history, { ...priorReview, decision: 'approved' }];
    },
  };
}

async function propose(
  f: ReturnType<typeof fixture>,
  decision: ReviewInput['decision'],
  options: { house?: boolean; comment?: string } = {},
) {
  await f.user.selectOptions(
    await screen.findByLabelText('Décision proposée'),
    decision,
  );
  if (options.house)
    await f.user.selectOptions(screen.getByLabelText(/^House/), houseId);
  if (options.comment)
    fireEvent.change(screen.getByLabelText(/^Commentaire/), {
      target: { value: options.comment },
    });
  await f.user.click(
    screen.getByRole('button', { name: 'Vérifier la décision' }),
  );
}

async function confirm(f: ReturnType<typeof fixture>) {
  const dialog = await screen.findByRole('dialog', {
    name: 'Confirmer la décision',
  });
  await f.user.click(
    within(dialog).getByRole('button', { name: 'Enregistrer la décision' }),
  );
}

describe('authenticated staff review', () => {
  it('requires a session for a direct staff sheet URL', async () => {
    const f = fixture({ signedIn: false });
    expect(
      await screen.findByRole('heading', { name: 'Connexion' }),
    ).toBeInTheDocument();
    expect(f.calls).toHaveLength(0);
  });

  it('denies a player whose only authority is a teacher character', async () => {
    const f = fixture({ staff: false });
    expect(
      await screen.findByRole('heading', { name: 'Accès staff indisponible' }),
    ).toBeInTheDocument();
    expect(f.calls.map(({ path }) => path)).toEqual(['/api/v1/me']);
    await act(() => f.router.navigate(account));
    expect(await screen.findByText('Camille Renard')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'File de validation' }),
    ).not.toBeInTheDocument();
  });

  it('links authorized accounts to a paginated queue with a live refresh', async () => {
    const f = fixture({ route: account });
    await f.user.click(
      await screen.findByRole('link', { name: 'File de validation' }),
    );
    expect(
      await screen.findByRole('link', {
        name: 'Examiner la fiche de Élise Armand',
      }),
    ).toBeInTheDocument();
    await f.user.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(await screen.findByText('Iris Laurent')).toBeInTheDocument();
    expect(screen.getByText('Suspendu')).toBeInTheDocument();
    expect(screen.getByText('Dernière modification')).toBeInTheDocument();
    expect(f.calls.some(({ path }) => path === apiQueue + '?after=' + id)).toBe(
      true,
    );
    await f.user.click(screen.getByRole('button', { name: 'Page précédente' }));
    expect(await screen.findByText('Élise Armand')).toBeInTheDocument();
    await f.user.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(await screen.findByText('Iris Laurent')).toBeInTheDocument();
    await f.user.click(
      screen.getByRole('button', { name: 'Actualiser la file' }),
    );
    expect(await screen.findByText('Élise Armand')).toBeInTheDocument();
  });

  it('distinguishes an empty queue from a service failure', async () => {
    const f = fixture({ route: queue, empty: true });
    expect(
      await screen.findByText('Aucune fiche en attente.'),
    ).toBeInTheDocument();
    f.override.mockReturnValueOnce(fail(503, 'SERVICE_UNAVAILABLE'));
    await f.user.click(
      screen.getByRole('button', { name: 'Actualiser la file' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(requestId);
    expect(
      screen.queryByText('Aucune fiche en attente.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('private data')).not.toBeInTheDocument();
  });

  it('displays read-only sheet and server history without interpreting RP text as HTML', async () => {
    fixture();
    expect(
      await screen.findByRole('heading', { name: 'Élise Armand' }),
    ).toBeInTheDocument();
    expect(screen.getByText(priorReview.comment)).toBeInTheDocument();
    expect(
      screen.getByText('https://exemple.invalid/texte'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'https://exemple.invalid/texte' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it.each(['self', 'draft'])(
    'respects backend 404 for %s without fetching history',
    async () => {
      const f = fixture();
      f.override.mockImplementation(({ path }) =>
        path === apiSheet ? fail(404, 'CHARACTER_NOT_FOUND') : undefined,
      );
      expect(
        await screen.findByText(
          'Cette fiche est introuvable ou n’est plus en attente.',
        ),
      ).toBeInTheDocument();
      expect(f.calls.some(({ path }) => path === apiReviews)).toBe(false);
      expect(
        screen.queryByLabelText('Décision proposée'),
      ).not.toBeInTheDocument();
    },
  );

  it('requires an active House and confirmation to approve a student', async () => {
    const f = fixture();
    await propose(f, 'approved');
    expect(screen.getByRole('alert')).toHaveTextContent('Choisissez une House');
    expect(f.posts()).toHaveLength(0);
    await propose(f, 'approved', { house: true });
    expect(f.posts()).toHaveLength(0);
    await confirm(f);
    expect(
      await screen.findByText('Décision enregistrée.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Aucune fiche en attente.'),
    ).toBeInTheDocument();
    expect(f.posts()[0]?.body).toEqual({
      expectedRevision: initialRevision,
      decision: 'approved',
      houseId,
    });
    expect(f.posts()[0]?.init.cache).toBe('no-store');
  });

  it('preserves an inactive historical House without sending its ID', async () => {
    const f = fixture({ sheet: { ...draft, houseId: uuid(70) } });
    await propose(f, 'approved');
    expect(
      screen.getByText(/Attribution actuelle · House hors catalogue/),
    ).toBeInTheDocument();
    await confirm(f);
    expect(
      await screen.findByText('Décision enregistrée.'),
    ).toBeInTheDocument();
    expect(f.posts()[0]?.body).toEqual({
      expectedRevision: initialRevision,
      decision: 'approved',
    });
  });

  it('approves a non-student without a House selector', async () => {
    const f = fixture({ sheet: { ...draft, kind: 'teacher' } });
    await propose(f, 'approved');
    expect(screen.queryByLabelText(/^House/)).not.toBeInTheDocument();
    await confirm(f);
    expect(
      await screen.findByText('Décision enregistrée.'),
    ).toBeInTheDocument();
    expect(f.posts()[0]?.body?.houseId).toBeUndefined();
  });

  it.each(['changes_requested', 'rejected'] as const)(
    'requires a comment for %s and sends only permitted fields',
    async (decision) => {
      const f = fixture();
      await propose(f, 'changes_requested');
      await f.user.selectOptions(screen.getByLabelText(/^House/), houseId);
      await propose(f, decision);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Un commentaire est obligatoire',
      );
      await propose(f, decision, { comment: '  ' + comment + ' ' });
      await confirm(f);
      expect(
        await screen.findByText('Décision enregistrée.'),
      ).toBeInTheDocument();
      expect(f.posts()[0]?.body).toEqual({
        expectedRevision: initialRevision,
        decision,
        comment,
        ...(decision === 'changes_requested' && { houseId }),
      });
    },
  );

  it('counts Unicode code points in comments and blocks duplicate POSTs', async () => {
    const f = fixture({ sheet: { ...draft, kind: 'citizen' } });
    const multibyte = 'é𐐀'.repeat(1000);
    await propose(f, 'approved', { comment: multibyte + 'a' });
    expect(screen.getByRole('alert')).toHaveTextContent(/2\s000/);
    await propose(f, 'approved', { comment: multibyte });
    let finish!: (value: Response) => void;
    f.override.mockImplementation(({ method }) =>
      method === 'POST'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : undefined,
    );
    const button = within(await screen.findByRole('dialog')).getByRole(
      'button',
      { name: 'Enregistrer la décision' },
    );
    act(() => {
      button.click();
      button.click();
    });
    await waitFor(() => expect(f.posts()).toHaveLength(1));
    await act(() => finish(fail(409, 'CHARACTER_NOT_SUBMITTED')));
    expect(
      await screen.findByText(/Une décision a déjà été enregistrée/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Fiche du personnage' }),
    ).not.toBeInTheDocument();
  });

  it('requires explicit fresh review on revision conflict and protects an unsaved comment', async () => {
    const f = fixture();
    const back = await screen.findByRole('link', { name: 'Retour à la file' });
    await propose(f, 'rejected', { comment });
    await f.user.click(
      screen.getByRole('button', { name: 'Revenir à la décision' }),
    );
    await f.user.click(back);
    expect(
      await screen.findByRole('dialog', { name: 'Quitter cette page ?' }),
    ).toBeInTheDocument();
    await f.user.click(
      screen.getByRole('button', { name: 'Rester sur la page' }),
    );
    expect(screen.getByLabelText(/^Commentaire/)).toHaveValue(comment);
    await propose(f, 'rejected');
    f.override.mockImplementation(({ method }) =>
      method === 'POST' ? fail(409, 'CHARACTER_REVISION_CONFLICT') : undefined,
    );
    await confirm(f);
    expect(await screen.findByRole('alert')).toHaveTextContent(requestId);
    expect(screen.getByLabelText(/^Commentaire/)).toHaveValue(comment);
    f.updateSheet({ revision: nextRevision, firstName: 'Iris' });
    await f.user.click(screen.getByRole('button', { name: /Relire la fiche/ }));
    expect(
      await screen.findByRole('heading', { name: 'Iris Armand' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Commentaire/)).toHaveValue('');
    expect(f.posts()).toHaveLength(1);
  });

  it('requires successful verification before allowing a manual retry after an uncertain result', async () => {
    const f = fixture();
    await propose(f, 'rejected', { comment });
    f.override.mockImplementation(({ method }) =>
      method === 'POST' ? fail(503, 'SERVICE_UNAVAILABLE') : undefined,
    );
    await confirm(f);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le résultat est incertain.',
    );
    expect(
      screen.getByRole('button', { name: 'Vérifier la décision' }),
    ).toBeDisabled();
    await f.user.click(
      screen.getByRole('button', { name: 'Vérifier l’état et l’historique' }),
    );
    expect(
      await screen.findByText(/La fiche et l’historique sont inchangés/),
    ).toBeInTheDocument();
    expect(f.posts()).toHaveLength(1);
    expect(
      f.calls.filter(
        ({ path, method }) => path === apiReviews && method === 'GET',
      ),
    ).toHaveLength(2);
    f.override.mockReturnValue(undefined);
    await propose(f, 'rejected');
    await confirm(f);
    expect(
      await screen.findByText('Décision enregistrée.'),
    ).toBeInTheDocument();
    expect(f.posts()).toHaveLength(2);
  });

  it('treats an unexpected success status as uncertain even with a well-formed body', async () => {
    const f = fixture({ sheet: { ...draft, kind: 'teacher' } });
    await propose(f, 'approved');
    f.override.mockImplementation(({ method }) =>
      method === 'POST'
        ? Response.json({
            characterId: id,
            revision: nextRevision,
            houseId: null,
            review: {
              decision: 'approved',
              reviewedAt: timestamp,
              comment: null,
              assignedHouseId: null,
            },
          })
        : undefined,
    );
    await confirm(f);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le résultat est incertain.',
    );
    expect(screen.queryByText('Décision enregistrée.')).not.toBeInTheDocument();
  });

  it('shows a newer history decision after an uncertain write without replaying it', async () => {
    const f = fixture();
    await propose(f, 'rejected', { comment });
    f.override.mockImplementation(({ method }) =>
      method === 'POST' ? fail(503, 'SERVICE_UNAVAILABLE') : undefined,
    );
    await confirm(f);
    f.updateSheet({ validationStatus: 'approved', revision: nextRevision });
    f.addDecision();
    await f.user.click(
      await screen.findByRole('button', {
        name: 'Vérifier l’état et l’historique',
      }),
    );
    expect(
      await screen.findByText('Dernière décision dans l’historique · Validé'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Élise Armand')).not.toBeInTheDocument();
    expect(f.posts()).toHaveLength(1);
  });

  it('refreshes capabilities on token rotation without losing an authorized reviewer’s draft', async () => {
    const f = fixture();
    const editor = await screen.findByLabelText(/Commentaire/);
    await f.user.type(editor, comment);
    await f.rotate();
    await waitFor(() =>
      expect(f.calls.filter(({ path }) => path === '/api/v1/me')).toHaveLength(
        2,
      ),
    );
    expect(editor).toHaveValue(comment);
    expect(screen.getByText('Élise Armand')).toBeInTheDocument();
    expect(f.posts()).toHaveLength(0);
  });

  it('clears an open staff sheet when revalidation after token rotation sees revocation', async () => {
    const f = fixture();
    await screen.findByText('Élise Armand');
    f.revoke();
    await f.rotate();
    expect(
      await screen.findByRole('heading', { name: 'Accès staff indisponible' }),
    ).toBeVisible();
    const current = f.calls.filter(({ path }) => path === '/api/v1/me').at(-1);
    expect(new Headers(current?.init.headers).get('Authorization')).toBe(
      'Bearer synthetic-session-rotated',
    );
    expect(screen.queryByText('Élise Armand')).not.toBeInTheDocument();
    expect(f.posts()).toHaveLength(0);
  });

  it('drops staff data immediately on a backend denial and refreshes the effective permissions', async () => {
    const f = fixture();
    await propose(f, 'rejected', { comment });
    f.revoke();
    await confirm(f);
    expect(
      await screen.findByRole('heading', { name: 'Accès staff indisponible' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(requestId);
    expect(screen.queryByText('Élise Armand')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(f.calls.filter(({ path }) => path === '/api/v1/me')).toHaveLength(
        2,
      ),
    );
  });

  it('aborts an outstanding staff read when verification detects a revoked grant', async () => {
    const f = fixture();
    await propose(f, 'rejected', { comment });
    f.override.mockImplementation(({ method }) =>
      method === 'POST' ? fail(503, 'SERVICE_UNAVAILABLE') : undefined,
    );
    await confirm(f);
    let complete!: (result: Response) => void;
    f.override.mockImplementation(({ path, method }) => {
      if (path === apiSheet)
        return new Promise((resolve) => {
          complete = resolve;
        });
      if (path === apiReviews && method === 'GET')
        return fail(403, 'CHARACTER_REVIEW_FORBIDDEN');
    });
    await f.user.click(
      await screen.findByRole('button', {
        name: 'Vérifier l’état et l’historique',
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Accès staff indisponible' }),
    ).toBeInTheDocument();
    expect(
      f.calls.filter(({ path }) => path === apiSheet).at(-1)?.init.signal
        ?.aborted,
    ).toBe(true);
    await act(() => complete(Response.json(draft)));
    expect(screen.queryByText('Élise Armand')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'File de validation' }),
    ).not.toBeInTheDocument();
    // The mock /me still returns the old grant. The staff denial remains authoritative.
    await act(() => f.router.navigate(queue));
    expect(
      await screen.findByRole('heading', { name: 'Accès staff indisponible' }),
    ).toBeInTheDocument();
  });

  it.each([null, { userId: 'user-b', accessToken: 'synthetic-session-b' }])(
    'invalidates a late staff response on account change %j',
    async (next) => {
      const f = fixture();
      let finish!: (value: Response) => void;
      f.override.mockImplementation(({ path }) =>
        path === apiSheet
          ? new Promise((resolve) => {
              finish = resolve;
            })
          : undefined,
      );
      await waitFor(() =>
        expect(f.calls.some(({ path }) => path === apiSheet)).toBe(true),
      );
      const first = f.calls.find(({ path }) => path === apiSheet);
      f.revoke();
      f.receive(next);
      await act(() => finish(Response.json(draft)));
      expect(first?.init.signal?.aborted).toBe(true);
      expect(
        await screen.findByRole('heading', {
          name: next ? 'Accès staff indisponible' : 'Connexion',
        }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Élise Armand')).not.toBeInTheDocument();
    },
  );

  it.each([{ enabled: false }, { charactersEnabled: false }])(
    'requires both enabled flags %j',
    async (flags) => {
      const f = fixture({ route: queue, ...flags });
      expect(
        await screen.findByRole('heading', { name: 'Page introuvable' }),
      ).toBeInTheDocument();
      expect(f.calls.some(({ path }) => path.startsWith(apiQueue))).toBe(false);
    },
  );

  it('keeps the demo staff route independent of authenticated reviews', async () => {
    const f = fixture({ route: '/preview/staff' });
    expect(
      await screen.findByText('Mode démonstration', { exact: true }),
    ).toBeInTheDocument();
    expect(f.calls).toHaveLength(0);
  });
});
