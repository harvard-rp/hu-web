import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { PublicLayout } from '@/components/layout/public-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { campusDestinations } from '@/features/campus/campus-navigation';
import { DemoProvider } from '@/features/demo/demo-state';
import { ThemeProvider } from '@/features/theme/theme-provider';
import { HomePage } from '@/routes/home-page';
import { LoginPage } from '@/routes/login-page';
import { NotFoundPage } from '@/routes/not-found-page';

const CampusRoutes = lazy(() => import('./campus-routes'));

const titles = new Map([
  ['/', 'Digital Campus'],
  ['/login', 'Connexion'],
  ...campusDestinations.map(({ path, label }): [string, string] => [
    path,
    label,
  ]),
]);

function RouteEffects() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    const route = pathname.replace(/\/+$/, '').toLowerCase() || '/';
    let title = titles.get(route) ?? 'Page introuvable';
    if (route.startsWith('/preview/houses/')) title = 'House';
    if (route.startsWith('/preview/people/')) title = 'Profil RP';
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

export function App() {
  return (
    <ThemeProvider>
      <DemoProvider>
        <Suspense
          fallback={
            <main className="content-shell grid gap-4 py-12" aria-busy="true">
              <span className="sr-only" role="status">
                Chargement de la démonstration
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
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="preview/*" element={<CampusRoutes />} />
          </Routes>
        </Suspense>
        <Toaster />
      </DemoProvider>
    </ThemeProvider>
  );
}
