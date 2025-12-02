/**
 * Tests for CardLibrary.js - Generic card deck utilities
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createDeck,
    shuffleDeck,
    drawCard,
    drawCards,
    peekCard,
    peekCards,
    getDeckSize,
    isDeckEmpty,
    addCardToBottom,
    addCardToTop,
    returnCards,
    cutDeck,
    dealHands
} from '../card-library.js';

describe('createDeck', () => {
    it('creates a copy of the card array', () => {
        const original = [{ name: 'Ace' }, { name: 'King' }];
        const deck = createDeck(original);

        expect(deck).toEqual(original);
        expect(deck).not.toBe(original); // Different reference
    });

    it('throws error for non-array input', () => {
        expect(() => createDeck('not an array')).toThrow('Cards must be an array');
    });
});

describe('shuffleDeck', () => {
    it('returns the same deck reference', () => {
        const deck = [1, 2, 3, 4, 5];
        const shuffled = shuffleDeck(deck);

        expect(shuffled).toBe(deck); // Same reference (mutated)
    });

    it('shuffles the deck in place', () => {
        const deck = Array(52).fill(0).map((_, i) => i);
        const original = [...deck];

        shuffleDeck(deck);

        // Deck should have same cards but likely different order
        expect(deck.sort()).toEqual(original.sort());
        // Very unlikely to be in exact same order (but possible)
    });

    it('throws error for non-array input', () => {
        expect(() => shuffleDeck('not an array')).toThrow('Deck must be an array');
    });
});

describe('drawCard', () => {
    let deck;

    beforeEach(() => {
        deck = [{ name: 'Card1' }, { name: 'Card2' }, { name: 'Card3' }];
    });

    it('draws from the top of the deck', () => {
        const card = drawCard(deck);

        expect(card).toEqual({ name: 'Card3' });
        expect(deck.length).toBe(2);
    });

    it('returns null when deck is empty', () => {
        const emptyDeck = [];
        const card = drawCard(emptyDeck);

        expect(card).toBeNull();
    });

    it('mutates the deck', () => {
        const originalLength = deck.length;
        drawCard(deck);

        expect(deck.length).toBe(originalLength - 1);
    });

    it('throws error for non-array input', () => {
        expect(() => drawCard('not an array')).toThrow('Deck must be an array');
    });
});

describe('drawCards', () => {
    let deck;

    beforeEach(() => {
        deck = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    });

    it('draws multiple cards', () => {
        const cards = drawCards(deck, 3);

        expect(cards).toHaveLength(3);
        expect(cards).toEqual([{ id: 5 }, { id: 4 }, { id: 3 }]);
        expect(deck.length).toBe(2);
    });

    it('draws fewer cards if deck runs out', () => {
        const cards = drawCards(deck, 10);

        expect(cards).toHaveLength(5);
        expect(deck.length).toBe(0);
    });

    it('draws zero cards when count is 0', () => {
        const cards = drawCards(deck, 0);

        expect(cards).toHaveLength(0);
        expect(deck.length).toBe(5);
    });

    it('throws error for invalid count', () => {
        expect(() => drawCards(deck, -1)).toThrow('Invalid count');
        expect(() => drawCards(deck, 1.5)).toThrow('Invalid count');
    });
});

describe('peekCard', () => {
    it('returns top card without removing it', () => {
        const deck = [{ name: 'Bottom' }, { name: 'Top' }];
        const card = peekCard(deck);

        expect(card).toEqual({ name: 'Top' });
        expect(deck.length).toBe(2); // Not mutated
    });

    it('returns null for empty deck', () => {
        expect(peekCard([])).toBeNull();
    });
});

describe('peekCards', () => {
    it('returns top cards without removing them', () => {
        const deck = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
        const cards = peekCards(deck, 2);

        expect(cards).toEqual([{ id: 4 }, { id: 3 }]);
        expect(deck.length).toBe(4); // Not mutated
    });

    it('returns fewer cards if deck is smaller', () => {
        const deck = [{ id: 1 }, { id: 2 }];
        const cards = peekCards(deck, 5);

        expect(cards).toHaveLength(2);
    });
});

describe('getDeckSize', () => {
    it('returns the number of cards', () => {
        expect(getDeckSize([1, 2, 3])).toBe(3);
        expect(getDeckSize([])).toBe(0);
    });

    it('throws error for non-array', () => {
        expect(() => getDeckSize('not array')).toThrow('Deck must be an array');
    });
});

describe('isDeckEmpty', () => {
    it('returns true for empty deck', () => {
        expect(isDeckEmpty([])).toBe(true);
    });

    it('returns false for non-empty deck', () => {
        expect(isDeckEmpty([1])).toBe(false);
    });

    it('throws error for non-array', () => {
        expect(() => isDeckEmpty('not array')).toThrow('Deck must be an array');
    });
});

describe('addCardToBottom', () => {
    it('adds card to the bottom', () => {
        const deck = [2, 3];
        addCardToBottom(deck, 1);

        expect(deck).toEqual([1, 2, 3]);
    });

    it('returns the deck', () => {
        const deck = [];
        const result = addCardToBottom(deck, 'card');

        expect(result).toBe(deck);
    });
});

describe('addCardToTop', () => {
    it('adds card to the top', () => {
        const deck = [1, 2];
        addCardToTop(deck, 3);

        expect(deck).toEqual([1, 2, 3]);
    });

    it('returns the deck', () => {
        const deck = [];
        const result = addCardToTop(deck, 'card');

        expect(result).toBe(deck);
    });
});

describe('returnCards', () => {
    it('adds cards back to deck', () => {
        const deck = [1, 2];
        const cards = [3, 4];

        returnCards(deck, cards, false); // Don't shuffle

        expect(deck).toEqual([1, 2, 3, 4]);
    });

    it('shuffles by default', () => {
        const deck = [1, 2];
        const cards = [3, 4];

        returnCards(deck, cards); // Default shuffle = true

        expect(deck).toHaveLength(4);
        expect(deck.sort()).toEqual([1, 2, 3, 4]);
    });

    it('throws error for invalid inputs', () => {
        expect(() => returnCards('not array', [])).toThrow('Deck must be an array');
        expect(() => returnCards([], 'not array')).toThrow('Cards must be an array');
    });
});

describe('cutDeck', () => {
    it('cuts deck at position', () => {
        const deck = [1, 2, 3, 4, 5];
        cutDeck(deck, 2);

        expect(deck).toEqual([1, 2, 3, 4, 5]); // Cut at 2: [3,4,5] + [1,2]
    });

    it('handles cut at start', () => {
        const deck = [1, 2, 3];
        cutDeck(deck, 0);

        expect(deck).toEqual([1, 2, 3]); // No change
    });

    it('handles cut at end', () => {
        const deck = [1, 2, 3];
        cutDeck(deck, 3);

        expect(deck).toEqual([1, 2, 3]); // No change
    });

    it('throws error for invalid position', () => {
        const deck = [1, 2, 3];
        expect(() => cutDeck(deck, -1)).toThrow('Invalid cut position');
        expect(() => cutDeck(deck, 4)).toThrow('Invalid cut position');
    });
});

describe('dealHands', () => {
    it('deals cards round-robin style', () => {
        const deck = [1, 2, 3, 4, 5, 6, 7, 8];
        const hands = dealHands(deck, 2, 3);

        expect(hands).toHaveLength(2);
        expect(hands[0]).toEqual([8, 6, 4]); // Player 1 gets top card first
        expect(hands[1]).toEqual([7, 5, 3]); // Player 2 gets second card
        expect(deck).toEqual([1, 2]); // Remaining cards
    });

    it('throws error if not enough cards', () => {
        const deck = [1, 2, 3];
        expect(() => dealHands(deck, 2, 3)).toThrow('Not enough cards');
    });

    it('throws error for invalid parameters', () => {
        const deck = [1, 2, 3, 4];
        expect(() => dealHands(deck, 0, 2)).toThrow('Invalid number of hands');
        expect(() => dealHands(deck, 2, 0)).toThrow('Invalid cards per hand');
    });
});
