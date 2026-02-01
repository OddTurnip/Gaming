/**
 * Tests for Fate.js - Fate/Fudge dice system
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import {
    rollFateDie,
    rollFateDice,
    formatFateTotal,
    formatFateRoll,
    getFateSymbol,
    interpretFateRoll,
    getFateProbabilities
} from '../fate.js';

describe('rollFateDie', () => {
    it('returns an object with value and symbol', () => {
        const die = rollFateDie();

        expect(die).toHaveProperty('value');
        expect(die).toHaveProperty('symbol');
    });

    it('returns value between -1 and 1', () => {
        const rolls = Array(100).fill(0).map(() => rollFateDie());
        const values = rolls.map(r => r.value);

        expect(values.every(v => v >= -1 && v <= 1)).toBe(true);
    });

    it('returns correct symbol for value', () => {
        const rolls = Array(100).fill(0).map(() => rollFateDie());

        rolls.forEach(roll => {
            if (roll.value === -1) {
                expect(roll.symbol).toBe('-');
            } else if (roll.value === 0) {
                expect(roll.symbol).toBe('0');
            } else if (roll.value === 1) {
                expect(roll.symbol).toBe('+');
            }
        });
    });

    it('generates all three possible outcomes', () => {
        const rolls = Array(300).fill(0).map(() => rollFateDie());
        const values = new Set(rolls.map(r => r.value));

        // With 300 rolls, we should see all three outcomes
        expect(values.has(-1)).toBe(true);
        expect(values.has(0)).toBe(true);
        expect(values.has(1)).toBe(true);
    });
});

describe('rollFateDice', () => {
    it('rolls 4 dice by default', () => {
        const result = rollFateDice();

        expect(result.rolls).toHaveLength(4);
    });

    it('rolls specified number of dice', () => {
        const result = rollFateDice(6);

        expect(result.rolls).toHaveLength(6);
    });

    it('calculates total correctly', () => {
        const result = rollFateDice(4);
        const expectedTotal = result.rolls.reduce((sum, die) => sum + die.value, 0);

        expect(result.total).toBe(expectedTotal);
    });

    it('returns symbols string', () => {
        const result = rollFateDice(4);

        expect(result.symbols).toBeDefined();
        expect(typeof result.symbols).toBe('string');
        expect(result.symbols.includes(',')).toBe(true);
    });

    it('total is within expected range', () => {
        const result = rollFateDice(4);

        expect(result.total).toBeGreaterThanOrEqual(-4);
        expect(result.total).toBeLessThanOrEqual(4);
    });

    it('throws error for invalid number of dice', () => {
        expect(() => rollFateDice(0)).toThrow('Invalid number of dice');
        expect(() => rollFateDice(-1)).toThrow('Invalid number of dice');
        expect(() => rollFateDice(1.5)).toThrow('Invalid number of dice');
    });
});

describe('formatFateTotal', () => {
    it('formats positive totals with plus sign', () => {
        expect(formatFateTotal(1)).toBe('+1');
        expect(formatFateTotal(4)).toBe('+4');
    });

    it('formats zero as "0"', () => {
        expect(formatFateTotal(0)).toBe('0');
    });

    it('formats negative totals without extra sign', () => {
        expect(formatFateTotal(-1)).toBe('-1');
        expect(formatFateTotal(-4)).toBe('-4');
    });
});

describe('formatFateRoll', () => {
    it('formats a complete roll result', () => {
        const result = {
            rolls: [
                { value: 1, symbol: '+' },
                { value: -1, symbol: '-' },
                { value: 0, symbol: '0' },
                { value: 1, symbol: '+' }
            ],
            total: 1
        };

        const formatted = formatFateRoll(result);

        expect(formatted).toBe('Rolled 4dF (+, -, 0, +) = +1');
    });

    it('handles different totals correctly', () => {
        const result = {
            rolls: [
                { value: -1, symbol: '-' },
                { value: -1, symbol: '-' }
            ],
            total: -2
        };

        const formatted = formatFateRoll(result);

        expect(formatted).toBe('Rolled 2dF (-, -) = -2');
    });
});

describe('getFateSymbol', () => {
    it('returns plus symbol for 1', () => {
        expect(getFateSymbol(1)).toBe('+');
    });

    it('returns minus symbol for -1', () => {
        expect(getFateSymbol(-1)).toBe('-');
    });

    it('returns space for 0', () => {
        expect(getFateSymbol(0)).toBe(' ');
    });
});

describe('interpretFateRoll', () => {
    it('interprets roll with skill level', () => {
        const interpretation = interpretFateRoll(2, 3);

        expect(interpretation.effectiveLevel).toBe(5); // 2 + 3
        expect(interpretation.descriptor).toBe('Superb');
    });

    it('interprets roll without skill level', () => {
        const interpretation = interpretFateRoll(0);

        expect(interpretation.effectiveLevel).toBe(0);
        expect(interpretation.descriptor).toBe('Mediocre');
    });

    it('has correct ladder descriptors', () => {
        expect(interpretFateRoll(8, 0).descriptor).toBe('Legendary');
        expect(interpretFateRoll(7, 0).descriptor).toBe('Epic');
        expect(interpretFateRoll(6, 0).descriptor).toBe('Fantastic');
        expect(interpretFateRoll(5, 0).descriptor).toBe('Superb');
        expect(interpretFateRoll(4, 0).descriptor).toBe('Great');
        expect(interpretFateRoll(3, 0).descriptor).toBe('Good');
        expect(interpretFateRoll(2, 0).descriptor).toBe('Fair');
        expect(interpretFateRoll(1, 0).descriptor).toBe('Average');
        expect(interpretFateRoll(0, 0).descriptor).toBe('Mediocre');
        expect(interpretFateRoll(-1, 0).descriptor).toBe('Poor');
        expect(interpretFateRoll(-2, 0).descriptor).toBe('Terrible');
        expect(interpretFateRoll(-10, 0).descriptor).toBe('Abysmal');
    });
});

describe('getFateProbabilities', () => {
    it('returns probability map for 4dF', () => {
        const probs = getFateProbabilities(4);

        expect(probs).toHaveProperty('-4');
        expect(probs).toHaveProperty('0');
        expect(probs).toHaveProperty('+4');
    });

    it('has probabilities that sum to approximately 1', () => {
        const probs = getFateProbabilities(4);
        const sum = Object.values(probs).reduce((a, b) => a + b, 0);

        expect(sum).toBeCloseTo(1.0, 2);
    });

    it('zero is most likely outcome', () => {
        const probs = getFateProbabilities(4);

        expect(probs['0']).toBeGreaterThan(probs['+1']);
        expect(probs['0']).toBeGreaterThan(probs['-1']);
    });

    it('throws error for unsupported dice count', () => {
        expect(() => getFateProbabilities(5)).toThrow('only implemented for 4dF');
    });
});
