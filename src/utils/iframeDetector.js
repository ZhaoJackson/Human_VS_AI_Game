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
 * If popup is blocked, asks user for permission to open in new tab
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

    console.log('[iframe Auth] Detected iframe context, attempting popup...');

    // Try to get parent URL to return to after auth
    let parentUrl = null;
    try {
        parentUrl = window.parent.location.href;
        console.log('[iframe Auth] Parent URL accessible:', parentUrl);
    } catch (e) {
        // Cross-origin, can't access parent URL
        console.log('[iframe Auth] Parent URL not accessible (cross-origin)');
    }

    // Attempt to open popup
    const popup = openAuthPopup(returnTo);

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.warn('[iframe Auth] Popup blocked or failed to open');

        // Popup was blocked - show user message and provide manual option
        const userMessage =
            'Popup was blocked by your browser.\n\n' +
            'To sign in, please:\n' +
            '1. Allow popups for this site, OR\n' +
            '2. Click OK to open sign-in in a new tab\n\n' +
            'After signing in, you can close the new tab and return here.';

        const userWantsNewTab = confirm(userMessage);

        if (userWantsNewTab) {
            // Open in new tab
            const newTab = window.open(
                `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}&inIframe=true`,
                '_blank'
            );

            if (newTab) {
                console.log('[iframe Auth] Opened in new tab');
                // Set a flag so we can detect when to refresh the iframe
                sessionStorage.setItem('authInProgress', 'true');

                // Check periodically if user has authenticated
                const checkAuth = setInterval(() => {
                    // This will be checked when the user comes back
                    if (sessionStorage.getItem('authCompleted') === 'true') {
                        clearInterval(checkAuth);
                        sessionStorage.removeItem('authCompleted');
                        sessionStorage.removeItem('authInProgress');
                        window.location.reload();
                    }
                }, 1000);

                // Clean up after 10 minutes
                setTimeout(() => clearInterval(checkAuth), 10 * 60 * 1000);
            } else {
                console.error('[iframe Auth] Failed to open new tab');
                if (onError) onError(new Error('Could not open authentication window'));
            }
        }
        return;
    }

    console.log('[iframe Auth] Popup opened successfully');

    // Poll for popup closure
    const checkPopup = setInterval(() => {
        try {
            if (popup.closed) {
                clearInterval(checkPopup);
                console.log('[iframe Auth] Popup closed, reloading iframe...');
                // Reload the iframe to check authentication status
                window.location.reload();
            }
        } catch (e) {
            // Popup might be on a different origin, can't check if closed
            clearInterval(checkPopup);
        }
    }, 500);

    // Listen for authentication messages from popup
    const messageHandler = (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data.type === 'auth-success') {
            console.log('[iframe Auth] Received auth success message');
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            if (popup && !popup.closed) {
                popup.close();
            }
            if (onSuccess) onSuccess(event.data.user);
            // Reload to update authentication state
            window.location.reload();
        } else if (event.data.type === 'auth-error') {
            console.error('[iframe Auth] Received auth error message');
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            if (popup && !popup.closed) {
                popup.close();
            }
            if (onError) onError(new Error(event.data.error));
        }
    };

    window.addEventListener('message', messageHandler);

    // Cleanup after 5 minutes
    setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        if (popup && !popup.closed) {
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

/**
 * Mark authentication as completed (called after auth callback)
 * This helps the iframe detect when user has authenticated in a new tab
 */
export function markAuthCompleted() {
    sessionStorage.setItem('authCompleted', 'true');
    // Try to close the window if it was opened as a popup/tab
    if (window.opener) {
        window.close();
    }
}
