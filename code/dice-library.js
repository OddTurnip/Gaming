/**
 * DiceLibrary.js - Core dice rolling utilities
 *
 * Pure functions for dice rolling with NO DOM dependencies.
 * Can be used in browser, Node.js, or tests.
 *
 * Provides basic dice mechanics used by all dice rollers.
 */

/**
 * Roll a single die
 * @param {number} sides - Number of sides on the die
 * @returns {number} - Random number between 1 and sides (inclusive)
 * @throws {Error} - If sides is not a positive integer
 */
export function rollSingleDie(sides) {
    if (!Number.isInteger(sides) || sides < 1) {
        throw new Error(`Invalid dice sides: ${sides}. Must be a positive integer.`);
    }
    return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice of the same type
 * @param {number} numDice - Number of dice to roll
 * @param {number} diceType - Number of sides per die
 * @returns {Object} - { rolls: number[], total: number }
 * @throws {Error} - If numDice or diceType is invalid
 */
export function rollDice(numDice, diceType) {
    if (!Number.isInteger(numDice) || numDice < 1) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be a positive integer.`);
    }
    if (!Number.isInteger(diceType) || diceType < 1) {
        throw new Error(`Invalid dice type: ${diceType}. Must be a positive integer.`);
    }

    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(rollSingleDie(diceType));
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0);

    return { rolls, total };
}

/**
 * Roll a single exploding die and return detailed breakdown
 * @param {number} diceType - Number of sides on the die
 * @param {string} [mode='standard'] - 'standard' (explode once) or 'compound' (keep exploding)
 * @returns {Object} - { value: number, display: string, breakdown: number[] }
 * @throws {Error} - If diceType is invalid
 */
export function rollSingleExplodingDie(diceType, mode = 'standard') {
    if (!Number.isInteger(diceType) || diceType < 2) {
        throw new Error(`Invalid dice type: ${diceType}. Must be at least 2.`);
    }

    const breakdown = [];
    let total = 0;
    let roll = rollSingleDie(diceType);

    breakdown.push(roll);
    total += roll;

    // Check for explosions
    if (mode === 'standard') {
        // Explode only once
        if (roll === diceType) {
            roll = rollSingleDie(diceType);
            breakdown.push(roll);
            total += roll;
        }
    } else {
        // Compound mode - keep exploding
        while (roll === diceType) {
            roll = rollSingleDie(diceType);
            breakdown.push(roll);
            total += roll;
        }
    }

    return {
        value: total,
        display: breakdown.join('+'),
        breakdown: breakdown
    };
}

/**
 * Roll dice with exploding mechanic (when max value is rolled, roll again and add)
 * @param {number} numDice - Number of dice to roll
 * @param {number} diceType - Number of sides per die
 * @param {string} [mode='standard'] - 'standard' (explode once) or 'compound' (keep exploding)
 * @returns {Object} - { rolls: number[], total: number, explosions: number }
 */
export function rollExploding(numDice, diceType, mode = 'standard') {
    if (!Number.isInteger(numDice) || numDice < 1) {
        throw new Error(`Invalid number of dice: ${numDice}`);
    }
    if (!Number.isInteger(diceType) || diceType < 2) {
        throw new Error(`Invalid dice type: ${diceType}. Must be at least 2.`);
    }

    const rolls = [];
    let explosions = 0;

    for (let i = 0; i < numDice; i++) {
        let dieTotal = 0;
        let roll = rollSingleDie(diceType);
        dieTotal += roll;

        // Check for explosions
        while (roll === diceType) {
            explosions++;
            roll = rollSingleDie(diceType);
            dieTotal += roll;

            // Standard mode only explodes once
            if (mode === 'standard') {
                break;
            }
        }

        rolls.push(dieTotal);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0);

    return { rolls, total, explosions };
}

/**
 * Drop dice (remove highest or lowest values)
 * @param {number[]} rolls - Array of die results
 * @param {number} dropCount - Number of dice to drop
 * @param {string} [dropType='lowest'] - 'lowest' or 'highest'
 * @returns {Object} - { keptRolls: number[], droppedRolls: number[], total: number }
 */
export function dropDice(rolls, dropCount, dropType = 'lowest') {
    if (!Array.isArray(rolls) || rolls.length === 0) {
        throw new Error('Rolls must be a non-empty array');
    }
    if (!Number.isInteger(dropCount) || dropCount < 0) {
        throw new Error(`Invalid drop count: ${dropCount}`);
    }
    if (dropCount >= rolls.length) {
        throw new Error(`Cannot drop ${dropCount} dice from ${rolls.length} dice`);
    }

    // Create a copy and sort
    const sortedRolls = [...rolls].sort((a, b) => a - b);

    let droppedRolls, keptRolls;
    if (dropType === 'lowest') {
        droppedRolls = sortedRolls.slice(0, dropCount);
        keptRolls = sortedRolls.slice(dropCount);
    } else if (dropType === 'highest') {
        droppedRolls = sortedRolls.slice(-dropCount);
        keptRolls = sortedRolls.slice(0, -dropCount);
    } else {
        throw new Error(`Invalid drop type: ${dropType}. Must be 'lowest' or 'highest'.`);
    }

    const total = keptRolls.reduce((sum, roll) => sum + roll, 0);

    return { keptRolls, droppedRolls, total };
}

/**
 * Count successes based on a threshold
 * @param {number[]} rolls - Array of die results
 * @param {number} threshold - The threshold value
 * @param {string} [comparison='>='] - Comparison operator: '>=', '>', '<=', '<', '=='
 * @returns {Object} - { successCount: number, successes: number[], failures: number[] }
 */
export function countSuccesses(rolls, threshold, comparison = '>=') {
    if (!Array.isArray(rolls)) {
        throw new Error('Rolls must be an array');
    }
    if (!Number.isInteger(threshold)) {
        throw new Error(`Invalid threshold: ${threshold}`);
    }

    const successes = [];
    const failures = [];

    rolls.forEach(roll => {
        let isSuccess = false;

        switch (comparison) {
            case '>=':
                isSuccess = roll >= threshold;
                break;
            case '>':
                isSuccess = roll > threshold;
                break;
            case '<=':
                isSuccess = roll <= threshold;
                break;
            case '<':
                isSuccess = roll < threshold;
                break;
            case '==':
            case '=':
                isSuccess = roll === threshold;
                break;
            default:
                throw new Error(`Invalid comparison: ${comparison}`);
        }

        if (isSuccess) {
            successes.push(roll);
        } else {
            failures.push(roll);
        }
    });

    return {
        successCount: successes.length,
        successes,
        failures
    };
}

/**
 * Calculate statistics for a set of rolls
 * @param {number[]} rolls - Array of die results
 * @returns {Object} - { min, max, average, sum }
 */
export function calculateStats(rolls) {
    if (!Array.isArray(rolls) || rolls.length === 0) {
        return { min: 0, max: 0, average: 0, sum: 0 };
    }

    const sum = rolls.reduce((a, b) => a + b, 0);

    return {
        min: Math.min(...rolls),
        max: Math.max(...rolls),
        average: sum / rolls.length,
        sum
    };
}

/**
 * Format a dice roll result for display
 * @param {number} numDice - Number of dice rolled
 * @param {number} diceType - Type of dice (number of sides)
 * @param {number[]} rolls - Array of individual roll results
 * @param {number} total - Sum of all rolls
 * @returns {string} - Formatted string like "Rolled 3d6 (3, 6, 1) = 10"
 */
export function formatDiceRoll(numDice, diceType, rolls, total) {
    const rollsString = rolls.join(', ');
    return `Rolled ${numDice}d${diceType} (${rollsString}) = ${total}`;
}

/**
 * Parse dice notation (e.g., "3d6", "2d20", "d10")
 * @param {string} notation - Dice notation string
 * @returns {Object} - { numDice: number, diceType: number }
 * @throws {Error} - If notation is invalid
 */
export function parseDiceNotation(notation) {
    if (typeof notation !== 'string') {
        throw new Error('Notation must be a string');
    }

    const trimmed = notation.trim().toLowerCase();

    // Match patterns like "3d6", "d20", "2d10"
    const match = trimmed.match(/^(\d*)d(\d+)$/);

    if (!match) {
        throw new Error(`Invalid dice notation: ${notation}`);
    }

    const numDice = match[1] === '' ? 1 : parseInt(match[1]);
    const diceType = parseInt(match[2]);

    if (numDice < 1 || diceType < 1) {
        throw new Error(`Invalid dice notation: ${notation}`);
    }

    return { numDice, diceType };
}

/**
 * Roll multiple dice with comprehensive modifiers
 * Combines exploding, dropping, and success counting in one function
 *
 * @param {Object} options - Roll configuration
 * @param {number} options.numDice - Number of dice to roll
 * @param {number} options.diceType - Number of sides on each die
 * @param {boolean} [options.exploding=false] - Whether dice explode
 * @param {string} [options.explodingMode='standard'] - 'standard', 'compound', or 'penetrating'
 * @param {boolean} [options.drop=false] - Whether to drop dice
 * @param {string} [options.dropType='lowest'] - 'lowest' or 'highest'
 * @param {number} [options.dropCount=1] - How many dice to drop
 * @param {boolean} [options.countSuccesses=false] - Whether to count successes
 * @param {number} [options.successThreshold=4] - Minimum value for success
 * @param {string} [options.successComparison='>='] - '>=', '==', or '<='
 * @returns {Object} - { rolls, keptRolls, droppedRolls, total, successCount }
 * @throws {Error} - If options are invalid
 */
export function rollDiceWithModifiers(options) {
    const {
        numDice,
        diceType,
        exploding = false,
        explodingMode = 'standard',
        drop = false,
        dropType = 'lowest',
        dropCount = 1,
        countSuccesses: countSuccessesEnabled = false,
        successThreshold = 4,
        successComparison = '>='
    } = options;

    // Validate inputs
    if (!Number.isInteger(numDice) || numDice < 1) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be a positive integer.`);
    }
    if (!Number.isInteger(diceType) || diceType < 1) {
        throw new Error(`Invalid dice type: ${diceType}. Must be a positive integer.`);
    }

    // Step 1: Roll dice (with or without exploding)
    let rolls;
    if (exploding) {
        rolls = [];
        for (let i = 0; i < numDice; i++) {
            rolls.push(rollSingleExplodingDie(diceType, explodingMode));
        }
    } else {
        rolls = [];
        for (let i = 0; i < numDice; i++) {
            const value = rollSingleDie(diceType);
            rolls.push({
                value: value,
                display: String(value),
                breakdown: [value]
            });
        }
    }

    // Step 2: Apply drop mechanic if enabled
    let keptRolls = rolls;
    let droppedRolls = [];

    if (drop) {
        const rollValues = rolls.map(r => r.value);
        const dropResult = dropDice(rollValues, dropCount, dropType);

        // Map back to roll objects, preserving order
        const keptCopy = [...dropResult.keptRolls];
        const droppedCopy = [...dropResult.droppedRolls];
        keptRolls = [];
        droppedRolls = [];

        for (const roll of rolls) {
            const keptIndex = keptCopy.indexOf(roll.value);
            const droppedIndex = droppedCopy.indexOf(roll.value);

            if (keptIndex !== -1) {
                keptRolls.push(roll);
                keptCopy.splice(keptIndex, 1);
            } else if (droppedIndex !== -1) {
                droppedRolls.push(roll);
                droppedCopy.splice(droppedIndex, 1);
            }
        }
    }

    // Step 3: Calculate total from kept rolls
    const total = keptRolls.reduce((sum, roll) => sum + roll.value, 0);

    // Step 4: Calculate success count if enabled
    let successCount = 0;
    if (countSuccessesEnabled) {
        const rollValues = keptRolls.map(r => r.value);
        const result = countSuccesses(rollValues, successThreshold, successComparison);
        successCount = result.successCount;
    }

    return {
        rolls,
        keptRolls,
        droppedRolls,
        total,
        successCount
    };
}

/**
 * Roll with advantage or disadvantage
 * Rolls twice and picks the better (advantage) or worse (disadvantage) result
 *
 * @param {string} mode - 'advantage' or 'disadvantage'
 * @param {Object} rollOptions - Options to pass to rollDiceWithModifiers
 * @returns {Object} - { chosenRoll, otherRoll, mode }
 * @throws {Error} - If mode is invalid
 */
export function rollWithAdvantage(mode, rollOptions) {
    if (mode !== 'advantage' && mode !== 'disadvantage') {
        throw new Error(`Invalid mode: ${mode}. Must be 'advantage' or 'disadvantage'.`);
    }

    // Perform two rolls with the same options
    const roll1 = rollDiceWithModifiers(rollOptions);
    const roll2 = rollDiceWithModifiers(rollOptions);

    // Determine comparison value (successCount if counting successes, otherwise total)
    const useSuccessCount = rollOptions.countSuccesses || false;
    const compareKey = useSuccessCount ? 'successCount' : 'total';

    // Choose the appropriate roll based on mode
    let chosenRoll, otherRoll;
    if (mode === 'advantage') {
        if (roll1[compareKey] >= roll2[compareKey]) {
            chosenRoll = roll1;
            otherRoll = roll2;
        } else {
            chosenRoll = roll2;
            otherRoll = roll1;
        }
    } else { // disadvantage
        if (roll1[compareKey] <= roll2[compareKey]) {
            chosenRoll = roll1;
            otherRoll = roll2;
        } else {
            chosenRoll = roll2;
            otherRoll = roll1;
        }
    }

    return {
        chosenRoll,
        otherRoll,
        mode
    };
}
