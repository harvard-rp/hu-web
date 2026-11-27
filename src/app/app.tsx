import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { PublicLayout } from '@/components/layout/public-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { campusDestinations } from '@/features/campus/campus-navigation';
import { noAuth, type AuthController } from '@/features/auth/auth-session';
import { useAuth } from '@/features/auth/use-auth';
import { DemoProvider } from '@/features/demo/demo-state';
import { ThemeProvider } from '@/features/theme/theme-provider';
import { HomePage } from '@/routes/home-page';
import { LoginPage } from '@/routes/login-page';
import {
  AuthCallbackPage,
  PersonalSpacePage,
} from '@/routes/personal-space-page';
import { NotFoundPage } from '@/routes/not-found-page';

const PlayerCharacterRoutes = lazy(
  () => import('@/features/player-characters/player-character-routes'),
);
const CampusRoutes = lazy(() => import('./campus-routes'));

const titles = new Map([
  ['/', 'Accueil'],
  ['/login', 'Connexion'],
  ['/auth/callback', 'Connexion à Discord'],
  ['/account', 'Espace personnel'],
  ...campusDestinations.map(({ path, label }): [string, string] => [
    path,
    label,
  ]),
]);

// Resolve session state before starting an import of protected features.
function ProtectedAccount({
  controller,
  staffReviewsEnabled,
  reopeningEnabled,
}: {
  controller: AuthController;
  staffReviewsEnabled: boolean;
  reopeningEnabled: boolean;
}) {
  const state = useAuth(controller);
  return state.kind === 'ready' ? (
    <PlayerCharacterRoutes
      controller={controller}
      staffReviewsEnabled={staffReviewsEnabled}
      reopeningEnabled={reopeningEnabled}
    />
  ) : (
    <PersonalSpacePage controller={controller} />
  );
}

function RouteEffects() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    const route = pathname.replace(/\/+$/, '').toLowerCase() || '/';
    let title = titles.get(route) ?? 'Page introuvable';
    if (/^\/account\/characters\/[^/]+$/.test(route))
      title = 'Fiche de personnage';
    if (/^\/account\/characters\/[^/]+\/edit$/.test(route))
      title = 'Modifier la fiche';
    if (route === '/account/characters/new') title = 'Créer un personnage';
    if (route === '/account/archives') title = 'Mes archives';
    if (route === '/account/reopening') title = 'Réouverture des archives';
    if (route.startsWith('/account/reopening/')) title = 'Examen de l’archive';
    if (route === '/account/staff') title = 'Fiches à examiner';
    if (/^\/account\/staff\/characters\/[^/]+$/.test(route))
      title = 'Examen de la fiche';
    if (route.startsWith('/preview/houses/')) title = 'House';
    if (route.startsWith('/preview/people/')) title = 'Profil';
    document.title = `${title} | Harvard University RP`;
    const moved =
      previousPath.current !== undefined && previousPath.current !== pathname;
    previousPath.current = pathname;

    if (hash) {
      const section = document.getElementById(hash.slice(1));
      section?.scrollIntoView?.();
      section?.focus({ preventScroll: true });
    } else if (moved) {
      window.scrollTo(0, 0);
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [pathname, hash]);

  return null;
}

export function App({
  auth = noAuth,
  charactersEnabled = false,
  staffReviewsEnabled = false,
  reopeningEnabled = false,
}: {
  auth?: AuthController;
  charactersEnabled?: boolean;
  staffReviewsEnabled?: boolean;
  reopeningEnabled?: boolean;
}) {
  const authEnabled = !['disabled', 'invalid-config'].includes(
    auth.getSnapshot().kind,
  );
  return (
    <ThemeProvider>
      <DemoProvider>
        <Suspense
          fallback={
            <main className="content-shell grid gap-4 py-12" aria-busy="true">
              <span className="sr-only" role="status">
                Chargement du campus
              </span>
              <Skeleton className="h-32" aria-hidden="true" />
              <Skeleton className="h-16 w-2/3" aria-hidden="true" />
            </main>
          }
        >
          <RouteEffects />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route element={<PublicLayout showDemoIndicator={!authEnabled} />}>
              <Route path="login" element={<LoginPage controller={auth} />} />
              <Route
                path="auth/callback"
                element={<AuthCallbackPage controller={auth} />}
              />
              <Route
                path={charactersEnabled ? 'account/*' : 'account'}
                element={
                  charactersEnabled ? (
                    <ProtectedAccount
                      controller={auth}
                      staffReviewsEnabled={staffReviewsEnabled}
                      reopeningEnabled={reopeningEnabled}
                    />
                  ) : (
                    <PersonalSpacePage controller={auth} />
                  )
                }
              />
            </Route>
            <Route path="preview/*" element={<CampusRoutes />} />
          </Routes>
        </Suspense>
      </DemoProvider>
      <Toaster />
    </ThemeProvider>
  );
}
