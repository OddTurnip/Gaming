/**
 * Blades in the Dark - Character Sheet
 * @module blades
 */

import {
    createAutosaveManager,
    saveToStorage,
    loadFromStorage,
    showStatus,
    downloadJSON,
    setupFileLoader,
    manageDynamicRows,
    getTrackValue,
    setTrackValue,
    setupSequentialTrack,
    addAccessibilityLabels
} from './shared.js';

import {
    SYSTEM_NAME,
    LOAD_CAPACITY,
    getLoadCapacity,
    showBladesDicePopup
} from './blades-system.js';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'blades-character';

// ============================================================================
// State
// ============================================================================

let autosave = null;

// ============================================================================
// DOM References
// ============================================================================

const elements = {};

function cacheElements() {
    elements.charName = document.getElementById('char-name');
    elements.autosaveStatus = document.getElementById('autosave-status');
    elements.saveBtn = document.getElementById('save-btn');
    elements.loadBtn = document.getElementById('load-btn');
    elements.loadFile = document.getElementById('load-file');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.stressTrack = document.getElementById('stress-track');
    elements.traumaTrack = document.getElementById('trauma-track');
    elements.healingTrack = document.getElementById('healing-track');
    elements.loadTrack = document.getElementById('load-track');
    elements.abilitiesGrid = document.querySelector('.abilities-grid');
    elements.contactsBlock = document.querySelector('.contacts-block');
}

// ============================================================================
// Dynamic Rows: Abilities
// ============================================================================

let abilityIndex = 0;

function createAbilityRow() {
    const idx = abilityIndex++;
    const div = document.createElement('div');
    div.className = 'ability-row';
    div.dataset.ability = idx;
    div.innerHTML = `<input type="text" data-ability="${idx}" placeholder="Ability...">`;

    const input = div.querySelector('input');
    input.addEventListener('input', () => {
        manageAbilityRows();
        autosave.schedule();
    });
    input.addEventListener('change', () => autosave.schedule());
    return div;
}

function isAbilityRowEmpty(row) {
    const input = row.querySelector('input');
    return !input?.value?.trim();
}

function manageAbilityRows() {
    manageDynamicRows(elements.abilitiesGrid, '.ability-row', isAbilityRowEmpty, createAbilityRow);
}

// ============================================================================
// Dynamic Rows: Contacts
// ============================================================================

let contactIndex = 0;

function createContactRow() {
    const idx = contactIndex++;
    const div = document.createElement('div');
    div.className = 'contact';
    div.innerHTML = `<select data-contact-status="${idx}"><option value="friend">🙂</option><option value="neutral" selected>😐</option><option value="rival">😠</option></select><input type="text" data-contact-name="${idx}" placeholder="Name"><input type="text" data-contact-desc="${idx}" placeholder="Info">`;

    div.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', () => {
            manageContactRows();
            autosave.schedule();
        });
        el.addEventListener('change', () => autosave.schedule());
    });
    return div;
}

function isContactRowEmpty(row) {
    const nameInput = row.querySelector('input[data-contact-name]');
    const descInput = row.querySelector('input[data-contact-desc]');
    return !nameInput?.value?.trim() && !descInput?.value?.trim();
}

function manageContactRows() {
    manageDynamicRows(elements.contactsBlock, '.contact', isContactRowEmpty, createContactRow);
}

// ============================================================================
// Clickable Tracks
// ============================================================================

function setupClickableTracks() {
    // Action dots
    document.querySelectorAll('.dots').forEach(container => {
        setupSequentialTrack(container, () => autosave.schedule());
    });

    // Stress track
    if (elements.stressTrack) {
        setupSequentialTrack(elements.stressTrack, () => autosave.schedule());
    }

    // Trauma boxes
    if (elements.traumaTrack) {
        setupSequentialTrack(elements.traumaTrack, () => autosave.schedule());
    }

    // Healing track
    if (elements.healingTrack) {
        setupSequentialTrack(elements.healingTrack, () => autosave.schedule());
    }

    // XP tracks
    document.querySelectorAll('.xp-track, .playbook-xp-track').forEach(track => {
        setupSequentialTrack(track, () => autosave.schedule());
    });
}

// ============================================================================
// Load Track
// ============================================================================

function updateLoadTrack() {
    const loadRadio = document.querySelector('input[name="load"]:checked');
    const loadType = loadRadio?.value || 'light';
    const maxLoad = getLoadCapacity(loadType);

    // Save current filled count
    let currentFilled = getTrackValue(elements.loadTrack);

    // Rebuild
    elements.loadTrack.innerHTML = '';
    for (let i = 0; i < maxLoad; i++) {
        const b = document.createElement('b');
        if (i < currentFilled) b.classList.add('filled');
        elements.loadTrack.appendChild(b);
    }

    setupSequentialTrack(elements.loadTrack, () => autosave.schedule());
}

// ============================================================================
// Dice Rolling
// ============================================================================

function setupDiceRolling() {
    document.querySelectorAll('.action').forEach(action => {
        const nameSpan = action.querySelector('span');
        const dotsContainer = action.querySelector('.dots');
        if (nameSpan && dotsContainer) {
            nameSpan.classList.add('rollable');
            nameSpan.addEventListener('click', () => {
                const skillName = nameSpan.textContent;
                const filledDots = getTrackValue(dotsContainer);
                showBladesDicePopup(skillName, filledDots);
            });
        }
    });
}

// ============================================================================
// State Management
// ============================================================================

function getCharacterData() {
    const data = {
        name: document.getElementById('char-name')?.value || '',
        alias: document.getElementById('char-alias')?.value || '',
        playbook: document.getElementById('char-playbook')?.value || '',
        crew: document.getElementById('char-crew')?.value || '',
        heritage: document.getElementById('char-heritage')?.value || '',
        background: document.getElementById('char-background')?.value || '',
        vice: document.getElementById('char-vice')?.value || '',
        look: document.getElementById('char-look')?.value || '',
        traumaList: document.getElementById('trauma-list')?.value || '',
        notes: document.getElementById('notes')?.value || '',
        actions: {},
        stress: 0,
        trauma: 0,
        healing: 0,
        load: 'light',
        loadFilled: 0,
        xp: {},
        harm: {},
        armor: {},
        abilities: [],
        contacts: []
    };

    // Actions
    document.querySelectorAll('.dots').forEach(container => {
        const action = container.dataset.action;
        data.actions[action] = getTrackValue(container);
    });

    // Stress
    data.stress = getTrackValue(elements.stressTrack);

    // Trauma
    data.trauma = getTrackValue(elements.traumaTrack);

    // Healing
    data.healing = getTrackValue(elements.healingTrack);

    // Load
    const loadRadio = document.querySelector('input[name="load"]:checked');
    data.load = loadRadio?.value || 'light';
    data.loadFilled = getTrackValue(elements.loadTrack);

    // XP
    document.querySelectorAll('.xp-track, .playbook-xp-track').forEach(track => {
        const xpType = track.dataset.xp;
        data.xp[xpType] = getTrackValue(track);
    });

    // Harm
    document.querySelectorAll('[data-harm]').forEach(input => {
        data.harm[input.dataset.harm] = input.value;
    });

    // Armor
    document.querySelectorAll('[data-armor]').forEach(checkbox => {
        data.armor[checkbox.dataset.armor] = checkbox.checked;
    });

    // Abilities
    document.querySelectorAll('.ability-row').forEach(row => {
        const input = row.querySelector('input');
        if (input?.value?.trim()) {
            data.abilities.push(input.value.trim());
        }
    });

    // Contacts
    const contactIndices = new Set();
    document.querySelectorAll('[data-contact-status]').forEach(el => {
        contactIndices.add(el.dataset.contactStatus);
    });
    contactIndices.forEach(i => {
        const status = document.querySelector(`[data-contact-status="${i}"]`);
        const name = document.querySelector(`[data-contact-name="${i}"]`);
        const desc = document.querySelector(`[data-contact-desc="${i}"]`);
        if (name?.value?.trim() || desc?.value?.trim()) {
            data.contacts.push({
                status: status?.value || 'neutral',
                name: name?.value?.trim() || '',
                description: desc?.value?.trim() || ''
            });
        }
    });

    return data;
}

function loadCharacterData(data) {
    if (!data) return;

    // Text fields
    const textFields = ['name', 'alias', 'playbook', 'crew', 'heritage', 'background', 'vice', 'look'];
    textFields.forEach(f => {
        const el = document.getElementById(`char-${f}`);
        if (el && data[f] !== undefined) el.value = data[f];
    });

    if (data.traumaList !== undefined) {
        document.getElementById('trauma-list').value = data.traumaList;
    }
    if (data.notes !== undefined) {
        document.getElementById('notes').value = data.notes;
    }

    // Actions
    if (data.actions) {
        Object.entries(data.actions).forEach(([action, value]) => {
            const container = document.querySelector(`[data-action="${action}"]`);
            if (container) setTrackValue(container, value);
        });
    }

    // Stress
    if (data.stress !== undefined) {
        setTrackValue(elements.stressTrack, data.stress);
    }

    // Trauma
    if (data.trauma !== undefined) {
        setTrackValue(elements.traumaTrack, data.trauma);
    }

    // Healing
    if (data.healing !== undefined) {
        setTrackValue(elements.healingTrack, data.healing);
    }

    // Load
    if (data.load) {
        const radio = document.querySelector(`input[name="load"][value="${data.load}"]`);
        if (radio) radio.checked = true;
    }
    updateLoadTrack();
    if (data.loadFilled !== undefined) {
        setTrackValue(elements.loadTrack, data.loadFilled);
    }

    // XP
    if (data.xp) {
        Object.entries(data.xp).forEach(([xpType, value]) => {
            const track = document.querySelector(`[data-xp="${xpType}"]`);
            if (track) setTrackValue(track, value);
        });
    }

    // Harm
    if (data.harm) {
        Object.entries(data.harm).forEach(([slot, value]) => {
            const input = document.querySelector(`[data-harm="${slot}"]`);
            if (input) input.value = value;
        });
    }

    // Armor
    if (data.armor) {
        Object.entries(data.armor).forEach(([type, checked]) => {
            const checkbox = document.querySelector(`[data-armor="${type}"]`);
            if (checkbox) checkbox.checked = checked;
        });
    }

    // Abilities
    if (elements.abilitiesGrid) {
        elements.abilitiesGrid.querySelectorAll('.ability-row').forEach(el => el.remove());
        abilityIndex = 0;
        const abilities = data.abilities || [];
        abilities.forEach(a => {
            const row = createAbilityRow();
            elements.abilitiesGrid.appendChild(row);
            const input = row.querySelector('input');
            // Handle both old format (object) and new format (string)
            if (input) input.value = typeof a === 'string' ? a : (a.name || '');
        });
        manageAbilityRows();
    }

    // Contacts
    if (elements.contactsBlock) {
        elements.contactsBlock.querySelectorAll('.contact').forEach(el => el.remove());
        contactIndex = 0;
        const contacts = data.contacts || [];
        contacts.forEach(c => {
            const row = createContactRow();
            elements.contactsBlock.appendChild(row);
            const idx = row.querySelector('select').dataset.contactStatus;
            const status = row.querySelector(`[data-contact-status="${idx}"]`);
            const name = row.querySelector(`[data-contact-name="${idx}"]`);
            const desc = row.querySelector(`[data-contact-desc="${idx}"]`);
            if (status) status.value = c.status;
            if (name) name.value = c.name;
            if (desc) desc.value = c.description;
        });
        manageContactRows();
    }
}

function resetToDefaults() {
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => el.value = '');
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    document.querySelectorAll('.dots b, #stress-track b, #trauma-track b, #healing-track b, .xp-track i, .playbook-xp-track i').forEach(el => el.classList.remove('filled'));

    document.getElementById('char-playbook').value = '';
    const lightRadio = document.querySelector('input[name="load"][value="light"]');
    if (lightRadio) lightRadio.checked = true;

    // Reset dynamic rows
    if (elements.abilitiesGrid) {
        elements.abilitiesGrid.querySelectorAll('.ability-row').forEach(el => el.remove());
        abilityIndex = 0;
        elements.abilitiesGrid.appendChild(createAbilityRow());
    }

    if (elements.contactsBlock) {
        elements.contactsBlock.querySelectorAll('.contact').forEach(el => el.remove());
        contactIndex = 0;
        elements.contactsBlock.appendChild(createContactRow());
    }

    updateLoadTrack();
}

// ============================================================================
// Persistence
// ============================================================================

function saveToLocalStorage() {
    saveToStorage(STORAGE_KEY, getCharacterData(), elements.autosaveStatus);
}

function loadFromLocalStorage() {
    const data = loadFromStorage(STORAGE_KEY, elements.autosaveStatus);
    if (data) {
        loadCharacterData(data);
        return true;
    }
    return false;
}

function saveToFile() {
    const data = getCharacterData();
    const charName = data.name || data.alias || 'character';
    downloadJSON(data, SYSTEM_NAME, charName);
}

// ============================================================================
// Setup
// ============================================================================

function setupButtons() {
    elements.saveBtn?.addEventListener('click', saveToFile);

    setupFileLoader(elements.loadBtn, elements.loadFile, (data) => {
        loadCharacterData(data);
        saveToLocalStorage();
    }, elements.autosaveStatus);

    elements.clearBtn?.addEventListener('click', () => {
        if (confirm('Clear all data?')) {
            resetToDefaults();
            saveToLocalStorage();
        }
    });
}

function setupAutosaveListeners() {
    document.querySelectorAll('input[type="text"]:not([data-ability]):not([data-contact-name]):not([data-contact-desc]), textarea, select').forEach(el => {
        el.addEventListener('change', () => autosave.schedule());
        if ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA') {
            el.addEventListener('input', () => autosave.schedule());
        }
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
        el.addEventListener('change', () => autosave.schedule());
    });

    // Load radio buttons
    document.querySelectorAll('input[name="load"]').forEach(r => {
        r.addEventListener('change', () => {
            updateLoadTrack();
            autosave.schedule();
        });
    });
}

function init() {
    cacheElements();

    autosave = createAutosaveManager(saveToLocalStorage);

    setupClickableTracks();
    updateLoadTrack();
    setupButtons();
    setupAutosaveListeners();
    setupDiceRolling();

    if (!loadFromLocalStorage()) {
        manageAbilityRows();
        manageContactRows();
    }

    manageAbilityRows();
    manageContactRows();

    // Accessibility: add aria-labels to inputs with placeholders
    addAccessibilityLabels();
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
