import { StrictMode } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/app/app';
import {
  createAuthController,
  type AuthController,
} from '@/features/auth/auth-session';
import type { OAuthCallback } from '@/features/auth/callback';
import { ApiError, type ApiClient } from '@/lib/services/api-client';
import { SessionError, type AuthService } from '@/lib/services/auth-service';
import type { PlayerContext } from '@/lib/services/player-context';

const session = {
  userId: 'synthetic-user-a',
  accessToken: 'supabase-access-a',
};
const otherSession = {
  userId: 'synthetic-user-b',
  accessToken: 'supabase-access-b',
};
const player: PlayerContext = {
  playerId: '10000000-0000-4000-8000-000000000001',
  capabilities: [],
  characters: [],
  canAccessCampus: false,
};
const approved: PlayerContext['characters'][number] = {
  id: '10000000-0000-4000-8000-000000000002',
  validationStatus: 'approved',
  useStatus: 'active',
  canAccessCampus: true,
};
const suspended: PlayerContext['characters'][number] = {
  id: '10000000-0000-4000-8000-000000000003',
  validationStatus: 'changes_requested',
  useStatus: 'suspended',
  canAccessCampus: false,
};
const redirectTo = 'https://campus.example/auth/callback';

function setup(callback: OAuthCallback = { kind: 'none' }) {
  let notify: Parameters<AuthService['subscribe']>[0] | undefined;
  const service = {
    signIn: vi.fn<AuthService['signIn']>().mockResolvedValue(undefined),
    exchange: vi.fn<AuthService['exchange']>().mockResolvedValue(session),
    getSession: vi.fn<AuthService['getSession']>().mockResolvedValue(null),
    subscribe: vi.fn<AuthService['subscribe']>((listener) => {
      notify = listener;
    }),
    signOut: vi.fn<AuthService['signOut']>().mockResolvedValue(undefined),
  };
  const api = {
    me: vi
      .fn<ApiClient['me']>()
      .mockResolvedValue({ data: player, requestId: undefined }),
    bootstrap: vi
      .fn<ApiClient['bootstrap']>()
      .mockResolvedValue({ data: player, requestId: undefined }),
  };
  const loadService = vi.fn(() => service);
  return {
    service,
    loadService,
    api,
    auth: createAuthController('enabled', {
      service: loadService,
      api,
      callback,
      redirectTo,
    }),
    emit: (...args: Parameters<Parameters<AuthService['subscribe']>[0]>) =>
      notify?.(...args),
  };
}

function LocationProbe() {
  const { pathname, search, hash } = useLocation();
  return (
    <output aria-label="Test route">
      {pathname}
      {search}
      {hash}
    </output>
  );
}

function mount(auth: AuthController, route: string) {
  const user = userEvent.setup();
  const view = render(
    <StrictMode>
      <MemoryRouter initialEntries={[route]}>
        <App auth={auth} />
        <LocationProbe />
        <Link to="/account">Tester l’accès direct au compte</Link>
      </MemoryRouter>
    </StrictMode>,
  );
  return { user, ...view };
}

describe('Discord sign-in and callback', () => {
  it('enables the Discord button when configured and starts one sign-in', async () => {
    const { auth, service } = setup();
    const { user } = mount(auth, '/login');
    await screen.findByText('Connectez-vous avec votre compte Discord.');
    expect(screen.queryByText('Mode démonstration')).not.toBeInTheDocument();
    const button = screen.getByRole('button', {
      name: 'Continuer avec Discord',
    });
    await user.dblClick(button);
    expect(service.signIn).toHaveBeenCalledExactlyOnceWith(redirectTo);
    expect(button).toBeDisabled();
  });

  it('keeps login unavailable when configuration is invalid', async () => {
    mount(createAuthController('invalid-config'), '/login');
    expect(
      await screen.findByRole('button', { name: 'Continuer avec Discord' }),
    ).toBeDisabled();
  });

  it('redirects a direct anonymous account visit to login', async () => {
    const { auth, api } = setup();
    mount(auth, '/account');
    expect(
      await screen.findByRole('heading', { name: 'Connexion', level: 1 }),
    ).toBeVisible();
    expect(api.me).not.toHaveBeenCalled();
    expect(api.bootstrap).not.toHaveBeenCalled();
  });

  it('exchanges the callback once under StrictMode and bootstraps before showing the account', async () => {
    const fixture = setup({ kind: 'code', code: 'synthetic-code' });
    let complete!: (value: Awaited<ReturnType<ApiClient['bootstrap']>>) => void;
    fixture.api.bootstrap.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    mount(fixture.auth, '/auth/callback');
    expect(
      await screen.findByText('Initialisation du compte joueur…'),
    ).toBeVisible();
    expect(fixture.service.exchange).toHaveBeenCalledExactlyOnceWith(
      'synthetic-code',
    );
    expect(fixture.service.getSession).not.toHaveBeenCalled();
    expect(fixture.api.me).not.toHaveBeenCalled();
    expect(fixture.api.bootstrap).toHaveBeenCalledExactlyOnceWith(
      session.accessToken,
      expect.any(AbortSignal),
    );
    await act(async () => complete({ data: player, requestId: undefined }));
    expect(
      await screen.findByRole('heading', {
        name: 'Espace personnel',
        level: 1,
      }),
    ).toBeVisible();
    expect(
      screen.getByText('Votre compte ne contient encore aucun personnage.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Test route')).toHaveTextContent(
      /^\/account$/,
    );
  });

  it('handles code rejection without showing backend details or accessing the API', async () => {
    const { auth, service, api } = setup({
      kind: 'code',
      code: 'invalid-code',
    });
    service.exchange.mockRejectedValue(new SessionError('invalid'));
    mount(auth, '/auth/callback');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'invalide ou a expiré',
    );
    expect(screen.getByLabelText('Test route')).toHaveTextContent(/^\/login$/);
    expect(screen.queryByText(/invalid-code/)).not.toBeInTheDocument();
    expect(api.bootstrap).not.toHaveBeenCalled();
  });

  it('handles refusal without starting the SDK or calling the API', async () => {
    const { auth, loadService } = setup({ kind: 'cancelled' });
    mount(auth, '/auth/callback');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'annulée ou refusée',
    );
    expect(loadService).not.toHaveBeenCalled();
  });

  it('offers recovery after a connection service error', async () => {
    const { auth, service } = setup();
    service.getSession
      .mockRejectedValueOnce(new SessionError('unavailable'))
      .mockResolvedValueOnce(null);
    const { user } = mount(auth, '/login');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'momentanément indisponible',
    );
    await user.click(
      screen.getByRole('button', { name: 'Réessayer la vérification' }),
    );
    expect(
      await screen.findByText('Connectez-vous avec votre compte Discord.'),
    ).toBeVisible();
  });
});

describe('Personal space and private session lifecycle', () => {
  it('loads player context on reload and renders only unidentifiable character labels', async () => {
    const { auth, api, service } = setup();
    service.getSession.mockResolvedValue(session);
    api.me.mockResolvedValue({
      data: {
        ...player,
        canAccessCampus: true,
        characters: [approved, suspended],
      },
      requestId: undefined,
    });
    mount(auth, '/account');
    expect(
      await screen.findByRole('heading', { name: '2 personnages' }),
    ).toBeVisible();
    expect(
      screen.getByText('Vous avez au moins un personnage utilisable.'),
    ).toBeVisible();
    const cards = within(screen.getByRole('region', { name: '2 personnages' }));
    expect(cards.getByText('Suspendu')).toBeVisible();
    expect(cards.getByText('Validée')).toBeVisible();
    expect(cards.getByText('Correction demandée')).toBeVisible();
    expect(screen.queryByText(player.playerId)).not.toBeInTheDocument();
    expect(screen.queryByText(approved.id)).not.toBeInTheDocument();
    expect(screen.queryByText('Camille Delorme')).not.toBeInTheDocument();
    expect(api.me).toHaveBeenCalledExactlyOnceWith(
      session.accessToken,
      expect.any(AbortSignal),
    );
    expect(api.bootstrap).not.toHaveBeenCalled();
  });

  it('shows a player with only unusable characters', async () => {
    const { auth, api, service } = setup();
    service.getSession.mockResolvedValue(session);
    api.me.mockResolvedValue({
      data: { ...player, characters: [suspended] },
      requestId: undefined,
    });
    mount(auth, '/account');
    expect(
      await screen.findByText('Aucun personnage utilisable pour le moment.'),
    ).toBeVisible();
  });

  it('recovers an interrupted link through the documented GET error', async () => {
    const { auth, api, service } = setup();
    service.getSession.mockResolvedValue(session);
    api.me.mockRejectedValue(
      new ApiError('http', 403, undefined, 'PLAYER_LINK_REQUIRED'),
    );
    mount(auth, '/account');
    expect(
      await screen.findByRole('heading', { name: '0 personnage' }),
    ).toBeVisible();
    expect(api.bootstrap).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, /session a expiré/, false],
    [403, /identité Discord liée/, true],
    [409, /autre compte joueur/, true],
    [503, /momentanément indisponible/, true],
  ] as const)(
    'handles API %s independently of OAuth results',
    async (status, message, remainsSignedIn) => {
      const { auth, api, service } = setup({ kind: 'code', code: 'test-code' });
      api.bootstrap.mockRejectedValue(new ApiError('http', status));
      mount(auth, '/auth/callback');
      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      if (remainsSignedIn) {
        expect(
          await screen.findByRole('button', { name: 'Se déconnecter' }),
        ).toBeVisible();
        expect(service.signOut).not.toHaveBeenCalled();
      } else {
        expect(
          await screen.findByRole('heading', { name: 'Connexion', level: 1 }),
        ).toBeVisible();
        expect(service.signOut).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('uses the rotated token when retrying and clears account data on logout', async () => {
    const fixture = setup({ kind: 'code', code: 'test-code' });
    fixture.api.bootstrap
      .mockRejectedValueOnce(new ApiError('http', 503))
      .mockResolvedValue({ data: player, requestId: undefined });
    const { user } = mount(fixture.auth, '/auth/callback');
    expect(await screen.findByRole('alert')).toBeVisible();
    await act(async () =>
      fixture.emit('TOKEN_REFRESHED', {
        ...session,
        accessToken: 'rotated-supabase-token',
      }),
    );
    expect(
      await screen.findByRole('heading', { name: '0 personnage' }),
    ).toBeVisible();
    expect(fixture.api.bootstrap).toHaveBeenLastCalledWith(
      'rotated-supabase-token',
      expect.any(AbortSignal),
    );
    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(
      await screen.findByRole('heading', { name: 'Connexion', level: 1 }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: '0 personnage' }),
    ).not.toBeInTheDocument();
    expect(fixture.service.signOut).toHaveBeenCalledTimes(1);
  });

  it('reads the player when the SDK emits SIGNED_IN during session restoration', async () => {
    const fixture = setup();
    fixture.service.getSession.mockImplementation(async () => {
      fixture.emit('SIGNED_IN', session);
      return session;
    });
    mount(fixture.auth, '/account');
    expect(
      await screen.findByRole('heading', { name: '0 personnage' }),
    ).toBeVisible();
    expect(fixture.api.me).toHaveBeenCalledExactlyOnceWith(
      session.accessToken,
      expect.any(AbortSignal),
    );
    expect(fixture.api.bootstrap).not.toHaveBeenCalled();
  });

  it('clears the previous player immediately and ignores stale responses after a change of account', async () => {
    const fixture = setup();
    fixture.service.getSession.mockResolvedValue(session);
    fixture.api.me.mockResolvedValue({
      data: { ...player, characters: [suspended] },
      requestId: undefined,
    });
    mount(fixture.auth, '/account');
    expect(await screen.findByText('Suspendu')).toBeVisible();

    let complete!: (value: Awaited<ReturnType<ApiClient['me']>>) => void;
    fixture.api.me.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    await act(async () => fixture.emit('SIGNED_IN', otherSession));
    expect(screen.queryByText('Suspendu')).not.toBeInTheDocument();
    const signal = fixture.api.me.mock.calls[1]?.[1];
    await act(async () => fixture.emit('SIGNED_OUT', null));
    expect(signal?.aborted).toBe(true);
    await act(async () =>
      complete({
        data: { ...player, characters: [approved] },
        requestId: undefined,
      }),
    );
    expect(
      await screen.findByText('Votre session a expiré. Reconnectez-vous.'),
    ).toBeVisible();
    expect(screen.queryByText('Validée')).not.toBeInTheDocument();
  });

  it('keeps demo browsing and mutations independent from all configured auth services', async () => {
    const { auth, loadService, api } = setup();
    const { user } = mount(auth, '/preview/social');
    const composer = await screen.findByLabelText('Publication RP');
    await user.type(composer, 'Message fictif, sans session réelle.');
    await user.click(screen.getByRole('button', { name: 'Publier' }));
    expect(
      await screen.findByText('Message fictif, sans session réelle.'),
    ).toBeVisible();
    expect(loadService).not.toHaveBeenCalled();
    expect(api.me).not.toHaveBeenCalled();
    expect(api.bootstrap).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByText('Mode démonstration')).toBeVisible(),
    );
  });
});
