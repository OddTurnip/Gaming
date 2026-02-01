/**
 * FATE Group Tracker
 * Manages multiple character columns for GM tracking
 * @module fate-group
 */

import {
    createAutosaveManager,
    saveToStorage,
    loadFromStorage,
    clearStorage,
    showStatus,
    downloadJSON,
    readJSONFile,
    setupFileLoader,
    manageDynamicRows,
    getTrackValue,
    setTrackValue,
    setupSequentialTrack,
    setupIndividualToggleTrack,
    generateId,
    addAccessibilityLabels
} from './shared.js';

import {
    SYSTEM_NAME,
    FATE_VERSIONS,
    DEFAULT_VERSION,
    getStressBoxCount,
    usesIndividualStress,
    convertFateToGroupFormat,
    convertGroupToFateFormat,
    isSingleCharacterFormat,
    isGroupFormat,
    storeCharacterForTransfer,
    getTransferredCharacter
} from './fate-system.js';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'fate-group-tracker';
const DATA_VERSION = 2;

// Default collapse states for sections
const DEFAULT_COLLAPSE_STATES = {
    combat: false,
    aspects: false,
    skills: true,
    stunts: true
};

// ============================================================================
// State
// ============================================================================

let autosave = null;
let characterIdCounter = 0;
let globalCollapsed = { ...DEFAULT_COLLAPSE_STATES };
let fateVersion = DEFAULT_VERSION;

// ============================================================================
// DOM References
// ============================================================================

const elements = {};

function cacheElements() {
    elements.container = document.getElementById('characters-container');
    elements.template = document.getElementById('character-template');
    elements.addCharBtn = document.getElementById('add-char-btn');
    elements.addNpcBtn = document.getElementById('add-npc-btn');
    elements.importCharBtn = document.getElementById('import-char-btn');
    elements.importCharFile = document.getElementById('import-char-file');
    elements.saveBtn = document.getElementById('save-btn');
    elements.loadBtn = document.getElementById('load-btn');
    elements.loadFile = document.getElementById('load-file');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.autosaveStatus = document.getElementById('autosave-status');
    elements.fateVersionSelect = document.getElementById('fate-version');
    elements.newTurnBtn = document.getElementById('new-turn-btn');
}

// ============================================================================
// Character Management
// ============================================================================

function addCharacter(data = null, isNpc = false) {
    const clone = elements.template.content.cloneNode(true);
    const column = clone.querySelector('.character-column');

    const id = data?.id || generateId('char');
    column.dataset.charId = id;

    // Track max ID for counter
    const idNum = parseInt(id.split('-')[1], 10);
    if (!isNaN(idNum) && idNum > characterIdCounter) {
        characterIdCounter = idNum;
    }

    // NPC mode
    const npcMode = data?.isNpc ?? isNpc;
    if (npcMode) {
        column.classList.add('npc');
        column.dataset.isNpc = 'true';
    }

    // Setup boost boxes
    setupBoostBoxes(column);

    // Setup stunts list (PC only)
    if (!npcMode) {
        const stuntsList = column.querySelector('.stunts-list');
        addStuntRow(stuntsList, '');
    }

    // Apply global collapse states (PC only)
    if (!npcMode) {
        applyGlobalCollapseStates(column);
    }

    // Populate data if provided
    if (data) {
        populateCharacterColumn(column, data);
    } else {
        updateStressBoxes(column);
    }

    // Setup event listeners
    setupCharacterListeners(column);

    elements.container.appendChild(column);

    // Focus name field for new characters
    if (!data) {
        column.querySelector('.char-name').focus();
    }

    updateNewTurnButton();
    autosave.schedule();
    return column;
}

function applyGlobalCollapseStates(column) {
    Object.entries(globalCollapsed).forEach(([section, isCollapsed]) => {
        const content = column.querySelector(`[data-content="${section}"]`);
        const toggle = column.querySelector(`[data-toggle="${section}"]`);
        if (content && toggle) {
            content.classList.toggle('collapsed', isCollapsed);
            toggle.querySelector('.toggle-icon').textContent = isCollapsed ? '▶' : '▼';
        }
    });
}

function toggleAllSections(sectionName) {
    globalCollapsed[sectionName] = !globalCollapsed[sectionName];
    const isCollapsed = globalCollapsed[sectionName];

    elements.container.querySelectorAll('.character-column').forEach(column => {
        const content = column.querySelector(`[data-content="${sectionName}"]`);
        const toggle = column.querySelector(`[data-toggle="${sectionName}"]`);
        if (content && toggle) {
            content.classList.toggle('collapsed', isCollapsed);
            toggle.querySelector('.toggle-icon').textContent = isCollapsed ? '▶' : '▼';
        }
    });

    autosave.schedule();
}

function populateCharacterColumn(column, data) {
    // Name
    column.querySelector('.char-name').value = data.name || '';

    // Fate Points
    column.querySelector('.fp-value').textContent = data.fatePoints ?? 3;

    // Acted checkbox
    if (data.acted !== undefined) {
        column.querySelector('.acted-checkbox').checked = data.acted;
    }

    // Boosts
    const boostCount = typeof data.boosts === 'number' ? data.boosts : (Array.isArray(data.boosts) ? data.boosts.length : 0);
    if (boostCount > 0) {
        setTrackValue(column.querySelector('.boost-boxes'), boostCount);
    }

    // Skills (populate first for stress calculation)
    if (data.skills) {
        Object.entries(data.skills).forEach(([skill, rating]) => {
            const dots = column.querySelector(`[data-skill="${skill}"]`);
            if (dots) setTrackValue(dots, rating);
        });
    }

    // Update stress boxes based on skills
    updateStressBoxes(column);

    // Populate stress state
    if (data.physicalStress) {
        const physBoxes = column.querySelectorAll('.physical-stress b');
        data.physicalStress.forEach((filled, i) => {
            if (physBoxes[i] && filled) physBoxes[i].classList.add('filled');
        });
    }
    if (data.mentalStress) {
        const mentBoxes = column.querySelectorAll('.mental-stress b');
        data.mentalStress.forEach((filled, i) => {
            if (mentBoxes[i] && filled) mentBoxes[i].classList.add('filled');
        });
    }

    // Consequences
    if (data.consequences) {
        Object.entries(data.consequences).forEach(([key, value]) => {
            const input = column.querySelector(`[data-cons="${key}"]`);
            if (input) input.value = value;
        });
    }

    // Aspects
    if (data.aspects) {
        Object.entries(data.aspects).forEach(([key, value]) => {
            const input = column.querySelector(`[data-aspect="${key}"]`);
            if (input) input.value = value;
        });
    }

    // Stunts
    if (data.stunts && data.stunts.length > 0) {
        const stuntsList = column.querySelector('.stunts-list');
        stuntsList.innerHTML = '';
        data.stunts.forEach(stunt => addStuntRow(stuntsList, stunt));
        addStuntRow(stuntsList, '');
    }
}

function setupCharacterListeners(column) {
    // Remove button
    column.querySelector('.remove-char-btn').addEventListener('click', () => {
        if (confirm('Remove this character?')) {
            column.remove();
            updateNewTurnButton();
            autosave.schedule();
        }
    });

    // View details button
    const viewBtn = column.querySelector('.view-details-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            const charData = getCharacterData(column);
            const fateData = convertGroupToFateFormat(charData);
            fateData.altRules = fateData.altRules || {};
            fateData.altRules.fateVersion = fateVersion;
            storeCharacterForTransfer(fateData, 'CHARACTER');
            saveToLocalStorage();
            window.location.href = 'Fate.html?from=group&id=' + encodeURIComponent(charData.id);
        });
    }

    // Export single character
    const exportBtn = column.querySelector('.export-char-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const charData = getCharacterData(column);
            const fateData = convertGroupToFateFormat(charData);
            fateData.altRules = fateData.altRules || {};
            fateData.altRules.fateVersion = fateVersion;
            downloadJSON(fateData, SYSTEM_NAME, charData.name || 'character');
        });
    }

    // Fate Points buttons
    const fpValue = column.querySelector('.fp-value');
    column.querySelector('.fp-btn.minus').addEventListener('click', () => {
        const current = parseInt(fpValue.textContent) || 0;
        if (current > 0) {
            fpValue.textContent = current - 1;
            autosave.schedule();
        }
    });
    column.querySelector('.fp-btn.plus').addEventListener('click', () => {
        const current = parseInt(fpValue.textContent) || 0;
        fpValue.textContent = current + 1;
        autosave.schedule();
    });

    // Acted checkbox
    column.querySelector('.acted-checkbox').addEventListener('change', () => {
        updateNewTurnButton();
        autosave.schedule();
    });

    // Skill dots
    column.querySelectorAll('.skill-dots').forEach(dotsContainer => {
        const skillName = dotsContainer.dataset.skill;
        setupSequentialTrack(dotsContainer, () => {
            if (skillName === 'physique' || skillName === 'will') {
                updateStressBoxes(column);
            }
            autosave.schedule();
        });
    });

    // Section toggles
    column.querySelectorAll('.toggle-section').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const sectionName = toggle.dataset.toggle;
            toggleAllSections(sectionName);
        });
    });

    // Input autosave
    column.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('input', () => autosave.schedule());
    });

    // Drag and drop
    setupDragAndDrop(column);
}

// ============================================================================
// Drag and Drop
// ============================================================================

let draggedColumn = null;

function setupDragAndDrop(column) {
    const handle = column.querySelector('.drag-handle');

    // Drag events on the handle (so text selection works elsewhere)
    handle.addEventListener('dragstart', handleDragStart);
    handle.addEventListener('dragend', handleDragEnd);

    // Drop target events on the column
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('dragleave', handleDragLeave);
    column.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    // Get the parent column from the drag handle
    draggedColumn = e.target.closest('.character-column');
    draggedColumn.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedColumn.dataset.charId);
}

function handleDragEnd(e) {
    if (draggedColumn) {
        draggedColumn.classList.remove('dragging');
    }
    clearAllDragOverStates();
    draggedColumn = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const column = e.currentTarget;
    if (column === draggedColumn) return;

    clearAllDragOverStates();

    // Determine if we're on the left or right half
    const rect = column.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    if (e.clientX < midpoint) {
        column.classList.add('drag-over');
    } else {
        column.classList.add('drag-over-right');
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over', 'drag-over-right');
}

function handleDrop(e) {
    e.preventDefault();
    const targetColumn = e.currentTarget;

    if (!draggedColumn || targetColumn === draggedColumn) {
        clearAllDragOverStates();
        return;
    }

    // Determine insertion position based on drop location
    const rect = targetColumn.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const insertBefore = e.clientX < midpoint;

    if (insertBefore) {
        elements.container.insertBefore(draggedColumn, targetColumn);
    } else {
        elements.container.insertBefore(draggedColumn, targetColumn.nextSibling);
    }

    clearAllDragOverStates();
    autosave.schedule();
}

function clearAllDragOverStates() {
    elements.container.querySelectorAll('.character-column').forEach(col => {
        col.classList.remove('drag-over', 'drag-over-right');
    });
}

// ============================================================================
// New Turn Button
// ============================================================================

function updateNewTurnButton() {
    if (!elements.newTurnBtn) return;

    const checkboxes = elements.container.querySelectorAll('.acted-checkbox');
    if (checkboxes.length === 0) {
        elements.newTurnBtn.classList.remove('ready');
        return;
    }

    const allActed = Array.from(checkboxes).every(cb => cb.checked);
    elements.newTurnBtn.classList.toggle('ready', allActed);
}

// ============================================================================
// Stress Boxes
// ============================================================================

function getSkillRating(column, skillName) {
    const dots = column.querySelector(`[data-skill="${skillName}"]`);
    return getTrackValue(dots);
}

function updateStressBoxes(column) {
    const physiqueRating = getSkillRating(column, 'physique');
    const willRating = getSkillRating(column, 'will');

    updateStressTrack(column.querySelector('.physical-stress'), physiqueRating);
    updateStressTrack(column.querySelector('.mental-stress'), willRating);
}

function updateStressTrack(trackElement, skillRating) {
    if (!trackElement) return;

    const boxCount = getStressBoxCount(skillRating, fateVersion);
    const useIndividual = usesIndividualStress(fateVersion);

    // Get current state
    const currentBoxes = trackElement.querySelectorAll('b');
    let filledState = [];
    let filledCount = 0;

    currentBoxes.forEach((b, i) => {
        const isFilled = b.classList.contains('filled');
        filledState.push(isFilled);
        if (isFilled) filledCount++;
    });

    // Rebuild boxes
    trackElement.innerHTML = '';
    for (let i = 0; i < boxCount; i++) {
        const box = document.createElement('b');
        box.dataset.val = i + 1;

        if (fateVersion === FATE_VERSIONS.CORE) {
            box.textContent = i + 1;
        }

        // Restore filled state
        if (useIndividual) {
            if (filledState[i]) box.classList.add('filled');
        } else {
            if (i < filledCount) box.classList.add('filled');
        }

        // Setup click handler
        setupStressBoxClick(box, trackElement);
        trackElement.appendChild(box);
    }
}

function setupStressBoxClick(box, trackElement) {
    box.addEventListener('click', () => {
        if (usesIndividualStress(fateVersion)) {
            box.classList.toggle('filled');
        } else {
            const boxes = trackElement.querySelectorAll('b');
            const idx = Array.from(boxes).indexOf(box);
            const filledCount = Array.from(boxes).filter(b => b.classList.contains('filled')).length;

            if (filledCount === idx + 1) {
                boxes.forEach(b => b.classList.remove('filled'));
            } else {
                boxes.forEach((b, i) => b.classList.toggle('filled', i <= idx));
            }
        }
        autosave.schedule();
    });
}

// ============================================================================
// Boost Boxes
// ============================================================================

function setupBoostBoxes(column) {
    const container = column.querySelector('.boost-boxes');
    if (!container) return;
    setupSequentialTrack(container, () => autosave.schedule());
}

// ============================================================================
// Stunts
// ============================================================================

function addStuntRow(container, value = '') {
    const row = document.createElement('div');
    row.className = 'stunt-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'stunt-input';
    input.placeholder = 'Stunt...';
    input.value = value;

    input.addEventListener('input', () => {
        manageStuntRows(container);
        autosave.schedule();
    });

    row.appendChild(input);
    container.appendChild(row);
    return row;
}

function manageStuntRows(container) {
    manageDynamicRows(
        container,
        '.stunt-row',
        (row) => !row.querySelector('.stunt-input')?.value?.trim(),
        () => addStuntRow(container, '')
    );
}

// ============================================================================
// Data Serialization
// ============================================================================

function getCharacterData(column) {
    const isNpc = column.classList.contains('npc');
    const data = {
        id: column.dataset.charId,
        isNpc: isNpc,
        name: column.querySelector('.char-name').value,
        fatePoints: isNpc ? 0 : (parseInt(column.querySelector('.fp-value').textContent) || 0),
        acted: column.querySelector('.acted-checkbox').checked,
        boosts: getTrackValue(column.querySelector('.boost-boxes')),
        physicalStress: [],
        mentalStress: [],
        consequences: {},
        aspects: {},
        skills: {},
        stunts: []
    };

    // Stress
    column.querySelectorAll('.physical-stress b').forEach(b => {
        data.physicalStress.push(b.classList.contains('filled'));
    });
    column.querySelectorAll('.mental-stress b').forEach(b => {
        data.mentalStress.push(b.classList.contains('filled'));
    });

    // Consequences
    column.querySelectorAll('.cons-input').forEach(input => {
        data.consequences[input.dataset.cons] = input.value;
    });

    // Aspects
    column.querySelectorAll('.aspect-input').forEach(input => {
        data.aspects[input.dataset.aspect] = input.value;
    });

    // Skills
    column.querySelectorAll('.skill-dots').forEach(dots => {
        data.skills[dots.dataset.skill] = getTrackValue(dots);
    });

    // Stunts
    column.querySelectorAll('.stunt-input').forEach(input => {
        if (input.value.trim()) {
            data.stunts.push(input.value);
        }
    });

    return data;
}

function getAllData() {
    const characters = [];
    elements.container.querySelectorAll('.character-column').forEach(column => {
        characters.push(getCharacterData(column));
    });
    return {
        version: DATA_VERSION,
        characterIdCounter,
        globalCollapsed,
        fateVersion,
        characters
    };
}

function loadAllData(data) {
    elements.container.innerHTML = '';

    if (data.characterIdCounter) {
        characterIdCounter = data.characterIdCounter;
    }

    if (data.globalCollapsed) {
        globalCollapsed = { ...DEFAULT_COLLAPSE_STATES, ...data.globalCollapsed };
    }

    if (data.fateVersion) {
        fateVersion = data.fateVersion;
        if (elements.fateVersionSelect) {
            elements.fateVersionSelect.value = fateVersion;
        }
    }

    if (data.characters && data.characters.length > 0) {
        data.characters.forEach(charData => addCharacter(charData));
    } else {
        addCharacter();
    }
}

// ============================================================================
// Persistence
// ============================================================================

function saveToLocalStorage() {
    saveToStorage(STORAGE_KEY, getAllData(), elements.autosaveStatus);
}

function loadFromLocalStorage() {
    const data = loadFromStorage(STORAGE_KEY, elements.autosaveStatus);
    if (data) {
        loadAllData(data);
        return true;
    }
    return false;
}

function saveToFile() {
    const data = getAllData();
    // Use first character name or 'group' for filename
    const firstName = data.characters?.[0]?.name;
    const groupName = firstName ? `${firstName} group` : 'group';
    downloadJSON(data, SYSTEM_NAME, groupName);
}

function loadFromFile(data) {
    loadAllData(data);
    saveToLocalStorage();
}

function importSingleCharacter(file) {
    readJSONFile(file).then(data => {
        if (isSingleCharacterFormat(data)) {
            // Sync fateVersion if importing into empty group
            if (data.altRules?.fateVersion && elements.container.children.length <= 1) {
                fateVersion = data.altRules.fateVersion;
                if (elements.fateVersionSelect) {
                    elements.fateVersionSelect.value = fateVersion;
                }
                elements.container.querySelectorAll('.character-column').forEach(col => {
                    updateStressBoxes(col);
                });
            }
            const groupData = convertFateToGroupFormat(data);
            addCharacter(groupData);
            saveToLocalStorage();
        } else if (isGroupFormat(data)) {
            if (confirm(`This file contains ${data.characters.length} character(s). Import all?`)) {
                if (data.fateVersion) {
                    fateVersion = data.fateVersion;
                    if (elements.fateVersionSelect) {
                        elements.fateVersionSelect.value = fateVersion;
                    }
                }
                data.characters.forEach(charData => addCharacter(charData));
                saveToLocalStorage();
            }
        } else {
            alert('Unrecognized file format');
        }
    }).catch(err => {
        console.error('Import error:', err);
        alert('Invalid file format');
    });
}

// ============================================================================
// Character Return from Fate.html
// ============================================================================

function updateCharacterFromReturn(fateData) {
    const charId = fateData._groupCharId;
    if (!charId) return;

    // Sync fateVersion if changed
    if (fateData.altRules?.fateVersion && fateData.altRules.fateVersion !== fateVersion) {
        fateVersion = fateData.altRules.fateVersion;
        if (elements.fateVersionSelect) {
            elements.fateVersionSelect.value = fateVersion;
        }
        elements.container.querySelectorAll('.character-column').forEach(col => {
            if (col.dataset.charId !== charId) {
                updateStressBoxes(col);
            }
        });
    }

    const groupData = convertFateToGroupFormat(fateData);
    groupData.id = charId;

    const column = elements.container.querySelector(`[data-char-id="${charId}"]`);
    if (column) {
        populateCharacterColumn(column, groupData);
        saveToLocalStorage();
    }
}

// ============================================================================
// Setup
// ============================================================================

function setupGlobalListeners() {
    elements.addCharBtn.addEventListener('click', () => addCharacter(null, false));
    elements.addNpcBtn.addEventListener('click', () => addCharacter(null, true));

    elements.newTurnBtn?.addEventListener('click', () => {
        elements.container.querySelectorAll('.acted-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateNewTurnButton();
        autosave.schedule();
    });

    elements.fateVersionSelect?.addEventListener('change', (e) => {
        fateVersion = e.target.value;
        elements.container.querySelectorAll('.character-column').forEach(column => {
            updateStressBoxes(column);
        });
        autosave.schedule();
    });

    elements.importCharBtn.addEventListener('click', () => elements.importCharFile.click());
    elements.importCharFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importSingleCharacter(e.target.files[0]);
            e.target.value = '';
        }
    });

    elements.saveBtn.addEventListener('click', saveToFile);

    setupFileLoader(elements.loadBtn, elements.loadFile, loadFromFile, elements.autosaveStatus);

    elements.clearBtn.addEventListener('click', () => {
        if (confirm('Clear all characters? This cannot be undone.')) {
            clearStorage(STORAGE_KEY);
            elements.container.innerHTML = '';
            characterIdCounter = 0;
            globalCollapsed = { ...DEFAULT_COLLAPSE_STATES };
            fateVersion = DEFAULT_VERSION;
            if (elements.fateVersionSelect) {
                elements.fateVersionSelect.value = fateVersion;
            }
            addCharacter();
        }
    });
}

function init() {
    cacheElements();

    autosave = createAutosaveManager(saveToLocalStorage);

    if (!loadFromLocalStorage()) {
        // No saved data, start with one character
        addCharacter();
    }

    setupGlobalListeners();

    // Check for character from Fate.html
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
        const charData = getTransferredCharacter('ADD_TO_GROUP');
        if (charData) {
            if (charData._fateExtras?.altRules?.fateVersion && elements.container.children.length <= 1) {
                fateVersion = charData._fateExtras.altRules.fateVersion;
                if (elements.fateVersionSelect) {
                    elements.fateVersionSelect.value = fateVersion;
                }
            }
            addCharacter(charData);
            saveToLocalStorage();
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

    // Check for return from Fate.html
    const returnedCharData = getTransferredCharacter('RETURN_TO_GROUP');
    if (returnedCharData) {
        updateCharacterFromReturn(returnedCharData);
        window.history.replaceState({}, '', window.location.pathname);
    }

    updateNewTurnButton();

    // Accessibility: add aria-labels to inputs with placeholders
    addAccessibilityLabels();
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
