# Technical decisions

## HU-006 · Static browser application

Use Vite 8, React 19 and React Router 8 in declarative SPA mode. Cloudflare Pages serves the static build and React Router handles deep links with a client-side 404. Keep the campus preview in separate lazy chunks so public entry points can load independently.

## HU-006 · Local design system

Adapt the shadcn/ui registry primitives with Radix interactions, Tailwind CSS 4 and CSS semantic tokens. Resolve the system theme in the browser and persist the appearance choice locally. Host the two Fontsource typefaces and the fictional campus illustration with the built application.

## HU-006 · Optional network integration

Parse the public build-time API configuration once and centralize the request flow in the service layer. Keep regular navigation independent of network state. The health check is an explicit user action and uses an injected transport in tests.

## HU-006 · Reproducible verification

Pin runtime packages, development packages and pnpm. TypeScript 6.0 is within the supported range of the pinned TypeScript ESLint tooling. GitHub Actions checks formatting, lint, types, tests and the static build with repository contents read permission.

## HU-006A · In-memory public demo

Keep the public prototype in the existing SPA and reuse its primitive components and palette. Store sample actions in memory for the browser tab. Refresh and explicit reset restore the fixtures. The static catalogues mark unconfirmed or fictional entries and the staff queue models review steps without permission or persistence rules.

## HU-006A · Temporary project Pages build

Use a specific Vite mode with base `/hu-web/` and a HashRouter so direct Pages share links work on a plain static host. The regular build keeps browser history routing. Push and manual Pages deployments are restricted to `main`. Job permissions separate source reads from artifact deployment. The CI job runs both build variants for review branches.

## HU-006B · UI hierarchy and fixture provenance

Keep the existing routes, in-memory interactions and static build modes. Use a neutral Instrument Sans workspace with a compact navigation shell and module-specific document structures. Put technical status in the footer. Keep the home photograph outside the campus dashboard.

Use licensed local photography with attribution and original House monograms. Preserve known RP facts and visually separate sample club records from the incomplete server catalogue. Unknown House profiles show an explicit missing-data state. The [demo source register](DEMO_SOURCES.md) records the references and rights.

## HU-006C · Server catalogues and character context

Use the RP summaries, majors and confirmed club roster from the owner-provided brief. Preserve unresolved club entries and leadership labels, original House monograms, and the original worksheet credit in the [source register](DEMO_SOURCES.md).

Derive active profiles, display permissions, ranking, and capacity from tab-local records. Keep staff simulation independent of character type, and require staff House assignment before student validation. Let the account show and correct filings before activation. Treat slot accounting, access to read-only catalogues and student-only academic fields as demonstration choices while production rules are defined. Reputation categories remain descriptive and carry no scoring formula.
