# CharacterSheets Project Guide

This folder contains browser-based RPG character sheets with no server dependencies. Each sheet uses localStorage for persistence and supports file export/import.

## Project Structure

```
CharacterSheets/
├── CLAUDE.md              ← This file
├── app.py                 ← Simple HTTP server (port 8080)
├── index.html             ← Landing page with links to all sheets
│
├── controls.css           ← Shared UI components (tracks, buttons, forms)
├── js/                    ← ES6 JavaScript modules
│   ├── shared.js          ← System-agnostic utilities
│   ├── fate-system.js     ← FATE RPG specific utilities
│   ├── blades-system.js   ← Blades in the Dark specific utilities
│   ├── fate.js            ← FATE character sheet logic
│   ├── fate-group.js      ← FATE group tracker logic
│   ├── blades.js          ← Blades character sheet logic
│   └── gotham-reunion.js  ← Gotham Reunion sheet logic
│
├── Fate.html              ← FATE single character sheet
├── fate.css
├── FateGroup.html         ← FATE group tracker (GM tool)
├── fate-group.css
├── fate-shared.css        ← Shared FATE CSS variables/components
│
├── Blades.html            ← Standard Blades in the Dark
├── blades.css
│
├── GothamReunion.html     ← Blades hack (superhero theme)
└── gotham-reunion.css
```

## JavaScript Module Architecture

All JavaScript uses ES6 modules for clean imports and easy testing:

```
shared.js                   ← System-agnostic utilities
   ↓ imports
fate-system.js             ← FATE-specific (ladder, stress, fudge dice)
blades-system.js           ← BitD-specific (d6 pool, load tracks)
   ↓ imports
fate.js, fate-group.js     ← Sheet-specific DOM handling
blades.js, gotham-reunion.js
```

### shared.js - Common Utilities

- `createAutosaveManager()` - Debounced autosave with beforeunload protection
- `saveToStorage()`, `loadFromStorage()` - localStorage with error handling
- `downloadJSON()` - Standardized file export (`$system - $name.char.json`)
- `setupFileLoader()` - File input handling with error feedback
- `manageDynamicRows()` - Ensures exactly one empty row at end
- `getTrackValue()`, `setTrackValue()` - Track/pip utilities
- `setupSequentialTrack()`, `setupIndividualToggleTrack()` - Click handlers
- `createPopup()` - Memory-safe popup with escape handler cleanup
- `generateId()` - Unique ID generation
- `storeForTransfer()`, `getTransferredData()` - Session storage for page navigation

### fate-system.js - FATE Specific

- `LADDER`, `SKILL_LIST`, `APPROACH_LIST` - Constants
- `getLadderName()`, `formatRating()` - Ladder display
- `getStressBoxCount()` - Stress calculation per FATE version
- `roll4dF()`, `showFateDicePopup()` - Fudge dice rolling
- `convertFateToGroupFormat()`, `convertGroupToFateFormat()` - Format conversion
- `storeCharacterForTransfer()`, `getTransferredCharacter()` - Page transfer

### blades-system.js - BitD Specific

- `LOAD_CAPACITY`, `RESULT_THRESHOLDS` - Constants
- `rollDicePool()`, `evaluateResult()` - d6 pool mechanics
- `showBladesDicePopup()` - BitD dice roller with bonus dice
- `getLoadCapacity()` - Load track sizing

## Running Locally

```bash
cd /home/user/Claude-Sandbox/CharacterSheets
python app.py
# Opens http://localhost:8080 in browser
```

## FATE Unified WebApp

The FATE tools (Fate.html and FateGroup.html) share code via fate-shared.css and js/fate-system.js:

**Shared Features:**
- CSS variables and component styles (colors, inputs, buttons, stress boxes)
- Data conversion between single-character and group formats
- Character transfer via sessionStorage for cross-page navigation

**Workflow:**
1. Create/edit characters in Fate.html (full detail view)
2. Export as .json or "Add to Group" to transfer to FateGroup
3. In FateGroup, "Import Char" accepts .json from Fate.html
4. Click the arrow icon on any character to open full details in Fate.html
5. Export individual characters back from FateGroup

## Architectural Patterns

### 1. Dynamic Row Management

The key UX pattern: **always exactly one empty row** at the bottom of dynamic lists:

```javascript
import { manageDynamicRows } from './shared.js';

manageDynamicRows(container, '.row-selector', isRowEmpty, createRowFn);
```

**Used for:** Contacts, Assets, Projects, Training, Abilities, Items, Aspects, Stunts, Extras

### 2. Clickable Pip/Box Tracks

Tracks use `<b>` elements with `.filled` class. Click behavior:
- Click a box: fill up to and including that box
- Click the highest filled box: clear all boxes

```javascript
import { setupSequentialTrack } from './shared.js';

setupSequentialTrack(container, (newValue) => autosave.schedule());
```

**Exception:** FATE stress boxes toggle individually (not sequential):

```javascript
import { setupIndividualToggleTrack } from './shared.js';

setupIndividualToggleTrack(container, () => autosave.schedule());
```

### 3. Drag Handle for Reordering

For drag-and-drop reordering of elements (like character columns), use a dedicated drag handle:

**HTML:**
```html
<div class="character-column" data-char-id="">
    <span class="drag-handle" draggable="true" title="Drag to reorder">⋮⋮</span>
    <!-- rest of content -->
</div>
```

**CSS:**
```css
.drag-handle {
    cursor: grab;
    user-select: none;
    /* ... styling ... */
}
.drag-handle:hover {
    cursor: grab;  /* Must repeat on hover for browser compat */
}
.drag-handle:active {
    cursor: grabbing;
}

/* Visual feedback for drag states */
.character-column.dragging {
    opacity: 0.5;
}
.character-column.drag-over {
    box-shadow: -4px 0 0 var(--accent);  /* Left insertion point */
}
.character-column.drag-over-right {
    box-shadow: 4px 0 0 var(--accent);   /* Right insertion point */
}
```

**JavaScript:**
```javascript
function setupDragAndDrop(column) {
    const handle = column.querySelector('.drag-handle');

    // Drag events on handle only (so text selection works elsewhere)
    handle.addEventListener('dragstart', handleDragStart);
    handle.addEventListener('dragend', handleDragEnd);

    // Drop target events on the column
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('dragleave', handleDragLeave);
    column.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    draggedColumn = e.target.closest('.character-column');
    draggedColumn.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
```

**Key points:**
- Put `draggable="true"` on the **handle**, not the container
- Attach dragstart/dragend to handle, dragover/drop to container
- Use `cursor: grab` on both base and `:hover` states
- Add `user-select: none` to prevent text selection while dragging

### 4. Dice Rolling Systems

#### BitD d6 System (Blades, GothamReunion)

```javascript
import { showBladesDicePopup } from './blades-system.js';

showBladesDicePopup(skillName, diceCount, subtitle);
```

- 0 dice = roll 2, take worst
- 1-3 = Failure, 4-5 = Mixed, 6 = Success
- Two 6s = Critical
- Bonus dice: Assist, Push, Bargain buttons

#### FATE Fudge Dice System

```javascript
import { showFateDicePopup } from './fate-system.js';

showFateDicePopup(skillName, modifier);
```

- Roll 4dF (each die: -1, 0, +1)
- Add skill/approach rating
- Result mapped to FATE ladder
- Invoke buttons: +2 per invoke or reroll

### 4. Save/Load/Clear Pattern

All sheets use the autosave manager with beforeunload protection:

```javascript
import { createAutosaveManager, saveToStorage, downloadJSON } from './shared.js';

const autosave = createAutosaveManager(saveToLocalStorage);

// Schedule saves on input
autosave.schedule();

// File export with standardized naming
downloadJSON(data, 'FATE', characterName);
// Creates: "FATE - Character Name.char.json"
```

### 5. CSS Theming Pattern

Each sheet uses CSS custom properties:

```css
:root {
    --bg: #...;        /* Page background */
    --card: #...;      /* Section/card background */
    --input: #...;     /* Input field background */
    --accent: #...;    /* Primary accent color */
    --text: #...;      /* Main text color */
    --dim: #...;       /* Muted/secondary text */
    --border: #...;    /* Border color */
    --shadow: #...;    /* Box shadow color */
}
```

**Themes:**
- Gotham Reunion: Aged parchment (warm sepia tones)
- Blades: Dark industrial (black/gold/red)
- FATE: Modern clean (white/blue)

## Adding a New Character Sheet

1. Create `NewSystem.html` with semantic structure
2. Create `newsystem.css` using the theming pattern
3. Create `js/newsystem.js` as an ES6 module:
   - Import utilities from `shared.js`
   - Import system-specific utilities from `blades-system.js` or `fate-system.js` (or create new)
   - Implement state serialization (getCharacterData/loadCharacterData)
   - Use `createAutosaveManager()` for persistence
   - Use `manageDynamicRows()` for list sections
   - Use `setupSequentialTrack()` for pips/boxes
4. Add to HTML: `<script type="module" src="js/newsystem.js"></script>`

## Data Flow

```
User Input → autosave.schedule() → 1s debounce → saveToStorage()
                                                        ↓
Page Load → loadFromStorage() ← localStorage (JSON)
                                                        ↓
Export → downloadJSON() ← getCharacterData() → "$System - Name.char.json"
Import → setupFileLoader() → loadCharacterData() → DOM updates
```

## Testing Checklist

When modifying a character sheet:

- [ ] Dynamic rows add/remove correctly
- [ ] Clicking pips fills/clears as expected
- [ ] Dice roller shows correct results
- [ ] Data persists across page refresh (localStorage)
- [ ] Export downloads valid JSON with correct filename format
- [ ] Import restores all fields (including error handling for invalid files)
- [ ] Clear resets to defaults
- [ ] Beforeunload saves pending changes
- [ ] Responsive layout works on mobile
- [ ] Print styles hide controls

## Browser Compatibility

Requires modern browsers with ES6 module support:
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+
