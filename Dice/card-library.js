/**
 * CardLibrary.js - Generic card deck utilities
 *
 * Pure functions for card deck operations with NO DOM dependencies.
 * Can be used for any card game: Tarot, playing cards, custom decks, etc.
 *
 * Provides shuffle, draw, and deck management mechanics.
 */

/**
 * Create a fresh deck from a card array
 * Returns a copy to avoid mutating the original
 * @param {Array} cards - Array of card objects
 * @returns {Array} - Copy of the card array
 */
export function createDeck(cards) {
    if (!Array.isArray(cards)) {
        throw new Error('Cards must be an array');
    }
    return [...cards];
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 * Mutates the deck array in place for performance
 * @param {Array} deck - Array of cards to shuffle
 * @returns {Array} - The shuffled deck (same reference, mutated)
 */
export function shuffleDeck(deck) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

/**
 * Draw a single card from the top of the deck (removes from deck)
 * @param {Array} deck - The deck to draw from
 * @returns {Object|null} - The drawn card, or null if deck is empty
 */
export function drawCard(deck) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }

    if (deck.length === 0) {
        return null;
    }

    return deck.pop();
}

/**
 * Draw multiple cards from the deck
 * @param {Array} deck - The deck to draw from
 * @param {number} count - Number of cards to draw
 * @returns {Array} - Array of drawn cards (may be less than count if deck runs out)
 */
export function drawCards(deck, count) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Invalid count: ${count}. Must be a non-negative integer.`);
    }

    const drawn = [];
    const actualCount = Math.min(count, deck.length);

    for (let i = 0; i < actualCount; i++) {
        drawn.push(deck.pop());
    }

    return drawn;
}

/**
 * Peek at the top card without removing it
 * @param {Array} deck - The deck to peek at
 * @returns {Object|null} - The top card, or null if deck is empty
 */
export function peekCard(deck) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }

    if (deck.length === 0) {
        return null;
    }

    return deck[deck.length - 1];
}

/**
 * Peek at multiple cards from the top without removing them
 * @param {Array} deck - The deck to peek at
 * @param {number} count - Number of cards to peek at
 * @returns {Array} - Array of top cards (may be less than count if deck is smaller)
 */
export function peekCards(deck, count) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Invalid count: ${count}`);
    }

    const actualCount = Math.min(count, deck.length);
    return deck.slice(-actualCount).reverse();
}

/**
 * Get the number of cards remaining in the deck
 * @param {Array} deck - The deck to count
 * @returns {number} - Number of cards in deck
 */
export function getDeckSize(deck) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    return deck.length;
}

/**
 * Check if the deck is empty
 * @param {Array} deck - The deck to check
 * @returns {boolean} - True if deck is empty
 */
export function isDeckEmpty(deck) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    return deck.length === 0;
}

/**
 * Add a card to the bottom of the deck
 * @param {Array} deck - The deck to add to
 * @param {Object} card - The card to add
 * @returns {Array} - The deck (mutated)
 */
export function addCardToBottom(deck, card) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    deck.unshift(card);
    return deck;
}

/**
 * Add a card to the top of the deck
 * @param {Array} deck - The deck to add to
 * @param {Object} card - The card to add
 * @returns {Array} - The deck (mutated)
 */
export function addCardToTop(deck, card) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    deck.push(card);
    return deck;
}

/**
 * Add multiple cards back to the deck and shuffle
 * @param {Array} deck - The deck to add to
 * @param {Array} cards - The cards to add back
 * @param {boolean} [shuffle=true] - Whether to shuffle after adding
 * @returns {Array} - The deck (mutated)
 */
export function returnCards(deck, cards, shuffle = true) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    if (!Array.isArray(cards)) {
        throw new Error('Cards must be an array');
    }

    deck.push(...cards);

    if (shuffle) {
        shuffleDeck(deck);
    }

    return deck;
}

/**
 * Cut the deck at a specific position
 * Moves cards from top to bottom
 * @param {Array} deck - The deck to cut
 * @param {number} position - Position to cut at (0 to deck.length)
 * @returns {Array} - The deck (mutated)
 */
export function cutDeck(deck, position) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    if (!Number.isInteger(position) || position < 0 || position > deck.length) {
        throw new Error(`Invalid cut position: ${position}`);
    }

    const top = deck.slice(position);
    const bottom = deck.slice(0, position);

    deck.length = 0;  // Clear array
    deck.push(...bottom, ...top);

    return deck;
}

/**
 * Deal cards to multiple hands
 * @param {Array} deck - The deck to deal from
 * @param {number} numHands - Number of hands to deal
 * @param {number} cardsPerHand - Number of cards per hand
 * @returns {Array[]} - Array of hands (each hand is an array of cards)
 */
export function dealHands(deck, numHands, cardsPerHand) {
    if (!Array.isArray(deck)) {
        throw new Error('Deck must be an array');
    }
    if (!Number.isInteger(numHands) || numHands < 1) {
        throw new Error(`Invalid number of hands: ${numHands}`);
    }
    if (!Number.isInteger(cardsPerHand) || cardsPerHand < 1) {
        throw new Error(`Invalid cards per hand: ${cardsPerHand}`);
    }

    const totalNeeded = numHands * cardsPerHand;
    if (deck.length < totalNeeded) {
        throw new Error(`Not enough cards. Need ${totalNeeded}, have ${deck.length}`);
    }

    const hands = Array(numHands).fill(null).map(() => []);

    // Deal cards round-robin style
    for (let i = 0; i < cardsPerHand; i++) {
        for (let j = 0; j < numHands; j++) {
            hands[j].push(deck.pop());
        }
    }

    return hands;
}
