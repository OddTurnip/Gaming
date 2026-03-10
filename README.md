# Dice Roller

A collection of web-based dice rolling applications for tabletop RPGs and gaming simulations. Built with modern JavaScript (ES6 modules), fully testable, and beautiful themed UI.

## Features

🎲 **Multiple Dice Systems:**
- **Basic Roller** - Standard polyhedral dice (d4, d6, d8, d10, d12, d20, d100)
- **Fate/Fudge** - Fate dice with ladder system and probability tables
- **Blades in the Dark** - Position, effect, and outcome mechanics
- **Tarot** - Full 78-card deck with three-card spreads
- **Custom** - Advanced roller with exploding dice, success counting, advantage/disadvantage, and drop mechanics

🎨 **11 Beautiful Themes:**
- Seasonal themes: Autumn, Winter, Spring, Summer
- Stars theme with animated background
- Light and Dark modes
- Specialty themes: Gothic, Cthulhu, Beach, Cyberpunk
- Seasonal animated effects (snowflakes, leaves, etc.)

✨ **Modern Architecture:**
- ES6 modules with clean separation of concerns
- Pure functions for testable dice mechanics
- No build step required - runs natively in modern browsers
- Comprehensive test suite (283 tests)

## Quick Start

```bash
python server.py   # Starts server and opens browser
```

For development: `npm install && npm test`

## Project Structure

```
Dice/
├── Core Libraries/        # Pure logic, no DOM dependencies
│   ├── DiceLibrary.js     # Dice rolling mechanics
│   ├── CardLibrary.js     # Card deck mechanics
│   └── HistoryLog.js      # History utilities
├── Domain Modules/        # Game-specific implementations
│   ├── Fate.js
│   ├── Blades.js
│   └── Tarot.js
├── UI & Themes/
│   ├── ThemeManager.js    # Theme switching
│   ├── Snowflakes.js      # Seasonal effects
│   └── style.css          # All themes & styling
└── Pages/                 # HTML files
    ├── Index.html
    ├── Basic.html
    ├── Fate.html
    ├── Blades.html
    ├── Tarot.html
    └── Custom.html
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation. Run `npm test` to verify tests pass.

## License

[CC BY-NC-SA 4.0](LICENSE.md) - Free to share and adapt for non-commercial use with attribution.
