/**
 * Theme Initialization Script
 *
 * This script runs immediately in the <head> to apply the saved theme
 * before the page renders, preventing a flash of unstyled content (FOUC).
 *
 * It's loaded as a regular script (not a module) so it executes synchronously.
 */
(function() {
    const theme = localStorage.getItem('dice-roller-theme') || 'autumn';
    if (theme) {
        document.documentElement.classList.add(theme + '-theme');
    }
})();
