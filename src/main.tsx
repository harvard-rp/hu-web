import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App auth={auth} />
    </Router>
  </StrictMode>,
);
