# Architecture

`hu-web` is a static SPA. Vite builds `index.html` and hashed assets. React Router uses browser history in the normal build and hash history under `/hu-web/` in GitHub Pages mode. The public pages share the HU-006 public layout. Campus subroutes load as one lazy route group and share the existing responsive campus layout.

| Directory              | Responsibility                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| `src/app/`             | Router, document titles, route focus and providers.                     |
| `src/assets/`          | Optimized local artwork.                                                |
| `src/components/`      | Existing shadcn/ui primitives, shared identities and layouts.           |
| `src/features/demo/`   | Fictional catalogue, initial records, session state and shared demo UI. |
| `src/features/campus/` | Campus navigation and section search.                                   |
| `src/features/theme/`  | Browser theme preferences.                                              |
| `src/lib/services/`    | HU-006 API configuration, fetch transport and health contract.          |
| `src/routes/`          | Public pages and campus modules.                                        |
| `src/styles/`          | Semantic tokens, global styles and page styles.                         |
| `tests/`               | React Testing Library and simulated HTTP coverage.                      |

The local demo state holds posts, comments, reactions, event participation and a staff review queue. Refresh or reset restores the fixtures. The form accepts fictional student and non-student dossiers. House assignment is an explicit staff simulation. Ranking values are fixed fixtures, and staff review updates only the demo queue.

The HTTP client remains available for later integration. Demo state has no production transport and the campus footer shows standalone status. Theme persistence uses its own browser storage key.

Cloudflare Pages' [SPA fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering) covers direct normal paths. GitHub Pages receives the project root path for a direct hash URL and serves `index.html` there. The application catch-all handles unknown routes.
