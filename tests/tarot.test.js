/**
 * Tests for Tarot.js - Tarot card reading system
 *
 * Run with: npm test
 */

import { describe, it, expect, vi } from 'vitest';
import {
    majorArcana,
    minorArcana,
    createTarotDeck,
    drawTarotCard,
    performThreeCardSpread,
    formatTarotCard,
    getCardImagePath,
    getCardMeaning
} from '../tarot.js';

describe('majorArcana', () => {
    it('has 22 cards', () => {
        expect(majorArcana).toHaveLength(22);
    });

    it('cards are numbered 0-21', () => {
        const numbers = majorArcana.map(card => card.number);
        expect(numbers).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
    });

    it('all cards have required properties', () => {
        majorArcana.forEach(card => {
            expect(card).toHaveProperty('number');
            expect(card).toHaveProperty('name');
            expect(card).toHaveProperty('type', 'major');
            expect(card).toHaveProperty('upright');
            expect(card).toHaveProperty('reversed');
        });
    });

    it('The Fool is card 0', () => {
        expect(majorArcana[0].name).toBe('The Fool');
        expect(majorArcana[0].number).toBe(0);
    });

    it('The World is card 21', () => {
        expect(majorArcana[21].name).toBe('The World');
        expect(majorArcana[21].number).toBe(21);
    });
});

describe('minorArcana', () => {
    it('has 56 cards (4 suits × 14 ranks)', () => {
        expect(minorArcana).toHaveLength(56);
    });

    it('has 4 suits', () => {
        const suits = new Set(minorArcana.map(card => card.suit));
        expect(suits.size).toBe(4);
        expect(suits.has('Wands')).toBe(true);
        expect(suits.has('Cups')).toBe(true);
        expect(suits.has('Swords')).toBe(true);
        expect(suits.has('Pentacles')).toBe(true);
    });

    it('each suit has 14 cards', () => {
        const suits = ['Wands', 'Cups', 'Swords', 'Pentacles'];
        suits.forEach(suit => {
            const suitCards = minorArcana.filter(card => card.suit === suit);
            expect(suitCards).toHaveLength(14);
        });
    });

    it('all cards have required properties', () => {
        minorArcana.forEach(card => {
            expect(card).toHaveProperty('suit');
            expect(card).toHaveProperty('rank');
            expect(card).toHaveProperty('name');
            expect(card).toHaveProperty('type', 'minor');
            expect(card).toHaveProperty('upright');
            expect(card).toHaveProperty('reversed');
        });
    });

    it('has correct ranks', () => {
        const ranks = new Set(minorArcana.map(card => card.rank));
        const expectedRanks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
        expect(ranks.size).toBe(14);
        expectedRanks.forEach(rank => {
            expect(ranks.has(rank)).toBe(true);
        });
    });
});

describe('createTarotDeck', () => {
    it('creates major arcana deck by default', () => {
        const deck = createTarotDeck();
        expect(deck).toHaveLength(22);
    });

    it('creates major arcana deck when specified', () => {
        const deck = createTarotDeck('major');
        expect(deck).toHaveLength(22);
        expect(deck.every(card => card.type === 'major')).toBe(true);
    });

    it('creates minor arcana deck when specified', () => {
        const deck = createTarotDeck('minor');
        expect(deck).toHaveLength(56);
        expect(deck.every(card => card.type === 'minor')).toBe(true);
    });

    it('creates full deck when "both" specified', () => {
        const deck = createTarotDeck('both');
        expect(deck).toHaveLength(78);
    });

    it('returns a copy, not original array', () => {
        const deck = createTarotDeck('major');
        expect(deck).not.toBe(majorArcana);
    });
});

describe('drawTarotCard', () => {
    it('draws a card from the deck', () => {
        const deck = createTarotDeck('major');
        const originalLength = deck.length;
        const card = drawTarotCard(deck, false);

        expect(card).toBeDefined();
        expect(deck.length).toBe(originalLength - 1);
    });

    it('adds isReversed property', () => {
        const deck = createTarotDeck('major');
        const card = drawTarotCard(deck, false);

        expect(card).toHaveProperty('isReversed');
    });

    it('never reverses when allowReversed is false', () => {
        const deck = createTarotDeck('major');
        const cards = Array(22).fill(0).map(() => drawTarotCard(deck, false));

        expect(cards.every(card => card.isReversed === false)).toBe(true);
    });

    it('sometimes reverses when allowReversed is true', () => {
        // Draw many cards to ensure we hit both outcomes
        const cards = [];
        for (let i = 0; i < 200; i++) {
            const deck = createTarotDeck('major');
            cards.push(drawTarotCard(deck, true));
        }

        const reversedCount = cards.filter(card => card.isReversed === true).length;
        const uprightCount = cards.filter(card => card.isReversed === false).length;

        // With 200 draws at 50% probability, we should have at least some of each
        // Probability of getting 0 of either is (0.5)^200 which is essentially 0
        expect(reversedCount).toBeGreaterThan(0);
        expect(uprightCount).toBeGreaterThan(0);

        // And the reversal rate should be roughly 50% (between 35% and 65% is very safe)
        const reversalRate = reversedCount / cards.length;
        expect(reversalRate).toBeGreaterThan(0.35);
        expect(reversalRate).toBeLessThan(0.65);
    });

    it('returns null for empty deck', () => {
        const deck = [];
        const card = drawTarotCard(deck, false);

        expect(card).toBeNull();
    });
});

describe('performThreeCardSpread', () => {
    it('returns three cards', () => {
        const spread = performThreeCardSpread('major', false);

        expect(spread).toHaveProperty('past');
        expect(spread).toHaveProperty('present');
        expect(spread).toHaveProperty('future');
    });

    it('all cards are defined', () => {
        const spread = performThreeCardSpread('major', false);

        expect(spread.past).toBeDefined();
        expect(spread.present).toBeDefined();
        expect(spread.future).toBeDefined();
    });

    it('cards are different from each other', () => {
        const spread = performThreeCardSpread('major', false);

        // Cards should be different objects
        expect(spread.past).not.toBe(spread.present);
        expect(spread.present).not.toBe(spread.future);
        expect(spread.past).not.toBe(spread.future);
    });

    it('respects deck type parameter', () => {
        const majorSpread = performThreeCardSpread('major', false);
        expect(majorSpread.past.type).toBe('major');

        const minorSpread = performThreeCardSpread('minor', false);
        expect(minorSpread.past.type).toBe('minor');
    });

    it('respects allowReversed parameter', () => {
        const upright = performThreeCardSpread('major', false);
        expect(upright.past.isReversed).toBe(false);
        expect(upright.present.isReversed).toBe(false);
        expect(upright.future.isReversed).toBe(false);
    });
});

describe('formatTarotCard', () => {
    it('formats major arcana with number', () => {
        const card = { number: 0, name: 'The Fool', type: 'major', isReversed: false };
        expect(formatTarotCard(card)).toBe('0. The Fool');
    });

    it('formats minor arcana without number', () => {
        const card = { name: 'Ace of Wands', type: 'minor', isReversed: false };
        expect(formatTarotCard(card)).toBe('Ace of Wands');
    });

    it('adds (Reversed) suffix when reversed', () => {
        const card = { number: 13, name: 'Death', type: 'major', isReversed: true };
        expect(formatTarotCard(card)).toBe('13. Death (Reversed)');
    });

    it('returns "--" for null card', () => {
        expect(formatTarotCard(null)).toBe('--');
    });
});

describe('getCardImagePath', () => {
    it('generates correct path for major arcana', () => {
        const fool = { number: 0, name: 'The Fool', type: 'major' };
        expect(getCardImagePath(fool)).toBe('img/tarot/00-thefool.png');

        const world = { number: 21, name: 'The World', type: 'major' };
        expect(getCardImagePath(world)).toBe('img/tarot/21-theworld.png');
    });

    it('pads single digit numbers with zero', () => {
        const magician = { number: 1, name: 'The Magician', type: 'major' };
        expect(getCardImagePath(magician)).toBe('img/tarot/01-themagician.png');
    });

    it('removes spaces from card names and lowercases', () => {
        const highPriestess = { number: 2, name: 'The High Priestess', type: 'major' };
        expect(getCardImagePath(highPriestess)).toBe('img/tarot/02-thehighpriestess.png');
    });

    it('generates correct path for minor arcana', () => {
        const aceWands = { rank: 'Ace', suit: 'Wands', type: 'minor' };
        expect(getCardImagePath(aceWands)).toBe('img/tarot/wands01.png');

        const kingCups = { rank: 'King', suit: 'Cups', type: 'minor' };
        expect(getCardImagePath(kingCups)).toBe('img/tarot/cups14.png');
    });

    it('uses correct rank numbers', () => {
        const page = { rank: 'Page', suit: 'Swords', type: 'minor' };
        expect(getCardImagePath(page)).toBe('img/tarot/swords11.png');

        const knight = { rank: 'Knight', suit: 'Pentacles', type: 'minor' };
        expect(getCardImagePath(knight)).toBe('img/tarot/pentacles12.png');

        const queen = { rank: 'Queen', suit: 'Wands', type: 'minor' };
        expect(getCardImagePath(queen)).toBe('img/tarot/wands13.png');
    });
});

describe('getCardMeaning', () => {
    it('returns upright meaning for upright card', () => {
        const card = {
            name: 'The Fool',
            type: 'major',
            upright: 'New beginnings, innocence',
            reversed: 'Recklessness, naivety',
            isReversed: false
        };

        const meaning = getCardMeaning(card);

        expect(meaning.orientation).toBe('Upright');
        expect(meaning.meaning).toBe('New beginnings, innocence');
    });

    it('returns reversed meaning for reversed card', () => {
        const card = {
            name: 'The Fool',
            type: 'major',
            upright: 'New beginnings, innocence',
            reversed: 'Recklessness, naivety',
            isReversed: true
        };

        const meaning = getCardMeaning(card);

        expect(meaning.orientation).toBe('Reversed');
        expect(meaning.meaning).toBe('Recklessness, naivety');
    });

    it('returns empty for null card', () => {
        const meaning = getCardMeaning(null);

        expect(meaning.orientation).toBe('');
        expect(meaning.meaning).toBe('');
    });
});
