# Technical decisions

## HU-006 · Static browser application

Use Vite 8, React 19 and React Router 8 in declarative SPA mode. Cloudflare Pages serves the static build and React Router handles deep links with a client-side 404. Keep the campus preview in separate lazy chunks so public entry points can load independently.

## HU-006 · Local design system

Adapt the shadcn/ui registry primitives with Radix interactions, Tailwind CSS 4 and CSS semantic tokens. Resolve the system theme in the browser and persist the appearance choice locally. Host the two Fontsource typefaces and the fictional campus illustration with the built application.

## HU-006 · Optional network integration

Parse the public build-time API configuration once and centralize the request flow in the service layer. Keep regular navigation independent of network state. The health check is an explicit user action and uses an injected transport in tests.

## HU-006 · Reproducible verification

Pin runtime packages, development packages and pnpm. TypeScript 6.0 is within the supported range of the pinned TypeScript ESLint tooling. GitHub Actions checks formatting, lint, types, tests and the static build with repository contents read permission.
