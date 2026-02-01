/**
 * Theme Setup Module
 * Provides a single function to initialize the theme selector with animated checkbox.
 * This consolidates the repeated theme selector code from all HTML files.
 */

import {
    createThemeSelector,
    getAnimationsEnabled,
    setAnimationsEnabled
} from './theme-manager.js';
import { createSeasonalEffects } from './snowflakes.js';

// Make createSeasonalEffects available globally for the animated checkbox
window.createSeasonalEffects = createSeasonalEffects;

/**
 * Initialize the theme selector in the specified slot element.
 * Creates the theme dropdown and animated checkbox.
 * @param {string} slotId - The ID of the element to place the theme selector in (default: 'theme-slot')
 */
export function initThemeSelector(slotId = 'theme-slot') {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'theme-selector-wrapper';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'flex-end';

    // Top row: Theme label and dropdown
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'center';
    topRow.style.gap = '8px';

    const label = document.createElement('label');
    label.textContent = 'Theme:';
    label.htmlFor = 'theme-selector';

    topRow.appendChild(label);
    topRow.appendChild(createThemeSelector());
    wrapper.appendChild(topRow);

    // Bottom row: Animated checkbox
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    bottomRow.style.alignItems = 'center';
    bottomRow.style.justifyContent = 'flex-end';
    bottomRow.style.marginTop = '6px';
    bottomRow.style.gap = '5px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'animated-checkbox';
    checkbox.checked = getAnimationsEnabled();

    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = 'animated-checkbox';
    checkboxLabel.textContent = 'Animated';
    checkboxLabel.style.cursor = 'pointer';

    checkbox.addEventListener('change', (e) => {
        setAnimationsEnabled(e.target.checked);
        if (window.createSeasonalEffects) {
            window.createSeasonalEffects();
        }
    });

    bottomRow.appendChild(checkbox);
    bottomRow.appendChild(checkboxLabel);
    wrapper.appendChild(bottomRow);

    slot.appendChild(wrapper);
}

/**
 * Auto-initialize theme selector on DOMContentLoaded.
 * Call this if you want the theme selector to be set up automatically.
 */
export function autoInitThemeSelector(slotId = 'theme-slot') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initThemeSelector(slotId));
    } else {
        initThemeSelector(slotId);
    }
}
