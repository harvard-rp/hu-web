# Development instructions

- Keep changes within the current mission and this repository. Use English for source, UI copy and technical documentation.
- Use Node.js 24 LTS, the pinned pnpm version, strict TypeScript, React, Vite, React Router, Tailwind CSS, shadcn/ui, Lucide, Zod, Vitest, React Testing Library, ESLint, Prettier and GitHub Actions.
- Keep the app compatible with static Cloudflare Pages hosting and keep React Router responsible for client navigation.
- Keep routed pages in `src/routes`, shared layouts and primitives in `src/components`, and campus and theme behavior in `src/features`. Use the local design tokens for semantic styles.
- Preserve named landmarks, keyboard navigation, visible focus, accessible names, contrast and reduced-motion behavior. Check narrow and wide layouts after changing the interface.
- Represent unavailable features as read-only labels or disabled controls. Keep preview content explicitly fictional or empty. Use independent branding and the affiliation disclaimer.
- Keep network access in `src/lib/services`. Use public environment values, mocked transport in tests and safe error messages. Keep real credentials and personal data out of Git.
- Run `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` before submission.
- Set the repository-local author and committer identity supplied by the owner. Verify both before publication. Omit automatic co-author trailers. Obtain authorization before rewriting history.
