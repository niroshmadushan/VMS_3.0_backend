/**
 * UUID Helper - Works in both browser and Node.js environments
 * Provides a fallback if crypto.randomUUID() is not available
 */

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
function generateUUID() {
    // Try to use crypto.randomUUID() if available (Node.js 15.6+ or modern browsers with HTTPS)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (error) {
            // Fall through to fallback method
        }
    }

    // Fallback: Generate UUID v4 manually
    // This works in all environments (browser, Node.js, HTTP, HTTPS)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateUUID };
}

// Also make it available globally for browser scripts
if (typeof window !== 'undefined') {
    window.generateUUID = generateUUID;
}

