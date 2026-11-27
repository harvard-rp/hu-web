import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  HashRouter,
  RouterProvider,
  createBrowserRouter,
} from 'react-router';

import { App } from '@/app/app';
import { prepareBrowserAuth } from '@/features/auth/bootstrap';
import '@/styles/index.css';

const hashRouting = import.meta.env.MODE === 'github-pages';
const Router = hashRouting ? HashRouter : BrowserRouter;
const auth = await prepareBrowserAuth(
  window,
  hashRouting,
  import.meta.env.BASE_URL,
);

declare const __HU_CHARACTER_LIFECYCLE__: boolean;
declare const __HU_STAFF_REVIEWS__: boolean;
const charactersEnabled = !hashRouting && __HU_CHARACTER_LIFECYCLE__;
const app = (
  <App
    auth={auth}
    charactersEnabled={charactersEnabled}
    staffReviewsEnabled={charactersEnabled && __HU_STAFF_REVIEWS__}
  />
);
const characterRouter = charactersEnabled
  ? createBrowserRouter([{ path: '*', element: app }])
  : undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {characterRouter ? (
      <RouterProvider router={characterRouter} />
    ) : (
      <Router>{app}</Router>
    )}
  </StrictMode>,
);
