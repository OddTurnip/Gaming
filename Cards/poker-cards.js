/**
 * poker-cards.js - Standard playing card deck definitions
 *
 * Pure data and factory functions for standard 52-card poker decks.
 * Uses card-library.js for deck mechanics (shuffle, draw, etc.)
 *
 * Card objects follow a common shape:
 * @typedef {Object} PokerCard
 * @property {string} name - Display name (e.g., "Ace of Spades")
 * @property {string} suit - Suit name (Hearts, Diamonds, Clubs, Spades)
 * @property {string} rank - Rank name (Ace, 2, 3, ..., King)
 * @property {number} value - Numeric value (1-13, Ace=1, King=13)
 * @property {string} color - "red" or "black"
 * @property {string} suitSymbol - Unicode suit symbol
 * @property {string} shortName - Short display (e.g., "A♠")
 * @property {string} type - Always "poker"
 */

import { createDeck, shuffleDeck } from '../code/card-library.js';

/** @type {ReadonlyArray<{name: string, symbol: string, color: string}>} */
export const SUITS = Object.freeze([
    { name: 'Hearts', symbol: '\u2665', color: 'red' },
    { name: 'Diamonds', symbol: '\u2666', color: 'red' },
    { name: 'Clubs', symbol: '\u2663', color: 'black' },
    { name: 'Spades', symbol: '\u2660', color: 'black' }
]);

/** @type {ReadonlyArray<{name: string, shortName: string, value: number}>} */
export const RANKS = Object.freeze([
    { name: 'Ace', shortName: 'A', value: 1 },
    { name: '2', shortName: '2', value: 2 },
    { name: '3', shortName: '3', value: 3 },
    { name: '4', shortName: '4', value: 4 },
    { name: '5', shortName: '5', value: 5 },
    { name: '6', shortName: '6', value: 6 },
    { name: '7', shortName: '7', value: 7 },
    { name: '8', shortName: '8', value: 8 },
    { name: '9', shortName: '9', value: 9 },
    { name: '10', shortName: '10', value: 10 },
    { name: 'Jack', shortName: 'J', value: 11 },
    { name: 'Queen', shortName: 'Q', value: 12 },
    { name: 'King', shortName: 'K', value: 13 }
]);

/**
 * Create a standard poker deck
 * @param {boolean} [includeJokers=false] - Whether to include 2 Joker cards
 * @returns {PokerCard[]} Array of 52 (or 54) card objects
 */
export function createPokerDeck(includeJokers = false) {
    const cards = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            cards.push({
                name: `${rank.name} of ${suit.name}`,
                suit: suit.name,
                rank: rank.name,
                value: rank.value,
                color: suit.color,
                suitSymbol: suit.symbol,
                shortName: `${rank.shortName}${suit.symbol}`,
                type: 'poker'
            });
        }
    }

    if (includeJokers) {
        cards.push({
            name: 'Red Joker',
            suit: 'Joker',
            rank: 'Joker',
            value: 0,
            color: 'red',
            suitSymbol: '\u2605',
            shortName: '\u2605',
            type: 'poker'
        });
        cards.push({
            name: 'Black Joker',
            suit: 'Joker',
            rank: 'Joker',
            value: 0,
            color: 'black',
            suitSymbol: '\u2606',
            shortName: '\u2606',
            type: 'poker'
        });
    }

    return createDeck(cards);
}

/**
 * Create a shuffled poker deck ready to play
 * @param {boolean} [includeJokers=false] - Whether to include Jokers
 * @returns {PokerCard[]} Shuffled deck
 */
export function createShuffledPokerDeck(includeJokers = false) {
    return shuffleDeck(createPokerDeck(includeJokers));
}

/**
 * Format a poker card for display
 * @param {PokerCard} card - The card to format
 * @returns {string} Display string like "Ace of Spades"
 */
export function formatPokerCard(card) {
    if (!card) {
        return '--';
    }
    return card.name;
}

/**
 * Get the short display for a poker card
 * @param {PokerCard} card - The card
 * @returns {string} Short display like "A♠"
 */
export function getCardShortName(card) {
    if (!card) {
        return '--';
    }
    return card.shortName;
}

/**
 * Get the color class for a card (for CSS styling)
 * @param {PokerCard} card - The card
 * @returns {string} "red" or "black"
 */
export function getCardColor(card) {
    if (!card) {
        return 'black';
    }
    return card.color;
}

/**
 * Check if a card is a Joker
 * @param {PokerCard} card - The card to check
 * @returns {boolean} True if the card is a Joker
 */
export function isJoker(card) {
    return card && card.suit === 'Joker';
}
