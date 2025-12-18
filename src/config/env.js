/**
 * Environment Configuration & Validation
 * 
 * This module validates and exports all required environment variables.
 * It will throw an error at startup if any required variables are missing,
 * preventing runtime errors.
 */

/**
 * Helper function to require an environment variable
 * @param {string} name - Environment variable name
 * @returns {string} The environment variable value
 * @throws {Error} If the environment variable is not set
 */
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `❌ Missing required environment variable: ${name}\n` +
            `   Please add it to your .env.local file.\n` +
            `   See .env.local.example for reference.`
        );
    }
    return value;
}

/**
 * Optional environment variable with fallback
 * @param {string} name - Environment variable name  
 * @param {string} defaultValue - Default value if not set
 * @returns {string} The environment variable value or default
 */
function optionalEnv(name, defaultValue = '') {
    return process.env[name] || defaultValue;
}

/**
 * Application configuration
 * Validates all required environment variables on import
 */
export const config = {
    // Auth0 Configuration
    auth0: {
        secret: requireEnv('AUTH0_SECRET'),
        issuerBaseUrl: requireEnv('AUTH0_ISSUER_BASE_URL'),
        clientId: requireEnv('AUTH0_CLIENT_ID'),
        clientSecret: requireEnv('AUTH0_CLIENT_SECRET'),
        baseUrl: requireEnv('AUTH0_BASE_URL'), // http://localhost:3000 or production URL
    },

    // Google Sheets Configuration
    google: {
        serviceAccountEmail: requireEnv('GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL'),
        privateKey: requireEnv('GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY'),
        spreadsheetId: requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID'),
        sheetName: optionalEnv('GOOGLE_SHEETS_TAB_NAME', 'round_results'),
    },

    // Access Control
    allowedEmailDomain: requireEnv('ALLOWED_EMAIL_DOMAIN'), // e.g., 'columbia.edu'

    // Optional: Feedback Form Configuration
    feedbackForm: {
        url: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_URL'),
        fields: {
            firstName: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_FIRST_NAME_FIELD'),
            lastName: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_LAST_NAME_FIELD'),
            uni: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_UNI_FIELD'),
            category: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_CATEGORY_FIELD'),
            roundId: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_ROUND_ID_FIELD'),
            reflection: optionalEnv('NEXT_PUBLIC_FEEDBACK_FORM_REFLECTION_FIELD'),
        },
    },

    // Runtime Environment
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: Boolean(process.env.VERCEL),
};

// Validate configuration on import (throws if invalid)
// This ensures the app never runs with missing configuration
if (typeof window === 'undefined') {
    // Only run validation on server-side
    console.log('✅ Environment configuration validated successfully');
    console.log(`   Environment: ${config.isProduction ? 'Production' : 'Development'}`);
    console.log(`   Auth0 Base URL: ${config.auth0.baseUrl}`);
    console.log(`   Allowed Domain: @${config.allowedEmailDomain}`);
}
