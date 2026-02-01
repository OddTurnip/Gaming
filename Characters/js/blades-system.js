/**
 * Blades in the Dark System - BitD specific utilities
 * @module blades-system
 */

import { createPopup } from './shared.js';

// ============================================================================
// Constants
// ============================================================================

/** System name for file exports */
export const SYSTEM_NAME = 'Blades';

/** Load capacity by type */
export const LOAD_CAPACITY = {
    light: 3,
    normal: 5,
    heavy: 6
};

/** Result thresholds for d6 pool */
export const RESULT_THRESHOLDS = {
    FAILURE: 3,      // 1-3 = failure
    MIXED: 5,        // 4-5 = mixed success
    SUCCESS: 6,      // 6 = full success
    CRITICAL: 2      // 2+ sixes = critical
};

// ============================================================================
// Dice Rolling
// ============================================================================

/**
 * Roll a single d6
 * @returns {number} 1-6
 */
export function rollD6() {
    return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll a pool of d6s
 * For 0 dice, rolls 2 and takes the worst
 * @param {number} numDice - Number of dice to roll (can be 0)
 * @returns {number[]} Array of die results
 */
export function rollDicePool(numDice) {
    const actualRolls = numDice === 0 ? 2 : numDice;
    const dice = [];
    for (let i = 0; i < actualRolls; i++) {
        dice.push(rollD6());
    }
    return dice;
}

/**
 * Get CSS class for a die value
 * @param {number} value - Die value 1-6
 * @returns {string} CSS class name
 */
export function getDieClass(value) {
    if (value <= RESULT_THRESHOLDS.FAILURE) return 'failure';
    if (value <= RESULT_THRESHOLDS.MIXED) return 'mixed';
    return 'success';
}

/**
 * Evaluate a dice pool result
 * @param {number[]} dice - Array of die values
 * @param {boolean} isZeroDice - True if started with 0 dice (take worst)
 * @returns {Object} { dice, selectedIndex, selectedValue, resultName, resultClass, isZeroDice }
 */
export function evaluateResult(dice, isZeroDice = false) {
    const sixes = dice.filter(d => d === 6).length;

    // For 0d, take the worst (minimum); otherwise take the best (maximum)
    const selectedValue = isZeroDice ? Math.min(...dice) : Math.max(...dice);
    const selectedIndex = dice.indexOf(selectedValue);

    let resultName, resultClass;

    // Check for critical (only possible if not 0d and 2+ sixes)
    if (!isZeroDice && sixes >= RESULT_THRESHOLDS.CRITICAL) {
        resultName = 'Critical!';
        resultClass = 'critical';
    } else if (selectedValue <= RESULT_THRESHOLDS.FAILURE) {
        resultName = 'Failure';
        resultClass = 'failure';
    } else if (selectedValue <= RESULT_THRESHOLDS.MIXED) {
        resultName = 'Mixed';
        resultClass = 'mixed';
    } else {
        resultName = 'Success';
        resultClass = 'success';
    }

    return {
        dice,
        selectedIndex,
        selectedValue,
        resultName,
        resultClass,
        isZeroDice
    };
}

/**
 * Show BitD dice popup with bonus dice options
 * @param {string} skillName - Name of action being rolled
 * @param {number} numDice - Number of dice in pool
 * @param {string} subtitle - Optional subtitle (e.g., attribute name)
 */
export function showBladesDicePopup(skillName, numDice, subtitle = null) {
    const originalDice = rollDicePool(numDice);
    const startedAsZeroDice = numDice === 0;
    let bonusDice = {}; // { 'Assist': 4, 'Push': null, etc. }
    let modeFlipped = false;

    const bonusTypes = ['Assist', 'Push', 'Bargain'];

    createPopup({
        createContent: (popup, close) => {
            // Title
            const title = document.createElement('div');
            title.className = 'dice-popup-title';
            title.textContent = skillName;
            if (subtitle) {
                const subtitleSpan = document.createElement('span');
                subtitleSpan.className = 'dice-popup-subtitle';
                subtitleSpan.textContent = ` — ${subtitle}`;
                title.appendChild(subtitleSpan);
            }
            popup.insertBefore(title, popup.firstChild);

            // Zero dice indicator
            const zeroDiceIndicator = document.createElement('div');
            zeroDiceIndicator.className = 'dice-zero-indicator';
            zeroDiceIndicator.textContent = '(Worst of 2)';
            zeroDiceIndicator.style.display = startedAsZeroDice ? 'block' : 'none';
            popup.appendChild(zeroDiceIndicator);

            // Dice container
            const diceContainer = document.createElement('div');
            diceContainer.className = 'dice-container';
            popup.appendChild(diceContainer);

            // Result display
            const resultDiv = document.createElement('div');
            resultDiv.className = 'dice-result';
            popup.appendChild(resultDiv);

            // Bonus section
            const bonusSection = document.createElement('div');
            bonusSection.className = 'dice-bonus-section';

            const bonusColumns = {};

            bonusTypes.forEach(type => {
                const column = document.createElement('div');
                column.className = 'dice-bonus-column';

                const dieDisplay = document.createElement('div');
                dieDisplay.className = 'dice-bonus-die-slot';
                column.appendChild(dieDisplay);

                const btn = document.createElement('button');
                btn.className = 'dice-bonus-btn';
                btn.textContent = type;
                btn.addEventListener('click', () => {
                    btn.disabled = true;
                    addBonusDie(type, dieDisplay);
                });
                column.appendChild(btn);

                bonusColumns[type] = { column, dieDisplay, btn };
                bonusSection.appendChild(column);
            });
            popup.appendChild(bonusSection);

            function getAllDice() {
                const actualBonusDice = Object.values(bonusDice).filter(v => v !== null);
                return [...originalDice, ...actualBonusDice];
            }

            function updateDisplay() {
                const allDice = getAllDice();
                const isZeroDice = startedAsZeroDice && !modeFlipped;
                const result = evaluateResult(allDice, isZeroDice);

                zeroDiceIndicator.style.display = isZeroDice ? 'block' : 'none';

                // Update original dice display
                diceContainer.innerHTML = '';
                originalDice.forEach((value, idx) => {
                    const die = document.createElement('div');
                    die.className = `die ${getDieClass(value)}`;
                    if (result.resultClass === 'critical' && value === 6) {
                        die.classList.add('selected');
                    } else if (result.resultClass !== 'critical' && idx === result.selectedIndex) {
                        die.classList.add('selected');
                    }
                    die.textContent = value;
                    diceContainer.appendChild(die);
                });

                // Update bonus dice highlighting
                let bonusIdx = originalDice.length;
                bonusTypes.forEach(type => {
                    if (bonusDice[type] !== undefined && bonusDice[type] !== null) {
                        const dieEl = bonusColumns[type].dieDisplay.querySelector('.dice-bonus-die');
                        if (dieEl) {
                            dieEl.classList.remove('selected');
                            if (result.resultClass === 'critical' && bonusDice[type] === 6) {
                                dieEl.classList.add('selected');
                            } else if (result.resultClass !== 'critical' && bonusIdx === result.selectedIndex) {
                                dieEl.classList.add('selected');
                            }
                        }
                        bonusIdx++;
                    }
                });

                // Update result
                resultDiv.className = `dice-result ${result.resultClass}`;
                resultDiv.textContent = result.resultName;
            }

            function addBonusDie(type, dieDisplay) {
                if (startedAsZeroDice && !modeFlipped) {
                    // First bonus flips from "worst of 2" to "best of 2"
                    modeFlipped = true;
                    bonusDice[type] = null;

                    const iconEl = document.createElement('div');
                    iconEl.className = 'dice-bonus-die dice-mode-flip';
                    iconEl.textContent = '🔁';
                    dieDisplay.appendChild(iconEl);
                } else {
                    // Normal case: add a bonus die
                    const newDie = rollD6();
                    bonusDice[type] = newDie;

                    const dieEl = document.createElement('div');
                    dieEl.className = `dice-bonus-die ${getDieClass(newDie)}`;
                    dieEl.textContent = newDie;
                    dieDisplay.appendChild(dieEl);
                }

                updateDisplay();
            }

            updateDisplay();
        }
    });
}

// ============================================================================
// Load Track Utilities
// ============================================================================

/**
 * Get maximum load capacity for a load type
 * @param {string} loadType - 'light', 'normal', or 'heavy'
 * @returns {number} Maximum load capacity
 */
export function getLoadCapacity(loadType) {
    return LOAD_CAPACITY[loadType] || LOAD_CAPACITY.light;
}
