import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/app/app';
import { ApiStatus } from '@/features/campus/api-status';
import { ThemeProvider } from '@/features/theme/theme-provider';
import { setSystemDark } from './setup';

function renderRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Public campus routes', () => {
  it('presents the Digital Campus as an independent roleplay community', () => {
    renderRoute();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Harvard University RP' }),
    ).toBeVisible();
    expect(
      screen.getByText(/sans affiliation avec Harvard University/i),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Aller au contenu' }),
    ).toHaveAttribute('href', '/#main-content');
  });

  it('navigates to the demonstration and exposes the sample module routes', async () => {
    const user = userEvent.setup();
    renderRoute();
    await user.click(screen.getByRole('link', { name: 'Accéder au campus' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Accueil',
      }),
    ).toBeVisible();
    expect(screen.getByText('Mode démonstration')).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Mon personnage' }),
    ).toHaveTextContent('Camille Delorme');
    expect(
      screen.getByRole('region', { name: 'Activité récente' }),
    ).toBeVisible();
    expect(
      screen.getByText('La bibliothèque prolonge ses horaires'),
    ).toBeVisible();
    expect(screen.getByText('Veillée de lecture')).toBeVisible();
    const nav = within(
      screen.getByRole('navigation', { name: 'Navigation du campus' }),
    );
    expect(nav.getByRole('link', { name: 'Accueil' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(nav.getByRole('link', { name: 'Mon personnage' })).toHaveAttribute(
      'href',
      '/preview/character',
    );
    expect(nav.getByRole('link', { name: 'Classement' })).toHaveAttribute(
      'href',
      '/preview/ranking',
    );
  });

  it('shows Discord sign-in as unavailable and links to the preview', async () => {
    const user = userEvent.setup();
    renderRoute('/login');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Connexion' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Continuer avec Discord' }),
    ).toBeDisabled();
    expect(
      screen.getByText(/La connexion Discord est indisponible/i),
    ).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Accéder au campus sans compte' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Accueil' }),
    ).toBeVisible();
  });

  it('renders the application 404 and returns home', async () => {
    const user = userEvent.setup();
    renderRoute('/unknown-place');
    expect(
      screen.getByRole('heading', { name: 'Page introuvable' }),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Retour à l’accueil' }));
    expect(
      screen.getByRole('heading', { name: 'Harvard University RP' }),
    ).toBeVisible();
  });

  it('filters actual preview sections in the search dialog', async () => {
    const user = userEvent.setup();
    renderRoute('/preview');
    await user.click(
      await screen.findByRole('button', { name: 'Rechercher sur le campus' }),
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Rechercher sur le campus',
    });
    const input = within(dialog).getByRole('textbox', {
      name: 'Nom de la rubrique',
    });
    await user.type(input, 'evenement');
    expect(
      within(dialog).queryByRole('link', { name: 'Accueil' }),
    ).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('link', { name: 'Événements' }));
    expect(dialog).not.toBeInTheDocument();
    const events = screen.getByRole('region', { name: 'Prochains événements' });
    expect(events).toBeVisible();
    await waitFor(() => expect(events).toHaveFocus());
  });
});

describe('Theme', () => {
  it('follows system changes by default', () => {
    renderRoute();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    act(() => setSystemDark(true));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('persists a manual dark choice and switches back to light', async () => {
    const user = userEvent.setup();
    const first = renderRoute();
    await user.click(screen.getByRole('button', { name: 'Apparence' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Sombre' }));
    expect(localStorage.getItem('hu-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    first.unmount();
    renderRoute();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Apparence' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Clair' }));
    act(() => setSystemDark(true));
    expect(localStorage.getItem('hu-theme')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});

describe('API connection feedback', () => {
  it('keeps the preview usable without an API or a network call', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderRoute('/preview');
    await user.click(
      await screen.findByRole('button', { name: 'État de l’API' }),
    );
    expect(screen.getByText(/Mode autonome/i)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Vérifier la connexion' }),
    ).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports an HTTP failure and its request ID without exposing its body', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Private upstream detail', {
          status: 503,
          headers: { 'X-Request-Id': 'request-test-123' },
        }),
      ),
    );
    render(
      <ThemeProvider>
        <ApiStatus
          config={{
            kind: 'ready',
            baseUrl: 'https://api.example/',
            timeoutMs: 200,
          }}
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'État de l’API' }));
    await user.click(
      screen.getByRole('button', { name: 'Vérifier la connexion' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Échec de la vérification',
    );
    expect(screen.getByText('request-test-123')).toBeVisible();
    expect(
      screen.queryByText('Private upstream detail'),
    ).not.toBeInTheDocument();
  });
});
