/**
 * Tests for HistoryLog.js - Generic history log utilities
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createHistoryEntry,
    createComplexHistoryEntry,
    addToHistory,
    addTextToHistory,
    clearHistory,
    getHistoryCount,
    removeHistoryEntry,
    getHistoryEntries
} from '../history-log.js';

describe('createHistoryEntry', () => {
    it('creates a div element', () => {
        const entry = createHistoryEntry('Test text');

        expect(entry.tagName).toBe('DIV');
    });

    it('sets the text content', () => {
        const entry = createHistoryEntry('Hello World');

        expect(entry.textContent).toBe('Hello World');
    });

    it('sets default class name', () => {
        const entry = createHistoryEntry('Test');

        expect(entry.className).toBe('history-entry');
    });

    it('sets custom class name', () => {
        const entry = createHistoryEntry('Test', 'custom-class');

        expect(entry.className).toBe('custom-class');
    });
});

describe('createComplexHistoryEntry', () => {
    it('creates a div element', () => {
        const entry = createComplexHistoryEntry('<span>Test</span>');

        expect(entry.tagName).toBe('DIV');
    });

    it('accepts HTML string', () => {
        const entry = createComplexHistoryEntry('<strong>Bold</strong> text');

        expect(entry.innerHTML).toBe('<strong>Bold</strong> text');
    });

    it('accepts DOM element', () => {
        const span = document.createElement('span');
        span.textContent = 'Inner text';

        const entry = createComplexHistoryEntry(span);

        expect(entry.firstChild).toBe(span);
        expect(entry.textContent).toBe('Inner text');
    });

    it('sets custom class name', () => {
        const entry = createComplexHistoryEntry('<p>Test</p>', 'custom-class');

        expect(entry.className).toBe('custom-class');
    });
});

describe('addToHistory', () => {
    let container;
    let entry1, entry2, entry3;

    beforeEach(() => {
        // Create a fresh container for each test
        container = document.createElement('div');
        container.id = 'test-history';

        entry1 = createHistoryEntry('Entry 1');
        entry2 = createHistoryEntry('Entry 2');
        entry3 = createHistoryEntry('Entry 3');
    });

    it('adds entry to container', () => {
        addToHistory(container, entry1);

        expect(container.children.length).toBe(1);
        expect(container.firstChild).toBe(entry1);
    });

    it('adds new entries to the beginning (most recent first)', () => {
        addToHistory(container, entry1);
        addToHistory(container, entry2);
        addToHistory(container, entry3);

        expect(container.children.length).toBe(3);
        expect(container.firstChild).toBe(entry3);
        expect(container.children[1]).toBe(entry2);
        expect(container.children[2]).toBe(entry1);
    });

    it('enforces max entries limit', () => {
        for (let i = 0; i < 10; i++) {
            const entry = createHistoryEntry(`Entry ${i}`);
            addToHistory(container, entry, { maxEntries: 5 });
        }

        expect(container.children.length).toBe(5);
    });

    it('removes oldest entries when max is exceeded', () => {
        addToHistory(container, entry1, { maxEntries: 2 });
        addToHistory(container, entry2, { maxEntries: 2 });
        addToHistory(container, entry3, { maxEntries: 2 });

        expect(container.children.length).toBe(2);
        expect(container.firstChild).toBe(entry3);
        expect(container.children[1]).toBe(entry2);
        // entry1 should be removed
        expect(container.contains(entry1)).toBe(false);
    });

    it('adds animation class when animate option is true', () => {
        addToHistory(container, entry1, { animate: true });

        expect(entry1.classList.contains('history-entry-new')).toBe(true);
    });

    it('does not add animation class by default', () => {
        addToHistory(container, entry1);

        expect(entry1.classList.contains('history-entry-new')).toBe(false);
    });
});

describe('addTextToHistory', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
    });

    it('creates and adds entry in one step', () => {
        addTextToHistory(container, 'Quick add');

        expect(container.children.length).toBe(1);
        expect(container.firstChild.textContent).toBe('Quick add');
    });

    it('passes options to addToHistory', () => {
        addTextToHistory(container, 'Text 1', { maxEntries: 1 });
        addTextToHistory(container, 'Text 2', { maxEntries: 1 });

        expect(container.children.length).toBe(1);
        expect(container.firstChild.textContent).toBe('Text 2');
    });
});

describe('clearHistory', () => {
    it('removes all children from container', () => {
        const container = document.createElement('div');
        container.appendChild(createHistoryEntry('Entry 1'));
        container.appendChild(createHistoryEntry('Entry 2'));
        container.appendChild(createHistoryEntry('Entry 3'));

        clearHistory(container);

        expect(container.children.length).toBe(0);
        expect(container.innerHTML).toBe('');
    });
});

describe('getHistoryCount', () => {
    it('counts history entries with default class', () => {
        const container = document.createElement('div');
        container.appendChild(createHistoryEntry('Entry 1'));
        container.appendChild(createHistoryEntry('Entry 2'));

        const count = getHistoryCount(container);

        expect(count).toBe(2);
    });

    it('counts entries with custom class', () => {
        const container = document.createElement('div');
        container.appendChild(createHistoryEntry('Entry 1', 'custom-class'));
        container.appendChild(createHistoryEntry('Entry 2', 'custom-class'));
        container.appendChild(createHistoryEntry('Entry 3', 'other-class'));

        const count = getHistoryCount(container, 'custom-class');

        expect(count).toBe(2);
    });

    it('returns 0 for empty container', () => {
        const container = document.createElement('div');

        expect(getHistoryCount(container)).toBe(0);
    });
});

describe('removeHistoryEntry', () => {
    it('removes the specified entry', () => {
        const container = document.createElement('div');
        const entry1 = createHistoryEntry('Entry 1');
        const entry2 = createHistoryEntry('Entry 2');

        container.appendChild(entry1);
        container.appendChild(entry2);

        const removed = removeHistoryEntry(container, entry1);

        expect(removed).toBe(true);
        expect(container.children.length).toBe(1);
        expect(container.contains(entry1)).toBe(false);
        expect(container.contains(entry2)).toBe(true);
    });

    it('returns false if entry not in container', () => {
        const container = document.createElement('div');
        const entry = createHistoryEntry('Entry');
        const otherEntry = createHistoryEntry('Other');

        container.appendChild(entry);

        const removed = removeHistoryEntry(container, otherEntry);

        expect(removed).toBe(false);
        expect(container.children.length).toBe(1);
    });
});

describe('getHistoryEntries', () => {
    it('returns all entries as array', () => {
        const container = document.createElement('div');
        const entry1 = createHistoryEntry('Entry 1');
        const entry2 = createHistoryEntry('Entry 2');

        container.appendChild(entry1);
        container.appendChild(entry2);

        const entries = getHistoryEntries(container);

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(2);
        expect(entries[0]).toBe(entry1);
        expect(entries[1]).toBe(entry2);
    });

    it('filters by class name', () => {
        const container = document.createElement('div');
        container.appendChild(createHistoryEntry('Entry 1', 'history-entry'));
        container.appendChild(createHistoryEntry('Entry 2', 'custom-class'));
        container.appendChild(createHistoryEntry('Entry 3', 'history-entry'));

        const entries = getHistoryEntries(container, 'history-entry');

        expect(entries.length).toBe(2);
    });

    it('returns empty array for container with no entries', () => {
        const container = document.createElement('div');

        const entries = getHistoryEntries(container);

        expect(entries).toEqual([]);
    });
});
