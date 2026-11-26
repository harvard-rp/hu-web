# Design system

## Color and typography

| Reference             | Color     | Purpose                                                            |
| --------------------- | --------- | ------------------------------------------------------------------ |
| Crimson               | `#A51C30` | Original RP mark, strong emphasis and light theme primary actions. |
| Light background      | `#F5F5F5` | Page surfaces around the workspace.                                |
| Light surface         | `#FFFFFF` | Header, sidebar, lists and cards.                                  |
| Dark background       | `#111113` | Page surfaces around the workspace.                                |
| Dark surface          | `#1B1B1F` | Header, sidebar, lists and cards.                                  |
| Dark elevated surface | `#242428` | Menus, table heads, hover and secondary surfaces.                  |
| Dark muted text       | `#B3B3B8` | Supporting labels and metadata.                                    |

`src/styles/tokens.css` pairs foregrounds, actions and focus colors with light and dark surfaces. Keep quiet borders separate from form and focus boundaries. Use Crimson selectively for identity and selected states. Preserve the contrast of status text and input boundaries.

Instrument Sans is the interface family. Newsreader is used for the public institutional title and monograms. The Latin WOFF2 files are served from the Fontsource packages under the SIL Open Font License.

## Layouts and components

The public layout pairs a single campus photograph with direct campus and sign-in links. The campus workspace uses a compact grouped sidebar, sticky header, active character menu and a modal drawer at mobile widths. The header shows breadcrumbs on nested campus routes and retains a permanent demo indicator. API status and reset are in the campus footer.

Tables preserve data relationships in the ranking. House catalogues use original monograms. Club and member directories use rows, the agenda is an ordered list, and the social feed uses dedicated post and composer layouts. The staff queue uses distinct management rows and a review dialog. Styles share surface and form tokens and use separate content widths for the main modules.

Shadcn/ui and Radix provide buttons, dialogs, dropdowns, inputs, alerts, toasts and loading states. Preserve named landmarks, label associations, visible keyboard focus, reduced motion and status announcements. The appearance picker supports light, dark and system preferences with local persistence. [The upstream shadcn/ui notice](SHADCN_NOTICE.txt) applies to the adapted primitives.
