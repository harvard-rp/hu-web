# Harvard University RP · Digital Campus

`hu-web` is the static frontend for an independent Discord roleplay community. The Digital Campus is a public, French-language prototype with fictional people and activity. It is unaffiliated with Harvard University.

## Local development

Use Node.js 24 LTS (24.15.0 or later within the 24.x line) and the pinned pnpm 10.34.9.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the Vite URL, normally `http://localhost:5173`. The prototype lives under `/preview`. It includes student and staff views, university catalogues, character creation, a directory, ranking, social feed, relationships and an agenda. The sign-in screen is available at `/login`.

Open **Mes personnages** to switch to a validated character, check the five base slots and boost bonuses, or track a fiche. **Espace staff** is a separate HRP simulation for reviewing fiches, assigning Houses to students and changing the confirmed boost count. The campus ranking is student-only.

Demo actions live in the current tab's memory. Use **Réinitialiser la démo** in the campus footer to discard them and restore the sample data. Reloading the page also restores the sample data. Theme preference is stored independently in the browser. Enter fictional content only.

| Command                             | Purpose                                                           |
| ----------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                          | Start the development server.                                     |
| `pnpm build`                        | Write the normal SPA build to `dist/`.                            |
| `pnpm build:pages`                  | Write the GitHub Pages build to `dist/` with the `/hu-web/` base. |
| `pnpm preview`                      | Preview the most recent build locally.                            |
| `pnpm test` / `pnpm test:watch`     | Run tests once or in watch mode.                                  |
| `pnpm lint` / `pnpm lint:fix`       | Check ESLint rules or apply available fixes.                      |
| `pnpm format` / `pnpm format:check` | Write or check Prettier formatting.                               |
| `pnpm typecheck`                    | Check TypeScript types without emitting files.                    |

## Static hosting

The normal build keeps browser history routing for local development and Cloudflare Pages. Cloudflare Pages can serve direct SPA paths from `index.html` without a top-level `404.html`.

The temporary GitHub Pages build uses hash routing. To preview it, run `pnpm build:pages` then `pnpm preview --base /hu-web/`. Open `/hu-web/#/preview` under the preview server's origin. Shared Pages links should include `/hu-web/#/` before the route.

After the architect approves the pull request, enable **GitHub Actions** as the source in the repository's **Settings → Pages**. The Pages workflow builds and checks both build modes and publishes the Pages artifact on pushes to `main`. It can also be run manually from `main`. Confirm the deployment and the shared URLs in the Actions run before distributing them to staff.

## Authentication and API

The standard build can be configured for Discord sign-in through Supabase Auth and a minimal player space at `/account`. It requires a Supabase origin, a publishable key, and a compatible API with player bootstrap and context endpoints. With the example environment defaults, sign-in is unavailable and the demo works without a backend. The public GitHub Pages build always disables Auth.

Read [authentication](docs/AUTHENTICATION.md) for setup, callback URLs, session behavior and the local integration procedure. Never place OAuth or administrative secrets in Vite environment variables.

See [architecture](docs/ARCHITECTURE.md), [design system](docs/DESIGN_SYSTEM.md), [visual and catalogue sources](docs/DEMO_SOURCES.md), [decisions](docs/DECISIONS.md) and [roadmap](docs/ROADMAP.md).
