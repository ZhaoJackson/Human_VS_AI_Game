/**
 * Utility functions for detecting iframe context and handling authentication in iframes
 */

/**
 * Detects if the application is running inside an iframe
 * @returns {boolean} True if running in iframe, false otherwise
 */
export function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        // If we can't access window.top due to cross-origin, we're definitely in an iframe
        return true;
    }
}

/**
 * Opens Auth0 login in a popup window (for iframe contexts)
 * @param {string} returnTo - The path to return to after authentication
 * @returns {Window|null} The popup window reference
 */
export function openAuthPopup(returnTo = '/start') {
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
        `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
        'auth0-login',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    return popup;
}

/**
 * Handles authentication in iframe context
 * Opens popup and listens for authentication completion
 * @param {string} returnTo - The path to return to after authentication
 * @param {Function} onSuccess - Callback function when authentication succeeds
 * @param {Function} onError - Callback function when authentication fails
 */
export function handleIframeAuth(returnTo = '/start', onSuccess, onError) {
    if (!isInIframe()) {
        // Not in iframe, use normal redirect
        window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
        return;
    }

    // Open popup for authentication
    const popup = openAuthPopup(returnTo);

    if (!popup) {
        console.error('Popup blocked. Please allow popups for this site.');
        if (onError) onError(new Error('Popup blocked'));
        return;
    }

    // Poll for popup closure or listen for message from popup
    const checkPopup = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkPopup);
            // Reload the iframe to check authentication status
            window.location.reload();
        }
    }, 500);

    // Listen for authentication messages from popup
    const messageHandler = (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data.type === 'auth-success') {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            popup.close();
            if (onSuccess) onSuccess(event.data.user);
            // Reload to update authentication state
            window.location.reload();
        } else if (event.data.type === 'auth-error') {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            popup.close();
            if (onError) onError(new Error(event.data.error));
        }
    };

    window.addEventListener('message', messageHandler);

    // Cleanup after 5 minutes
    setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) {
            popup.close();
        }
    }, 5 * 60 * 1000);
}

/**
 * Gets the parent window URL if in iframe (for allowed origins check)
 * @returns {string|null} Parent URL or null if not accessible
 */
export function getParentUrl() {
    try {
        return window.parent.location.href;
    } catch (e) {
        // Cross-origin restriction
        return null;
    }
}
