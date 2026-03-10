/**
 * Tests for DiceLibrary.js - Core dice rolling utilities
 *
 * Run with: npm test
 */

import { describe, it, expect, vi } from 'vitest';
import { rollSingleDie, rollSingleExplodingDie, rollDice, formatDiceRoll, parseDiceNotation, dropDice, countSuccesses, rollDiceWithModifiers, rollWithAdvantage } from '../dice-library.js';

describe('rollSingleDie', () => {
    it('returns a value between 1 and sides', () => {
        const result = rollSingleDie(20);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
    });

    it('throws error for invalid sides', () => {
        expect(() => rollSingleDie(0)).toThrow('Invalid dice sides');
        expect(() => rollSingleDie(-5)).toThrow('Invalid dice sides');
        expect(() => rollSingleDie(1.5)).toThrow('Invalid dice sides');
    });

    it('generates different values over multiple rolls', () => {
        const rolls = Array(100).fill(0).map(() => rollSingleDie(6));
        const uniqueValues = new Set(rolls);

        // With 100 rolls of d6, we should see at least 3 different values
        expect(uniqueValues.size).toBeGreaterThanOrEqual(3);
    });
});

describe('rollDice', () => {
    it('returns correct number of rolls', () => {
        const result = rollDice(5, 20);
        expect(result.rolls).toHaveLength(5);
        expect(result.rolls.every(r => r >= 1 && r <= 20)).toBe(true);
    });

    it('calculates total correctly', () => {
        // Mock Math.random to get predictable results
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValue(0.5);

        const result = rollDice(3, 6);

        // With 0.5, Math.floor(0.5 * 6) + 1 = 3 + 1 = 4
        expect(result.rolls).toEqual([4, 4, 4]);
        expect(result.total).toBe(12);

        mockRandom.mockRestore();
    });

    it('throws error for invalid number of dice', () => {
        expect(() => rollDice(0, 6)).toThrow('Invalid number of dice');
        expect(() => rollDice(-1, 6)).toThrow('Invalid number of dice');
    });

    it('throws error for invalid dice type', () => {
        expect(() => rollDice(3, 0)).toThrow('Invalid dice type');
        expect(() => rollDice(3, -6)).toThrow('Invalid dice type');
    });
});

describe('formatDiceRoll', () => {
    it('formats a basic roll correctly', () => {
        const formatted = formatDiceRoll(3, 6, [3, 6, 1], 10);
        expect(formatted).toBe('Rolled 3d6 (3, 6, 1) = 10');
    });

    it('formats a single die roll', () => {
        const formatted = formatDiceRoll(1, 20, [15], 15);
        expect(formatted).toBe('Rolled 1d20 (15) = 15');
    });
});

describe('parseDiceNotation', () => {
    it('parses standard notation correctly', () => {
        expect(parseDiceNotation('3d6')).toEqual({ numDice: 3, diceType: 6 });
        expect(parseDiceNotation('2d20')).toEqual({ numDice: 2, diceType: 20 });
        expect(parseDiceNotation('10d10')).toEqual({ numDice: 10, diceType: 10 });
    });

    it('parses single die notation', () => {
        expect(parseDiceNotation('d20')).toEqual({ numDice: 1, diceType: 20 });
        expect(parseDiceNotation('d6')).toEqual({ numDice: 1, diceType: 6 });
    });

    it('handles whitespace', () => {
        expect(parseDiceNotation('  3d6  ')).toEqual({ numDice: 3, diceType: 6 });
    });

    it('is case insensitive', () => {
        expect(parseDiceNotation('3D6')).toEqual({ numDice: 3, diceType: 6 });
    });

    it('throws error for invalid notation', () => {
        expect(() => parseDiceNotation('abc')).toThrow('Invalid dice notation');
        expect(() => parseDiceNotation('3x6')).toThrow('Invalid dice notation');
        expect(() => parseDiceNotation('d')).toThrow('Invalid dice notation');
    });
});

describe('dropDice', () => {
    it('drops lowest dice correctly', () => {
        const rolls = [6, 2, 4, 1, 5];
        const result = dropDice(rolls, 2, 'lowest');

        expect(result.droppedRolls).toEqual([1, 2]);
        expect(result.keptRolls).toEqual([4, 5, 6]);
        expect(result.total).toBe(15);
    });

    it('drops highest dice correctly', () => {
        const rolls = [6, 2, 4, 1, 5];
        const result = dropDice(rolls, 2, 'highest');

        expect(result.droppedRolls).toEqual([5, 6]);
        expect(result.keptRolls).toEqual([1, 2, 4]);
        expect(result.total).toBe(7);
    });

    it('throws error if dropping too many dice', () => {
        expect(() => dropDice([1, 2, 3], 3, 'lowest')).toThrow('Cannot drop');
        expect(() => dropDice([1, 2], 5, 'lowest')).toThrow('Cannot drop');
    });
});

describe('countSuccesses', () => {
    it('counts successes with >= comparison', () => {
        const rolls = [6, 4, 2, 5, 1, 6];
        const result = countSuccesses(rolls, 5, '>=');

        expect(result.successCount).toBe(3);
        expect(result.successes).toEqual([6, 5, 6]);
        expect(result.failures).toEqual([4, 2, 1]);
    });

    it('counts successes with > comparison', () => {
        const rolls = [6, 5, 5, 4];
        const result = countSuccesses(rolls, 5, '>');

        expect(result.successCount).toBe(1);
        expect(result.successes).toEqual([6]);
    });

    it('counts successes with == comparison', () => {
        const rolls = [6, 6, 5, 6, 4];
        const result = countSuccesses(rolls, 6, '==');

        expect(result.successCount).toBe(3);
        expect(result.successes).toEqual([6, 6, 6]);
    });

    it('throws error for invalid comparison', () => {
        expect(() => countSuccesses([1, 2], 3, '!=')).toThrow('Invalid comparison');
    });
});

describe('rollSingleExplodingDie', () => {
    it('returns object with value, display, and breakdown', () => {
        const result = rollSingleExplodingDie(6);
        expect(result).toHaveProperty('value');
        expect(result).toHaveProperty('display');
        expect(result).toHaveProperty('breakdown');
        expect(Array.isArray(result.breakdown)).toBe(true);
    });

    it('does not explode when rolling below max', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValue(0.5); // Will roll 4 on d6 (0.5 * 6 = 3, floor + 1 = 4)

        const result = rollSingleExplodingDie(6);

        expect(result.breakdown).toHaveLength(1);
        expect(result.value).toBe(4);
        expect(result.display).toBe('4');

        mockRandom.mockRestore();
    });

    it('explodes only once in standard mode when rolling max', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // First roll: 6 (max), second roll: 6 (max)
        mockRandom.mockReturnValueOnce(0.99); // 6
        mockRandom.mockReturnValueOnce(0.99);  // 6

        const result = rollSingleExplodingDie(6, 'standard');

        expect(result.breakdown).toEqual([6, 6]);
        expect(result.value).toBe(12);
        expect(result.display).toBe('6+6');

        mockRandom.mockRestore();
    });

    it('keeps exploding in compound mode', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // Rolls: 6, 6, 6, 2 (0.3 * 6 = 1.8, floor = 1, +1 = 2)
        mockRandom.mockReturnValueOnce(0.99); // 6
        mockRandom.mockReturnValueOnce(0.99); // 6
        mockRandom.mockReturnValueOnce(0.99); // 6
        mockRandom.mockReturnValueOnce(0.3);  // 2

        const result = rollSingleExplodingDie(6, 'compound');

        expect(result.breakdown).toEqual([6, 6, 6, 2]);
        expect(result.value).toBe(20);
        expect(result.display).toBe('6+6+6+2');

        mockRandom.mockRestore();
    });

    it('throws error for invalid dice type', () => {
        expect(() => rollSingleExplodingDie(1)).toThrow('Invalid dice type');
        expect(() => rollSingleExplodingDie(0)).toThrow('Invalid dice type');
        expect(() => rollSingleExplodingDie(-5)).toThrow('Invalid dice type');
    });

    it('works with different die sizes', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // Roll max on d20 (20), then roll 15
        mockRandom.mockReturnValueOnce(0.99);  // 20
        mockRandom.mockReturnValueOnce(0.725); // 15

        const result = rollSingleExplodingDie(20, 'standard');

        expect(result.breakdown).toEqual([20, 15]);
        expect(result.value).toBe(35);
        expect(result.display).toBe('20+15');

        mockRandom.mockRestore();
    });
});

describe('rollDiceWithModifiers', () => {
    it('rolls basic dice without modifiers', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.5);  // 4
        mockRandom.mockReturnValueOnce(0.8);  // 5

        const result = rollDiceWithModifiers({
            numDice: 2,
            diceType: 6
        });

        expect(result.rolls).toHaveLength(2);
        expect(result.keptRolls).toEqual(result.rolls);
        expect(result.droppedRolls).toEqual([]);
        expect(result.total).toBe(9);
        expect(result.successCount).toBe(0);

        mockRandom.mockRestore();
    });

    it('rolls with exploding enabled', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.99);  // 6 (explodes)
        mockRandom.mockReturnValueOnce(0.5);   // 4
        mockRandom.mockReturnValueOnce(0.2);   // 2

        const result = rollDiceWithModifiers({
            numDice: 2,
            diceType: 6,
            exploding: true
        });

        expect(result.rolls).toHaveLength(2);
        expect(result.rolls[0].value).toBe(10);  // 6+4
        expect(result.rolls[1].value).toBe(2);
        expect(result.total).toBe(12);

        mockRandom.mockRestore();
    });

    it('rolls with drop lowest', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.2);   // 2
        mockRandom.mockReturnValueOnce(0.5);   // 4
        mockRandom.mockReturnValueOnce(0.9);   // 6

        const result = rollDiceWithModifiers({
            numDice: 3,
            diceType: 6,
            drop: true,
            dropType: 'lowest',
            dropCount: 1
        });

        expect(result.keptRolls).toHaveLength(2);
        expect(result.droppedRolls).toHaveLength(1);
        expect(result.keptRolls[0].value).toBe(4);
        expect(result.keptRolls[1].value).toBe(6);
        expect(result.total).toBe(10);

        mockRandom.mockRestore();
    });

    it('rolls with drop highest', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.2);   // 2
        mockRandom.mockReturnValueOnce(0.5);   // 4
        mockRandom.mockReturnValueOnce(0.9);   // 6

        const result = rollDiceWithModifiers({
            numDice: 3,
            diceType: 6,
            drop: true,
            dropType: 'highest',
            dropCount: 1
        });

        expect(result.keptRolls).toHaveLength(2);
        expect(result.droppedRolls).toHaveLength(1);
        expect(result.keptRolls[0].value).toBe(2);
        expect(result.keptRolls[1].value).toBe(4);
        expect(result.total).toBe(6);

        mockRandom.mockRestore();
    });

    it('counts successes correctly', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.2);   // 2
        mockRandom.mockReturnValueOnce(0.5);   // 4
        mockRandom.mockReturnValueOnce(0.9);   // 6

        const result = rollDiceWithModifiers({
            numDice: 3,
            diceType: 6,
            countSuccesses: true,
            successThreshold: 4,
            successComparison: '>='
        });

        expect(result.successCount).toBe(2);  // 4 and 6
        expect(result.total).toBe(12);

        mockRandom.mockRestore();
    });

    it('combines exploding and drop', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.99);  // Die 1: 6 (explodes)
        mockRandom.mockReturnValueOnce(0.5);   // Die 1 continues: 4
        mockRandom.mockReturnValueOnce(0.2);   // Die 2: 2
        mockRandom.mockReturnValueOnce(0.7);   // Die 3: 5 (no explode)

        const result = rollDiceWithModifiers({
            numDice: 3,
            diceType: 6,
            exploding: true,
            drop: true,
            dropType: 'lowest',
            dropCount: 1
        });

        expect(result.rolls).toHaveLength(3);
        expect(result.keptRolls).toHaveLength(2);
        expect(result.droppedRolls).toHaveLength(1);
        // Kept: 10 (6+4) and 5, Dropped: 2
        expect(result.total).toBe(15);

        mockRandom.mockRestore();
    });

    it('combines all modifiers', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValueOnce(0.2);   // 2
        mockRandom.mockReturnValueOnce(0.5);   // 4
        mockRandom.mockReturnValueOnce(0.9);   // 6

        const result = rollDiceWithModifiers({
            numDice: 3,
            diceType: 6,
            drop: true,
            dropType: 'lowest',
            dropCount: 1,
            countSuccesses: true,
            successThreshold: 4,
            successComparison: '>='
        });

        expect(result.keptRolls).toHaveLength(2);
        expect(result.total).toBe(10);  // 4 + 6
        expect(result.successCount).toBe(2);  // Both 4 and 6 >= 4

        mockRandom.mockRestore();
    });

    it('throws error for invalid numDice', () => {
        expect(() => rollDiceWithModifiers({ numDice: 0, diceType: 6 })).toThrow();
        expect(() => rollDiceWithModifiers({ numDice: -1, diceType: 6 })).toThrow();
    });

    it('throws error for invalid diceType', () => {
        expect(() => rollDiceWithModifiers({ numDice: 2, diceType: 0 })).toThrow();
        expect(() => rollDiceWithModifiers({ numDice: 2, diceType: -6 })).toThrow();
    });
});

describe('rollWithAdvantage', () => {
    it('chooses higher roll with advantage', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // First roll: 3
        mockRandom.mockReturnValueOnce(0.4);   // 3
        // Second roll: 5
        mockRandom.mockReturnValueOnce(0.7);   // 5

        const result = rollWithAdvantage('advantage', {
            numDice: 1,
            diceType: 6
        });

        expect(result.mode).toBe('advantage');
        expect(result.chosenRoll.total).toBe(5);
        expect(result.otherRoll.total).toBe(3);

        mockRandom.mockRestore();
    });

    it('chooses lower roll with disadvantage', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // First roll: 3
        mockRandom.mockReturnValueOnce(0.4);   // 3
        // Second roll: 5
        mockRandom.mockReturnValueOnce(0.7);   // 5

        const result = rollWithAdvantage('disadvantage', {
            numDice: 1,
            diceType: 6
        });

        expect(result.mode).toBe('disadvantage');
        expect(result.chosenRoll.total).toBe(3);
        expect(result.otherRoll.total).toBe(5);

        mockRandom.mockRestore();
    });

    it('uses success count when counting successes', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // First roll: 2, 3 (0 successes)
        mockRandom.mockReturnValueOnce(0.2);
        mockRandom.mockReturnValueOnce(0.4);
        // Second roll: 4, 5 (2 successes)
        mockRandom.mockReturnValueOnce(0.5);
        mockRandom.mockReturnValueOnce(0.7);

        const result = rollWithAdvantage('advantage', {
            numDice: 2,
            diceType: 6,
            countSuccesses: true,
            successThreshold: 4,
            successComparison: '>='
        });

        expect(result.chosenRoll.successCount).toBe(2);
        expect(result.otherRoll.successCount).toBe(0);

        mockRandom.mockRestore();
    });

    it('handles equal rolls correctly', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // Both rolls: 4
        mockRandom.mockReturnValueOnce(0.5);
        mockRandom.mockReturnValueOnce(0.5);

        const result = rollWithAdvantage('advantage', {
            numDice: 1,
            diceType: 6
        });

        expect(result.chosenRoll.total).toBe(4);
        expect(result.otherRoll.total).toBe(4);

        mockRandom.mockRestore();
    });

    it('throws error for invalid mode', () => {
        expect(() => rollWithAdvantage('invalid', { numDice: 1, diceType: 6 })).toThrow();
        expect(() => rollWithAdvantage('ADVANTAGE', { numDice: 1, diceType: 6 })).toThrow();
    });
});
