# Dice Roller - Architecture Documentation

This document describes the architecture, code organization, and development practices for the Dice Roller project.

## Architecture

### Core Modules (Pure Logic - No DOM)

- **DiceLibrary.js** - Core dice rolling logic
  - **Basic functions**: rollSingleDie(), rollDice(), rollExploding(), dropDice(), countSuccesses()
  - **Comprehensive functions**: rollDiceWithModifiers(), rollWithAdvantage()
    - rollDiceWithModifiers() orchestrates multiple modifiers (exploding, dropping, success counting)
    - rollWithAdvantage() handles advantage/disadvantage mechanics
  - Pure functions, fully testable, no DOM dependencies

- **CardLibrary.js** - Generic card deck mechanics
  - createDeck(), shuffleDeck(), drawCard(), dealHands()
  - Works for any card game

- **HistoryLog.js** - Generic history display utilities
  - createHistoryEntry(), addToHistory(), clearHistory()
  - Reusable across all pages

### Domain-Specific Modules

- **Fate.js** - Fate/Fudge dice system
  - rollFateDice(), formatFateTotal(), getFateSymbol()
  - Uses DiceLibrary for core mechanics

- **Blades.js** - Blades in the Dark dice system
  - rollBladesDice(), getOutcome(), getOutcomeColor()
  - Uses DiceLibrary for core mechanics

- **Tarot.js** - Tarot card readings
  - performThreeCardSpread(), formatTarotCard(), getCardImagePath()
  - Uses CardLibrary for deck mechanics
  - Contains full 78-card deck data

### HTML Files (UI Layer)

All HTML files now use `<script type="module">` with inline code that:
1. Imports from pure logic modules
2. Gets values from UI inputs
3. Calls pure functions
4. Updates DOM with results

**All pages refactored:**
- ✅ Basic.html - Uses DiceLibrary + HistoryLog
- ✅ Fate.html - Uses Fate + HistoryLog
- ✅ Blades.html - Uses Blades + HistoryLog
- ✅ Tarot.html - Uses Tarot + CardLibrary + HistoryLog
- ✅ Custom.html - Uses DiceLibrary.rollDiceWithModifiers() + rollWithAdvantage() + HistoryLog
  - Fully refactored: all dice logic delegated to DiceLibrary
  - UI layer only handles validation, display, and history

## Benefits

1. **Separation of Concerns**
   - Logic layer: Pure functions with no DOM dependencies
   - UI layer: DOM manipulation only
   - No mixing of concerns

2. **Testability**
   - All logic modules can be imported and tested in Node.js
   - See tests/DiceLibrary.test.js for examples
   - Run tests with: `npm test`

3. **Reusability**
   - HistoryLog.js used by all pages
   - DiceLibrary.js used by Fate, Blades, and could be used by Custom
   - CardLibrary.js can support future card games

4. **Maintainability**
   - Clear module boundaries
   - No code duplication
   - Easy to add new features

## Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Adding New Modules

To add a new dice system or card game:

1. Create a new module file (e.g., `MyGame.js`)
2. Import from DiceLibrary or CardLibrary for basic mechanics
3. Export domain-specific functions
4. Create HTML file that imports your module + HistoryLog
5. Write tests in `tests/MyGame.test.js`

## Deprecated Files

**CustomRoller.js** - Legacy file, no longer used. Custom.html has been refactored to use ES6 modules with DiceLibrary. This file is kept for reference but should not be used in new code.

## File Structure

```
Gaming/
├── Dice/                       # Dice roller pages
│   ├── index.html              # Dice rollers landing page
│   ├── basic.html              # Basic dice roller
│   ├── fate.html               # Fate/Fudge roller
│   ├── blades.html             # Blades in the Dark roller
│   ├── custom.html             # Custom dice roller with modifiers
│   ├── Style.css               # Dice-specific styles (imports themes.css)
│   ├── DiceLibrary.js          # Core dice mechanics (pure functions)
│   ├── Fate.js                 # Fate/Fudge dice (uses DiceLibrary)
│   ├── Blades.js               # Blades in the Dark (uses DiceLibrary)
│   ├── CardLibrary.js          # Card deck mechanics (pure functions)
│   └── history-log.js          # History display utilities
├── Tarot/                      # Tarot card reader
│   ├── index.html              # Tarot reading page
│   ├── styles.css              # Tarot-specific styles (imports themes.css)
│   └── tarot.js                # Tarot card data and logic
├── Names/                      # Name database tools
│   ├── index.html              # Names landing page
│   ├── random.html             # Name generator
│   ├── viewer.html             # Database viewer
│   ├── dashboard.html          # Source dashboard
│   └── styles.css              # Names-specific styles
├── Characters/                 # Character sheet tools
│   └── index.html              # Character sheets landing page
├── Themes/                     # Shared theme system
│   ├── themes.css              # ALL shared CSS (variables, components, layouts)
│   ├── theme-manager.js        # Theme switching & persistence
│   ├── theme-init.js           # Theme initialization (prevents FOUC)
│   ├── theme-setup.js          # Theme selector injection (autoInitThemeSelector)
│   ├── snowflakes.js           # Seasonal animations
│   └── backgrounds/            # Theme background images
├── Root Pages
│   ├── index.html              # Main landing page
│   ├── About.html              # About page with tech stack
│   └── template.html           # Template for new pages
├── Configuration & Build
│   ├── package.json            # NPM config with Vitest
│   ├── vitest.config.js        # Vitest configuration
│   └── server.py               # Local development server
├── Tests
│   └── tests/                  # All test files
└── Documentation
    ├── README.md               # Project overview & quick start
    ├── ARCHITECTURE.md         # This file - architecture & development
    └── CLAUDE.md               # Guide for AI assistants
```

## Recent Architectural Improvements

### DiceLibrary.js Enhancements
- Added **rollDiceWithModifiers()** - Comprehensive function that orchestrates multiple modifiers in a single call
  - Supports: exploding dice (standard/compound), drop lowest/highest, success counting
  - Eliminates need for manual chaining of individual functions
  - Returns: rolls, keptRolls, droppedRolls, total, successCount
- Added **rollWithAdvantage()** - Handles advantage/disadvantage mechanics
  - Automatically performs two rolls and selects appropriate result
  - Works with all modifiers (exploding, drop, success counting)
  - Returns: chosenRoll, otherRoll, mode

### Custom.html Refactoring
- Removed ~80 lines of duplicate dice rolling logic
- Now uses rollDiceWithModifiers() and rollWithAdvantage() exclusively
- UI layer only handles: input validation, result display, history management
- Perfect example of "DiceLibrary has everything to do with rolling dice, nothing to do with DOM"

### Code Organization Improvements
- **theme-setup.js** - Centralized theme selector code, eliminating ~730 lines of duplication across 14 HTML files
- **themes.css** - All shared CSS consolidated (controls, history, modal, card display, etc.)
- **Page-specific CSS** - Dice/Style.css and Tarot/styles.css now only contain page-specific overrides
- **Responsive breakpoints** - Standardized to 768px across all CSS files
- **Container utilities** - Added `.container-tight` (600px) and `.container-wide` (1200px) classes

### Test Coverage
- **283 tests** passing
- All core modules have full test coverage
- Tests cover: dice mechanics, card systems, FATE/Blades utilities

## Notes

- All new JS files use ES6 module syntax (`export`/`import`)
- HTML files use `<script type="module">` for ES6 support
- Tests run in Node.js using Vitest
- No build step required - modules work natively in modern browsers
