/**
 * Tests for poker-cards.js - Standard playing card deck definitions
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import {
    SUITS,
    RANKS,
    createPokerDeck,
    createShuffledPokerDeck,
    formatPokerCard,
    getCardShortName,
    getCardColor,
    isJoker
} from '../poker-cards.js';

describe('SUITS', () => {
    it('has 4 suits', () => {
        expect(SUITS).toHaveLength(4);
    });

    it('has correct suit names', () => {
        const names = SUITS.map(s => s.name);
        expect(names).toEqual(['Hearts', 'Diamonds', 'Clubs', 'Spades']);
    });

    it('has correct colors', () => {
        expect(SUITS[0].color).toBe('red');    // Hearts
        expect(SUITS[1].color).toBe('red');    // Diamonds
        expect(SUITS[2].color).toBe('black');  // Clubs
        expect(SUITS[3].color).toBe('black');  // Spades
    });

    it('has unicode symbols', () => {
        SUITS.forEach(suit => {
            expect(suit.symbol).toBeDefined();
            expect(suit.symbol.length).toBeGreaterThan(0);
        });
    });
});

describe('RANKS', () => {
    it('has 13 ranks', () => {
        expect(RANKS).toHaveLength(13);
    });

    it('starts with Ace and ends with King', () => {
        expect(RANKS[0].name).toBe('Ace');
        expect(RANKS[12].name).toBe('King');
    });

    it('has values 1-13', () => {
        const values = RANKS.map(r => r.value);
        expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('has short names', () => {
        expect(RANKS[0].shortName).toBe('A');
        expect(RANKS[9].shortName).toBe('10');
        expect(RANKS[10].shortName).toBe('J');
        expect(RANKS[11].shortName).toBe('Q');
        expect(RANKS[12].shortName).toBe('K');
    });
});

describe('createPokerDeck', () => {
    it('creates 52 cards without jokers', () => {
        const deck = createPokerDeck();
        expect(deck).toHaveLength(52);
    });

    it('creates 54 cards with jokers', () => {
        const deck = createPokerDeck(true);
        expect(deck).toHaveLength(54);
    });

    it('has 13 cards per suit', () => {
        const deck = createPokerDeck();
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

        suits.forEach(suit => {
            const suitCards = deck.filter(c => c.suit === suit);
            expect(suitCards).toHaveLength(13);
        });
    });

    it('has 4 cards per rank', () => {
        const deck = createPokerDeck();
        const rankNames = RANKS.map(r => r.name);

        rankNames.forEach(rank => {
            const rankCards = deck.filter(c => c.rank === rank);
            expect(rankCards).toHaveLength(4);
        });
    });

    it('all cards have required properties', () => {
        const deck = createPokerDeck();
        deck.forEach(card => {
            expect(card).toHaveProperty('name');
            expect(card).toHaveProperty('suit');
            expect(card).toHaveProperty('rank');
            expect(card).toHaveProperty('value');
            expect(card).toHaveProperty('color');
            expect(card).toHaveProperty('suitSymbol');
            expect(card).toHaveProperty('shortName');
            expect(card).toHaveProperty('type', 'poker');
        });
    });

    it('has correct card names', () => {
        const deck = createPokerDeck();
        expect(deck[0].name).toBe('Ace of Hearts');
        expect(deck[51].name).toBe('King of Spades');
    });

    it('has correct short names', () => {
        const deck = createPokerDeck();
        const aceHearts = deck.find(c => c.name === 'Ace of Hearts');
        expect(aceHearts.shortName).toContain('A');

        const kingSpades = deck.find(c => c.name === 'King of Spades');
        expect(kingSpades.shortName).toContain('K');
    });

    it('returns a copy (not mutating internal state)', () => {
        const deck1 = createPokerDeck();
        const deck2 = createPokerDeck();
        expect(deck1).not.toBe(deck2);
        expect(deck1).toEqual(deck2);
    });

    it('jokers have correct properties', () => {
        const deck = createPokerDeck(true);
        const jokers = deck.filter(c => c.suit === 'Joker');

        expect(jokers).toHaveLength(2);
        expect(jokers[0].name).toBe('Red Joker');
        expect(jokers[0].color).toBe('red');
        expect(jokers[0].value).toBe(0);
        expect(jokers[1].name).toBe('Black Joker');
        expect(jokers[1].color).toBe('black');
    });
});

describe('createShuffledPokerDeck', () => {
    it('returns a deck of 52 cards', () => {
        const deck = createShuffledPokerDeck();
        expect(deck).toHaveLength(52);
    });

    it('returns a deck of 54 cards with jokers', () => {
        const deck = createShuffledPokerDeck(true);
        expect(deck).toHaveLength(54);
    });

    it('contains all the same cards as an unshuffled deck', () => {
        const shuffled = createShuffledPokerDeck();
        const unshuffled = createPokerDeck();

        const sortByName = (a, b) => a.name.localeCompare(b.name);
        expect(shuffled.sort(sortByName)).toEqual(unshuffled.sort(sortByName));
    });
});

describe('formatPokerCard', () => {
    it('returns card name', () => {
        const card = { name: 'Ace of Spades', suit: 'Spades', rank: 'Ace', value: 1, color: 'black', type: 'poker' };
        expect(formatPokerCard(card)).toBe('Ace of Spades');
    });

    it('returns "--" for null', () => {
        expect(formatPokerCard(null)).toBe('--');
    });
});

describe('getCardShortName', () => {
    it('returns short name', () => {
        const card = { shortName: 'A\u2660', type: 'poker' };
        expect(getCardShortName(card)).toBe('A\u2660');
    });

    it('returns "--" for null', () => {
        expect(getCardShortName(null)).toBe('--');
    });
});

describe('getCardColor', () => {
    it('returns red for hearts', () => {
        const card = { color: 'red', suit: 'Hearts', type: 'poker' };
        expect(getCardColor(card)).toBe('red');
    });

    it('returns black for spades', () => {
        const card = { color: 'black', suit: 'Spades', type: 'poker' };
        expect(getCardColor(card)).toBe('black');
    });

    it('returns black for null', () => {
        expect(getCardColor(null)).toBe('black');
    });
});

describe('isJoker', () => {
    it('returns true for joker cards', () => {
        const joker = { suit: 'Joker', name: 'Red Joker', type: 'poker' };
        expect(isJoker(joker)).toBe(true);
    });

    it('returns false for regular cards', () => {
        const card = { suit: 'Hearts', name: 'Ace of Hearts', type: 'poker' };
        expect(isJoker(card)).toBe(false);
    });

    it('returns falsy for null', () => {
        expect(isJoker(null)).toBeFalsy();
    });
});
