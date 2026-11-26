# Harvard University RP · Digital Campus

`hu-web` is the static web app for an independent Discord university roleplay community. It is unaffiliated with Harvard University.

## Getting started

Use Node.js 24 LTS (24.15.0 or later within the 24.x line) and pnpm 10.34.9. The `packageManager` field pins pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the Vite URL, normally `http://localhost:5173`.

| Route          | Page                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `/`            | Digital Campus introduction and links to the preview and sign-in information.                    |
| `/login`       | Future Discord sign-in information and an unavailable sign-in control.                           |
| `/preview`     | Public development preview of the campus layout with empty announcements, events and indicators. |
| Any other path | Application 404 with a link home.                                                                |

## Commands

| Command                             | Purpose                                        |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm dev`                          | Start the development server.                  |
| `pnpm build`                        | Write production assets to `dist/`.            |
| `pnpm preview`                      | Serve an existing production build locally.    |
| `pnpm test`                         | Run the automated test suite once.             |
| `pnpm test:watch`                   | Run tests in watch mode.                       |
| `pnpm lint` / `pnpm lint:fix`       | Check ESLint rules or apply available fixes.   |
| `pnpm format` / `pnpm format:check` | Write or check Prettier formatting.            |
| `pnpm typecheck`                    | Check TypeScript types without emitting files. |

## Optional API connection

Copy `.env.example` to `.env.local` to configure a local or approved `hu-api` origin. A blank URL enables standalone mode. Use HTTPS for shared environments and loopback HTTP for local development. The API status dialog in the campus footer checks `GET /health` only when the visitor selects **Check connection** and configuration is valid.

| Variable              | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | Optional API base URL with a host and optional path prefix.                |
| `VITE_API_TIMEOUT_MS` | Optional request timeout from 1 to 120,000 milliseconds. Default is 5,000. |

Vite exposes these variables in the browser bundle at build time. Treat them as public configuration. The API must allow the web origin through CORS and expose `X-Request-Id` for the browser to read it.

## Static hosting

Cloudflare Pages can build this app with `pnpm build` and serve `dist/`. Keep `index.html` at the output root. Pages serves that entry point for direct SPA routes when the output has no top-level `404.html`. React Router renders the application 404. Use the Node.js 24 toolchain for a future deployment.

See [architecture](docs/ARCHITECTURE.md), [design system](docs/DESIGN_SYSTEM.md), [decisions](docs/DECISIONS.md) and [roadmap](docs/ROADMAP.md).
