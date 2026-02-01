/**
 * Tests for Characters/js/blades-system.js - Blades in the Dark utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
    SYSTEM_NAME,
    LOAD_CAPACITY,
    rollDicePool,
    evaluateResult
} from '../js/blades-system.js';

describe('Constants', () => {
    it('SYSTEM_NAME is "Blades"', () => {
        expect(SYSTEM_NAME).toBe('Blades');
    });

    it('LOAD_CAPACITY has correct values', () => {
        expect(LOAD_CAPACITY.light).toBe(3);
        expect(LOAD_CAPACITY.normal).toBe(5);
        expect(LOAD_CAPACITY.heavy).toBe(6);
    });
});

describe('rollDicePool', () => {
    it('rolls correct number of dice', () => {
        const result = rollDicePool(3);
        expect(result).toHaveLength(3);
    });

    it('rolls 2 dice for 0 dice pool', () => {
        const result = rollDicePool(0);
        expect(result).toHaveLength(2);
    });

    it('returns values between 1 and 6', () => {
        const result = rollDicePool(10);
        result.forEach(die => {
            expect(die).toBeGreaterThanOrEqual(1);
            expect(die).toBeLessThanOrEqual(6);
        });
    });
});

describe('evaluateResult', () => {
    it('identifies Critical with multiple 6s', () => {
        const result = evaluateResult([6, 6, 3, 2]);
        expect(result.resultName).toBe('Critical!');
        expect(result.resultClass).toBe('critical');
        expect(result.selectedValue).toBe(6);
    });

    it('identifies Success with single 6', () => {
        const result = evaluateResult([6, 3, 2, 1]);
        expect(result.resultName).toBe('Success');
        expect(result.resultClass).toBe('success');
        expect(result.selectedValue).toBe(6);
    });

    it('identifies Mixed with 4 or 5 as highest', () => {
        const result1 = evaluateResult([5, 3, 2, 1]);
        expect(result1.resultName).toBe('Mixed');
        expect(result1.resultClass).toBe('mixed');

        const result2 = evaluateResult([4, 3, 2, 1]);
        expect(result2.resultName).toBe('Mixed');
        expect(result2.resultClass).toBe('mixed');
    });

    it('identifies Failure with 1-3 as highest', () => {
        const result = evaluateResult([3, 2, 1, 1]);
        expect(result.resultName).toBe('Failure');
        expect(result.resultClass).toBe('failure');
    });

    it('handles zero dice mode (takes worst)', () => {
        // With isZeroDice=true, takes the lower of two dice
        const result = evaluateResult([6, 2], true);
        expect(result.selectedValue).toBe(2);
        expect(result.isZeroDice).toBe(true);
    });

    it('includes all expected fields', () => {
        const result = evaluateResult([5, 3]);
        expect(result).toHaveProperty('dice');
        expect(result).toHaveProperty('selectedIndex');
        expect(result).toHaveProperty('selectedValue');
        expect(result).toHaveProperty('resultName');
        expect(result).toHaveProperty('resultClass');
        expect(result).toHaveProperty('isZeroDice');
    });
});
