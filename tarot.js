/**
 * Tarot.js - Tarot card reading system
 *
 * Pure functions and data for Tarot card readings.
 * Uses CardLibrary.js for deck mechanics.
 *
 * Includes full 78-card deck: 22 Major Arcana + 56 Minor Arcana
 */

import { createDeck, shuffleDeck, drawCard } from './card-library.js';

// Major Arcana cards (0-21) with meanings
export const majorArcana = [
    { number: 0, name: "The Fool", type: "major",
      upright: "New beginnings, innocence, spontaneity, free spirit, adventure",
      reversed: "Recklessness, taking foolish risks, naivety, poor judgment" },
    { number: 1, name: "The Magician", type: "major",
      upright: "Manifestation, resourcefulness, power, inspired action, skill",
      reversed: "Manipulation, poor planning, untapped talents, trickery" },
    { number: 2, name: "The High Priestess", type: "major",
      upright: "Intuition, sacred knowledge, divine feminine, subconscious mind",
      reversed: "Secrets, disconnected from intuition, withdrawal, silence" },
    { number: 3, name: "The Empress", type: "major",
      upright: "Femininity, beauty, nature, nurturing, abundance, creativity",
      reversed: "Creative block, dependence on others, emptiness, lack of growth" },
    { number: 4, name: "The Emperor", type: "major",
      upright: "Authority, establishment, structure, father figure, control",
      reversed: "Domination, excessive control, lack of discipline, rigidity" },
    { number: 5, name: "The Hierophant", type: "major",
      upright: "Spiritual wisdom, religious beliefs, conformity, tradition, institutions",
      reversed: "Personal beliefs, freedom, challenging the status quo, rebellion" },
    { number: 6, name: "The Lovers", type: "major",
      upright: "Love, harmony, relationships, values alignment, choices",
      reversed: "Self-love, disharmony, imbalance, misalignment of values" },
    { number: 7, name: "The Chariot", type: "major",
      upright: "Control, willpower, success, action, determination, victory",
      reversed: "Self-discipline, opposition, lack of direction, aggression" },
    { number: 8, name: "Strength", type: "major",
      upright: "Strength, courage, persuasion, influence, compassion, inner power",
      reversed: "Inner strength, self-doubt, low energy, raw emotion, insecurity" },
    { number: 9, name: "The Hermit", type: "major",
      upright: "Soul searching, introspection, inner guidance, solitude, wisdom",
      reversed: "Isolation, loneliness, withdrawal, lost your way, recluse" },
    { number: 10, name: "Wheel of Fortune", type: "major",
      upright: "Good luck, karma, life cycles, destiny, turning point, change",
      reversed: "Bad luck, resistance to change, breaking cycles, external forces" },
    { number: 11, name: "Justice", type: "major",
      upright: "Justice, fairness, truth, cause and effect, law, accountability",
      reversed: "Unfairness, lack of accountability, dishonesty, injustice" },
    { number: 12, name: "The Hanged Man", type: "major",
      upright: "Pause, surrender, letting go, new perspectives, sacrifice",
      reversed: "Delays, resistance, stalling, indecision, stagnation" },
    { number: 13, name: "Death", type: "major",
      upright: "Endings, change, transformation, transition, new beginnings",
      reversed: "Resistance to change, personal transformation, inner purging" },
    { number: 14, name: "Temperance", type: "major",
      upright: "Balance, moderation, patience, purpose, meaning, harmony",
      reversed: "Imbalance, excess, self-healing, re-alignment, rushed" },
    { number: 15, name: "The Devil", type: "major",
      upright: "Shadow self, attachment, addiction, restriction, sexuality, materialism",
      reversed: "Releasing limiting beliefs, exploring dark thoughts, detachment" },
    { number: 16, name: "The Tower", type: "major",
      upright: "Sudden change, upheaval, chaos, revelation, awakening, disruption",
      reversed: "Personal transformation, fear of change, averting disaster" },
    { number: 17, name: "The Star", type: "major",
      upright: "Hope, faith, purpose, renewal, spirituality, inspiration",
      reversed: "Lack of faith, despair, self-trust, disconnection, pessimism" },
    { number: 18, name: "The Moon", type: "major",
      upright: "Illusion, fear, anxiety, subconscious, intuition, dreams",
      reversed: "Release of fear, repressed emotion, inner confusion, clarity" },
    { number: 19, name: "The Sun", type: "major",
      upright: "Positivity, fun, warmth, success, vitality, joy, confidence",
      reversed: "Inner child, feeling down, overly optimistic, unrealistic" },
    { number: 20, name: "Judgement", type: "major",
      upright: "Judgement, rebirth, inner calling, absolution, reflection",
      reversed: "Self-doubt, inner critic, ignoring the call, self-loathing" },
    { number: 21, name: "The World", type: "major",
      upright: "Completion, integration, accomplishment, travel, fulfillment",
      reversed: "Seeking personal closure, short-cuts, delays, incompletion" }
];

// Minor Arcana meanings by suit and rank
const minorMeanings = {
    "Wands": {
        "Ace": { upright: "Inspiration, new opportunities, growth, potential", reversed: "Emerging idea, lack of direction, delays, distractions" },
        "Two": { upright: "Future planning, progress, decisions, discovery", reversed: "Personal goals, inner alignment, fear of unknown, lack of planning" },
        "Three": { upright: "Progress, expansion, foresight, overseas opportunities", reversed: "Playing small, lack of foresight, delays, unexpected obstacles" },
        "Four": { upright: "Celebration, harmony, marriage, home, community", reversed: "Personal celebration, inner harmony, conflict with others, transition" },
        "Five": { upright: "Disagreement, competition, tension, diversity", reversed: "Inner conflict, conflict avoidance, releasing tension" },
        "Six": { upright: "Success, public recognition, progress, self-confidence", reversed: "Private achievement, personal definition of success, fall from grace" },
        "Seven": { upright: "Challenge, competition, protection, perseverance", reversed: "Exhaustion, giving up, overwhelmed" },
        "Eight": { upright: "Movement, fast paced change, action, alignment", reversed: "Delays, frustration, resisting change, internal alignment" },
        "Nine": { upright: "Resilience, courage, persistence, test of faith", reversed: "Inner resources, struggle, overwhelm, defensive, paranoia" },
        "Ten": { upright: "Burden, extra responsibility, hard work, completion", reversed: "Inability to delegate, overstressed, burnt out" },
        "Page": { upright: "Inspiration, ideas, discovery, limitless potential, free spirit", reversed: "Newly-formed ideas, redirecting energy, self-limiting beliefs" },
        "Knight": { upright: "Energy, passion, inspired action, adventure, impulsiveness", reversed: "Passion project, haste, scattered energy, delays, frustration" },
        "Queen": { upright: "Courage, confidence, independence, social butterfly, determination", reversed: "Self-respect, unforgiving, demanding, aggressive" },
        "King": { upright: "Natural-born leader, vision, entrepreneur, honour", reversed: "Impulsiveness, haste, ruthless, high expectations" }
    },
    "Cups": {
        "Ace": { upright: "Love, new relationships, compassion, creativity", reversed: "Self-love, intuition, repressed emotions" },
        "Two": { upright: "Unified love, partnership, mutual attraction", reversed: "Self-love, break-ups, disharmony, distrust" },
        "Three": { upright: "Celebration, friendship, creativity, collaborations", reversed: "Independence, alone time, hardcore partying, 'three's a crowd'" },
        "Four": { upright: "Meditation, contemplation, apathy, reevaluation", reversed: "Retreat, withdrawal, checking in for alignment" },
        "Five": { upright: "Regret, failure, disappointment, pessimism", reversed: "Personal setbacks, self-forgiveness, moving on" },
        "Six": { upright: "Revisiting the past, childhood memories, innocence, joy", reversed: "Living in the past, forgiveness, lacking playfulness" },
        "Seven": { upright: "Opportunities, choices, wishful thinking, illusion", reversed: "Alignment, personal values, overwhelmed by choices" },
        "Eight": { upright: "Disappointment, abandonment, withdrawal, escapism", reversed: "Trying one more time, indecision, aimless drifting" },
        "Nine": { upright: "Contentment, satisfaction, gratitude, wish come true", reversed: "Inner happiness, materialism, dissatisfaction, indulgence" },
        "Ten": { upright: "Divine love, blissful relationships, harmony, alignment", reversed: "Disconnection, misaligned values, struggling relationships" },
        "Page": { upright: "Creative opportunities, intuitive messages, curiosity, possibility", reversed: "New ideas, doubting intuition, creative blocks, emotional immaturity" },
        "Knight": { upright: "Creativity, romance, charm, imagination, beauty", reversed: "Overactive imagination, unrealistic, jealous, moody" },
        "Queen": { upright: "Compassion, warmth, kindness, intuition, healer", reversed: "Inner feelings, self-care, self-love, co-dependency" },
        "King": { upright: "Emotionally balanced, compassion, diplomatic", reversed: "Self-compassion, inner feelings, moodiness, emotionally manipulative" }
    },
    "Swords": {
        "Ace": { upright: "Breakthrough, clarity, sharp mind, new ideas, mental clarity", reversed: "Inner clarity, re-thinking an idea, clouded judgement" },
        "Two": { upright: "Difficult decisions, weighing options, stalemate, avoidance", reversed: "Indecision, confusion, information overload, sticking to a decision" },
        "Three": { upright: "Heartbreak, emotional pain, sorrow, grief, hurt", reversed: "Negative self-talk, releasing pain, optimism, forgiveness" },
        "Four": { upright: "Rest, relaxation, meditation, contemplation, recuperation", reversed: "Exhaustion, burn-out, deep contemplation, stagnation" },
        "Five": { upright: "Conflict, disagreements, competition, defeat, winning at all costs", reversed: "Reconciliation, making amends, past resentment" },
        "Six": { upright: "Transition, change, rite of passage, releasing baggage", reversed: "Personal transition, resistance to change, unfinished business" },
        "Seven": { upright: "Betrayal, deception, getting away with something, stealth", reversed: "Imposter syndrome, self-deceit, keeping secrets" },
        "Eight": { upright: "Negative thoughts, self-imposed restriction, imprisonment, victim", reversed: "Self-limiting beliefs, inner critic, releasing negative thoughts" },
        "Nine": { upright: "Anxiety, worry, fear, depression, nightmares", reversed: "Inner turmoil, deep-seated fears, secrets, releasing worry" },
        "Ten": { upright: "Painful endings, deep wounds, betrayal, loss, crisis", reversed: "Recovery, regeneration, resisting an inevitable end" },
        "Page": { upright: "New ideas, curiosity, thirst for knowledge, new ways of communicating", reversed: "Self-expression, all talk and no action, haphazard action" },
        "Knight": { upright: "Ambitious, action-oriented, driven to succeed, fast-thinking", reversed: "Restless, unfocused, impulsive, burn-out" },
        "Queen": { upright: "Independent, unbiased judgement, clear boundaries, direct communication", reversed: "Overly-emotional, easily influenced, bitchy, cold-hearted" },
        "King": { upright: "Mental clarity, intellectual power, authority, truth", reversed: "Quiet power, inner truth, misuse of power, manipulation" }
    },
    "Pentacles": {
        "Ace": { upright: "New financial opportunity, prosperity, new job, manifestation", reversed: "Lost opportunity, lack of planning and foresight" },
        "Two": { upright: "Multiple priorities, time management, prioritisation, adaptability", reversed: "Over-committed, disorganisation, reprioritisation" },
        "Three": { upright: "Teamwork, collaboration, learning, implementation", reversed: "Disharmony, misalignment, working alone" },
        "Four": { upright: "Saving money, security, conservatism, scarcity, control", reversed: "Over-spending, greed, self-worth, financial insecurity" },
        "Five": { upright: "Financial loss, poverty, lack mindset, isolation, worry", reversed: "Recovery from financial loss, spiritual poverty" },
        "Six": { upright: "Giving, receiving, sharing wealth, generosity, charity", reversed: "Self-care, unpaid debts, one-sided charity" },
        "Seven": { upright: "Long-term view, sustainable results, perseverance, investment", reversed: "Lack of long-term vision, limited success, patience required" },
        "Eight": { upright: "Apprenticeship, repetitive tasks, mastery, skill development", reversed: "Self-development, perfectionism, misdirected activity" },
        "Nine": { upright: "Abundance, luxury, self-sufficiency, financial independence", reversed: "Self-worth, over-investment in work, hustling" },
        "Ten": { upright: "Wealth, financial security, family, long-term success, contribution", reversed: "The dark side of wealth, financial failure, loneliness" },
        "Page": { upright: "Manifestation, financial opportunity, skill development", reversed: "Lack of progress, procrastination, learn from failure" },
        "Knight": { upright: "Hard work, productivity, routine, conservatism, perfectionism", reversed: "Self-discipline, boredom, feeling 'stuck', perfectionism" },
        "Queen": { upright: "Nurturing, practical, providing financially, a working parent", reversed: "Financial independence, self-care, work-home conflict" },
        "King": { upright: "Wealth, business, leadership, security, discipline, abundance", reversed: "Financially inept, obsessed with wealth, stubborn, greed" }
    }
};

// Generate Minor Arcana cards
export const minorArcana = [];
const suits = ["Wands", "Cups", "Swords", "Pentacles"];
const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

suits.forEach(suit => {
    ranks.forEach(rank => {
        minorArcana.push({
            suit: suit,
            rank: rank,
            name: `${rank} of ${suit}`,
            type: "minor",
            upright: minorMeanings[suit][rank].upright,
            reversed: minorMeanings[suit][rank].reversed
        });
    });
});

/**
 * Create a tarot deck based on type
 * @param {string} [deckType='major'] - 'major', 'minor', or 'both'
 * @returns {Array} - Array of card objects
 */
export function createTarotDeck(deckType = 'major') {
    switch (deckType) {
        case 'both':
            return createDeck([...majorArcana, ...minorArcana]);
        case 'major':
            return createDeck(majorArcana);
        case 'minor':
            return createDeck(minorArcana);
        default:
            return createDeck(majorArcana);
    }
}

/**
 * Draw a tarot card with optional reversed orientation
 * @param {Array} deck - The deck to draw from
 * @param {boolean} [allowReversed=false] - Whether cards can be reversed
 * @returns {Object|null} - The drawn card with isReversed property, or null if deck empty
 */
export function drawTarotCard(deck, allowReversed = false) {
    const card = drawCard(deck);

    if (!card) {
        return null;
    }

    // Create a copy of the card object to avoid mutating the original
    // 50% chance of card being reversed if option is enabled
    return {
        ...card,
        isReversed: allowReversed && Math.random() < 0.5
    };
}

/**
 * Perform a three-card spread (Past, Present, Future)
 * @param {string} [deckType='major'] - Type of deck to use
 * @param {boolean} [allowReversed=false] - Whether to allow reversed cards
 * @returns {Object} - { past: Object, present: Object, future: Object }
 */
export function performThreeCardSpread(deckType = 'major', allowReversed = false) {
    const deck = shuffleDeck(createTarotDeck(deckType));

    const past = drawTarotCard(deck, allowReversed);
    const present = drawTarotCard(deck, allowReversed);
    const future = drawTarotCard(deck, allowReversed);

    return { past, present, future };
}

/**
 * Format a tarot card for display
 * @param {Object} card - The card object
 * @returns {string} - Formatted string like "0. The Fool" or "Ace of Wands (Reversed)"
 */
export function formatTarotCard(card) {
    if (!card) {
        return '--';
    }

    let cardName;
    if (card.type === 'major') {
        cardName = `${card.number}. ${card.name}`;
    } else {
        cardName = card.name;
    }

    if (card.isReversed) {
        return `${cardName} (Reversed)`;
    }
    return cardName;
}

/**
 * Get the image path for a tarot card
 * @param {Object} card - The card object
 * @returns {string} - Path to the card image
 */
export function getCardImagePath(card) {
    if (card.type === 'major') {
        // Major Arcana: e.g., "00-thefool.png"
        const number = String(card.number).padStart(2, '0');
        const name = card.name.replace(/\s+/g, '').toLowerCase(); // Remove spaces and lowercase
        return `img/tarot/${number}-${name}.png`;
    } else {
        // Minor Arcana: e.g., "wands01.png", "cups11.png"
        const rankNumbers = {
            "Ace": "01", "Two": "02", "Three": "03", "Four": "04",
            "Five": "05", "Six": "06", "Seven": "07", "Eight": "08",
            "Nine": "09", "Ten": "10", "Page": "11", "Knight": "12",
            "Queen": "13", "King": "14"
        };
        const number = rankNumbers[card.rank];
        return `img/tarot/${card.suit.toLowerCase()}${number}.png`;
    }
}

/**
 * Get the meaning of a tarot card
 * @param {Object} card - The card object
 * @returns {Object} - { orientation: string, meaning: string }
 */
export function getCardMeaning(card) {
    if (!card) {
        return { orientation: '', meaning: '' };
    }

    if (card.isReversed) {
        return {
            orientation: 'Reversed',
            meaning: card.reversed
        };
    } else {
        return {
            orientation: 'Upright',
            meaning: card.upright
        };
    }
}
