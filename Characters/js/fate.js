/**
 * FATE - Character Sheet
 * Main sheet-specific JavaScript
 * @module fate
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
    setupIndividualToggleTrack,
    getFilledIndices,
    setFilledIndices,
    addAccessibilityLabels
} from './shared.js';

import {
    SYSTEM_NAME,
    FATE_VERSIONS,
    DEFAULT_VERSION,
    getStressBoxCount,
    usesIndividualStress,
    showFateDicePopup,
    convertFateToGroupFormat,
    storeCharacterForTransfer,
    getTransferredCharacter
} from './fate-system.js';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'fate-character';

// ============================================================================
// State
// ============================================================================

let autosave = null;
let fromGroup = false;
let groupCharId = null;

// ============================================================================
// DOM References (initialized in init)
// ============================================================================

const elements = {};

function cacheElements() {
    elements.charName = document.getElementById('char-name');
    elements.autosaveStatus = document.getElementById('autosave-status');
    elements.saveBtn = document.getElementById('save-btn');
    elements.loadBtn = document.getElementById('load-btn');
    elements.loadFile = document.getElementById('load-file');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.addToGroupBtn = document.getElementById('add-to-group-btn');
    elements.backToGroup = document.getElementById('back-to-group');
    elements.physicalStress = document.getElementById('physical-stress');
    elements.mentalStress = document.getElementById('mental-stress');
    elements.skillsSection = document.getElementById('skills-section');
    elements.approachesSection = document.getElementById('approaches-section');
    elements.stuntsGrid = document.querySelector('.stunts-grid');
    elements.extrasGrid = document.querySelector('.extras-grid');
    elements.fateCurrentValue = document.getElementById('fate-current-value');
    elements.fateRefreshValue = document.getElementById('fate-refresh-value');
    elements.stuntAdd = document.getElementById('stunt-add');
    elements.stuntRemove = document.getElementById('stunt-remove');
    elements.mildPhysicalRow = document.getElementById('mild-physical-row');
    elements.mildMentalRow = document.getElementById('mild-mental-row');
}

// ============================================================================
// FATE Version Management
// ============================================================================

function getFateVersion() {
    if (document.getElementById('fate-core')?.checked) return FATE_VERSIONS.CORE;
    if (document.getElementById('fate-accelerated')?.checked) return FATE_VERSIONS.ACCELERATED;
    return FATE_VERSIONS.CONDENSED;
}

function setFateVersion(version) {
    document.getElementById('fate-condensed').checked = (version === FATE_VERSIONS.CONDENSED);
    document.getElementById('fate-core').checked = (version === FATE_VERSIONS.CORE);
    document.getElementById('fate-accelerated').checked = (version === FATE_VERSIONS.ACCELERATED);
}

function updateSkillsApproachesVisibility() {
    const version = getFateVersion();
    if (version === FATE_VERSIONS.ACCELERATED) {
        if (elements.skillsSection) elements.skillsSection.style.display = 'none';
        if (elements.approachesSection) elements.approachesSection.style.display = 'block';
    } else {
        if (elements.skillsSection) elements.skillsSection.style.display = 'block';
        if (elements.approachesSection) elements.approachesSection.style.display = 'none';
    }
}

// ============================================================================
// Skill/Approach Ratings
// ============================================================================

function getSkillRating(skill) {
    const container = document.querySelector(`[data-skill-rating="${skill}"]`);
    return getTrackValue(container);
}

function setupSkillRatings() {
    document.querySelectorAll('.skill-rating').forEach(container => {
        const skill = container.dataset.skillRating;
        // Label boxes with ladder values
        container.querySelectorAll('b').forEach((box, i) => {
            box.textContent = `+${i + 1}`;
        });

        setupSequentialTrack(container, () => {
            // Update stress tracks if Physique or Will changed
            if (skill === 'physique' || skill === 'will') {
                updateStressTracks();
            }
            autosave.schedule();
        });
    });
}

function setupApproachRatings() {
    document.querySelectorAll('.approach-rating').forEach(container => {
        // Label boxes with ladder values
        container.querySelectorAll('b').forEach((box, i) => {
            box.textContent = `+${i + 1}`;
        });

        setupSequentialTrack(container, () => {
            autosave.schedule();
        });
    });
}

// ============================================================================
// Stress Tracks
// ============================================================================

function updateStressTrack(trackElement, boxCount, filledState = null) {
    if (!trackElement) return;

    const version = getFateVersion();
    const useIndividual = usesIndividualStress(version);

    // Get current filled state if not provided
    let currentFilled = filledState;
    if (currentFilled === null) {
        if (useIndividual) {
            currentFilled = getFilledIndices(trackElement);
        } else {
            currentFilled = getTrackValue(trackElement);
        }
    }

    // Rebuild boxes
    trackElement.innerHTML = '';
    for (let i = 0; i < boxCount; i++) {
        const box = document.createElement('b');
        if (version === FATE_VERSIONS.CORE) {
            box.textContent = i + 1;
        }
        trackElement.appendChild(box);
    }

    // Restore filled state
    if (useIndividual) {
        if (Array.isArray(currentFilled)) {
            setFilledIndices(trackElement, currentFilled);
        }
        setupIndividualToggleTrack(trackElement, () => autosave.schedule());
    } else {
        const count = Array.isArray(currentFilled) ? currentFilled.length : currentFilled;
        setTrackValue(trackElement, count);
        setupSequentialTrack(trackElement, () => autosave.schedule());
    }
}

function updateExtraConsequences() {
    const physiqueRating = getSkillRating('physique');
    const willRating = getSkillRating('will');

    if (elements.mildPhysicalRow) {
        elements.mildPhysicalRow.style.display = physiqueRating >= 5 ? 'flex' : 'none';
    }
    if (elements.mildMentalRow) {
        elements.mildMentalRow.style.display = willRating >= 5 ? 'flex' : 'none';
    }
}

function updateStressTracks() {
    const version = getFateVersion();
    const physiqueRating = getSkillRating('physique');
    const willRating = getSkillRating('will');

    updateStressTrack(elements.physicalStress, getStressBoxCount(physiqueRating, version));
    updateStressTrack(elements.mentalStress, getStressBoxCount(willRating, version));
    updateExtraConsequences();
}

// ============================================================================
// Fate Points
// ============================================================================

function setupFatePoints() {
    const currentMinus = document.querySelector('.fate-current .fate-btn.minus');
    const currentPlus = document.querySelector('.fate-current .fate-btn.plus');
    const refreshMinus = document.querySelector('.fate-refresh .fate-btn.minus');
    const refreshPlus = document.querySelector('.fate-refresh .fate-btn.plus');

    currentMinus?.addEventListener('click', () => {
        const val = parseInt(elements.fateCurrentValue.textContent, 10);
        if (val > 0) {
            elements.fateCurrentValue.textContent = val - 1;
            autosave.schedule();
        }
    });

    currentPlus?.addEventListener('click', () => {
        const val = parseInt(elements.fateCurrentValue.textContent, 10);
        elements.fateCurrentValue.textContent = val + 1;
        autosave.schedule();
    });

    refreshMinus?.addEventListener('click', () => {
        const val = parseInt(elements.fateRefreshValue.textContent, 10);
        if (val > 1) {
            elements.fateRefreshValue.textContent = val - 1;
            autosave.schedule();
        }
    });

    refreshPlus?.addEventListener('click', () => {
        const val = parseInt(elements.fateRefreshValue.textContent, 10);
        elements.fateRefreshValue.textContent = val + 1;
        autosave.schedule();
    });
}

// ============================================================================
// Dynamic Rows: Stunts
// ============================================================================

let stuntIndex = 0;

function createStuntRow() {
    const idx = stuntIndex++;
    const div = document.createElement('div');
    div.className = 'stunt-row';
    div.dataset.stunt = idx;
    div.innerHTML = `<input type="text" data-stunt-name="${idx}" placeholder="Stunt name..."><textarea data-stunt-desc="${idx}" placeholder="Description..."></textarea>`;

    div.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', () => {
            manageStuntRows();
            autosave.schedule();
        });
    });
    return div;
}

function isStuntRowEmpty(row) {
    const idx = row.dataset.stunt;
    const name = row.querySelector(`[data-stunt-name="${idx}"]`);
    const desc = row.querySelector(`[data-stunt-desc="${idx}"]`);
    return !name?.value?.trim() && !desc?.value?.trim();
}

function manageStuntRows() {
    manageDynamicRows(elements.stuntsGrid, '.stunt-row', isStuntRowEmpty, createStuntRow);
}

function addStuntRow() {
    elements.stuntsGrid?.appendChild(createStuntRow());
    autosave.schedule();
}

function removeEmptyStunts() {
    const rows = Array.from(elements.stuntsGrid?.querySelectorAll('.stunt-row') || []);
    rows.forEach(row => {
        if (isStuntRowEmpty(row)) {
            row.remove();
        }
    });
    manageStuntRows();
    autosave.schedule();
}

// ============================================================================
// Dynamic Rows: Extras
// ============================================================================

let extraIndex = 0;

function createExtraRow() {
    const idx = extraIndex++;
    const div = document.createElement('div');
    div.className = 'extra-row';
    div.dataset.extra = idx;
    div.innerHTML = `<input type="text" data-extra-value="${idx}" placeholder="Extra...">`;

    div.querySelector('input').addEventListener('input', () => {
        manageExtraRows();
        autosave.schedule();
    });
    return div;
}

function isExtraRowEmpty(row) {
    const input = row.querySelector('input');
    return !input?.value?.trim();
}

function manageExtraRows() {
    manageDynamicRows(elements.extrasGrid, '.extra-row', isExtraRowEmpty, createExtraRow);
}

// ============================================================================
// State Management
// ============================================================================

function getCharacterData() {
    const data = {
        name: elements.charName?.value || '',
        highConcept: document.getElementById('aspect-high-concept')?.value || '',
        trouble: document.getElementById('aspect-trouble')?.value || '',
        aspect3: document.getElementById('aspect-3')?.value || '',
        aspect4: document.getElementById('aspect-4')?.value || '',
        aspect5: document.getElementById('aspect-5')?.value || '',
        notes: document.getElementById('notes')?.value || '',
        fateCurrent: parseInt(elements.fateCurrentValue?.textContent || '3', 10),
        fateRefresh: parseInt(elements.fateRefreshValue?.textContent || '3', 10),
        skills: {},
        approaches: {},
        stunts: [],
        extras: [],
        stress: { physical: [], mental: [] },
        consequences: {},
        altRules: {
            fateVersion: getFateVersion()
        }
    };

    // Skills
    document.querySelectorAll('.skill-rating').forEach(container => {
        const skill = container.dataset.skillRating;
        data.skills[skill] = getTrackValue(container);
    });

    // Approaches
    document.querySelectorAll('.approach-rating').forEach(container => {
        const approach = container.dataset.approachRating;
        data.approaches[approach] = getTrackValue(container);
    });

    // Stunts
    document.querySelectorAll('.stunt-row').forEach(row => {
        const i = row.dataset.stunt;
        const name = document.querySelector(`[data-stunt-name="${i}"]`)?.value?.trim();
        const desc = document.querySelector(`[data-stunt-desc="${i}"]`)?.value?.trim();
        if (name || desc) {
            data.stunts.push({ name: name || '', description: desc || '' });
        }
    });

    // Extras
    document.querySelectorAll('.extra-row').forEach(row => {
        const input = row.querySelector('input');
        const value = input?.value?.trim();
        if (value) data.extras.push(value);
    });

    // Stress
    data.stress.physical = getFilledIndices(elements.physicalStress);
    data.stress.mental = getFilledIndices(elements.mentalStress);

    // Consequences
    document.querySelectorAll('[data-consequence]').forEach(input => {
        data.consequences[input.dataset.consequence] = input.value;
    });

    return data;
}

function loadCharacterData(data) {
    if (!data) return;

    // Basic fields
    if (data.name !== undefined) elements.charName.value = data.name;
    if (data.highConcept !== undefined) document.getElementById('aspect-high-concept').value = data.highConcept;
    if (data.trouble !== undefined) document.getElementById('aspect-trouble').value = data.trouble;
    if (data.aspect3 !== undefined) document.getElementById('aspect-3').value = data.aspect3;
    if (data.aspect4 !== undefined) document.getElementById('aspect-4').value = data.aspect4;
    if (data.aspect5 !== undefined) document.getElementById('aspect-5').value = data.aspect5;
    if (data.notes !== undefined) document.getElementById('notes').value = data.notes;

    // Fate points
    if (data.fateCurrent !== undefined) {
        elements.fateCurrentValue.textContent = data.fateCurrent;
    }
    if (data.fateRefresh !== undefined) {
        elements.fateRefreshValue.textContent = data.fateRefresh;
    }

    // Skills
    if (data.skills) {
        Object.entries(data.skills).forEach(([skill, value]) => {
            const container = document.querySelector(`[data-skill-rating="${skill}"]`);
            if (container) setTrackValue(container, value);
        });
    }

    // Approaches
    if (data.approaches) {
        Object.entries(data.approaches).forEach(([approach, value]) => {
            const container = document.querySelector(`[data-approach-rating="${approach}"]`);
            if (container) setTrackValue(container, value);
        });
    }

    // Stunts
    if (elements.stuntsGrid) {
        elements.stuntsGrid.querySelectorAll('.stunt-row').forEach(el => el.remove());
        stuntIndex = 0;
        const stunts = data.stunts || [];
        stunts.forEach(s => {
            const row = createStuntRow();
            elements.stuntsGrid.appendChild(row);
            const idx = row.dataset.stunt;
            const nameEl = row.querySelector(`[data-stunt-name="${idx}"]`);
            const descEl = row.querySelector(`[data-stunt-desc="${idx}"]`);
            if (nameEl) nameEl.value = s.name || '';
            if (descEl) descEl.value = s.description || '';
        });
    }

    // Extras
    if (elements.extrasGrid) {
        elements.extrasGrid.querySelectorAll('.extra-row').forEach(el => el.remove());
        extraIndex = 0;
        const extras = data.extras || [];
        extras.forEach(val => {
            const row = createExtraRow();
            elements.extrasGrid.appendChild(row);
            const input = row.querySelector('input');
            if (input) input.value = val;
        });
        manageExtraRows();
    }

    // Alternate rules (load before stress so it affects calculation)
    if (data.altRules) {
        setFateVersion(data.altRules.fateVersion || DEFAULT_VERSION);
    }
    updateSkillsApproachesVisibility();

    // Stress - regenerate with correct box count then apply filled state
    const version = getFateVersion();
    const physiqueRating = getSkillRating('physique');
    const willRating = getSkillRating('will');
    updateStressTrack(elements.physicalStress, getStressBoxCount(physiqueRating, version), data.stress?.physical || []);
    updateStressTrack(elements.mentalStress, getStressBoxCount(willRating, version), data.stress?.mental || []);
    updateExtraConsequences();

    // Consequences
    if (data.consequences) {
        Object.entries(data.consequences).forEach(([slot, value]) => {
            const input = document.querySelector(`[data-consequence="${slot}"]`);
            if (input) input.value = value;
        });
    }
}

function resetToDefaults() {
    document.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
    document.querySelectorAll('.skill-rating b, .approach-rating b').forEach(el => el.classList.remove('filled'));

    elements.fateCurrentValue.textContent = '3';
    elements.fateRefreshValue.textContent = '3';

    setFateVersion(DEFAULT_VERSION);
    updateSkillsApproachesVisibility();

    // Reset dynamic rows
    if (elements.stuntsGrid) {
        elements.stuntsGrid.querySelectorAll('.stunt-row').forEach(el => el.remove());
        stuntIndex = 0;
    }

    if (elements.extrasGrid) {
        elements.extrasGrid.querySelectorAll('.extra-row').forEach(el => el.remove());
        extraIndex = 0;
        elements.extrasGrid.appendChild(createExtraRow());
    }

    updateStressTracks();
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
    const charName = data.name || 'character';
    downloadJSON(data, SYSTEM_NAME, charName);
}

// ============================================================================
// Dice Rolling
// ============================================================================

function setupDiceRolling() {
    // Skills
    document.querySelectorAll('.skill span.rollable').forEach(span => {
        span.addEventListener('click', () => {
            const skill = span.dataset.skill;
            const rating = getSkillRating(skill);
            showFateDicePopup(span.textContent, rating);
        });
    });

    // Approaches
    document.querySelectorAll('.approach span.rollable').forEach(span => {
        span.addEventListener('click', () => {
            const approach = span.dataset.approach;
            const container = document.querySelector(`[data-approach-rating="${approach}"]`);
            const rating = getTrackValue(container);
            showFateDicePopup(span.textContent, rating);
        });
    });
}

// ============================================================================
// Group Integration
// ============================================================================

function addToGroup() {
    const data = getCharacterData();
    const groupData = convertFateToGroupFormat(data);
    storeCharacterForTransfer(groupData, 'ADD_TO_GROUP');
    window.location.href = 'FateGroup.html?action=add';
}

function returnToGroup() {
    const data = getCharacterData();
    data._groupCharId = groupCharId;
    storeCharacterForTransfer(data, 'RETURN_TO_GROUP');
    window.location.href = 'FateGroup.html';
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

    elements.stuntAdd?.addEventListener('click', addStuntRow);
    elements.stuntRemove?.addEventListener('click', removeEmptyStunts);

    // Alternate rules radio buttons
    document.querySelectorAll('input[name="fate-version"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateSkillsApproachesVisibility();
            updateStressTracks();
            autosave.schedule();
        });
    });

    elements.addToGroupBtn?.addEventListener('click', addToGroup);
}

function setupAutosaveListeners() {
    // Text inputs (non-dynamic)
    document.querySelectorAll('input[type="text"]:not([data-stunt-name]):not([data-extra-value]), textarea:not([data-stunt-desc])').forEach(el => {
        el.addEventListener('input', () => autosave.schedule());
    });
}

function init() {
    cacheElements();

    // Setup autosave manager
    autosave = createAutosaveManager(saveToLocalStorage);

    setupSkillRatings();
    setupApproachRatings();
    setupFatePoints();
    setupButtons();
    setupAutosaveListeners();
    setupDiceRolling();

    // Check if we came from FateGroup
    const urlParams = new URLSearchParams(window.location.search);
    fromGroup = urlParams.get('from') === 'group';
    groupCharId = urlParams.get('id');

    let loadedFromTransfer = false;

    if (fromGroup) {
        if (elements.backToGroup) {
            elements.backToGroup.style.display = 'inline';
            elements.backToGroup.addEventListener('click', returnToGroup);
        }

        // Try to load transferred character data
        const transferredData = getTransferredCharacter('CHARACTER');
        if (transferredData) {
            loadCharacterData(transferredData);
            saveToLocalStorage();
            loadedFromTransfer = true;
        }
    } else {
        if (elements.addToGroupBtn) elements.addToGroupBtn.style.display = 'inline';
    }

    if (!loadedFromTransfer) {
        if (!loadFromLocalStorage()) {
            updateStressTracks();
            updateSkillsApproachesVisibility();
            manageExtraRows();
        }
    }

    manageExtraRows();

    // Accessibility: add aria-labels to inputs with placeholders
    addAccessibilityLabels();
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
