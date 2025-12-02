/**
 * ThemeManager.js
 * Handles theme switching and persistence across all pages
 */

// Available themes
const THEMES = {
    AUTUMN: 'autumn',
    LIGHT: 'light',
    DARK: 'dark',
    WINTER: 'winter',
    SPRING: 'spring',
    SUMMER: 'summer',
    STARS: 'stars',
    GOTHIC: 'gothic',
    CTHULHU: 'cthulhu',
    BEACH: 'beach'
};

// Default theme
const DEFAULT_THEME = THEMES.AUTUMN;

// LocalStorage keys
const STORAGE_KEY = 'dice-roller-theme';
const ANIMATION_KEY = 'dice-roller-animations';

/**
 * Gets the current theme from localStorage or returns default
 */
function getCurrentTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return savedTheme || DEFAULT_THEME;
}

/**
 * Gets the animation preference from localStorage
 * @returns {boolean} True if animations are enabled (default: true)
 */
function getAnimationsEnabled() {
    const saved = localStorage.getItem(ANIMATION_KEY);
    return saved === null ? true : saved === 'true';
}

/**
 * Sets the animation preference in localStorage
 * @param {boolean} enabled - Whether animations should be enabled
 */
function setAnimationsEnabled(enabled) {
    localStorage.setItem(ANIMATION_KEY, enabled.toString());
}

/**
 * Applies a theme to the document element
 * @param {string} theme - The theme name to apply
 */
function applyTheme(theme) {
    // Apply to html element (works even before body exists)
    const htmlElement = document.documentElement;

    // Remove all theme classes from both html and body
    Object.values(THEMES).forEach(t => {
        htmlElement.classList.remove(`${t}-theme`);
        if (document.body) {
            document.body.classList.remove(`${t}-theme`);
        }
    });

    // Apply new theme class
    htmlElement.classList.add(`${theme}-theme`);

    // Trigger seasonal effects update
    // Delay to ensure DOM is ready
    setTimeout(() => {
        import('./Snowflakes.js').then(module => {
            module.createSeasonalEffects();
        });
    }, 100);
}

/**
 * Sets a theme and persists it to localStorage
 * @param {string} theme - The theme name to set
 */
function setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
        console.warn(`Invalid theme: ${theme}. Using default.`);
        theme = DEFAULT_THEME;
    }

    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
}

/**
 * Initializes the theme system
 * Should be called as early as possible to prevent flash of unstyled content
 */
function initializeTheme() {
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
}

/**
 * Creates and returns a theme selector dropdown element
 * @returns {HTMLSelectElement} The theme selector dropdown
 */
function createThemeSelector() {
    const currentTheme = getCurrentTheme();

    const select = document.createElement('select');
    select.id = 'theme-selector';
    select.className = 'theme-selector';

    // Add options in seasonal order: Autumn, Winter, Spring, Summer, then themed options, Light/Dark
    const options = [
        { value: THEMES.AUTUMN, label: 'Autumn' },
        { value: THEMES.WINTER, label: 'Winter' },
        { value: THEMES.SPRING, label: 'Spring' },
        { value: THEMES.SUMMER, label: 'Summer' },
        { value: THEMES.STARS, label: 'Stars' },
        { value: THEMES.GOTHIC, label: 'Gothic' },
        { value: THEMES.CTHULHU, label: 'Cthulhu' },
        { value: THEMES.BEACH, label: 'Beach' },
        { value: THEMES.LIGHT, label: 'Light' },
        { value: THEMES.DARK, label: 'Dark' }
    ];

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        if (option.value === currentTheme) {
            optionElement.selected = true;
        }
        select.appendChild(optionElement);
    });

    // Add event listener
    select.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });

    return select;
}

/**
 * Adds the theme selector to the page
 * Call this after DOM content is loaded
 */
function addThemeSelector() {
    // Try to find the header element
    const header = document.querySelector('.header');

    if (header) {
        // Check if there's already a header-top-row, if not create one
        let topRow = header.querySelector('.header-top-row');
        if (!topRow) {
            topRow = document.createElement('div');
            topRow.className = 'header-top-row';

            // Find the close button if it exists and move it to top row
            const closeButton = header.querySelector('.close-button');

            // Insert top row at the beginning of header
            header.insertBefore(topRow, header.firstChild);

            // Move close button to top row if it exists
            if (closeButton) {
                topRow.appendChild(closeButton);
            }
        }

        // Create a wrapper for the theme selector
        const wrapper = document.createElement('div');
        wrapper.className = 'theme-selector-wrapper';

        const label = document.createElement('label');
        label.textContent = 'Theme: ';
        label.htmlFor = 'theme-selector';
        label.style.marginRight = '8px';

        const selector = createThemeSelector();

        wrapper.appendChild(label);
        wrapper.appendChild(selector);

        // Add animated checkbox
        const animatedCheckbox = document.createElement('input');
        animatedCheckbox.type = 'checkbox';
        animatedCheckbox.id = 'animated-checkbox';
        animatedCheckbox.checked = getAnimationsEnabled();
        animatedCheckbox.style.marginLeft = '15px';

        const animatedLabel = document.createElement('label');
        animatedLabel.htmlFor = 'animated-checkbox';
        animatedLabel.textContent = 'Animated';
        animatedLabel.style.marginLeft = '5px';
        animatedLabel.style.cursor = 'pointer';

        // Add event listener for checkbox
        animatedCheckbox.addEventListener('change', (e) => {
            setAnimationsEnabled(e.target.checked);
            // Trigger seasonal effects update
            if (window.createSeasonalEffects) {
                window.createSeasonalEffects();
            }
        });

        wrapper.appendChild(animatedCheckbox);
        wrapper.appendChild(animatedLabel);

        // Insert at the beginning of the top row
        topRow.insertBefore(wrapper, topRow.firstChild);
    } else {
        console.warn('Could not find .header element to add theme selector');
    }
}

// Export for ES modules
export {
    THEMES,
    DEFAULT_THEME,
    getCurrentTheme,
    setTheme,
    initializeTheme,
    createThemeSelector,
    addThemeSelector,
    getAnimationsEnabled,
    setAnimationsEnabled
};
