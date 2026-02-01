/**
 * Gotham Reunion - Blades in the Dark Character Sheet
 * Superhero hack with simplified mechanics
 * @module gotham-reunion
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
    showBladesDicePopup
} from './blades-system.js';

// ============================================================================
// Constants
// ============================================================================

const SYSTEM_NAME = 'Gotham Reunion';
const STORAGE_KEY = 'gotham-reunion-character';

/** Gotham Reunion load values (simplified from BitD) */
const LOAD_CAPACITY = {
    light: 3,
    heavy: 6
};

/** Skill list for training dropdown */
const SKILLS = [
    { value: 'hunt', label: 'Hunt' },
    { value: 'study', label: 'Study' },
    { value: 'survey', label: 'Survey' },
    { value: 'tinker', label: 'Tinker' },
    { value: 'finesse', label: 'Finesse' },
    { value: 'prowl', label: 'Prowl' },
    { value: 'skirmish', label: 'Skirmish' },
    { value: 'wreck', label: 'Wreck' },
    { value: 'attune', label: 'Attune' },
    { value: 'command', label: 'Command' },
    { value: 'consort', label: 'Consort' },
    { value: 'sway', label: 'Sway' }
];

/** Attribute to skills mapping for power rolls */
const ATTR_SKILLS = {
    insight: ['hunt', 'study', 'survey', 'tinker'],
    prowess: ['finesse', 'prowl', 'skirmish', 'wreck'],
    resolve: ['attune', 'command', 'consort', 'sway']
};

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
    elements.charLevel = document.getElementById('char-level');
    elements.powerAttr = document.getElementById('power-attr');
    elements.powerName = document.getElementById('power-name');
    elements.autosaveStatus = document.getElementById('autosave-status');
    elements.saveBtn = document.getElementById('save-btn');
    elements.loadBtn = document.getElementById('load-btn');
    elements.loadFile = document.getElementById('load-file');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.stressTrack = document.getElementById('stress-track');
    elements.loadTrack = document.getElementById('load-track');
    elements.assetsBlock = document.querySelector('.assets-block');
    elements.contactsBlock = document.querySelector('.contacts-block');
    elements.projectsGrid = document.querySelector('.projects-grid');
    elements.trainingGrid = document.querySelector('.training-grid');
}

// ============================================================================
// Dynamic Rows: Assets
// ============================================================================

let assetIndex = 0;

function createAssetRow() {
    const idx = assetIndex++;
    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.asset = idx;
    input.placeholder = 'Asset...';
    input.addEventListener('input', () => {
        manageAssetRows();
        autosave.schedule();
    });
    input.addEventListener('change', () => autosave.schedule());
    return input;
}

function isAssetRowEmpty(row) {
    return !row.value?.trim();
}

function manageAssetRows() {
    manageDynamicRows(elements.assetsBlock, 'input[data-asset]', isAssetRowEmpty, createAssetRow);
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
// Dynamic Rows: Projects
// ============================================================================

let projectIndex = 0;

function createProjectRow() {
    const idx = projectIndex++;
    const div = document.createElement('div');
    div.className = 'project';
    div.dataset.project = idx;
    div.innerHTML = `<input type="checkbox" class="project-complete" data-project-complete="${idx}"><input type="text" class="project-name" data-project-name="${idx}" placeholder="Project..."><input type="number" class="project-progress" data-project-progress="${idx}" min="0" max="99" placeholder="0"><span class="project-slash">/</span><input type="number" class="project-total" data-project-total="${idx}" min="1" max="99" placeholder="8">`;

    const complete = div.querySelector('.project-complete');
    complete?.addEventListener('change', () => {
        updateProjectCompleteState(idx);
        manageProjectRows();
        autosave.schedule();
    });

    div.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => {
        el.addEventListener('input', () => {
            manageProjectRows();
            autosave.schedule();
        });
        el.addEventListener('change', () => autosave.schedule());
    });
    return div;
}

function isProjectRowEmpty(row) {
    const name = row.querySelector('.project-name');
    const progress = row.querySelector('.project-progress');
    const total = row.querySelector('.project-total');
    return !name?.value?.trim() && !progress?.value && !total?.value;
}

function manageProjectRows() {
    manageDynamicRows(elements.projectsGrid, '.project', isProjectRowEmpty, createProjectRow);
}

function updateProjectCompleteState(idx) {
    const project = document.querySelector(`[data-project="${idx}"]`);
    const complete = document.querySelector(`[data-project-complete="${idx}"]`);
    if (project && complete) {
        project.classList.toggle('completed', complete.checked);
    }
}

// ============================================================================
// Dynamic Rows: Training
// ============================================================================

let trainingIndex = 0;

function createTrainingRow() {
    const idx = trainingIndex++;
    const div = document.createElement('div');
    div.className = 'training-row';
    div.dataset.training = idx;

    // Skill dropdown
    const select = document.createElement('select');
    select.className = 'training-skill-select';
    select.dataset.trainingSkill = idx;
    select.innerHTML = '<option value="">Skill...</option>' +
        SKILLS.map(s => `<option value="${s.value}">${s.label}</option>`).join('');

    // Training track (4 boxes)
    const track = document.createElement('div');
    track.className = 'training-track';
    track.dataset.trainingTrack = idx;
    for (let i = 0; i < 4; i++) {
        const b = document.createElement('b');
        b.classList.add('disabled');
        track.appendChild(b);
    }

    // Upgrade button slot
    const upgradeSlot = document.createElement('div');
    upgradeSlot.className = 'training-upgrade-slot';
    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'training-upgrade';
    upgradeBtn.textContent = '⬆';
    upgradeBtn.title = 'Upgrade skill';
    upgradeSlot.appendChild(upgradeBtn);

    div.appendChild(select);
    div.appendChild(track);
    div.appendChild(upgradeSlot);

    // Event: skill selection enables boxes
    select.addEventListener('change', () => {
        updateTrainingBoxState(idx);
        manageTrainingRows();
        autosave.schedule();
    });

    // Event: box clicks
    setupTrainingTrackHandler(track, idx);

    // Event: upgrade button
    upgradeBtn.addEventListener('click', () => upgradeTrainingSkill(idx));

    return div;
}

function setupTrainingTrackHandler(track, idx) {
    const boxes = track.querySelectorAll('b');
    boxes.forEach((box, boxIdx) => {
        box.addEventListener('click', () => {
            if (box.classList.contains('disabled')) return;

            const filled = Array.from(boxes).filter(b => b.classList.contains('filled')).length;
            if (filled === boxIdx + 1) {
                boxes.forEach(b => b.classList.remove('filled'));
            } else {
                boxes.forEach((b, i) => b.classList.toggle('filled', i <= boxIdx));
            }
            updateTrainingReadyState(idx);
            manageTrainingRows();
            autosave.schedule();
        });
    });
}

function updateTrainingBoxState(idx) {
    const select = document.querySelector(`[data-training-skill="${idx}"]`);
    const track = document.querySelector(`[data-training-track="${idx}"]`);
    if (!select || !track) return;

    const hasSkill = select.value !== '';
    track.querySelectorAll('b').forEach(b => {
        b.classList.toggle('disabled', !hasSkill);
    });
    updateTrainingReadyState(idx);
}

function updateTrainingReadyState(idx) {
    const row = document.querySelector(`[data-training="${idx}"]`);
    const track = document.querySelector(`[data-training-track="${idx}"]`);
    if (!row || !track) return;

    const filled = track.querySelectorAll('b.filled').length;
    row.classList.toggle('ready', filled === 4);
}

function upgradeTrainingSkill(idx) {
    const select = document.querySelector(`[data-training-skill="${idx}"]`);
    const row = document.querySelector(`[data-training="${idx}"]`);
    if (!select || !row) return;

    const skill = select.value;
    if (!skill) return;

    // Add 1 pip to the skill
    const dotsContainer = document.querySelector(`[data-action="${skill}"]`);
    if (dotsContainer) {
        const currentFilled = getTrackValue(dotsContainer);
        if (currentFilled < 4) {
            setTrackValue(dotsContainer, currentFilled + 1);
        }
    }

    // Remove this training row
    row.remove();
    manageTrainingRows();
    autosave.schedule();
}

function isTrainingRowEmpty(row) {
    const select = row.querySelector('select');
    const track = row.querySelector('.training-track');
    const hasSkill = select?.value !== '';
    const hasFilled = track?.querySelectorAll('b.filled').length > 0;
    return !hasSkill && !hasFilled;
}

function manageTrainingRows() {
    manageDynamicRows(elements.trainingGrid, '.training-row', isTrainingRowEmpty, createTrainingRow);
}

// ============================================================================
// Stress & Load Tracks
// ============================================================================

function updateStressTrack() {
    const level = parseInt(elements.charLevel?.value || '1', 10);
    const maxStress = 9 + (level - 1); // Level 1 = 9, Level 2 = 10, etc.

    // Save current state
    let currentFilled = getTrackValue(elements.stressTrack);

    // Rebuild
    elements.stressTrack.innerHTML = '';
    for (let i = 0; i < maxStress; i++) {
        const b = document.createElement('b');
        if (i < currentFilled) b.classList.add('filled');
        elements.stressTrack.appendChild(b);
    }

    setupSequentialTrack(elements.stressTrack, () => autosave.schedule());
}

function updateLoadTrack() {
    const loadRadio = document.querySelector('input[name="load"]:checked');
    const loadType = loadRadio?.value || 'light';
    const maxLoad = LOAD_CAPACITY[loadType] || LOAD_CAPACITY.light;

    // Save current state
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
// Clickable Tracks
// ============================================================================

function setupClickableTracks() {
    document.querySelectorAll('.dots').forEach(container => {
        setupSequentialTrack(container, () => autosave.schedule());
    });
}

// ============================================================================
// Dice Rolling
// ============================================================================

function setupDiceRolling() {
    // Action skills
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

    // Power label
    const powerLabel = document.querySelector('.power-label');
    if (powerLabel) {
        powerLabel.classList.add('rollable');
        powerLabel.addEventListener('click', () => {
            const powerAttr = elements.powerAttr?.value;
            const powerName = elements.powerName?.value || 'Power';

            if (!powerAttr) {
                alert('Please select a Power Attribute first.');
                return;
            }

            const skills = ATTR_SKILLS[powerAttr];
            if (!skills) {
                alert('Invalid Power Attribute selected.');
                return;
            }

            // Find highest skill value in the attribute
            let highestValue = 0;
            skills.forEach(skill => {
                const dotsContainer = document.querySelector(`[data-action="${skill}"]`);
                if (dotsContainer) {
                    const filled = getTrackValue(dotsContainer);
                    if (filled > highestValue) highestValue = filled;
                }
            });

            const attrDisplay = powerAttr.charAt(0).toUpperCase() + powerAttr.slice(1);
            showBladesDicePopup(powerName || 'Power', highestValue, attrDisplay);
        });
    }
}

// ============================================================================
// State Management
// ============================================================================

function getCharacterData() {
    const data = {
        name: document.getElementById('char-name')?.value || '',
        alias: document.getElementById('char-alias')?.value || '',
        look: document.getElementById('char-look')?.value || '',
        guide: document.getElementById('char-guide')?.value || '',
        level: document.getElementById('char-level')?.value || '1',
        powerAttr: document.getElementById('power-attr')?.value || '',
        powerName: document.getElementById('power-name')?.value || '',
        powerDetails: document.getElementById('power-details')?.value || '',
        notes: document.getElementById('notes')?.value || '',
        actions: {},
        stress: 0,
        load: 'light',
        loadFilled: 0,
        assets: [],
        contacts: [],
        projects: [],
        training: []
    };

    // Actions
    document.querySelectorAll('.dots').forEach(container => {
        const action = container.dataset.action;
        data.actions[action] = getTrackValue(container);
    });

    // Stress
    data.stress = getTrackValue(elements.stressTrack);

    // Load
    const loadRadio = document.querySelector('input[name="load"]:checked');
    data.load = loadRadio?.value || 'light';
    data.loadFilled = getTrackValue(elements.loadTrack);

    // Assets
    document.querySelectorAll('[data-asset]').forEach(input => {
        const val = input.value.trim();
        if (val) data.assets.push(val);
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
        const nameVal = name?.value?.trim() || '';
        const descVal = desc?.value?.trim() || '';
        if (nameVal || descVal) {
            data.contacts.push({
                status: status?.value || 'neutral',
                name: nameVal,
                description: descVal
            });
        }
    });

    // Projects
    document.querySelectorAll('.project[data-project]').forEach(row => {
        const i = row.dataset.project;
        const complete = document.querySelector(`[data-project-complete="${i}"]`);
        const name = document.querySelector(`[data-project-name="${i}"]`);
        const progress = document.querySelector(`[data-project-progress="${i}"]`);
        const total = document.querySelector(`[data-project-total="${i}"]`);
        const nameVal = name?.value?.trim() || '';
        const progressVal = progress?.value || '';
        const totalVal = total?.value || '';
        if (nameVal || progressVal || totalVal || complete?.checked) {
            data.projects.push({
                complete: complete?.checked || false,
                name: nameVal,
                progress: parseInt(progressVal || '0', 10),
                total: parseInt(totalVal || '8', 10)
            });
        }
    });

    // Training
    document.querySelectorAll('.training-row[data-training]').forEach(row => {
        const i = row.dataset.training;
        const skill = document.querySelector(`[data-training-skill="${i}"]`);
        const track = document.querySelector(`[data-training-track="${i}"]`);
        const skillVal = skill?.value || '';
        let filled = 0;
        track?.querySelectorAll('b').forEach((b, idx) => {
            if (b.classList.contains('filled')) filled = idx + 1;
        });
        if (skillVal || filled > 0) {
            data.training.push({
                skill: skillVal,
                progress: filled
            });
        }
    });

    return data;
}

function loadCharacterData(data) {
    if (!data) return;

    // Basic info
    const charFields = ['name', 'alias', 'look', 'guide', 'level'];
    charFields.forEach(f => {
        const el = document.getElementById(`char-${f}`);
        if (el && data[f] !== undefined) el.value = data[f];
    });

    // Power
    if (data.powerAttr !== undefined) elements.powerAttr.value = data.powerAttr;
    if (data.powerName !== undefined) elements.powerName.value = data.powerName;
    if (data.powerDetails !== undefined) document.getElementById('power-details').value = data.powerDetails;
    if (data.notes !== undefined) document.getElementById('notes').value = data.notes;

    // Actions
    if (data.actions) {
        Object.entries(data.actions).forEach(([action, value]) => {
            const container = document.querySelector(`[data-action="${action}"]`);
            if (container) setTrackValue(container, value);
        });
    }

    // Stress (rebuild first based on level)
    updateStressTrack();
    if (data.stress !== undefined) {
        setTrackValue(elements.stressTrack, data.stress);
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

    // Assets
    elements.assetsBlock.querySelectorAll('input[data-asset]').forEach(el => el.remove());
    assetIndex = 0;
    const assets = data.assets || [];
    assets.forEach(val => {
        const input = createAssetRow();
        input.value = val;
        elements.assetsBlock.appendChild(input);
    });
    manageAssetRows();

    // Contacts
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

    // Projects
    elements.projectsGrid.querySelectorAll('.project').forEach(el => el.remove());
    projectIndex = 0;
    const projects = data.projects || [];
    projects.forEach(p => {
        const row = createProjectRow();
        elements.projectsGrid.appendChild(row);
        const idx = row.dataset.project;
        const complete = row.querySelector(`[data-project-complete="${idx}"]`);
        const name = row.querySelector(`[data-project-name="${idx}"]`);
        const progress = row.querySelector(`[data-project-progress="${idx}"]`);
        const total = row.querySelector(`[data-project-total="${idx}"]`);
        if (complete) complete.checked = p.complete;
        if (name) name.value = p.name;
        if (progress) progress.value = p.progress || '';
        if (total) total.value = p.total || '';
        updateProjectCompleteState(idx);
    });
    manageProjectRows();

    // Training
    elements.trainingGrid.querySelectorAll('.training-row').forEach(el => el.remove());
    trainingIndex = 0;
    const training = data.training || [];
    training.forEach(t => {
        const row = createTrainingRow();
        elements.trainingGrid.appendChild(row);
        const idx = row.dataset.training;
        const skill = row.querySelector(`[data-training-skill="${idx}"]`);
        const track = row.querySelector(`[data-training-track="${idx}"]`);
        if (skill) skill.value = t.skill;
        updateTrainingBoxState(idx);
        if (track && t.progress > 0) {
            track.querySelectorAll('b').forEach((b, bidx) => {
                b.classList.toggle('filled', bidx < t.progress);
            });
        }
        updateTrainingReadyState(idx);
    });
    manageTrainingRows();
}

function resetToDefaults() {
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => el.value = '');
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);
    document.querySelectorAll('.dots b').forEach(el => el.classList.remove('filled'));

    // Restore defaults
    elements.charLevel.value = '1';
    elements.powerAttr.value = '';
    const lightRadio = document.querySelector('input[name="load"][value="light"]');
    if (lightRadio) lightRadio.checked = true;

    // Reset dynamic rows
    elements.assetsBlock.querySelectorAll('input[data-asset]').forEach(el => el.remove());
    assetIndex = 0;
    elements.assetsBlock.appendChild(createAssetRow());

    elements.contactsBlock.querySelectorAll('.contact').forEach(el => el.remove());
    contactIndex = 0;
    elements.contactsBlock.appendChild(createContactRow());

    elements.projectsGrid.querySelectorAll('.project').forEach(el => el.remove());
    projectIndex = 0;
    elements.projectsGrid.appendChild(createProjectRow());

    elements.trainingGrid.querySelectorAll('.training-row').forEach(el => el.remove());
    trainingIndex = 0;
    elements.trainingGrid.appendChild(createTrainingRow());

    updateStressTrack();
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

function setupStressAndLoad() {
    // Level change updates stress track
    elements.charLevel?.addEventListener('change', () => {
        updateStressTrack();
        autosave.schedule();
    });

    // Load radio change updates load track
    document.querySelectorAll('input[name="load"]').forEach(r => {
        r.addEventListener('change', () => {
            updateLoadTrack();
            autosave.schedule();
        });
    });

    updateStressTrack();
    updateLoadTrack();
}

function setupAutosaveListeners() {
    document.querySelectorAll('input[type="text"]:not([data-asset]):not([data-contact-name]):not([data-contact-desc]):not([data-project-name]), input[type="number"]:not([data-project-progress]):not([data-project-total]), textarea, select:not([data-contact-status]):not(.training-skill-select)').forEach(el => {
        el.addEventListener('change', () => autosave.schedule());
        if ((el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'number')) || el.tagName === 'TEXTAREA') {
            el.addEventListener('input', () => autosave.schedule());
        }
    });
}

function init() {
    cacheElements();

    autosave = createAutosaveManager(saveToLocalStorage);

    setupClickableTracks();
    setupStressAndLoad();
    setupButtons();
    setupAutosaveListeners();
    setupDiceRolling();

    if (!loadFromLocalStorage()) {
        manageAssetRows();
        manageContactRows();
        manageProjectRows();
        manageTrainingRows();
    }

    manageAssetRows();
    manageContactRows();
    manageProjectRows();
    manageTrainingRows();

    // Accessibility: add aria-labels to inputs with placeholders
    addAccessibilityLabels();
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
