/**
 * @returns {boolean}
 */
export function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/**
 * @param {string} returnTo
 * @returns {Window|null}
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
 * @param {string} returnTo
 * @param {Function} onSuccess
 * @param {Function} onError
 */
export function handleIframeAuth(returnTo = '/start', onSuccess, onError) {
    if (!isInIframe()) {
        window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
        return;
    }

    console.log('[iframe Auth] Detected iframe context, attempting popup...');

    let parentUrl = null;
    try {
        parentUrl = window.parent.location.href;
        console.log('[iframe Auth] Parent URL accessible:', parentUrl);
    } catch (e) {
        console.log('[iframe Auth] Parent URL not accessible (cross-origin)');
    }

    const popup = openAuthPopup(returnTo);

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.warn('[iframe Auth] Popup blocked or failed to open');
        const userMessage =
            'Popup was blocked by your browser.\n\n' +
            'To sign in, please:\n' +
            '1. Allow popups for this site, OR\n' +
            '2. Click OK to open sign-in in a new tab\n\n' +
            'After signing in, you can close the new tab and return here.';

        const userWantsNewTab = confirm(userMessage);

        if (userWantsNewTab) {
            const newTab = window.open(
                `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}&inIframe=true`,
                '_blank'
            );

            if (newTab) {
                console.log('[iframe Auth] Opened in new tab');
                sessionStorage.setItem('authInProgress', 'true');

                const checkAuth = setInterval(() => {
                    if (sessionStorage.getItem('authCompleted') === 'true') {
                        clearInterval(checkAuth);
                        sessionStorage.removeItem('authCompleted');
                        sessionStorage.removeItem('authInProgress');
                        window.location.reload();
                    }
                }, 1000);

                setTimeout(() => clearInterval(checkAuth), 10 * 60 * 1000);
            } else {
                console.error('[iframe Auth] Failed to open new tab');
                if (onError) onError(new Error('Could not open authentication window'));
            }
        }
        return;
    }

    console.log('[iframe Auth] Popup opened successfully');

    const checkPopup = setInterval(() => {
        try {
            if (popup.closed) {
                clearInterval(checkPopup);
                console.log('[iframe Auth] Popup closed, reloading iframe...');
                window.location.reload();
            }
        } catch (e) {
            clearInterval(checkPopup);
        }
    }, 500);

    const messageHandler = (event) => {
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

    setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        if (popup && !popup.closed) {
            popup.close();
        }
    }, 5 * 60 * 1000);
}

/**
 * @returns {string|null}
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
