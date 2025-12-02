/**
 * Snowflakes.js
 * Creates animated seasonal effects for different themes
 */

import { getAnimationsEnabled } from './theme-manager.js';

/**
 * Creates seasonal effects based on current theme
 */
function createSeasonalEffects() {
    // Remove any existing effects container
    const existingContainer = document.getElementById('seasonal-effects-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Check if animations are enabled
    if (!getAnimationsEnabled()) {
        return; // Don't create effects if animations are disabled
    }

    // Determine current theme
    const htmlElement = document.documentElement;

    if (htmlElement.classList.contains('winter-theme')) {
        createWinterSnowflakes();
    } else if (htmlElement.classList.contains('autumn-theme')) {
        createAutumnLeaves();
    } else if (htmlElement.classList.contains('spring-theme')) {
        createSpringRain();
    } else if (htmlElement.classList.contains('stars-theme')) {
        createStars();
    }
    // Summer, Light, and Dark themes have no effects
}

/**
 * Creates the container for seasonal effects
 */
function createEffectsContainer() {
    // Guard: make sure body exists
    if (!document.body) {
        console.warn('createEffectsContainer called but document.body does not exist yet');
        return null;
    }

    const container = document.createElement('div');
    container.id = 'seasonal-effects-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
    document.body.appendChild(container);
    return container;
}

/**
 * Creates winter snowflakes
 */
function createWinterSnowflakes() {
    const container = createEffectsContainer();
    if (!container) return; // Body doesn't exist yet

    const snowflakeCount = 30;

    for (let i = 0; i < snowflakeCount; i++) {
        const element = document.createElement('div');
        element.className = 'seasonal-effect snowflake';
        element.textContent = '❄';

        // Random properties
        const startPositionX = Math.random() * 100;
        const duration = 15 + Math.random() * 20;
        const delay = Math.random() * -30;
        const size = 0.8 + Math.random() * 1.2;
        const opacity = 0.33 + Math.random() * 0.33;
        const drift = -30 + Math.random() * 60;
        const rotation = Math.random() * 360;
        const rotationSpeed = 180 + Math.random() * 360;

        element.style.cssText = `
            position: absolute;
            top: -50px;
            left: ${startPositionX}vw;
            font-size: ${size}em;
            opacity: ${opacity};
            color: rgba(255, 255, 255, 0.95);
            animation: snowfall-${Math.floor(Math.random() * 3)} ${duration}s linear infinite;
            animation-delay: ${delay}s;
            user-select: none;
            transform: rotate(${rotation}deg);
        `;

        element.style.setProperty('--drift', `${drift}px`);
        element.style.setProperty('--rotation', `${rotationSpeed}deg`);

        container.appendChild(element);
    }
}

/**
 * Creates autumn falling leaves
 */
function createAutumnLeaves() {
    const container = createEffectsContainer();
    if (!container) return; // Body doesn't exist yet

    const leafCount = 20;
    const leafTypes = ['🍂', '🍃'];

    for (let i = 0; i < leafCount; i++) {
        const element = document.createElement('div');
        element.className = 'seasonal-effect autumn-leaf';
        element.textContent = leafTypes[Math.floor(Math.random() * leafTypes.length)];

        const startPositionX = Math.random() * 100;
        const duration = 10 + Math.random() * 15;
        const delay = Math.random() * -20;
        const size = 0.9 + Math.random() * 1.1;
        const opacity = 0.4 + Math.random() * 0.3;
        const sway = 40 + Math.random() * 40; // How far to sway
        const rotation = Math.random() * 360;
        const rotationSpeed = 180 + Math.random() * 540;

        element.style.cssText = `
            position: absolute;
            top: -50px;
            left: ${startPositionX}vw;
            font-size: ${size}em;
            opacity: ${opacity};
            animation: leaffall-${Math.floor(Math.random() * 2)} ${duration}s ease-in-out infinite;
            animation-delay: ${delay}s;
            user-select: none;
            transform: rotate(${rotation}deg);
        `;

        element.style.setProperty('--sway', `${sway}px`);
        element.style.setProperty('--rotation', `${rotationSpeed}deg`);

        container.appendChild(element);
    }
}

/**
 * Creates spring rain
 */
function createSpringRain() {
    const container = createEffectsContainer();
    if (!container) return; // Body doesn't exist yet

    const dropCount = 40;

    for (let i = 0; i < dropCount; i++) {
        const element = document.createElement('div');
        element.className = 'seasonal-effect raindrop';
        element.textContent = '💧';

        const startPositionX = Math.random() * 100;
        const duration = 1 + Math.random() * 2; // Faster fall for rain
        const delay = Math.random() * -5;
        const size = 0.6 + Math.random() * 0.6;
        const opacity = 0.35 + Math.random() * 0.3;

        element.style.cssText = `
            position: absolute;
            top: -50px;
            left: ${startPositionX}vw;
            font-size: ${size}em;
            opacity: ${opacity};
            animation: rainfall ${duration}s linear infinite;
            animation-delay: ${delay}s;
            user-select: none;
        `;

        container.appendChild(element);
    }
}

/**
 * Creates twinkling stars for the stars theme
 * Uses a grid-based approach for more even distribution
 */
function createStars() {
    const container = createEffectsContainer();
    if (!container) return; // Body doesn't exist yet

    const starCount = 120;
    const gridCols = 12;
    const gridRows = 10;
    const cellWidth = 100 / gridCols;
    const cellHeight = 85 / gridRows; // Spread across top 85% of screen

    // Create array of all grid cells
    const cells = [];
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            cells.push({ row, col });
        }
    }

    // Shuffle cells to randomize which ones get stars
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // Place stars in first starCount cells
    for (let i = 0; i < Math.min(starCount, cells.length); i++) {
        const cell = cells[i];
        const element = document.createElement('div');
        element.className = 'seasonal-effect star';
        element.textContent = '⭐';

        // Random position within the cell (with some padding from edges)
        const padding = 0.15; // 15% padding within each cell
        const startPositionX = cell.col * cellWidth + cellWidth * (padding + Math.random() * (1 - 2 * padding));
        const startPositionY = cell.row * cellHeight + cellHeight * (padding + Math.random() * (1 - 2 * padding));

        const duration = 2 + Math.random() * 4; // 2-6 seconds twinkle cycle
        const delay = Math.random() * -6; // Stagger the start
        const size = 0.5 + Math.random() * 0.6; // Smaller size range: 0.5-1.1em
        const opacity = 0.4 + Math.random() * 0.6; // Base opacity 0.4-1.0

        element.style.cssText = `
            position: absolute;
            top: ${startPositionY}vh;
            left: ${startPositionX}vw;
            font-size: ${size}em;
            opacity: ${opacity};
            color: rgba(255, 255, 200, 0.95);
            animation: startwinkle-${Math.floor(Math.random() * 3)} ${duration}s ease-in-out infinite;
            animation-delay: ${delay}s;
            user-select: none;
            pointer-events: none;
        `;

        element.style.setProperty('--opacity', opacity);

        container.appendChild(element);
    }
}

// Initialize effects when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSeasonalEffects);
} else {
    createSeasonalEffects();
}

// Export for ThemeManager to call when theme changes
export { createSeasonalEffects };
