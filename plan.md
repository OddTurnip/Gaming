# Plan: Add Card Deck Utility & Repository Restructure

## Repository Layout Proposal

### Current Problems
- `card-library.js`, `dice-library.js`, `history-log.js` are **generic shared code** but live in `Dice/`
- `Tarot/` is top-level but is a card-based tool — should live under `Cards/`
- No standard playing card deck exists yet

### Proposed New Layout

```
Gaming/
├── code/                          # NEW: Shared pure-logic libraries
│   ├── card-library.js            # MOVED from Dice/
│   ├── dice-library.js            # MOVED from Dice/
│   ├── history-log.js             # MOVED from Dice/
│   └── tests/
│       ├── card-library.test.js   # MOVED from Dice/tests/
│       ├── dice-library.test.js   # MOVED from Dice/tests/
│       └── history-log.test.js    # MOVED from Dice/tests/
│
├── Cards/                         # NEW: Card-based tools
│   ├── index.html                 # NEW: Cards landing page
│   ├── deck.html                  # NEW: Standard playing card deck utility
│   ├── poker-cards.js             # NEW: Standard 52-card + joker definitions
│   ├── Tarot/                     # MOVED from top-level Tarot/
│   │   ├── index.html             # Updated imports
│   │   ├── tarot.js               # Updated imports
│   │   ├── styles.css
│   │   └── img/                   # All card images
│   └── tests/
│       ├── poker-cards.test.js    # NEW: Tests for poker card definitions
│       └── tarot.test.js          # MOVED from Dice/tests/
│
├── Dice/                          # CLEANED: Only dice-specific code
│   ├── index.html
│   ├── basic.html, fate.html, blades.html, custom.html
│   ├── fate.js, blades.js         # Domain modules (updated imports)
│   ├── Style.css
│   └── tests/
│       ├── fate.test.js           # Stays (dice-specific)
│       └── blades.test.js         # Stays (dice-specific)
│
├── Characters/                    # Unchanged
├── Names/                         # Unchanged
├── Themes/                        # Unchanged
```

## JavaScript "Interfaces"

JS doesn't have formal interfaces, but the existing `card-library.js` is already generic — it works with **any** array of objects. The "interface" is implicit: any object can be a card.

We'll formalize this with **JSDoc @typedef** documentation:
- Define a `@typedef {Object} Card` base shape (has `name`, `type`)
- `poker-cards.js` creates cards with `{name, suit, rank, value, type:'poker', color}`
- `tarot.js` creates cards with `{name, suit?, rank?, number?, type:'major'|'minor', upright, reversed}`
- `card-library.js` functions accept any `Card[]` — no changes needed

This is idiomatic JS: duck typing + JSDoc for documentation, not class hierarchies.

## Implementation Steps

### Phase 1: Create `code/` folder and move shared libraries
1. Create `code/` and `code/tests/` directories
2. Move `Dice/card-library.js` → `code/card-library.js`
3. Move `Dice/dice-library.js` → `code/dice-library.js`
4. Move `Dice/history-log.js` → `code/history-log.js`
5. Move test files: `Dice/tests/{card-library,dice-library,history-log}.test.js` → `code/tests/`

### Phase 2: Update all imports referencing moved files
- `Dice/fate.js` — imports from `dice-library.js` → `../code/dice-library.js`
- `Dice/blades.js` — same
- `Dice/basic.html`, `fate.html`, `blades.html`, `custom.html` — update script imports
- `Tarot/tarot.js` — imports from `../Dice/card-library.js` → `../code/card-library.js` (will change again in Phase 3)
- `Tarot/index.html` — imports `../Dice/history-log.js`
- `code/tests/*.test.js` — update relative import paths
- Update `vitest.config.js` to include `code/tests/`

### Phase 3: Move Tarot under Cards/
1. Create `Cards/` and `Cards/Tarot/` directories
2. Move `Tarot/*` → `Cards/Tarot/`
3. Update `Cards/Tarot/tarot.js` imports → `../../code/card-library.js`
4. Update `Cards/Tarot/index.html` imports
5. Move `Dice/tests/tarot.test.js` → `Cards/tests/tarot.test.js`
6. Update tarot test imports
7. Update `index.html` (root) link from `Tarot/` → `Cards/Tarot/`
8. Update `vitest.config.js` to include `Cards/tests/`

### Phase 4: Build poker-cards.js (new shared library)
Create `Cards/poker-cards.js` with:
- `SUITS` constant: Hearts, Diamonds, Clubs, Spades (with colors, symbols)
- `RANKS` constant: Ace through King (with values)
- `createPokerDeck(includeJokers)` — returns 52 or 54 card objects
- `formatPokerCard(card)` — display string like "Ace of Spades"
- `getCardColor(card)` — red or black
- `getCardValue(card)` — numeric value
- Each card: `{name, suit, rank, value, color, symbol, type:'poker'}`

### Phase 5: Build deck.html (new UI page)
Create `Cards/deck.html` with:
- Standard page template (three-column header, theme support)
- Checkbox: "Include Jokers"
- Buttons: "Deal Card", "Discard" (active card to discard pile), "Shuffle All" (reset deck)
- Display: current dealt card, deck count, discard pile (click to view, most recent on top)
- Discard pile shown in a modal or expandable section
- Uses `code/card-library.js` for deck mechanics + `Cards/poker-cards.js` for card data

### Phase 6: Create Cards/index.html landing page
- Links to deck.html and Tarot/index.html

### Phase 7: Write tests for poker-cards.js
Create `Cards/tests/poker-cards.test.js`:
- Correct card count (52 without jokers, 54 with)
- 4 suits × 13 ranks
- Card properties (name, suit, rank, value, color, type)
- Format function output
- Joker handling

### Phase 8: Update documentation and navigation
- Update root `index.html` — add Cards link, update Tarot link
- Update `About.html` references
- Run all tests to verify nothing is broken
