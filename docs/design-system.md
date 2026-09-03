# Design system

One set of tokens and primitives shared by every page. Two files, both imported once from `app/(app)/globals.css`:

| File | What it holds |
| --- | --- |
| `app/(app)/styles/tokens.css` | Colour, type, spacing, radius, shadow and motion variables on `:root`. |
| `app/(app)/styles/ui.css` | Reusable classes: buttons, fields, checks, choice cards, cards, alerts, badges, headings, steps. |

A living reference renders every primitive at `/styleguide` (not indexed, not linked from the nav).

## Rules

- **Read colours from tokens.** Use `var(--color-accent)`, never `#01296f`. This applies to CSS modules too.
- **Compose, don't fork.** A page stylesheet (`shop.css`, `auth.css`, `account.css`, `nursery.css`) holds only what is specific to that page. If you need a button, field or alert, use the primitive.
- **Forms are friendly.** Sentence-case 14px labels, 48px rounded white inputs, a navy focus ring, hints and errors under the field, and an `(optional)` marker via `.field__optional` rather than asterisks.
- **Headings are sentence case.** Tracked uppercase is reserved for the storefront kickers and the global `.title` on the home page.
- **Legacy variables** (`--accent-color`, `--secondary-color`, `--shop-*`) still resolve but should not be used in new code.

## Primitives at a glance

| Need | Class |
| --- | --- |
| Button | `.btn`, with `.btn--ghost`, `.btn--light`, `.btn--sm`, `.btn--block`; `.btn-text` for a link-styled button |
| Field | `.field` > `.field__label` + `.field__input` / `.field__select` / `.field__textarea`, then `.field__hint` or `.field__error`; `.field--wide` spans a `.form-grid` |
| Two-column form | `.form-grid`; vertical stack `.form-stack` |
| Checkbox or radio row | `.check`, grouped in `.check-group` (`--inline` for a row) |
| Radio card with detail | `.choice` > `.choice__option` (`--selected`, `--disabled`) > `.choice__body` > `.choice__title`, `.choice__meta`, `.choice__price`, `.choice__lines` |
| Card | `.card`, with `.card--raised`, `.card--dashed`, `.card--inset`, `.card--tight`, `.card--roomy` |
| Message | `.alert`, with `.alert--info`, `.alert--ok`, `.alert--error` |
| Status pill | `.badge`, with `.badge--ok`, `--warn`, `--bad`, `--muted`, `--accent`; add `.badge--dot` for a leading dot |
| Kicker / title / section | `.eyebrow`, `.heading` (`--lg`), `.section-title`, `.lead`, `.prose` |
| Numbered form step | `.step-head` > `.step-head__num` + `.step-head__title` + `.step-head__desc` |
| Label/value rows | `dl.rows` > `div` > `dt` + `dd`, with `.rows__total` |
| Other | `.divider`, `.spinner`, `.link`, `.input-wrap` + `.input-wrap__action` |

## Adding something new

1. Check `/styleguide` first. If a primitive already covers it, use it.
2. If the need is site-wide, add it to `ui.css` and render it on the style guide.
3. If it is one page's concern, put it in that page's stylesheet and build it from tokens.
