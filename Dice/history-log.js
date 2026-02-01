/**
 * HistoryLog.js - Generic history log utilities
 *
 * Provides reusable DOM manipulation functions for managing history displays.
 * Completely domain-agnostic - works with any type of history entry.
 *
 * Separation of concerns:
 * - This module: Generic DOM manipulation (create, add, clear)
 * - Domain modules (DiceLibrary, Fate, etc.): Format domain-specific text
 * - UI layer (HTML): Get inputs, call functions, update display
 */

/**
 * Create a basic history entry element
 * @param {string} text - The text content for the entry
 * @param {string} [className='history-entry'] - Optional custom class name
 * @returns {HTMLDivElement} - The created entry element
 */
export function createHistoryEntry(text, className = 'history-entry') {
    const entry = document.createElement('div');
    entry.className = className;
    entry.textContent = text;
    return entry;
}

/**
 * Create a complex history entry with custom HTML content
 * Useful for entries with multiple child elements (like Tarot readings)
 * @param {string|HTMLElement} content - String or DOM element to insert
 * @param {string} [className='history-entry'] - Optional custom class name
 * @returns {HTMLDivElement} - The created entry element
 */
export function createComplexHistoryEntry(content, className = 'history-entry') {
    const entry = document.createElement('div');
    entry.className = className;

    if (typeof content === 'string') {
        entry.innerHTML = content;  // For HTML strings
    } else {
        entry.appendChild(content);  // For DOM elements
    }

    return entry;
}

/**
 * Add an entry to a history container (most recent first)
 * @param {HTMLElement} historyContainer - The container to add to
 * @param {HTMLElement} entryElement - The entry element to add
 * @param {Object} [options={}] - Optional configuration
 * @param {number} [options.maxEntries=100] - Maximum number of entries to keep
 * @param {boolean} [options.animate=false] - Add animation class for new entries
 */
export function addToHistory(historyContainer, entryElement, options = {}) {
    const { maxEntries = 100, animate = false } = options;

    // Add animation class if enabled
    if (animate) {
        entryElement.classList.add('history-entry-new');
    }

    // Insert at beginning (most recent first)
    historyContainer.insertBefore(entryElement, historyContainer.firstChild);

    // Enforce max entries limit
    while (historyContainer.children.length > maxEntries) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

/**
 * Add a simple text entry to history (convenience function)
 * Combines createHistoryEntry and addToHistory
 * @param {HTMLElement} historyContainer - The container to add to
 * @param {string} text - The text content
 * @param {Object} [options={}] - Optional configuration (passed to addToHistory)
 */
export function addTextToHistory(historyContainer, text, options = {}) {
    const entry = createHistoryEntry(text);
    addToHistory(historyContainer, entry, options);
}

/**
 * Clear all history entries from a container
 * @param {HTMLElement} historyContainer - The container to clear
 */
export function clearHistory(historyContainer) {
    historyContainer.innerHTML = '';
}

/**
 * Get the number of history entries in a container
 * @param {HTMLElement} historyContainer - The container to count
 * @param {string} [className='history-entry'] - The class name to count
 * @returns {number} - Number of history entries
 */
export function getHistoryCount(historyContainer, className = 'history-entry') {
    return historyContainer.getElementsByClassName(className).length;
}

/**
 * Remove a specific history entry
 * @param {HTMLElement} historyContainer - The container containing the entry
 * @param {HTMLElement} entryElement - The entry element to remove
 * @returns {boolean} - True if removed, false if not found
 */
export function removeHistoryEntry(historyContainer, entryElement) {
    if (historyContainer.contains(entryElement)) {
        historyContainer.removeChild(entryElement);
        return true;
    }
    return false;
}

/**
 * Get all history entries as an array
 * @param {HTMLElement} historyContainer - The container to get entries from
 * @param {string} [className='history-entry'] - The class name to filter by
 * @returns {HTMLElement[]} - Array of history entry elements
 */
export function getHistoryEntries(historyContainer, className = 'history-entry') {
    return Array.from(historyContainer.getElementsByClassName(className));
}
