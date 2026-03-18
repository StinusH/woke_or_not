# Tailwind Style Guide — Woke or Not

A reference for colors, typography, spacing, and component patterns used throughout the app.

---

## Colors

All colors are defined as CSS variables in `src/app/globals.css` and surfaced as Tailwind utility names via `tailwind.config.ts`.

| Token          | CSS Variable              | Hex Value  | Tailwind Class   | Usage                                |
|----------------|---------------------------|------------|------------------|--------------------------------------|
| Background     | `--color-bg`              | `#f8fafc`  | `bg-bg`          | Page background                      |
| Soft BG        | `--color-bg-soft`         | `#f1f5f9`  | `bg-bgSoft`      | Subtle fills, tag backgrounds        |
| Foreground     | `--color-fg`              | `#0f172a`  | `text-fg`        | Primary text                         |
| Muted text     | `--color-fg-muted`        | `#64748b`  | `text-fgMuted`   | Secondary text, labels, metadata     |
| Accent         | `--color-accent`          | `#4f46e5`  | `text-accent`, `bg-accent`  | CTAs, links, eyebrow labels |
| Accent hover   | `--color-accent-hover`    | `#4338ca`  | `bg-accentHover` | Hover state for accent buttons       |
| Accent muted   | `--color-accent-muted`    | `#eef2ff`  | `bg-accentMuted` | Soft accent fills                    |
| Card           | `--color-card`            | `#ffffff`  | `bg-card`        | Card and panel backgrounds           |
| Border/line    | `--color-line`            | `#e2e8f0`  | `border-line`    | Borders, dividers                    |

### Score colors (not tokenized — use Tailwind defaults)
| Level   | Background class    | Text class       | When to use         |
|---------|---------------------|------------------|---------------------|
| High    | `bg-rose-50`        | `text-rose-600`  | Score ≥ 70          |
| Medium  | `bg-amber-50`       | `text-amber-600` | Score 40–69         |
| Low     | `bg-emerald-50`     | `text-emerald-600` | Score < 40        |

---

## Typography

Fonts are loaded via `next/font/google` and set as CSS variables in the root `<html>` element.

| Role    | Font                | Variable          | Tailwind class   | Weights       |
|---------|---------------------|-------------------|------------------|---------------|
| Display | Plus Jakarta Sans   | `--font-display`  | `font-display`   | 600, 700, 800 |
| Body    | Inter               | `--font-body`     | `font-body`      | 400, 500, 600 |

### Typographic scale

```
Page title (h1)     font-display text-3xl md:text-4xl font-bold
Section title (h2)  font-display text-xl font-bold
Card title (h3)     font-display text-base font-bold
Eyebrow             text-xs font-semibold uppercase tracking-widest text-accent
Body                text-sm text-fg (or text-fgMuted for secondary)
Label               text-xs font-semibold uppercase tracking-wide text-fgMuted
```

---

## Spacing & Layout

- **Container**: `min(1200px, calc(100vw - 2rem))` centered — use the `.container` class
- **Page padding**: `py-8 md:py-12` on `<main>`
- **Section gap**: `gap-10` between top-level page sections
- **Card padding**: `p-4` (compact) or `p-5` / `p-6` (standard)

---

## Shadows

Two custom shadow tokens are defined in `tailwind.config.ts`:

| Token         | Tailwind class       | Usage                              |
|---------------|----------------------|------------------------------------|
| Card default  | `shadow-card`        | Resting cards, panels              |
| Card hover    | `shadow-card-hover`  | Cards on hover / elevated panels   |

---

## Border Radius

| Usage                | Class          |
|----------------------|----------------|
| Cards & panels       | `rounded-xl`   |
| Inputs & selects     | `rounded-lg`   |
| Tags, chips, badges  | `rounded-md`   |
| Small inline items   | `rounded-md`   |

---

## Buttons

### Primary (filled)
```html
<button class="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover">
  Label
</button>
```

### Secondary (outlined)
```html
<button class="rounded-lg border border-line bg-card px-5 py-2.5 text-sm font-semibold text-fg shadow-card transition hover:bg-bgSoft">
  Label
</button>
```

### Ghost (text-only)
```html
<button class="rounded-lg px-3 py-1.5 text-sm font-medium text-fgMuted transition hover:bg-bgSoft hover:text-fg">
  Label
</button>
```

---

## Form Inputs

All inputs share the same base class:

```
rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg
transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20
```

Labels use:
```
text-xs font-semibold uppercase tracking-wide text-fgMuted
```

---

## Cards

```html
<div class="rounded-xl border border-line bg-card shadow-card transition hover:shadow-card-hover">
  <!-- content -->
</div>
```

For interactive cards (links):
- Add `group` to the wrapper
- Use `group-hover:scale-105` for image zoom effects

---

## Tags / Genre Pills

```html
<span class="rounded-md bg-bgSoft px-2 py-0.5 text-xs font-medium text-fgMuted">
  Genre
</span>
```

For interactive (link) tags:
```html
<a class="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-fgMuted shadow-card transition hover:border-accent hover:text-accent">
  Genre
</a>
```

---

## Eyebrow Labels

Used above section headings to provide context:

```html
<p class="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
  Category
</p>
```

---

## Animations

| Name      | Class          | Trigger     | Description                  |
|-----------|----------------|-------------|------------------------------|
| `rise`    | `animate-rise` | On mount    | Fade in + slide up 16px      |
| `fadein`  | `animate-fadein` | On mount  | Fade in only                 |

Apply `animate-rise` to individual cards in a grid for a staggered entrance feel.

---

## Accessibility Notes

- Always add `aria-label` to icon-only buttons
- Use `aria-disabled` + `data-disabled` on pagination links to prevent pointer events visually while keeping them in the accessibility tree
- Maintain a 4.5:1 contrast ratio for all text — `text-fgMuted` on `bg-card` meets WCAG AA
- All interactive elements have visible focus states via `focus:ring-2 focus:ring-accent/20`
