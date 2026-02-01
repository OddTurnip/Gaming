/**
 * Tests for Blades.js - Blades in the Dark dice system
 *
 * Run with: npm test
 */

import { describe, it, expect, vi } from 'vitest';
import {
    rollBladesDice,
    getOutcome,
    getOutcomeColor,
    formatBladesRoll,
    getBladesProbabilities,
    getEffect,
    interpretBladesRoll
} from '../blades.js';

describe('rollBladesDice', () => {
    it('rolls specified number of dice', () => {
        const result = rollBladesDice(3);

        expect(result.rolls).toHaveLength(3);
        expect(result.rolls.every(r => r >= 1 && r <= 6)).toBe(true);
    });

    it('returns highest die as result', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // Return 0.5 for all rolls: Math.floor(0.5 * 6) + 1 = 4
        mockRandom.mockReturnValue(0.5);

        const result = rollBladesDice(3);

        expect(result.result).toBe(4);
        expect(result.rolls).toEqual([4, 4, 4]);

        mockRandom.mockRestore();
    });

    it('handles 0 dice (desperate roll)', () => {
        const result = rollBladesDice(0);

        expect(result.isZeroDice).toBe(true);
        expect(result.rolls).toHaveLength(2);
        expect(result.result).toBe(Math.min(...result.rolls));
        expect(result.isCritical).toBe(false);
    });

    it('detects critical success (multiple 6s)', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // Return values that give us 6s: Math.floor(0.99 * 6) + 1 = 6
        mockRandom.mockReturnValue(0.99);

        const result = rollBladesDice(3);

        expect(result.isCritical).toBe(true);
        expect(result.outcome).toBe('Critical Success');

        mockRandom.mockRestore();
    });

    it('single 6 is success but not critical', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // First roll = 6, others = 3
        mockRandom
            .mockReturnValueOnce(0.99)  // 6
            .mockReturnValue(0.3);       // 3

        const result = rollBladesDice(3);

        expect(result.isCritical).toBe(false);
        expect(result.outcome).toBe('Success');

        mockRandom.mockRestore();
    });

    it('throws error for invalid number of dice', () => {
        expect(() => rollBladesDice(-1)).toThrow('Invalid number of dice');
        expect(() => rollBladesDice(1.5)).toThrow('Invalid number of dice');
    });
});

describe('getOutcome', () => {
    it('returns "Critical Success" for critical', () => {
        expect(getOutcome(6, true)).toBe('Critical Success');
    });

    it('returns "Success" for 6', () => {
        expect(getOutcome(6, false)).toBe('Success');
    });

    it('returns "Mixed" for 4-5', () => {
        expect(getOutcome(4, false)).toBe('Mixed');
        expect(getOutcome(5, false)).toBe('Mixed');
    });

    it('returns "Failure" for 1-3', () => {
        expect(getOutcome(1, false)).toBe('Failure');
        expect(getOutcome(2, false)).toBe('Failure');
        expect(getOutcome(3, false)).toBe('Failure');
    });
});

describe('getOutcomeColor', () => {
    it('returns correct colors for outcomes', () => {
        expect(getOutcomeColor('Critical Success')).toBe('#FFD700'); // Gold
        expect(getOutcomeColor('Success')).toBe('#4CAF50'); // Green
        expect(getOutcomeColor('Mixed')).toBe('#FFA500'); // Orange
        expect(getOutcomeColor('Failure')).toBe('#F44336'); // Red
    });

    it('returns red for unknown outcome', () => {
        expect(getOutcomeColor('Unknown')).toBe('#F44336');
    });
});

describe('formatBladesRoll', () => {
    it('formats a normal roll', () => {
        const result = {
            rolls: [3, 5, 2],
            result: 5,
            outcome: 'Mixed',
            isZeroDice: false
        };

        const formatted = formatBladesRoll(result);

        expect(formatted).toBe('Rolled 3d6 [3, 5, 2] = 5 (Mixed)');
    });

    it('formats a zero dice roll', () => {
        const result = {
            rolls: [2, 4],
            result: 2,
            outcome: 'Failure',
            isZeroDice: true
        };

        const formatted = formatBladesRoll(result);

        expect(formatted).toBe('Rolled 0 dice (2d6, lowest) [2, 4] = 2 (Failure)');
    });
});

describe('getBladesProbabilities', () => {
    it('returns probabilities for 0-6 dice', () => {
        for (let i = 0; i <= 6; i++) {
            const probs = getBladesProbabilities(i);

            expect(probs).toHaveProperty('failure');
            expect(probs).toHaveProperty('mixed');
            expect(probs).toHaveProperty('success');
            expect(probs).toHaveProperty('critical');
        }
    });

    it('probabilities sum to approximately 1', () => {
        const probs = getBladesProbabilities(3);
        const sum = probs.failure + probs.mixed + probs.success + probs.critical;

        expect(sum).toBeCloseTo(1.0, 1);
    });

    it('more dice means lower failure rate', () => {
        const probs1 = getBladesProbabilities(1);
        const probs4 = getBladesProbabilities(4);

        expect(probs4.failure).toBeLessThan(probs1.failure);
    });

    it('more dice means higher critical rate', () => {
        const probs1 = getBladesProbabilities(1);
        const probs4 = getBladesProbabilities(4);

        expect(probs4.critical).toBeGreaterThan(probs1.critical);
    });

    it('0 dice has no critical success', () => {
        const probs = getBladesProbabilities(0);

        expect(probs.critical).toBe(0);
    });

    it('throws error for invalid dice count', () => {
        expect(() => getBladesProbabilities(-1)).toThrow('Invalid number of dice');
        expect(() => getBladesProbabilities(7)).toThrow('Invalid number of dice');
    });
});

describe('getEffect', () => {
    it('critical success gives great effect', () => {
        expect(getEffect('Critical Success', 'Risky')).toBe('Great');
    });

    it('success on controlled gives great effect', () => {
        expect(getEffect('Success', 'Controlled')).toBe('Great');
    });

    it('success on risky gives standard effect', () => {
        expect(getEffect('Success', 'Risky')).toBe('Standard');
    });

    it('mixed gives limited effect', () => {
        expect(getEffect('Mixed', 'Risky')).toBe('Limited');
    });

    it('failure gives limited effect', () => {
        expect(getEffect('Failure', 'Risky')).toBe('Limited');
    });
});

describe('interpretBladesRoll', () => {
    it('interprets a critical success', () => {
        const result = {
            outcome: 'Critical Success',
            rolls: [6, 6],
            result: 6,
            isCritical: true,
            isZeroDice: false
        };

        const interpretation = interpretBladesRoll(result, 'Risky');

        expect(interpretation.outcome).toBe('Critical Success');
        expect(interpretation.effect).toBe('Great');
        expect(interpretation.description).toContain('increased effect');
    });

    it('interprets a success', () => {
        const result = {
            outcome: 'Success',
            rolls: [6],
            result: 6,
            isCritical: false,
            isZeroDice: false
        };

        const interpretation = interpretBladesRoll(result, 'Risky');

        expect(interpretation.outcome).toBe('Success');
        expect(interpretation.description).toBe('You do it.');
    });

    it('interprets a mixed success with different positions', () => {
        const result = {
            outcome: 'Mixed',
            rolls: [4],
            result: 4,
            isCritical: false,
            isZeroDice: false
        };

        const risky = interpretBladesRoll(result, 'Risky');
        expect(risky.description).toContain('consequence');

        const desperate = interpretBladesRoll(result, 'Desperate');
        expect(desperate.description).toContain('severe consequence');

        const controlled = interpretBladesRoll(result, 'Controlled');
        expect(controlled.description).toContain('minor consequence');
    });

    it('interprets a failure with different positions', () => {
        const result = {
            outcome: 'Failure',
            rolls: [2],
            result: 2,
            isCritical: false,
            isZeroDice: false
        };

        const risky = interpretBladesRoll(result, 'Risky');
        expect(risky.description).toContain('badly');

        const desperate = interpretBladesRoll(result, 'Desperate');
        expect(desperate.description).toContain('severe harm');

        const controlled = interpretBladesRoll(result, 'Controlled');
        expect(controlled.description).toContain('falter');
    });
});
