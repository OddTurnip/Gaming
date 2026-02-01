/**
 * FATE System - FATE RPG specific utilities
 * @module fate-system
 */

import { createPopup, storeForTransfer, getTransferredData } from './shared.js';

// ============================================================================
// Constants
// ============================================================================

/** System name for file exports */
export const SYSTEM_NAME = 'FATE';

/** FATE Ladder - maps numeric values to descriptive names */
export const LADDER = {
    '-2': 'Terrible',
    '-1': 'Poor',
    '0': 'Mediocre',
    '1': 'Average',
    '2': 'Fair',
    '3': 'Good',
    '4': 'Great',
    '5': 'Superb',
    '6': 'Fantastic',
    '7': 'Epic',
    '8': 'Legendary'
};

/** Standard FATE Core/Condensed skill list */
export const SKILL_LIST = [
    'academics', 'athletics', 'burglary', 'contacts', 'crafts',
    'deceive', 'drive', 'empathy', 'fight', 'investigate',
    'lore', 'notice', 'physique', 'provoke', 'rapport',
    'resources', 'shoot', 'stealth', 'will'
];

/** FATE Accelerated Edition approaches */
export const APPROACH_LIST = ['careful', 'clever', 'flashy', 'forceful', 'quick', 'sneaky'];

/** FATE version types */
export const FATE_VERSIONS = {
    CONDENSED: 'condensed',
    CORE: 'core',
    ACCELERATED: 'accelerated'
};

/** Default FATE version */
export const DEFAULT_VERSION = FATE_VERSIONS.CONDENSED;

// ============================================================================
// FATE Ladder Utilities
// ============================================================================

/**
 * Get ladder name for a numeric value
 * @param {number} value - Numeric rating
 * @returns {string} Ladder name (e.g., "Good", "Superb")
 */
export function getLadderName(value) {
    if (value <= -2) return LADDER['-2'];
    if (value >= 8) return LADDER['8'];
    return LADDER[String(value)] || `+${value}`;
}

/**
 * Format a value with sign and ladder name
 * @param {number} value - Numeric rating
 * @returns {string} Formatted string (e.g., "+3 (Good)")
 */
export function formatRating(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value} (${getLadderName(value)})`;
}

// ============================================================================
// Stress Box Calculations
// ============================================================================

/**
 * Get stress box count based on skill rating and FATE version
 * @param {number} skillRating - Physique or Will rating
 * @param {string} version - FATE version ('core', 'condensed', 'accelerated')
 * @returns {number} Number of stress boxes
 */
export function getStressBoxCount(skillRating, version = DEFAULT_VERSION) {
    if (version === FATE_VERSIONS.CORE) {
        // FATE Core: boxes labeled 1,2,3,4
        // Base: 2 boxes (1,2), skill 1-2: +3 box, skill 3+: +4 box
        if (skillRating === 0) return 2;
        if (skillRating <= 2) return 3;
        return 4;
    } else {
        // FATE Condensed & Accelerated: interchangeable boxes
        // Base: 3, skill 1-2: 4, skill 3+: 6
        if (skillRating === 0) return 3;
        if (skillRating <= 2) return 4;
        return 6;
    }
}

/**
 * Check if stress uses individual toggle (Core) or sequential fill (Condensed/Accelerated)
 * @param {string} version - FATE version
 * @returns {boolean} True if individual toggle mode
 */
export function usesIndividualStress(version) {
    return version === FATE_VERSIONS.CORE;
}

// ============================================================================
// Fudge Dice Rolling
// ============================================================================

/**
 * Roll a single Fudge die
 * @returns {number} -1, 0, or +1
 */
export function rollFudgeDie() {
    return Math.floor(Math.random() * 3) - 1;
}

/**
 * Roll 4 Fudge dice (4dF)
 * @returns {number[]} Array of 4 values, each -1, 0, or +1
 */
export function roll4dF() {
    return [rollFudgeDie(), rollFudgeDie(), rollFudgeDie(), rollFudgeDie()];
}

/**
 * Get display info for a Fudge die value
 * @param {number} value - Die value (-1, 0, or +1)
 * @returns {Object} { symbol, className }
 */
export function getFudgeDieDisplay(value) {
    if (value === 1) return { symbol: '+', className: 'plus' };
    if (value === -1) return { symbol: '−', className: 'minus' };
    return { symbol: '', className: 'blank' };
}

/**
 * Show FATE dice popup with invoke/reroll options
 * @param {string} skillName - Name of skill being rolled
 * @param {number} modifier - Skill rating to add to roll
 */
export function showFateDicePopup(skillName, modifier) {
    let dice = roll4dF();
    let invokes = 0;

    createPopup({
        createContent: (popup, close) => {
            // Title
            const title = document.createElement('div');
            title.className = 'dice-popup-title';
            title.textContent = skillName;
            popup.insertBefore(title, popup.firstChild);

            // Dice container
            const diceContainer = document.createElement('div');
            diceContainer.className = 'dice-container';
            popup.appendChild(diceContainer);

            // Total display
            const totalDiv = document.createElement('div');
            totalDiv.className = 'dice-total';
            popup.appendChild(totalDiv);

            // Ladder result
            const ladderDiv = document.createElement('div');
            ladderDiv.className = 'dice-ladder';
            popup.appendChild(ladderDiv);

            // Invoke counter
            const invokeCounter = document.createElement('div');
            invokeCounter.className = 'dice-invoke-counter';
            popup.appendChild(invokeCounter);

            // Invoke/Reroll buttons
            const invokeSection = document.createElement('div');
            invokeSection.className = 'dice-invoke-section';

            const invokeBtn = document.createElement('button');
            invokeBtn.className = 'dice-invoke-btn';
            invokeBtn.textContent = 'Invoke (+2)';
            invokeSection.appendChild(invokeBtn);

            const rerollBtn = document.createElement('button');
            rerollBtn.className = 'dice-invoke-btn';
            rerollBtn.textContent = 'Reroll';
            invokeSection.appendChild(rerollBtn);

            popup.appendChild(invokeSection);

            function updateDisplay() {
                // Dice
                diceContainer.innerHTML = '';
                dice.forEach(value => {
                    const die = document.createElement('div');
                    const display = getFudgeDieDisplay(value);
                    die.className = `fudge-die ${display.className}`;
                    die.textContent = display.symbol;
                    diceContainer.appendChild(die);
                });

                // Calculate total
                const diceSum = dice.reduce((a, b) => a + b, 0);
                const invokeBonus = invokes * 2;
                const effectiveModifier = modifier + invokeBonus;
                const total = diceSum + effectiveModifier;

                // Build total display
                totalDiv.innerHTML = '';

                const modEl = document.createElement('span');
                modEl.className = 'dice-total-modifier';
                modEl.textContent = effectiveModifier;
                totalDiv.appendChild(modEl);

                const opEl = document.createElement('span');
                opEl.className = 'dice-total-plus';
                opEl.textContent = diceSum >= 0 ? ' + ' : ' − ';
                totalDiv.appendChild(opEl);

                const diceSumEl = document.createElement('span');
                diceSumEl.className = 'dice-total-dice';
                diceSumEl.classList.add(diceSum > 0 ? 'positive' : diceSum < 0 ? 'negative' : 'zero');
                diceSumEl.textContent = Math.abs(diceSum);
                totalDiv.appendChild(diceSumEl);

                const equals = document.createElement('span');
                equals.className = 'dice-total-equals';
                equals.textContent = ' = ';
                totalDiv.appendChild(equals);

                const finalEl = document.createElement('span');
                finalEl.className = 'dice-total-final';
                finalEl.textContent = total >= 0 ? `+${total}` : total;
                totalDiv.appendChild(finalEl);

                // Ladder result
                ladderDiv.textContent = getLadderName(total);

                // Invoke counter
                invokeCounter.textContent = invokes > 0 ? `Invokes used: ${invokes}` : '';
            }

            invokeBtn.addEventListener('click', () => {
                invokes++;
                updateDisplay();
            });

            rerollBtn.addEventListener('click', () => {
                dice = roll4dF();
                updateDisplay();
            });

            updateDisplay();
        }
    });
}

// ============================================================================
// Character Format Conversion (Fate.html <-> FateGroup)
// ============================================================================

/**
 * Convert single character data from Fate.html format to FateGroup format
 * @param {Object} fateData - Data from Fate.html
 * @returns {Object} Data in FateGroup format
 */
export function convertFateToGroupFormat(fateData) {
    // Convert stress from index array to boolean array
    const physStressIndices = fateData.stress?.physical || [];
    const mentStressIndices = fateData.stress?.mental || [];

    const physMax = physStressIndices.length > 0 ? Math.max(...physStressIndices) + 1 : 0;
    const mentMax = mentStressIndices.length > 0 ? Math.max(...mentStressIndices) + 1 : 0;

    const physicalStress = [];
    const mentalStress = [];
    for (let i = 0; i < Math.max(physMax, 6); i++) {
        physicalStress.push(physStressIndices.includes(i));
    }
    for (let i = 0; i < Math.max(mentMax, 6); i++) {
        mentalStress.push(mentStressIndices.includes(i));
    }

    return {
        id: `char-${Date.now()}`,
        isNpc: false,
        name: fateData.name || '',
        fatePoints: fateData.fateCurrent ?? 3,
        acted: false,
        boosts: 0,
        physicalStress,
        mentalStress,
        consequences: {
            mild: fateData.consequences?.mild || '',
            moderate: fateData.consequences?.moderate || '',
            severe: fateData.consequences?.severe || ''
        },
        aspects: {
            highConcept: fateData.highConcept || '',
            trouble: fateData.trouble || '',
            aspect3: fateData.aspect3 || '',
            aspect4: fateData.aspect4 || '',
            aspect5: fateData.aspect5 || ''
        },
        skills: fateData.skills || {},
        stunts: (fateData.stunts || []).map(s =>
            typeof s === 'string' ? s : (s.name || '')
        ).filter(s => s),
        // Preserve extra data for round-trip
        _fateExtras: {
            approaches: fateData.approaches,
            extras: fateData.extras,
            notes: fateData.notes,
            fateRefresh: fateData.fateRefresh,
            altRules: fateData.altRules,
            stuntDetails: fateData.stunts
        }
    };
}

/**
 * Convert character data from FateGroup format to Fate.html format
 * @param {Object} groupData - Data from FateGroup
 * @returns {Object} Data in Fate.html format
 */
export function convertGroupToFateFormat(groupData) {
    const extras = groupData._fateExtras || {};

    // Convert stress from boolean array to index array
    const physicalStressIndices = [];
    const mentalStressIndices = [];
    (groupData.physicalStress || []).forEach((filled, i) => {
        if (filled) physicalStressIndices.push(i);
    });
    (groupData.mentalStress || []).forEach((filled, i) => {
        if (filled) mentalStressIndices.push(i);
    });

    // Convert stunts back to full format if we have details
    let stunts = (groupData.stunts || []).map(name => ({ name, description: '' }));
    if (extras.stuntDetails) {
        stunts = extras.stuntDetails;
    }

    return {
        name: groupData.name || '',
        highConcept: groupData.aspects?.highConcept || '',
        trouble: groupData.aspects?.trouble || '',
        aspect3: groupData.aspects?.aspect3 || '',
        aspect4: groupData.aspects?.aspect4 || '',
        aspect5: groupData.aspects?.aspect5 || '',
        notes: extras.notes || '',
        fateCurrent: groupData.fatePoints ?? 3,
        fateRefresh: extras.fateRefresh ?? 3,
        skills: groupData.skills || {},
        approaches: extras.approaches || {},
        stunts,
        extras: extras.extras || [],
        stress: {
            physical: physicalStressIndices,
            mental: mentalStressIndices
        },
        consequences: {
            mild: groupData.consequences?.mild || '',
            moderate: groupData.consequences?.moderate || '',
            severe: groupData.consequences?.severe || '',
            'mild-physical': '',
            'mild-mental': ''
        },
        altRules: extras.altRules || { fateVersion: DEFAULT_VERSION }
    };
}

/**
 * Check if data is in single character format (from Fate.html)
 * @param {Object} data - JSON data to check
 * @returns {boolean} True if single character format
 */
export function isSingleCharacterFormat(data) {
    return data.hasOwnProperty('highConcept') ||
           data.hasOwnProperty('trouble') ||
           (data.hasOwnProperty('skills') && !data.hasOwnProperty('characters'));
}

/**
 * Check if data is in group format (from FateGroup.html)
 * @param {Object} data - JSON data to check
 * @returns {boolean} True if group format
 */
export function isGroupFormat(data) {
    return data.hasOwnProperty('characters') && Array.isArray(data.characters);
}

// ============================================================================
// Page Transfer Utilities (FATE-specific keys)
// ============================================================================

const TRANSFER_KEYS = {
    CHARACTER: 'fate-transfer-character',
    ADD_TO_GROUP: 'fate-add-to-group',
    RETURN_TO_GROUP: 'fate-return-to-group'
};

/**
 * Store character for transfer to another FATE page
 * @param {Object} data - Character data
 * @param {string} purpose - Transfer purpose key
 */
export function storeCharacterForTransfer(data, purpose = 'character') {
    const key = TRANSFER_KEYS[purpose.toUpperCase().replace(/-/g, '_')] || TRANSFER_KEYS.CHARACTER;
    storeForTransfer(key, data);
}

/**
 * Get transferred character data
 * @param {string} purpose - Transfer purpose key
 * @returns {Object|null} Character data or null
 */
export function getTransferredCharacter(purpose = 'character') {
    const key = TRANSFER_KEYS[purpose.toUpperCase().replace(/-/g, '_')] || TRANSFER_KEYS.CHARACTER;
    return getTransferredData(key);
}
