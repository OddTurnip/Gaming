# Style & Theme Audit Guide

Use this document when reviewing CSS/theme usage across the Gaming Tools project.
It can be used as a prompt for an AI assistant or as a manual checklist.

## Quick Audit Prompt

> Review [FILE or "all HTML/CSS files"] for CSS theme compliance. Check for:
> hardcoded colors, missing theme variables, inconsistent styling, and
> opportunities to use shared styles from themes.css. Report findings with
> file:line references and suggested fixes.

---

## Available Theme Variables (41 total)

### Backgrounds
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--bg-gradient-start` | Page background gradient start | `#105610` |
| `--bg-gradient-end` | Page background gradient end | `#a94610` |
| `--bg-gradient` | Full gradient shorthand | linear-gradient |
| `--container-bg` | Main container background | `rgba(255,255,255,0.95)` |
| `--bg-light` | Light background (cards, sections) | `#f9f9f9` |
| `--bg-white` | White background (inputs, dropdowns) | `white` |
| `--bg-hover` | Hover state background | `#f0f5ef` |

### Text & Headings
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--heading-primary` | Main headings (h1) | `#7a2a1f` |
| `--heading-secondary` | Sub-headings (h2) | `#5a1010` |
| `--heading-tertiary` | Section headers (h3) | `#5d4e37` |
| `--text-primary` | Body text | `#555` |
| `--text-secondary` | Secondary/muted text | `#666` |
| `--text-light` | Light/disabled text | `#999` |
| `--text-white` | White text (on dark bg) | `white` |

### Accents & Buttons
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--accent-primary` | Primary accent (links, borders) | `#4a7c3c` |
| `--accent-primary-dark` | Darker accent (hover states) | `#2d5016` |
| `--accent-secondary` | Secondary accent | `#5a7a47` |
| `--accent-tertiary` | Tertiary accent (labels, muted) | `#7a6952` |
| `--button-gradient-start` | Button gradient start | `#4a7c3c` |
| `--button-gradient-end` | Button gradient end | `#2d5016` |
| `--button-shadow` | Button shadow color | `rgba(74,124,60,0.4)` |

### Borders
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--border-light` | Light borders (dividers) | `#eee` |
| `--border-medium` | Medium borders (inputs) | `#ddd` |
| `--border-accent` | Accent borders (active) | `#5a7a47` |

### Status & Errors
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--error-bg` | Error background | `#ffebee` |
| `--error-border` | Error border | `#ef5350` |
| `--error-text` | Error text | `#c62828` |

### Shadows
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--shadow-primary` | Strong shadow | `rgba(0,0,0,0.3)` |
| `--shadow-secondary` | Subtle shadow | `rgba(0,0,0,0.2)` |

### Result Display
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--result-gradient-start` | Result area gradient start | `#e8762e` |
| `--result-gradient-end` | Result area gradient end | `#d96619` |
| `--result-text-shadow` | Result text shadow | `rgba(0,0,0,0.2)` |

### Special Purpose
| Variable | Purpose | Fallback |
|----------|---------|----------|
| `--fate-die-bg` | Fate dice background | `#611` |
| `--scrollbar-track` | Scrollbar track | `#f1f1f1` |
| `--scrollbar-thumb` | Scrollbar thumb | `#5a7a47` |
| `--scrollbar-thumb-hover` | Scrollbar thumb hover | `#4a6a37` |
| `--close-btn-bg` | Close button background | `rgba(122,42,31,0.1)` |
| `--close-btn-bg-hover` | Close button hover | `rgba(122,42,31,0.2)` |
| `--close-btn-color` | Close button color | `#7a2a1f` |
| `--link-hover-gradient-start` | Link hover gradient | `rgba(74,124,60,0.03)` |
| `--link-hover-gradient-end` | Link hover gradient end | `rgba(45,80,22,0.03)` |
| `--history-border-shadow` | History entry shadow | `rgba(90,122,71,0.15)` |

---

## 15 Themes

Autumn (default), Light, Grey, Dark, Black, Winter, Spring, Summer, Stars, Gothic, Cthulhu, Beach, Cyberpunk, Halloween, Crayon

---

## Shared Component Classes (from themes.css)

Use these instead of writing custom CSS when possible:

### Layout
- `.container` (900px), `.container-tight` (600px), `.container-wide` (1200px)
- `.content`, `.section`, `.header`, `.header-row`, `.footer`

### Header (three-column)
- `.header-nav`, `.header-title`, `.header-theme`

### Navigation
- `.nav-button` — back/home links
- `.link-container` — clickable card links (with h2 + p)

### Forms
- `.controls`, `.control-group`, `.control-group-inline`
- `.roll-button` — primary action button
- `.checkbox-label`, `.radio-label`
- `.error-message`

### History
- `.history-section`, `.roll-history`, `.history-entry`

### Modal
- `.modal`, `.modal-content`, `.modal-close`

### Theme Selector
- `.theme-selector-wrapper`, `.theme-selector`

---

## Audit Checklist

### For each file, verify:

- [ ] Links to `Themes/themes.css` (directly or via page CSS that imports it)
- [ ] Includes `<script src="Themes/theme-init.js"></script>` in `<head>`
- [ ] Initializes theme selector with `autoInitThemeSelector()`
- [ ] Uses three-column header layout (`.header-row` > `.header-nav` + `.header-title` + `.header-theme`)

### For each color value, verify:

- [ ] No hardcoded hex colors (`#xxx`, `#xxxxxx`) — use `var(--variable, fallback)` instead
- [ ] No hardcoded `rgb()`/`rgba()` — use shadow/border variables
- [ ] Fallback values provided: `var(--name, fallback)`
- [ ] Appropriate variable chosen (e.g., `--border-medium` for input borders, not `--accent-primary`)

### Known Intentional Exceptions:

These hardcoded colors are **by design** (documented in CLAUDE.md):

1. **Dice/style.css** — `.die-highlight-high` (#4CAF50) and `.die-highlight-low` (#FFA500) for Blades in the Dark success/failure indicators
2. **Dice/blades.html** — Bonus die colors (success green, failure red, mixed orange) for game mechanics
3. **Dice/style.css** — Theme-specific dice styling (Gothic, Cthulhu, Beach, Cyberpunk)

### Common Mistakes:

| Mistake | Fix |
|---------|-----|
| `color: #28a745` | `color: var(--accent-primary)` |
| `background: #f8f9fa` | `background: var(--bg-light)` |
| `border: 1px solid #ddd` | `border: 1px solid var(--border-medium)` |
| `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` | `box-shadow: 0 2px 4px var(--shadow-secondary)` |
| `color: #333` for headings | `color: var(--heading-primary)` |
| `color: #666` for body text | `color: var(--text-secondary)` |
| Using `--accent-primary` for input borders | Use `--border-medium` (subtler) |
| Using `--accent-primary` for section labels | Use `--accent-tertiary` (muted) |

### Variable Selection Guide:

| Use Case | Variable |
|----------|----------|
| Page headings | `--heading-primary` |
| Section headings | `--heading-tertiary` |
| Body text | `--text-primary` |
| Muted/helper text | `--text-secondary` |
| Disabled text | `--text-light` |
| Section label (inline) | `--accent-tertiary` |
| Input/dropdown borders | `--border-medium` |
| Active/hover borders | `--border-accent` |
| Divider lines | `--border-light` |
| Card/section backgrounds | `--bg-light` |
| Input/dropdown backgrounds | `--bg-white` |
| Hover backgrounds | `--bg-hover` |
| Primary links/buttons | `--accent-primary` |
| Subtle shadows | `--shadow-secondary` |
| Strong shadows | `--shadow-primary` |
| Error states | `--error-bg`, `--error-border`, `--error-text` |

---

## Running the Audit

### With AI Assistant:
```
Review [filename] against STYLE-AUDIT.md. Report any hardcoded colors,
missing theme variables, or opportunities to use shared component classes.
```

### Full Codebase Scan:
```
Audit all HTML and CSS files in this project against STYLE-AUDIT.md.
For each file, report: theme support status, theme variables used,
hardcoded colors found, and recommended fixes with file:line references.
```

### After Adding a New Page:
```
Review [new-page.html] against STYLE-AUDIT.md. Verify it follows the
page template pattern, uses theme variables for all colors, and leverages
shared component classes where possible.
```
