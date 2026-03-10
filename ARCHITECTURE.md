# Gaming Tools - Architecture Documentation

This document describes the architecture, code organization, and development practices for the Gaming Tools project.

## Architecture

### Core Modules (Pure Logic - No DOM)

Located in `code/`:

- **dice-library.js** - Core dice rolling logic
  - **Basic functions**: rollSingleDie(), rollDice(), rollExploding(), dropDice(), countSuccesses(), calculateStats()
  - **Comprehensive functions**: rollDiceWithModifiers(), rollWithAdvantage()
    - rollDiceWithModifiers() orchestrates multiple modifiers (exploding, dropping, success counting)
    - rollWithAdvantage() handles advantage/disadvantage mechanics
  - Pure functions, fully testable, no DOM dependencies

- **card-library.js** - Generic card deck mechanics
  - createDeck(), shuffleDeck(), drawCard(), drawCards(), dealHands()
  - peekCard(), peekCards(), getDeckSize(), isDeckEmpty()
  - addCardToTop(), addCardToBottom(), returnCards(), cutDeck()
  - Works for any card game

- **history-log.js** - Generic history display utilities
  - createHistoryEntry(), createComplexHistoryEntry(), addToHistory(), addTextToHistory()
  - clearHistory(), getHistoryCount(), removeHistoryEntry(), getHistoryEntries()
  - Reusable across all pages

### Domain-Specific Modules

#### Dice (`Dice/`)
- **fate.js** - Fate/Fudge dice system
  - rollFateDice(), formatFateTotal(), getFateSymbol()
  - Uses dice-library.js for core mechanics

- **blades.js** - Blades in the Dark dice system
  - rollBladesDice(), getOutcome(), getOutcomeColor(), evaluateDicePool()
  - formatBladesRoll(), getBladesProbabilities(), getEffect(), interpretBladesRoll()
  - Uses dice-library.js for core mechanics

#### Cards (`Cards/`)
- **poker-cards.js** - Standard playing card deck
  - createPokerDeck(), createShuffledPokerDeck(), formatPokerCard()
  - getCardShortName(), getCardColor(), isJoker()
  - Uses card-library.js for deck mechanics

- **Tarot/tarot.js** - Tarot card readings
  - performThreeCardSpread(), formatTarotCard(), getCardImagePath()
  - Uses card-library.js for deck mechanics
  - Contains full 78-card deck data

#### Characters (`Characters/`)
- **js/fate-system.js** - Fate RPG character sheet logic
- **js/blades-system.js** - Blades in the Dark character sheet logic
- **js/shared.js** - Shared character sheet utilities
- **js/fate.js**, **js/fate-group.js**, **js/blades.js**, **js/gotham-reunion.js** - UI orchestration

> **Note:** The Characters module uses its own CSS system independent of the shared theme system.
> Each RPG system has a custom stylesheet that matches the look and feel of the game.
> See `Characters/CLAUDE.md` for module-specific documentation.

### HTML Files (UI Layer)

All HTML files use `<script type="module">` with inline code that:
1. Imports from pure logic modules
2. Gets values from UI inputs
3. Calls pure functions
4. Updates DOM with results

**Dice pages:**
- `Dice/basic.html` - Basic dice roller (uses dice-library + history-log)
- `Dice/fate.html` - Fate/Fudge roller (uses fate.js + history-log)
- `Dice/blades.html` - Blades in the Dark roller (uses blades.js + history-log)
- `Dice/custom.html` - Custom dice roller with modifiers (uses rollDiceWithModifiers/rollWithAdvantage + history-log)

**Card pages:**
- `Cards/deck.html` - Standard playing card deck (uses card-library + poker-cards)
- `Cards/Tarot/index.html` - Tarot card reading (uses tarot.js + card-library + history-log)

**Character sheets:**
- `Characters/Fate.html` - Fate RPG character sheet
- `Characters/FateGroup.html` - Fate RPG group tracker
- `Characters/Blades.html` - Blades in the Dark character sheet
- `Characters/GothamReunion.html` - Gotham Reunion character sheet

**Name tools:**
- `Names/index.html` - Names landing page
- `Names/random.html` - Random name generator
- `Names/viewer.html` - Name database viewer
- `Names/dashboard.html` - Source dashboard

### Theme System (`Themes/`)

- **themes.css** - All shared CSS (variables, components, layouts) with 12 theme definitions
- **theme-manager.js** - Theme switching & persistence
- **theme-init.js** - Theme initialization (prevents FOUC)
- **theme-setup.js** - Theme selector injection (autoInitThemeSelector)
- **snowflakes.js** - Seasonal animations
- **backgrounds/** - Theme background images

## Benefits

1. **Separation of Concerns**
   - Logic layer: Pure functions with no DOM dependencies
   - UI layer: DOM manipulation only
   - No mixing of concerns

2. **Testability**
   - All logic modules can be imported and tested in Node.js
   - See `code/tests/` and `Dice/tests/` for examples
   - Run tests with: `npm test`

3. **Reusability**
   - history-log.js used by all dice and card pages
   - dice-library.js used by Fate, Blades, and Custom
   - card-library.js used by Poker and Tarot

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

1. Create a new module file (e.g., `my-game.js`)
2. Import from dice-library.js or card-library.js for basic mechanics
3. Export domain-specific functions
4. Create HTML file that imports your module + history-log
5. Write tests in `tests/my-game.test.js`

## Deprecated Files

**CustomRoller.js** - Legacy file, no longer used. Custom.html has been refactored to use ES6 modules with dice-library.js. This file is kept for reference but should not be used in new code.

## File Structure

```
Gaming/
├── code/                       # Core reusable libraries
│   ├── dice-library.js         # Core dice mechanics (pure functions)
│   ├── card-library.js         # Card deck mechanics (pure functions)
│   ├── history-log.js          # History display utilities
│   └── tests/                  # Core library tests
│       ├── dice-library.test.js
│       ├── card-library.test.js
│       └── history-log.test.js
├── Dice/                       # Dice roller pages
│   ├── index.html              # Dice rollers landing page
│   ├── basic.html              # Basic dice roller
│   ├── fate.html               # Fate/Fudge roller
│   ├── blades.html             # Blades in the Dark roller
│   ├── custom.html             # Custom dice roller with modifiers
│   ├── style.css               # Dice-specific styles (imports themes.css)
│   ├── fate.js                 # Fate/Fudge dice (uses dice-library)
│   ├── blades.js               # Blades in the Dark (uses dice-library)
│   └── tests/                  # Dice module tests
│       ├── fate.test.js
│       └── blades.test.js
├── Cards/                      # Card game pages
│   ├── index.html              # Cards landing page
│   ├── deck.html               # Standard playing card deck
│   ├── poker-cards.js          # Poker deck definitions
│   ├── tests/                  # Card module tests
│   │   ├── tarot.test.js
│   │   └── poker-cards.test.js
│   └── Tarot/                  # Tarot card reader
│       ├── index.html          # Tarot reading page
│       ├── tarot.js            # Tarot card data and logic
│       ├── styles.css          # Tarot-specific styles
│       └── img/                # 78 tarot card images
├── Characters/                 # Character sheet tools (own CSS system)
│   ├── index.html              # Character sheets landing page
│   ├── Fate.html               # Fate RPG character sheet
│   ├── FateGroup.html          # Fate RPG group tracker
│   ├── Blades.html             # Blades in the Dark character sheet
│   ├── GothamReunion.html      # Gotham Reunion character sheet
│   ├── CLAUDE.md               # Module-specific AI guide
│   ├── *.css                   # RPG-system-specific stylesheets
│   ├── js/                     # Character sheet logic & UI
│   └── tests/                  # Character sheet tests
├── Names/                      # Name database tools
│   ├── index.html              # Names landing page
│   ├── random.html             # Name generator
│   ├── viewer.html             # Database viewer
│   ├── dashboard.html          # Source dashboard
│   ├── styles.css              # Names-specific styles
│   ├── data-access.js          # Database access layer
│   └── *.py                    # Database management scripts
├── Themes/                     # Shared theme system
│   ├── themes.css              # ALL shared CSS (variables, components, layouts)
│   ├── theme-manager.js        # Theme switching & persistence
│   ├── theme-init.js           # Theme initialization (prevents FOUC)
│   ├── theme-setup.js          # Theme selector injection
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
└── Documentation
    ├── README.md               # Project overview & quick start
    ├── ARCHITECTURE.md         # This file
    └── CLAUDE.md               # Guide for AI assistants
```

## Recent Architectural Improvements

### Core Library Reorganization
- Core libraries moved to `code/` directory: dice-library.js, card-library.js, history-log.js
- Domain modules remain in their feature directories (Dice/, Cards/)
- All filenames follow lowercase convention

### Card System Expansion
- **poker-cards.js** - Standard 52-card deck with optional Jokers
- **deck.html** - Interactive card dealing with visual deck/discard piles
- card-library.js expanded with: drawCards(), peekCard(), peekCards(), addCardToTop(), addCardToBottom(), returnCards(), cutDeck()

### Characters Module
- Full character sheet system for Fate, Blades in the Dark, and Gotham Reunion
- Independent CSS system with RPG-system-specific themes
- Dedicated test suite for system logic

### DiceLibrary.js Enhancements
- Added **rollDiceWithModifiers()** - Comprehensive function that orchestrates multiple modifiers in a single call
- Added **rollWithAdvantage()** - Handles advantage/disadvantage mechanics

### Code Organization Improvements
- **theme-setup.js** - Centralized theme selector code, eliminating duplication across HTML files
- **themes.css** - All shared CSS consolidated (controls, history, modal, card display, etc.)
- **12 themes** available: Autumn (default), Light, Dark, Winter, Spring, Summer, Stars, Gothic, Cthulhu, Beach, Cyberpunk, Halloween

### Test Coverage
- **313 tests** passing across 11 test files
- All core modules have full test coverage
- Tests cover: dice mechanics, card systems, Fate/Blades utilities, character sheet logic

## Notes

- All JS files use ES6 module syntax (`export`/`import`)
- HTML files use `<script type="module">` for ES6 support
- Tests run in Node.js using Vitest
- No build step required - modules work natively in modern browsers
