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

The local demo state holds a fictional account, review records, an optional active character, confirmed boost count, posts and comments. Reactions and event participation are keyed by character. Public profiles are derived from the accepted records and the seeded campus directory. Refresh or reset restores the fixtures.

The demo has five base slots and one additional slot per confirmed boost. Pending, correction, accepted and suspended records count toward capacity here. Rejected records remain readable and release a slot. Boost changes update capacity without altering existing records or the active selection. An account with excess records cannot add new ones and can still resubmit an existing correction. These counting choices model demo behavior while final rules remain open.

Course and club fields are presented for student fiches in the demo. A student requires a House assigned in the staff simulation before acceptance. Ranking includes accepted students and the seeded student directory. Other validated characters retain community access. Campus navigation, search and direct routes derive their presentation from the active character. Account tracking and HRP staff simulation remain available without an active character. This public simulation has no authorization boundary.

The separate authenticated space uses the browser Supabase Auth adapter and the HTTP client for player bootstrap and context. The Auth controller initializes on the sign-in, callback and personal-space routes. It exposes state without credentials and discards stale account responses. The demo store receives no session, calls no production transport, and continues to display standalone status. Theme persistence uses its own browser storage key. See [Authentication](AUTHENTICATION.md) for callback handling and trust boundaries.

The gated account domain adds owned character routes and loads them on demand. It holds sheet values in component state, uses a session-scoped abort signal for authenticated requests and preserves user changes on revision conflicts. The enabled standard build uses a browser data router for SPA navigation blocking. The default build and static demo preserve their existing routing behavior. See [Player characters](PLAYER_CHARACTERS.md).

Cloudflare Pages' [SPA fallback](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering) covers direct normal paths. GitHub Pages receives the project root path for a direct hash URL and serves `index.html` there. The application catch-all handles unknown routes.

The authenticated staff review domain uses the same HTTP client and a capability-specific cancellation scope. It shares the player sheet reader and keeps the synthetic staff prototype independent. See [STAFF_REVIEWS.md](STAFF_REVIEWS.md).

See [hybrid character sheets and reopening](CHARACTER_POLICY_UI.md) for HU-009F-C and its coordinated rollout.
