/**
 * Fate.js - Fate/Fudge dice system
 *
 * Pure functions for Fate Core dice rolling.
 * Fate dice have three sides: minus (-1), blank (0), plus (+1)
 *
 * Standard roll is 4dF, results typically range from -4 to +4
 */

/**
 * Roll a single Fate die
 * @returns {Object} - { value: number (-1, 0, 1), symbol: string (-, 0, +) }
 */
export function rollFateDie() {
    const result = Math.floor(Math.random() * 3); // 0, 1, or 2

    switch (result) {
        case 0:
            return { value: -1, symbol: '-' };
        case 1:
            return { value: 0, symbol: '0' };
        case 2:
            return { value: 1, symbol: '+' };
        default:
            // Should never happen, but TypeScript-friendly
            return { value: 0, symbol: '0' };
    }
}

/**
 * Roll multiple Fate dice (standard is 4dF)
 * @param {number} [numDice=4] - Number of Fate dice to roll
 * @returns {Object} - { rolls: Array, total: number, symbols: string }
 */
export function rollFateDice(numDice = 4) {
    if (!Number.isInteger(numDice) || numDice < 1) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be a positive integer.`);
    }

    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(rollFateDie());
    }

    const total = rolls.reduce((sum, roll) => sum + roll.value, 0);
    const symbols = rolls.map(r => r.symbol).join(', ');

    return { rolls, total, symbols };
}

/**
 * Format Fate dice total with proper sign
 * @param {number} total - The total to format
 * @returns {string} - Formatted string like "+2", "0", or "-1"
 */
export function formatFateTotal(total) {
    if (total > 0) {
        return `+${total}`;
    } else if (total === 0) {
        return '0';
    } else {
        return total.toString();
    }
}

/**
 * Format a Fate dice roll for history display
 * @param {Object} result - Result object from rollFateDice
 * @returns {string} - Formatted string like "Rolled 4dF (+, -, , +) = +1"
 */
export function formatFateRoll(result) {
    const { rolls, total } = result;
    const numDice = rolls.length;
    const symbols = rolls.map(r => r.symbol).join(', ');
    const totalString = formatFateTotal(total);

    return `Rolled ${numDice}dF (${symbols}) = ${totalString}`;
}

/**
 * Get the display symbol for Fate die value
 * @param {number} value - Die value (-1, 0, or 1)
 * @returns {string} - Symbol (- for minus, blank for zero, + for plus)
 */
export function getFateSymbol(value) {
    switch (value) {
        case 1:
            return '+';
        case -1:
            return '-';
        case 0:
        default:
            return ' ';  // Blank for zero
    }
}

/**
 * Get the interpretation of a Fate roll result
 * Based on the Fate Core ladder
 * @param {number} total - The total rolled
 * @param {number} [skillLevel=0] - Character's skill level
 * @returns {Object} - { effectiveLevel: number, descriptor: string }
 */
export function interpretFateRoll(total, skillLevel = 0) {
    const effectiveLevel = total + skillLevel;

    // Fate ladder descriptors
    const ladder = [
        { min: 8, descriptor: 'Legendary' },
        { min: 7, descriptor: 'Epic' },
        { min: 6, descriptor: 'Fantastic' },
        { min: 5, descriptor: 'Superb' },
        { min: 4, descriptor: 'Great' },
        { min: 3, descriptor: 'Good' },
        { min: 2, descriptor: 'Fair' },
        { min: 1, descriptor: 'Average' },
        { min: 0, descriptor: 'Mediocre' },
        { min: -1, descriptor: 'Poor' },
        { min: -2, descriptor: 'Terrible' },
        { min: -Infinity, descriptor: 'Abysmal' }
    ];

    const entry = ladder.find(level => effectiveLevel >= level.min);

    return {
        effectiveLevel,
        descriptor: entry ? entry.descriptor : 'Abysmal'
    };
}

/**
 * Calculate probability distribution for Fate dice
 * @param {number} [numDice=4] - Number of Fate dice
 * @returns {Object} - Map of result -> probability
 */
export function getFateProbabilities(numDice = 4) {
    // For 4dF, the probabilities are well-known
    if (numDice === 4) {
        return {
            '-4': 0.0123,  // 1.23%
            '-3': 0.0494,  // 4.94%
            '-2': 0.1235,  // 12.35%
            '-1': 0.1975,  // 19.75%
            '0': 0.2346,   // 23.46%
            '+1': 0.1975,  // 19.75%
            '+2': 0.1235,  // 12.35%
            '+3': 0.0494,  // 4.94%
            '+4': 0.0123   // 1.23%
        };
    }

    // For other numbers, would need to calculate combinatorially
    // This is a simplified version
    throw new Error('Probability calculation only implemented for 4dF');
}
