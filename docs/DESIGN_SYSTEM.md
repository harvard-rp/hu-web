# Design system

The Digital Campus uses a restrained editorial layout inspired by university publishing. The brand uses an original text treatment and a Lucide landmark glyph. The campus image is generated artwork depicting a fictional location.

## Color and typography

| Reference  | Color     | Purpose                                      |
| ---------- | --------- | -------------------------------------------- |
| Crimson    | `#A51C30` | Brand mark and public header rule.           |
| Bordeaux   | `#581321` | Campus preview masthead.                     |
| Ivory      | `#F5F1E8` | Light paper surfaces.                        |
| Gold       | `#B39A68` | Brand reference for warm decorative accents. |
| Anthracite | `#19191D` | Light foreground.                            |

`src/styles/tokens.css` defines paired light and dark values for surfaces, foreground, muted text, input boundaries, action colors, status feedback and focus. Use a semantic foreground with its paired background. Use the warm rule for decorative borders. Controls use the input and focus colors to remain distinguishable from adjacent surfaces.

Newsreader is the editorial serif and Instrument Sans is the interface sans-serif. The Latin WOFF2 assets are served locally from their Fontsource packages under their respective SIL Open Font Licenses. Use real heading levels and allow text to wrap at narrow widths.

## Primitives and states

| Primitive              | Usage                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| Button and link        | Primary actions, navigation and explicit unavailable sign-in.     |
| Card and badge         | Campus destinations, preview status and unavailable indicators.   |
| Input and label        | Search field for preview sections.                                |
| Dialog                 | Mobile navigation, section search and API status.                 |
| Dropdown menu          | Appearance choices and guest account information.                 |
| Skeleton               | Lazy preview loading and a pending API check.                     |
| Empty state            | Announcements, events and search results.                         |
| Alert and notification | Inline API error and confirmation toast after a successful check. |

The theme follows the system by default. Selecting Light, Dark or System stores the preference under `hu-theme`. The app follows live system changes while System is selected. An in-memory choice covers restricted storage.

Keyboard users can use the skip link, follow routes and operate Radix dialogs and menus. Visible focus and reduced-motion preferences are supported. Decorative icons use `aria-hidden`; icon-only interactive controls carry accessible names.

The shadcn/ui primitives use adapted registry source. [The upstream notice](SHADCN_NOTICE.txt) applies to those components.

## HU-006A demo surfaces

The campus preview adds a sticky demonstration label, compact editorial panels and responsive catalogue cards. House badges are neutral placeholders with individual semantic identities. Character avatars use initials. Use the original shared layout and tokens for new views. Staff and student form controls share input styles, anchored labels and keyboard focus states. See [the source register](DEMO_SOURCES.md) for asset provenance.
