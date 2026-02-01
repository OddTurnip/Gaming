# Guide for AI Assistants (Claude, GPT, etc.)

> **Style Note:** Always use lowercase filenames for all files except `*.md` files. This ensures compatibility with case-sensitive Linux servers (e.g., `basic.html`, `dice-library.js`, `img/tarot/`).

Welcome! This guide helps AI assistants understand and work with the Gaming Tools project.

## Quick Start

1. **Read ARCHITECTURE.md first** - This contains the complete architecture, code organization, and development practices
2. **Check README.md** - For project overview, features, and usage instructions
3. **Review test files** in `tests/` to understand expected behavior

## Key Points

### Architecture
- **ES6 Modules** throughout - All JavaScript uses modern import/export syntax
- **Three-layer architecture**: Pure logic → Domain modules → UI layer
- **No build step required** - Native ES6 modules work in modern browsers
- See **ARCHITECTURE.md** for detailed module breakdown

### Code Organization
- **Core libraries** (DiceLibrary.js, CardLibrary.js, HistoryLog.js) contain pure functions with no DOM dependencies
  - DiceLibrary.js includes comprehensive functions: rollDiceWithModifiers(), rollWithAdvantage()
- **Domain modules** (Fate.js, Blades.js, Tarot.js) implement specific game systems
- **HTML files** use inline `<script type="module">` to import and orchestrate
- **Theme utilities** in `Themes/` folder handle theming without code duplication
- **Comprehensive test suite** with 224 tests using Vitest

### Theme System
- **11 themes** available: Autumn (default), Winter, Spring, Summer, Stars, Light, Dark, Gothic, Cthulhu, Beach, Cyberpunk
- **Shared styles** in `Themes/themes.css` - contains all CSS variables and shared component styles
- **Theme selector** via `Themes/theme-setup.js` - provides `autoInitThemeSelector()` and `initThemeSelector()`
- **Theme init** via `Themes/theme-init.js` - prevents flash of unstyled content (FOUC)

### Development Practices
- **Test-driven**: All core modules have test coverage
- **Separation of concerns**: Logic and UI are strictly separated
- **Documentation**: JSDoc comments on all exported functions
- **Responsive breakpoint**: 768px standardized across all CSS

### Deprecated Code
- **CustomRoller.js** is deprecated - Do not use or reference
- Custom.html has been fully refactored to use DiceLibrary.rollDiceWithModifiers() and rollWithAdvantage()
  - All dice rolling logic now lives in DiceLibrary.js
  - Custom.html UI layer only handles validation, display, and history

## Design Patterns

### Page Template
Use `template.html` as a starting point for new pages. Key elements:

1. **Head section:**
   ```html
   <link rel="stylesheet" href="Themes/themes.css">
   <script src="Themes/theme-init.js"></script>
   ```

2. **Three-column header layout:**
   ```html
   <div class="header">
       <div class="header-row">
           <div class="header-nav"><!-- Navigation --></div>
           <div class="header-title"><!-- Title --></div>
           <div class="header-theme" id="theme-slot"></div>
       </div>
   </div>
   ```

3. **Theme selector initialization (before `</body>`):**
   ```html
   <script type="module">
       import { autoInitThemeSelector } from './Themes/theme-setup.js';
       autoInitThemeSelector();
   </script>
   ```

### CSS Organization
- **Shared styles** live in `Themes/themes.css` (controls, history, modal, card display, etc.)
- **Page-specific overrides** go in dedicated CSS files (e.g., `Dice/Style.css`, `Tarot/styles.css`)
- Use CSS variables for all colors: `var(--variable-name, fallback)`

## Intentional Design Exceptions

### Blades in the Dark Dice Colors
The `.die-highlight-high` and `.die-highlight-low` classes in `Dice/Style.css` use **hardcoded colors** (#4CAF50 green and #FFA500 orange). This is **intentional** for game mechanics - these colors indicate success/failure outcomes and should NOT adapt to themes. The same applies to theme-specific dice styling (Gothic, Cthulhu, Beach, Cyberpunk themes have custom dice appearances).

### Container Widths
- Default container: 900px max-width
- Use `.container-tight` for 600px (Dice, Tarot, Names pages)
- Use `.container-wide` for 1200px (wider layouts if needed)

## When Making Changes

### Key Architectural Principle
**"DiceLibrary should have everything to do with actually rolling dice, and nothing to do with the DOM"**

This principle applies to all core libraries:
- Put ALL dice/card logic in the library modules (DiceLibrary.js, CardLibrary.js)
- Keep ALL DOM manipulation in the HTML files
- Use comprehensive orchestration functions (like rollDiceWithModifiers) instead of making UI code chain multiple library calls

### Adding New Features
1. Add pure logic to appropriate library (DiceLibrary.js, CardLibrary.js, etc.)
2. Write tests first (test-driven development)
3. Update HTML files to use the new functions
4. Ensure all themes work correctly (test dark/light themes especially)
5. Consider if a comprehensive orchestration function would be useful (see rollDiceWithModifiers as example)

### Adding New Pages
1. Copy `template.html` as a starting point
2. Link to `Themes/themes.css` for shared styles
3. Add page-specific styles inline or in a separate CSS file
4. Use theme-setup.js for the theme selector
5. Follow the three-column header layout

### Fixing Bugs
1. Check if tests exist and are passing
2. Add a failing test that reproduces the bug
3. Fix the bug
4. Verify all tests pass

### Refactoring
1. Maintain backward compatibility when possible
2. Update tests to match new behavior
3. Keep logic and UI separated
4. Document breaking changes

## Testing

```bash
npm test              # Run all tests
npm run test:ui       # Visual test runner
npm run test:coverage # Coverage report
npm run test:watch    # Watch mode
```

All tests must pass before committing.

## Common Tasks

### Running Locally
```bash
python server.py      # Start local server on port 8114
# Or open HTML files directly in a modern browser
```

### Adding a New Dice System
1. Create new module (e.g., `MyGame.js`) that imports from DiceLibrary
2. Export domain-specific functions with JSDoc comments
3. Create HTML file that imports your module
4. Write tests in `tests/MyGame.test.js`
5. Update ARCHITECTURE.md to document the new module

### Adding a New Theme
1. Add theme variables to `Themes/themes.css`
2. Update ThemeManager.js THEMES constant
3. Update createThemeSelector() to include new theme
4. If theme needs custom dice/button styling, add theme-specific rules
5. Test on all pages

## File Naming Conventions
- **lowercase** for HTML and CSS files (index.html, styles.css)
- **PascalCase** for JavaScript module files (DiceLibrary.js, Fate.js)
- **lowercase with hyphens** for config files (package.json, vitest.config.js)
- **ALL_CAPS** for documentation (README.md, ARCHITECTURE.md, CLAUDE.md)

## Code Style
- **ES6+ features** preferred (arrow functions, destructuring, spread, etc.)
- **Pure functions** for all logic (no side effects)
- **Clear naming** - Function names should describe what they do
- **JSDoc comments** required for all exported functions
- **Error handling** - Validate inputs and throw descriptive errors

## Resources
- **template.html** - Starting point for new pages
- **ARCHITECTURE.md** - Complete architecture documentation
- **README.md** - Project overview and features
- **tests/** - See test files for usage examples
- **package.json** - Dependencies and scripts

## Questions?
If you're unsure about anything:
1. Check ARCHITECTURE.md first
2. Look at existing code for patterns
3. Review tests to understand expected behavior
4. When in doubt, maintain consistency with existing code

---

**Remember:** The core principle is separation of concerns. Keep logic pure and testable, separate from UI code. Use shared styles from themes.css whenever possible.
