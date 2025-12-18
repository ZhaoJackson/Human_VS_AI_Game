/**
 * Auth0 configuration for iframe-compatible authentication
 * Configures session cookies to work in cross-origin iframe contexts
 */

module.exports = {
    session: {
        cookie: {
            // Required for cross-origin iframe contexts
            sameSite: 'none',
            // Must be true when sameSite is 'none'
            secure: true,
            // Prevents JavaScript access to cookies
            httpOnly: true,
            // Cookie expiration (7 days)
            maxAge: 7 * 24 * 60 * 60,
        },
        // Store session for 7 days
        absoluteDuration: 7 * 24 * 60 * 60,
        rolling: true,
        rollingDuration: 24 * 60 * 60, // Renew for 24h on activity
    },
};
