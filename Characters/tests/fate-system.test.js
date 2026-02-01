/**
 * Tests for Characters/js/fate-system.js - FATE RPG utilities
 */

import { describe, it, expect } from 'vitest';
import {
    LADDER,
    SKILL_LIST,
    APPROACH_LIST,
    FATE_VERSIONS,
    DEFAULT_VERSION,
    SYSTEM_NAME,
    getLadderName,
    formatRating,
    getStressBoxCount,
    usesIndividualStress,
    getFudgeDieDisplay
} from '../js/fate-system.js';

describe('Constants', () => {
    it('SYSTEM_NAME is "FATE"', () => {
        expect(SYSTEM_NAME).toBe('FATE');
    });

    it('LADDER has entries from -2 to 8', () => {
        expect(LADDER['-2']).toBe('Terrible');
        expect(LADDER['-1']).toBe('Poor');
        expect(LADDER['0']).toBe('Mediocre');
        expect(LADDER['1']).toBe('Average');
        expect(LADDER['2']).toBe('Fair');
        expect(LADDER['3']).toBe('Good');
        expect(LADDER['4']).toBe('Great');
        expect(LADDER['5']).toBe('Superb');
        expect(LADDER['6']).toBe('Fantastic');
        expect(LADDER['7']).toBe('Epic');
        expect(LADDER['8']).toBe('Legendary');
    });

    it('SKILL_LIST has 19 skills', () => {
        expect(SKILL_LIST).toHaveLength(19);
        expect(SKILL_LIST).toContain('athletics');
        expect(SKILL_LIST).toContain('fight');
        expect(SKILL_LIST).toContain('shoot');
    });

    it('APPROACH_LIST has 6 approaches', () => {
        expect(APPROACH_LIST).toHaveLength(6);
        expect(APPROACH_LIST).toContain('careful');
        expect(APPROACH_LIST).toContain('flashy');
        expect(APPROACH_LIST).toContain('sneaky');
    });

    it('FATE_VERSIONS has correct values', () => {
        expect(FATE_VERSIONS.CONDENSED).toBe('condensed');
        expect(FATE_VERSIONS.CORE).toBe('core');
        expect(FATE_VERSIONS.ACCELERATED).toBe('accelerated');
    });

    it('DEFAULT_VERSION is condensed', () => {
        expect(DEFAULT_VERSION).toBe('condensed');
    });
});

describe('getLadderName', () => {
    it('returns correct names for standard values', () => {
        expect(getLadderName(0)).toBe('Mediocre');
        expect(getLadderName(3)).toBe('Good');
        expect(getLadderName(5)).toBe('Superb');
    });

    it('clamps values below -2 to Terrible', () => {
        expect(getLadderName(-3)).toBe('Terrible');
        expect(getLadderName(-10)).toBe('Terrible');
    });

    it('clamps values above 8 to Legendary', () => {
        expect(getLadderName(9)).toBe('Legendary');
        expect(getLadderName(15)).toBe('Legendary');
    });

    it('handles negative values', () => {
        expect(getLadderName(-1)).toBe('Poor');
        expect(getLadderName(-2)).toBe('Terrible');
    });
});

describe('formatRating', () => {
    it('formats positive values with + sign', () => {
        expect(formatRating(3)).toBe('+3 (Good)');
        expect(formatRating(5)).toBe('+5 (Superb)');
    });

    it('formats zero with + sign', () => {
        expect(formatRating(0)).toBe('+0 (Mediocre)');
    });

    it('formats negative values without + sign', () => {
        expect(formatRating(-1)).toBe('-1 (Poor)');
        expect(formatRating(-2)).toBe('-2 (Terrible)');
    });
});

describe('getStressBoxCount', () => {
    describe('FATE Core version', () => {
        it('returns 2 boxes for skill rating 0', () => {
            expect(getStressBoxCount(0, 'core')).toBe(2);
        });

        it('returns 3 boxes for skill rating 1-2', () => {
            expect(getStressBoxCount(1, 'core')).toBe(3);
            expect(getStressBoxCount(2, 'core')).toBe(3);
        });

        it('returns 4 boxes for skill rating 3+', () => {
            expect(getStressBoxCount(3, 'core')).toBe(4);
            expect(getStressBoxCount(5, 'core')).toBe(4);
        });
    });

    describe('FATE Condensed version (default)', () => {
        it('returns 3 boxes for skill rating 0', () => {
            expect(getStressBoxCount(0)).toBe(3);
            expect(getStressBoxCount(0, 'condensed')).toBe(3);
        });

        it('returns 4 boxes for skill rating 1-2', () => {
            expect(getStressBoxCount(1)).toBe(4);
            expect(getStressBoxCount(2, 'condensed')).toBe(4);
        });

        it('returns 6 boxes for skill rating 3+', () => {
            expect(getStressBoxCount(3)).toBe(6);
            expect(getStressBoxCount(5, 'condensed')).toBe(6);
        });
    });

    describe('FATE Accelerated version', () => {
        it('uses same rules as Condensed', () => {
            expect(getStressBoxCount(0, 'accelerated')).toBe(3);
            expect(getStressBoxCount(2, 'accelerated')).toBe(4);
            expect(getStressBoxCount(3, 'accelerated')).toBe(6);
        });
    });
});

describe('usesIndividualStress', () => {
    it('returns true for Core', () => {
        expect(usesIndividualStress('core')).toBe(true);
    });

    it('returns false for Condensed', () => {
        expect(usesIndividualStress('condensed')).toBe(false);
    });

    it('returns false for Accelerated', () => {
        expect(usesIndividualStress('accelerated')).toBe(false);
    });
});

describe('getFudgeDieDisplay', () => {
    it('returns + for positive', () => {
        const result = getFudgeDieDisplay(1);
        expect(result.symbol).toBe('+');
        expect(result.className).toBe('plus');
    });

    it('returns − for negative', () => {
        const result = getFudgeDieDisplay(-1);
        expect(result.symbol).toBe('−');
        expect(result.className).toBe('minus');
    });

    it('returns blank for zero', () => {
        const result = getFudgeDieDisplay(0);
        expect(result.symbol).toBe('');
        expect(result.className).toBe('blank');
    });
});
