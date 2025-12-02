# Guide for AI Assistants (Claude, GPT, etc.)

> **Style Note:** Always use lowercase filenames for all files except `*.md` files. This ensures compatibility with case-sensitive Linux servers (e.g., `basic.html`, `dice-library.js`, `img/tarot/`).

Welcome! This guide helps AI assistants understand and work with the Dice Roller project.

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
- **Theme utilities** (ThemeManager.js, ThemeInit.js) handle theming without code duplication
- **Comprehensive test suite** with 224 tests using Vitest

### Development Practices
- **Test-driven**: All core modules have test coverage
- **Separation of concerns**: Logic and UI are strictly separated
- **Documentation**: JSDoc comments on all exported functions
- **Theme system**: 7 themes (autumn, winter, spring, summer, stars, light, dark)

### Deprecated Code
- **CustomRoller.js** is deprecated - Do not use or reference
- Custom.html has been fully refactored to use DiceLibrary.rollDiceWithModifiers() and rollWithAdvantage()
  - All dice rolling logic now lives in DiceLibrary.js
  - Custom.html UI layer only handles validation, display, and history

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
1. Add theme variables to Style.css
2. Update ThemeManager.js THEMES constant
3. Update createThemeSelector() to include new theme
4. Test on all pages

## File Naming Conventions
- **PascalCase** for module files (DiceLibrary.js, Fate.js)
- **PascalCase** for HTML files (Index.html, Basic.html)
- **lowercase** for config files (package.json, vitest.config.js)
- **ALL_CAPS** for documentation (README.md, ARCHITECTURE.md)

## Code Style
- **ES6+ features** preferred (arrow functions, destructuring, spread, etc.)
- **Pure functions** for all logic (no side effects)
- **Clear naming** - Function names should describe what they do
- **JSDoc comments** required for all exported functions
- **Error handling** - Validate inputs and throw descriptive errors

## Resources
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

**Remember:** The core principle is separation of concerns. Keep logic pure and testable, separate from UI code.
