/**
 * Tests for Characters/js/shared.js - Shared utilities for character sheets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    sanitizeFilename,
    validateImportData,
    generateId,
    AUTOSAVE_DELAY,
    STATUS_DURATION
} from '../js/shared.js';

describe('Constants', () => {
    it('AUTOSAVE_DELAY is 1000ms', () => {
        expect(AUTOSAVE_DELAY).toBe(1000);
    });

    it('STATUS_DURATION is 2000ms', () => {
        expect(STATUS_DURATION).toBe(2000);
    });
});

describe('sanitizeFilename', () => {
    it('removes special characters', () => {
        expect(sanitizeFilename('Test/File:Name')).toBe('TestFileName');
    });

    it('preserves letters, numbers, spaces, hyphens, underscores', () => {
        expect(sanitizeFilename('My Character_1-test')).toBe('My Character_1-test');
    });

    it('removes unicode and emoji', () => {
        expect(sanitizeFilename('Hero🦸Name')).toBe('HeroName');
    });

    it('trims whitespace', () => {
        expect(sanitizeFilename('  Spaced Name  ')).toBe('Spaced Name');
    });

    it('returns "character" for empty string', () => {
        expect(sanitizeFilename('')).toBe('character');
    });

    it('returns "character" for string with only special chars', () => {
        expect(sanitizeFilename('!@#$%')).toBe('character');
    });
});

describe('validateImportData', () => {
    it('returns valid for proper object', () => {
        const result = validateImportData({ name: 'Test' });
        expect(result.valid).toBe(true);
    });

    it('returns invalid for null', () => {
        const result = validateImportData(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid data format');
    });

    it('returns invalid for non-object', () => {
        const result = validateImportData('string');
        expect(result.valid).toBe(false);
    });

    it('returns invalid for array', () => {
        const result = validateImportData([1, 2, 3]);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Expected object, got array');
    });

    it('validates required fields - success', () => {
        const result = validateImportData(
            { name: 'Test', version: 1 },
            ['name', 'version']
        );
        expect(result.valid).toBe(true);
    });

    it('validates required fields - missing field', () => {
        const result = validateImportData(
            { name: 'Test' },
            ['name', 'version']
        );
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Missing required field: version');
    });
});

describe('generateId', () => {
    it('generates unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
    });

    it('uses default prefix "id"', () => {
        const id = generateId();
        expect(id.startsWith('id-')).toBe(true);
    });

    it('uses custom prefix', () => {
        const id = generateId('char');
        expect(id.startsWith('char-')).toBe(true);
    });

    it('includes timestamp component', () => {
        const before = Date.now();
        const id = generateId();
        const after = Date.now();

        // Extract timestamp from id (format: prefix-timestamp-random)
        const parts = id.split('-');
        const timestamp = parseInt(parts[1], 10);

        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
    });
});
