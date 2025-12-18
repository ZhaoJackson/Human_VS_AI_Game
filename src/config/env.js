/**
 * @param {string} name
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
 * @param {string} name
 * @param {string} defaultValue
 * @returns {string}
 */
function optionalEnv(name, defaultValue = '') {
    return process.env[name] || defaultValue;
}

export const config = {
    auth0: {
        secret: requireEnv('AUTH0_SECRET'),
        issuerBaseUrl: requireEnv('AUTH0_ISSUER_BASE_URL'),
        clientId: requireEnv('AUTH0_CLIENT_ID'),
        clientSecret: requireEnv('AUTH0_CLIENT_SECRET'),
        baseUrl: requireEnv('AUTH0_BASE_URL'),
    },

    google: {
        serviceAccountEmail: requireEnv('GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL'),
        privateKey: requireEnv('GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY'),
        spreadsheetId: requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID'),
        sheetName: optionalEnv('GOOGLE_SHEETS_TAB_NAME', 'round_results'),
    },

    allowedEmailDomain: requireEnv('ALLOWED_EMAIL_DOMAIN'),

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

    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: Boolean(process.env.VERCEL),
};

if (typeof window === 'undefined') {
    console.log('Environment configuration validated successfully');
    console.log(`Environment: ${config.isProduction ? 'Production' : 'Development'}`);
    console.log(`Auth0 Base URL: ${config.auth0.baseUrl}`);
    console.log(`Allowed Domain: @${config.allowedEmailDomain}`);
}