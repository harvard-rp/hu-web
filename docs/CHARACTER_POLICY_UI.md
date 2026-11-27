# Hybrid character sheets and reopening

HU-009F-C matches [hu-api at ed757be](https://github.com/harvard-rp/hu-api/tree/ed757be87633227c3452dfa8f75d4301e62d3fd8). Its [policy](https://github.com/harvard-rp/hu-api/blob/ed757be87633227c3452dfa8f75d4301e62d3fd8/docs/CHARACTER_POLICY.md) and [reopening contract](https://github.com/harvard-rp/hu-api/blob/ed757be87633227c3452dfa8f75d4301e62d3fd8/docs/CHARACTER_REOPENING.md) govern transitions.

## Player and staff workflows

- Drafts default to inline. Players can choose external mode at creation or later. Incomplete drafts remain writable. Submission uses structured requirements and PostgreSQL's explicit nonblank-line rules, including its exact whitespace set and CR/CRLF normalization. The backend validates again on submission.
- External URLs use the pinned HTTPS allowlist, with exact hosts, paths and percent escapes. Users open them manually with no opener or referrer. Saving a switch to inline removes the stored external URL and preserves the narratives.
- The first two refusals remain editable. Corrections do not advance the refusal count. The third refusal archives the character and releases a slot. Reopening preserves ID, refusal count, history and suspension. The next refusal archives the character again.
- Reviewers can assign an active House only during student approval. Omitting the selection retains historical attribution. External decisions require explicit attestation. An inaccessible source currently blocks all three decisions because the API requires attestation for each. Handling this case requires a backend policy decision.
- `/account/archives` lists only the owner's archives. The existing owned detail shows the archived sheet and reviews. With reopening enabled, it also shows the request timeline and, when allowed, the reason form. A request never reserves a slot. The UUID of a logical submission is held in memory while reconciling an uncertain outcome.
- `/account/reopening` and `/account/reopening/:characterId` use the dedicated staff archive and request endpoints. Resolution requires justification and confirmation. A capacity conflict leaves the request pending. Staff can no longer read an accepted request's archived sheet once it returns to draft.

Mutations use a confirmed revision and never update the UI optimistically. On an uncertain outcome or conflict, staff and owners check current detail and timeline before retry. A stale revision requires an explicit reload. Provider links, reasons and sheet data are kept out of logs and browser persistence.

## Activation and compatibility

| Build flag                         | Controls                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_CHARACTER_LIFECYCLE_ENABLED` | Player management and read-only archives.                                                                                           |
| `VITE_STAFF_REVIEWS_ENABLED`       | Staff reviews, with lifecycle enabled and the `characters.review` grant.                                                            |
| `VITE_CHARACTER_REOPENING_ENABLED` | Owner requests and staff reopening routes. Requires lifecycle. Staff requires `characters.reopen` independently of ordinary review. |

All flags default to false. GitHub Pages forces them off. The preview remains synthetic. With lifecycle off, HU-007B personal space works with either context version. The old API returns character and review payloads lacking required fields. The previous enabled frontend also rejects the newer fields. Keep the real interfaces disabled during the coordinated upgrade.

After authorized rehearsal and rollout of both policy migrations and the pinned API, verify the character, review and reopening contracts and CORS. Use separate synthetic owner, review and reopening accounts. Effective grants refresh on token rotation. A backend denial cancels the affected scope and refreshes the account without disabling the sibling capability. Reload after server-side access is restored.

## Local validation

Run frozen installation, formatting, lint, type checks, tests and both builds. Frontend tests use simulated Auth and REST responses. For integration use a disposable stack following the [backend validation procedure](https://github.com/harvard-rp/hu-api/blob/ed757be87633227c3452dfa8f75d4301e62d3fd8/docs/CHARACTER_POLICY_VALIDATION.md). Verify lifetime refusals, slot contention, separate grants and actual provider ACLs with synthetic users and documents.
