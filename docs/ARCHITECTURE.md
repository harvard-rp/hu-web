# Architecture

`hu-web` is a browser-only SPA. Vite builds `index.html` and hashed assets. React Router maps the entry point to the public layout, the campus layout or the application 404. The preview chunks load on demand. A suspense fallback provides a loading state while the preview is loading.

| Directory                | Responsibility                                                 |
| ------------------------ | -------------------------------------------------------------- |
| `src/app/`               | Route composition, document titles, route focus and providers. |
| `src/assets/`            | Optimized local imagery.                                       |
| `src/components/common/` | Shared identity and affiliation information.                   |
| `src/components/layout/` | Public shell and responsive campus shell.                      |
| `src/components/ui/`     | Adapted shadcn/ui primitives.                                  |
| `src/features/`          | Preview navigation and status, and user theme preferences.     |
| `src/lib/services/`      | Environment validation, HTTP transport and health contract.    |
| `src/routes/`            | Page-level content and composition.                            |
| `src/styles/`            | Tokens, global rules and page styles.                          |
| `tests/`                 | React Testing Library and simulated HTTP coverage.             |

The campus sidebar, mobile dialog and section search show the available preview routes or in-page destinations. Future modules are explicitly unavailable. The guest menu links to sign-in information. The layout works independently of API configuration.

The HTTP client takes injected fetch for testing. It validates the `hu-api` health response with Zod, sets a deadline, supports caller cancellation, and normalizes configuration, transport, HTTP and response errors. It extracts an optional `X-Request-Id` for troubleshooting. In the browser, an explicit user action starts the check.

The static output relies on Cloudflare Pages' [SPA fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering). The React Router catch-all is rendered from the same HTML entry as the other routes.
