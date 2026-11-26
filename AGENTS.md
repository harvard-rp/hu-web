# Development instructions

- Keep changes within the current mission and this repository. Use English for source and technical documentation. Use French for the public demo interface, retaining relevant institutional names.
- Use Node.js 24 LTS, the pinned pnpm version, strict TypeScript, React, Vite, React Router, Tailwind CSS, shadcn/ui, Lucide, Zod, Vitest, React Testing Library, ESLint, Prettier and GitHub Actions.
- Keep both static build targets working. The GitHub Pages build uses hash routing and the normal build uses browser history.
- Keep routed pages in `src/routes`, shared layouts and primitives in `src/components`, and campus and theme behavior in `src/features`. Use the local design tokens for semantic styles.
- Preserve named landmarks, keyboard navigation, visible focus, accessible names, contrast and reduced-motion behavior. Check narrow and wide layouts after changing the interface.
- Keep the public demo visibly labeled and its fixtures and actions separate from production services. Represent unavailable capabilities with explicit status or disabled controls. Use independent branding and the affiliation disclaimer.
- Keep network access in `src/lib/services`. Use public environment values, mocked transport in tests and safe error messages. Keep real credentials and personal data out of Git.
- Run `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm build:pages` before submission.
- Set the repository-local author and committer identity supplied by the owner. Verify both before publication. Omit automatic co-author trailers. Obtain authorization before rewriting history.
