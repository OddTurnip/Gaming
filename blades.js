/**
 * Blades.js - Blades in the Dark dice system
 *
 * Pure functions for Blades in the Dark dice rolling.
 * Uses d6 dice pools where you take the highest result.
 * Special case: 0 dice means roll 2d6 and take the lowest.
 *
 * Results: 1-3 = Failure, 4-5 = Mixed Success, 6 = Success, Multiple 6s = Critical Success
 */

import { rollSingleDie } from './dice-library.js';

/**
 * Roll a Blades in the Dark dice pool
 * @param {number} numDice - Number of dice to roll (0-6 typically)
 * @returns {Object} - { rolls: number[], result: number, outcome: string, isZeroDice: boolean, isCritical: boolean }
 */
export function rollBladesDice(numDice) {
    if (!Number.isInteger(numDice) || numDice < 0) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be a non-negative integer.`);
    }

    let rolls = [];
    let result;
    let isZeroDice = false;
    let isCritical = false;

    if (numDice === 0) {
        // Special case: 0 dice - roll 2 dice and take the lowest
        isZeroDice = true;
        rolls = [rollSingleDie(6), rollSingleDie(6)];
        result = Math.min(...rolls);
        // 0 dice can never be a critical success
        isCritical = false;
    } else {
        // Normal case: roll the specified number of dice and take highest
        for (let i = 0; i < numDice; i++) {
            rolls.push(rollSingleDie(6));
        }
        result = Math.max(...rolls);

        // Check for critical success (multiple 6s)
        const sixCount = rolls.filter(r => r === 6).length;
        isCritical = sixCount > 1;
    }

    const outcome = getOutcome(result, isCritical);

    return {
        rolls,
        result,
        outcome,
        isZeroDice,
        isCritical
    };
}

/**
 * Determine the outcome based on the result
 * @param {number} result - The highest die result
 * @param {boolean} isCritical - Whether this is a critical success
 * @returns {string} - The outcome text
 */
export function getOutcome(result, isCritical = false) {
    if (isCritical) {
        return 'Critical Success';
    } else if (result === 6) {
        return 'Success';
    } else if (result >= 4) {
        return 'Mixed';
    } else {
        return 'Failure';
    }
}

/**
 * Get the color for an outcome (for UI styling)
 * @param {string} outcome - The outcome text
 * @returns {string} - Color code
 */
export function getOutcomeColor(outcome) {
    switch (outcome) {
        case 'Critical Success':
            return '#FFD700'; // Gold
        case 'Success':
            return '#4CAF50'; // Green
        case 'Mixed':
            return '#FFA500'; // Orange
        case 'Failure':
        default:
            return '#F44336'; // Red
    }
}

/**
 * Format a Blades roll for history display
 * @param {Object} result - Result object from rollBladesDice
 * @returns {string} - Formatted string like "Rolled 3d6 [4, 6, 2] = 6 (Success)"
 */
export function formatBladesRoll(result) {
    const { rolls, result: dieResult, outcome, isZeroDice } = result;
    const rollsString = rolls.join(', ');
    const diceText = isZeroDice ? '0 dice (2d6, lowest)' : `${rolls.length}d6`;

    return `Rolled ${diceText} [${rollsString}] = ${dieResult} (${outcome})`;
}

/**
 * Calculate success probabilities for Blades dice pools
 * @param {number} numDice - Number of dice in the pool
 * @returns {Object} - { failure: number, mixed: number, success: number, critical: number }
 */
export function getBladesProbabilities(numDice) {
    if (!Number.isInteger(numDice) || numDice < 0 || numDice > 6) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be 0-6.`);
    }

    // Pre-calculated probabilities (approximate percentages)
    const probabilities = {
        0: { failure: 0.75, mixed: 0.22, success: 0.03, critical: 0.00 },
        1: { failure: 0.50, mixed: 0.33, success: 0.17, critical: 0.00 },
        2: { failure: 0.25, mixed: 0.44, success: 0.28, critical: 0.03 },
        3: { failure: 0.13, mixed: 0.45, success: 0.35, critical: 0.07 },
        4: { failure: 0.06, mixed: 0.42, success: 0.39, critical: 0.13 },
        5: { failure: 0.03, mixed: 0.37, success: 0.40, critical: 0.20 },
        6: { failure: 0.02, mixed: 0.33, success: 0.40, critical: 0.25 }
    };

    return probabilities[numDice] || { failure: 1, mixed: 0, success: 0, critical: 0 };
}

/**
 * Get the effect level for a Blades roll
 * Used for determining consequences and benefits
 * @param {string} outcome - The outcome text
 * @param {string} [position='Controlled'] - Position: 'Controlled', 'Risky', 'Desperate'
 * @returns {string} - Effect level: 'Limited', 'Standard', 'Great'
 */
export function getEffect(outcome, position = 'Risky') {
    // Simplified effect system
    if (outcome === 'Critical Success') {
        return 'Great';
    } else if (outcome === 'Success') {
        if (position === 'Controlled') {
            return 'Great';
        } else {
            return 'Standard';
        }
    } else if (outcome === 'Mixed') {
        return 'Limited';
    } else {
        return 'Limited';
    }
}

/**
 * Interpret a Blades roll with position and effect
 * @param {Object} result - Result object from rollBladesDice
 * @param {string} [position='Risky'] - Position: 'Controlled', 'Risky', 'Desperate'
 * @returns {Object} - { outcome: string, effect: string, description: string }
 */
export function interpretBladesRoll(result, position = 'Risky') {
    const { outcome } = result;
    const effect = getEffect(outcome, position);

    let description;
    switch (outcome) {
        case 'Critical Success':
            description = 'You do it with increased effect.';
            break;
        case 'Success':
            description = 'You do it.';
            break;
        case 'Mixed':
            if (position === 'Desperate') {
                description = 'You do it, but there\'s a severe consequence.';
            } else if (position === 'Risky') {
                description = 'You do it, but there\'s a consequence.';
            } else {
                description = 'You do it, but there\'s a minor consequence.';
            }
            break;
        case 'Failure':
            if (position === 'Desperate') {
                description = 'It goes badly. You suffer severe harm or a serious complication.';
            } else if (position === 'Risky') {
                description = 'Things go badly. You suffer harm, a complication, or reduced effect.';
            } else {
                description = 'You falter. Face a lesser consequence or reduced effect.';
            }
            break;
        default:
            description = '';
    }

    return {
        outcome,
        effect,
        description
    };
}
