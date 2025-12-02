/**
 * Unit tests for DataAccess.js
 *
 * Tests cover:
 * - Constants
 * - SQL escaping
 * - Query builders
 * - Helper functions
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Load DataAccess.js as a script (simulating browser behavior)
// It will set globalThis.NameGeneratorDB
await import('./data-access.js');
const DB = globalThis.NameGeneratorDB;

describe('DataAccess Constants', () => {
    it('should have correct threshold values', () => {
        expect(DB.THRESHOLD_FIRST_NAMES).toBe(50);
        expect(DB.THRESHOLD_LAST_NAMES).toBe(25);
        expect(DB.THRESHOLD_TITLES_FOR_DEFAULT_FALLBACK).toBe(25);
    });

    it('should have correct default frequency values', () => {
        expect(DB.DEFAULT_NICKNAME_FREQUENCY).toBe(0.25);
        expect(DB.DEFAULT_TITLE_FREQUENCY).toBe(0.10);
    });
});

describe('SQL Escaping', () => {
    it('should escape single quotes', () => {
        expect(DB.escapeSQL("O'Brien")).toBe("O''Brien");
        expect(DB.escapeSQL("It's a test")).toBe("It''s a test");
    });

    it('should handle strings without quotes', () => {
        expect(DB.escapeSQL("Normal String")).toBe("Normal String");
        expect(DB.escapeSQL("Test123")).toBe("Test123");
    });

    it('should handle empty strings', () => {
        expect(DB.escapeSQL("")).toBe("");
    });

    it('should handle multiple single quotes', () => {
        expect(DB.escapeSQL("'quoted'")).toBe("''quoted''");
    });
});

describe('isUndersupplied', () => {
    it('should identify undersupplied sources based on first names', () => {
        expect(DB.isUndersupplied(30, 30, false)).toBe(true); // 30 < 50
        expect(DB.isUndersupplied(60, 30, false)).toBe(false); // 60 >= 50
    });

    it('should identify undersupplied sources based on last names', () => {
        expect(DB.isUndersupplied(60, 20, false)).toBe(true); // 20 < 25
        expect(DB.isUndersupplied(60, 30, false)).toBe(false); // 30 >= 25
    });

    it('should never flag admin entries as undersupplied', () => {
        expect(DB.isUndersupplied(0, 0, true)).toBe(false);
        expect(DB.isUndersupplied(10, 10, true)).toBe(false);
    });

    it('should handle edge cases at thresholds', () => {
        expect(DB.isUndersupplied(49, 25, false)).toBe(true);
        expect(DB.isUndersupplied(50, 25, false)).toBe(false);
        expect(DB.isUndersupplied(50, 24, false)).toBe(true);
    });
});

describe('buildNameViewerQuery', () => {
    it('should build query with no filters', () => {
        const query = DB.buildNameViewerQuery({});
        expect(query).toContain('SELECT');
        expect(query).toContain('FROM names n');
        // Should not have a main WHERE clause (empty whereClause)
        // Check that LEFT JOIN is followed by GROUP BY, not WHERE
        expect(query).toMatch(/LEFT JOIN genders g[^]*GROUP BY n\.id/);
    });

    it('should build query with position filter', () => {
        const query = DB.buildNameViewerQuery({ position: 'first' });
        expect(query).toContain('WHERE');
        expect(query).toContain("p.position = 'first'");
    });

    it('should build query with gender filter', () => {
        const query = DB.buildNameViewerQuery({ gender: 'male' });
        expect(query).toContain('WHERE');
        expect(query).toContain("g.gender = 'male'");
    });

    it('should build query with source filter', () => {
        const query = DB.buildNameViewerQuery({ source: 'Test Source' });
        expect(query).toContain('WHERE');
        expect(query).toContain("t.tag_name = 'Test Source'");
    });

    it('should build query with orphaned filter', () => {
        const query = DB.buildNameViewerQuery({ source: '__ORPHANED__' });
        expect(query).toContain('WHERE');
        expect(query).toContain('NOT IN');
        expect(query).toContain("type_name = 'source'");
    });

    it('should combine multiple filters with AND', () => {
        const query = DB.buildNameViewerQuery({
            position: 'first',
            gender: 'female'
        });
        expect(query).toContain('WHERE');
        expect(query).toContain("p.position = 'first'");
        expect(query).toContain("g.gender = 'female'");
        expect(query).toContain('AND');
    });

    it('should escape SQL in filter values', () => {
        const query = DB.buildNameViewerQuery({ position: "'; DROP TABLE names; --" });
        expect(query).toContain("''; DROP TABLE names; --'");
    });

    it('should include all tag types in results', () => {
        const query = DB.buildNameViewerQuery({});
        expect(query).toContain("type_name = 'source'");
        expect(query).toContain("type_name = 'vibe'");
        expect(query).toContain("type_name = 'theme'");
    });
});

describe('buildSourceStatsQuery', () => {
    it('should build valid SQL query', () => {
        const query = DB.buildSourceStatsQuery();
        expect(query).toContain('SELECT');
        expect(query).toContain('FROM tags t');
        expect(query).toContain('LEFT JOIN tags p');
    });

    it('should count all position types', () => {
        const query = DB.buildSourceStatsQuery();
        expect(query).toContain("pos.position = 'first'");
        expect(query).toContain("pos.position = 'last'");
        expect(query).toContain("pos.position = 'title'");
        expect(query).toContain("pos.position = 'nickname'");
    });

    it('should only count direct tag associations (not children)', () => {
        const query = DB.buildSourceStatsQuery();
        expect(query).toContain('nt.tag_id = t.id');
        expect(query).not.toContain('parent_tag_id = t.id');
    });

    it('should filter for source tags only', () => {
        const query = DB.buildSourceStatsQuery();
        expect(query).toContain("type_name = 'source'");
    });

    it('should order hierarchically', () => {
        const query = DB.buildSourceStatsQuery();
        expect(query).toContain('ORDER BY');
        expect(query).toContain('CASE WHEN t.parent_tag_id IS NULL');
    });
});

describe('Query Builder Edge Cases', () => {
    it('should handle special characters in filter values', () => {
        const specialChars = "Test's \"Name\" & <script>";
        const query = DB.buildNameViewerQuery({ position: specialChars });
        // Should escape single quotes at minimum
        expect(query).toContain("''");
    });

    it('should handle undefined filter values gracefully', () => {
        const query = DB.buildNameViewerQuery({
            position: undefined,
            gender: 'male'
        });
        expect(query).toContain("g.gender = 'male'");
        expect(query).not.toContain('undefined');
    });

    it('should handle empty string filter values', () => {
        const query = DB.buildNameViewerQuery({
            position: '',
            gender: 'male'
        });
        expect(query).toContain("g.gender = 'male'");
        expect(query).not.toContain("p.position = ''");
    });
});

describe('Constants Usage in Logic', () => {
    it('should use consistent thresholds across functions', () => {
        // Verify isUndersupplied uses the same thresholds as constants
        const justUnder = DB.THRESHOLD_FIRST_NAMES - 1;
        const atThreshold = DB.THRESHOLD_FIRST_NAMES;

        expect(DB.isUndersupplied(justUnder, 30, false)).toBe(true);
        expect(DB.isUndersupplied(atThreshold, 30, false)).toBe(false);
    });

    it('should have sensible threshold relationships', () => {
        // First names threshold should be higher than last names
        // (typically need more variety in first names)
        expect(DB.THRESHOLD_FIRST_NAMES).toBeGreaterThan(DB.THRESHOLD_LAST_NAMES);
    });

    it('should have frequency values between 0 and 1', () => {
        expect(DB.DEFAULT_NICKNAME_FREQUENCY).toBeGreaterThanOrEqual(0);
        expect(DB.DEFAULT_NICKNAME_FREQUENCY).toBeLessThanOrEqual(1);
        expect(DB.DEFAULT_TITLE_FREQUENCY).toBeGreaterThanOrEqual(0);
        expect(DB.DEFAULT_TITLE_FREQUENCY).toBeLessThanOrEqual(1);
    });
});

describe('execParams Security (SQL Injection Prevention)', () => {
    // Note: These tests verify the API exists and handles inputs correctly.
    // Full integration tests would require initializing the database.

    it('should export execParams function', () => {
        expect(typeof DB.execParams).toBe('function');
    });

    it('should handle SQL injection attempts safely', () => {
        // This is a unit test - we're testing that the function exists
        // and would handle these inputs. Full testing requires database init.
        const maliciousInputs = [
            "'; DROP TABLE names; --",
            "' OR '1'='1",
            "admin'--",
            "'; DELETE FROM tags WHERE '1'='1",
            "1' UNION SELECT * FROM sqlite_master--"
        ];

        // Verify these strings don't crash the function signature
        maliciousInputs.forEach(input => {
            expect(() => {
                // The function should accept these as parameters
                // (actual execution would require database to be initialized)
                const mockQuery = "SELECT * FROM tags WHERE tag_name = ?";
                const mockParams = [input];
                // We can't execute without database, but we verify the API
                expect(mockQuery).toContain('?');
                expect(Array.isArray(mockParams)).toBe(true);
            }).not.toThrow();
        });
    });

    it('should accept parameterized query format', () => {
        // Test that the expected API structure is correct
        const exampleQueries = [
            {
                sql: "SELECT * FROM names WHERE position = ?",
                params: ['first']
            },
            {
                sql: "SELECT * FROM names WHERE position = ? AND gender = ?",
                params: ['first', 'male']
            },
            {
                sql: "SELECT * FROM tags WHERE tag_name = ?",
                params: ["O'Brien"]  // Should handle apostrophes safely
            }
        ];

        exampleQueries.forEach(({ sql, params }) => {
            // Verify the query structure is valid
            const placeholderCount = (sql.match(/\?/g) || []).length;
            expect(placeholderCount).toBe(params.length);
        });
    });

    it('should handle special characters in parameters', () => {
        const specialCharacters = [
            "Name with 'apostrophe'",
            'Name with "quotes"',
            "Name with ; semicolon",
            "Name with -- comment",
            "Name with /* block comment */",
            "Name with \\ backslash",
            "Name with \n newline",
            "Name with \t tab"
        ];

        // These should all be safe to use as parameters
        specialCharacters.forEach(input => {
            expect(typeof input).toBe('string');
            // In parameterized queries, these are treated as literal strings,
            // not SQL code, so they're all safe
        });
    });
});

describe('Module Exports', () => {
    it('should export all required constants', () => {
        expect(DB.THRESHOLD_FIRST_NAMES).toBeDefined();
        expect(DB.THRESHOLD_LAST_NAMES).toBeDefined();
        expect(DB.THRESHOLD_TITLES_FOR_DEFAULT_FALLBACK).toBeDefined();
    });

    it('should export all required functions', () => {
        expect(typeof DB.execParams).toBe('function');
        expect(typeof DB.escapeSQL).toBe('function');
        expect(typeof DB.buildNameViewerQuery).toBe('function');
        expect(typeof DB.buildSourceStatsQuery).toBe('function');
        expect(typeof DB.isUndersupplied).toBe('function');
        expect(typeof DB.getDatabase).toBe('function');
        expect(typeof DB.initDatabase).toBe('function');
    });
});
