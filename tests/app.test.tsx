import { act, render, screen, within } from '@testing-library/react';
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
      screen.getByRole('heading', { level: 1, name: 'The Digital Campus.' }),
    ).toBeVisible();
    expect(
      screen.getByText(/no affiliation with Harvard University/i),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Skip to content' }),
    ).toHaveAttribute('href', '#main-content');
  });

  it('navigates to the development preview and leaves future features unavailable', async () => {
    const user = userEvent.setup();
    renderRoute();
    await user.click(screen.getByRole('link', { name: 'Explore campus' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Welcome to campus.',
      }),
    ).toBeVisible();
    expect(screen.getByText('Development preview')).toBeVisible();
    expect(screen.getByText('No announcements yet')).toBeVisible();
    expect(screen.getByText('No events scheduled')).toBeVisible();
    const nav = within(
      screen.getByRole('navigation', { name: 'Campus navigation' }),
    );
    expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(nav.getByText('My Character').parentElement).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      nav.queryByRole('link', { name: /leaderboard/i }),
    ).not.toBeInTheDocument();
  });

  it('shows Discord sign-in as unavailable and links to the preview', async () => {
    const user = userEvent.setup();
    renderRoute('/login');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in to campus.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Continue with Discord' }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Discord sign-in is not available yet/i),
    ).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Explore the public preview' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Welcome to campus.' }),
    ).toBeVisible();
  });

  it('renders the application 404 and returns home', async () => {
    const user = userEvent.setup();
    renderRoute('/unknown-place');
    expect(
      screen.getByRole('heading', { name: 'Page not found.' }),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Back to home' }));
    expect(
      screen.getByRole('heading', { name: 'The Digital Campus.' }),
    ).toBeVisible();
  });

  it('filters actual preview sections in the search dialog', async () => {
    const user = userEvent.setup();
    renderRoute('/preview');
    await user.click(
      await screen.findByRole('button', { name: 'Search campus' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Search campus' });
    const input = within(dialog).getByRole('textbox', { name: 'Section name' });
    await user.type(input, 'event');
    expect(
      within(dialog).queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('link', { name: 'Events' }));
    expect(dialog).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Upcoming events' }),
    ).toBeVisible();
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
    await user.click(screen.getByRole('button', { name: 'Appearance' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));
    expect(localStorage.getItem('hu-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    first.unmount();
    renderRoute();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Appearance' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Light' }));
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
    await user.click(await screen.findByRole('button', { name: 'API status' }));
    expect(screen.getByText(/running in standalone mode/i)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Check connection' }),
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
    await user.click(screen.getByRole('button', { name: 'API status' }));
    await user.click(screen.getByRole('button', { name: 'Check connection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Connection check failed',
    );
    expect(screen.getByText('request-test-123')).toBeVisible();
    expect(
      screen.queryByText('Private upstream detail'),
    ).not.toBeInTheDocument();
  });
});
