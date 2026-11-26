import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import { PublicLayout } from '@/components/layout/public-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/features/theme/theme-provider';
import { HomePage } from '@/routes/home-page';
import { LoginPage } from '@/routes/login-page';
import { NotFoundPage } from '@/routes/not-found-page';

const CampusLayout = lazy(() =>
  import('@/components/layout/campus-layout').then(({ CampusLayout }) => ({
    default: CampusLayout,
  })),
);
const PreviewPage = lazy(() =>
  import('@/routes/preview-page').then(({ PreviewPage }) => ({
    default: PreviewPage,
  })),
);

const titles: Record<string, string> = {
  '/': 'Digital Campus',
  '/login': 'Sign in',
  '/preview': 'Campus preview',
};

function RouteEffects() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    const route = pathname.replace(/\/+$/, '').toLowerCase() || '/';
    document.title = `${titles[route] ?? 'Page not found'} | Harvard University RP`;
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
      <Suspense
        fallback={
          <main className="content-shell grid gap-4 py-12" aria-busy="true">
            <span className="sr-only" role="status">
              Loading campus preview
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
          <Route element={<CampusLayout />}>
            <Route path="preview" element={<PreviewPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </ThemeProvider>
  );
}
