# Discord sign-in and personal space

The browser uses `@supabase/supabase-js@2.119.2`, matching `hu-api`. The SDK is loaded on demand when the standard build has a valid Auth origin, publishable key and API configuration. The GitHub Pages build always disables Auth and omits its configuration values. The public `/preview` demo uses only in-memory fixtures. Auth sessions and player data belong to the separate login, callback and personal-space routes.

## Public build settings

| Variable                        | Purpose                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project or local gateway origin. Use HTTPS or an explicit HTTP loopback origin. Paths, embedded credentials, queries and fragments are rejected. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase `sb_publishable_…` key. Admin, secret and legacy JWT keys are rejected before the value reaches the browser build.                               |
| `VITE_API_BASE_URL`             | Existing API base URL, loaded by the same configuration as the health client. Use HTTPS or an explicit HTTP loopback origin.                              |
| `VITE_API_TIMEOUT_MS`           | Existing request timeout, 5000 ms by default.                                                                                                             |

Vite includes only a validated Supabase configuration. Any variable embedded in the frontend is public. The OAuth client secret belongs only to the Supabase Auth server. Bot credentials, service-role keys and administrator keys must stay outside `hu-web`.

## OAuth and redirects

1. The Discord button calls Supabase `signInWithOAuth({ provider: 'discord' })` with the PKCE flow, an exact callback URL and no additional scopes. The SDK generates and stores the verifier. The app navigates to the SDK's authorization URL on the configured Supabase origin.
2. Supabase redirects to the app with a one-time authorization code in the **document query**. A refusal can return error fields in a query or error fragment. The app consumes those only to choose a fixed error message.
3. Before React Router mounts, the app replaces the callback's history entry with a clean internal route and drops the other parameters. It uses no caller-supplied return URL. It invokes `exchangeCodeForSession` once per callback, including under StrictMode. The callback goes to `/account` for a session and to `/login` on a sign-in failure. A failed exchange requires a new OAuth attempt.
4. The account bootstrap call uses the Supabase access token. The UI renders only the validated player response. Reloads use `GET /api/v1/me`. If that endpoint returns the documented `403 PLAYER_LINK_REQUIRED`, the client can retry the idempotent bootstrap.

| Hosting mode          | Exact app callback to allow in Supabase                                                                                                                         | Personal space                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Standard local        | `http://localhost:5173/auth/callback`                                                                                                                           | `http://localhost:5173/account`                               |
| Future standard HTTPS | `https://<approved-web-host>/auth/callback`                                                                                                                     | `https://<approved-web-host>/account`                         |
| GitHub Pages demo     | `https://harvard-rp.github.io/hu-web/` is the compatible entry document if Auth is ever enabled in a separate build. Keep it unregistered for the current demo. | `/hu-web/#/account` redirects to the disabled sign-in screen. |

The normal static host must serve the SPA entry document for direct `/auth/callback` and `/account` requests. The compatible HashRouter callback reads a URL such as `/hu-web/?code=…` and replaces it with `/hu-web/#/auth/callback`. It never exchanges a code found in a HashRouter route fragment.

For a future approved enablement, register the **Supabase** callback URI in the Discord application's OAuth settings. Use the URL shown by the Supabase Discord provider configuration, usually `https://<project-ref>.supabase.co/auth/v1/callback`. Enable the provider in Supabase, enter the Discord application client ID and secret there, and allow only the exact frontend callback for the environment. Set the Supabase Site URL to the matching web origin. No bot permissions or extra Discord scopes are needed. Configure the backend's CORS allowlist for the exact web origin and allow the `Authorization` header for the player routes.

## Sessions and API behavior

The SDK is responsible for reading the session, retaining the PKCE verifier across the redirect, refreshing the session and signing out locally. A project-scoped storage adapter uses browser `localStorage` and strips Discord `provider_token` and `provider_refresh_token` from session reads and writes. The access and refresh tokens for **Supabase Auth** remain available to JavaScript and are exposed to same-origin XSS. This storage has none of the JavaScript isolation of an HttpOnly cookie. Restrict trusted scripts, serve the site over HTTPS and reassess storage and deployment security before production activation.

The app keeps the player context in memory. A change of account or sign-out clears the previous context and aborts requests. Stale results cannot repopulate the previous account. Token refresh updates the bearer for later requests. The pinned SDK removes the browser session when signing out this browser, then attempts to revoke the refresh token. Issued access tokens may remain valid until their server-side expiry.

`POST /api/v1/auth/bootstrap` sends the Supabase bearer and an empty request body. The backend establishes the Discord identity and creates or retrieves a player. `GET /api/v1/me` uses the same bearer and response schema. The client accepts only the documented player ID, capabilities, character IDs and status fields, and campus eligibility. It sends no Discord identity or chosen player ID, and never infers access from character type. Both requests use the configured origin, reject HTTP redirects and disable browser caching. No access token or provider token is added to navigation, error output or application logs.

| Condition                                  | Experience                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `401`                                      | Discard the context, close the local session and show the sign-in screen.     |
| `403`                                      | Ask for a linked Discord identity after the bootstrap attempt, if applicable. |
| `409`                                      | Show the linking conflict and keep the session available for sign-out.        |
| `503`, unreachable API or invalid response | Keep the session, show an availability error and offer retry.                 |

The account page shows only the number of characters, validation, use status and campus eligibility from the API. Character creation, named profiles and the actual community features remain unavailable.

## Local integration procedure

The repository tests use mock OAuth and transport. They exercise the real pinned SDK's PKCE URL generation, the filtered storage adapter and browser routing. A maintainer can validate the full stack separately when HU-007A is available:

1. Use a local checkout of `hu-api` with HU-007A. Run `pnpm install --frozen-lockfile` and `pnpm supabase:start` with Docker. Use the gateway URL and local publishable key. Keep the local emulator credentials private.
2. In the local Supabase Auth configuration enable the Discord provider for a dedicated integration OAuth app after explicit approval. Keep its test secret in the Auth server's environment. Add `http://localhost:5173/auth/callback` to `auth.additional_redirect_urls`. Register the local Supabase gateway's `/auth/v1/callback` in the Discord OAuth app if the provider configuration accepts that development URI. If it does not, use an already approved HTTPS test origin whose gateway callback is registered.
3. Configure the API's local bindings for the same gateway and permit the exact Vite origin in its CORS configuration, then run `pnpm dev` in `hu-api`. In `hu-web`, set the public variables in an ignored `.env.local` and run `pnpm dev`. Use the same loopback host for the frontend throughout the redirect.
4. Using approved test identities only, check consent and refusal, verify that the app removes the callback query from browser history, confirm an empty-body bootstrap and a later `GET /api/v1/me`, and test expiry, offline retry and sign-out. Compare the server-side player record after reconnecting to verify idempotency. Confirm that `/preview` remains usable with Auth variables absent.

References: [Supabase JS 2.119.2 release](https://github.com/supabase/supabase-js/releases/tag/v2.119.2), [Discord provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-discord), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [redirect allowlist](https://supabase.com/docs/guides/auth/redirect-urls), [sign-out](https://supabase.com/docs/reference/javascript/auth-signout) and [local CLI settings](https://supabase.com/docs/guides/local-development/cli/config).
