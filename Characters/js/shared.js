/**
 * CharacterSheets - Shared Utilities
 * System-agnostic utilities for all character sheets
 * @module shared
 */

// ============================================================================
// Constants
// ============================================================================

/** Default autosave delay in milliseconds */
export const AUTOSAVE_DELAY = 1000;

/** Status message display duration in milliseconds */
export const STATUS_DURATION = 2000;

// ============================================================================
// Autosave & Persistence
// ============================================================================

/**
 * Creates a debounced autosave function with beforeunload protection
 * @param {Function} saveFn - The save function to call
 * @param {number} delay - Debounce delay in ms (default: 1000)
 * @returns {Object} Object with { schedule, flush, cleanup } methods
 */
export function createAutosaveManager(saveFn, delay = AUTOSAVE_DELAY) {
    let timeout = null;
    let pendingSave = false;

    const flush = () => {
        if (pendingSave) {
            clearTimeout(timeout);
            saveFn();
            pendingSave = false;
        }
    };

    const beforeUnloadHandler = (e) => {
        if (pendingSave) {
            flush();
        }
    };

    // Register beforeunload handler
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return {
        /**
         * Schedule an autosave (debounced)
         */
        schedule() {
            pendingSave = true;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                saveFn();
                pendingSave = false;
            }, delay);
        },

        /**
         * Immediately flush any pending save
         */
        flush,

        /**
         * Clean up event listeners (call when unmounting)
         */
        cleanup() {
            clearTimeout(timeout);
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        }
    };
}

/**
 * Save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {Object} data - Data to save
 * @param {HTMLElement} statusEl - Optional status element for feedback
 * @returns {boolean} True if save succeeded
 */
export function saveToStorage(key, data, statusEl = null) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        if (statusEl) {
            showStatus(statusEl, 'Saved');
        }
        return true;
    } catch (e) {
        console.error('Save failed:', e);

        // Check for quota exceeded error
        const isQuotaError = e.name === 'QuotaExceededError' ||
            e.code === 22 || // Legacy Chrome
            e.code === 1014; // Legacy Firefox

        if (isQuotaError) {
            if (statusEl) {
                showStatus(statusEl, 'Storage full! Export your data.', 5000);
            }
            // Show alert for critical quota errors
            alert('Browser storage is full. Please export your character data to a file to avoid losing changes.');
        } else if (statusEl) {
            showStatus(statusEl, 'Save failed!', 3000);
        }
        return false;
    }
}

/**
 * Load data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {HTMLElement} statusEl - Optional status element for error feedback
 * @returns {Object|null} Parsed data or null if not found/invalid
 */
export function loadFromStorage(key, statusEl = null) {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse stored data:', e);
        if (statusEl) {
            showStatus(statusEl, 'Failed to load saved data', 3000);
        }
        return null;
    }
}

/**
 * Clear data from localStorage
 * @param {string} key - Storage key
 */
export function clearStorage(key) {
    localStorage.removeItem(key);
}

// ============================================================================
// Status Messages
// ============================================================================

/**
 * Show a status message that auto-clears
 * @param {HTMLElement} statusEl - Status element
 * @param {string} message - Message to show
 * @param {number} duration - Duration in ms (default: 2000)
 */
export function showStatus(statusEl, message = 'Saved', duration = STATUS_DURATION) {
    if (!statusEl) return;
    statusEl.textContent = message;
    setTimeout(() => {
        statusEl.textContent = '';
    }, duration);
}

// ============================================================================
// File Export/Import
// ============================================================================

/**
 * Sanitize a string for use as a filename
 * @param {string} name - Raw name
 * @returns {string} Sanitized filename-safe string
 */
export function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'character';
}

/**
 * Download data as a JSON file
 * @param {Object} data - Data to download
 * @param {string} systemName - System name (e.g., 'FATE', 'Blades')
 * @param {string} characterName - Character or group name
 */
export function downloadJSON(data, systemName, characterName) {
    const safeName = sanitizeFilename(characterName);
    const filename = `${systemName} - ${safeName}.char.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

/**
 * Read a JSON file and parse its contents
 * @param {File} file - File object to read
 * @returns {Promise<Object>} Parsed JSON data
 */
export function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (err) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Validate imported data has expected structure
 * @param {Object} data - Data to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateImportData(data, requiredFields = []) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid data format' };
    }

    if (Array.isArray(data)) {
        return { valid: false, error: 'Expected object, got array' };
    }

    for (const field of requiredFields) {
        if (!(field in data)) {
            return { valid: false, error: `Missing required field: ${field}` };
        }
    }

    return { valid: true };
}

/**
 * Setup file load button to trigger hidden file input
 * @param {HTMLElement} button - The visible button
 * @param {HTMLInputElement} fileInput - The hidden file input
 * @param {Function} onLoad - Callback with parsed data
 * @param {HTMLElement} statusEl - Optional status element for errors
 * @param {Object} options - Optional configuration
 * @param {string[]} options.requiredFields - Fields to validate on import
 */
export function setupFileLoader(button, fileInput, onLoad, statusEl = null, options = {}) {
    if (!button || !fileInput) return;

    button.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        if (!e.target.files[0]) return;

        try {
            const data = await readJSONFile(e.target.files[0]);

            // Validate if required fields specified
            if (options.requiredFields) {
                const validation = validateImportData(data, options.requiredFields);
                if (!validation.valid) {
                    throw new Error(validation.error);
                }
            }

            onLoad(data);
        } catch (err) {
            console.error('Load failed:', err);
            if (statusEl) {
                showStatus(statusEl, 'Failed to load file', 3000);
            } else {
                alert('Failed to load file: ' + err.message);
            }
        }

        // Reset input so same file can be selected again
        e.target.value = '';
    });
}

// ============================================================================
// Dynamic Row Management
// ============================================================================

/**
 * Manage dynamic rows - ensures exactly one empty row at the end
 * @param {HTMLElement} container - Container element
 * @param {string} rowSelector - CSS selector for rows
 * @param {Function} isEmptyFn - Function(row) that returns true if row is empty
 * @param {Function} createRowFn - Function that creates and returns a new row
 */
export function manageDynamicRows(container, rowSelector, isEmptyFn, createRowFn) {
    if (!container) return;

    const rows = Array.from(container.querySelectorAll(rowSelector));

    // If no rows exist, create one
    if (rows.length === 0) {
        container.appendChild(createRowFn());
        return;
    }

    // Count trailing empty rows
    let trailingEmpty = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
        if (isEmptyFn(rows[i])) {
            trailingEmpty++;
        } else {
            break;
        }
    }

    // Ensure exactly one empty row at end
    if (trailingEmpty === 0) {
        container.appendChild(createRowFn());
    } else if (trailingEmpty > 1 && rows.length > 1) {
        rows[rows.length - 1].remove();
    }
}

// ============================================================================
// Clickable Tracks (Pips/Boxes)
// ============================================================================

/**
 * Get the fill count from a track container
 * @param {HTMLElement} container - Container with b/i elements
 * @returns {number} Number of filled elements
 */
export function getTrackValue(container) {
    if (!container) return 0;
    let value = 0;
    container.querySelectorAll('b, i').forEach((box, i) => {
        if (box.classList.contains('filled')) value = i + 1;
    });
    return value;
}

/**
 * Set the fill count on a track container
 * @param {HTMLElement} container - Container with b/i elements
 * @param {number} value - Number of elements to fill
 */
export function setTrackValue(container, value) {
    if (!container) return;
    container.querySelectorAll('b, i').forEach((box, i) => {
        box.classList.toggle('filled', i < value);
    });
}

/**
 * Setup sequential fill click handler for a track
 * Clicking a box fills up to that box; clicking the highest filled clears all
 * @param {HTMLElement} container - Container with b/i elements
 * @param {Function} onChange - Optional callback when value changes
 * @param {Object} options - Optional configuration
 * @param {string} options.label - ARIA label for the track
 * @param {number} options.max - Maximum value (defaults to box count)
 */
export function setupSequentialTrack(container, onChange = null, options = {}) {
    if (!container) return;

    const boxes = container.querySelectorAll('b, i');
    const max = options.max || boxes.length;
    const label = options.label || container.dataset.label || 'Rating';

    // Setup ARIA attributes on container
    container.setAttribute('role', 'slider');
    container.setAttribute('aria-valuemin', '0');
    container.setAttribute('aria-valuemax', String(max));
    container.setAttribute('aria-valuenow', String(getTrackValue(container)));
    container.setAttribute('aria-label', label);
    container.setAttribute('tabindex', '0');

    // Update ARIA when value changes
    const updateAria = () => {
        container.setAttribute('aria-valuenow', String(getTrackValue(container)));
    };

    // Click handler for boxes
    boxes.forEach((box, idx) => {
        box.addEventListener('click', () => {
            const filled = getTrackValue(container);
            if (filled === idx + 1) {
                // Clicking highest filled clears all
                setTrackValue(container, 0);
            } else {
                // Fill up to clicked
                setTrackValue(container, idx + 1);
            }
            updateAria();
            if (onChange) onChange(getTrackValue(container));
        });
    });

    // Keyboard navigation
    container.addEventListener('keydown', (e) => {
        const current = getTrackValue(container);
        let newValue = current;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                newValue = Math.min(current + 1, max);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                newValue = Math.max(current - 1, 0);
                break;
            case 'Home':
                e.preventDefault();
                newValue = 0;
                break;
            case 'End':
                e.preventDefault();
                newValue = max;
                break;
            default:
                return;
        }

        if (newValue !== current) {
            setTrackValue(container, newValue);
            updateAria();
            if (onChange) onChange(newValue);
        }
    });
}

/**
 * Setup individual toggle click handler for stress boxes (FATE Core style)
 * Each box toggles independently
 * @param {HTMLElement} container - Container with b elements
 * @param {Function} onChange - Optional callback when any box changes
 * @param {Object} options - Optional configuration
 * @param {string} options.label - Base label for the track
 */
export function setupIndividualToggleTrack(container, onChange = null, options = {}) {
    if (!container) return;

    const label = options.label || container.dataset.label || 'Stress';

    // Setup container as a group
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', label);

    container.querySelectorAll('b').forEach((box, idx) => {
        // Each box is a checkbox
        box.setAttribute('role', 'checkbox');
        box.setAttribute('aria-checked', box.classList.contains('filled') ? 'true' : 'false');
        box.setAttribute('aria-label', `${label} ${box.textContent || idx + 1}`);
        box.setAttribute('tabindex', '0');

        box.addEventListener('click', () => {
            box.classList.toggle('filled');
            box.setAttribute('aria-checked', box.classList.contains('filled') ? 'true' : 'false');
            if (onChange) onChange();
        });

        // Keyboard: Enter/Space to toggle
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                box.click();
            }
        });
    });
}

/**
 * Get filled indices from a track (for individual toggle mode)
 * @param {HTMLElement} container - Container with b elements
 * @returns {number[]} Array of filled box indices
 */
export function getFilledIndices(container) {
    if (!container) return [];
    const indices = [];
    container.querySelectorAll('b').forEach((box, i) => {
        if (box.classList.contains('filled')) indices.push(i);
    });
    return indices;
}

/**
 * Set filled boxes by indices (for individual toggle mode)
 * @param {HTMLElement} container - Container with b elements
 * @param {number[]} indices - Array of indices to fill
 */
export function setFilledIndices(container, indices) {
    if (!container) return;
    container.querySelectorAll('b').forEach((box, i) => {
        box.classList.toggle('filled', indices.includes(i));
    });
}

// ============================================================================
// Popup Utilities
// ============================================================================

/**
 * Create a popup overlay with proper cleanup
 * @param {Object} options - Configuration options
 * @param {Function} options.createContent - Function(popup) to create popup content
 * @param {string} options.popupClass - CSS class for popup (default: 'dice-popup')
 * @param {string} options.overlayClass - CSS class for overlay (default: 'dice-popup-overlay')
 * @returns {HTMLElement} The overlay element
 */
export function createPopup({ createContent, popupClass = 'dice-popup', overlayClass = 'dice-popup-overlay' }) {
    const overlay = document.createElement('div');
    overlay.className = overlayClass;

    const popup = document.createElement('div');
    popup.className = popupClass;

    // Track escape handler for cleanup
    let escHandler = null;

    // Close function that properly cleans up
    const close = () => {
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
        }
        overlay.remove();
    };

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    // Escape key to close
    escHandler = (e) => {
        if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', escHandler);

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'dice-popup-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close (Escape)';
    closeBtn.addEventListener('click', close);
    popup.appendChild(closeBtn);

    // Let caller populate the popup
    createContent(popup, close);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    return overlay;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID
 * @param {string} prefix - ID prefix (default: 'id')
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Session Storage Transfer (for page navigation)
// ============================================================================

/**
 * Store data for transfer between pages
 * @param {string} key - Storage key
 * @param {Object} data - Data to store
 */
export function storeForTransfer(key, data) {
    sessionStorage.setItem(key, JSON.stringify(data));
}

/**
 * Retrieve and clear transferred data
 * @param {string} key - Storage key
 * @returns {Object|null} Stored data or null
 */
export function getTransferredData(key) {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;

    sessionStorage.removeItem(key);
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse transferred data:', e);
        return null;
    }
}

// ============================================================================
// DOM Utilities
// ============================================================================

/**
 * Safely get element value with fallback
 * @param {string} id - Element ID
 * @param {*} fallback - Fallback value if element not found
 * @returns {string} Element value or fallback
 */
export function getInputValue(id, fallback = '') {
    const el = document.getElementById(id);
    return el?.value ?? fallback;
}

/**
 * Safely set element value
 * @param {string} id - Element ID
 * @param {string} value - Value to set
 */
export function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

/**
 * Get numeric value from element
 * @param {string} id - Element ID
 * @param {number} fallback - Fallback value
 * @returns {number} Parsed number or fallback
 */
export function getNumericValue(id, fallback = 0) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const val = parseInt(el.value || el.textContent, 10);
    return isNaN(val) ? fallback : val;
}

/**
 * Set text content of an element
 * @param {string} id - Element ID
 * @param {string} text - Text to set
 */
export function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ============================================================================
// Accessibility
// ============================================================================

/**
 * Add aria-label to inputs that only have placeholder text.
 * Call this on page init for accessibility compliance.
 * @param {Element} container - Container to search within (default: document)
 */
export function addAccessibilityLabels(container = document) {
    container.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
        if (!input.getAttribute('aria-label') && !input.id) {
            input.setAttribute('aria-label', input.placeholder);
        } else if (!input.getAttribute('aria-label') && input.id) {
            // If input has ID, check if there's already a label for it
            const existingLabel = container.querySelector(`label[for="${input.id}"]`);
            if (!existingLabel) {
                input.setAttribute('aria-label', input.placeholder);
            }
        }
    });
}
