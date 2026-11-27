# Authenticated player characters

This document records the original workflow. For the current HU-009F-C contracts, transitions and rollout, see [CHARACTER_POLICY_UI.md](CHARACTER_POLICY_UI.md).

HU-009C implements the player-owned workflow against [hu-api at d1685e88](https://github.com/harvard-rp/hu-api/tree/d1685e88eb0dba43215f2e52015352c006f3bbb7). The source of truth is the backend's [character contract](https://github.com/harvard-rp/hu-api/blob/d1685e88eb0dba43215f2e52015352c006f3bbb7/docs/CHARACTERS.md), [owner review contract](https://github.com/harvard-rp/hu-api/blob/d1685e88eb0dba43215f2e52015352c006f3bbb7/docs/CHARACTER_REVIEWS.md) and OpenAPI document. The feature uses the existing Discord and Supabase Auth session and the Hono API. The independent `/preview` routes retain their synthetic catalogue and state.

## Routes

| Route                                   | Purpose                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/account`                              | Owned character identities, validation and use status, capacity, and the active club catalogue. |
| `/account/characters/new`               | Select a fixed kind and create an empty draft.                                                  |
| `/account/characters/:characterId`      | Read the sheet, submit if eligible, and view player-facing staff decisions.                     |
| `/account/characters/:characterId/edit` | Edit a draft or correction and save against its revision.                                       |

All four routes wait for an authenticated player context. The API enforces ownership, writes and permissions. Validation and use states remain independent. Read-only views cover submitted, approved and rejected sheets. An assigned House is read-only and resolved through the active catalogue. RP links, face claims and review comments are plain text. The club catalogue exposes no membership action.

## API operations

| Method and path                                | Request and result                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/characters`                       | Owned summaries, including validation, use and revision.                                                                                                  |
| `GET /api/v1/characters/capacity`              | Effective total, used and available from the server. The displayed boost allowance is total minus the five base slots.                                    |
| `GET /api/v1/characters/{characterId}`         | Owned sheet and its current revision.                                                                                                                     |
| `POST /api/v1/characters`                      | Kind only. Receives the persisted draft. One request runs per confirmation. An ambiguous write result asks the player to verify the list before retrying. |
| `PATCH /api/v1/characters/{characterId}`       | Current `expectedRevision` and changed editable fields. Use null to clear a field. The returned sheet replaces the local baseline.                        |
| `POST /api/v1/characters/{characterId}/submit` | Only `expectedRevision`. Applies the returned state or reloads the sheet from the API.                                                                    |
| `GET /api/v1/characters/{characterId}/reviews` | Ordered player-facing decision, timestamp, comment and optional House.                                                                                    |
| `GET /api/v1/catalogs/houses`                  | Active Houses, used to display assignments.                                                                                                               |
| `GET /api/v1/catalogs/programs`                | Active programs for student and teacher sheets. Students need an active program on submission.                                                            |
| `GET /api/v1/catalogs/clubs`                   | Active clubs and any communicated cap. This catalogue is read-only.                                                                                       |

Zod verifies each response against the pinned contract. The authenticated transport permits only the configured origin, rejects redirects, applies a timeout and supports abort signals. The Auth controller applies the newest access token at request time without exposing it as UI state. It aborts character requests and detaches the account view on logout or account change. After a confirmed write it refreshes `GET /api/v1/me`, keeping any confirmed success visible if that secondary read fails. A current-session 401 clears the account and returns to login.

A revision conflict keeps the local form values. The player can read the current server version and explicitly choose to replace the local form. Browser reload and in-app navigation have separate unsaved-change guards. Saving a draft and submitting a sheet are separate actions. Only saved values can be submitted. The form reflects the backend submission matrix and codepoint and JSON byte limits. Validation remains authoritative on the API. The app retains supported error codes and request IDs for diagnostics and uses fixed French messages instead of server text.

## Controlled activation

Set `VITE_CHARACTER_LIFECYCLE_ENABLED=true` in the standard authenticated frontend build **after** the backend rollout and migrations have been approved and verified. Review the API origin, `Authorization` preflight and CORS support for both POST and PATCH. Build and test first against a development origin that uses the deployed character contracts.

The default is false. It keeps the HU-007B personal space active and omits the character routes. The GitHub Pages mode forces the flag and authentication off, even if build inputs request otherwise. This flag controls UI availability. The API and its database policies enforce access.

## Local validation

Start the pinned backend and local Supabase in a Docker-enabled workspace using the backend's documented commands. Configure the frontend's ignored `.env.local` for its localhost Auth and API origins, publishable key and lifecycle flag. Apply only the local migrations. Use independent synthetic player and staff identities to verify creation, editing, submission, a correction decision and resubmission. Also check that another player cannot open the owner's direct detail URL. Follow the existing [local authentication procedure](AUTHENTICATION.md) for an approved development sign-in.

The frontend tests exercise the protected routes, the wire format and error handling with simulated Auth and API responses. Browser validation uses a configured local frontend and simulated services to verify layout and interaction in both themes. Database-backed integration requires a local or explicitly authorized environment with the new migrations.
