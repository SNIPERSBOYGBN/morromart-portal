# Design Brief

## Direction

**Blurple Command** — a professional recruitment command center for Morromart staff, gated by Discord login and driven by a Discord-bot notification loop.

## Tone

Refined, trustworthy, information-dense productivity UI — clean neutral base with a confident Discord blurple accent; restraint over decoration so review queues and application tables stay scannable.

## Differentiation

A Discord-blurple signature accent threaded through every interactive element, paired with a cool slate neutral system and distinct color-coded announcement banners — reads as a serious HR tool, not a generic SaaS template.

## Color Palette

| Token      | OKLCH (light) | OKLCH (dark) | Role                                  |
| ---------- | ------------- | ------------ | ------------------------------------- |
| background | 0.985 0.005 265 | 0.16 0.015 265 | app canvas                          |
| foreground | 0.22 0.02 265 | 0.93 0.01 265 | primary text                        |
| card       | 1 0 0         | 0.2 0.02 265 | surfaces                             |
| primary    | 0.52 0.2 275  | 0.62 0.17 275 | Discord blurple CTA / active         |
| accent     | 0.9 0.03 275  | 0.28 0.05 275 | soft blurple tint / hover            |
| muted      | 0.955 0.01 265 | 0.24 0.02 265 | secondary surfaces                  |
| info       | 0.52 0.16 255 | 0.6 0.15 255 | Info announcement banner             |
| warning    | 0.68 0.16 70  | 0.75 0.15 70 | Warning announcement banner          |
| destructive| 0.58 0.2 25   | 0.62 0.19 25 | Error banner / reject / blacklist    |
| success    | 0.56 0.14 155 | 0.62 0.14 155 | accepted / positive status           |

## Typography

- Display: Space Grotesk — headings, page titles, position names
- Body: DM Sans — UI labels, paragraphs, tables
- Mono: JetBrains Mono — Discord user IDs, codes, timestamps
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`, label `text-xs font-semibold uppercase tracking-widest`, body `text-sm md:text-base`

## Elevation & Depth

Layered card surfaces on a flat canvas; elevation via `shadow-subtle` for resting cards and `shadow-elevated` for hover/focus, with hairline borders separating zones.

## Structural Zones

| Zone    | Background | Border  | Notes                                     |
| ------- | ---------- | ------- | ----------------------------------------- |
| Header  | bg-card    | border-b | sticky, contains announcement banner      |
| Sidebar | bg-sidebar | border-r | nav + role badge                          |
| Content | bg-background | —     | alternating `bg-muted/30` sections        |
| Footer  | bg-muted/40 | border-t | meta + links                              |

## Spacing & Rhythm

Consistent 4px grid; generous `gap-6` section rhythm with `p-4 md:p-6` card padding; tight `gap-2` for form clusters and table rows.

## Component Patterns

- Buttons: rounded-md, `bg-primary` blurple for primary, ghost/secondary for secondary, `bg-destructive` for reject/blacklist
- Cards: rounded-lg, `bg-card`, `shadow-subtle`, `border-border`, `shadow-elevated` on hover
- Badges: rounded-full, tinted backgrounds — role, type (unpaid/paid/contract), and status chips
- Banners: full-width, tinted bg + border-l-4 accent, matching icon (info/warning/error/other)

## Motion

- Entrance: `animate-fade-in` 0.25s ease-out on route/page mount
- Hover: `transition-smooth` color/shadow 0.3s on cards and buttons
- Decorative: none — keep the review workflow calm and focused

## Constraints

- Token-only styling — no raw hex/rgb or arbitrary color classes in components
- AA+ contrast in both light and dark themes
- Announcement types must stay visually distinct: Info=blue, Warning=orange, Error=red, Other=custom color+icon

## Signature Detail

The announcement banner system — a border-left-accented, color-coded, icon-led strip pinned under the header — makes site-wide staff communications instantly scannable and is the most memorable interaction in the portal.
